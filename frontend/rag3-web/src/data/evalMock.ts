import type { Citation } from '../types';

export interface EvalDataset {
  id: string;
  name: string;
  sampleCount: number;
  kbId: string;
  kbName: string;
  tags: string[];
  updatedAt: string;
  description?: string;
}

export interface EvalSample {
  id: number;
  datasetId: string;
  question: string;
  expectedAnswer: string;
}

export interface FailureCase {
  rank: number;
  caseId?: string;
  query: string;
  expected: string;
  actual: string;
  score: number;
  metric: string;
  metrics?: Record<string, number>;
  citations?: Citation[];
}

export interface SatisfactionSummary {
  positiveRate: number;
  negativeRate: number;
  correctionRate: number;
  nps: number;
}

export interface NegativeCase {
  convId: string;
  title: string;
  reason: string;
  rating: 'bad';
  query?: string;
  answer?: string;
  feedback?: string;
  kbName?: string;
}

export const EVAL_DATASETS: EvalDataset[] = [
  { id: 'ds-001', name: '合同问答黄金集', sampleCount: 320, kbId: 'kb-001', kbName: '法务合同知识库', tags: ['合同', '黄金集'], updatedAt: '2026-06-05' },
  { id: 'ds-002', name: '财务指标基准集', sampleCount: 156, kbId: 'kb-002', kbName: '财务报告知识库', tags: ['财务', '基准'], updatedAt: '2026-06-01' },
  { id: 'ds-003', name: '合规政策抽检集', sampleCount: 89, kbId: 'kb-003', kbName: '合规政策知识库', tags: ['合规'], updatedAt: '2026-05-28' },
  { id: 'ds-004', name: '默认回归集', sampleCount: 500, kbId: 'kb-001', kbName: '法务合同知识库', tags: ['默认', '回归'], updatedAt: '2026-06-06' },
];

export const EVAL_SAMPLES: Record<string, EvalSample[]> = {
  'ds-001': [
    { id: 42, datasetId: 'ds-001', question: '违约金上限是多少？', expectedAnswer: '累计不超过合同标的总金额的 20%' },
    { id: 43, datasetId: 'ds-001', question: '保密期限是多久？', expectedAnswer: '合同终止或解除后 5 年' },
    { id: 44, datasetId: 'ds-001', question: '供应商延迟交货违约金如何计算？', expectedAnswer: '每迟延一日按迟延货物价值千分之五，上限 20%' },
    { id: 45, datasetId: 'ds-001', question: '合同解除条件有哪些？', expectedAnswer: '迟延超过 30 日、重大违约等情形' },
  ],
  'ds-002': [
    { id: 1, datasetId: 'ds-002', question: 'Q1 营收同比增长多少？', expectedAnswer: '同比增长 12.3%' },
    { id: 2, datasetId: 'ds-002', question: '毛利率是多少？', expectedAnswer: '毛利率 38.5%' },
  ],
};

function mockCite(index: number, docName: string, snippet = docName): Citation {
  return { index, doc_name: docName, page_number: 0, section: '', snippet, relevance_score: 0.8 };
}

export const FAILURE_CASES: FailureCase[] = [
  { rank: 1, query: '供应商保密义务范围', expected: '保密条款第 8.1–8.5 条', actual: '引用了过期的 V4 版本条款', score: 0.45, metric: 'faithfulness', citations: [mockCite(1, '合同模板V4.pdf §8.2'), mockCite(2, '合同模板V5.pdf §8.1')] },
  { rank: 2, query: '延迟交货违约金上限', expected: '合同金额 20%', actual: '回答"不超过 30%"', score: 0.52, metric: 'faithfulness', citations: [mockCite(1, '采购合同标准条款.pdf §5.3')] },
  { rank: 3, query: '合同解除条件', expected: '第 6.2 条规定', actual: '未准确引用条款编号', score: 0.61, metric: 'faithfulness' },
  { rank: 4, query: '不可抗力通知时限', expected: '48 小时内书面通知', actual: '回答"合理期限内"', score: 0.58, metric: 'answer_relevancy' },
  { rank: 5, query: '验收不合格处理方式', expected: '拒收或要求更换', actual: '仅提到拒收', score: 0.64, metric: 'context_precision' },
];

export const SATISFACTION_SUMMARY: SatisfactionSummary = {
  positiveRate: 87.3,
  negativeRate: 4.2,
  correctionRate: 2.1,
  nps: 42,
};

export const SATISFACTION_TREND = [82, 84, 83, 85, 86, 87, 86, 88, 87, 89, 88, 87, 86, 87];

export const NEGATIVE_REASONS = [
  { reason: '引用错误', percent: 38 },
  { reason: '回答不完整', percent: 27 },
  { reason: '信息过时', percent: 19 },
  { reason: '答非所问', percent: 10 },
  { reason: '其他', percent: 6 },
];

