import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_FUSION_CONFIG,
  DEFAULT_RETRIEVAL_STRATEGY,
  GENERATION_STRATEGY_ROWS,
} from '../data/fusionMock';
import {
  DEFAULT_MODEL_CONFIG,
  DEFAULT_ROUTING_RULES,
  PIPELINE_DEFINITIONS,
  PIPELINE_GLOBAL_SETTINGS,
} from '../data/pipelineMock';
import {
  BACKUP_POLICY,
  GRAY_RELEASES,
  PROMPT_TEMPLATES,
  VECTOR_DB_OPTIONS,
} from '../data/systemOpsMock';
import { mockAuditLogs, mockUsers } from '../mockData';
import { mapAuditLog, mapTraceDetail, mapTraceSession, mapTraceStats, mapTraceSummary } from '../services/systemMappers';
import { systemService } from '../services/systemService';
import { useApiMode } from '../services/http';
import type {
  AdminUser,
  AuditLogItem,
  ClassifierConfigApi,
  FusionConfig,
  GenerationStrategyApi,
  MonitorDashboardApi,
  PipelineConfigApi,
  RetrievalStrategyConfig,
  SecurityRulesApi,
  TraceStatsApi,
  TraceSummaryApi,
} from '../types/system';
import type { AuditLog, TraceRecord, TraceSession } from '../types/system';

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

const EMPTY_PIPELINE: PipelineConfigApi = {
  definitions: [],
  routingRules: [],
  modelConfig: DEFAULT_MODEL_CONFIG,
  globalSettings: PIPELINE_GLOBAL_SETTINGS,
};

export function useAdminUsers() {
  const apiMode = useApiMode();
  return useAsync<AdminUser[]>(
    async () => {
      const { data } = await systemService.listUsers();
      return data;
    },
    mockUsers as AdminUser[],
    [],
    [],
    apiMode,
  );
}

export function useAdminAuditLogs(search = '') {
  const apiMode = useApiMode();
  return useAsync<AuditLog[]>(
    async () => {
      const { data } = await systemService.listAuditLogs({ search, page_size: 100 });
      return (data.items || []).map((item: AuditLogItem) => mapAuditLog(item));
    },
    mockAuditLogs,
    [],
    [search],
    apiMode,
  );
}

export function usePipelineConfig() {
  const apiMode = useApiMode();
  return useAsync<PipelineConfigApi>(
    async () => {
      const { data } = await systemService.getPipelineConfig();
      return data;
    },
    {
      definitions: PIPELINE_DEFINITIONS,
      routingRules: DEFAULT_ROUTING_RULES,
      modelConfig: DEFAULT_MODEL_CONFIG,
      globalSettings: PIPELINE_GLOBAL_SETTINGS,
    },
    EMPTY_PIPELINE,
    [],
    apiMode,
  );
}

export function useClassifierConfig() {
  const apiMode = useApiMode();
  return useAsync<ClassifierConfigApi>(
    async () => {
      const { data } = await systemService.getClassifierConfig();
      return data;
    },
    { classifiers: [], routingMatrix: DEFAULT_ROUTING_RULES },
    { classifiers: [], routingMatrix: [] },
    [],
    apiMode,
  );
}

export function useFusionConfig() {
  const apiMode = useApiMode();
  return useAsync<FusionConfig>(
    async () => {
      const { data } = await systemService.getFusionConfig();
      return data;
    },
    DEFAULT_FUSION_CONFIG,
    DEFAULT_FUSION_CONFIG,
    [],
    apiMode,
  );
}

export function useRetrievalStrategy() {
  const apiMode = useApiMode();
  return useAsync<RetrievalStrategyConfig>(
    async () => {
      const { data } = await systemService.getRetrievalStrategy();
      return data;
    },
    DEFAULT_RETRIEVAL_STRATEGY,
    DEFAULT_RETRIEVAL_STRATEGY,
    [],
    apiMode,
  );
}

export function useGenerationStrategy() {
  const apiMode = useApiMode();
  return useAsync<GenerationStrategyApi>(
    async () => {
      const { data } = await systemService.getGenerationStrategy();
      return data;
    },
    { strategies: GENERATION_STRATEGY_ROWS, activeType: 'single_rag' },
    { strategies: [], activeType: 'single_rag' },
    [],
    apiMode,
  );
}

