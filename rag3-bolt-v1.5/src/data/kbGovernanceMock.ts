import { mockDocuments, mockIndexStatuses } from '../mockData';

export type PipelineStage = 'uploading' | 'parsing' | 'chunking' | 'indexing' | 'indexed' | 'failed';
export type FreshnessTier = 'realtime' | 'daily' | 'weekly' | 'monthly';
export type CertificationStatus = 'draft' | 'certified' | 'expired';
export type FailureStage = 'parse' | 'chunk' | 'vector' | 'pageindex' | 'graph' | 'wiki' | 'acl' | 'stale';

export interface KBGovernanceSummary {
  stale_count: number;
  pending_certification: number;
  parse_review_count: number;
  acl_anomaly_count: number;
}

export interface GovernedDocument {
  doc_id: string;
  original_name: string;
  pipeline_stage: PipelineStage;
  freshness_tier: FreshnessTier;
  certification_status: CertificationStatus;
  is_stale: boolean;
  source_modified_days_ago: number;
}

export interface KBHealthFailure {
  doc_id: string;
  doc_name: string;
  stage: FailureStage;
  reason: string;
  deep_link_page: string;
  deep_link_extra?: Record<string, unknown>;
}

export interface KBHealthScore {
  overall: number;
  dimensions: {
    vector: number;
    fulltext: number;
    pageindex: number;
    graph: number;
    wiki: number;
  };
}

export interface UploadQueueItem {
  name: string;
  size: string;
  progress: number;
  stage: PipelineStage;
}

export interface ProcessingLogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  type: string;
  source_record_id?: string;
  chunk_ids?: string;
  acl_version?: string;
  policy_version?: string;
  summary: string;
}

export interface StaleDocument {
  doc_id: string;
  name: string;
  tier: FreshnessTier;
  source_updated: string;
  cert_expires: string;
  certification_status: CertificationStatus;
}

export interface ChunkQualityMeta {
  chunk_id: string;
  heading_path: string;
  topical_purity: number;
  crosses_section: boolean;
  has_table_or_code: boolean;
  overlap_prev: number;
  overlap_next: number;
  excluded_from_retrieval: boolean;
}

const GOVERNED_DOCS: Record<string, Partial<GovernedDocument>> = {
  'doc-001': { pipeline_stage: 'indexed', freshness_tier: 'monthly', certification_status: 'certified', is_stale: false, source_modified_days_ago: 3 },
  'doc-002': { pipeline_stage: 'indexed', freshness_tier: 'weekly', certification_status: 'expired', is_stale: true, source_modified_days_ago: 90 },
  'doc-003': { pipeline_stage: 'chunking', freshness_tier: 'daily', certification_status: 'draft', is_stale: false, source_modified_days_ago: 1 },
  'doc-004': { pipeline_stage: 'failed', freshness_tier: 'daily', certification_status: 'draft', is_stale: false, source_modified_days_ago: 2 },
  'doc-005': { pipeline_stage: 'indexed', freshness_tier: 'monthly', certification_status: 'certified', is_stale: false, source_modified_days_ago: 14 },
  'doc-006': { pipeline_stage: 'indexed', freshness_tier: 'monthly', certification_status: 'certified', is_stale: false, source_modified_days_ago: 21 },
};

const CHUNK_QUALITY: ChunkQualityMeta[] = [
  { chunk_id: 'c-001', heading_path: '合同 > 第一条 定义', topical_purity: 0.92, crosses_section: false, has_table_or_code: false, overlap_prev: 0, overlap_next: 128, excluded_from_retrieval: false },
  { chunk_id: 'c-002', heading_path: '合同 > 第二条 权利义务', topical_purity: 0.88, crosses_section: false, has_table_or_code: false, overlap_prev: 128, overlap_next: 96, excluded_from_retrieval: false },
  { chunk_id: 'c-003', heading_path: '合同 > 第三条 价格与付款', topical_purity: 0.95, crosses_section: false, has_table_or_code: false, overlap_prev: 96, overlap_next: 0, excluded_from_retrieval: false },
  { chunk_id: 'c-004', heading_path: '合同 > 第五条 违约责任', topical_purity: 0.78, crosses_section: true, has_table_or_code: true, overlap_prev: 0, overlap_next: 64, excluded_from_retrieval: false },
  { chunk_id: 'c-005', heading_path: '合同 > 第八条 保密义务', topical_purity: 0.91, crosses_section: false, has_table_or_code: false, overlap_prev: 64, overlap_next: 0, excluded_from_retrieval: false },
];

