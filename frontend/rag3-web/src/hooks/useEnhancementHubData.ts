import { useCallback, useEffect, useState } from 'react';
import {
  PAGEINDEX_DOCUMENTS as MOCK_PI_DOCS,
  PAGEINDEX_STATS as MOCK_PI_STATS,
  PAGEINDEX_TREE_V5,
  getPageIndexDoc as mockGetPiDoc,
  getPageIndexTree as mockGetPiTree,
  runMockLibrarySearch,
  runMockTreeSearch,
  type PageIndexDocument,
  type PageIndexLibrarySearchResult,
  type PageIndexSearchResult,
  type PageIndexTreeNode,
} from '../data/pageIndexMock';
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  GRAPH_SOURCE_DOCS,
  GRAPH_STATS,
  getGraphSourceDoc as mockGetGraphDoc,
  runMockGraphSearch,
  type GraphSourceDoc,
} from '../data/graphRAGMock';
import {
  WIKI_PAGES,
  WIKI_SOURCE_DOCS,
  WIKI_STATS,
  type WikiPage,
  type WikiSourceDoc,
} from '../data/wikiMock';
import { useKnowledgeBase } from './useKbData';
import { kbApi } from '../services/kbApi';
import { hubApi } from '../services/hubApi';
import { useRealApi } from '../services/http';
import { formatBytes } from '../utils/documentUtil';

function parsePageNo(raw: Record<string, unknown>): number | undefined {
  const candidates = [raw.page, raw.startPage, raw.page_index, raw.start_index];
  for (const v of candidates) {
    if (typeof v === 'number' && v > 0) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  }
  return undefined;
}

function mapTreeNode(raw: Record<string, unknown>, depth = 0): PageIndexTreeNode {
  const children = (raw.children as Record<string, unknown>[] | undefined)?.map(c => mapTreeNode(c, depth + 1));
  const hasChildren = Boolean(children?.length);
  const isLeaf = !hasChildren && Boolean(raw.chunk_id);
  const startPage = parsePageNo(raw);
  return {
    id: String(raw.node_id ?? raw.chunk_id ?? raw.id ?? ''),
    title: String(raw.title ?? '节点'),
    nodeType: depth === 0 ? 'root' : isLeaf ? 'leaf' : depth === 1 ? 'chapter' : 'section',
    startPage,
    endPage: startPage,
    summary: typeof raw.snippet === 'string' ? raw.snippet : (typeof raw.summary === 'string' ? raw.summary : undefined),
    children,
  };
}

export interface PageIndexTraceSnapshot {
  progress: number;
  progress_msg: string;
  running: boolean;
  failed: boolean;
  done: boolean;
  doc_ids: string[];
}

function mapPiDoc(raw: Record<string, unknown>): PageIndexDocument {
  const status = String(raw.tree_status ?? 'pending') as PageIndexDocument['treeStatus'];
  return {
    id: String(raw.id),
    name: String(raw.name ?? '—'),
    fileType: String(raw.file_type ?? ''),
    size: typeof raw.size === 'number' ? formatBytes(raw.size) : String(raw.size ?? '—'),
    pages: Number(raw.pages) || 0,
    treeStatus: status,
    nodes: Number(raw.nodes) || 0,
    depth: 3,
    avgToken: 120,
    tocSource: 'deepdoc',
    updated: String(raw.updated ?? '—'),
    buildProgress: typeof raw.parse_progress === 'number' ? Math.round(raw.parse_progress * 100) : undefined,
  };
}

function normalizePiTrace(raw: Record<string, unknown> | undefined): PageIndexTraceSnapshot | null {
  if (!raw || !Object.keys(raw).length) return null;
  const progress = typeof raw.progress === 'number' ? raw.progress : -2;
  const docIds = Array.isArray(raw.doc_ids) ? raw.doc_ids.map(String) : [];
  return {
    progress,
    progress_msg: typeof raw.progress_msg === 'string' ? raw.progress_msg : '',
    running: progress >= 0 && progress < 1,
    failed: progress < 0,
    done: progress >= 1,
    doc_ids: docIds,
  };
}

