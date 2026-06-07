// 系统管理相关类型
export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  department: string;
  role_id: string;
  role_name: string;
  status: 'active' | 'inactive' | 'disabled';
  created_at: string;
  last_login?: string;
}

export interface Role {
  role_id: string;
  name: string;
  description?: string;
  permissions: string[];
  user_count: number;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  permission_id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface ACLRule {
  rule_id: string;
  kb_id: string;
  name: string;
  principal_type: 'role' | 'user';
  principal_id: string;
  permission: 'read' | 'write' | 'delete';
  conditions: ACLCondition[];
  status: 'enabled' | 'disabled';
  created_at: string;
}

export interface ACLCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in';
  value: string | string[];
}

export interface PipelineConfig {
  kb_id: string;
  pipelines: {
    p1_vector: PipelineStatus;
    p2_page_index: PipelineStatus;
    p3_graph_rag: PipelineStatus;
    p4_wiki: PipelineStatus;
    p5_agent: PipelineStatus;
  };
  models: {
    embedding_model: string;
    llm_model: string;
    reranker_model: string;
    classifier_model: string;
  };
  routing_rules: RoutingRule[];
}

export interface PipelineStatus {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface RoutingRule {
  rule_id: string;
  conditions: RoutingCondition[];
  primary_channel: string;
  secondary_channels: string[];
  fusion_strategy: string;
}

export interface RoutingCondition {
  classifier: string;
  value: string;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
  ip_address: string;
  user_agent?: string;
}

export interface SystemMetrics {
  qps: number;
  p95_latency: number;
  error_rate: number;
  gpu_utilization: number;
  pipeline_latency: {
    p1_vector: number;
    p2_page_index: number;
    p3_graph_rag: number;
    p4_wiki: number;
    p5_agent: number;
  };
  token_usage: {
    today_tokens: number;
    today_cost: number;
    month_tokens: number;
    month_cost: number;
    model_distribution: Record<string, number>;
  };
}

export interface AlertRule {
  rule_id: string;
  name: string;
  level: 'P0' | 'P1' | 'P2';
  condition: AlertCondition;
  notification_channels: string[];
  status: 'enabled' | 'disabled';
  created_at: string;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration?: number;
}