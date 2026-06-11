import type { AuditLog } from '../types';
import type {
  AdminUser,
  AuditLogItem,
  TraceRecord,
  TraceSpan,
  TraceSummaryApi,
} from '../types/system';

function minimalRootSpan(durationMs: number): TraceSpan {
  return {
    id: 'root',
    name: 'rag.query',
    type: 'root',
    startMs: 0,
    durationMs,
    status: 'ok',
    children: [],
  };
}

export function mapAdminUser(u: AdminUser) {
  return u;
}

export function mapAuditLog(item: AuditLogItem): AuditLog {
  const ts = item.timestamp;
  const timestamp = typeof ts === 'number'
    ? new Date(ts).toISOString().replace('T', ' ').slice(0, 19)
    : String(ts);
  return {
    log_id: item.log_id || (item as { event_id?: string }).event_id || '',
    timestamp,
    user_name: item.user_name,
    action: item.action,
    resource: item.resource,
    ip: item.ip || (item as { ip_address?: string }).ip_address || '',
    result: item.result || 'success',
  };
}

export function mapTraceSummary(t: TraceSummaryApi): TraceRecord {
  const ts = t.timestamp ? new Date(t.timestamp).toISOString().replace('T', ' ').slice(0, 19) : '';
  return {
    id: t.id,
    traceId: t.traceId,
    query: t.query,
    user: t.userId,
    kb: t.kbId,
    kbId: t.kbId,
    durationMs: t.latencyMs,
    tokens: 0,
    cost: 0,
    tier: t.routeTier || '',
    pipeline: (t.channels || []).join(', '),
    status: t.status === 'success' ? 'success' : 'error',
    time: ts,
    environment: 'production',
    convId: t.conversationId,
    layers: [{ layer: 'L3', label: '检索', detail: (t.channels || []).join(', ') || '—', ms: 0 }],
    rootSpan: minimalRootSpan(t.latencyMs),
  };
}
