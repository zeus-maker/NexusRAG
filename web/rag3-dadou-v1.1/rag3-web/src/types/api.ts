// API响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SSEEvent {
  type: 'token' | 'citation' | 'routing' | 'confidence' | 'done' | 'error';
  data: unknown;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SSEError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}