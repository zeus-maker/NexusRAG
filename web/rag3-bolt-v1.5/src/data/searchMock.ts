export interface SearchApp {
  id: string;
  name: string;
  kbs: string[];
  kbIds: string[];
  desc: string;
  icon: string;
  queries: number;
  updatedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  appId: string;
  ts: number;
}

export interface SearchResultItem {
  id: number;
  title: string;
  doc: string;
  page: number;
  score: number;
  summary: string;
  highlightTerms: string[];
  tags: string[];
}

export const SEARCH_APPS: SearchApp[] = [
  {
    id: 's-001',
    name: '合同条款快速检索',
    kbs: ['法务合同知识库'],
    kbIds: ['kb-001'],
    desc: '精确检索合同条款及法律规定，支持违约金、保密、解除等主题',
    icon: '⚖️',
    queries: 1245,
    updatedAt: '2026-06-06',
  },
  {
    id: 's-002',
    name: '财报指标查询',
    kbs: ['财务报告知识库'],
    kbIds: ['kb-002'],
    desc: '查询财务报告中的数字、指标与同比环比分析',
    icon: '📊',
    queries: 876,
    updatedAt: '2026-06-05',
  },
  {
    id: 's-003',
    name: '合规政策搜索',
    kbs: ['合规政策知识库'],
    kbIds: ['kb-003'],
    desc: '搜索内部合规政策与监管要求，支持跨语言检索',
    icon: '📋',
    queries: 543,
    updatedAt: '2026-06-01',
  },
];

const now = Date.now();
const day = 86400000;

export const SEARCH_HISTORY: SearchHistoryItem[] = [
  { id: 'h-001', query: '违约金上限', appId: 's-001', ts: now - 2 * 3600000 },
  { id: 'h-002', query: '保密期限', appId: 's-001', ts: now - 5 * 3600000 },
  { id: 'h-003', query: '合同解除条件', appId: 's-001', ts: now - day - 3600000 },
  { id: 'h-004', query: '供应商验收权利', appId: 's-001', ts: now - day - 7200000 },
  { id: 'h-005', query: 'Q1 营收同比', appId: 's-002', ts: now - 3 * 3600000 },
  { id: 'h-006', query: '数据出境合规', appId: 's-003', ts: now - 2 * day },
];

export const SEARCH_RESULTS: SearchResultItem[] = [
  {
    id: 1,
    title: '供应商违约金计算标准',
    doc: '供应商合同模板V5.pdf',
    page: 3,
    score: 0.956,
    summary: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金，累计不超过合同总额20%。',
    highlightTerms: ['违约金', '千分之五', '20%'],
    tags: ['违约金', '合同'],
  },
  {
    id: 2,
    title: '采购方验收权利与拒收条款',
    doc: '采购协议条款.docx',
    page: 8,
    score: 0.867,
    summary: '采购方有权对供应商提供的货物进行验收检查，不符合约定质量标准的，有权拒绝收货或要求更换。',
    highlightTerms: ['验收', '质量标准'],
    tags: ['验收', '质量'],
  },
  {
    id: 3,
    title: '合同解除条件与程序',
    doc: '供应商合同模板V5.pdf',
    page: 4,
    score: 0.812,
    summary: '迟延交货超过三十日的，采购方有权以书面形式通知供应商解除合同并要求赔偿全部实际损失。',
    highlightTerms: ['解除合同', '三十日'],
    tags: ['合同解除', '程序'],
  },
  {
    id: 4,
    title: '不可抗力免责条款',
    doc: '供应商合同模板V5.pdf',
    page: 5,
    score: 0.789,
    summary: '因不可抗力导致无法履约的，受影响方应在48小时内书面通知对方，并提供相关证明文件。',
    highlightTerms: ['不可抗力', '48小时'],
    tags: ['不可抗力'],
  },
];

export const RELATED_SEARCHES = [
  '合同违约金上限',
  '供应商迟延处理流程',
  '保证金扣除规则',
  '质量条款验收标准',
  '保密义务例外情形',
];

export const AI_SUMMARY_BY_QUERY: Record<string, string> = {
  default: '根据检索结果，违约金相关条款主要集中在供应商合同模板V5.pdf 第三章。迟延交货违约金为每日 0.5%，累计上限 20%；超过 30 日可解除合同。建议重点关注 §5.1–5.3 条。',
  '违约金上限': '合同约定违约金累计不超过合同标的总金额的 20%，日违约金率为迟延货物价值的 0.5%。',
  '保密期限': '标准保密期为合同履行期间及终止后 5 年，部分旧版模板为 3 年。',
};

export const MINDMAP_NODES = {
  root: '违约金',
  children: [
    { label: '延迟交货', sub: '日 0.5%' },
    { label: '质量违约', sub: '实际损失' },
    { label: '解约条件', sub: '超 30 日' },
    { label: '上限', sub: '20%' },
  ],
};

export const SEARCH_SUGGESTIONS = ['违约金计算', '合同解除条件', '保密期限', '不可抗力', '验收标准'];
