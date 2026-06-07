export type TraceStatus = 'success' | 'error' | 'timeout';
export type SpanStatus = 'ok' | 'error' | 'warning';
export type SpanType = 'root' | 'classifier' | 'router' | 'retrieval' | 'fusion' | 'rerank' | 'llm' | 'embed' | 'util';
/** Langfuse Observation 类型：generation / span / tool / event */
export type ObservationKind = 'span' | 'generation' | 'tool' | 'event';
export type TraceEnvironment = 'production' | 'staging' | 'development';

export interface TraceLayer {
  layer: string;
  label: string;
  detail: string;
  ms: number;
}

export interface TraceSpan {
  id: string;
  name: string;
  type: SpanType;
  /** Langfuse 观测类型，LLM 调用标 generation 便于过滤计费 */
  observationKind?: ObservationKind;
  startMs: number;
  durationMs: number;
  status: SpanStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  attributes?: Record<string, string | number | boolean>;
  children?: TraceSpan[];
}

/** OpenTelemetry RAG 语义属性（Uptrace / OTel 最佳实践） */
export interface TraceQuality {
  emptyRetrieval?: boolean;
  contextTruncated?: boolean;
  retrievalResultsCount?: number;
  rerankInputCount?: number;
  rerankOutputCount?: number;
  topScore?: number;
  contextTokenCount?: number;
}

/** Phoenix / Langfuse 轨迹级评测标注 */
export interface TraceEval {
  faithfulness?: number;
  answerRelevancy?: number;
  coherence?: number;
  label?: string;
  explanation?: string;
}

export interface TraceSession {
  sessionId: string;
  user: string;
  title: string;
  turns: number;
  totalTokens: number;
  totalCost: number;
  lastActive: string;
  coherenceScore?: number;
  resolved?: boolean;
  traceIds: string[];
}

export interface TraceRecord {
  id: string;
  traceId: string;
  query: string;
  user: string;
  kb: string;
  kbId: string;
  durationMs: number;
  tokens: number;
  cost: number;
  tier: string;
  pipeline: string;
  status: TraceStatus;
  time: string;
  environment: TraceEnvironment;
  sessionId?: string;
  convId?: string;
  layers: TraceLayer[];
  rootSpan: TraceSpan;
  quality?: TraceQuality;
  eval?: TraceEval;
  errorMessage?: string;
}

export const TRACE_STATS = {
  todayCount: 1248,
  p95Ms: 3180,
  errorRate: 1.2,
  avgTokens: 2840,
  totalCostToday: 186.4,
  emptyRetrievalRate: 2.8,
  contextTruncateRate: 4.1,
};

/** 各阶段 P95（OTel 建议按 stage 拆分排障，rerank 常为隐性瓶颈） */
export const STAGE_P95_MS: Record<string, number> = {
  L1: 145,
  L2: 52,
  L3: 1420,
  L4: 360,
  L5: 1100,
};

