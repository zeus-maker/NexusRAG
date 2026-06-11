import { useMemo, useState, useEffect } from 'react';
import {
  Route, Search, RefreshCw, ExternalLink, Download, Clock, User,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle, Timer,
  Filter, MessageSquare, GitBranch, Layers, Activity, DollarSign,
  MessagesSquare, UnfoldVertical, FoldVertical, Star, AlertTriangle,
} from 'lucide-react';
import { HubStatCard } from '../components/hubUi';
import { SystemSectionTabs } from '../components/SystemSubNav';
import {
  TRACE_RECORDS_EXPORT, TRACE_SESSIONS, TRACE_STATS, STAGE_P95_MS,
  SPAN_TYPE_COLORS, SPAN_TYPE_LABELS, OBSERVATION_KIND_COLORS,
  flattenSpans, filterTraces, getSessionTraces, logSpansChronological,
  type TraceRecord, type TraceSpan, type TraceStatus, type TraceSession, type TraceEnvironment,
} from '../data/tracesMock';
import { useTraces } from '../hooks/useSystemData';
import { useApiMode } from '../services/http';

interface TracesPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

const TIME_RANGES = ['最近1小时', '最近6小时', '最近24小时', '最近7天'] as const;
const DETAIL_TABS = ['概览', 'Span 树', '时间轴', '日志', 'JSON'] as const;
const TIER_OPTIONS = ['all', 'Tier1', 'Tier2', 'Tier3', 'Tier4'] as const;
const ENV_OPTIONS: Array<TraceEnvironment | 'all'> = ['all', 'production', 'staging', 'development'];

