export type PipelineStatus = 'active' | 'index_only' | 'disabled';

export type FusionStrategy = 'rrf' | 'weighted' | 'cross_encoder' | 'cascade';

export interface PipelineDefinition {
  key: string;
  name: string;
  shortName: string;
  desc: string;
  status: PipelineStatus;
  health: number;
  indexed: number;
  total: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  dailyCalls: number;
  costPer1k: number;
  stages: string[];
  hubPage?: string;
  accent: string;
  icon: string;
}

export interface RoutingRule {
  id: string;
  tier: string;
  docType: string;
  intent: string;
  security: string;
  primary: string[];
  secondary: string[];
  fusion: FusionStrategy;
  enabled: boolean;
  hitCount7d: number;
}

export interface PipelineModelConfig {
  embedding: string;
  llm: string;
  reranker: string;
  classifier: string;
  classifierTemperature: number;
  fallbackLlm: string;
}

export interface RoutePreviewResult {
  query: string;
  tier: string;
  docType: string;
  intent: string;
  security: string;
  primary: string[];
  secondary: string[];
  fusion: FusionStrategy;
  confidence: number;
  estLatencyMs: number;
}

export const PIPELINE_STATUS_LABEL: Record<PipelineStatus, { label: string; variant: 'active' | 'indexing' | 'draft' }> = {
  active: { label: '启用', variant: 'active' },
  index_only: { label: '仅索引', variant: 'indexing' },
  disabled: { label: '禁用', variant: 'draft' },
};

export const FUSION_STRATEGY_LABEL: Record<FusionStrategy, string> = {
  rrf: 'RRF 倒数排名融合',
  weighted: '加权融合',
  cross_encoder: 'Cross-Encoder 精排',
  cascade: '级联（主通道优先）',
};

export const PIPELINE_DEFINITIONS: PipelineDefinition[] = [
  {
    key: 'P1', name: '向量检索流水线', shortName: '向量', desc: 'DeepDoc 解析 → 自适应分块 → BGE-M3 嵌入 → Milvus/ES 混合检索',
    status: 'active', health: 98, indexed: 154, total: 156, avgLatencyMs: 450, p95LatencyMs: 890,
    dailyCalls: 8420, costPer1k: 0.02, stages: ['解析', '分块', '嵌入', '索引', '检索'],
    accent: 'text-blue-600', icon: '🔍',
  },
  {
    key: 'P2', name: 'PageIndex 流水线', shortName: 'PageIndex', desc: 'JSON 树索引 Ingest → In-Context 推理导航，无分块向量化',
    status: 'active', health: 85, indexed: 85, total: 156, avgLatencyMs: 520, p95LatencyMs: 1020,
    dailyCalls: 2180, costPer1k: 0.18, stages: ['解析', '目录识别', '树索引', '树搜索'],
    hubPage: 'pageindex-hub', accent: 'text-cyan-600', icon: '🌳',
  },
  {
    key: 'P3', name: 'GraphRAG 流水线', shortName: 'GraphRAG', desc: 'LazyGraphRAG 实体/关系抽取 → 社区摘要 → Local/Global 检索',
    status: 'index_only', health: 72, indexed: 42, total: 156, avgLatencyMs: 1200, p95LatencyMs: 2400,
    dailyCalls: 640, costPer1k: 0.45, stages: ['切块', '实体抽取', '入图', '社区摘要', '图检索'],
    hubPage: 'graphrag-hub', accent: 'text-amber-600', icon: '🕸️',
  },
  {
    key: 'P4', name: 'LLM Wiki 流水线', shortName: 'Wiki', desc: 'raw/ 原始资料 → LLM 编译 wiki/ 知识页，零检索直接读取',
    status: 'active', health: 60, indexed: 12, total: 42, avgLatencyMs: 180, p95LatencyMs: 380,
    dailyCalls: 920, costPer1k: 0.08, stages: ['Ingest', '实体提取', 'Wiki 编译', 'Git 版本'],
    hubPage: 'wiki-hub', accent: 'text-violet-600', icon: '📖',
  },
  {
    key: 'P5', name: 'Agent 工具流水线', shortName: 'Agent', desc: 'LangGraph 多步推理 → MCP 工具调用 → 复合任务执行',
    status: 'disabled', health: 0, indexed: 0, total: 0, avgLatencyMs: 3500, p95LatencyMs: 6000,
    dailyCalls: 0, costPer1k: 1.2, stages: ['规划', '工具选择', '执行', '汇总'],
    hubPage: 'agent', accent: 'text-purple-600', icon: '🤖',
  },
];

