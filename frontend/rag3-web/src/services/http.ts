/**
 * RAGFlow HTTP 客户端基座
 * 开发代理: vite.config.ts 将 /api/* 原样转发至 http://localhost:9380/api/*
 */

import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

export const AUTH_STORAGE_KEY = 'rag3-authorization';
export const USER_STORAGE_KEY = 'rag3-user';

/** 登录/登出后派发，供 useApiMode 刷新 */
export const AUTH_CHANGED_EVENT = 'rag3-auth-changed';

/** 运行时判断是否对接真实 API（含已登录 token） */
export function getRealApiMode(): boolean {
  if (import.meta.env.VITE_USE_REAL_API === 'true') return true;
  if (import.meta.env.VITE_RAGFLOW_AUTH_TOKEN) return true;
  return !!getStoredAuth();
}

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

/**
 * 模块加载时的 API 模式快照（非响应式）。
 * 组件内请用 useApiMode()，会在登录后自动切换。
 */
export const useRealApi = getRealApiMode();

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
  notifyAuthChanged();
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
  notifyAuthChanged();
}

/** 响应式 API 模式：登录后自动从 mock 切到真实接口 */
export function useApiMode(): boolean {
  const [apiMode, setApiMode] = useState(getRealApiMode);
  useEffect(() => {
    const sync = () => setApiMode(getRealApiMode());
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return apiMode;
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

const LEGACY_API_BASE = import.meta.env.VITE_LEGACY_API_BASE ?? '/v1';

function buildLegacyUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${LEGACY_API_BASE}${normalized}`;
}

/** RAGFlow 旧版 Web API（/v1/llm/* 等，与 /api/v1 并列） */
export async function legacyApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; total?: number }> {
  const res = await fetch(buildLegacyUrl(path), {
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
