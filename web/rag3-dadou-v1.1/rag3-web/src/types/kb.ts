// 知识库相关类型
export interface KnowledgeBase {
  kb_id: string;
  name: string;
  description?: string;
  language: string;
  chunk_strategy: string;
  embedding_model: string;
  llm_model: string;
  reranker_model?: string;
  status: 'active' | 'indexing' | 'error';
  document_count: number;
  chunk_count: number;
  storage_size: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseStats {
  document_count: number;
  chunk_count: number;
  storage_size: number;
  parse_quality: number;
  query_trend: number[];
  document_type_distribution: Record<string, number>;
  recent_uploads: Document[];
  top_queries: QueryStats[];
  index_statuses: IndexStatus[];
}

export interface IndexStatus {
  index_type: 'vector' | 'fulltext' | 'page_index' | 'graph' | 'wiki';
  total: number;
  completed: number;
  health_score: number;
  last_updated: string;
  failed_docs: FailedDocument[];
}

export interface FailedDocument {
  doc_id: string;
  doc_name: string;
  index_type: string;
  error_reason: string;
}

export interface Document {
  doc_id: string;
  kb_id: string;
  name: string;
  file_type: string;
  file_size: number;
  status: 'uploading' | 'parsing' | 'parsed' | 'failed';
  parse_quality?: number;
  chunk_count?: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface Chunk {
  chunk_id: string;
  doc_id: string;
  chunk_index: number;
  content: string;
  content_preview: string;
  content_type: 'text' | 'table' | 'image_description' | 'formula' | 'code';
  chunk_strategy: string;
  token_count: number;
  page_number: number;
  section_title: string;
  acl_tags: AclTag[];
  bbox_coordinates?: number[];
}

export interface AclTag {
  key: string;
  value: string;
}

export interface QueryStats {
  query: string;
  count: number;
}

export interface ParseResult {
  doc_id: string;
  quality_score: number;
  sections: Section[];
  tables: Table[];
  structured_data: Record<string, unknown>;
}

export interface Section {
  title: string;
  level: number;
  page_number: number;
  content: string;
}

export interface Table {
  page_number: number;
  bbox: number[];
  rows: string[][];
  headers: string[];
}