const EMPTY_MONITOR: MonitorDashboardApi = {
  health: { overall: 'unknown', components: [] },
  usage: {
    qps: 0,
    totalQueriesToday: 0,
    totalQueriesWeek: 0,
    avgLatencyMs: 0,
    successRate: 0,
    kbCount: 0,
    indexedDocs: 0,
    hourlyQueries: [],
  },
  alerts: [],
  services: [],
};

export function useMonitorDashboard(pollMs = 0) {
  const apiMode = useApiMode();
  return useAsync<MonitorDashboardApi>(
    async () => {
      const { data } = await systemService.getMonitor();
      return data;
    },
    EMPTY_MONITOR,
    EMPTY_MONITOR,
    [],
    apiMode,
    pollMs || undefined,
  );
}

export function useTraces(search = '', status = '', tier = '') {
  const apiMode = useApiMode();
  return useAsync<TraceRecord[]>(
    async () => {
      const { data } = await systemService.listTraces({
        search,
        status: status === 'all' ? '' : status,
        tier: tier === 'all' ? '' : tier,
        page_size: 100,
      });
      return (data.items || []).map((t: TraceSummaryApi) => mapTraceSummary(t));
    },
    [],
    [],
    [search, status, tier],
    apiMode,
  );
}

const EMPTY_TRACE_STATS: TraceStatsApi = {
  todayCount: 0,
  p95Ms: 0,
  errorRate: 0,
  avgTokens: 0,
  totalCostToday: 0,
  emptyRetrievalRate: 0,
  contextTruncateRate: 0,
};

export function useTraceStats(hours = 24) {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await systemService.getTraceStats(hours);
      return mapTraceStats(data);
    },
    EMPTY_TRACE_STATS,
    EMPTY_TRACE_STATS,
    [hours],
    apiMode,
  );
}

export function useTraceSessions(search = '') {
  const apiMode = useApiMode();
  return useAsync<TraceSession[]>(
    async () => {
      const { data } = await systemService.listTraceSessions({ search, limit: 100 });
      return (data.items || []).map(s => mapTraceSession(s as unknown as Record<string, unknown>));
    },
    [],
    [],
    [search],
    apiMode,
  );
}

export async function fetchTraceDetail(traceId: string): Promise<TraceRecord> {
  const { data } = await systemService.getTrace(traceId);
  return mapTraceDetail(data);
}

export function usePromptTemplates() {
  const apiMode = useApiMode();
  return useAsync<PromptTemplate[]>(
    async () => {
      const { data } = await systemService.getPromptTemplates();
      return data.items || [];
    },
    PROMPT_TEMPLATES,
    [],
    [],
    apiMode,
  );
}

export function useGrayReleases() {
  const apiMode = useApiMode();
  return useAsync<GrayRelease[]>(
    async () => {
      const { data } = await systemService.getGrayReleases();
      return data.items || [];
    },
    GRAY_RELEASES,
    [],
    [],
    apiMode,
  );
}

export function useBackupPolicy() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await systemService.getBackupPolicy();
      return data;
    },
    BACKUP_POLICY,
    BACKUP_POLICY,
    [],
    apiMode,
  );
}

export function useVectorDbConfig() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await systemService.getVectorDb();
      return data;
    },
    { current: 'milvus', target: 'milvus', options: VECTOR_DB_OPTIONS },
    { current: 'milvus', target: 'milvus', options: [] },
    [],
    apiMode,
  );
}

export function useAdminRoles() {
  const apiMode = useApiMode();
  return useAsync(
    async () => {
      const { data } = await systemService.getRoles();
      return data.items || [];
    },
    [],
    [],
    [],
    apiMode,
  );
}

export function useSecurityRules() {
  const apiMode = useApiMode();
  return useAsync<SecurityRulesApi>(
    async () => {
      const { data } = await systemService.getSecurityRules();
      return data;
    },
    { piiRules: [], poisonQueue: [] },
    { piiRules: [], poisonQueue: [] },
    [],
    apiMode,
  );
}

export { systemService };
