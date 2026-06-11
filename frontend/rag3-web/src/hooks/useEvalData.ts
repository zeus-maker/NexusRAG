import { useCallback, useEffect, useState } from 'react';
import {
  EVAL_DATASETS,
  EVAL_SAMPLES,
  FAILURE_CASES,
  NEGATIVE_CASES,
  REPLAY_TASKS,
  ROUTE_LEARNING,
  SATISFACTION_SUMMARY,
  type EvalDataset,
  type EvalSample,
  type FailureCase,
  type NegativeCase,
  type SatisfactionSummary,
} from '../data/evalMock';
import { mockABTests, mockEvalRuns } from '../mockData';
import {
  mapAbTest,
  mapEvalDataset,
  mapEvalRun,
  mapEvalSample,
  mapFailureCase,
  mapNegativeCase,
  mapReplayTask,
  mapRouteLearning,
  mapSatisfactionSummary,
  mapSatisfactionTrend,
} from '../services/evalMappers';
import { evalService } from '../services/evalService';
import { useApiMode } from '../services/http';
import type { ABTest, EvalRun } from '../types';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  mock: T,
  empty: T,
  deps: unknown[],
  apiMode: boolean,
  pollMs?: number,
): AsyncState<T> {
  const [data, setData] = useState<T>(apiMode ? empty : mock);
  const [loading, setLoading] = useState(apiMode);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!apiMode) {
      setData(mock);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = () => {
      fetcher()
        .then(result => {
          if (!cancelled) {
            setData(result);
            setLoading(false);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) {
            setError(e.message || '加载失败');
            setData(empty);
            setLoading(false);
          }
        });
    };
    load();
    if (!pollMs) return () => { cancelled = true; };
    const id = setInterval(load, pollMs);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, apiMode, pollMs, ...deps]);

  return { data, loading, error, refresh };
}

export function useEvalDashboard(period: string, kbId: string) {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await evalService.getDashboard({ period, kb_id: kbId || undefined });
      return {
        runs: (data.recent_runs || []).map(mapEvalRun),
        running: (data.running_tasks || []).map(mapEvalRun),
        latest: data.latest_run ? mapEvalRun(data.latest_run) : null,
        qualityScore: data.quality_score ?? 0,
        satisfaction: data.satisfaction ? mapSatisfactionSummary(data.satisfaction) : SATISFACTION_SUMMARY,
        layered: data.layered_eval || [],
        trend: mapSatisfactionTrend(data.trend_metrics || []),
      };
    },
    {
      runs: mockEvalRuns,
      running: mockEvalRuns.filter(r => r.status === 'running'),
      latest: mockEvalRuns.find(r => r.status === 'completed') ?? null,
      qualityScore: 0.86,
      satisfaction: SATISFACTION_SUMMARY,
      layered: [],
      trend: [],
    },
    { runs: [], running: [], latest: null, qualityScore: 0, satisfaction: SATISFACTION_SUMMARY, layered: [], trend: [] },
    [period, kbId],
    apiMode,
    60000,
  );
}

export function useEvalRuns(kbId: string, statusFilter: string) {
  const apiMode = useApiMode();
  const hasRunning = statusFilter === 'running' || statusFilter === '';
  return useAsync(
    async () => {
      const { data } = await evalService.listRuns({
        kb_id: kbId || undefined,
        status: statusFilter || undefined,
        page_size: 50,
      });
      return data.map(mapEvalRun);
    },
    mockEvalRuns,
    [] as EvalRun[],
    [kbId, statusFilter],
    apiMode,
    hasRunning ? 5000 : undefined,
  );
}

export function useEvalDatasets(search: string, kbId: string, tag = '') {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await evalService.listDatasets({
        search: search || undefined,
        kb_id: kbId || undefined,
        tag: tag || undefined,
      });
      return data.map(d => mapEvalDataset(d));
    },
    EVAL_DATASETS,
    [] as EvalDataset[],
    [search, kbId, tag],
    apiMode,
  );
}

export function useEvalSamples(datasetId: string | null) {
  const apiMode = useApiMode();
  const mockSamples = datasetId ? (EVAL_SAMPLES[datasetId] ?? []) : [];
  return useAsync(
    async () => {
      if (!datasetId) return [];
      const { data } = await evalService.listSamples(datasetId);
      return data.map(mapEvalSample);
    },
    mockSamples,
    [] as EvalSample[],
    [datasetId],
    apiMode && !!datasetId,
  );
}

