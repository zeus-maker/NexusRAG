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

  async searchPageIndex(datasetId: string, query: string, topK = 10) {
    const { data } = await apiRequest<{ hits: Array<Record<string, unknown>>; total: number }>(
      `/rag3/datasets/${datasetId}/pageindex/search`,
      { method: 'POST', body: JSON.stringify({ query, top_k: topK }) },
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

  async searchWiki(datasetId: string, query: string, topK = 10) {
    const { data } = await apiRequest<{ hits: Array<Record<string, unknown>>; total: number }>(
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
