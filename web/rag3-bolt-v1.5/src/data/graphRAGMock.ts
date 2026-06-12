export type GraphIndexMode = 'lazy' | 'full' | 'lightrag';
export type GraphDocIndexStatus = 'indexed' | 'building' | 'pending' | 'failed';

/** 知识库文档 — 图谱构建入口，先于库级可视化 */
export interface GraphSourceDoc {
  id: string;
  name: string;
  fileType: string;
  size: string;
  pages: number;
  indexStatus: GraphDocIndexStatus;
  entityCount: number;
  relationCount: number;
  communityIds: string[];
  nodeIds: string[];
  primaryNodeId: string;
  mode: GraphIndexMode;
  updated: string;
  note?: string;
  failReason?: string;
  buildProgress?: number;
}
export type GraphEntityType = 'ORG' | 'PERSON' | 'CLAUSE' | 'DOC' | 'EVENT' | 'DATE';
export type GraphSearchMode = 'local' | 'global' | 'dual';
export type GraphBuildStage = 'chunk' | 'entity' | 'relation' | 'graph_write' | 'community' | 'summary' | 'done' | 'failed';
export type GraphSummaryStatus = 'generated' | 'on_query' | 'failed' | 'pregenerating';
export type GraphReviewStatus = 'pending' | 'confirmed' | 'rejected';

export interface GraphNode {
  id: string;
  label: string;
  entityType: GraphEntityType;
  communityId: string;
  x: number;
  y: number;
  size: number;
  connections: number;
  confidence: number;
  source?: string;
  summary?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  confidence: number;
}

export interface GraphCommunity {
  id: string;
  name: string;
  entityCount: number;
  level: number;
  summaryStatus: GraphSummaryStatus;
  summary: string;
  detail: string;
  queryHits?: number;
}

export interface GraphBuildJob {
  id: string;
  docName: string;
  mode: GraphIndexMode;
  stage: GraphBuildStage;
  progress: number;
  stepLabel: string;
  updated: string;
  failReason?: string;
}

export interface GraphReviewItem {
  id: string;
  itemType: 'entity' | 'relation';
  content: string;
  entityType?: GraphEntityType;
  fromLabel?: string;
  toLabel?: string;
  relation?: string;
  confidence: number;
  source: string;
  status: GraphReviewStatus;
}

export interface GraphSearchPath {
  mode: GraphSearchMode;
  query: string;
  localPath: { nodes: string[]; edges: string[]; description: string };
  globalCommunity?: { id: string; name: string; summary: string };
  totalMs: number;
}

export const GRAPH_STATS = {
  entities: 1247,
  relations: 3891,
  communities: 48,
  indexedDocs: 42,
  totalDocs: 156,
  failedDocs: 14,
  graphDiameter: 8,
  lazyCostYuan: 12,
  fullCostYuan: 1200,
  queryModeDist: { local: 68, global: 22, hybrid: 10 },
  topEntities: [
    { name: '供应商', type: 'ORG' as GraphEntityType, connections: 186, color: '#f59e0b' },
    { name: '违约金条款', type: 'CLAUSE' as GraphEntityType, connections: 142, color: '#3b82f6' },
    { name: '采购方', type: 'ORG' as GraphEntityType, connections: 128, color: '#10b981' },
    { name: '保密义务', type: 'CLAUSE' as GraphEntityType, connections: 98, color: '#8b5cf6' },
  ],
  communitySizes: [35, 52, 28, 86, 44, 67, 31, 58, 23, 41, 72, 39],
};

export const ENTITY_TYPE_CFG: Record<GraphEntityType, { label: string; color: string }> = {
  ORG: { label: '组织', color: '#f59e0b' },
  PERSON: { label: '人物', color: '#10b981' },
  CLAUSE: { label: '条款', color: '#3b82f6' },
  DOC: { label: '文档', color: '#8b5cf6' },
  EVENT: { label: '事件', color: '#ec4899' },
  DATE: { label: '日期', color: '#6b7280' },
};

