import { apiRequest, getStoredAuth } from './http';
import type {
  AbTestApi,
  CostSummaryApi,
  EvalDashboardApi,
  EvalDatasetApi,
  EvalRunApi,
  EvalSampleApi,
  FailureCaseApi,
  RunScoresApi,
  NegativeCaseApi,
  ReplayTaskApi,
  RouteLearningApi,
  SatisfactionSummaryApi,
  SatisfactionTrendPointApi,
} from '../types/eval';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

function buildUrl(path: string) {
  return `${API_BASE}/${API_VERSION}${path}`;
}

export const evalService = {
  getDashboard: (params?: { kb_id?: string; period?: string }) =>
    apiRequest<EvalDashboardApi>(`/eval/dashboard${paramsToQuery(params)}`),

  listRuns: (params?: { status?: string; kb_id?: string; page?: number; page_size?: number }) =>
    apiRequest<EvalRunApi[]>(`/eval/runs${paramsToQuery(params)}`),

  getRun: (runId: string) =>
    apiRequest<EvalRunApi>(`/eval/runs/${runId}`),

  createRun: (body: {
    name: string;
    dataset_id: string;
    kb_id: string;
    evaluation_type?: string;
    metrics?: string[];
    config_override?: Record<string, unknown>;
  }) =>
    apiRequest<EvalRunApi>('/eval/runs', { method: 'POST', body: JSON.stringify(body) }),

  stopRun: (runId: string) =>
    apiRequest<{ stopped: boolean }>(`/eval/runs/${runId}/stop`, { method: 'POST' }),

  getRunScores: (runId: string, params?: {
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
    failures_only?: boolean;
    threshold?: number;
  }) =>
    apiRequest<RunScoresApi | FailureCaseApi[]>(`/eval/runs/${runId}/scores${paramsToQuery({
      ...params,
      failures_only: params?.failures_only === false ? 'false' : 'true',
    })}`),

  exportRunUrl: (runId: string) => buildUrl(`/eval/runs/${runId}/export`),

  listDatasets: (params?: { search?: string; kb_id?: string; tag?: string }) =>
    apiRequest<EvalDatasetApi[]>(`/eval/datasets${paramsToQuery(params)}`),

  createDataset: (body: { name: string; description?: string; kb_id?: string; kb_ids?: string[]; tags?: string[] }) =>
    apiRequest<EvalDatasetApi>('/eval/datasets', { method: 'POST', body: JSON.stringify(body) }),

  updateDataset: (id: string, body: { name?: string; description?: string; kb_id?: string; kb_ids?: string[]; tags?: string[] }) =>
    apiRequest<EvalDatasetApi>(`/eval/datasets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteDataset: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/eval/datasets/${id}`, { method: 'DELETE' }),

  listSamples: (datasetId: string) =>
    apiRequest<EvalSampleApi[]>(`/eval/datasets/${datasetId}/samples`),

  addSample: (datasetId: string, body: { question: string; expected_answer?: string; relevant_chunk_ids?: string[] }) =>
    apiRequest<{ id: string }>(`/eval/datasets/${datasetId}/samples`, { method: 'POST', body: JSON.stringify(body) }),

  updateSample: (datasetId: string, sampleId: string, body: { question?: string; expected_answer?: string; relevant_chunk_ids?: string[] }) =>
    apiRequest<{ updated: boolean }>(`/eval/datasets/${datasetId}/samples/${sampleId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteSample: (datasetId: string, sampleId: string) =>
    apiRequest<{ deleted: boolean }>(`/eval/datasets/${datasetId}/samples/${sampleId}`, { method: 'DELETE' }),

  importSamples: async (datasetId: string, file: File) => {
    const auth = getStoredAuth();
    const isJson = file.name.toLowerCase().endsWith('.json') || file.type.includes('json');
    if (isJson) {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const samples = Array.isArray(parsed)
        ? parsed
        : (parsed as { samples?: unknown[] }).samples ?? [];
      const { data } = await apiRequest<{ imported: number; failed: number }>(
        `/eval/datasets/${datasetId}/import`,
        { method: 'POST', body: JSON.stringify({ samples }) },
      );
      return data;
    }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(buildUrl(`/eval/datasets/${datasetId}/import`), {
      method: 'POST',
      headers: auth ? { Authorization: auth } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok || json.code !== 0) throw new Error(json.message || '导入失败');
    return json.data as { imported: number; failed: number };
  },

  sampleFromChat: (body: { dataset_id: string; question: string; answer?: string; relevant_chunk_ids?: string[] }) =>
    apiRequest<{ id: string }>('/eval/datasets/sample-from-chat', { method: 'POST', body: JSON.stringify(body) }),

  getSatisfactionSummary: (params?: { period?: string; kb_id?: string }) =>
    apiRequest<SatisfactionSummaryApi>(`/eval/satisfaction/summary${paramsToQuery(params)}`),

  getSatisfactionTrend: (params?: { period?: string; kb_id?: string }) =>
    apiRequest<SatisfactionTrendPointApi[]>(`/eval/satisfaction/trend${paramsToQuery(params)}`),

  getNegativeCases: (params?: { period?: string; kb_id?: string }) =>
    apiRequest<NegativeCaseApi[]>(`/eval/satisfaction/negative-cases${paramsToQuery(params)}`),

  getCostSummary: (params?: { period?: string; kb_id?: string }) =>
    apiRequest<CostSummaryApi>(`/eval/cost/summary${paramsToQuery(params)}`),

  getCostBreakdown: (params?: { period?: string; dimension?: string }) =>
    apiRequest<Array<{ id: string; name: string; tokens: number; cost_cny: number }>>(
      `/eval/cost/breakdown${paramsToQuery(params)}`,
    ),

  getCostTrend: (params?: { period?: string }) =>
    apiRequest<Array<{ date: string; tokens: number; cost_cny: number }>>(`/eval/cost/trend${paramsToQuery(params)}`),

  getBudget: () =>
    apiRequest<{ monthly_budget: number; alert_threshold: number }>('/eval/cost/budget'),

  saveBudget: (body: { monthly_budget: number; alert_threshold: number }) =>
    apiRequest<{ monthly_budget: number; alert_threshold: number }>('/eval/cost/budget', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  listReplayTasks: () =>
    apiRequest<ReplayTaskApi[]>('/eval/replay/tasks'),

  createReplayTask: (body: { name?: string; date_range?: { start?: number; end?: number }; sample_count?: number; kb_id?: string }) =>
    apiRequest<ReplayTaskApi>('/eval/replay/tasks', { method: 'POST', body: JSON.stringify(body) }),

  getReplayTask: (taskId: string) =>
    apiRequest<ReplayTaskApi>(`/eval/replay/tasks/${taskId}`),

  stopReplayTask: (taskId: string) =>
    apiRequest<{ stopped: boolean }>(`/eval/replay/tasks/${taskId}/stop`, { method: 'POST' }),

  listAbTests: () =>
    apiRequest<AbTestApi[]>('/eval/ab-tests'),

  createAbTest: (body: Record<string, unknown>) =>
    apiRequest<{ test_id: string; run_ids: string[] }>('/eval/ab-tests', { method: 'POST', body: JSON.stringify(body) }),

  stopAbTest: (testId: string) =>
    apiRequest<{ stopped: boolean }>(`/eval/ab-tests/${testId}/stop`, { method: 'POST' }),

  getAbTestReport: (testId: string) =>
    apiRequest<{ metrics_a: Record<string, number>; metrics_b: Record<string, number>; p_value: number; winner: string }>(
      `/eval/ab-tests/${testId}/report`,
    ),

  getRouteLearningStatus: () =>
    apiRequest<RouteLearningApi>('/eval/route-learning/status'),

  importRouteSamples: (samples: unknown[]) =>
    apiRequest<{ imported: number }>('/eval/route-learning/import', {
      method: 'POST',
      body: JSON.stringify({ samples }),
    }),

  trainRouteLearning: (sampleIds?: string[]) =>
    apiRequest<RouteLearningApi>('/eval/route-learning/train', {
      method: 'POST',
      body: JSON.stringify({ sample_ids: sampleIds }),
    }),

  publishRouteLearning: () =>
    apiRequest<RouteLearningApi>('/eval/route-learning/publish', { method: 'POST' }),

  rollbackRouteLearning: () =>
    apiRequest<RouteLearningApi>('/eval/route-learning/rollback', { method: 'POST' }),
};

function paramsToQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}
