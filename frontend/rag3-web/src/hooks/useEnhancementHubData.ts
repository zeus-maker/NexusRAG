import { useCallback, useEffect, useState } from 'react';
import {
  PAGEINDEX_DOCUMENTS as MOCK_PI_DOCS,
  PAGEINDEX_STATS as MOCK_PI_STATS,
  PAGEINDEX_ANALYTICS as MOCK_PI_ANALYTICS,
  PAGEINDEX_DEFAULT_SETTINGS,
  getPageIndexDoc as mockGetPiDoc,
  getPageIndexTree as mockGetPiTree,
  runMockLibrarySearch,
  runMockTreeSearch,
  type PageIndexDocument,
  type PageIndexLibrarySearchResult,
  type PageIndexSearchMode,
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
  WIKI_DEFAULT_SETTINGS,
  WIKI_COMPILE_QUEUE,
  WIKI_TREE,
  type WikiPage,
  type WikiCompileJob,
  type WikiSourceDoc,
  type WikiTreeNode,
} from '../data/wikiMock';
import { buildWikiTreeFromPages } from '../utils/wikiTreeUtils';
import { useKnowledgeBase, useKnowledgeBaseList } from './useKbData';
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

export interface PageIndexAnalyticsView {
  searchLatencyP50: number;
  searchLatencyP95: number;
  avgHops: number;
  weeklySearches: number[];
  weeklyBuilds: number[];
  docTypeDist: Array<{ type: string; count: number; pct: number }>;
  depthDist: Array<{ depth: string; count: number }>;
  topDocs: Array<{ docId: string; name: string; searches: number; avgMs: number }>;
  failDist: Array<{ reason: string; count: number }>;
  vectorCompare: { financeBench: string; pageindexRecall: number; vectorRecall: number };
}

function mapPiDoc(raw: Record<string, unknown>): PageIndexDocument {
  const status = String(raw.tree_status ?? 'pending') as PageIndexDocument['treeStatus'];
  const toc = String(raw.toc_source ?? 'deepdoc') as PageIndexDocument['tocSource'];
  return {
    id: String(raw.id),
    name: String(raw.name ?? '—'),
    fileType: String(raw.file_type ?? ''),
    size: typeof raw.size === 'number' ? formatBytes(raw.size) : String(raw.size ?? '—'),
    pages: Number(raw.pages) || 0,
    treeStatus: status,
    nodes: Number(raw.nodes) || 0,
    depth: Number(raw.tree_depth) || 3,
    avgToken: 120,
    tocSource: toc === 'llm' || toc === 'manual' ? toc : 'deepdoc',
    updated: String(raw.updated ?? '—'),
    failReason: typeof raw.fail_reason === 'string' ? raw.fail_reason : undefined,
    buildProgress: typeof raw.parse_progress === 'number' ? Math.round(raw.parse_progress * 100) : undefined,
  };
}

function mapAnalytics(raw: Record<string, unknown> | undefined): PageIndexAnalyticsView {
  if (!raw || !Object.keys(raw).length) return { ...MOCK_PI_ANALYTICS };
  const docTypes = (raw.doc_type_dist as Array<Record<string, unknown>> | undefined) ?? [];
  const totalType = docTypes.reduce((s, d) => s + Number(d.count || 0), 0) || 1;
  return {
    searchLatencyP50: Number(raw.search_latency_p50) || 0,
    searchLatencyP95: Number(raw.search_latency_p95) || 0,
    avgHops: Number(raw.avg_hops) || 1,
    weeklySearches: (raw.weekly_searches as number[] | undefined) ?? MOCK_PI_ANALYTICS.weeklySearches,
    weeklyBuilds: (raw.weekly_builds as number[] | undefined) ?? MOCK_PI_ANALYTICS.weeklyBuilds ?? MOCK_PI_STATS.weeklyBuilds,
    docTypeDist: docTypes.map(d => ({
      type: String(d.label ?? d.type ?? ''),
      count: Number(d.count) || 0,
      pct: Math.round((Number(d.count) || 0) / totalType * 1000) / 10,
    })),
    depthDist: ((raw.depth_dist as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
      depth: String(d.depth ?? ''),
      count: Number(d.count) || 0,
    })),
    topDocs: ((raw.top_docs as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
      docId: String(d.doc_id ?? ''),
      name: String(d.name ?? ''),
      searches: Number(d.searches) || 0,
      avgMs: Number(d.avg_ms) || 0,
    })),
    failDist: (() => {
      const items = ((raw.fail_dist as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
        reason: String(d.reason ?? ''),
        count: Number(d.count) || 0,
      }));
      return items.length ? items : MOCK_PI_ANALYTICS.failDist ?? MOCK_PI_STATS.failDist;
    })(),
    vectorCompare: {
      financeBench: String((raw.vector_compare as Record<string, unknown> | undefined)?.finance_bench ?? 'FinanceBench'),
      pageindexRecall: Number((raw.vector_compare as Record<string, unknown> | undefined)?.pageindex_recall) || 98.7,
      vectorRecall: Number((raw.vector_compare as Record<string, unknown> | undefined)?.vector_recall) || 52.3,
    },
  };
}

