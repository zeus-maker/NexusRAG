import { useCallback, useEffect, useState } from 'react';
import { mockKBs, mockDocuments } from '../mockData';
import { kbApi } from '../services/kbApi';
import { useRealApi } from '../services/http';
import type { Document, KnowledgeBase } from '../types';

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
  const [data, setData] = useState<T>(useRealApi ? fallback : fallback);
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

export function useDocuments(kbId: string, search = '') {
  const fallback = mockDocuments.filter(
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

export async function createKnowledgeBase(form: Parameters<typeof kbApi.create>[0]): Promise<KnowledgeBase> {
  if (!useRealApi) throw new Error('mock 模式下请使用本地逻辑');
  return kbApi.create(form);
}

export async function deleteKnowledgeBase(ids: string[]): Promise<void> {
  if (!useRealApi) return;
  await kbApi.delete(ids);
}

export async function uploadKbDocuments(kbId: string, files: File[]): Promise<Document[]> {
  if (!useRealApi) throw new Error('mock 模式下不支持上传');
  return kbApi.uploadDocuments(kbId, files);
}
