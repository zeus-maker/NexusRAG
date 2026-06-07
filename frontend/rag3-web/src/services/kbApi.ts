import { apiRequest, apiUpload, getStoredAuth } from './http';
import {
  mapCreateFormToPayload,
  mapDatasetToKB,
  mapDocumentToUI,
  mapChunkToUI,
  mapSearchHitToFusion,
  mapIngestionLogToUI,
  mapSettingsToUpdatePayload,
  normalizeChunkDetail,
  documentPreviewPath,
  documentDownloadPath,
  sortKeyToOrderby,
  type RagflowDataset,
  type RagflowDocument,
  type RagflowChunk,
  type RagflowSearchChunk,
  type RagflowIngestionLog,
} from './kbMappers';
import type { KBCreateForm } from '../components/KBCreateDialog';
import type { Chunk, Document, KnowledgeBase } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

function apiUrl(path: string) {
  return `${API_BASE}/${API_VERSION}${path}`;
}

export interface ListKbParams {
  page?: number;
  page_size?: number;
  name?: string;
  orderby?: string;
  desc?: boolean;
}

export interface ListKbResult {
  items: KnowledgeBase[];
  total: number;
}

export interface ListDocParams {
  page?: number;
  page_size?: number;
  keywords?: string;
  orderby?: string;
  desc?: boolean;
  run?: string[];
}

export interface ListDocResult {
  items: Document[];
  total: number;
}

export interface SearchParams {
  question: string;
  top_k?: number;
  similarity_threshold?: number;
  vector_similarity_weight?: number;
  keyword?: boolean;
  use_kg?: boolean;
  rerank_id?: string;
  page?: number;
  size?: number;
}

export interface SearchResult {
  hits: ReturnType<typeof mapSearchHitToFusion>[];
  total: number;
  rawChunks: RagflowSearchChunk[];
}

