import { apiRequest } from './http';
import type {
  AdminJobApi,
  AdminRole,
  AdminUser,
  AuditLogItem,
  ClassifierConfigApi,
  FusionConfig,
  GenerationStrategyApi,
  MonitorDashboardApi,
  PipelineConfigApi,
  RetrievalStrategyConfig,
  RoutePreviewResult,
  SecurityRulesApi,
  TraceSummaryApi,
} from '../types/system';
import type { BackupPolicy, GrayRelease, PromptTemplate } from '../types/system';

function paramsToQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const systemService = {
  getHealth: () => apiRequest<{ overall: string; components: unknown[] }>('/admin/health'),

  getUsageStats: () => apiRequest<MonitorDashboardApi['usage']>('/admin/usage-stats'),

  getMonitor: () => apiRequest<MonitorDashboardApi>('/admin/monitor'),

  listUsers: () => apiRequest<AdminUser[]>('/admin/users'),

  inviteUser: (email: string) =>
    apiRequest<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify({ email }) }),

  removeUser: (user_id: string) =>
    apiRequest<{ deleted: boolean }>('/admin/users', { method: 'DELETE', body: JSON.stringify({ user_id }) }),

  getRoles: () => apiRequest<{ items: AdminRole[] }>('/admin/roles'),

  putRoles: (items: AdminRole[]) =>
    apiRequest<{ items: AdminRole[] }>('/admin/roles', { method: 'PUT', body: JSON.stringify({ items }) }),

  listAuditLogs: (params?: { search?: string; page?: number; page_size?: number }) =>
    apiRequest<{ items: AuditLogItem[]; total: number }>(`/admin/audit-logs${paramsToQuery(params)}`),

  listTraces: (params?: { search?: string; status?: string; tier?: string; page?: number; page_size?: number }) =>
    apiRequest<{ items: TraceSummaryApi[]; total: number }>(`/admin/traces${paramsToQuery(params)}`),

  getTraceStats: (hours = 24) =>
    apiRequest<import('../types/system').TraceStatsApi>(`/admin/traces/stats${paramsToQuery({ hours })}`),

  listTraceSessions: (params?: { search?: string; limit?: number }) =>
    apiRequest<{ items: import('../types/system').TraceSessionApi[] }>(`/admin/traces/sessions${paramsToQuery(params)}`),

  getTrace: (traceId: string) => apiRequest<Record<string, unknown>>(`/admin/traces/${traceId}`),

  exportTrace: (traceId: string) => apiRequest<Record<string, unknown>>(`/admin/traces/${traceId}/export`),

  getPipelineConfig: () => apiRequest<PipelineConfigApi>('/admin/pipeline-configs'),

  putPipelineConfig: (body: PipelineConfigApi) =>
    apiRequest<PipelineConfigApi>('/admin/pipeline-configs', { method: 'PUT', body: JSON.stringify(body) }),

  getClassifierConfig: () => apiRequest<ClassifierConfigApi>('/admin/classifier-config'),

  putClassifierConfig: (body: ClassifierConfigApi) =>
    apiRequest<ClassifierConfigApi>('/admin/classifier-config', { method: 'PUT', body: JSON.stringify(body) }),

  classifierPreview: (body: { query: string; kb_id?: string; user_roles?: string[] }) =>
    apiRequest<RoutePreviewResult>('/admin/classifier/preview', { method: 'POST', body: JSON.stringify(body) }),

  getFusionConfig: () => apiRequest<FusionConfig>('/admin/fusion-config'),

  putFusionConfig: (body: FusionConfig) =>
    apiRequest<FusionConfig>('/admin/fusion-config', { method: 'PUT', body: JSON.stringify(body) }),

  getRetrievalStrategy: () => apiRequest<RetrievalStrategyConfig>('/admin/retrieval-strategy'),

  putRetrievalStrategy: (body: RetrievalStrategyConfig) =>
    apiRequest<RetrievalStrategyConfig>('/admin/retrieval-strategy', { method: 'PUT', body: JSON.stringify(body) }),

  getGenerationStrategy: () => apiRequest<GenerationStrategyApi>('/admin/generation-strategy'),

  putGenerationStrategy: (body: GenerationStrategyApi) =>
    apiRequest<GenerationStrategyApi>('/admin/generation-strategy', { method: 'PUT', body: JSON.stringify(body) }),

  getPromptTemplates: () => apiRequest<{ items: PromptTemplate[] }>('/admin/prompt-templates'),

  putPromptTemplates: (items: PromptTemplate[]) =>
    apiRequest<{ items: PromptTemplate[] }>('/admin/prompt-templates', { method: 'PUT', body: JSON.stringify({ items }) }),

  createPromptTemplate: (body: Partial<PromptTemplate>) =>
    apiRequest<PromptTemplate>('/admin/prompt-templates', { method: 'POST', body: JSON.stringify(body) }),

  testPromptTemplate: (templateId: string, body: { body?: string; variables?: Record<string, string> }) =>
    apiRequest<{ output: string; valid: boolean }>(`/admin/prompt-templates/${templateId}/test`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getGrayReleases: () => apiRequest<{ items: GrayRelease[] }>('/admin/gray-releases'),

  createGrayRelease: (body: Partial<GrayRelease>) =>
    apiRequest<GrayRelease>('/admin/gray-releases', { method: 'POST', body: JSON.stringify(body) }),

  publishGrayRelease: (releaseId: string) =>
    apiRequest<{ job: AdminJobApi }>(`/admin/gray-releases/${releaseId}/publish`, { method: 'POST' }),

  rollbackGrayRelease: (releaseId: string) =>
    apiRequest<{ job: AdminJobApi }>(`/admin/gray-releases/${releaseId}/rollback`, { method: 'POST' }),

  getBackupPolicy: () => apiRequest<BackupPolicy>('/admin/backup-policy'),

  putBackupPolicy: (body: BackupPolicy) =>
    apiRequest<BackupPolicy>('/admin/backup-policy', { method: 'PUT', body: JSON.stringify(body) }),

  listBackups: () => apiRequest<{ items: AdminJobApi[] }>('/admin/backups'),

  triggerBackup: (body?: Record<string, unknown>) =>
    apiRequest<{ job: AdminJobApi }>('/admin/maintenance/backup', { method: 'POST', body: JSON.stringify(body || {}) }),

  triggerRestore: (body?: Record<string, unknown>) =>
    apiRequest<{ job: AdminJobApi }>('/admin/maintenance/restore', { method: 'POST', body: JSON.stringify(body || {}) }),

  getConfigDefaults: () => apiRequest<Record<string, unknown>>('/admin/config/defaults'),

  getVectorDb: () => apiRequest<Record<string, unknown>>('/admin/vector-db'),

  putVectorDb: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>('/admin/vector-db', { method: 'PUT', body: JSON.stringify(body) }),

  migrateVectorDb: (body?: Record<string, unknown>) =>
    apiRequest<{ job: AdminJobApi }>('/admin/vector-db/migrate', { method: 'POST', body: JSON.stringify(body || {}) }),

  getSecurityRules: () => apiRequest<SecurityRulesApi>('/admin/security/rules'),

  putSecurityRules: (body: SecurityRulesApi) =>
    apiRequest<SecurityRulesApi>('/admin/security/rules', { method: 'PUT', body: JSON.stringify(body) }),

  aclSimulate: (body: { query: string; user?: string }) =>
    apiRequest<{ allowed: boolean; reason: string }>('/admin/security/acl-simulate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getJob: (jobId: string) => apiRequest<AdminJobApi>(`/admin/jobs/${jobId}`),
};
