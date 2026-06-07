export type WikiPageStatus = 'published' | 'reviewing' | 'compiling' | 'queued' | 'failed' | 'draft';
export type WikiPageType = 'raw' | 'entity' | 'concept' | 'synthesis' | 'index' | 'log' | 'comparison';
export type WikiPriority = '高' | '中' | '低';
export type WikiIngestStatus = 'compiled' | 'compiling' | 'pending' | 'failed';

/** raw/ 原始资料文档 — Ingest 入口，先于 wiki/ 浏览器 */
export interface WikiSourceDoc {
  id: string;
  name: string;
  rawPath: string;
  fileType: string;
  size: string;
  ingestStatus: WikiIngestStatus;
  wikiPageCount: number;
  relatedSlugs: string[];
  primaryWikiSlug: string;
  lastIngest: string;
  ingestNote?: string;
}

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  pageType: WikiPageType;
  content: string;
  sources: string[];
  related: string[];
  status: WikiPageStatus;
  citeRate: number | null;
  priority: WikiPriority;
  author: string;
  updated: string;
  views: number;
  version: string;
  rawSource?: string;
}

export interface WikiTreeNode {
  id: string;
  title: string;
  nodeType: 'folder' | 'page';
  pageType?: WikiPageType;
  slug?: string;
  status?: WikiPageStatus;
  citeRate?: number | null;
  children?: WikiTreeNode[];
}

export interface WikiCompileJob {
  id: string;
  title: string;
  status: WikiPageStatus;
  progress: number;
  step: string;
  citeRate: number | null;
  priority: WikiPriority;
  started: string;
}

export interface WikiCommit {
  id: string;
  message: string;
  author: string;
  time: string;
  diff?: { removed: string; added: string };
}

/** Karpathy 三层：raw/ → wiki/（本树）→ schema；浏览器左侧为 wiki/index 目录树 */
export const WIKI_LAYER_FILTERS: { key: WikiPageType | 'all'; label: string; desc: string }[] = [
  { key: 'all', label: '全部', desc: '完整目录' },
  { key: 'raw', label: '原始', desc: 'Layer1 raw/ 资料摘要' },
  { key: 'entity', label: '实体', desc: 'entity pages' },
  { key: 'concept', label: '概念', desc: 'concept pages' },
  { key: 'synthesis', label: '综合', desc: 'synthesis / comparison' },
];

