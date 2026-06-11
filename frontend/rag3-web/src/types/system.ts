/** 系统管理 API 与 UI 类型（mock 类型复用于页面展示） */
export type {
  PipelineDefinition,
  PipelineStatus,
  RoutingRule,
  PipelineModelConfig,
  RoutePreviewResult,
  FusionStrategy,
} from '../data/pipelineMock';

export type {
  FusionConfig,
  RetrievalStrategyConfig,
  GenerationStrategyRow,
  ConflictPolicy,
  DedupStrategy,
  RetrievalRouterMode,
  GenerationStrategyType,
} from '../data/fusionMock';

export type {
  ClassifierMeta,
  RoutingMatrixRow,
  TierDefinition,
  KeywordRule,
  DocTypeMapping,
  IntentMapping,
  SecurityTier,
} from '../data/classifierMock';

export type {
  PromptTemplate,
  GrayRelease,
  BackupPolicy,
  BackupRecord,
  VectorDbOption,
  VectorDbVendor,
} from '../data/systemOpsMock';

export type { TraceRecord, TraceSession, TraceSpan } from '../data/tracesMock';

export interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'disabled' | 'locked';
  last_login: string;
}

export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

export interface AuditLogItem {
  log_id: string;
  timestamp: string | number;
  user_name: string;
  action: string;
  resource: string;
  ip: string;
  result: string;
}

export interface PipelineConfigApi {
  definitions: import('../data/pipelineMock').PipelineDefinition[];
  routingRules: import('../data/pipelineMock').RoutingRule[];
  modelConfig: import('../data/pipelineMock').PipelineModelConfig;
  globalSettings: Record<string, unknown>;
  stats?: Record<string, unknown>;
}

export interface ClassifierConfigApi {
  classifiers: Array<Record<string, unknown>>;
  routingMatrix: import('../data/classifierMock').RoutingMatrixRow[];
  tiers?: import('../data/classifierMock').TierDefinition[];
  keywordRules?: import('../data/classifierMock').KeywordRule[];
  docTypeMappings?: import('../data/classifierMock').DocTypeMapping[];
  intentMappings?: import('../data/classifierMock').IntentMapping[];
  securityTiers?: import('../data/classifierMock').SecurityTier[];
}

export interface MonitorDashboardApi {
  health: { overall: string; components: Array<{ name: string; status: string; latencyMs: number; message: string }> };
  usage: {
    qps: number;
    totalQueriesToday: number;
    totalQueriesWeek: number;
    avgLatencyMs: number;
    successRate: number;
    kbCount: number;
    indexedDocs: number;
    hourlyQueries: Array<{ hour: number; count: number }>;
  };
  alerts: unknown[];
  services: unknown[];
}

export interface TraceSummaryApi {
  id: string;
  traceId: string;
  conversationId: string;
  query: string;
  status: string;
  latencyMs: number;
  timestamp: number;
  userId: string;
  kbId: string;
  channels: string[];
  routeTier: string;
}

export interface SecurityRulesApi {
  piiRules: Array<{ name: string; pattern: string; action: string; enabled: boolean }>;
  poisonQueue: unknown[];
}

export interface AdminJobApi {
  id: string;
  job_type: string;
  status: string;
  progress: number;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  created_at?: number;
  completed_at?: number;
}

export interface GenerationStrategyApi {
  strategies: import('../data/fusionMock').GenerationStrategyRow[];
  activeType: string;
}