export function mapPageIndexSettingsFromApi(raw: Record<string, unknown> | undefined) {
  if (!raw) return { ...PAGEINDEX_DEFAULT_SETTINGS };
  const docTypes = (raw.doc_types as Record<string, boolean> | undefined) ?? {};
  return {
    tocMode: (raw.toc_mode as typeof PAGEINDEX_DEFAULT_SETTINGS.tocMode) ?? PAGEINDEX_DEFAULT_SETTINGS.tocMode,
    maxDepth: Number(raw.max_depth) || PAGEINDEX_DEFAULT_SETTINGS.maxDepth,
    maxTokenPerNode: Number(raw.max_token_per_node) || PAGEINDEX_DEFAULT_SETTINGS.maxTokenPerNode,
    searchMode: (raw.search_mode as PageIndexSearchMode) ?? PAGEINDEX_DEFAULT_SETTINGS.searchMode,
    searchDepth: Number(raw.search_depth) || PAGEINDEX_DEFAULT_SETTINGS.searchDepth,
    branchFactor: Number(raw.branch_factor) || PAGEINDEX_DEFAULT_SETTINGS.branchFactor,
    docTypes: {
      contract: docTypes.contract ?? PAGEINDEX_DEFAULT_SETTINGS.docTypes.contract,
      financial: docTypes.financial ?? PAGEINDEX_DEFAULT_SETTINGS.docTypes.financial,
      paper: docTypes.paper ?? PAGEINDEX_DEFAULT_SETTINGS.docTypes.paper,
      email: docTypes.email ?? PAGEINDEX_DEFAULT_SETTINGS.docTypes.email,
    },
    autoBuildOnUpload: Boolean(raw.auto_build_on_upload ?? PAGEINDEX_DEFAULT_SETTINGS.autoBuildOnUpload),
    incrementalRebuild: Boolean(raw.incremental_rebuild ?? PAGEINDEX_DEFAULT_SETTINGS.incrementalRebuild),
    llmModel: String(raw.llm_model ?? PAGEINDEX_DEFAULT_SETTINGS.llmModel),
    semanticToc: Boolean(raw.semantic_toc ?? PAGEINDEX_DEFAULT_SETTINGS.semanticToc),
  };
}

