export type KBStatus = 'active' | 'indexing' | 'archived';
export type ParseStatus = 'pending' | 'parsing' | 'parsed' | 'failed';
export type EvalStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ABTestStatus = 'draft' | 'running' | 'completed' | 'stopped';
export type UserStatus = 'active' | 'disabled' | 'locked';
export type ContentType = 'text' | 'table' | 'image' | 'formula' | 'code';
export type IndexStatus = 'running' | 'completed' | 'failed' | 'paused' | 'not_started';

export interface KnowledgeBase {
  kb_id: string;
  name: string;
  description: string;
  icon: string;
  embedding_model: string;
  chunk_strategy: string;
  reranker_model: string;
  llm_model: string;
  language: string;
  status: KBStatus;
  doc_count: number;
  chunk_count: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  doc_id: string;
  kb_id: string;
  original_name: string;
  file_type: string;
  file_size: number;
  parse_status: ParseStatus;
  parse_quality_score: number;
  chunk_count: number;
  page_count: number;
  tags: string[];
  uploaded_by: string;
  uploaded_at: string;
}

export interface Chunk {
  chunk_id: string;
  chunk_index: number;
  content_preview: string;
  content_type: ContentType;
  chunk_strategy: string;
  token_count: number;
  page_number: number;
  section_title: string;
  acl_level: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: number;
  confidence_level?: 'high' | 'medium' | 'low';
  routing_tier?: string;
  channels?: string[];
  is_streaming?: boolean;
  created_at: string;
  latency_ms?: number;
}

export interface Citation {
  index: number;
  doc_name: string;
  page_number: number;
  section: string;
  snippet: string;
  relevance_score: number;
}

export interface Conversation {
  conv_id: string;
  title: string;
  kb_ids: string[];
  message_count: number;
  created_at: string;
  last_message?: string;
}

export interface EvalRun {
  run_id: string;
  name: string;
  kb_id: string;
  status: EvalStatus;
  scores: Record<string, number>;
  baseline_scores: Record<string, number>;
  test_set_size: number;
  started_at: string;
  completed_at: string | null;
  duration_min?: number;
}

export interface ABTest {
  test_id: string;
  name: string;
  status: ABTestStatus;
  variant_a_name: string;
  variant_b_name: string;
  traffic_ratio: [number, number];
  metrics_a: Record<string, number>;
  metrics_b: Record<string, number>;
  samples_a: number;
  samples_b: number;
  p_value: number | null;
  started_at: string;
  winner?: 'a' | 'b' | null;
}

export interface User {
  user_id: string;
  display_name: string;
  email: string;
  department: string;
  role: string;
  status: UserStatus;
  last_login: string;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  user_name: string;
  action: string;
  resource: string;
  ip: string;
  result: 'success' | 'failed';
}

export interface IndexStatusInfo {
  pipeline: string;
  label: string;
  indexed: number;
  total: number;
  health: number;
  status: IndexStatus;
  last_updated: string;
  failed_count: number;
}

export interface MonitorMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  positive: boolean;
}
