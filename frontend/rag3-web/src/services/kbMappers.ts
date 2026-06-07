import type { Chunk, ContentType, Document, KBStatus, KnowledgeBase, ParseStatus } from '../types';
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
  progress?: number;
  progress_msg?: string;
  process_begin_at?: string;
  process_duration?: number;
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
  if (ts && ts > 0) {
    const ms = ts < 1e12 ? ts * 1000 : ts;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
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
    progress: typeof doc.progress === 'number' ? doc.progress : undefined,
    progress_msg: doc.progress_msg?.trim() || undefined,
    process_begin_at: doc.process_begin_at,
    process_duration: doc.process_duration,
  };
}

/** RAGFlow POST /api/v1/datasets 请求体（对齐 CreateDatasetReq） */
export function mapCreateFormToPayload(form: KBCreateForm) {
  const chunkMethod = CHUNK_STRATEGY_TO_METHOD[form.chunkStrategy] || 'naive';
  const description = form.description.trim();

  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    permission: form.visibility,
    chunk_method: chunkMethod,
    // language 非顶层字段，走 ext（与上游 datasets 创建对话框一致）
    ext: {
      language: form.language === '英文' ? 'English' : 'Chinese',
    },
  };

  if (description) payload.description = description;

  // avatar 须为 data:image/{jpeg,png};base64,...；emoji 仅 UI 展示，勿提交
  // embedding_model 须为 model@provider；无效格式时省略，使用租户默认 embd_id
  const emb = form.embeddingModel?.trim();
  if (emb && emb.includes('@')) {
    payload.embedding_model = emb;
  }

  if (form.enableGraphRAG) {
    payload.parser_config = {
      graphrag: { use_graphrag: true },
    };
  }

  return payload;
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

export interface RagflowChunk {
  id: string;
  content?: string;
  content_with_weight?: string;
  document_id?: string;
  docnm_kwd?: string;
  important_keywords?: string[];
  available?: boolean;
  positions?: number[][];
  position_int?: number[][];
  image_id?: string;
  img_id?: string;
  doc_type_kwd?: string;
}

export interface RagflowSearchChunk {
  chunk_id?: string;
  id?: string;
  content_with_weight?: string;
  content?: string;
  docnm_kwd?: string;
  document_name?: string;
  similarity?: number;
  vector_similarity?: number;
  term_similarity?: number;
}

export interface RagflowIngestionLog {
  id: string;
  operation_status?: string;
  progress?: number;
  progress_msg?: string;
  create_date?: string;
  update_date?: string;
  document_name?: string;
  file_name?: string;
  type?: string;
}

/** 解析状态 UI 标签（API 模式文档表） */
export const PARSE_STATUS_UI: Record<ParseStatus, { label: string; color: string }> = {
  pending: { label: '待解析', color: 'bg-gray-100 text-gray-600' },
  parsing: { label: '解析中', color: 'bg-blue-100 text-blue-700' },
  parsed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
};

function normalizePositions(chunk: RagflowChunk): number[][] | undefined {
  const raw = chunk.positions ?? chunk.position_int;
  if (!Array.isArray(raw) || !raw.length) return undefined;
  return raw.filter(p => Array.isArray(p) && p.length >= 5) as number[][];
}

export function mapChunkToUI(chunk: RagflowChunk, index: number, pageOffset = 0): Chunk {
  const html = chunk.content_with_weight || '';
  const content = chunk.content || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || html;
  const positions = normalizePositions(chunk);
  const page = positions?.[0]?.[0] ?? 1;
  const keywords = chunk.important_keywords?.filter(Boolean) ?? [];
  const sectionTitle = keywords[0] || chunk.docnm_kwd || `Chunk ${pageOffset + index + 1}`;
  const docType = (chunk.doc_type_kwd || '').toLowerCase();
  return {
    chunk_id: chunk.id,
    chunk_index: pageOffset + index + 1,
    content_preview: content,
    content_html: html || undefined,
    content_type: docType === 'image' ? 'image' : docType === 'table' ? 'table' : inferContentType(content),
    chunk_strategy: '通用分块',
    token_count: Math.max(1, Math.round(content.length / 2)),
    page_number: page,
    section_title: sectionTitle,
    acl_level: chunk.available === false ? 'restricted' : 'internal',
    available: chunk.available !== false,
    image_id: chunk.image_id || chunk.img_id || undefined,
    doc_type_kwd: chunk.doc_type_kwd,
    positions,
  };
}

