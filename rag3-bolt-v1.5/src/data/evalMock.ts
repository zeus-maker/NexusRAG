export interface EvalDataset {
  id: string;
  name: string;
  sampleCount: number;
  kbId: string;
  kbName: string;
  tags: string[];
  updatedAt: string;
}

export interface EvalSample {
  id: number;
  datasetId: string;
  question: string;
  expectedAnswer: string;
}

export interface FailureCase {
  rank: number;
  query: string;
  expected: string;
  actual: string;
  score: number;
  metric: string;
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

export const FAILURE_CASES: FailureCase[] = [
  { rank: 1, query: '供应商保密义务范围', expected: '保密条款第 8.1–8.5 条', actual: '引用了过期的 V4 版本条款', score: 0.45, metric: 'faithfulness' },
  { rank: 2, query: '延迟交货违约金上限', expected: '合同金额 20%', actual: '回答"不超过 30%"', score: 0.52, metric: 'faithfulness' },
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
  { convId: 'conv-8821', title: '违约金计算错误', reason: '引用错误', rating: 'bad' },
  { convId: 'conv-8756', title: '条款引用过时', reason: '信息过时', rating: 'bad' },
  { convId: 'conv-8702', title: '保密范围不完整', reason: '回答不完整', rating: 'bad' },
  { convId: 'conv-8688', title: '验收流程遗漏', reason: '回答不完整', rating: 'bad' },
  { convId: 'conv-8650', title: '解除条件混淆', reason: '答非所问', rating: 'bad' },
];

export const AB_TEST_VARIABLES = [
  { group: '嵌入模型', options: ['BGE-M3', 'BCE-Embedding', 'text-embedding-3-small'] },
  { group: '解析引擎', options: ['DeepDoc', 'MinerU', 'Unstructured'] },
  { group: '融合策略', options: ['RRF 默认', 'WRRF 加权', '硬胜出'] },
  { group: 'LLM 模型', options: ['DeepSeek-v4', 'gpt-4o', 'claude-3-5-sonnet'] },
];