export interface RunScoresState {
  items: FailureCase[];
  total: number;
  totalCases: number;
}

const EMPTY_SCORES: RunScoresState = { items: [], total: 0, totalCases: 0 };

function parseRunScores(data: unknown): RunScoresState {
  if (Array.isArray(data)) {
    const items = data.map(mapFailureCase);
    return { items, total: items.length, totalCases: items.length };
  }
  const row = data as { items?: unknown[]; total?: number; total_cases?: number };
  const items = (row.items || []).map((x) => mapFailureCase(x as Parameters<typeof mapFailureCase>[0]));
  return {
    items,
    total: row.total ?? items.length,
    totalCases: row.total_cases ?? items.length,
  };
}

export function useRunScores(
  runId: string | null,
  options?: {
    failuresOnly?: boolean;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    threshold?: number;
    pollMs?: number;
  },
) {
  const apiMode = useApiMode();
  const failuresOnly = options?.failuresOnly ?? true;
  const pageSize = options?.pageSize ?? (failuresOnly ? 10 : 50);
  const sortBy = options?.sortBy ?? 'faithfulness';
  const sortOrder = options?.sortOrder ?? (failuresOnly ? 'asc' : 'desc');
  const pollMs = options?.pollMs;

  return useAsync(
    async () => {
      if (!runId) return EMPTY_SCORES;
      const { data } = await evalService.getRunScores(runId, {
        sort_by: sortBy,
        sort_order: sortOrder,
        page_size: pageSize,
        failures_only: failuresOnly,
        threshold: options?.threshold ?? 0.7,
      });
      return parseRunScores(data);
    },
    { items: FAILURE_CASES, total: FAILURE_CASES.length, totalCases: FAILURE_CASES.length },
    EMPTY_SCORES,
    [runId, failuresOnly, pageSize, sortBy, sortOrder, options?.threshold],
    apiMode && !!runId,
    apiMode && !!runId ? pollMs : undefined,
  );
}

export function useSatisfaction(period: string) {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const [summaryRes, trendRes, negRes] = await Promise.all([
        evalService.getSatisfactionSummary({ period }),
        evalService.getSatisfactionTrend({ period }),
        evalService.getNegativeCases({ period }),
      ]);
      return {
        summary: mapSatisfactionSummary(summaryRes.data),
        trend: trendRes.data,
        negatives: negRes.data.map(mapNegativeCase),
      };
    },
    { summary: SATISFACTION_SUMMARY, trend: [], negatives: NEGATIVE_CASES },
    { summary: SATISFACTION_SUMMARY, trend: [], negatives: [] as NegativeCase[] },
    [period],
    apiMode,
  );
}

export function useAbTests() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await evalService.listAbTests();
      return data.map(mapAbTest);
    },
    mockABTests,
    [] as ABTest[],
    [],
    apiMode,
    5000,
  );
}

export function useReplayTasks() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await evalService.listReplayTasks();
      return data.map(mapReplayTask);
    },
    REPLAY_TASKS,
    [],
    [],
    apiMode,
    5000,
  );
}

export function useRouteLearning() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await evalService.getRouteLearningStatus();
      return mapRouteLearning(data);
    },
    ROUTE_LEARNING,
    ROUTE_LEARNING,
    [],
    apiMode,
  );
}

export function useEvalCost(period: string) {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const [summary, breakdownKb, breakdownUser, breakdownModel, trend, budget] = await Promise.all([
        evalService.getCostSummary({ period }),
        evalService.getCostBreakdown({ period, dimension: 'kb' }),
        evalService.getCostBreakdown({ period, dimension: 'user' }),
        evalService.getCostBreakdown({ period, dimension: 'model' }),
        evalService.getCostTrend({ period }),
        evalService.getBudget(),
      ]);
      return {
        summary: summary.data,
        byKb: breakdownKb.data,
        byUser: breakdownUser.data,
        byModel: breakdownModel.data,
        trend: trend.data,
        budget: budget.data,
      };
    },
    { summary: null, byKb: [], byUser: [], byModel: [], trend: [], budget: { monthly_budget: 1000, alert_threshold: 0.8 } },
    { summary: null, byKb: [], byUser: [], byModel: [], trend: [], budget: { monthly_budget: 1000, alert_threshold: 0.8 } },
    [period],
    apiMode,
  );
}