export function mapPageIndexSettingsToApi(settings: typeof PAGEINDEX_DEFAULT_SETTINGS) {
  return {
    toc_mode: settings.tocMode,
    max_depth: settings.maxDepth,
    max_token_per_node: settings.maxTokenPerNode,
    search_mode: settings.searchMode,
    search_depth: settings.searchDepth,
    branch_factor: settings.branchFactor,
    doc_types: settings.docTypes,
    auto_build_on_upload: settings.autoBuildOnUpload,
    incremental_rebuild: settings.incrementalRebuild,
    llm_model: settings.llmModel,
    semantic_toc: settings.semanticToc,
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
  const [analytics, setAnalytics] = useState<PageIndexAnalyticsView>(MOCK_PI_ANALYTICS);
  const [documents, setDocuments] = useState<PageIndexDocument[]>(MOCK_PI_DOCS);
  const [trace, setTrace] = useState<PageIndexTraceSnapshot | null>(null);
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(() => {
    if (!useRealApi) {
      setStats(MOCK_PI_STATS);
      setAnalytics(MOCK_PI_ANALYTICS);
      setDocuments(MOCK_PI_DOCS);
      setTrace(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      hubApi.listPageIndexDocuments(kbId),
      hubApi.getPageIndexAnalytics(kbId).catch(() => undefined),
    ])
      .then(([data, analyticsRaw]) => {
        const s = data?.stats ?? {};
        const docs = (data?.documents ?? []).map(d => mapPiDoc(d));
        const completed = Number(s.completed) || 0;
        const total = Number(s.total) || docs.length;
        const totalNodes = docs.reduce((sum, d) => sum + (d.nodes || 0), 0);
        const analyticsView = mapAnalytics(analyticsRaw as Record<string, unknown> | undefined);
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
          weeklyBuilds: analyticsView.weeklyBuilds ?? MOCK_PI_STATS.weeklyBuilds,
          failDist: analyticsView.failDist?.length ? analyticsView.failDist : MOCK_PI_STATS.failDist,
        });
        setAnalytics(analyticsView);
        setDocuments(docs);
        setTrace(normalizePiTrace(data?.trace as Record<string, unknown> | undefined));
      })
      .catch(() => {
        setStats(MOCK_PI_STATS);
        setAnalytics(MOCK_PI_ANALYTICS);
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

  const runLibrarySearch = useCallback(async (
    query: string,
    mode: PageIndexSearchMode = 'mcts_hybrid',
  ): Promise<PageIndexLibrarySearchResult> => {
    if (!useRealApi) return runMockLibrarySearch(query);
    const res = await hubApi.searchPageIndex(kbId, query, { mode });
    return {
      query,
      mode: (res?.mode as PageIndexSearchMode) ?? mode,
      docsSearched: Number(res?.docs_searched) || documents.filter(d => d.treeStatus === 'completed').length,
      totalMs: Number(res?.total_ms) || 0,
      hits: (res?.hits ?? []).map(h => ({
        docId: String(h.doc_id),
        docName: String(h.doc_name),
        nodeId: String(h.node_id),
        nodeTitle: String(h.node_title),
        pageRange: String(h.page_range ?? ''),
        confidence: Number(h.confidence) || 0,
        excerpt: String(h.excerpt ?? ''),
      })),
    };
  }, [kbId, documents]);

  const runTreeSearch = useCallback(async (
    query: string,
    docId: string,
    mode: PageIndexSearchMode = 'mcts_hybrid',
  ): Promise<PageIndexSearchResult | null> => {
    if (!useRealApi) return runMockTreeSearch(query, docId);
    const res = await hubApi.searchPageIndex(kbId, query, { topK: 5, docId, mode });
    const hit = res?.hits?.[0];
    if (!hit) return null;
    const steps = (res?.steps ?? []).map((s, i) => ({
      step: Number(s.step) || i + 1,
      action: String(s.action ?? '树检索'),
      result: String(s.result ?? ''),
      ms: Number(s.ms) || 0,
      nodeId: s.node_id ? String(s.node_id) : undefined,
    }));
    return {
      query,
      mode: (res?.mode as PageIndexSearchMode) ?? mode,
      targetNodeId: String(hit.node_id),
      targetTitle: String(hit.node_title),
      pageRange: String(hit.page_range ?? ''),
      tokenCount: 200,
      confidence: Number(hit.confidence) || 0,
      totalMs: Number(res?.total_ms) || 0,
      steps: steps.length ? steps : [{ step: 1, action: '树检索', result: String(hit.excerpt), ms: Number(res?.total_ms) || 0, nodeId: String(hit.node_id) }],
      excerpt: String(hit.excerpt ?? ''),
    };
  }, [kbId]);

  const loadSettings = useCallback(async () => {
    if (!useRealApi) return { ...PAGEINDEX_DEFAULT_SETTINGS };
    const raw = await hubApi.getPageIndexSettings(kbId);
    return mapPageIndexSettingsFromApi(raw as Record<string, unknown>);
  }, [kbId]);

  const saveSettings = useCallback(async (settings: typeof PAGEINDEX_DEFAULT_SETTINGS) => {
    if (!useRealApi) return settings;
    const raw = await hubApi.savePageIndexSettings(kbId, mapPageIndexSettingsToApi(settings));
    return mapPageIndexSettingsFromApi(raw as Record<string, unknown>);
  }, [kbId]);

  const runBuild = useCallback(async (docIds?: string[]) => {
    if (!useRealApi) return;
    await kbApi.runRag3Index(kbId, 'pageindex', docIds);
    refresh();
  }, [kbId, refresh]);

  return {
    kb,
    stats,
    analytics,
    documents,
    trace,
    loading,
    refresh,
    getDoc,
    getTree,
    runLibrarySearch,
    runTreeSearch,
    runBuild,
    loadSettings,
    saveSettings,
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

export interface WikiAnalyticsView {
  searchLatencyP50: number;
  searchLatencyP95: number;
  searchCount: number;
  weeklySearches: number[];
  weeklyCompile: number[];
  layerDist: Array<{ layer: string; count: number; pct: number }>;
  topCited: Array<{ title: string; cites: number; entryId?: string }>;
  failDist: Array<{ reason: string; count: number }>;
}

function mapWikiAnalytics(raw: Record<string, unknown> | undefined): WikiAnalyticsView {
  if (!raw || !Object.keys(raw).length) {
    return {
      searchLatencyP50: 0,
      searchLatencyP95: 0,
      searchCount: 0,
      weeklySearches: [0, 0, 0, 0, 0, 0, 0],
      weeklyCompile: WIKI_STATS.weeklyCompile,
      layerDist: WIKI_STATS.layerDist,
      topCited: WIKI_STATS.topCited.map(t => ({ title: t.title, cites: t.cites })),
      failDist: [],
    };
  }
  return {
    searchLatencyP50: Number(raw.search_latency_p50) || 0,
    searchLatencyP95: Number(raw.search_latency_p95) || 0,
    searchCount: Number(raw.search_count) || 0,
    weeklySearches: (raw.weekly_searches as number[] | undefined) ?? [0, 0, 0, 0, 0, 0, 0],
    weeklyCompile: (raw.weekly_compile as number[] | undefined) ?? WIKI_STATS.weeklyCompile,
    layerDist: ((raw.layer_dist as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
      layer: String(d.layer ?? ''),
      count: Number(d.count) || 0,
      pct: Number(d.pct) || 0,
    })),
    topCited: ((raw.top_cited as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
      title: String(d.title ?? ''),
      cites: Number(d.cites) || 0,
      entryId: d.entry_id ? String(d.entry_id) : undefined,
    })),
    failDist: ((raw.fail_dist as Array<Record<string, unknown>> | undefined) ?? []).map(d => ({
      reason: String(d.reason ?? ''),
      count: Number(d.count) || 0,
    })),
  };
}

export function mapWikiSettingsFromApi(raw: Record<string, unknown> | undefined) {
  if (!raw) return { ...WIKI_DEFAULT_SETTINGS };
  return {
    triggerMode: (raw.trigger_mode as typeof WIKI_DEFAULT_SETTINGS.triggerMode) ?? WIKI_DEFAULT_SETTINGS.triggerMode,
    llmModel: String(raw.llm_model ?? WIKI_DEFAULT_SETTINGS.llmModel),
    entityThreshold: Number(raw.entity_threshold) || WIKI_DEFAULT_SETTINGS.entityThreshold,
    manualReview: Boolean(raw.manual_review ?? WIKI_DEFAULT_SETTINGS.manualReview),
    autoPublish: Boolean(raw.auto_publish ?? WIKI_DEFAULT_SETTINGS.autoPublish),
    gitBranch: String(raw.git_branch ?? WIKI_DEFAULT_SETTINGS.gitBranch),
    autoCommit: Boolean(raw.auto_commit ?? WIKI_DEFAULT_SETTINGS.autoCommit),
    incrementalEntity: Boolean(raw.incremental_entity ?? WIKI_DEFAULT_SETTINGS.incrementalEntity),
    incrementalSynthesis: Boolean(raw.incremental_synthesis ?? WIKI_DEFAULT_SETTINGS.incrementalSynthesis),
    citeReviewThreshold: Number(raw.cite_review_threshold) || WIKI_DEFAULT_SETTINGS.citeReviewThreshold,
  };
}

export function mapWikiSettingsToApi(settings: typeof WIKI_DEFAULT_SETTINGS) {
  return {
    trigger_mode: settings.triggerMode,
    llm_model: settings.llmModel,
    entity_threshold: settings.entityThreshold,
    manual_review: settings.manualReview,
    auto_publish: settings.autoPublish,
    git_branch: settings.gitBranch,
    auto_commit: settings.autoCommit,
    incremental_entity: settings.incrementalEntity,
    incremental_synthesis: settings.incrementalSynthesis,
    cite_review_threshold: settings.citeReviewThreshold,
  };
}

export interface WikiTraceSnapshot {
  progress: number;
  progress_msg: string;
  running: boolean;
  failed: boolean;
  done: boolean;
  doc_ids: string[];
}

function normalizeWikiTrace(raw: Record<string, unknown> | undefined): WikiTraceSnapshot | null {
  if (!raw || !Object.keys(raw).length) return null;
  const progress = typeof raw.progress === 'number' ? raw.progress : -2;
  return {
    progress,
    progress_msg: typeof raw.progress_msg === 'string' ? raw.progress_msg : '',
    running: progress >= 0 && progress < 1,
    failed: progress < 0,
    done: progress >= 1,
    doc_ids: Array.isArray(raw.doc_ids) ? raw.doc_ids.map(String) : [],
  };
}

function mapWikiIngestStatus(raw: string): WikiSourceDoc['ingestStatus'] {
  if (raw === 'compiled' || raw === 'compiling' || raw === 'failed') return raw;
  return 'pending';
}

function mapWikiEntry(raw: Record<string, unknown>, i: number): WikiPage {
  const id = String(raw.id ?? `wiki-${i}`);
  const docId = String(raw.doc_id ?? '');
  const docName = String(raw.doc_name ?? '');
  return {
    id,
    slug: id,
    title: String(raw.title ?? 'Wiki 条目'),
    pageType: 'entity',
    content: String(raw.content ?? ''),
    sources: docId ? [docId] : [],
    related: [],
    status: 'published',
    citeRate: null,
    priority: '中',
    author: 'RAG3',
    updated: '—',
    views: 0,
    version: 'v1',
    rawSource: docName ? `raw/${docName}` : undefined,
  };
}

function mapWikiSourceDoc(raw: Record<string, unknown>): WikiSourceDoc {
  const related = Array.isArray(raw.related_slugs) ? raw.related_slugs.map(String) : [];
  return {
    id: String(raw.id),
    name: String(raw.name ?? '—'),
    rawPath: String(raw.raw_path ?? `raw/${raw.name ?? ''}`),
    fileType: String(raw.file_type ?? ''),
    size: typeof raw.size === 'number' ? formatBytes(raw.size) : String(raw.size ?? '—'),
    ingestStatus: mapWikiIngestStatus(String(raw.ingest_status ?? 'pending')),
    wikiPageCount: Number(raw.wiki_page_count) || 0,
    relatedSlugs: related,
    primaryWikiSlug: String(raw.primary_wiki_slug ?? related[0] ?? ''),
    lastIngest: String(raw.last_ingest ?? '—'),
  };
}

function buildApiCompileQueue(sourceDocs: WikiSourceDoc[], trace: WikiTraceSnapshot | null): WikiCompileJob[] {
  const jobs: WikiCompileJob[] = [];
  const lastLog = (trace?.progress_msg ?? '').split('\n').filter(Boolean).pop() ?? '';
  if (trace?.running) {
    const targets = trace.doc_ids.length
      ? sourceDocs.filter(d => trace.doc_ids.includes(d.id))
      : sourceDocs.filter(d => d.ingestStatus === 'compiling');
    for (const doc of targets) {
      jobs.push({
        id: `build-${doc.id}`,
        title: doc.name,
        status: 'compiling',
        progress: Math.round((trace?.progress ?? 0) * 100),
        step: lastLog || 'Wiki 编译中',
        citeRate: null,
        priority: '中',
        started: '进行中',
      });
    }
  }
  for (const doc of sourceDocs) {
    if (doc.ingestStatus === 'pending') {
      jobs.push({
        id: `pending-${doc.id}`,
        title: doc.name,
        status: 'queued',
        progress: 0,
        step: '等待 Ingest',
        citeRate: null,
        priority: '低',
        started: '—',
      });
    } else if (doc.ingestStatus === 'failed') {
      jobs.push({
        id: `failed-${doc.id}`,
        title: doc.name,
        status: 'failed',
        progress: 0,
        step: '编译失败',
        citeRate: null,
        priority: '低',
        started: doc.lastIngest,
      });
    }
  }
  return jobs;
}

export function useWikiHubData(kbId: string) {
  const { data: kb } = useKnowledgeBase(kbId);
  const [pages, setPages] = useState<WikiPage[]>(WIKI_PAGES);
  const [sourceDocs, setSourceDocs] = useState<WikiSourceDoc[]>(WIKI_SOURCE_DOCS);
  const [stats, setStats] = useState(WIKI_STATS);
  const [trace, setTrace] = useState<WikiTraceSnapshot | null>(null);
  const [tree, setTree] = useState<WikiTreeNode>(WIKI_TREE);
  const [compileQueue, setCompileQueue] = useState<WikiCompileJob[]>(WIKI_COMPILE_QUEUE);
  const [analytics, setAnalytics] = useState<WikiAnalyticsView>(mapWikiAnalytics(undefined));
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(() => {
    if (!useRealApi) {
      setPages(WIKI_PAGES);
      setSourceDocs(WIKI_SOURCE_DOCS);
      setStats(WIKI_STATS);
      setAnalytics(mapWikiAnalytics(undefined));
      setTrace(null);
      setTree(WIKI_TREE);
      setCompileQueue(WIKI_COMPILE_QUEUE);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      hubApi.listWikiEntries(kbId),
      hubApi.getWikiAnalytics(kbId).catch(() => undefined),
    ])
      .then(([data, analyticsRaw]) => {
        const entries = data?.entries ?? [];
        const mappedPages = entries.map((e, i) => mapWikiEntry(e as Record<string, unknown>, i));
        const mappedDocs = (data?.source_documents ?? []).map(s => mapWikiSourceDoc(s as Record<string, unknown>));
        const traceSnap = normalizeWikiTrace(data?.trace as Record<string, unknown> | undefined);
        const st = data?.stats ?? {};
        const analyticsView = mapWikiAnalytics(analyticsRaw as Record<string, unknown> | undefined);
        setPages(mappedPages);
        setSourceDocs(mappedDocs);
        setTrace(traceSnap);
        setTree(buildWikiTreeFromPages(mappedPages, mappedDocs));
        setCompileQueue(buildApiCompileQueue(mappedDocs, traceSnap));
        setAnalytics(analyticsView);
        setStats({
          ...WIKI_STATS,
          total: Number(st.total_entries) || mappedPages.length,
          published: Number(st.published ?? st.total_entries) || mappedPages.length,
          reviewing: Number(st.reviewing) || 0,
          compiling: Number(st.compiling ?? st.compiling_docs) || 0,
          failed: Number(st.failed ?? st.failed_docs) || 0,
          avgCiteRate: mappedPages.length ? 84 : 0,
          layerDist: analyticsView.layerDist.length ? analyticsView.layerDist : WIKI_STATS.layerDist,
          weeklyCompile: analyticsView.weeklyCompile,
          topCited: analyticsView.topCited.length
            ? analyticsView.topCited.map(t => ({ title: t.title, cites: t.cites }))
            : WIKI_STATS.topCited,
        });
      })
      .catch(() => {
        setPages([]);
        setSourceDocs([]);
        setTrace(null);
        setTree({ id: 'root', title: 'index.md', nodeType: 'folder', pageType: 'index', children: [] });
        setCompileQueue([]);
      })
      .finally(() => setLoading(false));
  }, [kbId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!useRealApi || !trace?.running) return;
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    return () => window.clearInterval(timer);
  }, [useRealApi, trace?.running, refresh]);

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
      title: String(h.title ?? 'Wiki 条目'),
      pageType: 'entity' as const,
      content: String(h.content ?? ''),
      sources: h.doc_id ? [String(h.doc_id)] : [],
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

  const getPage = useCallback((slug: string) => pages.find(p => p.slug === slug || p.id === slug), [pages]);

  const loadSettings = useCallback(async () => {
    if (!useRealApi) return { ...WIKI_DEFAULT_SETTINGS };
    const raw = await hubApi.getWikiSettings(kbId);
    return mapWikiSettingsFromApi(raw as Record<string, unknown>);
  }, [kbId]);

  const saveSettings = useCallback(async (settings: typeof WIKI_DEFAULT_SETTINGS) => {
    if (!useRealApi) return settings;
    const raw = await hubApi.saveWikiSettings(kbId, mapWikiSettingsToApi(settings));
    return mapWikiSettingsFromApi(raw as Record<string, unknown>);
  }, [kbId]);

  return {
    kb,
    pages,
    sourceDocs,
    stats,
    analytics,
    trace,
    tree,
    compileQueue,
    loading,
    refresh,
    runBuild,
    searchWiki,
    getPage,
    loadSettings,
    saveSettings,
    isApiMode: useRealApi,
  };
}

export interface WikiManageEntry {
  id: string;
  title: string;
  kb: string;
  kbId: string;
  layer: number;
  status: 'published' | 'reviewing' | 'draft';
  cites: number;
  sources: number;
  updated: string;
}

export interface WikiManageJob {
  id: string;
  kb: string;
  kbId: string;
  trigger: string;
  pages: number;
  status: 'running' | 'queued' | 'completed' | 'failed';
  progress: number;
  started: string;
  model: string;
}

export function useWikiManageData() {
  const { data: kbList, loading: kbLoading } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const [entries, setEntries] = useState<WikiManageEntry[]>([]);
  const [jobs, setJobs] = useState<WikiManageJob[]>([]);
  const [loading, setLoading] = useState(useRealApi);

  const refresh = useCallback(async () => {
    if (!useRealApi) return;
    setLoading(true);
    try {
      const kbs = kbList?.items ?? [];
      const results = await Promise.all(
        kbs.map(async kb => {
          const data = await hubApi.listWikiEntries(kb.kb_id).catch(() => null);
          return { kb, data };
        }),
      );
      const allEntries: WikiManageEntry[] = [];
      const allJobs: WikiManageJob[] = [];
      for (const { kb, data } of results) {
        if (!data) continue;
        const wikiEntries = data.entries ?? [];
        const trace = data.trace as Record<string, unknown> | undefined;
        const progress = typeof trace?.progress === 'number' ? trace.progress : -2;
        const running = progress >= 0 && progress < 1;
        if (running) {
          allJobs.push({
            id: `job-${kb.kb_id}`,
            kb: kb.name,
            kbId: kb.kb_id,
            trigger: 'Ingest',
            pages: wikiEntries.length,
            status: 'running',
            progress: Math.round(progress * 100),
            started: String((trace?.progress_msg as string | undefined)?.split('\n').pop() ?? '进行中'),
            model: 'RAG3',
          });
        }
        for (const e of wikiEntries) {
          const raw = e as Record<string, unknown>;
          allEntries.push({
            id: String(raw.id ?? ''),
            title: String(raw.title ?? 'Wiki 条目'),
            kb: kb.name,
            kbId: kb.kb_id,
            layer: 2,
            status: 'published',
            cites: 0,
            sources: raw.doc_id ? 1 : 0,
            updated: '—',
          });
        }
        for (const s of data.source_documents ?? []) {
          const raw = s as Record<string, unknown>;
          if (raw.ingest_status === 'pending') {
            allJobs.push({
              id: `pending-${kb.kb_id}-${raw.id}`,
              kb: kb.name,
              kbId: kb.kb_id,
              trigger: '待 Ingest',
              pages: 0,
              status: 'queued',
              progress: 0,
              started: '—',
              model: 'RAG3',
            });
          } else if (raw.ingest_status === 'failed') {
            allJobs.push({
              id: `failed-${kb.kb_id}-${raw.id}`,
              kb: kb.name,
              kbId: kb.kb_id,
              trigger: '编译失败',
              pages: Number(raw.wiki_page_count) || 0,
              status: 'failed',
              progress: 0,
              started: String(raw.last_ingest ?? '—'),
              model: 'RAG3',
            });
          }
        }
      }
      setEntries(allEntries);
      setJobs(allJobs);
    } finally {
      setLoading(false);
    }
  }, [kbList?.items]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { entries, jobs, loading: loading || kbLoading, refresh, isApiMode: useRealApi };
}
