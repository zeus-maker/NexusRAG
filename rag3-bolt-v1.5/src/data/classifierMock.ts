/** 对齐 docs/tech/5-企业级RAG知识库3.0实现方案.md 第五部分 + PRD §11.3 */

export type ClassifierId = 'complexity' | 'document_type' | 'intent' | 'security';

export interface ClassifierMeta {
  id: ClassifierId;
  name: string;
  subtitle: string;
  desc: string;
  type: string;
  model: string;
  categoryCount: number;
  accuracy: number;
  latencyMs: number;
  dailyCalls: number;
  active: boolean;
  accent: string;
}

export interface TierDefinition {
  tier: string;
  label: string;
  desc: string;
  example: string;
  freqPct: number;
  cost: '极低' | '低' | '中' | '高';
  recommended: string;
}

export interface KeywordRule {
  id: string;
  pattern: string;
  result: string;
  priority: number;
}

export interface DocTypeMapping {
  type: string;
  features: string;
  parser: string;
  defaultPipeline: string;
  enabled: boolean;
}

export interface IntentMapping {
  intent: string;
  desc: string;
  strategy: string;
  reject?: boolean;
}

export interface SecurityTier {
  level: string;
  tag: string;
  requirement: string;
  extraPolicy: string;
}

export interface RoutingMatrixRow {
  id: string;
  tier: string;
  docType: string;
  intent: string;
  security: string;
  primary: string[];
  secondary: string[];
  fusion: string;
  acl?: boolean;
  enabled: boolean;
  hitCount7d: number;
}

export interface TraceStep {
  layer: string;
  label: string;
  detail: string;
  ms: number;
}

export interface ClassifierDimensionResult {
  dimension: string;
  label: string;
  confidence: number;
  reasoning?: string;
}

export interface FullRouteTestResult {
  query: string;
  dimensions: ClassifierDimensionResult[];
  matchedRuleId: string;
  primary: string[];
  secondary: string[];
  fusion: string;
  softRouting: boolean;
  softRoutingNote?: string;
  totalMs: number;
  trace: TraceStep[];
  reject?: boolean;
  rejectMessage?: string;
}

export const CLASSIFIER_STATS = {
  todayCalls: 12450,
  avgL1Ms: 118,
  matrixRules: 12,
  softRoutingRate: 4.2,
  onlineLearningVersion: 'v12',
  onlineLearningAccuracy: 0.942,
};

export const FOUR_CLASSIFIERS: ClassifierMeta[] = [
  {
    id: 'complexity', name: '查询复杂度分类器', subtitle: 'Tier 1–4',
    desc: 'Adaptive RAG 入口大脑：判断简单事实 / 多条件 / 多跳推理 / 跨文档综合（架构§25）',
    type: 'Rule+LLM', model: 'gpt-4o-mini', categoryCount: 4,
    accuracy: 0.89, latencyMs: 45, dailyCalls: 12450, active: true, accent: 'text-blue-600',
  },
  {
    id: 'document_type', name: '文档类型分类器', subtitle: '12 种类型',
    desc: '根据 parser_id、文件名与 LLM 二次确认，路由到最优解析器与主流水线（架构§26）',
    type: 'Parser+LLM', model: 'deepseek-v4', categoryCount: 12,
    accuracy: 0.91, latencyMs: 38, dailyCalls: 12450, active: true, accent: 'text-cyan-600',
  },
  {
    id: 'intent', name: '用户意图分类器', subtitle: '6 种意图',
    desc: '精确答案 / 摘要归纳 / 对比分析 / 流程指引 / 代码查询 / 闲聊拒答（架构§28）',
    type: 'LLM', model: 'gpt-4o-mini', categoryCount: 6,
    accuracy: 0.94, latencyMs: 52, dailyCalls: 12450, active: true, accent: 'text-violet-600',
  },
  {
    id: 'security', name: '安全分级分类器', subtitle: '4 级密级',
    desc: '结合用户角色与查询敏感度判定 public/internal/confidential/restricted，交叉 Chunk ACL（架构§33）',
    type: 'Rule+RBAC', model: 'rule-engine', categoryCount: 4,
    accuracy: 0.98, latencyMs: 8, dailyCalls: 12450, active: true, accent: 'text-red-600',
  },
];

