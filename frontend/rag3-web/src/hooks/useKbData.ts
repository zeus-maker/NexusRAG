import { useCallback, useEffect, useState } from 'react';
import {
  buildDocumentUploadRequest,
  buildParserConfigPayload,
  type DocumentUploadConfig,
} from '../data/documentUploadConfig';
import { registerDocEnhancements } from '../data/documentEnhancementStore';
import { mockKBs, mockDocuments, mockChunks } from '../mockData';
import { kbApi } from '../services/kbApi';
import { useRealApi } from '../services/http';
import type { Chunk, Document, KnowledgeBase } from '../types';
import type { KBCreateForm } from '../components/KBCreateDialog';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useAsyncData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[],
  options?: { clearOnRefetch?: boolean },
): AsyncState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(useRealApi);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!useRealApi) {
      setData(fallback);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    if (options?.clearOnRefetch) setData(fallback);

    fetcher()
      .then(result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message || '加载失败');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, useRealApi, ...deps]);

  return { data, loading, error, refresh };
}

export function useKnowledgeBaseList(
  sortBy: string,
  sortDesc: boolean,
  search: string,
  page: number,
  pageSize: number,
  statusFilter: string,
) {
  const mockFiltered = mockKBs.filter(kb => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || kb.name.toLowerCase().includes(q) || kb.description.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || kb.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const result = useAsyncData(
    async () => {
      const res = await kbApi.listSorted(sortBy, sortDesc, search, page, pageSize);
      const filtered =
        statusFilter === 'all'
          ? res.items
          : res.items.filter(kb => kb.status === statusFilter);
      return { items: filtered, total: res.total };
    },
    { items: mockFiltered, total: mockFiltered.length },
    [sortBy, sortDesc, search, page, pageSize, statusFilter],
  );

  return { ...result, isApiMode: useRealApi };
}

export function useKnowledgeBase(kbId: string) {
  const fallback = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  return useAsyncData(
    () => kbApi.get(kbId),
    fallback,
    [kbId],
  );
}

const EMPTY_CHUNKS = { items: [] as Chunk[], total: 0 };

export function useDocuments(kbId: string, search = '') {
  const fallback = useRealApi
    ? []
    : mockDocuments.filter(
        d => d.kb_id === kbId && d.original_name.toLowerCase().includes(search.toLowerCase()),
      );

  return useAsyncData(
    async () => {
      const res = await kbApi.listDocuments(kbId, {
        keywords: search.trim() || undefined,
        page: 1,
        page_size: 200,
        orderby: 'create_time',
        desc: true,
      });
      return res.items;
    },
    fallback,
    [kbId, search],
  );
}

export function useDocumentListResult(kbId: string, search = '') {
  const fallback = mockDocuments.filter(
    d => d.kb_id === kbId && d.original_name.toLowerCase().includes(search.toLowerCase()),
  );

  return useAsyncData(
    async () => kbApi.listDocuments(kbId, {
      keywords: search.trim() || undefined,
      page: 1,
      page_size: 200,
      orderby: 'create_time',
      desc: true,
    }),
    { items: fallback, total: fallback.length },
    [kbId, search],
  );
}

export function useChunks(
  kbId: string,
  docId: string,
  opts?: { page?: number; page_size?: number; keywords?: string },
) {
  const page = opts?.page ?? 1;
  const pageSize = opts?.page_size ?? 100;
  const fallback = useRealApi
    ? EMPTY_CHUNKS
    : { items: mockChunks, total: mockChunks.length };

  return useAsyncData(
    async () => {
      if (!docId) return EMPTY_CHUNKS;
      return kbApi.listChunks(kbId, docId, {
        page,
        page_size: pageSize,
        keywords: opts?.keywords,
      });
    },
    fallback,
    [kbId, docId, page, pageSize, opts?.keywords],
    { clearOnRefetch: true },
  );
}

export function useIngestionLogs(kbId: string) {
  return useAsyncData(
    async () => kbApi.getIngestions(kbId, { page: 1, page_size: 50, log_type: 'file' }),
    { items: [], total: 0 },
    [kbId],
  );
}

export function useIndexTrace(kbId: string, type: 'graph' | 'raptor' | 'mindmap') {
  return useAsyncData(
    async () => kbApi.traceIndex(kbId, type),
    {},
    [kbId, type],
  );
}

export async function createKnowledgeBase(form: KBCreateForm): Promise<KnowledgeBase> {
  if (!useRealApi) throw new Error('mock 模式下请使用本地逻辑');
  return kbApi.create(form);
}

export async function updateKnowledgeBase(
  kbId: string,
  patch: Parameters<typeof kbApi.update>[1],
): Promise<KnowledgeBase> {
  if (!useRealApi) throw new Error('mock 模式下不支持保存');
  return kbApi.update(kbId, patch);
}

export async function deleteKnowledgeBase(ids: string[]): Promise<void> {
  if (!useRealApi) return;
  await kbApi.delete(ids);
}

export async function uploadKbDocuments(
  kbId: string,
  files: File[],
  options?: { chunkMethod?: string; parserConfig?: Record<string, unknown> },
): Promise<Document[]> {
  if (!useRealApi) throw new Error('mock 模式下不支持上传');
  return kbApi.uploadDocuments(kbId, files, options);
}

export async function fetchKbParserDefaults(kbId: string) {
  if (!useRealApi) return null;
  const raw = await kbApi.getDatasetRaw(kbId);
  return {
    chunkMethod: raw.chunk_method || raw.parser_id,
    parserConfig: raw.parser_config,
  };
}

export async function applyKbDocumentUploadConfig(
  kbId: string,
  documentIds: string[],
  config: DocumentUploadConfig,
) {
  if (!useRealApi) throw new Error('mock 模式下不支持');
  const body = buildDocumentUploadRequest(config);
  for (const docId of documentIds) {
    await kbApi.updateDocument(kbId, docId, body);
  }
}

export async function syncKbParserConfigFromUpload(
  kbId: string,
  config: DocumentUploadConfig,
): Promise<void> {
  if (!useRealApi) return;
  const payload = buildParserConfigPayload(config);
  await kbApi.updateParserConfig(kbId, payload);
}

export async function triggerKbEnhancementIndexes(
  kbId: string,
  config: DocumentUploadConfig,
  docIds?: string[],
): Promise<void> {
  if (!useRealApi) return;
  const tasks: Promise<unknown>[] = [];
  if (config.enableGraphRag) {
    tasks.push(kbApi.runIndex(kbId, 'graph').catch(() => undefined));
  }
  if (config.enableRaptor) {
    tasks.push(kbApi.runIndex(kbId, 'raptor').catch(() => undefined));
  }
  if (config.enablePageIndex) {
    tasks.push(kbApi.runRag3Index(kbId, 'pageindex', docIds).catch(() => undefined));
  }
  if (config.enableWiki) {
    tasks.push(kbApi.runRag3Index(kbId, 'wiki', docIds).catch(() => undefined));
  }
  await Promise.all(tasks);
}

export async function uploadKbDocumentsWithConfig(
  kbId: string,
  files: File[],
  config: DocumentUploadConfig,
): Promise<Document[]> {
  if (!useRealApi) throw new Error('mock 模式下不支持上传');
  const req = buildDocumentUploadRequest(config);
  const uploaded = await kbApi.uploadDocuments(kbId, files, {
    chunkMethod: req.chunk_method as string,
    parserConfig: buildParserConfigPayload(config),
  });
  const ids = uploaded.map(d => d.doc_id);
  if (ids.length) {
    await applyKbDocumentUploadConfig(kbId, ids, config);
    registerDocEnhancements(kbId, ids, config);
    if (
      config.enableGraphRag
      || config.enableRaptor
      || config.enablePageIndex
      || config.enableWiki
    ) {
      await syncKbParserConfigFromUpload(kbId, config);
    }
  }
  if (config.autoParse && ids.length) {
    await kbApi.parseDocuments(kbId, ids);
  }
  return uploaded;
}

export async function uploadKbFromUrl(kbId: string, name: string, url: string): Promise<Document> {
  if (!useRealApi) throw new Error('mock 模式下不支持 URL 导入');
  return kbApi.uploadFromUrl(kbId, name, url);
}

export async function deleteKbDocuments(kbId: string, ids: string[]): Promise<number> {
  if (!useRealApi) throw new Error('mock 模式下不支持删除');
  return kbApi.deleteDocuments(kbId, ids);
}

export async function parseKbDocuments(kbId: string, ids: string[]) {
  if (!useRealApi) throw new Error('mock 模式下不支持解析');
  return kbApi.parseDocuments(kbId, ids);
}

export async function stopKbDocuments(kbId: string, ids: string[]) {
  if (!useRealApi) throw new Error('mock 模式下不支持停止解析');
  return kbApi.stopDocuments(kbId, ids);
}

export async function searchKb(
  kbId: string,
  question: string,
  options?: Parameters<typeof kbApi.searchDataset>[1],
) {
  if (!useRealApi) throw new Error('mock 模式下请使用检索 mock');
  return kbApi.searchDataset(kbId, { question, ...options });
}

const MIN_CHUNK_PART = 8;

export async function splitKbChunk(
  kbId: string,
  docId: string,
  chunkId: string,
  splitAt: number,
) {
  if (!useRealApi) throw new Error('mock 模式下不支持拆分');
  const chunk = await kbApi.getChunk(kbId, docId, chunkId);
  const content = chunk.content_preview;
  if (splitAt <= 0 || splitAt >= content.length) throw new Error('拆分位置无效');
  const part1 = content.slice(0, splitAt).trim();
  const part2 = content.slice(splitAt).trim();
  if (part1.length < MIN_CHUNK_PART || part2.length < MIN_CHUNK_PART) {
    throw new Error(`拆分后每段至少 ${MIN_CHUNK_PART} 个字符`);
  }
  await kbApi.updateChunk(kbId, docId, chunkId, { content: part1 });
  await kbApi.createChunk(kbId, docId, { content: part2 });
}

export async function mergeKbChunks(
  kbId: string,
  docId: string,
  firstId: string,
  secondId: string,
) {
  if (!useRealApi) throw new Error('mock 模式下不支持合并');
  const [a, b] = await Promise.all([
    kbApi.getChunk(kbId, docId, firstId),
    kbApi.getChunk(kbId, docId, secondId),
  ]);
  const merged = `${a.content_preview.trim()}\n${b.content_preview.trim()}`;
  await kbApi.updateChunk(kbId, docId, firstId, { content: merged });
  await kbApi.deleteChunks(kbId, docId, [secondId]);
}

export async function setKbChunkAvailability(
  kbId: string,
  docId: string,
  chunkIds: string[],
  available: boolean,
) {
  if (!useRealApi) throw new Error('mock 模式下不支持切换可用性');
  await kbApi.switchChunkAvailability(kbId, docId, chunkIds, available);
}
