export type ServiceHealth = 'healthy' | 'degraded' | 'down';

export type AlertLevel = 'P0' | 'P1' | 'P2';

export interface InfraMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: 'activity' | 'zap' | 'alert' | 'cpu';
}

export interface ServiceStatus {
  name: string;
  health: ServiceHealth;
  detail?: string;
}

export interface AlertRule {
  id: string;
  level: AlertLevel;
  condition: string;
  channel: string;
  enabled: boolean;
}

export interface RecentAlert {
  id: string;
  level: AlertLevel;
  message: string;
  time: string;
  resolved: boolean;
}

export interface PipelineLatencyRow {
  key: string;
  name: string;
  avgMs: number;
  p95Ms: number;
  pct: number;
  color: string;
  calls24h: number;
}

export interface KBIndexAggregateRow {
  kbId: string;
  kbName: string;
  wiki: { done: number; total: number; compiling?: number; pendingReview?: number };
  pageindex: { done: number; total: number; failed?: number };
  graph: { done: number; total: number; building?: number } | null;
  alertCount: number;
  alertTags: string[];
}

export interface CostSnapshot {
  todayTokens: string;
  todayCost: number;
  monthTokens: string;
  monthCost: number;
  budgetTotal: number;
  budgetUsed: number;
  currency: string;
}

export interface ModelCostShare {
  model: string;
  pct: number;
  color: string;
  tokens: string;
}

export const INFRA_METRICS: InfraMetric[] = [
  { label: 'QPS', value: '1,250/s', change: '+15%', positive: true, icon: 'activity' },
  { label: 'P95 延迟', value: '1.8s', change: '-0.2s', positive: true, icon: 'zap' },
  { label: '错误率', value: '0.3%', change: '稳定', positive: true, icon: 'alert' },
  { label: 'GPU 利用率', value: '78%', change: '+5%', positive: false, icon: 'cpu' },
];

export const SERVICE_STATUSES: ServiceStatus[] = [
  { name: 'API Gateway', health: 'healthy' },
  { name: 'Milvus', health: 'healthy' },
  { name: 'Elasticsearch', health: 'healthy' },
  { name: 'Neo4j', health: 'degraded', detail: '副本同步延迟' },
  { name: 'Wiki Git', health: 'healthy' },
  { name: 'GPU Pool', health: 'healthy' },
];

export const ALERT_RULES: AlertRule[] = [
  { id: 'ar-1', level: 'P0', condition: 'Faithfulness 突降 30%+', channel: '电话 + 企业微信', enabled: true },
  { id: 'ar-2', level: 'P1', condition: 'P95 延迟 > 10s', channel: '企业微信', enabled: true },
  { id: 'ar-3', level: 'P2', condition: '日成本 > ¥500', channel: '邮件 + Jira', enabled: true },
  { id: 'ar-4', level: 'P2', condition: 'PageIndex 建树失败率 > 5%', channel: '企业微信', enabled: false },
];

export const RECENT_ALERTS: RecentAlert[] = [
  { id: 'al-1', level: 'P1', message: 'P3 GraphRAG P95 延迟 2.4s 超阈值', time: '12 分钟前', resolved: false },
  { id: 'al-2', level: 'P2', message: '研发文档库 Wiki 编译队列积压 5 篇', time: '38 分钟前', resolved: false },
  { id: 'al-3', level: 'P0', message: 'Faithfulness 较基线下降 32%（评测任务 #128）', time: '2 小时前', resolved: true },
];

export const QPS_TREND_24H = [820, 940, 1100, 1050, 1180, 1250, 1320, 1280, 1190, 1240, 1310, 1250];