const STATUS_STYLE: Record<TraceStatus, { label: string; icon: React.ReactNode; badge: string }> = {
  success: { label: '成功', icon: <CheckCircle size={13} />, badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  error: { label: '失败', icon: <AlertCircle size={13} />, badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  timeout: { label: '超时', icon: <Timer size={13} />, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

const ENV_LABEL: Record<TraceEnvironment, string> = {
  production: 'prod',
  staging: 'staging',
  development: 'dev',
};

export function TracesPage({ onNavigate }: TracesPageProps) {
  const apiMode = useApiMode();
  const [search, setSearch] = useState('');
  const { data: apiTraces, refresh, loading, error } = useTraces(search);
  const traceSource = apiMode ? apiTraces : TRACE_RECORDS_EXPORT;
  const [selected, setSelected] = useState<TraceRecord>(traceSource[0] || TRACE_RECORDS_EXPORT[0]);
  const [selectedSession, setSelectedSession] = useState<TraceSession | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan>(TRACE_RECORDS_EXPORT[0].rootSpan);
  const [listMode, setListMode] = useState<'traces' | 'sessions'>('traces');
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('最近24小时');
  const [statusFilter, setStatusFilter] = useState<TraceStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState<TraceEnvironment | 'all'>('all');
  const [qualityAlertOnly, setQualityAlertOnly] = useState(false);
  const [detailTab, setDetailTab] = useState(0);
  const [treeExpandAll, setTreeExpandAll] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = useMemo(
    () => filterTraces(traceSource, {
      query: search.trim() || undefined,
      status: statusFilter,
      tier: tierFilter,
      environment: envFilter,
      qualityAlertOnly,
      sessionId: selectedSession?.sessionId,
    }),
    [traceSource, search, statusFilter, tierFilter, envFilter, qualityAlertOnly, selectedSession],
  );

  useEffect(() => {
    if (apiMode && traceSource.length && !traceSource.find(t => t.id === selected.id)) {
      setSelected(traceSource[0]);
      setSelectedSpan(traceSource[0].rootSpan);
    }
  }, [apiMode, traceSource, selected.id]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TRACE_SESSIONS.filter(s =>
      !q || s.title.toLowerCase().includes(q) || s.user.includes(q) || s.sessionId.includes(q),
    );
  }, [search]);

  const flatSpans = useMemo(() => flattenSpans(selected.rootSpan), [selected]);
  const logSpans = useMemo(() => logSpansChronological(selected.rootSpan), [selected]);

  const selectTrace = (tr: TraceRecord) => {
    setSelected(tr);
    setSelectedSpan(tr.rootSpan);
    setDetailTab(0);
    setListMode('traces');
  };

  const selectSession = (sess: TraceSession) => {
    setSelectedSession(sess);
    const traces = getSessionTraces(sess.sessionId);
    if (traces[0]) selectTrace(traces[0]);
    setListMode('sessions');
  };

  const handleRefresh = () => {
    if (apiMode) {
      refresh();
      showToast('Trace 列表已刷新');
      return;
    }
    showToast('Trace 列表已刷新（mock）');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Route size={20} className="text-blue-600" /> 链路追踪
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Langfuse Trace/Session · Phoenix 评测 · OTel RAG 语义（§11.5.3）
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={handleRefresh} className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <RefreshCw size={13} /> 刷新
          </button>
          <button type="button" onClick={() => showToast('已导出 OTLP JSON（mock）')} className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Download size={13} /> 导出
          </button>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as typeof timeRange)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none"
          >
            {TIME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <HubStatCard label="今日 Trace" value={TRACE_STATS.todayCount.toLocaleString()} icon={<Activity size={18} />} iconColor="#2563eb" />
        <HubStatCard label={`P95 · ${timeRange}`} value={`${(TRACE_STATS.p95Ms / 1000).toFixed(1)}s`} icon={<Timer size={18} />} iconColor="#d97706" />
        <HubStatCard label="错误率" value={`${TRACE_STATS.errorRate}%`} icon={<AlertCircle size={18} />} iconColor="#dc2626" />
        <HubStatCard label="空召回率" value={`${TRACE_STATS.emptyRetrievalRate}%`} icon={<AlertTriangle size={18} />} iconColor="#ea580c" />
        <HubStatCard label="上下文截断" value={`${TRACE_STATS.contextTruncateRate}%`} icon={<FoldVertical size={18} />} iconColor="#9333ea" />
        <HubStatCard label="今日成本" value={`¥${TRACE_STATS.totalCostToday}`} icon={<DollarSign size={18} />} iconColor="#7c3aed" />
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
          {(['traces', 'sessions'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => { setListMode(mode); if (mode === 'traces') setSelectedSession(null); }}
              className={`px-3 py-1.5 font-medium transition-colors ${
                listMode === mode ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {mode === 'traces' ? 'Trace' : 'Session'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={listMode === 'traces' ? '查询 / Trace ID / 用户' : '会话标题 / 用户'}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {listMode === 'traces' && (
          <>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TraceStatus | 'all')} className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800">
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="error">失败</option>
              <option value="timeout">超时</option>
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800">
              {TIER_OPTIONS.map(t => <option key={t} value={t}>{t === 'all' ? '全部 Tier' : t}</option>)}
            </select>
            <select value={envFilter} onChange={e => setEnvFilter(e.target.value as TraceEnvironment | 'all')} className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800">
              {ENV_OPTIONS.map(e => <option key={e} value={e}>{e === 'all' ? '全部环境' : ENV_LABEL[e]}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={qualityAlertOnly} onChange={e => setQualityAlertOnly(e.target.checked)} className="rounded" />
              质量告警
            </label>
          </>
        )}
        <span className="text-[10px] text-gray-400 ml-auto">
          {listMode === 'traces' ? `${filtered.length} traces` : `${filteredSessions.length} sessions`}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-2 min-h-0 max-h-[calc(100vh-360px)] overflow-y-auto">
          {listMode === 'sessions' ? (
            filteredSessions.length === 0 ? (
              <EmptyList message="无匹配 Session" />
            ) : filteredSessions.map(sess => (
              <SessionCard
                key={sess.sessionId}
                session={sess}
                selected={selectedSession?.sessionId === sess.sessionId}
                onClick={() => selectSession(sess)}
              />
            ))
          ) : filtered.length === 0 ? (
            <EmptyList message="无匹配 Trace" />
          ) : filtered.map(tr => (
            <TraceCard key={tr.id} trace={tr} selected={selected.id === tr.id} onClick={() => selectTrace(tr)} />
          ))}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <TraceDetailHeader trace={selected} session={selectedSession} onNavigate={onNavigate} showToast={showToast} />

          {selectedSession && listMode === 'sessions' && (
            <SessionThread session={selectedSession} traces={getSessionTraces(selectedSession.sessionId)} onSelectTrace={selectTrace} activeId={selected.id} />
          )}

          <SystemSectionTabs tabs={[...DETAIL_TABS]} activeTab={detailTab} onTabChange={setDetailTab} />

          {detailTab === 0 && <OverviewTab trace={selected} onNavigate={onNavigate} />}
          {detailTab === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto max-h-[500px]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Observation 树</h4>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setTreeExpandAll(true)} className="p-1 text-gray-400 hover:text-gray-600" title="全部展开"><UnfoldVertical size={14} /></button>
                    <button type="button" onClick={() => setTreeExpandAll(false)} className="p-1 text-gray-400 hover:text-gray-600" title="全部折叠"><FoldVertical size={14} /></button>
                  </div>
                </div>
                <SpanTree key={String(treeExpandAll)} span={selected.rootSpan} selectedId={selectedSpan.id} onSelect={setSelectedSpan} expandAll={treeExpandAll} />
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto max-h-[500px]">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Span 详情 — <span className="font-mono text-blue-600">{selectedSpan.name}</span>
                </h4>
                <SpanDetailPanel span={selectedSpan} />
              </div>
            </div>
          )}
          {detailTab === 2 && <WaterfallTab spans={flatSpans} totalMs={selected.durationMs} />}
          {detailTab === 3 && <LogViewTab spans={logSpans} />}
          {detailTab === 4 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-auto max-h-[500px]">
              <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{JSON.stringify(selected, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="p-8 text-center text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">{message}</div>
  );
}

function QualityBadges({ trace }: { trace: TraceRecord }) {
  const q = trace.quality;
  if (!q) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {q.emptyRetrieval && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">空召回</span>}
      {q.contextTruncated && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">上下文截断</span>}
      {q.topScore != null && q.topScore < 0.5 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">低相关 {q.topScore.toFixed(2)}</span>}
    </div>
  );
}

function TraceCard({ trace, selected, onClick }: { trace: TraceRecord; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 flex-1">{trace.query}</p>
        <span className={`flex-shrink-0 flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[trace.status].badge}`}>
          {STATUS_STYLE[trace.status].icon}{STATUS_STYLE[trace.status].label}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-500 mb-1">
        <span className="font-mono text-gray-400">{trace.traceId}</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{ENV_LABEL[trace.environment]}</span>
        <span className="px-1.5 py-0.5 rounded font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">{trace.tier}</span>
        {trace.eval?.faithfulness != null && (
          <span className="flex items-center gap-0.5 text-green-600"><Star size={9} /> {(trace.eval.faithfulness * 100).toFixed(0)}%</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><Clock size={11} /> {(trace.durationMs / 1000).toFixed(1)}s</span>
        <span>{trace.tokens > 0 ? `${trace.tokens.toLocaleString()} tok` : '—'}</span>
        <span className="flex items-center gap-1"><User size={11} /> {trace.user}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">{trace.pipeline}</span>
        <span className="text-[10px] text-gray-400">{trace.time}</span>
      </div>
      <QualityBadges trace={trace} />
    </button>
  );
}

function SessionCard({ session, selected, onClick }: { session: TraceSession; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        selected ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-2 mb-1">
        <MessagesSquare size={16} className="text-violet-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{session.title}</p>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{session.sessionId}</p>
        </div>
        {session.resolved != null && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${session.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {session.resolved ? '已解决' : '进行中'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-2 pl-6">
        <span>{session.turns} 轮</span>
        <span>{session.totalTokens.toLocaleString()} tok</span>
        <span>¥{session.totalCost.toFixed(2)}</span>
        {session.coherenceScore != null && <span>连贯性 {(session.coherenceScore * 100).toFixed(0)}%</span>}
        <span>{session.lastActive}</span>
      </div>
    </button>
  );
}

function SessionThread({ session, traces, onSelectTrace, activeId }: {
  session: TraceSession;
  traces: TraceRecord[];
  onSelectTrace: (t: TraceRecord) => void;
  activeId: string;
}) {
  return (
    <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-200 dark:border-violet-800 p-3">
      <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 mb-2">Session 回放 · {session.turns} 轮对话</p>
      <div className="space-y-2">
        {traces.map((tr, i) => (
          <button
            key={tr.id}
            type="button"
            onClick={() => onSelectTrace(tr)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              activeId === tr.id ? 'bg-white dark:bg-gray-900 border border-violet-300 shadow-sm' : 'bg-white/60 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900'
            }`}
          >
            <span className="text-[10px] text-violet-600 font-bold mr-2">#{i + 1}</span>
            <span className="text-gray-800 dark:text-gray-200">{tr.query}</span>
            <span className="text-gray-400 ml-2">{(tr.durationMs / 1000).toFixed(1)}s</span>
          </button>
        ))}
        {traces.length < session.turns && (
          <p className="text-[10px] text-gray-400 italic pl-3">… 另有 {session.turns - traces.length} 轮（mock 未展开）</p>
        )}
      </div>
    </div>
  );
}

function TraceDetailHeader({ trace, session, onNavigate, showToast }: {
  trace: TraceRecord;
  session: TraceSession | null;
  onNavigate?: TracesPageProps['onNavigate'];
  showToast: (m: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trace 详情</h3>
            <span className="font-mono text-xs text-gray-500">{trace.traceId}</span>
            <span className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[trace.status].badge}`}>
              {STATUS_STYLE[trace.status].icon} {STATUS_STYLE[trace.status].label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{ENV_LABEL[trace.environment]}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">「{trace.query}」</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-500">
            <span><User size={10} className="inline mr-0.5" />{trace.user}</span>
            <span>{trace.kb}</span>
            {session && <span className="text-violet-600">session: {session.sessionId}</span>}
            <span><Clock size={10} className="inline mr-0.5" />{(trace.durationMs / 1000).toFixed(2)}s</span>
            <span>{trace.tokens.toLocaleString()} tokens · ¥{trace.cost.toFixed(3)}</span>
          </div>
          {trace.errorMessage && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-start gap-1">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {trace.errorMessage}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button type="button" onClick={() => showToast('已在 Langfuse 打开（mock）')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-600">
            <ExternalLink size={12} /> Langfuse
          </button>
          {trace.convId && onNavigate && (
            <button type="button" onClick={() => onNavigate('chat', { selectedConvId: trace.convId })} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600">
              <MessageSquare size={12} /> 对话
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ trace, onNavigate }: { trace: TraceRecord; onNavigate?: TracesPageProps['onNavigate'] }) {
  const layerTotal = trace.layers.reduce((s, l) => s + l.ms, 0);
  const maxP95 = Math.max(...Object.values(STAGE_P95_MS));

  return (
    <div className="space-y-4">
      {trace.eval && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1"><Star size={12} className="text-amber-500" /> Phoenix 轨迹评测</h4>
          <div className="flex flex-wrap gap-4 text-xs mb-2">
            {trace.eval.faithfulness != null && <span>Faithfulness <strong className="text-green-600">{(trace.eval.faithfulness * 100).toFixed(0)}%</strong></span>}
            {trace.eval.answerRelevancy != null && <span>Relevancy <strong>{(trace.eval.answerRelevancy * 100).toFixed(0)}%</strong></span>}
            {trace.eval.coherence != null && <span>Coherence <strong>{(trace.eval.coherence * 100).toFixed(0)}%</strong></span>}
            {trace.eval.label && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{trace.eval.label}</span>}
          </div>
          {trace.eval.explanation && <p className="text-[10px] text-gray-500">{trace.eval.explanation}</p>}
        </div>
      )}

      {trace.quality && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">OTel RAG 质量信号</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
            {trace.quality.retrievalResultsCount != null && <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">rag.retrieval.results_count = {trace.quality.retrievalResultsCount}</div>}
            {trace.quality.rerankInputCount != null && <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">rag.reranking.input_count = {trace.quality.rerankInputCount}</div>}
            {trace.quality.rerankOutputCount != null && <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">rag.reranking.output_count = {trace.quality.rerankOutputCount}</div>}
            {trace.quality.topScore != null && <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">rag.retrieval.top_score = {trace.quality.topScore}</div>}
            {trace.quality.contextTokenCount != null && <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">rag.context.token_count = {trace.quality.contextTokenCount}</div>}
            {trace.quality.emptyRetrieval != null && <div className={`p-2 rounded ${trace.quality.emptyRetrieval ? 'bg-red-50 text-red-700' : 'bg-gray-50 dark:bg-gray-800'}`}>rag.retrieval.empty_result = {String(trace.quality.emptyRetrieval)}</div>}
            {trace.quality.contextTruncated != null && <div className={`p-2 rounded ${trace.quality.contextTruncated ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 dark:bg-gray-800'}`}>rag.context.truncated = {String(trace.quality.contextTruncated)}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">L1→L5 · {(trace.durationMs / 1000).toFixed(1)}s</h4>
          <div className="space-y-2">
            {trace.layers.map((layer, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-7 h-5 bg-indigo-600 text-white rounded flex items-center justify-center text-[9px] font-bold">{layer.layer}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{layer.label}</span>
                  <div className="mt-0.5 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (layer.ms / layerTotal) * 100 * 2)}%` }} />
                  </div>
                </div>
                <span className="text-gray-400 w-12 text-right text-[10px]">{layer.ms}ms</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">阶段 P95 基准（平台）</h4>
          <div className="space-y-2">
            {Object.entries(STAGE_P95_MS).map(([stage, ms]) => (
              <div key={stage} className="flex items-center gap-2 text-xs">
                <span className="w-7 text-[10px] font-bold text-gray-500">{stage}</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-amber-400 rounded" style={{ width: `${(ms / maxP95) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-12 text-right">{ms}ms</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-2">L3 检索与 L4 rerank 常为隐性瓶颈（OTel RAG 实践）</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {onNavigate && (
          <>
            <button type="button" onClick={() => onNavigate('sys-classifier')} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600">
              <GitBranch size={12} /> 查询路由
            </button>
            <button type="button" onClick={() => onNavigate('sys-fusion')} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600">
              <Layers size={12} /> 融合配置
            </button>
            <button type="button" onClick={() => onNavigate('kb-retrieval-test', { selectedKBId: trace.kbId })} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600">
              <Search size={12} /> 检索测试台
            </button>
            <button type="button" onClick={() => onNavigate('eval-replay')} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600">
              <RefreshCw size={12} /> 回放评测
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SpanTree({ span, selectedId, onSelect, depth = 0, expandAll = true }: {
  span: TraceSpan;
  selectedId: string;
  onSelect: (s: TraceSpan) => void;
  depth?: number;
  expandAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(expandAll || depth < 2);
  const hasChildren = (span.children?.length ?? 0) > 0;
  const isSelected = span.id === selectedId;

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => { onSelect(span); }}
        className={`w-full flex items-center gap-1.5 py-1 px-1 rounded text-left text-xs transition-colors ${
          isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
            onKeyDown={e => e.key === 'Enter' && setExpanded(p => !p)}
            className="flex-shrink-0"
          >
            {expanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
          </span>
        ) : <span className="w-3 flex-shrink-0" />}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SPAN_TYPE_COLORS[span.type]}`} />
        <span className="font-mono truncate flex-1">{span.name}</span>
        {span.observationKind && (
          <span className={`text-[8px] px-1 py-0.5 rounded flex-shrink-0 ${OBSERVATION_KIND_COLORS[span.observationKind]}`}>{span.observationKind}</span>
        )}
        <span className="text-[10px] text-gray-400 flex-shrink-0">{span.durationMs}ms</span>
        {span.status === 'error' && <AlertCircle size={11} className="text-red-500 flex-shrink-0" />}
      </button>
      {expanded && span.children?.map(child => (
        <SpanTree key={child.id} span={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} expandAll={expandAll} />
      ))}
    </div>
  );
}

function SpanDetailPanel({ span }: { span: TraceSpan }) {
  const rows: Array<{ k: string; v: string }> = [
    { k: 'duration', v: `${span.durationMs}ms` },
    { k: 'start_offset', v: `${span.startMs}ms` },
    { k: 'type', v: SPAN_TYPE_LABELS[span.type] },
    { k: 'status', v: span.status },
  ];
  if (span.observationKind) rows.push({ k: 'observation', v: span.observationKind });
  if (span.attributes) Object.entries(span.attributes).forEach(([k, v]) => rows.push({ k, v: String(v) }));

  return (
    <div className="space-y-3 text-xs">
      <dl className="space-y-1.5">
        {rows.map(r => (
          <div key={r.k} className="flex gap-2">
            <dt className="text-gray-400 w-28 flex-shrink-0 font-mono text-[10px]">{r.k}</dt>
            <dd className="text-gray-800 dark:text-gray-200 break-all">{r.v}</dd>
          </div>
        ))}
      </dl>
      {span.input && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 mb-1">input</p>
          <pre className="text-[10px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">{JSON.stringify(span.input, null, 2)}</pre>
        </div>
      )}
      {span.output && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 mb-1">output</p>
          <pre className="text-[10px] font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">{JSON.stringify(span.output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function WaterfallTab({ spans, totalMs }: { spans: Array<TraceSpan & { depth: number }>; totalMs: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-[10px] text-gray-500 mb-3">Gantt 时间轴（Langfuse Timeline）· 并行 Span 可重叠</p>
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(SPAN_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
            <div className={`w-2.5 h-2.5 rounded ${color}`} />
            {SPAN_TYPE_LABELS[type as keyof typeof SPAN_TYPE_LABELS]}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {spans.map(sp => {
          const leftPct = (sp.startMs / totalMs) * 100;
          const widthPct = Math.max((sp.durationMs / totalMs) * 100, 0.5);
          return (
            <div key={sp.id} className="flex items-center gap-2">
              <div className="text-[10px] text-gray-600 dark:text-gray-400 w-36 text-right flex-shrink-0 truncate font-mono" style={{ paddingLeft: sp.depth * 6 }}>
                {sp.name}
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded relative overflow-hidden">
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded ${SPAN_TYPE_COLORS[sp.type]} opacity-85`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${sp.startMs}ms + ${sp.durationMs}ms`}
                />
              </div>
              <div className="text-[10px] text-gray-500 w-14 flex-shrink-0 text-right">{sp.durationMs}ms</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">
        <span>0ms</span><span>{(totalMs / 2 / 1000).toFixed(1)}s</span><span>{(totalMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

function LogViewTab({ spans }: { spans: TraceSpan[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[500px] overflow-y-auto">
      <p className="text-[10px] text-gray-500 px-4 py-2 border-b border-gray-100 dark:border-gray-800">Log 视图（Langfuse）· 按时间序</p>
      <table className="w-full text-[10px]">
        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 font-medium">+offset</th>
            <th className="text-left px-3 py-2 font-medium">name</th>
            <th className="text-left px-3 py-2 font-medium">kind</th>
            <th className="text-right px-3 py-2 font-medium">dur</th>
            <th className="text-left px-3 py-2 font-medium">status</th>
          </tr>
        </thead>
        <tbody>
          {spans.map(sp => (
            <tr key={sp.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-3 py-1.5 font-mono text-gray-400">{sp.startMs}ms</td>
              <td className="px-3 py-1.5 font-mono text-gray-800 dark:text-gray-200">{sp.name}</td>
              <td className="px-3 py-1.5">
                {sp.observationKind && <span className={`px-1 py-0.5 rounded ${OBSERVATION_KIND_COLORS[sp.observationKind]}`}>{sp.observationKind}</span>}
              </td>
              <td className="px-3 py-1.5 text-right text-gray-500">{sp.durationMs}ms</td>
              <td className="px-3 py-1.5">{sp.status === 'error' ? <span className="text-red-600">error</span> : <span className="text-green-600">ok</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
