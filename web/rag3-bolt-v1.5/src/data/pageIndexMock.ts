import { getGlobalPageIndexFailureCount } from './kbGovernanceMock';

export type PageIndexDocStatus = 'completed' | 'building' | 'pending' | 'failed' | 'skipped';
export type PageIndexNodeType = 'root' | 'part' | 'chapter' | 'section' | 'subsection' | 'leaf';
export type PageIndexSearchMode = 'llm_prompt' | 'mcts_hybrid';
export type PageIndexBuildStage = 'queued' | 'parsing' | 'toc' | 'building' | 'validating' | 'done' | 'failed';

export interface PageIndexBuildJob {
  id: string;
  docId: string;
  docName: string;
  stage: PageIndexBuildStage;
  progress: number;
  stepLabel: string;
  eta?: string;
  nodesBuilt?: number;
}

export interface PageIndexLibraryHit {
  docId: string;
  docName: string;
  nodeId: string;
  nodeTitle: string;
  pageRange: string;
  confidence: number;
  excerpt: string;
}

export interface PageIndexLibrarySearchResult {
  query: string;
  mode: PageIndexSearchMode;
  docsSearched: number;
  totalMs: number;
  hits: PageIndexLibraryHit[];
}

export interface PageIndexBbox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageIndexTreeNode {
  id: string;
  title: string;
  nodeType: PageIndexNodeType;
  startPage?: number;
  endPage?: number;
  summary?: string;
  tokenCount?: number;
  bbox?: PageIndexBbox;
  children?: PageIndexTreeNode[];
}

export interface PageIndexDocument {
  id: string;
  name: string;
  fileType: string;
  size: string;
  pages: number;
  treeStatus: PageIndexDocStatus;
  nodes: number;
  depth: number;
  avgToken: number;
  tocSource: 'deepdoc' | 'manual' | 'llm';
  updated: string;
  failReason?: string;
  buildProgress?: number;
}

export interface PageIndexSearchStep {
  step: number;
  action: string;
  result: string;
  ms: number;
  nodeId?: string;
}

export interface PageIndexSearchResult {
  query: string;
  mode: PageIndexSearchMode;
  targetNodeId: string;
  targetTitle: string;
  pageRange: string;
  tokenCount: number;
  confidence: number;
  totalMs: number;
  steps: PageIndexSearchStep[];
  excerpt: string;
}

export const PAGEINDEX_STATS = {
  total: 156,
  completed: 85,
  building: 12,
  pending: 47,
  failed: 12,
  skipped: 3,
  buildRate: 54.5,
  avgDepth: 4.2,
  avgNodes: 68,
  totalNodes: 6800,
  avgSearchMs: 520,
  financeBenchRecall: 98.7,
  weeklyBuilds: [8, 12, 6, 15, 10, 18, 14],
  failDist: [
    { reason: 'PDF 扫描件无法解析', count: 5 },
    { reason: 'LLM 建树超时', count: 4 },
    { reason: '表格结构提取失败', count: 2 },
    { reason: '页面为空/无内容', count: 1 },
  ],
  recentFails: [
    { docId: '4', name: '扫描件合同.pdf', reason: 'LLM 超时', time: '6/7 09:58' },
    { docId: '8', name: '供应商管理规范.docx', reason: '目录识别失败', time: '6/6 18:20' },
  ],
};

/** KB 文档 doc_id → PageIndex 文档 id（§3.4 解析预览三栏） */
export const KB_DOC_TO_PAGEINDEX: Record<string, string> = {
  'doc-001': '1',
  'doc-002': '6',
  'doc-003': '2',
  'doc-005': '3',
};

export function getPageIndexDocIdForKbDoc(docId: string): string | undefined {
  return KB_DOC_TO_PAGEINDEX[docId];
}

/** 跨库运营 Widget / 侧栏 Badge — 与 kbGovernanceMock 同源 */
export const PAGEINDEX_GLOBAL_FAILED_COUNT = getGlobalPageIndexFailureCount();

