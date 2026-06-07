/**
 * RAG 3.0 API 客户端 — 逐步替换 *Mock.ts
 * 开发代理: vite.config.ts → http://localhost:9380
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/${API_VERSION}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json?.message ?? res.statusText, res.status, json?.code);
  }
  if (json?.code !== undefined && json.code !== 0) {
    throw new ApiError(json?.message ?? 'API error', res.status, json.code);
  }
  return (json?.data ?? json) as T;
}

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

/** 是否使用真实 API（环境变量开关，默认 mock） */
export const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';