export const PIPELINE_LATENCIES: Record<string, PipelineLatencyRow[]> = {
  '1h': [
    { key: 'P1', name: 'P1 向量检索', avgMs: 420, p95Ms: 780, pct: 42, color: 'bg-blue-500', calls24h: 8420 },
    { key: 'P2', name: 'P2 PageIndex', avgMs: 490, p95Ms: 980, pct: 49, color: 'bg-purple-500', calls24h: 5210 },
    { key: 'P3', name: 'P3 GraphRAG', avgMs: 1150, p95Ms: 2280, pct: 95, color: 'bg-orange-500', calls24h: 1890 },
    { key: 'P4', name: 'P4 Wiki', avgMs: 165, p95Ms: 340, pct: 16, color: 'bg-green-500', calls24h: 3120 },
    { key: 'P5', name: 'P5 Agent', avgMs: 3200, p95Ms: 5800, pct: 100, color: 'bg-red-500', calls24h: 420 },
  ],
  '6h': [
    { key: 'P1', name: 'P1 向量检索', avgMs: 435, p95Ms: 810, pct: 44, color: 'bg-blue-500', calls24h: 8420 },
    { key: 'P2', name: 'P2 PageIndex', avgMs: 505, p95Ms: 1000, pct: 51, color: 'bg-purple-500', calls24h: 5210 },
    { key: 'P3', name: 'P3 GraphRAG', avgMs: 1180, p95Ms: 2350, pct: 98, color: 'bg-orange-500', calls24h: 1890 },
    { key: 'P4', name: 'P4 Wiki', avgMs: 172, p95Ms: 360, pct: 17, color: 'bg-green-500', calls24h: 3120 },
    { key: 'P5', name: 'P5 Agent', avgMs: 3350, p95Ms: 5900, pct: 100, color: 'bg-red-500', calls24h: 420 },
  ],
  '24h': [
    { key: 'P1', name: 'P1 向量检索', avgMs: 450, p95Ms: 820, pct: 45, color: 'bg-blue-500', calls24h: 8420 },
    { key: 'P2', name: 'P2 PageIndex', avgMs: 520, p95Ms: 1020, pct: 52, color: 'bg-purple-500', calls24h: 5210 },
    { key: 'P3', name: 'P3 GraphRAG', avgMs: 1200, p95Ms: 2400, pct: 100, color: 'bg-orange-500', calls24h: 1890 },
    { key: 'P4', name: 'P4 Wiki', avgMs: 180, p95Ms: 380, pct: 18, color: 'bg-green-500', calls24h: 3120 },
    { key: 'P5', name: 'P5 Agent', avgMs: 3500, p95Ms: 6000, pct: 100, color: 'bg-red-500', calls24h: 420 },
  ],
  '7d': [
    { key: 'P1', name: 'P1 向量检索', avgMs: 468, p95Ms: 860, pct: 47, color: 'bg-blue-500', calls24h: 58940 },
    { key: 'P2', name: 'P2 PageIndex', avgMs: 538, p95Ms: 1080, pct: 54, color: 'bg-purple-500', calls24h: 36470 },
    { key: 'P3', name: 'P3 GraphRAG', avgMs: 1240, p95Ms: 2520, pct: 100, color: 'bg-orange-500', calls24h: 13230 },
    { key: 'P4', name: 'P4 Wiki', avgMs: 192, p95Ms: 400, pct: 19, color: 'bg-green-500', calls24h: 21840 },
    { key: 'P5', name: 'P5 Agent', avgMs: 3620, p95Ms: 6200, pct: 100, color: 'bg-red-500', calls24h: 2940 },
  ],
};

export const KB_INDEX_AGGREGATE: KBIndexAggregateRow[] = [
  {
    kbId: 'kb-001',
    kbName: '法务合同知识库',
    wiki: { done: 12, total: 42, pendingReview: 3 },
    pageindex: { done: 85, total: 156, failed: 12 },
    graph: { done: 42, total: 156 },
    alertCount: 2,
    alertTags: ['Wiki', 'PI'],
  },
  {
    kbId: 'kb-002',
    kbName: '财务报告知识库',
    wiki: { done: 8, total: 20 },
    pageindex: { done: 60, total: 89 },
    graph: { done: 30, total: 89 },
    alertCount: 0,
    alertTags: [],
  },
  {
    kbId: 'kb-003',
    kbName: '研发技术文档库',
    wiki: { done: 18, total: 56, compiling: 5 },
    pageindex: { done: 120, total: 234 },
    graph: null,
    alertCount: 5,
    alertTags: ['Wiki', 'Graph'],
  },
  {
    kbId: 'kb-004',
    kbName: '合规政策知识库',
    wiki: { done: 6, total: 12 },
    pageindex: { done: 38, total: 45 },
    graph: { done: 22, total: 45, building: 3 },
    alertCount: 1,
    alertTags: ['Graph'],
  },
  {
    kbId: 'kb-005',
    kbName: '培训材料知识库',
    wiki: { done: 14, total: 28 },
    pageindex: { done: 52, total: 78 },
    graph: { done: 18, total: 78 },
    alertCount: 0,
    alertTags: [],
  },
  {
    kbId: 'kb-006',
    kbName: '产品手册知识库',
    wiki: { done: 22, total: 35, compiling: 2 },
    pageindex: { done: 95, total: 112, failed: 3 },
    graph: { done: 48, total: 112 },
    alertCount: 1,
    alertTags: ['PI'],
  },
];