/** GET /chunks/:id 原始字段归一化 */
export function normalizeChunkDetail(raw: Record<string, unknown>): RagflowChunk {
  const availableInt = raw.available_int ?? raw.available;
  return {
    id: String(raw.id ?? raw.chunk_id ?? ''),
    content: String(raw.content ?? raw.content_with_weight ?? ''),
    document_id: raw.document_id as string | undefined,
    docnm_kwd: raw.docnm_kwd as string | undefined,
    important_keywords: (raw.important_keywords ?? raw.important_kwd) as string[] | undefined,
    available:
      availableInt === undefined
        ? true
        : typeof availableInt === 'boolean'
          ? availableInt
          : Number(availableInt) !== 0,
    positions: (raw.positions ?? raw.position_int) as number[][] | undefined,
    image_id: (raw.image_id ?? raw.img_id) as string | undefined,
    doc_type_kwd: raw.doc_type_kwd as string | undefined,
    content_with_weight: raw.content_with_weight as string | undefined,
  };
}

function inferContentType(content: string): ContentType {
  if (content.includes('|') && content.split('\n').some(l => l.includes('|'))) return 'table';
  if (/```|function\s|class\s|import\s/.test(content)) return 'code';
  if (/\$.*\$|\\\(|\\\[/.test(content)) return 'formula';
  if (content.length < 80 && !content.includes('\n')) return 'text';
  return 'text';
}

export function mapSearchHitToFusion(chunk: RagflowSearchChunk, rank: number) {
  const score = chunk.similarity ?? chunk.vector_similarity ?? 0;
  return {
    rank,
    chunk_id: chunk.chunk_id || chunk.id || '',
    doc_name: chunk.docnm_kwd || chunk.document_name || '—',
    score,
    snippet: (chunk.content_with_weight || chunk.content || '').slice(0, 200),
    channel: 'vector' as const,
  };
}

export function mapIngestionLogToUI(log: RagflowIngestionLog) {
  const status = (log.operation_status || 'unknown').toLowerCase();
  const statusColor =
    status.includes('done') || status.includes('success')
      ? 'text-green-600'
      : status.includes('fail') || status.includes('error')
        ? 'text-red-600'
        : status.includes('run')
          ? 'text-blue-600'
          : 'text-gray-600';
  return {
    id: log.id,
    name: log.document_name || log.file_name || log.type || '—',
    status: log.operation_status || '—',
    statusColor,
    progress: log.progress ?? 0,
    message: log.progress_msg || '—',
    time: log.update_date || log.create_date || '—',
  };
}

export function mapSettingsToUpdatePayload(patch: {
  name?: string;
  description?: string;
  permission?: 'me' | 'team';
  chunk_method?: string;
  embedding_model?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (patch.name?.trim()) payload.name = patch.name.trim();
  if (patch.description !== undefined) payload.description = patch.description.trim();
  if (patch.permission) payload.permission = patch.permission;
  if (patch.chunk_method) payload.chunk_method = patch.chunk_method;
  if (patch.embedding_model?.includes('@')) payload.embedding_model = patch.embedding_model;
  return payload;
}

/** 文档预览/下载 URL（相对 /api/v1） */
export function documentPreviewPath(docId: string) {
  return `/documents/${docId}/preview`;
}

export function documentDownloadPath(docId: string) {
  return `/documents/${docId}/download`;
}