export const TIER_DEFINITIONS: TierDefinition[] = [
  { tier: 'Tier1', label: '简单事实型', desc: '单实体单属性', example: '「违约金比例是多少？」', freqPct: 60, cost: '极低', recommended: 'P1 向量 / P4 Wiki' },
  { tier: 'Tier2', label: '多条件型', desc: '需跨段落综合', example: '「违约条款与解除条件分别是什么？」', freqPct: 25, cost: '低', recommended: 'P1+P2 混合' },
  { tier: 'Tier3', label: '多跳推理型', desc: '跨章节定位推理', example: '「为什么 2022 Q2 毛利率下降？」', freqPct: 12, cost: '中', recommended: 'P2 PageIndex 主' },
  { tier: 'Tier4', label: '跨文档综合型', desc: '对比/预测/探索', example: '「对比三款合同并预测风险」', freqPct: 3, cost: '高', recommended: 'P5 Agent + 多通道' },
];

export const COMPLEXITY_KEYWORD_RULES: KeywordRule[] = [
  { id: 'k1', pattern: 'CONTAINS "对比"', result: 'Tier >= 3', priority: 10 },
  { id: 'k2', pattern: 'CONTAINS "为什么"', result: 'Tier >= 3', priority: 8 },
  { id: 'k3', pattern: 'LENGTH < 15', result: 'Tier <= 2', priority: 5 },
];

export const DOC_TYPE_MAPPINGS: DocTypeMapping[] = [
  { type: '合同', features: 'laws/book parser · 条款结构', parser: 'laws', defaultPipeline: 'P2 PageIndex', enabled: true },
  { type: '财报', features: 'paper/table · 数值密集', parser: 'paper', defaultPipeline: 'P1 向量 + P4 Wiki', enabled: true },
  { type: '论文', features: 'paper · 章节摘要', parser: 'paper', defaultPipeline: 'P2 PageIndex + P3 Graph', enabled: true },
  { type: '邮件', features: 'email parser', parser: 'email', defaultPipeline: 'P1 全文', enabled: true },
  { type: '制度规范', features: 'manual · 层级目录', parser: 'general', defaultPipeline: 'P2 PageIndex', enabled: true },
  { type: '研报', features: '长文档 · 图表', parser: 'paper', defaultPipeline: 'P1 + P3 GraphRAG', enabled: true },
  { type: '代码', features: 'code chunk 加权', parser: 'code', defaultPipeline: 'P1 向量', enabled: true },
  { type: '扫描件', features: 'DeepDoc OCR', parser: 'deepdoc', defaultPipeline: 'P2 PageIndex', enabled: true },
];

export const INTENT_MAPPINGS: IntentMapping[] = [
  { intent: '精确答案', desc: '单点事实查询', strategy: '标准检索管道' },
  { intent: '摘要归纳', desc: '长文压缩', strategy: '增大 Top-K + 摘要模型' },
  { intent: '对比分析', desc: '跨文档对比', strategy: 'Tier≥3 多通道 + RRF' },
  { intent: '流程指引', desc: '步骤说明', strategy: 'P4 Wiki 优先' },
  { intent: '代码查询', desc: '技术片段', strategy: '代码分块加权检索' },
  { intent: '闲聊拒答', desc: '越权/无关', strategy: '返回预设话术，跳过检索', reject: true },
];

export const SECURITY_TIERS: SecurityTier[] = [
  { level: '公开', tag: 'public', requirement: '无限制', extraPolicy: '—' },
  { level: '内部', tag: 'internal', requirement: '需登录用户', extraPolicy: '审计日志' },
  { level: '机密', tag: 'confidential', requirement: '需机密角色 + KB ACL', extraPolicy: '禁 Web 搜索 · 块级 ACL' },
  { level: '绝密', tag: 'restricted', requirement: '需绝密 + 审批角色', extraPolicy: '强制审计 + 人工复核' },
];