export const OBSERVATION_KIND_COLORS: Record<ObservationKind, string> = {
  span: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  generation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  tool: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  event: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const SPAN_TYPE_COLORS: Record<SpanType, string> = {
  root: 'bg-gray-500',
  classifier: 'bg-indigo-500',
  router: 'bg-violet-500',
  retrieval: 'bg-green-500',
  fusion: 'bg-cyan-500',
  rerank: 'bg-orange-500',
  llm: 'bg-blue-500',
  embed: 'bg-purple-500',
  util: 'bg-gray-400',
};

export const SPAN_TYPE_LABELS: Record<SpanType, string> = {
  root: 'root',
  classifier: 'classifier',
  router: 'router',
  retrieval: 'retrieval',
  fusion: 'fusion',
  rerank: 'rerank',
  llm: 'llm',
  embed: 'embed',
  util: 'util',
};

function makeRetrievalTrace(
  id: string,
  traceId: string,
  query: string,
  opts: Partial<Pick<TraceRecord, 'user' | 'kb' | 'kbId' | 'tier' | 'pipeline' | 'status' | 'time' | 'convId' | 'sessionId' | 'environment' | 'quality' | 'eval' | 'errorMessage'>> & {
    durationMs: number;
    tokens: number;
    cost: number;
    layers: TraceLayer[];
    rootSpan: TraceSpan;
  },
): TraceRecord {
  return {
    id,
    traceId,
    query,
    user: opts.user ?? '李婷',
    kb: opts.kb ?? '法务合同知识库',
    kbId: opts.kbId ?? 'kb-001',
    durationMs: opts.durationMs,
    tokens: opts.tokens,
    cost: opts.cost,
    tier: opts.tier ?? 'Tier2',
    pipeline: opts.pipeline ?? 'PageIndex+向量',
    status: opts.status ?? 'success',
    time: opts.time ?? '14:32:05',
    environment: opts.environment ?? 'production',
    convId: opts.convId,
    sessionId: opts.sessionId,
    layers: opts.layers,
    rootSpan: opts.rootSpan,
    quality: opts.quality,
    eval: opts.eval,
    errorMessage: opts.errorMessage,
  };
}

/** 为 LLM span 标注 Langfuse generation 类型 */
export function annotateObservationKinds(span: TraceSpan): TraceSpan {
  const kind: ObservationKind =
    span.type === 'llm' ? 'generation' :
    span.name.includes('tool') ? 'tool' :
    span.type === 'util' ? 'event' : 'span';
  return {
    ...span,
    observationKind: kind,
    children: span.children?.map(annotateObservationKinds),
  };
}

export const TRACE_RECORDS: TraceRecord[] = [
  makeRetrievalTrace('tr-001', 'trace_8f3a2b1c', '违约金如何计算', {
    user: '李婷',
    tier: 'Tier2',
    pipeline: 'PageIndex+Wiki',
    durationMs: 3000,
    tokens: 2340,
    cost: 0.042,
    time: '今天 14:32:05',
    convId: 'conv-001',
    sessionId: 'sess_conv001',
    quality: {
      retrievalResultsCount: 12,
      rerankInputCount: 12,
      rerankOutputCount: 5,
      topScore: 0.956,
      contextTokenCount: 4200,
    },
    eval: {
      faithfulness: 0.94,
      answerRelevancy: 0.91,
      label: '高质量',
      explanation: '答案与合同 V5 第五条引用一致，无幻觉',
    },
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier2 / 合同 / 精确答案 / 内部', ms: 120 },
      { layer: 'L2', label: '路由决策', detail: '→ P2 PageIndex + P1 向量 + P4 Wiki', ms: 45 },
      { layer: 'L3', label: '多通道检索', detail: 'PageIndex 5条 │ 向量 5条 │ Wiki 2条', ms: 1400 },
      { layer: 'L4', label: 'RRF+精排', detail: 'Top-5 候选 → CrossEncoder 重排', ms: 360 },
      { layer: 'L5', label: 'LLM 生成', detail: 'DeepSeek-v4 │ 1,024 tokens', ms: 1075 },
    ],
    rootSpan: {
      id: 'sp-root', name: 'root', type: 'root', startMs: 0, durationMs: 3000, status: 'ok',
      children: [
        {
          id: 'sp-c1', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 120, status: 'ok',
          input: { query: '违约金如何计算', kb_id: 'kb-001' },
          output: { tier: 'Tier2', doc_type: '合同', intent: '精确答案', security: '内部' },
        },
        {
          id: 'sp-r1', name: 'router', type: 'router', startMs: 120, durationMs: 45, status: 'ok',
          output: { primary: ['pageindex'], secondary: ['vector', 'wiki'] },
        },
        {
          id: 'sp-ret', name: 'retrieval', type: 'retrieval', startMs: 165, durationMs: 1400, status: 'ok',
          children: [
            {
              id: 'sp-pi', name: 'retrieval.pageindex', type: 'retrieval', startMs: 165, durationMs: 740, status: 'ok',
              attributes: { channel: 'pageindex', top_k: 10 },
              input: { query: '违约金如何计算' },
              output: { chunks: 5, latency_ms: 740 },
            },
            {
              id: 'sp-vec', name: 'retrieval.vector', type: 'retrieval', startMs: 200, durationMs: 380, status: 'ok',
              attributes: { channel: 'vector', top_k: 100 },
              output: { chunks: 5 },
            },
            {
              id: 'sp-wiki', name: 'retrieval.wiki', type: 'retrieval', startMs: 210, durationMs: 290, status: 'ok',
              attributes: { channel: 'wiki', top_k: 5 },
              output: { chunks: 2 },
            },
          ],
        },
        {
          id: 'sp-fus', name: 'fusion.wrrf', type: 'fusion', startMs: 1565, durationMs: 180, status: 'ok',
          attributes: { rrf_k: 60, strategy: 'weighted' },
          output: { merged: 5 },
        },
        {
          id: 'sp-rerank', name: 'rag.reranking', type: 'rerank', startMs: 1745, durationMs: 180, status: 'ok',
          attributes: {
            'rag.reranking.model': 'BGE-Reranker-v2-m3',
            'rag.reranking.input_count': 12,
            'rag.reranking.output_count': 5,
          },
          output: { top_n: 5 },
        },
        {
          id: 'sp-llm', name: 'llm.generate', type: 'llm', startMs: 1925, durationMs: 1075, status: 'ok',
          attributes: { model: 'deepseek-v4', tokens: 1024 },
          output: { answer_preview: '供应商违约金标准为每日 0.5%，上限 20%...' },
        },
      ],
    },
  }),
  makeRetrievalTrace('tr-002', 'trace_a1b2c3d4', '供应商合同中关于违约责任的条款有哪些？', {
    user: '王芳',
    tier: 'Tier3',
    pipeline: 'PageIndex+GraphRAG',
    durationMs: 1840,
    tokens: 3120,
    cost: 0.058,
    time: '今天 14:28:12',
    sessionId: 'sess_contract_review',
    eval: { faithfulness: 0.88, answerRelevancy: 0.85, coherence: 0.9, label: '良好' },
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier3 / 合同 / 综合分析 / 机密', ms: 130 },
      { layer: 'L2', label: '路由决策', detail: '→ P2 PageIndex + P3 GraphRAG', ms: 55 },
      { layer: 'L3', label: '多通道检索', detail: 'PageIndex 8条 │ GraphRAG 4条', ms: 670 },
      { layer: 'L4', label: 'RRF+精排', detail: '加权融合 Top-5', ms: 210 },
      { layer: 'L5', label: 'LLM 生成', detail: 'gpt-4o │ 1,890 tokens', ms: 775 },
    ],
    rootSpan: {
      id: 'sp-root-2', name: 'root', type: 'root', startMs: 0, durationMs: 1840, status: 'ok',
      children: [
        { id: 'sp-c2', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 130, status: 'ok' },
        { id: 'sp-r2', name: 'router', type: 'router', startMs: 130, durationMs: 55, status: 'ok' },
        {
          id: 'sp-ret2', name: 'retrieval', type: 'retrieval', startMs: 185, durationMs: 670, status: 'ok',
          children: [
            { id: 'sp-pi2', name: 'retrieval.pageindex', type: 'retrieval', startMs: 185, durationMs: 380, status: 'ok', output: { chunks: 8 } },
            { id: 'sp-gr2', name: 'retrieval.graphrag', type: 'retrieval', startMs: 220, durationMs: 850, status: 'ok', output: { entities: 4 } },
          ],
        },
        { id: 'sp-fus2', name: 'fusion.wrrf', type: 'fusion', startMs: 855, durationMs: 95, status: 'ok' },
        { id: 'sp-rr2', name: 'rerank', type: 'rerank', startMs: 950, durationMs: 115, status: 'ok' },
        { id: 'sp-llm2', name: 'llm.generate', type: 'llm', startMs: 1065, durationMs: 775, status: 'ok' },
      ],
    },
  }),
  makeRetrievalTrace('tr-003', 'trace_e5f6g7h8', '最新的采购政策有哪些变化？', {
    user: '张三',
    tier: 'Tier2',
    pipeline: 'Hybrid',
    durationMs: 920,
    tokens: 1120,
    cost: 0.021,
    time: '今天 14:15:33',
    environment: 'staging',
    quality: { contextTruncated: true, contextTokenCount: 8192, retrievalResultsCount: 18 },
    eval: { faithfulness: 0.72, label: '上下文截断', explanation: 'context_truncated 事件触发，尾部 Chunk 被裁切' },
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier2 / 制度 / 问答 / 内部', ms: 110 },
      { layer: 'L2', label: '路由决策', detail: '→ P1 向量 + BM25', ms: 40 },
      { layer: 'L3', label: '多通道检索', detail: '向量 10条 │ BM25 8条', ms: 270 },
      { layer: 'L4', label: 'RRF+精排', detail: 'RRF k=60', ms: 155 },
      { layer: 'L5', label: 'LLM 生成', detail: 'gpt-4o-mini │ 680 tokens', ms: 345 },
    ],
    rootSpan: {
      id: 'sp-root-3', name: 'root', type: 'root', startMs: 0, durationMs: 920, status: 'ok',
      children: [
        { id: 'sp-c3', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 110, status: 'ok' },
        { id: 'sp-r3', name: 'router', type: 'router', startMs: 110, durationMs: 40, status: 'ok' },
        {
          id: 'sp-ret3', name: 'retrieval', type: 'retrieval', startMs: 150, durationMs: 270, status: 'ok',
          children: [
            { id: 'sp-v3', name: 'retrieval.vector', type: 'retrieval', startMs: 150, durationMs: 180, status: 'ok' },
            { id: 'sp-b3', name: 'retrieval.bm25', type: 'retrieval', startMs: 160, durationMs: 90, status: 'ok' },
          ],
        },
        { id: 'sp-fus3', name: 'fusion.wrrf', type: 'fusion', startMs: 420, durationMs: 80, status: 'ok' },
        { id: 'sp-rr3', name: 'rerank', type: 'rerank', startMs: 500, durationMs: 75, status: 'ok' },
        { id: 'sp-llm3', name: 'llm.generate', type: 'llm', startMs: 575, durationMs: 345, status: 'ok' },
      ],
    },
  }),
  makeRetrievalTrace('tr-004', 'trace_i9j0k1l2', '财务Q2报告摘要与同比分析', {
    user: '赵敏',
    kb: '财务报告知识库',
    kbId: 'kb-003',
    tier: 'Tier4',
    pipeline: 'Graph+Multi-Agent',
    durationMs: 5200,
    tokens: 4100,
    cost: 0.092,
    time: '今天 13:58:44',
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier4 / 财报 / 策略建议 / 内部', ms: 145 },
      { layer: 'L2', label: '路由决策', detail: '→ P5 Agent + P3 GraphRAG', ms: 80 },
      { layer: 'L3', label: '多通道检索', detail: 'GraphRAG 12条 │ PageIndex 6条', ms: 1270 },
      { layer: 'L4', label: 'RRF+精排', detail: 'CrossEncoder Top-8', ms: 320 },
      { layer: 'L5', label: 'LLM 生成', detail: 'claude-3-5 │ 多跳 3 iter', ms: 3385 },
    ],
    rootSpan: {
      id: 'sp-root-4', name: 'root', type: 'root', startMs: 0, durationMs: 5200, status: 'ok',
      children: [
        { id: 'sp-c4', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 145, status: 'ok' },
        { id: 'sp-r4', name: 'router', type: 'router', startMs: 145, durationMs: 80, status: 'ok' },
        {
          id: 'sp-ret4', name: 'retrieval', type: 'retrieval', startMs: 225, durationMs: 1270, status: 'ok',
          children: [
            { id: 'sp-gr4', name: 'retrieval.graphrag', type: 'retrieval', startMs: 225, durationMs: 850, status: 'ok' },
            { id: 'sp-pi4', name: 'retrieval.pageindex', type: 'retrieval', startMs: 280, durationMs: 420, status: 'ok' },
          ],
        },
        { id: 'sp-fus4', name: 'fusion.wrrf', type: 'fusion', startMs: 1495, durationMs: 140, status: 'ok' },
        { id: 'sp-rr4', name: 'rerank', type: 'rerank', startMs: 1635, durationMs: 180, status: 'ok' },
        { id: 'sp-llm4', name: 'llm.generate', type: 'llm', startMs: 1815, durationMs: 3385, status: 'ok', attributes: { max_iter: 3 } },
      ],
    },
  }),
  makeRetrievalTrace('tr-005', 'trace_m3n4o5p6', 'AMD收购Xilinx的影响', {
    user: '孙立',
    kb: '行业研报知识库',
    kbId: 'kb-002',
    tier: 'Tier3',
    pipeline: 'GraphRAG',
    durationMs: 2450,
    tokens: 1890,
    cost: 0.038,
    time: '今天 11:22:18',
    quality: { emptyRetrieval: false, retrievalResultsCount: 0, topScore: 0.42 },
    eval: { faithfulness: 0.61, label: '低相关', explanation: 'rag.retrieval.top_score < 0.5，召回质量不足' },
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier3 / 研报 / 综合分析 / 公开', ms: 125 },
      { layer: 'L2', label: '路由决策', detail: '→ P3 GraphRAG 主通道', ms: 50 },
      { layer: 'L3', label: '多通道检索', detail: 'GraphRAG Local 20条', ms: 980 },
      { layer: 'L4', label: 'RRF+精排', detail: 'Top-5', ms: 245 },
      { layer: 'L5', label: 'LLM 生成', detail: 'deepseek-v4 │ 1,450 tokens', ms: 1050 },
    ],
    rootSpan: {
      id: 'sp-root-5', name: 'root', type: 'root', startMs: 0, durationMs: 2450, status: 'ok',
      children: [
        { id: 'sp-c5', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 125, status: 'ok' },
        { id: 'sp-r5', name: 'router', type: 'router', startMs: 125, durationMs: 50, status: 'ok' },
        { id: 'sp-gr5', name: 'retrieval.graphrag', type: 'retrieval', startMs: 175, durationMs: 980, status: 'ok', attributes: { mode: 'local' } },
        { id: 'sp-fus5', name: 'fusion.wrrf', type: 'fusion', startMs: 1155, durationMs: 120, status: 'ok' },
        { id: 'sp-rr5', name: 'rerank', type: 'rerank', startMs: 1275, durationMs: 125, status: 'ok' },
        { id: 'sp-llm5', name: 'llm.generate', type: 'llm', startMs: 1400, durationMs: 1050, status: 'ok' },
      ],
    },
  }),
  makeRetrievalTrace('tr-006', 'trace_q7r8s9t0', '机密附件第五条内容', {
    user: '实习生-小刘',
    tier: 'Tier1',
    pipeline: 'ACL拒绝',
    status: 'error',
    durationMs: 380,
    tokens: 0,
    cost: 0,
    time: '今天 10:05:02',
    errorMessage: 'ACL 拒绝：角色 intern 无权访问 confidential 级 Chunk',
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier1 / 合同 / 精确答案 / 机密', ms: 95 },
      { layer: 'L2', label: 'ACL 检查', detail: '角色=intern → 拒绝', ms: 12 },
    ],
    rootSpan: {
      id: 'sp-root-6', name: 'root', type: 'root', startMs: 0, durationMs: 380, status: 'error',
      children: [
        { id: 'sp-c6', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 95, status: 'ok' },
        {
          id: 'sp-acl', name: 'security.acl_check', type: 'util', startMs: 95, durationMs: 12, status: 'error',
          output: { allowed: false, reason: '角色 intern 无 confidential 读权限' },
        },
      ],
    },
  }),
  makeRetrievalTrace('tr-007', 'trace_u1v2w3x4', '批量导出合同元数据', {
    user: '李婷',
    tier: 'Tier2',
    pipeline: '向量',
    status: 'timeout',
    environment: 'development',
    durationMs: 30000,
    tokens: 0,
    cost: 0.012,
    time: '今天 09:12:44',
    errorMessage: '检索超时：Milvus 连接池耗尽（30s）',
    quality: { emptyRetrieval: true, retrievalResultsCount: 0 },
    layers: [
      { layer: 'L1', label: '四分类器', detail: 'Tier2 / 合同 / 数据分析', ms: 118 },
      { layer: 'L2', label: '路由决策', detail: '→ P1 向量', ms: 42 },
      { layer: 'L3', label: '向量检索', detail: '超时 @ 30s', ms: 29840 },
    ],
    rootSpan: {
      id: 'sp-root-7', name: 'root', type: 'root', startMs: 0, durationMs: 30000, status: 'error',
      children: [
        { id: 'sp-c7', name: 'classifier', type: 'classifier', startMs: 0, durationMs: 118, status: 'ok' },
        { id: 'sp-r7', name: 'router', type: 'router', startMs: 118, durationMs: 42, status: 'ok' },
        {
          id: 'sp-v7', name: 'retrieval.vector', type: 'retrieval', startMs: 160, durationMs: 29840, status: 'error',
          attributes: { error: 'connection_pool_exhausted' },
        },
      ],
    },
  }),
];

