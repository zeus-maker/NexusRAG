import { useCallback, useEffect, useState } from 'react';
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

export async function uploadKbDocuments(kbId: string, files: File[]): Promise<Document[]> {
  if (!useRealApi) throw new Error('mock 模式下不支持上传');
  return kbApi.uploadDocuments(kbId, files);
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
