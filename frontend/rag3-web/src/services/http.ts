/**
 * RAGFlow HTTP 客户端基座
 * 开发代理: vite.config.ts → http://localhost:9380
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

export const AUTH_STORAGE_KEY = 'rag3-authorization';
export const USER_STORAGE_KEY = 'rag3-user';

/** 是否对接真实 RAGFlow API */
export const useRealApi =
  import.meta.env.VITE_USE_REAL_API === 'true' ||
  !!import.meta.env.VITE_RAGFLOW_AUTH_TOKEN;

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

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message?: string;
  total?: number;
}

export function getStoredAuth(): string {
  if (typeof localStorage === 'undefined') return '';
  return (
    import.meta.env.VITE_RAGFLOW_AUTH_TOKEN ||
    localStorage.getItem(AUTH_STORAGE_KEY) ||
    ''
  );
}

export function setStoredAuth(token: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
}

export function setStoredUser(user: { name: string; email: string; role: string }) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser(): { name: string; email: string; role: string } | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function buildUrl(path: string) {
  return `${API_BASE}/${API_VERSION}${path}`;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const auth = getStoredAuth();
  return {
    ...(auth ? { Authorization: auth } : {}),
    ...extra,
  };
}

/** 标准 JSON 请求（自动附带 Authorization） */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; total?: number }> {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: authHeaders({
      'Content-Type': 'application/json',
      ...init?.headers,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new ApiError(json?.message ?? res.statusText, res.status, json?.code);
  }
  if (json?.code !== undefined && json.code !== 0) {
    throw new ApiError(json?.message ?? 'API error', res.status, json.code);
  }
  return { data: (json?.data ?? json) as T, total: json?.total };
}

/** 登录等需读取响应头的请求 */
export async function apiRequestRaw<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; headers: Headers; status: number }> {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || (json?.code !== undefined && json.code !== 0)) {
    throw new ApiError(json?.message ?? res.statusText, res.status, json?.code);
  }
  return { data: json.data as T, headers: res.headers, status: res.status };
}

/** multipart 上传（不设置 Content-Type，由浏览器自动带 boundary） */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || (json?.code !== undefined && json.code !== 0)) {
    throw new ApiError(json?.message ?? res.statusText, res.status, json?.code);
  }
  return json.data as T;
}