export function getGovernanceSummary(_kbId: string): KBGovernanceSummary {
  return {
    stale_count: 12,
    pending_certification: 5,
    parse_review_count: 3,
    acl_anomaly_count: 1,
  };
}

export function getKBHealthScore(kbId: string): KBHealthScore {
  const weights = { vector: 0.25, fulltext: 0.15, pageindex: 0.25, graph: 0.2, wiki: 0.15 };
  const dims = {
    vector: mockIndexStatuses.find(s => s.pipeline === 'vector')?.health ?? 90,
    fulltext: mockIndexStatuses.find(s => s.pipeline === 'fulltext')?.health ?? 100,
    pageindex: mockIndexStatuses.find(s => s.pipeline === 'pageindex')?.health ?? 85,
    graph: mockIndexStatuses.find(s => s.pipeline === 'graph')?.health ?? 72,
    wiki: mockIndexStatuses.find(s => s.pipeline === 'wiki')?.health ?? 60,
  };
  const overall = Math.round(
    dims.vector * weights.vector +
    dims.fulltext * weights.fulltext +
    dims.pageindex * weights.pageindex +
    dims.graph * weights.graph +
    dims.wiki * weights.wiki
  );
  return { overall, dimensions: dims };
}

export function getGovernedDocuments(kbId: string): GovernedDocument[] {
  return mockDocuments
    .filter(d => d.kb_id === kbId)
    .map(d => {
      const g = GOVERNED_DOCS[d.doc_id] ?? {};
      const pipeline_stage: PipelineStage =
        g.pipeline_stage ??
        (d.parse_status === 'failed' ? 'failed' : d.parse_status === 'parsing' ? 'parsing' : d.parse_status === 'parsed' ? 'indexed' : 'parsing');
      return {
        doc_id: d.doc_id,
        original_name: d.original_name,
        pipeline_stage,
        freshness_tier: g.freshness_tier ?? 'monthly',
        certification_status: g.certification_status ?? 'draft',
        is_stale: g.is_stale ?? false,
        source_modified_days_ago: g.source_modified_days_ago ?? 7,
      };
    });
}

export function getKBHealthFailures(kbId: string): KBHealthFailure[] {
  return [
    { doc_id: 'doc-004', doc_name: '财务数据Q2.xlsx', stage: 'parse', reason: '表格解析失败', deep_link_page: 'kb-documents', deep_link_extra: { selectedKBId: kbId } },
    { doc_id: 'doc-002', doc_name: '2024合规审查报告.pdf', stage: 'stale', reason: '超期 90 天未认证', deep_link_page: 'kb-governance-stale', deep_link_extra: { selectedKBId: kbId } },
    { doc_id: 'doc-x1', doc_name: '复杂表格报告.pdf', stage: 'vector', reason: '嵌入请求超时', deep_link_page: 'kb-index-status', deep_link_extra: { selectedKBId: kbId } },
    { doc_id: 'doc-x2', doc_name: '扫描件合同.pdf', stage: 'pageindex', reason: 'LLM 建树超时', deep_link_page: 'pageindex-hub', deep_link_extra: { selectedKBId: kbId } },
    { doc_id: 'doc-x3', doc_name: '外部同步合同.pdf', stage: 'acl', reason: '源角色映射冲突', deep_link_page: 'kb-permissions', deep_link_extra: { selectedKBId: kbId } },
  ];
}