/** 对齐架构§3.3 路由决策矩阵 */
export const ROUTING_MATRIX: RoutingMatrixRow[] = [
  { id: 'm1', tier: 'Tier1', docType: '财报', intent: '精确答案', security: '内部', primary: ['P1 向量', 'P4 Wiki'], secondary: [], fusion: 'cascade', enabled: true, hitCount7d: 342 },
  { id: 'm2', tier: 'Tier1', docType: '合同', intent: '精确答案', security: '机密', primary: ['P2 PageIndex'], secondary: [], fusion: 'cascade', acl: true, enabled: true, hitCount7d: 428 },
  { id: 'm3', tier: 'Tier2', docType: '财报', intent: '数据分析', security: '内部', primary: ['P2 PageIndex'], secondary: ['P1 向量'], fusion: 'rrf', enabled: true, hitCount7d: 218 },
  { id: 'm4', tier: 'Tier3', docType: '论文', intent: '综合分析', security: '公开', primary: ['P2 PageIndex'], secondary: ['P3 GraphRAG'], fusion: 'weighted', enabled: true, hitCount7d: 156 },
  { id: 'm5', tier: 'Tier3', docType: '合同', intent: '综合分析', security: '机密', primary: ['P2 PageIndex'], secondary: ['P3 GraphRAG'], fusion: 'weighted', acl: true, enabled: true, hitCount7d: 189 },
  { id: 'm6', tier: 'Tier4', docType: '邮件+聊天', intent: '综合分析', security: '机密', primary: ['P1 向量'], secondary: ['P3 GraphRAG'], fusion: 'rrf', acl: true, enabled: true, hitCount7d: 48 },
  { id: 'm7', tier: 'Tier4', docType: '全部', intent: '策略建议', security: '内部', primary: ['P5 Agent'], secondary: ['P3 GraphRAG'], fusion: 'cross_encoder', enabled: true, hitCount7d: 32 },
  { id: 'm8', tier: '—', docType: '—', intent: '闲聊', security: '公开', primary: ['直接回答'], secondary: [], fusion: '—', enabled: true, hitCount7d: 86 },
];

export const DEFAULT_COMPLEXITY_CONFIG = {
  model: 'gpt-4o-mini',
  confidenceThreshold: 0.85,
  softRoutingGap: 0.2,
  enableKeywordRules: true,
};

export const DEFAULT_INTENT_CONFIG = {
  rejectMessage: '您好，我是企业知识库助手，请咨询与业务相关的问题。如需帮助请描述具体文档或场景。',
};

export const DEFAULT_SECURITY_CONFIG = {
  crossCheckAcl: true,
  blockWebSearchOnConfidential: true,
};

