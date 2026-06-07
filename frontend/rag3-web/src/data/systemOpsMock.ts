export interface PromptTemplate {
  id: string;
  name: string;
  scene: string;
  version: string;
  uses: number;
  status: 'draft' | 'published' | 'archived';
  updated: string;
  body: string;
}

export interface GrayRelease {
  id: string;
  name: string;
  target: string;
  trafficPct: number;
  status: 'running' | 'paused' | 'completed' | 'rolled_back';
  baselineFaith: number;
  grayFaith: number;
  baselineLatency: number;
  grayLatency: number;
  started: string;
}

export interface BackupRecord {
  id: string;
  type: 'full' | 'incremental';
  size: string;
  status: 'completed' | 'running' | 'failed';
  created: string;
  retention: string;
}

export interface BackupPolicy {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  encrypt: boolean;
}

export type VectorDbVendor = 'milvus' | 'qdrant' | 'elasticsearch' | 'weaviate' | 'pgvector';

export interface VectorDbOption {
  id: VectorDbVendor;
  label: string;
  status: 'supported' | 'beta';
  current?: boolean;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'pt-1', name: 'RAG 回答生成', scene: 'chat', version: 'v2.3', uses: 12840, status: 'published', updated: '6/6', body: '你是企业知识助手。基于以下上下文回答：\n\n{{context}}\n\n用户问题：{{query}}' },
  { id: 'pt-2', name: '查询改写', scene: 'query_rewrite', version: 'v1.8', uses: 5620, status: 'published', updated: '6/5', body: '将用户问题改写为检索友好查询：\n{{query}}' },
  { id: 'pt-3', name: 'PageIndex 树推理', scene: 'pageindex', version: 'v1.2', uses: 890, status: 'draft', updated: '6/7', body: '在文档树中逐步推理定位节点…\n{{tree_json}}\n{{query}}' },
];

export const GRAY_RELEASES: GrayRelease[] = [
  { id: 'gr-1', name: '融合 WRRF k=80', target: 'sys-fusion', trafficPct: 25, status: 'running', baselineFaith: 0.82, grayFaith: 0.86, baselineLatency: 1.8, grayLatency: 1.9, started: '6/5' },
  { id: 'gr-2', name: 'Prompt v2.3 回答模板', target: 'sys-prompt-templates', trafficPct: 10, status: 'running', baselineFaith: 0.79, grayFaith: 0.84, baselineLatency: 2.1, grayLatency: 2.0, started: '6/6' },
  { id: 'gr-3', name: '分块 512→768', target: 'sys-pipeline', trafficPct: 0, status: 'rolled_back', baselineFaith: 0.81, grayFaith: 0.76, baselineLatency: 1.6, grayLatency: 2.4, started: '6/1' },
];

export const BACKUP_POLICY: BackupPolicy = {
  enabled: true,
  schedule: '每日 02:00',
  retentionDays: 30,
  encrypt: true,
};

export const BACKUP_RECORDS: BackupRecord[] = [
  { id: 'bk-1', type: 'full', size: '4.2 GB', status: 'completed', created: '6/7 02:00', retention: '30 天' },
  { id: 'bk-2', type: 'incremental', size: '320 MB', status: 'completed', created: '6/6 02:00', retention: '30 天' },
  { id: 'bk-3', type: 'incremental', size: '—', status: 'running', created: '6/7 14:00', retention: '30 天' },
];

export const VECTOR_DB_OPTIONS: VectorDbOption[] = [
  { id: 'milvus', label: 'Milvus', status: 'supported', current: true },
  { id: 'qdrant', label: 'Qdrant', status: 'supported' },
  { id: 'elasticsearch', label: 'Elasticsearch', status: 'supported' },
  { id: 'weaviate', label: 'Weaviate', status: 'beta' },
  { id: 'pgvector', label: 'pgvector', status: 'supported' },
];

export const VECTOR_MIGRATION_PREVIEW = {
  collections: 12,
  vectors: '2.4M',
  estimatedHours: 6,
  dualWriteDays: 7,
};
