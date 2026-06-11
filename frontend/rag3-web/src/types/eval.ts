export interface EvalDatasetApi {
  id: string;
  dataset_id?: string;
  name: string;
  description?: string;
  kb_id?: string;
  kb_ids?: string[];
  sample_count?: number;
  query_count?: number;
  tags?: string[];
  updated_at?: number | string;
  create_time?: number;
  status?: string;
}

export interface EvalSampleApi {
  id: string;
  dataset_id: string;
  question: string;
  expected_answer?: string;
  reference_answer?: string;
  relevant_chunk_ids?: string[];
}

export interface EvalRunApi {
  run_id: string;
  id?: string;
  name: string;
  kb_id?: string;
  kb_name?: string;
  dataset_id?: string;
  status: string;
  evaluation_type?: string;
  metrics?: string[];
  scores?: Record<string, number>;
  baseline_scores?: Record<string, number>;
  overall_score?: number;
  test_set_size?: number;
  completed_cases?: number;
  dataset_name?: string;
  progress?: number;
  eta_seconds?: number | null;
  metrics_summary?: Record<string, number>;
  error_message?: string;
  diagnosis?: string;
  zero_retrieval_cases?: number;
  started_at?: number | string;
  completed_at?: number | string | null;
  duration_min?: number | null;
}

export interface EvalDashboardApi {
  quality_score: number;
  latest_run?: EvalRunApi | null;
  running_tasks?: EvalRunApi[];
  recent_runs?: EvalRunApi[];
  satisfaction?: SatisfactionSummaryApi;
  trend_metrics?: SatisfactionTrendPointApi[];
  layered_eval?: Array<{ level: string; score: number }>;
}

export interface SatisfactionSummaryApi {
  positive_rate: number;
  negative_rate: number;
  correction_rate?: number;
  nps: number;
  total_queries?: number;
  rated_count?: number;
}

export interface SatisfactionTrendPointApi {
  date: string;
  positive_rate: number;
  negative_rate: number;
  nps: number;
  query_count?: number;
}

export interface NegativeCaseApi {
  conv_id?: string;
  title: string;
  reason: string;
  rating: string;
  query?: string;
  answer?: string;
  feedback?: string;
  kb_id?: string;
  message_id?: string;
}

export interface FailureCaseApi {
  rank: number;
  case_id?: string;
  query?: string;
  expected?: string;
  actual?: string;
  score: number;
  metric: string;
  metrics?: Record<string, number>;
  citations?: unknown[];
}

export interface RunScoresApi {
  items: FailureCaseApi[];
  total: number;
  total_cases: number;
  page?: number;
  page_size?: number;
  failures_only?: boolean;
  threshold?: number;
  sort_by?: string;
}

export interface AbTestApi {
  id: string;
  test_id?: string;
  name: string;
  status: string;
  variant_a_config?: Record<string, unknown>;
  variant_b_config?: Record<string, unknown>;
  traffic_ratio?: number;
  metrics_a?: Record<string, number>;
  metrics_b?: Record<string, number>;
  p_value?: number | null;
  winner?: string | null;
  run_ids?: string[];
  create_time?: number;
}

export interface ReplayTaskApi {
  id: string;
  name: string;
  status: string;
  sample_count?: number;
  date_range?: { start?: number; end?: number };
  online_metrics?: Record<string, number>;
  replay_metrics?: Record<string, number>;
  progress?: number;
  create_time?: number;
}

export interface RouteLearningApi {
  model_version: string;
  status: string;
  accuracy: number;
  samples: number;
  last_train?: number | null;
  pending_review: number;
  tiers: Array<{ tier: string; label: string; accuracy: number; samples: number }>;
}

export interface CostSummaryApi {
  total_cost_cny: number;
  total_tokens: number;
  period: string;
  budget: { monthly_budget: number; alert_threshold: number };
  budget_used_pct: number;
}