export const NEGATIVE_CASES: NegativeCase[] = [
  { convId: 'conv-8821', title: '违约金计算错误', reason: '引用错误', rating: 'bad', query: '延迟交货违约金上限是多少？', answer: '不超过合同金额的 30%', feedback: '正确应为 20%，引用了错误条款', kbName: '法务合同知识库' },
  { convId: 'conv-8756', title: '条款引用过时', reason: '信息过时', rating: 'bad', query: '保密义务范围包括哪些？', answer: '依据 V4 版合同模板…', feedback: '应引用 V5 版', kbName: '法务合同知识库' },
  { convId: 'conv-8702', title: '保密范围不完整', reason: '回答不完整', rating: 'bad', query: '保密期限多久？', answer: '合同期内有效', feedback: '未说明终止后 5 年', kbName: '法务合同知识库' },
  { convId: 'conv-8688', title: '验收流程遗漏', reason: '回答不完整', rating: 'bad', query: '验收不合格如何处理？', answer: '可以拒收', feedback: '还应说明更换/修理', kbName: '采购合同知识库' },
  { convId: 'conv-8650', title: '解除条件混淆', reason: '答非所问', rating: 'bad' },
];

export const AB_TEST_VARIABLES = [
  { group: '嵌入模型', options: ['BGE-M3', 'BCE-Embedding', 'text-embedding-3-small'] },
  { group: '解析引擎', options: ['DeepDoc', 'MinerU', 'Unstructured'] },
  { group: '融合策略', options: ['RRF 默认', 'WRRF 加权', '硬胜出'] },
  { group: 'LLM 模型', options: ['DeepSeek-v4', 'gpt-4o', 'claude-3-5-sonnet'] },
];

export const LAYERED_EVAL = [
  { level: '文档级', metric: '解析质量', score: 0.92, color: 'bg-blue-500' },
  { level: '块级', metric: '分块合理性', score: 0.88, color: 'bg-purple-500' },
  { level: '检索级', metric: 'Recall@10', score: 0.82, color: 'bg-orange-500' },
  { level: '生成级', metric: 'Faithfulness', score: 0.92, color: 'bg-green-500' },
  { level: '端到端', metric: '综合评分', score: 0.86, color: 'bg-blue-600' },
];

export const TREND_METRICS = [
  { key: 'faithfulness', label: 'Faithfulness', color: 'bg-blue-500' },
  { key: 'context_precision', label: 'Context Precision', color: 'bg-purple-500' },
  { key: 'answer_relevancy', label: 'Answer Relevancy', color: 'bg-green-500' },
  { key: 'hallucination_rate', label: 'Hallucination', color: 'bg-amber-500' },
];

export const COST_BREAKDOWN = [
  { label: 'LLM 生成', amount: 420, icon: '🤖' },
  { label: 'Embedding', amount: 180, icon: '📐' },
  { label: 'Rerank', amount: 45, icon: '⚡' },
  { label: 'Wiki 编译', amount: 35, icon: '📖' },
];

export const BUDGET_CONFIG = { used: 680, total: 1000, currency: '¥' };

export interface ReplayTask {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  sampleCount: number;
  dateRange: string;
  onlineF: number;
  replayF: number;
  delta: number;
  progress?: number;
}

export const REPLAY_TASKS: ReplayTask[] = [
  { id: 'rp-012', name: '回放任务 #12', status: 'running', sampleCount: 1000, dateRange: '6/1–6/6', onlineF: 0.89, replayF: 0.91, delta: 0.02, progress: 80 },
  { id: 'rp-011', name: '回放任务 #11', status: 'completed', sampleCount: 800, dateRange: '5/25–5/31', onlineF: 0.88, replayF: 0.90, delta: 0.02 },
  { id: 'rp-010', name: 'Pipeline v2.3 回归', status: 'completed', sampleCount: 500, dateRange: '5/18–5/24', onlineF: 0.87, replayF: 0.85, delta: -0.02 },
];

export const ROUTE_LEARNING = {
  modelVersion: 'v2.1',
  status: 'ready' as const,
  accuracy: 0.94,
  samples: 12450,
  lastTrain: '2026-06-05 14:00',
  pendingReview: 23,
  tiers: [
    { tier: 'Tier1', count: 4200, pct: 34 },
    { tier: 'Tier2', count: 5100, pct: 41 },
    { tier: 'Tier3', count: 2450, pct: 20 },
    { tier: 'Tier4', count: 700, pct: 5 },
  ],
};

export const DATASET_TAGS = ['合同', '黄金集', '财务', '基准', '合规', '默认', '回归'];
