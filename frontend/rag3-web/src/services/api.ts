/**
 * RAG 3.0 扩展 API + 重导出 HTTP 基座
 */
import { apiRequest, useRealApi } from './http';

export { ApiError, useRealApi } from './http';
export { kbApi } from './kbApi';
export { login, logout } from './auth';

/* ── RAG3 扩展 API ── */

export interface Rag3ClassifyResult {
  query: string;
  classification: {
    query_tier: string;
    doc_type: string;
    user_intent: string;
    security_tier: string;
    confidence: number;
  };
  decision: {
    primary: string;
    auxiliary: string[];
    use_fusion: boolean;
    skip_retrieval: boolean;
    reason: string;
  };
  pipeline_ids: string[];
}

export interface Rag3FusionHit {
  rank: number;
  chunk_id: string;
  doc_name: string;
  wrrf_score: number;
  snippet: string;
  sources: string[];
}

export interface Rag3QueryResult {
  query: string;
  kb_id: string;
  pipelines: string[];
  fusion: Rag3FusionHit[];
  classification: string;
  routing_reason: string;
  latency_ms: number;
}

export const rag3Api = {
  health: () => request<{ status: string; version: string }>('/rag3/health'),

  classify: (query: string, kbId?: string, userRoles?: string[]) =>
    request<Rag3ClassifyResult>('/rag3/classify', {
      method: 'POST',
      body: JSON.stringify({ query, kb_id: kbId, user_roles: userRoles }),
    }),

  query: (query: string, kbId: string, options?: { use_rerank?: boolean; top_k?: number }) =>
    request<Rag3QueryResult>('/rag3/query', {
      method: 'POST',
      body: JSON.stringify({ query, kb_id: kbId, ...options }),
    }),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await apiRequest<T>(path, init);
  return data;
}