/** 导出用：补全 Langfuse Observation 类型标注 */
export const TRACE_RECORDS_EXPORT: TraceRecord[] = TRACE_RECORDS.map(tr => ({
  ...tr,
  rootSpan: annotateObservationKinds(tr.rootSpan),
}));

/** Phoenix Session：多轮对话按 session_id 聚合（§11.5 / Phoenix Sessions） */
export const TRACE_SESSIONS: TraceSession[] = [
  {
    sessionId: 'sess_conv001',
    user: '李婷',
    title: '违约金咨询 · 法务合同库',
    turns: 3,
    totalTokens: 5460,
    totalCost: 0.12,
    lastActive: '今天 14:32',
    coherenceScore: 0.92,
    resolved: true,
    traceIds: ['tr-001'],
  },
  {
    sessionId: 'sess_contract_review',
    user: '王芳',
    title: '供应商违约责任审查',
    turns: 5,
    totalTokens: 12400,
    totalCost: 0.28,
    lastActive: '今天 14:28',
    coherenceScore: 0.88,
    resolved: false,
    traceIds: ['tr-002'],
  },
  {
    sessionId: 'sess_policy_qa',
    user: '张三',
    title: '采购政策变更问答',
    turns: 2,
    totalTokens: 2240,
    totalCost: 0.042,
    lastActive: '今天 14:15',
    coherenceScore: 0.71,
    resolved: false,
    traceIds: ['tr-003'],
  },
];