export const PAGEINDEX_DOCUMENTS: PageIndexDocument[] = [
  {
    id: '1', name: '供应商合同模板V5.pdf', fileType: 'PDF', size: '2.3 MB', pages: 12,
    treeStatus: 'completed', nodes: 86, depth: 6, avgToken: 487, tocSource: 'deepdoc',
    updated: '2 小时前',
  },
  {
    id: '2', name: '采购协议条款.pdf', fileType: 'PDF', size: '1.8 MB', pages: 8,
    treeStatus: 'completed', nodes: 64, depth: 5, avgToken: 412, tocSource: 'deepdoc',
    updated: '1 天前',
  },
  {
    id: '3', name: '保密协议合集.pdf', fileType: 'PDF', size: '4.1 MB', pages: 24,
    treeStatus: 'building', nodes: 32, depth: 3, avgToken: 0, tocSource: 'llm',
    updated: '刚刚', buildProgress: 65,
  },
  {
    id: '4', name: '扫描件合同.pdf', fileType: 'PDF', size: '6.2 MB', pages: 18,
    treeStatus: 'failed', nodes: 0, depth: 0, avgToken: 0, tocSource: 'deepdoc',
    updated: '3 天前', failReason: 'LLM 建树超时',
  },
  {
    id: '5', name: '财务报告Q3.xlsx', fileType: 'XLSX', size: '0.8 MB', pages: 6,
    treeStatus: 'completed', nodes: 45, depth: 4, avgToken: 356, tocSource: 'manual',
    updated: '5 天前',
  },
  {
    id: '6', name: '2024合规审查报告.pdf', fileType: 'PDF', size: '5.0 MB', pages: 32,
    treeStatus: 'completed', nodes: 112, depth: 7, avgToken: 523, tocSource: 'deepdoc',
    updated: '1 周前',
  },
  {
    id: '7', name: '采购管理制度.pdf', fileType: 'PDF', size: '3.2 MB', pages: 16,
    treeStatus: 'building', nodes: 18, depth: 2, avgToken: 0, tocSource: 'llm',
    updated: '10 分钟前', buildProgress: 28,
  },
  {
    id: '8', name: '供应商管理规范.docx', fileType: 'DOCX', size: '1.2 MB', pages: 10,
    treeStatus: 'failed', nodes: 0, depth: 0, avgToken: 0, tocSource: 'manual',
    updated: '2 天前', failReason: '目录识别失败',
  },
  {
    id: '9', name: '技术服务协议模板.pdf', fileType: 'PDF', size: '2.6 MB', pages: 14,
    treeStatus: 'pending', nodes: 0, depth: 0, avgToken: 0, tocSource: 'deepdoc',
    updated: '—',
  },
];

