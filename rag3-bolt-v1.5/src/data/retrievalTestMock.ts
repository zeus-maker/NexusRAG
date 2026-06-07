import { DEFAULT_FUSION_CONFIG } from './fusionMock';

export type RetrievalChannel = 'vector' | 'bm25' | 'pageindex' | 'graphrag' | 'wiki';

export interface ChannelHit {
  rank: number;
  doc: string;
  page?: number;
  section?: string;
  score: number;
  snippet: string;
  chunkId: string;
}

export interface ChannelResult {
  channel: RetrievalChannel;
  label: string;
  latencyMs: number;
  hits: ChannelHit[];
}

export interface FusionHit {
  rank: number;
  doc: string;
  page?: number;
  section?: string;
  wrrfScore: number;
  rerankScore?: number;
  snippet: string;
  chunkId: string;
  sources: RetrievalChannel[];
}

export interface FullRetrievalResult {
  query: string;
  channels: ChannelResult[];
  fusion: FusionHit[];
  fusionReranked: FusionHit[];
  totalLatencyMs: number;
  rrfK: number;
}

export const CHANNEL_META: Record<RetrievalChannel, { label: string; color: string }> = {
  vector: { label: '向量', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  bm25: { label: 'BM25', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  pageindex: { label: 'PageIndex', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  graphrag: { label: 'GraphRAG', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  wiki: { label: 'Wiki', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
};

const BASE_HITS: Record<string, Partial<Record<RetrievalChannel, ChannelHit[]>>> = {
  default: {
    vector: [
      { rank: 1, doc: '供应商合同模板V5.pdf', page: 3, section: '第五条 违约责任 §5.1', score: 0.956, snippet: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金...', chunkId: 'c-v1' },
      { rank: 2, doc: '合规审查报告2024.pdf', page: 15, section: '违约风险评估', score: 0.812, snippet: '通过对过去三年供应商违约案例分析，建议将违约金比例调整为行业标准...', chunkId: 'c-v2' },
      { rank: 3, doc: '物流服务合同V2.pdf', page: 5, section: '第四条 延迟交付', score: 0.798, snippet: '延迟交付货物的，甲方有权按日计收违约金，计算基数为延迟交付货物的合同价值...', chunkId: 'c-v3' },
    ],
    bm25: [
      { rank: 1, doc: '供应商合同模板V5.pdf', page: 3, section: '第五条 违约责任', score: 0.921, snippet: '违约金 按日 0.5% 计算，上限不超过合同总金额的 20%...', chunkId: 'c-b1' },
      { rank: 2, doc: '采购协议条款.docx', page: 8, section: '第三章 违约处理', score: 0.884, snippet: '违约金条款：每逾期一日按合同金额千分之三收取...', chunkId: 'c-b2' },
    ],
    pageindex: [
      { rank: 1, doc: '采购协议条款.docx', page: 8, section: '第三章 违约处理', score: 0.867, snippet: '如因供应商原因导致交货延迟，每逾期一日按合同金额千分之三收取违约金...', chunkId: 'c-p1' },
      { rank: 2, doc: '供应商合同模板V5.pdf', page: 3, section: '第五条 §5.1', score: 0.841, snippet: '违约金计算基数为迟延交付部分货物价值，按日累进...', chunkId: 'c-p2' },
    ],
    graphrag: [
      { rank: 1, doc: '实体「违约金」', section: '→ 条款节点：合同V5 P3', score: 0.89, snippet: '实体关系：违约金 —[定义于]→ 供应商合同V5 第五条', chunkId: 'c-g1' },
      { rank: 2, doc: '社区「合同违约」', section: '关联 12 份合同', score: 0.76, snippet: '社区摘要：本知识库合同违约条款集中在 0.3%–0.5%/日 区间...', chunkId: 'c-g2' },
    ],
    wiki: [
      { rank: 1, doc: 'Wiki: 供应商违约金', section: '已编译稳定知识', score: 0.98, snippet: '标准：每日 0.5%，上限 20%。适用于采购类合同，例外见附件清单。', chunkId: 'c-w1' },
    ],
  },
};

function buildFusion(channels: ChannelResult[]): { fusion: FusionHit[]; fusionReranked: FusionHit[] } {
  const merged = new Map<string, FusionHit>();

  channels.forEach(ch => {
    ch.hits.forEach(hit => {
      const key = hit.chunkId.replace(/^c-[a-z]/, 'c-f');
      const existing = merged.get(key) ?? {
        rank: 0,
        doc: hit.doc,
        page: hit.page,
        section: hit.section,
        wrrfScore: 0,
        snippet: hit.snippet,
        chunkId: key,
        sources: [] as RetrievalChannel[],
      };
      existing.wrrfScore += (1 / (60 + hit.rank)) * (ch.channel === 'wiki' ? 1.5 : ch.channel === 'pageindex' ? 1.3 : 1);
      if (!existing.sources.includes(ch.channel)) existing.sources.push(ch.channel);
      merged.set(key, existing);
    });
  });

  const fusion = [...merged.values()]
    .sort((a, b) => b.wrrfScore - a.wrrfScore)
    .slice(0, 5)
    .map((h, i) => ({ ...h, rank: i + 1, wrrfScore: Number(h.wrrfScore.toFixed(3)) }));

  const fusionReranked = fusion.map((h, i) => ({
    ...h,
    rank: i + 1,
    rerankScore: Number((0.95 - i * 0.04 + h.wrrfScore * 0.1).toFixed(3)),
  }));

  return { fusion, fusionReranked };
}

export interface RetrievalTestOptions {
  enabledChannels: RetrievalChannel[];
  useRerank: boolean;
  threshold: number;
}

export function runMockFullChannelRetrieval(
  query: string,
  options: RetrievalTestOptions,
): FullRetrievalResult {
  const key = query.includes('违约金') ? 'default' : 'default';
  const base = BASE_HITS[key] ?? BASE_HITS.default;

  const latencyMap: Record<RetrievalChannel, number> = {
    vector: 45,
    bm25: 32,
    pageindex: 210,
    graphrag: 820,
    wiki: 18,
  };

  const channels: ChannelResult[] = options.enabledChannels.map(ch => ({
    channel: ch,
    label: CHANNEL_META[ch].label,
    latencyMs: latencyMap[ch],
    hits: (base[ch] ?? []).filter(h => h.score >= options.threshold),
  }));

  const { fusion, fusionReranked } = buildFusion(channels);

  return {
    query,
    channels,
    fusion,
    fusionReranked: options.useRerank ? fusionReranked : fusion.map(h => ({ ...h, rerankScore: undefined })),
    totalLatencyMs: channels.reduce((s, c) => s + c.latencyMs, 0) + (options.useRerank ? 120 : 0),
    rrfK: DEFAULT_FUSION_CONFIG.rrfK,
  };
}

export const SAMPLE_QUERIES = [
  '违约金如何计算',
  '供应商保密义务期限',
  '合同解除条件',
];
