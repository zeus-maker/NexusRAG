import { apiRequest } from './http';

export const hubApi = {
  async listPageIndexDocuments(datasetId: string) {
    const { data } = await apiRequest<{
      stats: Record<string, number>;
      documents: Array<Record<string, unknown>>;
      trace: Record<string, unknown>;
    }>(`/rag3/datasets/${datasetId}/pageindex/documents`);
    return data;
  },

  async getPageIndexTree(datasetId: string, docId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/pageindex/documents/${docId}/tree`,
    );
    return data;
  },

  async searchPageIndex(
    datasetId: string,
    query: string,
    options?: { topK?: number; docId?: string; mode?: string },
  ) {
    const { data } = await apiRequest<{
      hits: Array<Record<string, unknown>>;
      total: number;
      total_ms?: number;
      mode?: string;
      docs_searched?: number;
      steps?: Array<Record<string, unknown>>;
    }>(
      `/rag3/datasets/${datasetId}/pageindex/search`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          top_k: options?.topK ?? 10,
          doc_id: options?.docId,
          mode: options?.mode,
        }),
      },
    );
    return data;
  },

  async getPageIndexSettings(datasetId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/pageindex/settings`,
    );
    return data;
  },

  async savePageIndexSettings(datasetId: string, settings: Record<string, unknown>) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/pageindex/settings`,
      { method: 'PUT', body: JSON.stringify(settings) },
    );
    return data;
  },

  async getPageIndexAnalytics(datasetId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/pageindex/analytics`,
    );
    return data;
  },

  async listWikiEntries(datasetId: string) {
    const { data } = await apiRequest<{
      entries: Array<Record<string, unknown>>;
      source_documents: Array<Record<string, unknown>>;
      stats: Record<string, number>;
      trace: Record<string, unknown>;
    }>(`/rag3/datasets/${datasetId}/wiki/entries`);
    return data;
  },

  async getWikiSettings(datasetId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/wiki/settings`,
    );
    return data;
  },

  async saveWikiSettings(datasetId: string, settings: Record<string, unknown>) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/wiki/settings`,
      { method: 'PUT', body: JSON.stringify(settings) },
    );
    return data;
  },

  async getWikiAnalytics(datasetId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/rag3/datasets/${datasetId}/wiki/analytics`,
    );
    return data;
  },

  async searchWiki(datasetId: string, query: string, topK = 10) {
    const { data } = await apiRequest<{
      hits: Array<Record<string, unknown>>;
      total: number;
      total_ms?: number;
      query?: string;
    }>(
      `/rag3/datasets/${datasetId}/wiki/search`,
      { method: 'POST', body: JSON.stringify({ query, top_k: topK }) },
    );
    return data;
  },

  async getKnowledgeGraph(datasetId: string) {
    const { data } = await apiRequest<{ graph?: { nodes?: unknown[]; edges?: unknown[] }; mind_map?: unknown }>(
      `/datasets/${datasetId}/graph`,
    );
    return data;
  },
};