/** 合同模板V5 — JSON 树索引（Title + Summary + start/end page） */
export const PAGEINDEX_TREE_V5: PageIndexTreeNode = {
  id: 'root', title: '供应商合同模板V5.pdf', nodeType: 'root', startPage: 1, endPage: 12,
  summary: '标准采购合同模板，涵盖定义、权利义务、违约责任、保密等章节',
  children: [
    {
      id: 'ch1', title: '第一条 定义', nodeType: 'chapter', startPage: 1, endPage: 2,
      summary: '合同双方及关键术语定义', tokenCount: 384,
      children: [
        { id: 'ch1-1', title: '1.1 适用范围', nodeType: 'section', startPage: 1, endPage: 1, summary: '本合同适用于采购方与供应商之间的货物买卖', tokenCount: 128, children: [] },
        { id: 'ch1-2', title: '1.2 定义与解释', nodeType: 'section', startPage: 1, endPage: 2, summary: '供应商、采购方、货物等术语定义', tokenCount: 256,
          children: [
            { id: 'ch1-2-1', title: '1.2.1 供应商定义', nodeType: 'leaf', startPage: 2, endPage: 2, summary: '供应商系指根据合同约定提供货物或服务的法人', tokenCount: 96, children: [] },
            { id: 'ch1-2-2', title: '1.2.2 违约定义', nodeType: 'leaf', startPage: 2, endPage: 2, summary: '未能履行合同义务的情形', tokenCount: 88, children: [] },
          ],
        },
      ],
    },
    {
      id: 'ch2', title: '第二条 权利义务', nodeType: 'chapter', startPage: 2, endPage: 3,
      summary: '采购方与供应商的权利义务分配', tokenCount: 512,
      children: [
        { id: 'ch2-1', title: '2.1 采购方权利', nodeType: 'section', startPage: 2, endPage: 3, summary: '验收权、拒收权、索赔权', tokenCount: 240, children: [] },
        { id: 'ch2-2', title: '2.2 供应商义务', nodeType: 'section', startPage: 3, endPage: 3, summary: '按时交货、质量保证、售后服务', tokenCount: 272, children: [] },
      ],
    },
    {
      id: 'ch5', title: '第五条 违约责任', nodeType: 'chapter', startPage: 3, endPage: 5,
      summary: '迟延交货、质量违约、合同解除等违约情形及违约金计算',
      tokenCount: 768,
      bbox: { page: 3, x: 6, y: 8, w: 88, h: 10 },
      children: [
        {
          id: 'ch5-1', title: '5.1 迟延交货', nodeType: 'section', startPage: 3, endPage: 4,
          summary: '每迟延一日按货物价值千分之五计违约金，上限 20%',
          tokenCount: 512,
          bbox: { page: 3, x: 8, y: 28, w: 84, h: 22 },
          children: [
            {
              id: 'ch5-1-1', title: '5.1.1 违约金计算', nodeType: 'leaf', startPage: 3, endPage: 3,
              summary: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金',
              tokenCount: 256,
              bbox: { page: 3, x: 10, y: 52, w: 80, h: 14 },
              children: [],
            },
            { id: 'ch5-1-2', title: '5.1.2 解除权触发', nodeType: 'leaf', startPage: 4, endPage: 4, summary: '迟延超过 30 日采购方可解除合同', tokenCount: 192, children: [] },
          ],
        },
        { id: 'ch5-2', title: '5.2 质量违约', nodeType: 'section', startPage: 4, endPage: 5, summary: '质量不合格时的赔偿与修复义务', tokenCount: 384, children: [] },
      ],
    },
    {
      id: 'ch8', title: '第八条 保密义务', nodeType: 'chapter', startPage: 8, endPage: 9,
      summary: '商业秘密保护范围与保密期限', tokenCount: 448,
      bbox: { page: 8, x: 6, y: 10, w: 88, h: 10 },
      children: [
        { id: 'ch8-1', title: '8.1 保密范围', nodeType: 'section', startPage: 8, endPage: 8, summary: '技术信息、经营信息、客户名单等', tokenCount: 192, bbox: { page: 8, x: 8, y: 30, w: 84, h: 16 }, children: [] },
        { id: 'ch8-2', title: '8.2 保密期限', nodeType: 'section', startPage: 8, endPage: 9, summary: '合同履行期间及终止后 5 年', tokenCount: 160, bbox: { page: 8, x: 8, y: 52, w: 84, h: 12 }, children: [] },
      ],
    },
  ],
};

export const PAGEINDEX_TREES: Record<string, PageIndexTreeNode> = {
  '1': PAGEINDEX_TREE_V5,
  '2': {
    id: 'root', title: '采购协议条款.pdf', nodeType: 'root', startPage: 1, endPage: 8,
    summary: '采购协议专项条款', children: [
      { id: 'p1', title: '第一章 总则', nodeType: 'chapter', startPage: 1, endPage: 2, summary: '协议适用范围', tokenCount: 320, children: [] },
      { id: 'p2', title: '第三章 付款条款', nodeType: 'chapter', startPage: 4, endPage: 5, summary: '账期与付款方式', tokenCount: 410, children: [] },
    ],
  },
};