export const WIKI_PAGES: WikiPage[] = [
  {
    id: '1', slug: 'supplier-penalty', title: '供应商违约金', pageType: 'entity',
    content: `## 概述\n供应商违约金是在供应商未能履行合同义务时，向采购方支付的赔偿金额。根据公司标准采购合同模板（V5），违约金按日计算。\n\n## 关键规则\n- **计算标准**：每迟延一日按迟延交付货物价值的 **千分之五（0.5%）** 计算\n- **累计上限**：不超过合同总金额的 **20%**\n- **解除权**：迟延超过 **30 日** 时采购方可解除合同\n\n## 交叉引用\n- 参见 [[合同解除权]]、[[不可抗力]]\n- 被 [[付款条款汇总]]、[[采购流程规范]] 引用`,
    sources: ['供应商合同模板V5.pdf P3', '采购协议条款 P8'],
    related: ['合同解除权', '保密义务', '不可抗力'],
    status: 'published', citeRate: 92, priority: '高', author: '李婷', updated: '2小时前', views: 342, version: 'v3.2',
    rawSource: 'raw/供应商合同模板V5.pdf',
  },
  {
    id: '2', slug: 'contract-termination', title: '合同解除权', pageType: 'entity',
    content: `## 概述\n合同解除权是指合同一方在特定条件成立时，终止合同效力的法定或约定权利。\n\n## 行使条件\n- 供应商逾期交货超过 30 日\n- 货物质量不符合约定标准且无法修复`,
    sources: ['供应商合同模板V5.pdf P4'],
    related: ['供应商违约金', '货物验收标准'],
    status: 'compiling', citeRate: null, priority: '中', author: '王磊', updated: '编译中', views: 189, version: 'v2.1',
  },
  {
    id: '3', slug: 'confidentiality', title: '保密义务', pageType: 'entity',
    content: `## 概述\n保密义务要求合同双方对因合同履行知悉的商业秘密予以保护。\n\n## 保密期限\n合同履行期间 + 终止后 5 年`,
    sources: ['供应商合同模板V5.pdf P8'],
    related: ['供应商违约金', '合同解除权'],
    status: 'reviewing', citeRate: 88, priority: '高', author: '张敏', updated: '3小时前', views: 0, version: 'v1.0-draft',
  },
  {
    id: '4', slug: 'breach-liability', title: '违约责任体系', pageType: 'concept',
    content: `## 概念定义\n违约责任体系涵盖违约金、损害赔偿、合同解除三类救济方式的适用关系与优先级。\n\n## 关联实体\n- [[供应商违约金]]\n- [[合同解除权]]`,
    sources: ['采购管理制度.pdf P2', '供应商合同模板V5.pdf P5'],
    related: ['供应商违约金', '合同解除权'],
    status: 'published', citeRate: 85, priority: '中', author: '系统', updated: '1天前', views: 128, version: 'v2.0',
  },
  {
    id: '5', slug: 'procurement-flow', title: '采购流程规范', pageType: 'synthesis',
    content: `## 概述\n标准采购流程涵盖需求提出、供应商遴选、合同签署与验收结算四个阶段。\n\n## 跨文档综合\n综合了 [[供应商资质认证]]、[[合同审批流程]] 与采购管理制度。`,
    sources: ['采购管理制度.pdf P2'],
    related: ['供应商资质认证', '合同审批流程'],
    status: 'reviewing', citeRate: 76, priority: '中', author: '李婷', updated: '5小时前', views: 0, version: 'v1.0-draft',
  },
  {
    id: '6', slug: 'payment-terms', title: '付款条款汇总', pageType: 'comparison',
    content: `## 对比分析\n| 合同类型 | 账期 | 违约金关联 |\n| 采购合同 | 30天 | [[供应商违约金]] |\n| 服务合同 | 45天 | 固定比例 |`,
    sources: ['财务付款规范.pdf P5', '供应商合同模板V5.pdf P6'],
    related: ['供应商违约金'],
    status: 'compiling', citeRate: null, priority: '中', author: '王磊', updated: '编译中', views: 56, version: 'v2.0',
  },
  {
    id: '7', slug: 'raw-contract-v5', title: '供应商合同模板V5 摘要', pageType: 'raw',
    content: `## Source Note\n原始资料 \`raw/供应商合同模板V5.pdf\` 的 LLM 摘要页，不可修改原文，仅索引要点。\n\n- 第 5 章：违约责任\n- 第 8 章：保密条款`,
    sources: ['raw/供应商合同模板V5.pdf'],
    related: ['供应商违约金', '保密义务'],
    status: 'published', citeRate: null, priority: '低', author: '系统', updated: '3天前', views: 45, version: 'v1.0',
    rawSource: 'raw/供应商合同模板V5.pdf',
  },
  {
    id: '8', slug: 'nda-template', title: 'NDA标准模板 摘录', pageType: 'raw',
    content: `## 原始摘录\n\`raw/NDA标准模板.docx\` 第 3 条保密义务原文索引。`,
    sources: ['raw/NDA标准模板.docx'],
    related: ['保密义务'],
    status: 'published', citeRate: null, priority: '低', author: '系统', updated: '2天前', views: 22, version: 'v1.0',
    rawSource: 'raw/NDA标准模板.docx',
  },
  {
    id: '9', slug: 'procurement-policy', title: '采购政策解读', pageType: 'synthesis',
    content: `## 政策要点\n2026 年采购政策强调供应商多元化与合规审查前置。`,
    sources: ['raw/2026采购政策.pdf'],
    related: ['采购流程规范'],
    status: 'failed', citeRate: null, priority: '低', author: '系统', updated: '2天前', views: 12, version: 'v0.9',
  },
  {
    id: '10', slug: 'wiki-index', title: 'index.md', pageType: 'index',
    content: `## Wiki 目录索引\n本页由 LLM 自动维护，记录 wiki/ 下所有页面的层级归属与交叉引用入口。\n\n- 查询时 LLM 先读 index.md 定位相关页面（Karpathy Query 工作流）\n- 每次 Ingest 后自动更新`,
    sources: [],
    related: [],
    status: 'published', citeRate: null, priority: '高', author: '系统', updated: '刚刚', views: 890, version: 'auto',
  },
  {
    id: '11', slug: 'wiki-log', title: 'log.md', pageType: 'log',
    content: `## 操作日志\n- 6/7 10:32 Ingest raw/供应商合同模板V5.pdf → 更新 4 页\n- 6/7 09:15 Lint 检查：发现 1 处矛盾（违约金上限）\n- 6/6 08:00 编译 [[供应商违约金]] v3.2`,
    sources: [],
    related: ['供应商违约金'],
    status: 'published', citeRate: null, priority: '低', author: '系统', updated: '1小时前', views: 56, version: 'auto',
  },
];