export const INDEX_SUMMARY = {
  wikiCompiling: 12,
  wikiPendingReview: 5,
  pageindexFailed: 8,
  graphBuilding: 3,
  lastUpdated: '10:30',
};

export const COST_SNAPSHOT: CostSnapshot = {
  todayTokens: '2.5M',
  todayCost: 38.5,
  monthTokens: '45M',
  monthCost: 680,
  budgetTotal: 1000,
  budgetUsed: 680,
  currency: '¥',
};

export const MODEL_COST_SHARES: ModelCostShare[] = [
  { model: 'DeepSeek-v4', pct: 68, color: 'bg-blue-500', tokens: '30.6M' },
  { model: 'Qwen3-72B', pct: 22, color: 'bg-purple-500', tokens: '9.9M' },
  { model: 'Claude-4', pct: 10, color: 'bg-orange-500', tokens: '4.5M' },
];

export const PIPELINE_COST_SHARES = [
  { pipeline: 'P2 PageIndex', pct: 42, cost: 285 },
  { pipeline: 'P1 向量', pct: 28, cost: 190 },
  { pipeline: 'P3 GraphRAG', pct: 18, cost: 122 },
  { pipeline: 'P5 Agent', pct: 8, cost: 54 },
  { pipeline: 'P4 Wiki', pct: 4, cost: 29 },
];

export const ROUTE_STATS = {
  successRate: 99.2,
  softRoutingPct: 8.4,
  fusionAvgMs: 360,
};

export interface ResourceNode {
  name: string;
  role: string;
  cpuPct: number;
  memPct: number;
  diskPct: number;
  status: ServiceHealth;
}

export interface PipelineErrorRow {
  key: string;
  name: string;
  errorRate: number;
  timeoutRate: number;
  lastIncident: string;
}

export interface TierRouteShare {
  tier: string;
  pct: number;
  color: string;
}

export interface QueryLayerStat {
  layer: string;
  avgMs: number;
  p95Ms: number;
}

export interface CostByKB {
  kbId: string;
  kbName: string;
  tokens: string;
  cost: number;
  queries: number;
}

export interface IndexAlertDetail {
  kbId: string;
  type: 'wiki_failed' | 'wiki_pending' | 'pi_failed' | 'graph_building';
  title: string;
  count: number;
  deepLinkPage: string;
  deepLinkLabel: string;
}

export const RESOURCE_NODES: ResourceNode[] = [
  { name: 'api-gw-01', role: 'API Gateway', cpuPct: 42, memPct: 58, diskPct: 35, status: 'healthy' },
  { name: 'rag-worker-03', role: 'RAG Worker', cpuPct: 78, memPct: 82, diskPct: 45, status: 'healthy' },
  { name: 'milvus-01', role: 'Milvus', cpuPct: 55, memPct: 71, diskPct: 62, status: 'healthy' },
  { name: 'neo4j-02', role: 'Neo4j', cpuPct: 68, memPct: 74, diskPct: 58, status: 'degraded' },
  { name: 'gpu-a100-01', role: 'GPU', cpuPct: 88, memPct: 91, diskPct: 22, status: 'healthy' },
];

export const ERROR_RATE_TREND_24H = [0.4, 0.35, 0.28, 0.32, 0.25, 0.3, 0.22, 0.18, 0.31, 0.27, 0.24, 0.3];
export const P95_LATENCY_TREND_24H = [2.1, 1.9, 1.85, 1.92, 1.78, 1.82, 1.75, 1.68, 1.88, 1.8, 1.76, 1.8];

