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
  /** RAGFlow 解析进度 0~1 */
  progress?: number;
  /** RAGFlow 解析进度/失败原因（多行，含 HH:MM:SS 时间戳） */
  progress_msg?: string;
  process_begin_at?: string;
  process_duration?: number;
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
  /** RAGFlow available_int：false 时不参与检索 */
  available?: boolean;
  /** 分块缩略图 ID */
  image_id?: string;
  /** text | table | image */
  doc_type_kwd?: string;
  /** PDF 锚点 [[page, left, right, top, bottom], ...] */
  positions?: number[][];
  /** 原始 HTML 内容（含表格/图片标签） */
  content_html?: string;
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
  trace?: Record<string, unknown>;
  feedback_status?: string;
}

export interface Citation {
  index: number;
  doc_name: string;
  page_number: number;
  section: string;
  snippet: string;
  relevance_score: number;
  doc_id?: string;
  chunk_id?: string;
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
  kb_name?: string;
  dataset_id?: string;
  dataset_name?: string;
  status: EvalStatus;
  scores: Record<string, number>;
  baseline_scores: Record<string, number>;
  metrics_summary?: Record<string, number>;
  test_set_size: number;
  completed_cases?: number;
  progress?: number;
  eta_seconds?: number | null;
  error_message?: string;
  diagnosis?: string;
  zero_retrieval_cases?: number;
  evaluation_type?: string;
  metrics_requested?: string[];
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
