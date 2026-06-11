import type { ABTest, EvalRun } from '../types';
import type {
  AbTestApi,
  EvalDatasetApi,
  EvalRunApi,
  FailureCaseApi,
  NegativeCaseApi,
  ReplayTaskApi,
  RouteLearningApi,
  SatisfactionSummaryApi,
  SatisfactionTrendPointApi,
} from '../types/eval';
import type { EvalDataset, EvalSample, FailureCase, NegativeCase, SatisfactionSummary } from '../data/evalMock';
import type { Citation } from '../types';

function tsToDate(ts: number | string | undefined): string {
  if (!ts) return '';
  const n = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  if (!n || Number.isNaN(n)) return String(ts);
  return new Date(n).toISOString().slice(0, 10);
}

export function mapEvalDataset(row: EvalDatasetApi, kbName = ''): EvalDataset {
  return {
    id: row.id || row.dataset_id || '',
    name: row.name,
    sampleCount: row.sample_count ?? row.query_count ?? 0,
    kbId: row.kb_id || row.kb_ids?.[0] || '',
    kbName,
    tags: row.tags || [],
    updatedAt: tsToDate(row.updated_at ?? row.create_time),
    description: row.description,
  };
}

export function mapEvalSample(row: { id: string; dataset_id: string; question: string; expected_answer?: string }): EvalSample {
  return {
    id: row.id as unknown as number,
    datasetId: row.dataset_id,
    question: row.question,
    expectedAnswer: row.expected_answer || '',
  };
}

function normalizeScores(raw: Record<string, number> | undefined): Record<string, number> {
  const s = raw || {};
  return {
    faithfulness: Number(s.faithfulness ?? 0),
    context_precision: Number(s.context_precision ?? 0),
    answer_relevancy: Number(s.answer_relevancy ?? 0),
    hallucination_rate: Number(s.hallucination_rate ?? 0),
    'recall@10': Number(s['recall@10'] ?? s.recall ?? 0),
    mrr: Number(s.mrr ?? 0),
    hit_rate: Number(s.hit_rate ?? 0),
    retrieval_hit_count: Number(s.retrieval_hit_count ?? 0),
  };
}

export function mapEvalRun(row: EvalRunApi): EvalRun {
  const summary = (row.metrics_summary || {}) as Record<string, number>;
  const scores = normalizeScores((row.scores || summary) as Record<string, number>);
  const baseline = normalizeScores((row.baseline_scores || row.scores || summary) as Record<string, number>);
  if (summary.hit_rate != null) scores.hit_rate = Number(summary.hit_rate);
  if (summary.retrieval_hit_count != null) scores.retrieval_hit_count = Number(summary.retrieval_hit_count);
  return {
    run_id: row.run_id || row.id || '',
    name: row.name,
    kb_id: row.kb_id || '',
    kb_name: row.kb_name,
    dataset_id: row.dataset_id,
    dataset_name: row.dataset_name,
    status: (row.status || 'pending').toLowerCase() as EvalRun['status'],
    scores,
    baseline_scores: baseline,
    metrics_summary: summary,
    test_set_size: row.test_set_size ?? 0,
    completed_cases: row.completed_cases ?? 0,
    progress: row.progress ?? 0,
    eta_seconds: row.eta_seconds ?? null,
    error_message: row.error_message || row.diagnosis,
    diagnosis: row.diagnosis || row.error_message,
    zero_retrieval_cases: row.zero_retrieval_cases,
    evaluation_type: row.evaluation_type,
    metrics_requested: row.metrics,
    started_at: tsToDate(row.started_at as number) || String(row.started_at || ''),
    completed_at: row.completed_at ? tsToDate(row.completed_at as number) : null,
    duration_min: row.duration_min ?? undefined,
  };
}