export const TIER_ROUTE_DISTRIBUTION: TierRouteShare[] = [
  { tier: 'Tier1 简单', pct: 60, color: 'bg-green-500' },
  { tier: 'Tier2 标准', pct: 25, color: 'bg-blue-500' },
  { tier: 'Tier3 复杂', pct: 12, color: 'bg-amber-500' },
  { tier: 'Tier4 专家', pct: 3, color: 'bg-red-500' },
];

export const PIPELINE_ERRORS: PipelineErrorRow[] = [
  { key: 'P1', name: 'P1 向量', errorRate: 0.12, timeoutRate: 0.05, lastIncident: '6 小时前' },
  { key: 'P2', name: 'P2 PageIndex', errorRate: 0.28, timeoutRate: 0.11, lastIncident: '2 小时前' },
  { key: 'P3', name: 'P3 GraphRAG', errorRate: 0.45, timeoutRate: 0.22, lastIncident: '45 分钟前' },
  { key: 'P4', name: 'P4 Wiki', errorRate: 0.08, timeoutRate: 0.02, lastIncident: '1 天前' },
  { key: 'P5', name: 'P5 Agent', errorRate: 0.62, timeoutRate: 0.35, lastIncident: '20 分钟前' },
];

export const QUERY_LAYER_STATS: QueryLayerStat[] = [
  { layer: 'L1 四分类', avgMs: 118, p95Ms: 185 },
  { layer: 'L2 路由', avgMs: 42, p95Ms: 78 },
  { layer: 'L3 检索', avgMs: 1380, p95Ms: 2400 },
  { layer: 'L4 融合', avgMs: 358, p95Ms: 520 },
  { layer: 'L5 生成', avgMs: 1120, p95Ms: 2100 },
];

export const COST_DAILY_TREND = [
  { day: '6/1', cost: 18.2 },
  { day: '6/2', cost: 22.5 },
  { day: '6/3', cost: 19.8 },
  { day: '6/4', cost: 28.4 },
  { day: '6/5', cost: 31.2 },
  { day: '6/6', cost: 35.8 },
  { day: '6/7', cost: 38.5 },
];

export const COST_BY_KB: CostByKB[] = [
  { kbId: 'kb-001', kbName: '法务合同知识库', tokens: '18.2M', cost: 285, queries: 12400 },
  { kbId: 'kb-003', kbName: '研发技术文档库', tokens: '12.8M', cost: 198, queries: 8200 },
  { kbId: 'kb-002', kbName: '财务报告知识库', tokens: '6.4M', cost: 96, queries: 4100 },
  { kbId: 'kb-006', kbName: '产品手册知识库', tokens: '4.2M', cost: 62, queries: 2800 },
  { kbId: 'kb-004', kbName: '合规政策知识库', tokens: '3.4M', cost: 39, queries: 1900 },
];

export const INDEX_ALERT_DETAILS: IndexAlertDetail[] = [
  { kbId: 'kb-001', type: 'wiki_pending', title: 'Wiki 待审核', count: 3, deepLinkPage: 'wiki-hub', deepLinkLabel: 'Wiki 编译队列' },
  { kbId: 'kb-001', type: 'pi_failed', title: 'PageIndex 建树失败', count: 12, deepLinkPage: 'pageindex-hub', deepLinkLabel: '失败文档列表' },
  { kbId: 'kb-003', type: 'wiki_failed', title: 'Wiki 编译失败', count: 2, deepLinkPage: 'wiki-hub', deepLinkLabel: '失败条目' },
  { kbId: 'kb-003', type: 'graph_building', title: '图谱构建积压', count: 5, deepLinkPage: 'graphrag-hub', deepLinkLabel: '建索引队列' },
  { kbId: 'kb-004', type: 'graph_building', title: '图谱构建中', count: 3, deepLinkPage: 'graphrag-hub', deepLinkLabel: '构建进度' },
];

export const ALERT_METRIC_OPTIONS = [
  'Faithfulness 下降',
  'P95 延迟',
  '错误率',
  '日成本',
  'PageIndex 失败率',
  'GPU 利用率',
  '索引队列积压',
];

export const NOTIFICATION_CHANNELS = ['企业微信', '邮件', '电话', 'Jira', 'PagerDuty'];