export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  { id: 'r1', tier: 'Tier1', docType: '财报', intent: '精确答案', security: '内部', primary: ['P4 Wiki', 'P1 向量'], secondary: [], fusion: 'cascade', enabled: true, hitCount7d: 342 },
  { id: 'r2', tier: 'Tier2', docType: '财报', intent: '数据分析', security: '内部', primary: ['P2 PageIndex'], secondary: ['P1 向量'], fusion: 'rrf', enabled: true, hitCount7d: 218 },
  { id: 'r3', tier: 'Tier3', docType: '合同', intent: '综合分析', security: '机密', primary: ['P2 PageIndex'], secondary: ['P3 GraphRAG'], fusion: 'weighted', enabled: true, hitCount7d: 156 },
  { id: 'r4', tier: 'Tier4', docType: '全部', intent: '策略建议', security: '机密', primary: ['P5 Agent'], secondary: ['P1 向量', 'P3 GraphRAG'], fusion: 'cross_encoder', enabled: true, hitCount7d: 48 },
  { id: 'r5', tier: 'Tier2', docType: '制度', intent: '问答', security: '内部', primary: ['P1 向量'], secondary: ['P4 Wiki'], fusion: 'rrf', enabled: true, hitCount7d: 512 },
  { id: 'r6', tier: 'Tier3', docType: '研报', intent: '趋势分析', security: '内部', primary: ['P1 向量'], secondary: ['P2 PageIndex', 'P3 GraphRAG'], fusion: 'weighted', enabled: false, hitCount7d: 0 },
];

export const DEFAULT_MODEL_CONFIG: PipelineModelConfig = {
  embedding: 'BAAI/bge-m3',
  llm: 'deepseek-v4',
  reranker: 'BAAI/bge-reranker-v2-m3',
  classifier: 'gpt-4o-mini',
  classifierTemperature: 0.1,
  fallbackLlm: 'gpt-4o-mini',
};

export const PIPELINE_GLOBAL_SETTINGS = {
  maxConcurrency: 32,
  routeTimeoutMs: 12000,
  retryCount: 2,
  softRoutingGap: 0.2,
  grayReleasePercent: 10,
  grayReleasePipeline: 'P3 GraphRAG',
  enableRouteCache: true,
  cacheTtlSec: 300,
};

export const PIPELINE_STATS = {
  activeCount: 3,
  indexOnlyCount: 1,
  disabledCount: 1,
  todayRoutes: 12450,
  routeSuccessRate: 99.2,
  avgFusionMs: 85,
  weeklyRoutes: [820, 910, 780, 1050, 980, 1120, 1245],
};

export const ROUTE_PREVIEW_PRESETS: Record<string, RoutePreviewResult> = {
  '违约金如何计算': {
    query: '违约金如何计算',
    tier: 'Tier2', docType: '合同', intent: '精确答案', security: '机密',
    primary: ['P2 PageIndex'], secondary: ['P1 向量'], fusion: 'rrf',
    confidence: 0.91, estLatencyMs: 680,
  },
  'AMD收购Xilinx对供应链的影响': {
    query: 'AMD收购Xilinx对供应链的影响',
    tier: 'Tier4', docType: '研报', intent: '综合分析', security: '内部',
    primary: ['P3 GraphRAG'], secondary: ['P2 PageIndex', 'P1 向量'], fusion: 'weighted',
    confidence: 0.84, estLatencyMs: 2100,
  },
};

export const EMBEDDING_OPTIONS = ['BAAI/bge-m3', 'text-embedding-3-large', 'jina-embeddings-v3'];
export const LLM_OPTIONS = ['deepseek-v4', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'];
export const RERANKER_OPTIONS = ['BAAI/bge-reranker-v2-m3', 'cohere-rerank-v3', 'none'];

export function runMockRoutePreview(query: string): RoutePreviewResult {
  const preset = Object.entries(ROUTE_PREVIEW_PRESETS).find(([k]) => query.includes(k) || k.includes(query))?.[1];
  if (preset) return { ...preset, query };
  return {
    query,
    tier: 'Tier2', docType: '合同', intent: '问答', security: '内部',
    primary: ['P1 向量'], secondary: ['P4 Wiki'], fusion: 'rrf',
    confidence: 0.78, estLatencyMs: 520,
  };
}
