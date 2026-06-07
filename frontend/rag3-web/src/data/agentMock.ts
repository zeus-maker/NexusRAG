export type AgentType = 'Agent' | 'Pipeline';
export type AgentStatus = 'active' | 'idle' | 'draft';

export interface AgentItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: AgentType;
  status: AgentStatus;
  runs: number;
  lastRun: string;
  version: number;
  updatedAt: string;
}

export interface AgentFlowNode {
  id: string;
  type: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  config: Record<string, string | number | boolean | string[]>;
}

export interface AgentFlowEdge {
  from: string;
  to: string;
}

export interface AgentVersion {
  version: number;
  date: string;
  author: string;
  change: string;
  current?: boolean;
}

export interface RunLogEntry {
  ts: string;
  message: string;
  level?: 'info' | 'error' | 'success';
}

export interface DataflowStep {
  id: string;
  nodeId: string;
  label: string;
  durationMs: number;
  status: 'success' | 'error' | 'running' | 'pending';
  input?: string;
  output?: string;
  chunks?: { rank: number; doc: string; page: number; score: number }[];
}

export const AGENTS_LIST: AgentItem[] = [
  {
    id: 'a-001',
    name: '合同审查 Agent',
    desc: '自动分析上传合同，提取关键条款并评估风险',
    icon: '⚖️',
    type: 'Pipeline',
    status: 'active',
    runs: 342,
    lastRun: '6/6 10:00',
    version: 3,
    updatedAt: '2026-06-06',
  },
  {
    id: 'a-002',
    name: '财报分析 Agent',
    desc: '解析财务报告，生成关键指标摘要与趋势分析',
    icon: '📈',
    type: 'Agent',
    status: 'idle',
    runs: 218,
    lastRun: '6/5 16:30',
    version: 2,
    updatedAt: '2026-06-05',
  },
  {
    id: 'a-003',
    name: '合规巡检 Agent',
    desc: '对比内部政策与监管要求，自动标注合规风险',
    icon: '🔍',
    type: 'Pipeline',
    status: 'draft',
    runs: 0,
    lastRun: '—',
    version: 1,
    updatedAt: '2026-06-04',
  },
];

export const AGENT_TEMPLATES = [
  { id: 'tpl-001', name: 'RAG 问答流水线', desc: 'Begin → Categorize → Retrieval → Generate → Answer', icon: '🔍', nodes: 5 },
  { id: 'tpl-002', name: 'Wiki 深度阅读', desc: 'Begin → WikiRead → Generate → Answer', icon: '📖', nodes: 4 },
  { id: 'tpl-003', name: 'PageIndex 树搜索', desc: 'Begin → PageIndexSearch → Retrieval → Answer', icon: '🌳', nodes: 4 },
  { id: 'tpl-004', name: '多工具 Agent', desc: 'Begin → Categorize → Tool → Generate → Answer', icon: '🛠', nodes: 5 },
];

export const NODE_PALETTE = [
  { group: '基础节点', items: [
    { type: 'begin', label: 'Begin', icon: '▶', color: 'text-green-600' },
    { type: 'categorize', label: 'Categorize', icon: '🔀', color: 'text-purple-600' },
    { type: 'retrieval', label: 'Retrieval', icon: '🔍', color: 'text-blue-600' },
    { type: 'generate', label: 'Generate', icon: '🤖', color: 'text-orange-600' },
    { type: 'answer', label: 'Answer', icon: '💬', color: 'text-indigo-600' },
    { type: 'tool', label: 'Tool', icon: '🛠', color: 'text-gray-600' },
    { type: 'parser', label: 'Parser', icon: '📝', color: 'text-indigo-600' },
  ]},
  { group: 'RAG 3.0 扩展', items: [
    { type: 'route_decision', label: 'RouteDecision', icon: '🧭', color: 'text-amber-600' },
    { type: 'wiki_read', label: 'WikiRead', icon: '📖', color: 'text-teal-600' },
    { type: 'pageindex_search', label: 'PageIndexSearch', icon: '🌳', color: 'text-emerald-600' },
  ]},
];