/** wiki/ 目录树 — 对应 index.md catalog，左侧浏览器主视图 */
export const WIKI_TREE: WikiTreeNode = {
  id: 'root', title: 'index.md', nodeType: 'folder', pageType: 'index', slug: 'wiki-index',
  children: [
    {
      id: 'raw', title: 'raw/ 原始资料', nodeType: 'folder', pageType: 'raw',
      children: [
        { id: 'raw-1', title: '供应商合同模板V5 摘要', nodeType: 'page', pageType: 'raw', slug: 'raw-contract-v5', status: 'published' },
        { id: 'raw-2', title: 'NDA标准模板 摘录', nodeType: 'page', pageType: 'raw', slug: 'nda-template', status: 'published' },
      ],
    },
    {
      id: 'entities', title: '实体页面 entity/', nodeType: 'folder', pageType: 'entity',
      children: [
        {
          id: 'domain-contract', title: '合同知识域', nodeType: 'folder',
          children: [
            { id: 'e1', title: '供应商违约金', nodeType: 'page', pageType: 'entity', slug: 'supplier-penalty', status: 'published', citeRate: 92 },
            { id: 'e2', title: '合同解除权', nodeType: 'page', pageType: 'entity', slug: 'contract-termination', status: 'compiling', citeRate: null },
            { id: 'e3', title: '保密义务', nodeType: 'page', pageType: 'entity', slug: 'confidentiality', status: 'reviewing', citeRate: 88 },
          ],
        },
      ],
    },
    {
      id: 'concepts', title: '概念页面 concept/', nodeType: 'folder', pageType: 'concept',
      children: [
        { id: 'c1', title: '违约责任体系', nodeType: 'page', pageType: 'concept', slug: 'breach-liability', status: 'published', citeRate: 85 },
      ],
    },
    {
      id: 'synthesis', title: '综合分析 synthesis/', nodeType: 'folder', pageType: 'synthesis',
      children: [
        { id: 's1', title: '采购流程规范', nodeType: 'page', pageType: 'synthesis', slug: 'procurement-flow', status: 'reviewing', citeRate: 76 },
        { id: 's2', title: '付款条款汇总', nodeType: 'page', pageType: 'comparison', slug: 'payment-terms', status: 'compiling', citeRate: null },
        { id: 's3', title: '采购政策解读', nodeType: 'page', pageType: 'synthesis', slug: 'procurement-policy', status: 'failed', citeRate: null },
      ],
    },
    {
      id: 'meta', title: '元数据', nodeType: 'folder',
      children: [
        { id: 'log', title: 'log.md', nodeType: 'page', pageType: 'log', slug: 'wiki-log', status: 'published' },
      ],
    },
  ],
};

/** 知识库原始文档列表 — Karpathy 工作流：先 raw/ Ingest，再维护 wiki/ */
export const WIKI_SOURCE_DOCS: WikiSourceDoc[] = [
  {
    id: 'd1', name: '供应商合同模板V5.pdf', rawPath: 'raw/供应商合同模板V5.pdf',
    fileType: 'PDF', size: '2.3 MB', ingestStatus: 'compiled', wikiPageCount: 4,
    relatedSlugs: ['raw-contract-v5', 'supplier-penalty', 'contract-termination', 'confidentiality'],
    primaryWikiSlug: 'raw-contract-v5', lastIngest: '6/7 10:32',
    ingestNote: 'Ingest 后更新 4 个 entity/concept 页',
  },
  {
    id: 'd2', name: 'NDA标准模板.docx', rawPath: 'raw/NDA标准模板.docx',
    fileType: 'DOCX', size: '1.0 MB', ingestStatus: 'compiled', wikiPageCount: 2,
    relatedSlugs: ['nda-template', 'confidentiality'],
    primaryWikiSlug: 'nda-template', lastIngest: '6/6 14:20',
    ingestNote: '生成 raw 摘要 + 更新 [[保密义务]]',
  },
  {
    id: 'd3', name: '采购管理制度.pdf', rawPath: 'raw/采购管理制度.pdf',
    fileType: 'PDF', size: '3.8 MB', ingestStatus: 'compiling', wikiPageCount: 1,
    relatedSlugs: ['procurement-flow', 'breach-liability'],
    primaryWikiSlug: 'procurement-flow', lastIngest: '编译中…',
    ingestNote: 'LLM 正在综合 synthesis 页',
  },
  {
    id: 'd4', name: '财务付款规范.pdf', rawPath: 'raw/财务付款规范.pdf',
    fileType: 'PDF', size: '1.5 MB', ingestStatus: 'pending', wikiPageCount: 0,
    relatedSlugs: [], primaryWikiSlug: 'payment-terms', lastIngest: '—',
    ingestNote: '尚未 Ingest，可手动触发',
  },
  {
    id: 'd5', name: '2026采购政策.pdf', rawPath: 'raw/2026采购政策.pdf',
    fileType: 'PDF', size: '0.9 MB', ingestStatus: 'failed', wikiPageCount: 1,
    relatedSlugs: ['procurement-policy'],
    primaryWikiSlug: 'procurement-policy', lastIngest: '6/6 18:20',
    ingestNote: '编译失败：实体抽取超时',
  },
  {
    id: 'd6', name: '供应商资质认证指南.pdf', rawPath: 'raw/供应商资质认证指南.pdf',
    fileType: 'PDF', size: '4.2 MB', ingestStatus: 'pending', wikiPageCount: 0,
    relatedSlugs: [], primaryWikiSlug: 'wiki-index', lastIngest: '—',
  },
];