export const kbApi = {
  async list(params: ListKbParams = {}): Promise<ListKbResult> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.name) qs.set('name', params.name);
    if (params.orderby) qs.set('orderby', params.orderby);
    if (params.desc !== undefined) qs.set('desc', String(params.desc));
    const query = qs.toString();
    const { data, total } = await apiRequest<RagflowDataset[]>(
      `/datasets${query ? `?${query}` : ''}`,
    );
    const list = Array.isArray(data) ? data : [];
    return { items: list.map(mapDatasetToKB), total: total ?? list.length };
  },

  async get(datasetId: string): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`);
    return mapDatasetToKB(data);
  },

  async create(form: KBCreateForm): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(mapCreateFormToPayload(form)),
    });
    return mapDatasetToKB(data);
  },

  async update(
    datasetId: string,
    patch: Parameters<typeof mapSettingsToUpdatePayload>[0],
  ): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`, {
      method: 'PUT',
      body: JSON.stringify(mapSettingsToUpdatePayload(patch)),
    });
    return mapDatasetToKB(data);
  },

  async updateParserConfig(datasetId: string, parserConfig: Record<string, unknown>): Promise<KnowledgeBase> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`, {
      method: 'PUT',
      body: JSON.stringify({ parser_config: parserConfig }),
    });
    return mapDatasetToKB(data);
  },

  async delete(ids: string[]): Promise<void> {
    await apiRequest('/datasets', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },

  async listDocuments(datasetId: string, params: ListDocParams = {}): Promise<ListDocResult> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.keywords) qs.set('keywords', params.keywords);
    if (params.orderby) qs.set('orderby', params.orderby);
    if (params.desc !== undefined) qs.set('desc', String(params.desc));
    params.run?.forEach(r => qs.append('run', r));
    const query = qs.toString();
    const { data } = await apiRequest<{ docs: RagflowDocument[]; total: number }>(
      `/datasets/${datasetId}/documents${query ? `?${query}` : ''}`,
    );
    const docs = data?.docs ?? [];
    return {
      items: docs.map(d => mapDocumentToUI(d, datasetId)),
      total: data?.total ?? docs.length,
    };
  },

  async getDatasetRaw(datasetId: string): Promise<RagflowDataset> {
    const { data } = await apiRequest<RagflowDataset>(`/datasets/${datasetId}`);
    return data;
  },

  async uploadDocuments(
    datasetId: string,
    files: File[],
    options?: { chunkMethod?: string; parserConfig?: Record<string, unknown> },
  ): Promise<Document[]> {
    const form = new FormData();
    files.forEach(f => form.append('file', f));
    if (options?.parserConfig) {
      form.append('parser_config', JSON.stringify(options.parserConfig));
    }
    if (options?.chunkMethod) {
      form.append('chunk_method', options.chunkMethod);
    }
    const data = await apiUpload<RagflowDocument[] | RagflowDocument>(
      `/datasets/${datasetId}/documents`,
      form,
    );
    const list = Array.isArray(data) ? data : [data];
    return list.map(d => mapDocumentToUI(d, datasetId));
  },

  async updateDocument(
    datasetId: string,
    documentId: string,
    body: { chunk_method?: string; parser_config?: Record<string, unknown> },
  ): Promise<Document> {
    const { data } = await apiRequest<RagflowDocument>(
      `/datasets/${datasetId}/documents/${documentId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return mapDocumentToUI(data, datasetId);
  },

  async uploadFromUrl(datasetId: string, name: string, url: string): Promise<Document> {
    const form = new FormData();
    form.append('name', name);
    form.append('url', url);
    const data = await apiUpload<RagflowDocument | RagflowDocument[]>(
      `/datasets/${datasetId}/documents?type=web`,
      form,
    );
    const doc = Array.isArray(data) ? data[0] : data;
    return mapDocumentToUI(doc, datasetId);
  },

  async deleteDocuments(datasetId: string, ids: string[]): Promise<number> {
    const { data } = await apiRequest<{ deleted: number }>(
      `/datasets/${datasetId}/documents`,
      { method: 'DELETE', body: JSON.stringify({ ids }) },
    );
    return data?.deleted ?? ids.length;
  },

  async parseDocuments(datasetId: string, documentIds: string[]): Promise<{ success_count: number }> {
    const { data } = await apiRequest<{ success_count: number; errors?: string[] }>(
      `/datasets/${datasetId}/documents/parse`,
      { method: 'POST', body: JSON.stringify({ document_ids: documentIds }) },
    );
    return { success_count: data?.success_count ?? 0 };
  },

  async stopDocuments(datasetId: string, documentIds: string[]): Promise<void> {
    await apiRequest(`/datasets/${datasetId}/documents/stop`, {
      method: 'POST',
      body: JSON.stringify({ document_ids: documentIds }),
    });
  },

  async listChunks(
    datasetId: string,
    documentId: string,
    params: { page?: number; page_size?: number; keywords?: string } = {},
  ): Promise<{ items: Chunk[]; total: number }> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.keywords) qs.set('keywords', params.keywords);
    const query = qs.toString();
    const { data } = await apiRequest<{ chunks: RagflowChunk[]; total: number }>(
      `/datasets/${datasetId}/documents/${documentId}/chunks${query ? `?${query}` : ''}`,
    );
    const chunks = data?.chunks ?? [];
    const pageOffset = ((params.page ?? 1) - 1) * (params.page_size ?? 100);
    return {
      items: chunks.map((c, i) => mapChunkToUI(c, i, pageOffset)),
      total: data?.total ?? chunks.length,
    };
  },

  async searchDataset(datasetId: string, params: SearchParams): Promise<SearchResult> {
    const { data } = await apiRequest<{ chunks: RagflowSearchChunk[]; total: number }>(
      `/datasets/${datasetId}/search`,
      {
        method: 'POST',
        body: JSON.stringify({
          question: params.question,
          top_k: params.top_k ?? 10,
          similarity_threshold: params.similarity_threshold ?? 0.2,
          vector_similarity_weight: params.vector_similarity_weight ?? 0.3,
          keyword: params.keyword ?? false,
          use_kg: params.use_kg ?? false,
          ...(params.rerank_id ? { rerank_id: params.rerank_id } : {}),
          page: params.page ?? 1,
          size: params.size ?? 10,
        }),
      },
    );
    const chunks = data?.chunks ?? [];
    return {
      hits: chunks.map((c, i) => mapSearchHitToFusion(c, i + 1)),
      total: data?.total ?? chunks.length,
      rawChunks: chunks,
    };
  },

  async getIngestions(
    datasetId: string,
    params: { page?: number; page_size?: number; log_type?: 'dataset' | 'file' } = {},
  ) {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    if (params.log_type) qs.set('log_type', params.log_type);
    const query = qs.toString();
    const { data } = await apiRequest<{ logs: RagflowIngestionLog[]; total: number }>(
      `/datasets/${datasetId}/ingestions${query ? `?${query}` : ''}`,
    );
    const logs = data?.logs ?? [];
    return {
      items: logs.map(mapIngestionLogToUI),
      total: data?.total ?? logs.length,
    };
  },

  async getIngestionSummary(datasetId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/datasets/${datasetId}/ingestions/summary`,
    );
    return data;
  },

  async traceIndex(datasetId: string, type: 'graph' | 'raptor' | 'mindmap') {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/datasets/${datasetId}/index?type=${type}`,
    );
    return data;
  },

  async runIndex(datasetId: string, type: 'graph' | 'raptor' | 'mindmap') {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/datasets/${datasetId}/index?type=${type}`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    return data;
  },

  async traceRag3Index(datasetId: string, type: 'pageindex' | 'wiki') {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/index?type=${type}`,
    );
    return data;
  },

  async runRag3Index(
    datasetId: string,
    type: 'pageindex' | 'wiki',
    docIds?: string[],
  ) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/index?type=${type}`,
      {
        method: 'POST',
        body: JSON.stringify(docIds?.length ? { doc_ids: docIds } : {}),
      },
    );
    return data;
  },

  async listTags(datasetId: string): Promise<string[]> {
    const { data } = await apiRequest<string[] | Record<string, string[]>>(
      `/datasets/${datasetId}/tags`,
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.keys(data);
    return [];
  },

  chunkImageUrl(imageId: string, cacheBust?: string | number) {
    const base = apiUrl(`/documents/images/${imageId}`);
    return cacheBust ? `${base}?_t=${cacheBust}` : base;
  },

  previewUrl(docId: string) {
    return apiUrl(documentPreviewPath(docId));
  },

  downloadUrl(docId: string) {
    return apiUrl(documentDownloadPath(docId));
  },

  async fetchDocumentPreview(docId: string): Promise<Blob> {
    const auth = getStoredAuth();
    const res = await fetch(apiUrl(documentPreviewPath(docId)), {
      headers: auth ? { Authorization: auth } : {},
    });
    if (!res.ok) throw new Error(`预览失败 (${res.status})`);
    return res.blob();
  },

  async getChunk(datasetId: string, documentId: string, chunkId: string): Promise<Chunk> {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
    );
    return mapChunkToUI(normalizeChunkDetail(data), 0);
  },

  async createChunk(
    datasetId: string,
    documentId: string,
    body: { content: string; important_keywords?: string[] },
  ): Promise<Chunk> {
    const { data } = await apiRequest<{ chunk: RagflowChunk }>(
      `/datasets/${datasetId}/documents/${documentId}/chunks`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    const raw = data?.chunk;
    if (!raw?.id) throw new Error('创建分块失败');
    return mapChunkToUI(raw, 0);
  },

  async updateChunk(
    datasetId: string,
    documentId: string,
    chunkId: string,
    body: { content?: string; available?: boolean; important_keywords?: string[] },
  ): Promise<void> {
    await apiRequest(
      `/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  },

  async deleteChunks(datasetId: string, documentId: string, chunkIds: string[]): Promise<void> {
    await apiRequest(`/datasets/${datasetId}/documents/${documentId}/chunks`, {
      method: 'DELETE',
      body: JSON.stringify({ chunk_ids: chunkIds }),
    });
  },

  async switchChunkAvailability(
    datasetId: string,
    documentId: string,
    chunkIds: string[],
    available: boolean,
  ): Promise<void> {
    await apiRequest(`/datasets/${datasetId}/documents/${documentId}/chunks`, {
      method: 'PATCH',
      body: JSON.stringify({ chunk_ids: chunkIds, available }),
    });
  },

  async listSorted(
    sortBy: string,
    desc: boolean,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<ListKbResult> {
    return kbApi.list({
      page,
      page_size: pageSize,
      name: search.trim() || undefined,
      orderby: sortKeyToOrderby(sortBy),
      desc,
    });
  },
};