export const DEFAULT_AGENT_NODES: AgentFlowNode[] = [
  { id: 'n1', type: 'begin', label: 'Begin', icon: '▶', x: 60, y: 200, color: 'bg-green-100 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-300', config: { greeting: '请输入合同审查问题', input_variables: ['query'] } },
  { id: 'n2', type: 'categorize', label: 'Categorize', icon: '🔀', x: 220, y: 120, color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 text-purple-800 dark:text-purple-300', config: { categories: 'Tier1,Tier2,Tier3', llm_model: 'DeepSeek-v4', fallback_tier: 'Tier2' } },
  { id: 'n3', type: 'retrieval', label: 'Retrieval', icon: '🔍', x: 220, y: 280, color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-800 dark:text-blue-300', config: { kb_ids: ['kb-001'], top_k: 5, similarity_threshold: 0.2, rerank: true, channels: ['vector', 'pageindex'] } },
  { id: 'n4', type: 'wiki_read', label: 'WikiRead', icon: '📖', x: 420, y: 120, color: 'bg-teal-100 dark:bg-teal-900/30 border-teal-400 text-teal-800 dark:text-teal-300', config: { kb_id: 'kb-001', layer: 2, page_slugs: ['contract-terms'] } },
  { id: 'n5', type: 'generate', label: 'Generate', icon: '🤖', x: 420, y: 280, color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 text-orange-800 dark:text-orange-300', config: { model: 'DeepSeek-v4', temperature: 0.1, max_tokens: 2048, system_prompt: '你是合同审查专家' } },
  { id: 'n6', type: 'answer', label: 'Answer', icon: '💬', x: 600, y: 200, color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 text-indigo-800 dark:text-indigo-300', config: { template: '{{answer}}', show_citations: true } },
];

export const DEFAULT_AGENT_EDGES: AgentFlowEdge[] = [
  { from: 'n1', to: 'n2' },
  { from: 'n1', to: 'n3' },
  { from: 'n2', to: 'n4' },
  { from: 'n3', to: 'n5' },
  { from: 'n4', to: 'n6' },
  { from: 'n5', to: 'n6' },
];

export const AGENT_VERSIONS: Record<string, AgentVersion[]> = {
  'a-001': [
    { version: 3, date: '6/6 09:00', author: '李婷', change: '新增 WikiRead 节点', current: true },
    { version: 2, date: '6/1 14:00', author: '王强', change: '调整 Categorize 规则' },
    { version: 1, date: '5/28', author: '系统', change: '初始版本' },
  ],
  'a-002': [
    { version: 2, date: '6/5 10:00', author: '李婷', change: '升级 Generate 模型', current: true },
    { version: 1, date: '5/20', author: '系统', change: '初始版本' },
  ],
};

export const RUN_SEQUENCE = ['n1', 'n2', 'n3', 'n5', 'n6'];

export const MOCK_RUN_LOG: RunLogEntry[] = [
  { ts: '10:00:01', message: 'Begin → 接收输入 query="违约金如何计算"' },
  { ts: '10:00:01', message: 'Categorize → Tier2（深度检索）', level: 'info' },
  { ts: '10:00:02', message: 'Retrieval → 召回 5 条 Chunk（PageIndex+向量）', level: 'info' },
  { ts: '10:00:03', message: 'Generate → DeepSeek-v4 生成回答', level: 'info' },
  { ts: '10:00:04', message: 'Answer → 输出完成，附 3 条引用', level: 'success' },
];

export const DATAFLOW_STEPS: DataflowStep[] = [
  { id: 's1', nodeId: 'n1', label: 'Begin', durationMs: 12, status: 'success', input: 'query="违约金如何计算"', output: '变量已注入' },
  { id: 's2', nodeId: 'n2', label: 'Categorize', durationMs: 120, status: 'success', input: 'query', output: 'Tier2' },
  { id: 's3', nodeId: 'n3', label: 'Retrieval', durationMs: 1800, status: 'success', input: 'query="违约金如何计算"', output: '5 条 Chunk',
    chunks: [
      { rank: 1, doc: '供应商合同模板V5.pdf', page: 3, score: 0.956 },
      { rank: 2, doc: '采购协议条款.docx', page: 8, score: 0.867 },
      { rank: 3, doc: '供应商合同模板V5.pdf', page: 4, score: 0.812 },
    ],
  },
  { id: 's4', nodeId: 'n5', label: 'Generate', durationMs: 2100, status: 'success', input: '5 chunks + query', output: '违约金日 0.5%，上限 20%…' },
  { id: 's5', nodeId: 'n6', label: 'Answer', durationMs: 45, status: 'success', input: 'generated text', output: '最终回答 + 3 citations' },
];