export function usePageIndexHubData(kbId: string) {
  const { data: kb } = useKnowledgeBase(kbId);
  const [stats, setStats] = useState(MOCK_PI_STATS);
  const [documents, setDocuments] = useState<PageIndexDocument[]>(MOCK_PI_DOCS);
  const [trace, setTrace] = useState<PageIndexTraceSnapshot | null>(null);
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(() => {
    if (!useRealApi) {
      setStats(MOCK_PI_STATS);
      setDocuments(MOCK_PI_DOCS);
      setTrace(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    hubApi.listPageIndexDocuments(kbId)
      .then(data => {
        const s = data?.stats ?? {};
        const docs = (data?.documents ?? []).map(d => mapPiDoc(d));
        const completed = Number(s.completed) || 0;
        const total = Number(s.total) || docs.length;
        const totalNodes = docs.reduce((sum, d) => sum + (d.nodes || 0), 0);
        setStats({
          ...MOCK_PI_STATS,
          total,
          completed,
          building: Number(s.building) || 0,
          pending: Number(s.pending) || 0,
          failed: Number(s.failed) || 0,
          buildRate: Number(s.build_rate) || 0,
          totalNodes,
          avgNodes: total ? Math.round(totalNodes / Math.max(completed, 1)) : 0,
        });
        setDocuments(docs);
        setTrace(normalizePiTrace(data?.trace as Record<string, unknown> | undefined));
      })
      .catch(() => {
        setStats(MOCK_PI_STATS);
        setDocuments([]);
        setTrace(null);
      })
      .finally(() => setLoading(false));
  }, [kbId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!useRealApi || !trace?.running) return;
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    return () => window.clearInterval(timer);
  }, [useRealApi, trace?.running, refresh]);

  const getDoc = useCallback((id: string) => {
    if (!useRealApi) return mockGetPiDoc(id);
    return documents.find(d => d.id === id);
  }, [documents]);

  const getTree = useCallback(async (docId: string): Promise<PageIndexTreeNode | undefined> => {
    if (!useRealApi) return mockGetPiTree(docId);
    try {
      const raw = await hubApi.getPageIndexTree(kbId, docId);
      const root = raw?.root as Record<string, unknown> | undefined;
      if (!root) return undefined;
      return mapTreeNode(root);
    } catch {
      return undefined;
    }
  }, [kbId]);

  const runLibrarySearch = useCallback(async (query: string): Promise<PageIndexLibrarySearchResult> => {
    if (!useRealApi) return runMockLibrarySearch(query);
    const res = await hubApi.searchPageIndex(kbId, query);
    return {
      query,
      mode: 'llm_prompt',
      docsSearched: documents.length,
      totalMs: 120,
      hits: (res?.hits ?? []).map((h, i) => ({
        docId: String(h.doc_id),
        docName: String(h.doc_name),
        nodeId: String(h.node_id),
        nodeTitle: String(h.node_title),
        pageRange: String(h.page_range ?? ''),
        confidence: Number(h.confidence) || 0,
        excerpt: String(h.excerpt ?? ''),
      })),
    };
  }, [kbId, documents.length]);

  const runTreeSearch = useCallback(async (query: string, docId: string): Promise<PageIndexSearchResult | null> => {
    if (!useRealApi) return runMockTreeSearch(query, docId);
    const res = await hubApi.searchPageIndex(kbId, query, 5);
    const hit = res?.hits?.find(h => h.doc_id === docId) ?? res?.hits?.[0];
    if (!hit) return null;
    return {
      query,
      mode: 'llm_prompt',
      targetNodeId: String(hit.node_id),
      targetTitle: String(hit.node_title),
      pageRange: String(hit.page_range ?? ''),
      tokenCount: 200,
      confidence: Number(hit.confidence) || 0,
      totalMs: 95,
      steps: [{ step: 1, action: '树检索', result: String(hit.excerpt), ms: 95, nodeId: String(hit.node_id) }],
      excerpt: String(hit.excerpt ?? ''),
    };
  }, [kbId]);

  const runBuild = useCallback(async (docIds?: string[]) => {
    if (!useRealApi) return;
    await kbApi.runRag3Index(kbId, 'pageindex', docIds);
    refresh();
  }, [kbId, refresh]);

  return {
    kb,
    stats,
    documents,
    trace,
    loading,
    refresh,
    getDoc,
    getTree,
    runLibrarySearch,
    runTreeSearch,
    runBuild,
    isApiMode: useRealApi,
  };
}

export function useGraphHubData(kbId: string) {
  const { data: kb } = useKnowledgeBase(kbId);
  const [sourceDocs, setSourceDocs] = useState<GraphSourceDoc[]>(GRAPH_SOURCE_DOCS);
  const [nodes, setNodes] = useState(GRAPH_NODES);
  const [edges, setEdges] = useState(GRAPH_EDGES);
  const [stats, setStats] = useState(GRAPH_STATS);
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(async () => {
    if (!useRealApi) return;
    setLoading(true);
    try {
      const [graphData, docsRes, trace] = await Promise.all([
        hubApi.getKnowledgeGraph(kbId),
        kbApi.listDocuments(kbId, { page: 1, page_size: 200 }),
        kbApi.traceIndex(kbId, 'graph').catch(() => ({})),
      ]);
      const gNodes = (graphData?.graph?.nodes ?? []) as Array<Record<string, unknown>>;
      const gEdges = (graphData?.graph?.edges ?? []) as Array<Record<string, unknown>>;
      setNodes(gNodes.map((n, i) => ({
        id: String(n.id ?? i),
        label: String(n.id ?? n.entity_name ?? `N${i}`),
        entityType: 'DOC' as const,
        communityId: String(n.community ?? ''),
        x: (i % 10) * 80,
        y: Math.floor(i / 10) * 80,
        size: 8,
        connections: 2,
        confidence: 0.8,
      })));
      setEdges(gEdges.map((e, i) => ({
        id: String(e.id ?? `e${i}`),
        from: String(e.source),
        to: String(e.target),
        relation: String(e.description ?? e.relation ?? 'related'),
        confidence: Number(e.weight) || 0.5,
      })));
      const traceProg = typeof trace.progress === 'number' ? trace.progress : -2;
      setSourceDocs(docsRes.items.map(d => ({
        id: d.doc_id,
        name: d.original_name,
        fileType: d.file_type,
        size: formatBytes(d.file_size),
        pages: d.page_count,
        indexStatus: traceProg >= 1 ? 'indexed' : traceProg >= 0 && traceProg < 1 ? 'building' : gNodes.length ? 'indexed' : 'pending',
        entityCount: Math.max(1, Math.floor(gNodes.length / Math.max(docsRes.items.length, 1))),
        relationCount: Math.max(0, Math.floor(gEdges.length / Math.max(docsRes.items.length, 1))),
        communityIds: [],
        nodeIds: gNodes.slice(0, 5).map(n => String(n.id)),
        primaryNodeId: gNodes[0] ? String(gNodes[0].id) : '',
        mode: 'lazy' as const,
        updated: d.uploaded_at,
      })));
      setStats({
        ...GRAPH_STATS,
        entities: gNodes.length,
        relations: gEdges.length,
        indexedDocs: docsRes.items.filter(d => d.parse_status === 'parsed').length,
        totalDocs: docsRes.items.length,
      });
    } catch {
      /* keep mock-ish empty */
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const getDoc = useCallback((id: string) => {
    if (!useRealApi) return mockGetGraphDoc(id);
    return sourceDocs.find(d => d.id === id);
  }, [sourceDocs]);

  const runGraphSearch = useCallback(async (query: string) => {
    if (!useRealApi) return runMockGraphSearch(query);
    const res = await kbApi.searchDataset(kbId, { question: query, use_kg: true, top_k: 8 });
    return {
      query,
      mode: 'local' as const,
      paths: res.hits.slice(0, 3).map((h, i) => ({
        rank: i + 1,
        entities: [h.doc_name],
        relations: [],
        score: h.score,
        summary: h.snippet,
      })),
      totalMs: 200,
    };
  }, [kbId]);

  const runBuild = useCallback(async () => {
    if (!useRealApi) return;
    await kbApi.runIndex(kbId, 'graph');
    await refresh();
  }, [kbId, refresh]);

  return { kb, stats, sourceDocs, nodes, edges, loading, refresh, getDoc, runGraphSearch, runBuild, isApiMode: useRealApi };
}

export function useWikiHubData(kbId: string) {
  const { data: kb } = useKnowledgeBase(kbId);
  const [pages, setPages] = useState<WikiPage[]>(WIKI_PAGES);
  const [sourceDocs, setSourceDocs] = useState<WikiSourceDoc[]>(WIKI_SOURCE_DOCS);
  const [stats, setStats] = useState(WIKI_STATS);
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(() => {
    if (!useRealApi) return;
    setLoading(true);
    hubApi.listWikiEntries(kbId)
      .then(data => {
        const entries = data?.entries ?? [];
        setPages(entries.map((e, i) => ({
          id: String(e.id ?? i),
          slug: String(e.id ?? `wiki-${i}`),
          title: String(e.title ?? 'Wiki 条目'),
          pageType: 'entity' as const,
          content: String(e.content ?? ''),
          sources: [String(e.doc_id ?? '')],
          related: [],
          status: 'published' as const,
          citeRate: 0.9,
          priority: '中' as const,
          author: 'RAG3',
          updated: '—',
          views: 0,
          version: 'v1',
        })));
        setSourceDocs((data?.source_documents ?? []).map(s => ({
          id: String(s.id),
          name: String(s.name),
          rawPath: `raw/${s.name}`,
          fileType: String(s.file_type ?? ''),
          size: typeof s.size === 'number' ? formatBytes(s.size) : String(s.size ?? ''),
          ingestStatus: s.ingest_status === 'compiled' ? 'compiled' : 'pending',
          wikiPageCount: Number(s.wiki_page_count) || 0,
          relatedSlugs: [],
          primaryWikiSlug: '',
          lastIngest: String(s.last_ingest ?? ''),
        })));
        const st = data?.stats ?? {};
        setStats({
          ...WIKI_STATS,
          total: Number(st.total_entries) || 0,
          published: Number(st.total_entries) || 0,
        });
      })
      .finally(() => setLoading(false));
  }, [kbId]);

  useEffect(() => { refresh(); }, [refresh]);

  const runBuild = useCallback(async (docIds?: string[]) => {
    if (!useRealApi) return;
    await kbApi.runRag3Index(kbId, 'wiki', docIds);
    refresh();
  }, [kbId, refresh]);

  const searchWiki = useCallback(async (query: string) => {
    if (!useRealApi) return pages.filter(p => p.title.includes(query) || p.content.includes(query));
    const res = await hubApi.searchWiki(kbId, query);
    return (res?.hits ?? []).map((h, i) => ({
      id: String(h.id ?? i),
      slug: String(h.id),
      title: String(h.title),
      pageType: 'entity' as const,
      content: String(h.content ?? ''),
      sources: [],
      related: [],
      status: 'published' as const,
      citeRate: Number(h.score) || 0.8,
      priority: '中' as const,
      author: 'RAG3',
      updated: '—',
      views: 0,
      version: 'v1',
    }));
  }, [kbId, pages]);

  return { kb, pages, sourceDocs, stats, loading, refresh, runBuild, searchWiki, isApiMode: useRealApi };
}