export function mapAbTest(row: AbTestApi): ABTest {
  const ma = row.metrics_a || {};
  const mb = row.metrics_b || {};
  return {
    test_id: row.test_id || row.id,
    name: row.name,
    status: (row.status || 'running').toLowerCase() as ABTest['status'],
    variant_a_name: 'Variant A',
    variant_b_name: 'Variant B',
    traffic_ratio: [row.traffic_ratio ?? 0.5, 1 - (row.traffic_ratio ?? 0.5)],
    metrics_a: ma,
    metrics_b: mb,
    samples_a: 0,
    samples_b: 0,
    p_value: row.p_value ?? 1,
    started_at: tsToDate(row.create_time),
    winner: row.winner?.toLowerCase() === 'b' ? 'b' : row.winner ? 'a' : null,
  };
}

export function mapSatisfactionSummary(row: SatisfactionSummaryApi): SatisfactionSummary {
  return {
    positiveRate: Math.round((row.positive_rate ?? 0) * 1000) / 10,
    negativeRate: Math.round((row.negative_rate ?? 0) * 1000) / 10,
    correctionRate: Math.round((row.correction_rate ?? 0) * 1000) / 10,
    nps: row.nps ?? 0,
  };
}

export function mapNegativeCase(row: NegativeCaseApi): NegativeCase {
  return {
    convId: row.conv_id || '',
    title: row.title,
    reason: row.reason,
    rating: 'bad',
    query: row.query,
    answer: row.answer,
    feedback: row.feedback,
    kbName: row.kb_id,
  };
}

function mapEvalCitation(c: unknown, index: number): Citation {
  if (typeof c === 'string') {
    return {
      index: index + 1,
      doc_name: c,
      page_number: 0,
      section: '',
      snippet: c,
      relevance_score: 0,
    };
  }
  const row = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
  const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;
  const scoreRaw = row.relevance_score ?? row.wrrf_score ?? 0;
  return {
    index: Number(row.index) || index + 1,
    doc_id: (row.doc_id ?? meta.doc_id) as string | undefined,
    chunk_id: row.chunk_id as string | undefined,
    doc_name: String(row.doc_name || row.document_name || '引用'),
    page_number: Number(row.page_number ?? meta.page_number ?? meta.page ?? 0) || 0,
    section: String(row.section ?? meta.section ?? meta.section_title ?? ''),
    snippet: String(row.snippet ?? row.content ?? ''),
    relevance_score: Number(scoreRaw) || 0,
  };
}

export function mapFailureCase(row: FailureCaseApi): FailureCase {
  return {
    rank: row.rank,
    caseId: row.case_id,
    query: row.query || '',
    expected: row.expected || '',
    actual: row.actual || '',
    score: row.score,
    metric: row.metric,
    metrics: row.metrics,
    citations: Array.isArray(row.citations)
      ? row.citations.map((c, i) => mapEvalCitation(c, i))
      : undefined,
  };
}

export function mapReplayTask(row: ReplayTaskApi) {
  const online = row.online_metrics?.faithfulness ?? 0;
  const replay = row.replay_metrics?.faithfulness ?? 0;
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    sampleCount: row.sample_count ?? 0,
    dateRange: row.date_range ? `${tsToDate(row.date_range.start)}–${tsToDate(row.date_range.end)}` : '',
    onlineF: online,
    replayF: replay,
    delta: replay - online,
    progress: row.progress,
  };
}

export function mapRouteLearning(row: RouteLearningApi) {
  return {
    modelVersion: row.model_version,
    status: row.status as 'ready' | 'training' | 'idle',
    accuracy: row.accuracy,
    samples: row.samples,
    lastTrain: row.last_train ? tsToDate(row.last_train) : '—',
    pendingReview: row.pending_review,
    tiers: (row.tiers || []).map(t => ({
      tier: t.tier,
      label: t.label,
      count: t.samples,
      pct: Math.round(t.accuracy * 100),
    })),
  };
}

export function mapSatisfactionTrend(points: SatisfactionTrendPointApi[]) {
  return points.map(p => ({
    month: p.date,
    faithfulness: p.positive_rate,
    answer_relevancy: 1 - p.negative_rate,
    nps: p.nps / 100,
  }));
}
