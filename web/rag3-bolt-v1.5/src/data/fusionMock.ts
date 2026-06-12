export type ConflictPolicy = 'soft_merge' | 'hard_override' | 'annotate';
export type DedupStrategy = 'doc_id' | 'chunk_hash' | 'none';
export type RetrievalRouterMode = 'classifier_matrix' | 'llm_router' | 'rule_tree';
export type GenerationStrategyType = 'direct' | 'single_rag' | 'multi_hop' | 'agentic' | 'multi_agent';

export interface ChannelTopK {
  vector: number;
  bm25: number;
  pageindex: number;
  graphrag_local: number;
  wiki: number;
}

export interface ChannelWeight {
  channel: string;
  weight: number;
  desc: string;
}

export interface FusionConfig {
  topK: ChannelTopK;
  rrfK: number;
  conflictPolicy: ConflictPolicy;
  dedupStrategy: DedupStrategy;
  channelWeights: ChannelWeight[];
  rerankModel: string;
  rerankTopN: number;
  conflictAnnotate: boolean;
}

export interface RetrievalStrategyConfig {
  mode: RetrievalRouterMode;
  primary: string;
  secondary: string;
  decisionTree: string[];
}

export interface GenerationStrategyRow {
  type: GenerationStrategyType;
  label: string;
  tierDefault: string;
  maxIter: number;
  toolCall: boolean;
  multiAgent: boolean;
}

export interface RetrievalTestResult {
  query: string;
  primary: string;
  secondary: string;
  confidence: number;
}

export interface KBVisibility {
  scope: 'me' | 'team';
}

export interface KBACLRule {
  id: string;
  name: string;
  role: string;
  action: 'read' | 'write';
  condition: string;
}

export interface KBDataSource {
  id: string;
  name: string;
  type: 'S3' | 'Web' | 'SharePoint' | 'Manual';
  syncSchedule: string;
  lastSync: string;
  status: 'ok' | 'syncing' | 'error' | 'manual';
  docCount?: number;
}

export type ExportTaskStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExportTask {
  id: string;
  title: string;
  format: string;
  scope: string;
  status: ExportTaskStatus;
  progress?: number;
  size?: string;
  pageCount?: number;
  createdBy: string;
  createdAt: string;
}

export const CONFLICT_POLICY_LABEL: Record<ConflictPolicy, string> = {
  soft_merge: '软合并',
  hard_override: '硬覆盖',
  annotate: '冲突标注',
};

export const DEDUP_STRATEGY_LABEL: Record<DedupStrategy, string> = {
  doc_id: 'doc_id 去重',
  chunk_hash: 'chunk_hash 去重',
  none: '不去重',
};

export const ROUTER_MODE_LABEL: Record<RetrievalRouterMode, string> = {
  classifier_matrix: '跟随分类器矩阵',
  llm_router: '独立 LLM Router',
  rule_tree: '规则决策树',
};

export const RERANK_MODEL_OPTIONS = [
  'BGE-Reranker-v2-m3',
  'BGE-Reranker-large',
  'Cohere-rerank-v3',
  'Jina-Reranker-v2',
];

export const CHANNEL_OPTIONS = ['wiki', 'pageindex', 'graphrag', 'vector', 'bm25'];

export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  topK: { vector: 100, bm25: 100, pageindex: 10, graphrag_local: 20, wiki: 5 },
  rrfK: 60,
  conflictPolicy: 'soft_merge',
  dedupStrategy: 'doc_id',
  channelWeights: [
    { channel: 'Wiki', weight: 1.5, desc: '已编译稳定知识（源 §34.3）' },
    { channel: 'PageIndex', weight: 1.3, desc: '长专业文档推理' },
    { channel: 'GraphRAG', weight: 1.1, desc: '实体关系查询' },
    { channel: '向量', weight: 1.0, desc: '通用语义' },
    { channel: 'BM25', weight: 1.0, desc: '精确关键词' },
  ],
  rerankModel: 'BGE-Reranker-v2-m3',
  rerankTopN: 5,
  conflictAnnotate: true,
};

