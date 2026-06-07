import type { Document, KBStatus, KnowledgeBase, ParseStatus } from '../types';
import type { KBCreateForm } from '../components/KBCreateDialog';

/** RAGFlow Dataset API 响应形状（精简） */
export interface RagflowDataset {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  embedding_model?: string;
  embd_id?: string;
  chunk_method?: string;
  parser_id?: string;
  document_count?: number;
  doc_num?: number;
  chunk_count?: number;
  chunk_num?: number;
  token_num?: number;
  size?: number;
  language?: string;
  status?: string;
  create_time?: number;
  update_time?: number;
  create_date?: string;
  update_date?: string;
  parser_config?: { llm_id?: string };
}

export interface RagflowDocument {
  id: string;
  name: string;
  dataset_id?: string;
  kb_id?: string;
  chunk_count?: number;
  chunk_num?: number;
  size?: number;
  type?: string;
  suffix?: string;
  run?: string;
  create_time?: number;
  create_date?: string;
  update_date?: string;
  created_by?: string;
  nickname?: string;
}

const CHUNK_METHOD_LABELS: Record<string, string> = {
  naive: '通用分块',
  laws: 'Laws（法律）',
  table: '表格优先',
  book: '书籍分块',
  paper: '论文分块',
  qa: '问答分块',
  manual: '手册分块',
};

const CHUNK_STRATEGY_TO_METHOD: Record<string, string> = {
  '通用分块': 'naive',
  'Laws（法律）': 'laws',
  '表格优先': 'table',
  '代码感知': 'naive',
  '书籍分块': 'book',
};

const RUN_TO_PARSE: Record<string, ParseStatus> = {
  '0': 'pending',
  UNSTART: 'pending',
  '1': 'parsing',
  RUNNING: 'parsing',
  '2': 'pending',
  CANCEL: 'pending',
  '3': 'parsed',
  DONE: 'parsed',
  '4': 'failed',
  FAIL: 'failed',
};

function tsToIso(ts?: number, dateStr?: string): string {
  if (dateStr) return new Date(dateStr).toISOString();
  if (ts) return new Date(ts).toISOString();
  return new Date().toISOString();
}

function inferKbStatus(ds: RagflowDataset): KBStatus {
  // RAGFlow 无 archived；有 indexing 任务时标为 indexing
  if (ds.status && ds.status !== '1') return 'archived';
  return 'active';
}

function emojiFromName(name: string, avatar?: string): string {
  if (avatar && !avatar.startsWith('data:')) return avatar;
  const icons = ['📚', '⚖️', '📊', '🔬', '📋', '📖', '🏗️'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return icons[Math.abs(hash) % icons.length];
}

export function mapDatasetToKB(ds: RagflowDataset): KnowledgeBase {
  const method = ds.chunk_method || ds.parser_id || 'naive';
  return {
    kb_id: ds.id,
    name: ds.name,
    description: ds.description || '',
    icon: emojiFromName(ds.name, ds.avatar),
    embedding_model: ds.embedding_model || ds.embd_id || '—',
    chunk_strategy: CHUNK_METHOD_LABELS[method] || method,
    reranker_model: '—',
    llm_model: ds.parser_config?.llm_id || '—',
    language: ds.language === 'English' ? '英文' : '中文',
    status: inferKbStatus(ds),
    doc_count: ds.document_count ?? ds.doc_num ?? 0,
    chunk_count: ds.chunk_count ?? ds.chunk_num ?? 0,
    total_size_bytes: ds.size ?? 0,
    created_at: tsToIso(ds.create_time, ds.create_date),
    updated_at: tsToIso(ds.update_time, ds.update_date),
  };
}

export function mapDocumentToUI(doc: RagflowDocument, kbId: string): Document {
  const run = doc.run ?? 'UNSTART';
  const ext = (doc.suffix || doc.type || doc.name.split('.').pop() || '').toUpperCase();
  return {
    doc_id: doc.id,
    kb_id: doc.dataset_id || doc.kb_id || kbId,
    original_name: doc.name,
    file_type: ext.length <= 5 ? ext : 'FILE',
    file_size: doc.size ?? 0,
    parse_status: RUN_TO_PARSE[run] ?? 'pending',
    parse_quality_score: RUN_TO_PARSE[run] === 'parsed' ? 90 : 0,
    chunk_count: doc.chunk_count ?? doc.chunk_num ?? 0,
    page_count: 0,
    tags: [],
    uploaded_by: doc.nickname || doc.created_by || '—',
    uploaded_at: tsToIso(doc.create_time, doc.create_date),
  };
}

export function mapCreateFormToPayload(form: KBCreateForm) {
  const chunkMethod = CHUNK_STRATEGY_TO_METHOD[form.chunkStrategy] || 'naive';
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    avatar: form.icon,
    language: form.language === '英文' ? 'English' : 'Chinese',
    permission: form.visibility,
    chunk_method: chunkMethod,
    parser_config: {
      llm_id: form.llmModel,
    },
  };
}

export function sortKeyToOrderby(sortBy: string): string {
  const map: Record<string, string> = {
    updated: 'update_time',
    name: 'name',
    docs: 'document_count',
    chunks: 'chunk_count',
  };
  return map[sortBy] || 'update_time';
}