export const WIKI_COMPILE_QUEUE: WikiCompileJob[] = [
  { id: 'q1', title: '保密义务', status: 'reviewing', progress: 100, step: '待人工审核', citeRate: 88, priority: '高', started: '完成于 10:32' },
  { id: 'q2', title: '采购流程规范', status: 'reviewing', progress: 100, step: '待人工审核', citeRate: 76, priority: '中', started: '完成于 09:15' },
  { id: 'q3', title: '合同解除权', status: 'compiling', progress: 60, step: 'Ingest → 更新 entity 页', citeRate: null, priority: '中', started: '3分钟前' },
  { id: 'q4', title: '付款条款汇总', status: 'compiling', progress: 30, step: 'LLM 跨文档综合', citeRate: null, priority: '中', started: '5分钟前' },
  { id: 'q5', title: '采购政策解读', status: 'failed', progress: 40, step: '编译失败：raw 源缺失', citeRate: null, priority: '低', started: '昨天 18:20' },
];

export const WIKI_COMMITS: WikiCommit[] = [
  { id: '6f2a', message: '更新违约金上限为 20%', author: '李婷', time: '6/6 08:00', diff: { removed: '上限 30%', added: '上限 20%' } },
  { id: '3b1c', message: 'LLM 自动编译初版（Ingest raw/合同模板）', author: '系统', time: '6/1 14:00' },
  { id: '9d4e', message: '从 Chunk 聚合生成 entity 页', author: '系统', time: '5/28 10:00' },
];

export const WIKI_STATS = {
  published: 12,
  total: 42,
  reviewing: 3,
  compiling: 2,
  failed: 1,
  totalViews: '4.2K',
  avgCiteRate: 84,
  layerDist: [
    { layer: 'raw/ 原始', count: 8, pct: 19 },
    { layer: 'entity 实体', count: 18, pct: 43 },
    { layer: 'concept 概念', count: 6, pct: 14 },
    { layer: 'synthesis 综合', count: 10, pct: 24 },
  ],
  weeklyCompile: [12, 8, 15, 6, 18, 10, 14],
  topCited: [
    { title: '供应商违约金', cites: 143 },
    { title: '违约责任体系', cites: 98 },
    { title: '保密义务', cites: 87 },
  ],
  lintIssues: 2,
};

export function getWikiPage(slug: string): WikiPage | undefined {
  return WIKI_PAGES.find(p => p.slug === slug);
}

/** 按 Layer 筛选 + 搜索过滤目录树 */
export function filterWikiTree(
  node: WikiTreeNode,
  layerFilter: WikiPageType | 'all',
  search: string,
): WikiTreeNode | null {
  if (node.nodeType === 'page') {
    if (layerFilter !== 'all' && node.pageType !== layerFilter && !(layerFilter === 'synthesis' && node.pageType === 'comparison')) {
      return null;
    }
    if (search && !node.title.includes(search)) return null;
    return node;
  }

  const filteredChildren = (node.children ?? [])
    .map(child => filterWikiTree(child, layerFilter, search))
    .filter((c): c is WikiTreeNode => c !== null);

  if (node.id === 'root') {
    return { ...node, children: filteredChildren };
  }
  if (filteredChildren.length === 0 && search) return null;
  if (filteredChildren.length === 0 && layerFilter !== 'all') return null;
  return { ...node, children: filteredChildren };
}
