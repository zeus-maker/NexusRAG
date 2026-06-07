// 对话相关类型
export interface Conversation {
  conv_id: string;
  kb_ids: string[];
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  msg_id: string;
  conv_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  confidence?: ConfidenceInfo;
  routing_info?: RoutingInfo;
  feedback_status?: 'none' | 'thumbs_up' | 'thumbs_down';
  is_streaming?: boolean;
  created_at: string;
}

export interface Citation {
  index: number;
  doc_id: string;
  doc_name: string;
  chunk_id: string;
  section: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
  bbox_coordinates?: number[];
}

export interface ConfidenceInfo {
  score: number;
  level: 'high' | 'medium' | 'low';
  factors: {
    retrieval_quality: number;
    generation_consistency: number;
    source_authority: number;
    cross_encoder_score: number;
  };
}

export interface RoutingInfo {
  tier: 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';
  classified_tier: string;
  document_type?: string;
  user_intent?: string;
  security_level?: string;
  primary_channel: string;
  secondary_channels: string[];
  model: string;
}

export interface Feedback {
  msg_id: string;
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'correction';
  reason?: string;
  correction?: string;
  citation_correction?: string;
}

export interface QueryRewriteResult {
  original: string;
  precise: string;
  generalized: string;
  cross_document: string;
}

export interface MultiChannelResult {
  channel_name: string;
  results: SearchResult[];
  latency: number;
}

export interface SearchResult {
  chunk_id: string;
  doc_id: string;
  doc_name: string;
  score: number;
  snippet: string;
  page_number: number;
}