export const PAGEINDEX_SEARCH_PRESETS: Record<string, PageIndexSearchResult> = {
  '违约金如何计算': {
    query: '违约金如何计算',
    mode: 'mcts_hybrid',
    targetNodeId: 'ch5-1-1',
    targetTitle: '5.1.1 违约金计算',
    pageRange: 'P3',
    tokenCount: 256,
    confidence: 0.96,
    totalMs: 520,
    steps: [
      { step: 1, action: '粗粒度浏览根节点', result: '识别「违约责任」章节相关', ms: 45, nodeId: 'root' },
      { step: 2, action: '推理导航 → 第五条', result: '命中「第五条 违约责任」', ms: 120, nodeId: 'ch5' },
      { step: 3, action: '下钻 5.1 迟延交货', result: '展开子节点 5.1.1 / 5.1.2', ms: 180, nodeId: 'ch5-1' },
      { step: 4, action: '定位 P3 bbox 高亮', result: '联动解析预览矩形框', ms: 12, nodeId: 'ch5-1-1' },
      { step: 5, action: '精读叶节点抽取', result: '千分之五/日，上限 20%', ms: 163, nodeId: 'ch5-1-1' },
    ],
    excerpt: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五（0.5%）向采购方支付违约金。累计违约金不超过合同总金额的 20%。',
  },
  '保密期限是多久': {
    query: '保密期限是多久',
    mode: 'llm_prompt',
    targetNodeId: 'ch8-2',
    targetTitle: '8.2 保密期限',
    pageRange: 'P8-9',
    tokenCount: 160,
    confidence: 0.91,
    totalMs: 380,
    steps: [
      { step: 1, action: '扫描目录层级', result: '命中「第八条 保密义务」', ms: 38, nodeId: 'ch8' },
      { step: 2, action: '定位 8.2 保密期限', result: 'P8-9', ms: 142, nodeId: 'ch8-2' },
      { step: 3, action: '叶节点内容抽取', result: '履行期间 + 终止后 5 年', ms: 200, nodeId: 'ch8-2' },
    ],
    excerpt: '保密义务自合同生效之日起至合同终止后满五年止。',
  },
};

export const PAGEINDEX_PIPELINE_STEPS = ['文档解析', '目录识别', '树索引生成', '质量校验'] as const;

export const BUILD_STAGE_LABEL: Record<PageIndexBuildStage, string> = {
  queued: '排队中',
  parsing: '文档解析',
  toc: '目录识别',
  building: '树索引生成',
  validating: '质量校验',
  done: '完成',
  failed: '失败',
};

export const PAGEINDEX_BUILD_QUEUE: PageIndexBuildJob[] = [
  { id: 'bq1', docId: '3', docName: '保密协议合集.pdf', stage: 'building', progress: 65, stepLabel: '生成第 3 层节点 · 32/86', eta: '约 3 分钟', nodesBuilt: 32 },
  { id: 'bq2', docId: '7', docName: '采购管理制度.pdf', stage: 'toc', progress: 28, stepLabel: 'LLM 语义补全目录', eta: '约 8 分钟' },
  { id: 'bq3', docId: '9', docName: '技术服务协议模板.pdf', stage: 'queued', progress: 0, stepLabel: '等待空闲 Worker' },
  { id: 'bq4', docId: '4', docName: '扫描件合同.pdf', stage: 'failed', progress: 42, stepLabel: '树索引生成超时（>120s）' },
  { id: 'bq5', docId: '1', docName: '供应商合同模板V5.pdf', stage: 'done', progress: 100, stepLabel: '86 节点 · 深度 6', nodesBuilt: 86 },
];

export const PAGEINDEX_ANALYTICS = {
  searchLatencyP50: 480,
  searchLatencyP95: 920,
  avgHops: 3.2,
  weeklySearches: [42, 58, 35, 71, 64, 89, 76],
  docTypeDist: [
    { type: '合同', count: 68, pct: 43.6 },
    { type: '财报', count: 24, pct: 15.4 },
    { type: '制度规范', count: 31, pct: 19.9 },
    { type: '论文', count: 18, pct: 11.5 },
    { type: '其他', count: 15, pct: 9.6 },
  ],
  vectorCompare: { vectorRecall: 52.3, pageindexRecall: 98.7, financeBench: 'FinanceBench' },
  topDocs: [
    { docId: '1', name: '供应商合同模板V5.pdf', searches: 128, avgMs: 510 },
    { docId: '6', name: '2024合规审查报告.pdf', searches: 96, avgMs: 680 },
    { docId: '2', name: '采购协议条款.pdf', searches: 74, avgMs: 420 },
    { docId: '5', name: '财务报告Q3.xlsx', searches: 52, avgMs: 390 },
  ],
  depthDist: [
    { depth: '3-4 层', count: 28 },
    { depth: '5-6 层', count: 41 },
    { depth: '7+ 层', count: 16 },
  ],
};