export const ROUTE_TEST_PRESETS: Record<string, FullRouteTestResult> = {
  '违约金比例': {
    query: '违约金比例是多少？',
    dimensions: [
      { dimension: '复杂度', label: 'Tier1 简单事实', confidence: 0.92, reasoning: '单属性事实查询' },
      { dimension: '文档类型', label: '合同', confidence: 0.88 },
      { dimension: '意图', label: '精确答案', confidence: 0.95 },
      { dimension: '安全', label: '机密', confidence: 0.91 },
    ],
    matchedRuleId: 'm2',
    primary: ['P2 PageIndex'], secondary: [],
    fusion: 'cascade', softRouting: false, totalMs: 3120,
    trace: [
      { layer: 'L1', label: '四分类器', detail: 'Tier1/合同/精确答案/机密', ms: 118 },
      { layer: 'L2', label: '路由决策', detail: '命中矩阵 m2 · 块级 ACL', ms: 42 },
      { layer: 'L3', label: '多通道检索', detail: 'PageIndex Top-3 · 520ms', ms: 1380 },
      { layer: 'L4', label: 'RRF 精排', detail: 'Cross-Encoder 重排 3→1', ms: 360 },
      { layer: 'L5', label: '生成', detail: 'deepseek-v4 · 带引用', ms: 1220 },
    ],
  },
  '对比三款合同': {
    query: '对比三款供应商合同并预测违约风险',
    dimensions: [
      { dimension: '复杂度', label: 'Tier4 跨文档综合', confidence: 0.86, reasoning: '含「对比」关键词规则' },
      { dimension: '文档类型', label: '合同', confidence: 0.82 },
      { dimension: '意图', label: '对比分析', confidence: 0.89 },
      { dimension: '安全', label: '机密', confidence: 0.88 },
    ],
    matchedRuleId: 'm5',
    primary: ['P2 PageIndex'], secondary: ['P3 GraphRAG'],
    fusion: 'weighted', softRouting: true,
    softRoutingNote: 'Tier3/Tier4 置信差 0.15 < 0.2，同时启用辅通道 P3',
    totalMs: 4850,
    trace: [
      { layer: 'L1', label: '四分类器', detail: 'Tier4/合同/对比分析/机密', ms: 125 },
      { layer: 'L2', label: '路由决策', detail: '软路由 · P2+P3 加权', ms: 48 },
      { layer: 'L3', label: '多通道检索', detail: 'PageIndex 5 + Graph Local 3', ms: 2100 },
      { layer: 'L4', label: '加权融合', detail: 'Weighted RRF · 8→4', ms: 420 },
      { layer: 'L5', label: '生成', detail: '多跳推理生成', ms: 2157 },
    ],
  },
  '今天天气': {
    query: '今天天气怎么样',
    dimensions: [
      { dimension: '复杂度', label: '—', confidence: 0.12 },
      { dimension: '文档类型', label: '—', confidence: 0.05 },
      { dimension: '意图', label: '闲聊拒答', confidence: 0.97 },
      { dimension: '安全', label: '公开', confidence: 0.99 },
    ],
    matchedRuleId: 'm8',
    primary: ['直接回答'], secondary: [],
    fusion: '—', softRouting: false, totalMs: 180,
    reject: true,
    rejectMessage: DEFAULT_INTENT_CONFIG.rejectMessage,
    trace: [
      { layer: 'L1', label: '四分类器', detail: '意图=闲聊拒答', ms: 95 },
      { layer: 'L2', label: '路由决策', detail: '跳过检索', ms: 12 },
      { layer: 'L5', label: '拒答话术', detail: '预设模板返回', ms: 73 },
    ],
  },
};

export function runFullRouteTest(query: string): FullRouteTestResult {
  const preset = Object.entries(ROUTE_TEST_PRESETS).find(([k]) => query.includes(k) || k.includes(query))?.[1];
  if (preset) return { ...preset, query };
  return {
    ...ROUTE_TEST_PRESETS['违约金比例'],
    query,
    dimensions: ROUTE_TEST_PRESETS['违约金比例'].dimensions.map(d => ({
      ...d,
      confidence: d.confidence * 0.9,
    })),
  };
}

export function runSingleClassifierTest(classifierId: ClassifierId, query: string): ClassifierDimensionResult[] {
  const full = runFullRouteTest(query);
  const dimMap: Record<ClassifierId, string> = {
    complexity: '复杂度',
    document_type: '文档类型',
    intent: '意图',
    security: '安全',
  };
  const main = full.dimensions.find(d => d.dimension === dimMap[classifierId]);
  if (!main) return [];
  const labels = {
    complexity: TIER_DEFINITIONS.map(t => t.label),
    document_type: DOC_TYPE_MAPPINGS.map(d => d.type),
    intent: INTENT_MAPPINGS.map(i => i.intent),
    security: SECURITY_TIERS.map(s => s.level),
  }[classifierId];
  return labels.map((label, i) => ({
    dimension: dimMap[classifierId],
    label,
    confidence: label === main.label || main.label.includes(label.split(' ')[0]) ? main.confidence : Math.random() * 0.08,
  })).sort((a, b) => b.confidence - a.confidence);
}