export const GRAPH_NODES: GraphNode[] = [
  { id: 'n1', label: '供应商', entityType: 'ORG', communityId: 'C3', x: 22, y: 45, size: 22, connections: 5, confidence: 0.96, source: '合同模板V5.pdf P1', summary: '合同供货方主体' },
  { id: 'n2', label: '采购方', entityType: 'ORG', communityId: 'C3', x: 78, y: 45, size: 20, connections: 4, confidence: 0.94, source: '合同模板V5.pdf P1' },
  { id: 'n3', label: '合同模板V5', entityType: 'DOC', communityId: 'C3', x: 50, y: 28, size: 24, connections: 6, confidence: 0.98, source: '合同模板V5.pdf' },
  { id: 'n4', label: '违约金条款', entityType: 'CLAUSE', communityId: 'C3', x: 35, y: 68, size: 18, connections: 4, confidence: 0.94, source: '合同模板V5.pdf P3', summary: '迟延交货按日 0.5%，上限 20%' },
  { id: 'n5', label: '保密义务', entityType: 'CLAUSE', communityId: 'C9', x: 65, y: 68, size: 17, connections: 3, confidence: 0.91, source: '合同模板V5.pdf P8' },
  { id: 'n6', label: '合同解除权', entityType: 'CLAUSE', communityId: 'C3', x: 50, y: 82, size: 16, connections: 3, confidence: 0.89, source: '合同模板V5.pdf P4' },
  { id: 'n7', label: '付款条件', entityType: 'CLAUSE', communityId: 'C2', x: 82, y: 22, size: 15, connections: 2, confidence: 0.87, source: '采购协议条款.pdf P4' },
  { id: 'n8', label: '华东办事处', entityType: 'ORG', communityId: 'C7', x: 12, y: 22, size: 14, connections: 1, confidence: 0.58, source: '内部邮件.eml' },
  { id: 'n9', label: '评级降级', entityType: 'EVENT', communityId: 'C7', x: 18, y: 72, size: 14, connections: 2, confidence: 0.78, source: '供应商管理规范.docx' },
  { id: 'n10', label: '李婷', entityType: 'PERSON', communityId: 'C1', x: 88, y: 72, size: 13, connections: 2, confidence: 0.85, source: '审批记录.pdf' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', from: 'n1', to: 'n3', relation: '签署', confidence: 0.95 },
  { id: 'e2', from: 'n2', to: 'n3', relation: '签署', confidence: 0.93 },
  { id: 'e3', from: 'n3', to: 'n4', relation: '包含', confidence: 0.97 },
  { id: 'e4', from: 'n3', to: 'n5', relation: '包含', confidence: 0.96 },
  { id: 'e5', from: 'n3', to: 'n6', relation: '包含', confidence: 0.94 },
  { id: 'e6', from: 'n1', to: 'n4', relation: '违约触发', confidence: 0.88 },
  { id: 'e7', from: 'n4', to: 'n6', relation: '引用', confidence: 0.86 },
  { id: 'e8', from: 'n2', to: 'n7', relation: '约定', confidence: 0.84 },
  { id: 'e9', from: 'n1', to: 'n9', relation: '触发', confidence: 0.72 },
  { id: 'e10', from: 'n8', to: 'n1', relation: '隶属', confidence: 0.55 },
  { id: 'e11', from: 'n10', to: 'n3', relation: '审批', confidence: 0.81 },
];

export const GRAPH_COMMUNITIES: GraphCommunity[] = [
  { id: 'C3', name: '合同违约条款', entityCount: 86, level: 1, summaryStatus: 'generated',
    summary: '本社区围绕采购合同违约金、解除条件、迟延交货等核心条款',
    detail: '违约金比例 0.3%-0.5%，迟延交货千分之五/日，累计上限 20%。涉及供应商、采购方与合同模板V5 等实体。', queryHits: 342 },
  { id: 'C2', name: '付款与结算', entityCount: 42, level: 1, summaryStatus: 'generated',
    summary: '涵盖付款条件、账期、逾期利息与结算流程',
    detail: '月结 60 天，逾期年化 8%，与财务付款规范交叉引用。', queryHits: 128 },
  { id: 'C9', name: '保密与合规', entityCount: 31, level: 2, summaryStatus: 'generated',
    summary: '保密义务范围、期限与例外情形',
    detail: '保密期限：合同履行期间 + 终止后 5 年。', queryHits: 87 },
  { id: 'C7', name: '供应链风险', entityCount: 42, level: 1, summaryStatus: 'on_query',
    summary: 'LazyGraphRAG：查询时按需生成社区摘要',
    detail: '含供应商评级、区域办事处、资质认证等实体，待首次 Global 查询触发摘要生成。' },
  { id: 'C1', name: '审批与流程', entityCount: 28, level: 2, summaryStatus: 'on_query',
    summary: '合同审批链路与责任人',
    detail: '采购、法务、财务多级审批节点。' },
  { id: 'C12', name: '知识产权归属', entityCount: 19, level: 2, summaryStatus: 'failed',
    summary: '社区摘要生成失败',
    detail: 'LLM 超时：实体过于分散，建议调高 Leiden resolution。', queryHits: 0 },
];

export const DOC_INDEX_STATUS_CFG: Record<GraphDocIndexStatus, { variant: 'active' | 'indexing' | 'draft' | 'error'; label: string }> = {
  indexed: { variant: 'active', label: '已索引' },
  building: { variant: 'indexing', label: '构建中' },
  pending: { variant: 'draft', label: '待构建' },
  failed: { variant: 'error', label: '失败' },
};

/** 文档列表 — 切块→实体抽取→关系抽取→入图，按文档下钻子图 */
export const GRAPH_SOURCE_DOCS: GraphSourceDoc[] = [
  {
    id: 'g1', name: '供应商合同模板V5.pdf', fileType: 'PDF', size: '2.3 MB', pages: 12,
    indexStatus: 'indexed', entityCount: 18, relationCount: 42, communityIds: ['C3', 'C9'],
    nodeIds: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'], primaryNodeId: 'n3', mode: 'lazy',
    updated: '2 小时前', note: '核心合同知识域，含违约/保密条款',
  },
  {
    id: 'g2', name: '采购协议条款.pdf', fileType: 'PDF', size: '1.8 MB', pages: 8,
    indexStatus: 'indexed', entityCount: 12, relationCount: 28, communityIds: ['C2'],
    nodeIds: ['n2', 'n7'], primaryNodeId: 'n7', mode: 'lazy',
    updated: '1 天前', note: '付款条件与采购方关联',
  },
  {
    id: 'g3', name: '供应商管理规范.docx', fileType: 'DOCX', size: '1.2 MB', pages: 10,
    indexStatus: 'indexed', entityCount: 8, relationCount: 14, communityIds: ['C7'],
    nodeIds: ['n1', 'n8', 'n9'], primaryNodeId: 'n9', mode: 'lazy',
    updated: '2 天前', note: '供应链风险与评级事件',
  },
  {
    id: 'g4', name: '合同模板V6.pdf', fileType: 'PDF', size: '2.5 MB', pages: 14,
    indexStatus: 'building', entityCount: 6, relationCount: 4, communityIds: [],
    nodeIds: [], primaryNodeId: 'n3', mode: 'lazy',
    updated: '刚刚', buildProgress: 72, note: '关系抽取进行中',
  },
  {
    id: 'g5', name: '财报Q2.pdf', fileType: 'PDF', size: '4.8 MB', pages: 32,
    indexStatus: 'failed', entityCount: 0, relationCount: 0, communityIds: [],
    nodeIds: [], primaryNodeId: 'n3', mode: 'lazy',
    updated: '1 小时前', failReason: '实体抽取 LLM 超时',
  },
  {
    id: 'g6', name: '内部邮件.eml', fileType: 'EML', size: '0.2 MB', pages: 1,
    indexStatus: 'pending', entityCount: 0, relationCount: 0, communityIds: [],
    nodeIds: ['n8'], primaryNodeId: 'n8', mode: 'lazy',
    updated: '—', note: '待触发图谱构建',
  },
  {
    id: 'g7', name: '审批记录.pdf', fileType: 'PDF', size: '0.6 MB', pages: 4,
    indexStatus: 'indexed', entityCount: 5, relationCount: 8, communityIds: ['C1'],
    nodeIds: ['n10', 'n3'], primaryNodeId: 'n10', mode: 'full',
    updated: '3 天前',
  },
  {
    id: 'g8', name: '合规政策.docx', fileType: 'DOCX', size: '3.2 MB', pages: 16,
    indexStatus: 'building', entityCount: 3, relationCount: 2, communityIds: [],
    nodeIds: [], primaryNodeId: 'n5', mode: 'full',
    updated: '10 分钟前', buildProgress: 45, note: 'Leiden 社区检测中',
  },
];

export const GRAPH_BUILD_QUEUE: GraphBuildJob[] = [
  { id: 'b1', docName: '合同模板V6.pdf', mode: 'lazy', stage: 'relation', progress: 72, stepLabel: '关系抽取 18/24 实体对', updated: '刚刚' },
  { id: 'b2', docName: '合规政策.docx', mode: 'full', stage: 'community', progress: 45, stepLabel: 'Leiden 社区检测', updated: '5 分钟前' },
  { id: 'b3', docName: '财报Q2.pdf', mode: 'lazy', stage: 'failed', progress: 35, stepLabel: '实体抽取超时', updated: '1 小时前', failReason: '实体抽取 LLM 超时' },
  { id: 'b4', docName: '采购协议条款.pdf', mode: 'lazy', stage: 'done', progress: 100, stepLabel: '已完成（跳过社区预计算）', updated: '2 小时前' },
  { id: 'b5', docName: 'NDA标准模板.docx', mode: 'full', stage: 'queued', progress: 0, stepLabel: '等待队列', updated: '—' },
];

export const GRAPH_REVIEW_QUEUE: GraphReviewItem[] = [
  { id: 'r1', itemType: 'relation', content: '供应商 ─违约→ 采购方', fromLabel: '供应商', toLabel: '采购方', relation: '违约', confidence: 0.62, source: '合同V5 P8', status: 'pending' },
  { id: 'r2', itemType: 'entity', content: '华东办事处', entityType: 'ORG', confidence: 0.58, source: '内部邮件.eml', status: 'pending' },
  { id: 'r3', itemType: 'relation', content: '评级降级 ─影响→ 供应商', fromLabel: '评级降级', toLabel: '供应商', relation: '影响', confidence: 0.65, source: '供应商管理规范.docx', status: 'pending' },
  { id: 'r4', itemType: 'entity', content: '逾期利息', entityType: 'CLAUSE', confidence: 0.82, source: '付款条款汇总.wiki', status: 'pending' },
  { id: 'r5', itemType: 'entity', content: '合同生效日', entityType: 'DATE', confidence: 0.91, source: '合同模板V5.pdf', status: 'confirmed' },
  { id: 'r6', itemType: 'relation', content: '采购方 ─约定→ 付款条件', fromLabel: '采购方', toLabel: '付款条件', relation: '约定', confidence: 0.88, source: '采购协议条款.pdf', status: 'confirmed' },
];

export const GRAPH_SEARCH_PRESETS: Record<string, GraphSearchPath> = {
  '供应商违约金如何计算': {
    mode: 'local',
    query: '供应商违约金如何计算',
    localPath: {
      nodes: ['n1', 'n3', 'n4'],
      edges: ['e1', 'e3', 'e6'],
      description: 'Local 2-hop：供应商 → 合同模板V5 → 违约金条款',
    },
    totalMs: 680,
  },
  'X公司收购Y的影响': {
    mode: 'dual',
    query: 'X公司收购Y的影响',
    localPath: {
      nodes: ['n1', 'n2', 'n6'],
      edges: ['e1', 'e2', 'e5'],
      description: 'Local：收购主体 → 合同解除权条款',
    },
    globalCommunity: { id: 'C7', name: '并购与整合', summary: '本社区涵盖收购后的合同变更、供应商资质重审与整合风险…' },
    totalMs: 2100,
  },
};

export const GRAPH_DEFAULT_SETTINGS = {
  indexMode: 'lazy' as GraphIndexMode,
  entityTypes: ['ORG', 'PERSON', 'CLAUSE', 'DOC', 'EVENT'] as GraphEntityType[],
  relationLlm: 'deepseek-v4',
  communityAlgo: 'leiden',
  graphStore: 'neo4j',
  lazyOnQuerySummary: true,
  lazySkipPrecompute: true,
  fullAutoSummary: true,
  maxCommunities: 200,
  leidenResolution: 1.0,
  maxHops: 2,
};

export function getGraphNode(id: string): GraphNode | undefined {
  return GRAPH_NODES.find(n => n.id === id);
}

export function getGraphSourceDoc(id: string): GraphSourceDoc | undefined {
  return GRAPH_SOURCE_DOCS.find(d => d.id === id);
}

export function getDocSubgraph(nodeIds: string[]) {
  const ids = new Set(nodeIds);
  const nodes = GRAPH_NODES.filter(n => ids.has(n.id));
  const edges = GRAPH_EDGES.filter(e => ids.has(e.from) && ids.has(e.to));
  return { nodes, edges };
}

export function runMockGraphSearch(query: string, mode: GraphSearchMode): GraphSearchPath {
  const preset = GRAPH_SEARCH_PRESETS[query];
  if (preset) return { ...preset, mode: mode === 'dual' ? 'dual' : preset.mode === 'dual' ? 'local' : mode };
  return {
    mode,
    query,
    localPath: {
      nodes: ['n1', 'n3', 'n4'],
      edges: ['e1', 'e3'],
      description: 'Local 2-hop 默认路径',
    },
    globalCommunity: mode !== 'local' ? { id: 'C3', name: '合同违约条款', summary: GRAPH_COMMUNITIES[0].summary } : undefined,
    totalMs: mode === 'local' ? 520 : mode === 'global' ? 1800 : 2400,
  };
}

export const BUILD_STAGE_LABEL: Record<GraphBuildStage, string> = {
  chunk: '切块',
  entity: '实体抽取',
  relation: '关系抽取',
  graph_write: '图谱写入',
  community: '社区检测',
  summary: '社区摘要',
  done: '完成',
  failed: '失败',
};

export const SUMMARY_STATUS_CFG: Record<GraphSummaryStatus, { variant: 'active' | 'indexing' | 'draft' | 'error'; label: string }> = {
  generated: { variant: 'active', label: '已生成' },
  on_query: { variant: 'indexing', label: '查询时生成' },
  failed: { variant: 'error', label: '失败' },
  pregenerating: { variant: 'indexing', label: '预生成中' },
};

export const INDEX_MODE_LABEL: Record<GraphIndexMode, { label: string; desc: string }> = {
  lazy: { label: 'LazyGraphRAG', desc: '索引成本 ~0.1%，查询时生成社区摘要 +2~8s' },
  full: { label: 'GraphRAG 全量', desc: '预计算 Leiden 社区 + LLM 摘要，查询快成本高' },
  lightrag: { label: 'LightRAG', desc: '双层检索 hybrid/local/global，支持增量更新' },
};