export const PAGEINDEX_LIBRARY_SEARCH_PRESETS: Record<string, PageIndexLibrarySearchResult> = {
  '违约金如何计算': {
    query: '违约金如何计算',
    mode: 'mcts_hybrid',
    docsSearched: 5,
    totalMs: 620,
    hits: [
      {
        docId: '1', docName: '供应商合同模板V5.pdf', nodeId: 'ch5-1-1', nodeTitle: '5.1.1 违约金计算',
        pageRange: 'P3', confidence: 0.96,
        excerpt: '每迟延一日按迟延交付货物价值的千分之五支付违约金，累计不超过合同总金额 20%。',
      },
      {
        docId: '2', docName: '采购协议条款.pdf', nodeId: 'p2', nodeTitle: '第三章 付款条款',
        pageRange: 'P4-5', confidence: 0.71,
        excerpt: '逾期付款方应按未付金额日万分之三承担滞纳金（相关条款）。',
      },
    ],
  },
  '保密期限': {
    query: '保密期限',
    mode: 'llm_prompt',
    docsSearched: 4,
    totalMs: 410,
    hits: [
      {
        docId: '1', docName: '供应商合同模板V5.pdf', nodeId: 'ch8-2', nodeTitle: '8.2 保密期限',
        pageRange: 'P8-9', confidence: 0.91,
        excerpt: '保密义务自合同生效之日起至合同终止后满五年止。',
      },
    ],
  },
};

export const PAGEINDEX_DEFAULT_SETTINGS = {
  tocMode: 'auto' as 'auto' | 'manual' | 'llm',
  maxDepth: 8,
  maxTokenPerNode: 512,
  searchMode: 'mcts_hybrid' as PageIndexSearchMode,
  searchDepth: 5,
  branchFactor: 8,
  docTypes: { contract: true, financial: true, paper: true, email: false },
  autoBuildOnUpload: true,
  incrementalRebuild: true,
  llmModel: 'deepseek-v4',
  semanticToc: true,
};

/** 建树队列中进行中任务（与概览「建树进行中」卡片同源） */
export function getPageIndexActiveBuildJobs() {
  return PAGEINDEX_BUILD_QUEUE
    .filter(j => j.stage !== 'done' && j.stage !== 'failed')
    .map(j => ({
      docId: j.docId,
      name: j.docName,
      progress: j.progress,
      eta: j.eta,
      stepLabel: j.stepLabel,
      stage: j.stage,
    }));
}

export function getPageIndexDoc(id: string): PageIndexDocument | undefined {
  return PAGEINDEX_DOCUMENTS.find(d => d.id === id);
}

export function getNodePreviewBbox(node: PageIndexTreeNode): { page: number; bbox?: PageIndexBbox } {
  const page = node.bbox?.page ?? node.startPage ?? 1;
  return { page, bbox: node.bbox };
}

export function getPageIndexTree(docId: string): PageIndexTreeNode | undefined {
  return PAGEINDEX_TREES[docId];
}

export function findTreeNode(node: PageIndexTreeNode, id: string): PageIndexTreeNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findTreeNode(child, id);
    if (found) return found;
  }
  return undefined;
}

export function runMockTreeSearch(query: string): PageIndexSearchResult {
  const preset = PAGEINDEX_SEARCH_PRESETS[query];
  if (preset) return preset;
  return {
    ...PAGEINDEX_SEARCH_PRESETS['违约金如何计算'],
    query,
    confidence: 0.82,
    totalMs: 640,
  };
}

export function runMockLibrarySearch(query: string): PageIndexLibrarySearchResult {
  const preset = Object.entries(PAGEINDEX_LIBRARY_SEARCH_PRESETS).find(([k]) => query.includes(k) || k.includes(query))?.[1];
  if (preset) return { ...preset, query };
  return {
    query,
    mode: 'mcts_hybrid',
    docsSearched: PAGEINDEX_DOCUMENTS.filter(d => d.treeStatus === 'completed').length,
    totalMs: 580,
    hits: [
      {
        docId: '1', docName: '供应商合同模板V5.pdf', nodeId: 'ch5-1-1', nodeTitle: '5.1.1 违约金计算',
        pageRange: 'P3', confidence: 0.78,
        excerpt: '（mock）在供应商合同模板中定位到最相关叶节点摘要…',
      },
    ],
  };
}