export function getStaleDocuments(_kbId: string): StaleDocument[] {
  return [
    { doc_id: 'doc-002', name: '2024合规审查报告.pdf', tier: 'weekly', source_updated: '90 天前', cert_expires: '已过期', certification_status: 'expired' },
    { doc_id: 'doc-s2', name: '采购政策 V3.docx', tier: 'daily', source_updated: '2 天前', cert_expires: '待认证', certification_status: 'draft' },
    { doc_id: 'doc-s3', name: '汇率说明表.xlsx', tier: 'realtime', source_updated: '3 小时前', cert_expires: '—', certification_status: 'draft' },
  ];
}

export function getUploadQueue(): UploadQueueItem[] {
  return [
    { name: '合同模板V6.pdf', size: '2.3 MB', progress: 100, stage: 'indexed' },
    { name: '审计报告.pdf', size: '5.0 MB', progress: 58, stage: 'parsing' },
    { name: '数据表.xlsx', size: '1.2 MB', progress: 22, stage: 'uploading' },
  ];
}

export function getProcessingLogs(_kbId: string): ProcessingLogEntry[] {
  return [
    { id: 'l1', time: '6/7 14:30', level: 'INFO', type: 'ACL', source_record_id: 'conf-8821', chunk_ids: 'c-12,c-13', acl_version: 'v3', policy_version: 'p20260607', summary: 'Confluence 权限投影完成' },
    { id: 'l2', time: '6/7 10:05', level: 'INFO', type: '索引', source_record_id: 'doc-556', summary: '向量索引完成 · 42 chunks' },
    { id: 'l3', time: '6/7 09:58', level: 'ERROR', type: '解析', source_record_id: 'doc-441', summary: 'OCR 超时 · 扫描件合同.pdf' },
    { id: 'l4', time: '6/7 09:12', level: 'WARN', type: 'GraphRAG', source_record_id: 'doc-332', summary: '实体抽取慢 · 42s' },
    { id: 'l5', time: '6/6 18:00', level: 'INFO', type: '同步', source_record_id: 's3-legal', acl_version: 'v2', summary: 'S3 增量同步 · 3 文档更新' },
  ];
}

export function getChunkQuality(chunkId: string): ChunkQualityMeta | undefined {
  return CHUNK_QUALITY.find(c => c.chunk_id === chunkId);
}

export function getAllChunkQuality(): ChunkQualityMeta[] {
  return CHUNK_QUALITY;
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, { label: string; color: string }> = {
  uploading: { label: '上传中', color: 'bg-gray-100 text-gray-600' },
  parsing: { label: '解析中', color: 'bg-blue-100 text-blue-700' },
  chunking: { label: '分块中', color: 'bg-indigo-100 text-indigo-700' },
  indexing: { label: '索引中', color: 'bg-purple-100 text-purple-700' },
  indexed: { label: '已索引', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
};

export const FRESHNESS_TIER_LABELS: Record<FreshnessTier, string> = {
  realtime: '实时',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
};

export const CERT_LABELS: Record<CertificationStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  certified: { label: '已认证', color: 'bg-green-100 text-green-700' },
  expired: { label: '已过期', color: 'bg-amber-100 text-amber-800' },
};

export const FAILURE_STAGE_LABELS: Record<FailureStage, string> = {
  parse: '解析',
  chunk: '分块',
  vector: '向量',
  pageindex: 'PageIndex',
  graph: '图谱',
  wiki: 'Wiki',
  acl: 'ACL',
  stale: '陈旧',
};

export const ACL_SYNC_MOCK = {
  sync_mode: 'batch' as 'batch' | 'live',
  acl_version: 'v20260607_143022',
  last_sync: '6/7 14:30',
  role_mappings: [
    { source: 'confluence-legal', target: 'legal', status: 'ok' },
    { source: 'confluence-finance', target: 'finance', status: 'ok' },
    { source: 'sharepoint-hr', target: 'hr', status: 'conflict' },
  ],
};