/** 扁平化 Span 列表（用于瀑布图，保留深度） */
export function flattenSpans(span: TraceSpan, depth = 0): Array<TraceSpan & { depth: number }> {
  const rows: Array<TraceSpan & { depth: number }> = [{ ...span, depth }];
  span.children?.forEach(child => rows.push(...flattenSpans(child, depth + 1)));
  return rows;
}

export function filterTraces(
  records: TraceRecord[],
  opts: {
    query?: string;
    status?: TraceStatus | 'all';
    tier?: string;
    environment?: TraceEnvironment | 'all';
    qualityAlertOnly?: boolean;
    sessionId?: string;
  },
): TraceRecord[] {
  return records.filter(tr => {
    const q = opts.query?.toLowerCase();
    if (q && !tr.query.toLowerCase().includes(q) && !tr.traceId.toLowerCase().includes(q) && !tr.user.includes(q)) {
      return false;
    }
    if (opts.status && opts.status !== 'all' && tr.status !== opts.status) return false;
    if (opts.tier && opts.tier !== 'all' && tr.tier !== opts.tier) return false;
    if (opts.environment && opts.environment !== 'all' && tr.environment !== opts.environment) return false;
    if (opts.sessionId && tr.sessionId !== opts.sessionId) return false;
    if (opts.qualityAlertOnly && !hasQualityAlert(tr)) return false;
    return true;
  });
}

export function hasQualityAlert(tr: TraceRecord): boolean {
  const q = tr.quality;
  return !!(q?.emptyRetrieval || q?.contextTruncated || (q?.topScore != null && q.topScore < 0.5));
}

export function getSessionTraces(sessionId: string, records = TRACE_RECORDS_EXPORT): TraceRecord[] {
  return records.filter(tr => tr.sessionId === sessionId);
}

/** Langfuse Log 视图：按 startMs  chronological 排序 */
export function logSpansChronological(span: TraceSpan): TraceSpan[] {
  return flattenSpans(span)
    .sort((a, b) => a.startMs - b.startMs || a.durationMs - b.durationMs);
}
