import type { AuditLog } from '../types';
import type {
  AdminUser,
  AuditLogItem,
  TraceRecord,
  TraceSession,
  TraceSpan,
  TraceStatsApi,
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

function mapSpan(raw: Record<string, unknown>): TraceSpan {
  return {
    id: String(raw.id || 'span'),
    name: String(raw.name || ''),
    type: (raw.type as TraceSpan['type']) || 'util',
    startMs: Number(raw.startMs || 0),
    durationMs: Number(raw.durationMs || 0),
    status: (raw.status as TraceSpan['status']) || 'ok',
    input: raw.input as TraceSpan['input'],
    output: raw.output as TraceSpan['output'],
    attributes: raw.attributes as TraceSpan['attributes'],
    observationKind: raw.observationKind as TraceSpan['observationKind'],
    children: Array.isArray(raw.children)
      ? (raw.children as Record<string, unknown>[]).map(mapSpan)
      : undefined,
  };
}

function formatTraceTime(ts: number | string | undefined): string {
  if (!ts) return '';
  const n = typeof ts === 'number' ? ts : Date.parse(String(ts));
  if (!n || Number.isNaN(n)) return String(ts);
  return new Date(n).toISOString().replace('T', ' ').slice(0, 19);
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
  const status = t.status === 'success' ? 'success' : t.status === 'timeout' ? 'timeout' : 'error';
  return {
    id: t.id,
    traceId: t.traceId,
    query: t.query,
    user: t.userId,
    kb: t.kbId,
    kbId: t.kbId,
    durationMs: t.latencyMs,
    tokens: t.tokens || 0,
    cost: t.cost || 0,
    tier: t.routeTier || '',
    pipeline: t.pipeline || (t.channels || []).join(', '),
    status,
    time: formatTraceTime(t.timestamp),
    environment: 'production',
    convId: t.conversationId,
    sessionId: t.conversationId,
    layers: [],
    rootSpan: minimalRootSpan(t.latencyMs),
  };
}

export function mapTraceDetail(d: Record<string, unknown>): TraceRecord {
  const status = d.status === 'success' ? 'success' : d.status === 'timeout' ? 'timeout' : 'error';
  const rootRaw = d.rootSpan as Record<string, unknown> | undefined;
  return {
    id: String(d.id || d.traceId),
    traceId: String(d.traceId || d.id),
    query: String(d.query || ''),
    user: String(d.user || d.userId || ''),
    kb: String(d.kb || d.kbId || ''),
    kbId: String(d.kbId || ''),
    durationMs: Number(d.durationMs || d.latencyMs || 0),
    tokens: Number(d.tokens || (d.tokenUsage as { total?: number } | undefined)?.total || 0),
    cost: Number(d.cost || 0),
    tier: String(d.tier || d.routeTier || ''),
    pipeline: String(d.pipeline || ''),
    status,
    time: formatTraceTime(d.timestamp as number),
    environment: 'production',
    convId: String(d.convId || d.conversationId || ''),
    sessionId: String(d.sessionId || d.conversationId || ''),
    layers: (d.layers as TraceRecord['layers']) || [],
    rootSpan: rootRaw ? mapSpan(rootRaw) : minimalRootSpan(Number(d.durationMs || 0)),
    quality: d.quality as TraceRecord['quality'],
    eval: d.eval as TraceRecord['eval'],
    errorMessage: d.errorMessage as string | undefined,
  };
}

export function mapTraceSession(s: Record<string, unknown>): TraceSession {
  const last = s.lastActive as number | undefined;
  return {
    sessionId: String(s.sessionId || ''),
    user: String(s.user || ''),
    title: String(s.title || '未命名会话'),
    turns: Number(s.turns || 0),
    totalTokens: Number(s.totalTokens || 0),
    totalCost: Number(s.totalCost || 0),
    lastActive: last ? formatTraceTime(last) : '',
    traceIds: (s.traceIds as string[]) || [],
  };
}

export function mapTraceStats(s: TraceStatsApi) {
  return s;
}

export function getSessionTracesFromList(sessionId: string, traces: TraceRecord[]): TraceRecord[] {
  return traces.filter(t => t.sessionId === sessionId || t.convId === sessionId);
}