export const DEFAULT_RETRIEVAL_STRATEGY: RetrievalStrategyConfig = {
  mode: 'classifier_matrix',
  primary: 'pageindex',
  secondary: 'vector',
  decisionTree: [
    '查询 → 精确关键词? → BM25',
    '      → 语义理解?   → 向量',
    '      → 跨章节推理? → PageIndex',
    '      → 实体关系?   → GraphRAG',
    '      → 稳定事实?   → Wiki',
  ],
};

export const GENERATION_STRATEGY_ROWS: GenerationStrategyRow[] = [
  { type: 'direct', label: '直接回答', tierDefault: 'Tier1', maxIter: 0, toolCall: false, multiAgent: false },
  { type: 'single_rag', label: '单次 RAG', tierDefault: 'Tier1-2', maxIter: 1, toolCall: false, multiAgent: false },
  { type: 'multi_hop', label: '多跳推理', tierDefault: 'Tier3', maxIter: 3, toolCall: false, multiAgent: false },
  { type: 'agentic', label: 'Agentic', tierDefault: 'Tier3-4', maxIter: 5, toolCall: true, multiAgent: false },
  { type: 'multi_agent', label: '多 Agent 协作', tierDefault: 'Tier4', maxIter: 8, toolCall: true, multiAgent: true },
];

export const MOCK_RETRIEVAL_TEST: Record<string, RetrievalTestResult> = {
  'AMD收购Xilinx的影响': { query: 'AMD收购Xilinx的影响', primary: 'graphrag', secondary: 'pageindex', confidence: 0.91 },
  '合同违约金条款': { query: '合同违约金条款', primary: 'pageindex', secondary: 'vector', confidence: 0.88 },
  '2024年Q3营收': { query: '2024年Q3营收', primary: 'wiki', secondary: 'vector', confidence: 0.94 },
};

export const DEFAULT_KB_VISIBILITY: KBVisibility = { scope: 'team' };

export const DEFAULT_KB_ACL_RULES: KBACLRule[] = [
  { id: '1', name: '高管可看全部', role: 'executive', action: 'read', condition: '全部密级' },
  { id: '2', name: '财务分析师', role: 'finance', action: 'read', condition: '!= restricted' },
  { id: '3', name: '实习生', role: 'intern', action: 'read', condition: '== public' },
];

export const DEFAULT_KB_DATA_SOURCES: KBDataSource[] = [
  { id: 'ds-1', name: '企业网盘/legal/', type: 'S3', syncSchedule: '每日 02:00', lastSync: '6/6 ✅', status: 'ok' },
  { id: 'ds-2', name: 'Confluence/法务空间', type: 'Web', syncSchedule: '每周一', lastSync: '6/3 ✅', status: 'ok' },
  { id: 'ds-3', name: '手动上传', type: 'Manual', syncSchedule: '—', lastSync: '—', status: 'manual', docCount: 156 },
];

export const DEFAULT_EXPORT_TASKS: ExportTask[] = [
  {
    id: 'exp-1', title: '全库 Chunk 导出', format: 'JSONL', scope: '全部文档',
    status: 'running', progress: 68, createdBy: '李婷', createdAt: '6/6 10:00',
  },
  {
    id: 'exp-2', title: 'Wiki 页面导出', format: 'Markdown', scope: 'Wiki 页面',
    status: 'completed', pageCount: 1240, size: '86MB', createdBy: '王芳', createdAt: '6/5 16:30',
  },
  {
    id: 'exp-3', title: '合同文档 CSV', format: 'CSV', scope: '选中文档 (12)',
    status: 'completed', size: '2.4MB', createdBy: '李婷', createdAt: '6/4 09:15',
  },
];

export function runMockRetrievalTest(query: string): RetrievalTestResult {
  const hit = MOCK_RETRIEVAL_TEST[query];
  if (hit) return hit;
  const lower = query.toLowerCase();
  if (lower.includes('合同') || lower.includes('条款')) {
    return { query, primary: 'pageindex', secondary: 'vector', confidence: 0.85 };
  }
  if (lower.includes('实体') || lower.includes('关系')) {
    return { query, primary: 'graphrag', secondary: 'vector', confidence: 0.82 };
  }
  return { query, primary: 'vector', secondary: 'bm25', confidence: 0.76 };
}
