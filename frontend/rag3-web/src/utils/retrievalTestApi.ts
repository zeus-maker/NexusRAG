import type { SearchResult } from '../services/kbApi';
import type { RagflowSearchChunk } from '../services/kbMappers';
import { hubApi } from '../services/hubApi';
import type {
  ChannelHit,
  ChannelResult,
  FusionHit,
  FullRetrievalResult,
  RetrievalChannel,
} from '../data/retrievalTestMock';

/** API 模式可用通道 */
export const API_AVAILABLE_CHANNELS = ['vector', 'bm25', 'graphrag', 'pageindex', 'wiki'] as const;
export type RealApiChannel = (typeof API_AVAILABLE_CHANNELS)[number];

/** RAGFlow search 派生通道 */
export const API_RAGFLOW_CHANNELS = ['vector', 'bm25', 'graphrag'] as const;

/** RAG3 Hub 检索 API 通道 */
export const API_RAG3_CHANNELS = ['pageindex', 'wiki'] as const;

export const API_UNAVAILABLE_CHANNELS: RetrievalChannel[] = [];

export const API_UNAVAILABLE_HINT = '';

function snippet(chunk: RagflowSearchChunk): string {
  const html = chunk.content_with_weight || chunk.content || '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function pageFromPositions(chunk: RagflowSearchChunk): number | undefined {
  const pos = chunk.positions?.[0];
  if (!pos || pos.length < 5) return undefined;
  const page = Number(pos[0]);
  return Number.isFinite(page) && page > 0 ? page : undefined;
}

function toChannelHit(chunk: RagflowSearchChunk, rank: number, score: number): ChannelHit {
  return {
    rank,
    doc: chunk.docnm_kwd || chunk.document_name || '—',
    page: pageFromPositions(chunk),
    score,
    snippet: snippet(chunk),
    chunkId: chunk.chunk_id || chunk.id || '',
    docId: chunk.doc_id,
  };
}

function buildChannel(
  channel: RetrievalChannel,
  label: string,
  chunks: RagflowSearchChunk[],
  scoreFn: (c: RagflowSearchChunk) => number,
  latencyMs: number,
): ChannelResult {
  const sorted = [...chunks].sort((a, b) => scoreFn(b) - scoreFn(a));
  return {
    channel,
    label,
    latencyMs,
    hits: sorted.slice(0, 10).map((c, i) => toChannelHit(c, i + 1, scoreFn(c))),
  };
}

function inferSources(chunk: RagflowSearchChunk | undefined): RetrievalChannel[] {
  if (!chunk) return ['vector'];
  const sources: RetrievalChannel[] = [];
  if ((chunk.vector_similarity ?? 0) > 0) sources.push('vector');
  if ((chunk.term_similarity ?? 0) > 0) sources.push('bm25');
  if (chunk.knowledge_graph_kwd) sources.push('graphrag');
  return sources.length ? sources : ['vector'];
}

function mapFusionHits(result: SearchResult, preScores?: Map<string, number>): FusionHit[] {
  return result.hits.map(h => {
    const raw = result.rawChunks.find(c => (c.chunk_id || c.id) === h.chunk_id);
    const preScore = preScores?.get(h.chunk_id);
    return {
      rank: h.rank,
      doc: h.doc_name,
      page: raw ? pageFromPositions(raw) : undefined,
      wrrfScore: preScore ?? h.score,
      rerankScore: preScore != null ? h.score : undefined,
      snippet: h.snippet,
      chunkId: h.chunk_id,
      docId: h.doc_id || raw?.doc_id,
      sources: inferSources(raw),
    };
  });
}

export async function fetchRag3ChannelResult(
  kbId: string,
  channel: 'pageindex' | 'wiki',
  query: string,
): Promise<ChannelResult> {
  if (channel === 'wiki') {
    const res = await hubApi.searchWiki(kbId, query, 10);
    return {
      channel: 'wiki',
      label: 'Wiki',
      latencyMs: Number(res?.total_ms) || 0,
      hits: (res?.hits ?? []).map((h, i) => ({
        rank: i + 1,
        doc: String(h.doc_name ?? h.title ?? '—'),
        score: Number(h.score) || 0,
        snippet: String(h.content ?? ''),
        chunkId: String(h.id ?? ''),
        docId: h.doc_id ? String(h.doc_id) : undefined,
      })),
    };
  }
  const res = await hubApi.searchPageIndex(kbId, query, { topK: 10 });
  return {
    channel: 'pageindex',
    label: 'PageIndex',
    latencyMs: Number(res?.total_ms) || 0,
    hits: (res?.hits ?? []).map((h, i) => ({
      rank: i + 1,
      doc: String(h.doc_name ?? '—'),
      page: typeof h.page_range === 'string' ? parseInt(h.page_range.replace(/\D/g, ''), 10) || undefined : undefined,
      score: Number(h.confidence) || 0,
      snippet: String(h.excerpt ?? ''),
      chunkId: String(h.node_id ?? ''),
      docId: h.doc_id ? String(h.doc_id) : undefined,
    })),
  };
}

export function buildRealRetrievalResult(params: {
  query: string;
  pre: SearchResult;
  post: SearchResult | null;
  vectorWeight: number;
  enabledChannels: Set<RealApiChannel>;
  useKg: boolean;
  latencyMs: number;
  rerankMeta?: FullRetrievalResult['rerankMeta'];
}): FullRetrievalResult {
  const { query, pre, post, enabledChannels, useKg, latencyMs, vectorWeight, rerankMeta } = params;
  const raw = pre.rawChunks;
  const requestCount = post ? 2 : 1;
  const perChannelLatency = Math.max(1, Math.round(latencyMs / requestCount));

  const channels: ChannelResult[] = [];
  if (enabledChannels.has('vector')) {
    channels.push(
      buildChannel('vector', '向量', raw, c => c.vector_similarity ?? 0, perChannelLatency),
    );
  }
  if (enabledChannels.has('bm25')) {
    channels.push(
      buildChannel('bm25', 'BM25', raw, c => c.term_similarity ?? 0, perChannelLatency),
    );
  }
  if (useKg && enabledChannels.has('graphrag')) {
    const kgChunks = raw.filter(c => Boolean(c.knowledge_graph_kwd));
    channels.push(
      buildChannel(
        'graphrag',
        'GraphRAG',
        kgChunks.length > 0 ? kgChunks : raw.slice(0, Math.min(3, raw.length)),
        c => c.similarity ?? 0,
        perChannelLatency,
      ),
    );
  }

  const fusion = mapFusionHits(pre);
  const preScoreMap = new Map(fusion.map(h => [h.chunkId, h.wrrfScore]));
  const fusionReranked = post ? mapFusionHits(post, preScoreMap) : [];

  return {
    query,
    channels,
    fusion,
    fusionReranked,
    totalLatencyMs: latencyMs,
    rrfK: 0,
    isRealApi: true,
    vectorWeight,
    rerankMeta,
  };
}
