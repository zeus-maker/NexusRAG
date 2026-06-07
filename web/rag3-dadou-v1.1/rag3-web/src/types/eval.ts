// 评测相关类型
export interface EvalDashboard {
  period: string;
  metrics: {
    faithfulness: MetricValue;
    context_precision: MetricValue;
    answer_relevancy: MetricValue;
    hallucination_rate: MetricValue;
  };
  trend_data: TrendData[];
  layered_eval: LayeredMetric[];
}

export interface MetricValue {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendData {
  date: string;
  faithfulness: number;
  context_precision: number;
  answer_relevancy: number;
  hallucination_rate: number;
}

export interface LayeredMetric {
  layer: string;
  name: string;
  score: number;
  description: string;
}

export interface EvalTask {
  task_id: string;
  name: string;
  kb_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
  test_set_size: number;
  metrics: EvalMetrics;
}

export interface EvalMetrics {
  faithfulness?: number;
  context_precision?: number;
  answer_relevancy?: number;
  hallucination_rate?: number;
  context_recall?: number;
  bleu_score?: number;
}

export interface EvalResult {
  task_id: string;
  overall_score: number;
  metrics: EvalMetrics;
  baseline_comparison?: BaselineComparison;
  failed_cases: FailedCase[];
}

export interface BaselineComparison {
  metric: string;
  current: number;
  baseline: number;
  change: number;
  improved: boolean;
}

export interface FailedCase {
  case_id: number;
  query: string;
  expected: string;
  actual: string;
  faithfulness: number;
  error_type: string;
}

export interface ABTest {
  test_id: string;
  name: string;
  variable: 'embedding_model' | 'llm_model' | 'reranker' | 'strategy' | 'parameters';
  variant_a: ABVariant;
  variant_b: ABVariant;
  status: 'running' | 'completed' | 'stopped';
  traffic_split: number;
  started_at: string;
  ended_at?: string;
  statistical_significance?: number;
  winner?: 'A' | 'B';
}

export interface ABVariant {
  name: string;
  config: Record<string, unknown>;
  metrics: {
    faithfulness: number;
    recall_at_10: number;
    p95_latency: number;
    sample_size: number;
  };
}

export interface TestSet {
  set_id: string;
  name: string;
  description?: string;
  size: number;
  created_at: string;
  source: 'default' | 'uploaded' | 'generated';
}