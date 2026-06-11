import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Zap, AlertCircle, Cpu, Plus, RefreshCw, Search, ExternalLink,
  DollarSign, Route, Bell, CheckCircle, TrendingUp, TrendingDown, Minus,
  Server, ChevronRight, X, Download, Clock, GitBranch, HardDrive,
} from 'lucide-react';
import { SystemSectionTabs, TableCard } from '../components/SystemSubNav';
import { HubBadge } from '../components/hubUi';
import { PIPELINE_DEFINITIONS, PIPELINE_STATUS_LABEL } from '../data/pipelineMock';
import { useMonitorDashboard } from '../hooks/useSystemData';
import { useApiMode } from '../services/http';
import {
  INFRA_METRICS, SERVICE_STATUSES, ALERT_RULES, RECENT_ALERTS, QPS_TREND_24H,
  PIPELINE_LATENCIES, KB_INDEX_AGGREGATE, INDEX_SUMMARY, COST_SNAPSHOT,
  MODEL_COST_SHARES, PIPELINE_COST_SHARES, ROUTE_STATS,
  RESOURCE_NODES, ERROR_RATE_TREND_24H, P95_LATENCY_TREND_24H,
  TIER_ROUTE_DISTRIBUTION, PIPELINE_ERRORS, QUERY_LAYER_STATS,
  COST_DAILY_TREND, COST_BY_KB, INDEX_ALERT_DETAILS,
  ALERT_METRIC_OPTIONS, NOTIFICATION_CHANNELS,
  type AlertRule, type ServiceHealth, type AlertLevel, type KBIndexAggregateRow,
} from '../data/monitorMock';

const TABS = ['基础设施', '流水线', 'RAG3索引', '成本'];
const TAB_META = [
  { title: '基础设施', desc: 'QPS、服务健康、资源节点与告警规则（§6.4.1）' },
  { title: '流水线', desc: 'P1–P5 延迟分布、Tier 路由与错误率（§6.4.3）' },
  { title: 'RAG3 索引', desc: '跨库 Wiki / PageIndex / 图谱进度巡检（§6.4.2）' },
  { title: '成本', desc: 'Token 消耗、预算进度与模型 / 知识库分布（§6.4.4）' },
];
const TIME_RANGES = ['1h', '6h', '24h', '7d'] as const;
const INDEX_FILTERS = ['all', 'wiki', 'pi', 'graph'] as const;
type IndexFilter = (typeof INDEX_FILTERS)[number];

const METRIC_ICONS = { activity: Activity, zap: Zap, alert: AlertCircle, cpu: Cpu };
const HEALTH_DOT: Record<ServiceHealth, string> = {
  healthy: 'bg-green-500', degraded: 'bg-amber-500', down: 'bg-red-500',
};
const LEVEL_STYLE: Record<AlertLevel, string> = {
  P0: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  P1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  P2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

interface MonitorPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
  initialTab?: number;
}

function ProgressMini({ done, total, alert }: { done: number; total: number; alert?: boolean }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-0.5 min-w-[72px]">
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${alert ? 'bg-red-500' : pct >= 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500">{done}/{total}</span>
    </div>
  );
}

export function MonitorPage({ onNavigate, initialTab = 0 }: MonitorPageProps) {
  const apiMode = useApiMode();
  const { data: monitor, refresh, error: monitorError } = useMonitorDashboard();
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  const [toast, setToast] = useState<string | null>(null);
  const [rules, setRules] = useState(ALERT_RULES);
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('24h');
  const [kbQuery, setKbQuery] = useState('');
  const [alertOnly, setAlertOnly] = useState(false);
  const [indexFilter, setIndexFilter] = useState<IndexFilter>('all');
  const [selectedKb, setSelectedKb] = useState<KBIndexAggregateRow | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [costPeriod, setCostPeriod] = useState('month');
  const [lastRefresh, setLastRefresh] = useState(INDEX_SUMMARY.lastUpdated);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleRefresh = () => {
    const now = new Date();
    setLastRefresh(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    if (apiMode) {
      refresh();
      showToast('监控数据已刷新');
      return;
    }
    showToast('监控数据已刷新（mock）');
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(handleRefresh, 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const unresolvedAlerts = RECENT_ALERTS.filter(a => !a.resolved);

  const filteredKBRows = useMemo(() => {
    return KB_INDEX_AGGREGATE.filter(row => {
      if (kbQuery && !row.kbName.includes(kbQuery)) return false;
      if (alertOnly && row.alertCount === 0) return false;
      if (indexFilter === 'wiki' && !(row.wiki.compiling || row.wiki.pendingReview)) return false;
      if (indexFilter === 'pi' && !row.pageindex.failed) return false;
      if (indexFilter === 'graph' && !(row.graph?.building)) return false;
      return true;
    });
  }, [kbQuery, alertOnly, indexFilter]);

  const maxQps = Math.max(...QPS_TREND_24H);
  const maxErr = Math.max(...ERROR_RATE_TREND_24H);
  const maxP95 = Math.max(...P95_LATENCY_TREND_24H);
  const maxDailyCost = Math.max(...COST_DAILY_TREND.map(d => d.cost));
  const budgetPct = (COST_SNAPSHOT.budgetUsed / COST_SNAPSHOT.budgetTotal) * 100;
  const pipelines = PIPELINE_LATENCIES[timeRange];

  const tabMeta = TAB_META[activeTab];

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 h-full min-h-0 min-w-0 w-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      {monitorError && apiMode && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-3 py-2">{monitorError}</div>
      )}

      {unresolvedAlerts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start sm:items-center gap-2 text-sm text-red-800 dark:text-red-300 min-w-0">
            <Bell size={16} className="flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="line-clamp-2 sm:line-clamp-none">
              <strong>{unresolvedAlerts.length}</strong> 条未恢复告警 · 最近：{unresolvedAlerts[0].message}
            </span>
          </div>
          <button type="button" onClick={() => setActiveTab(0)} className="text-xs text-red-700 dark:text-red-400 hover:underline flex-shrink-0">查看详情</button>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          系统监控
          {unresolvedAlerts.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded-full">{unresolvedAlerts.length}</span>
          )}
        </h1>
        <SystemSectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tabMeta.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{tabMeta.desc}</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto lg:flex-shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer px-2 py-1.5">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded text-blue-600" />
            自动刷新 30s
          </label>
          {onNavigate && (
            <>
              <button type="button" onClick={() => onNavigate('sys-traces')} className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 w-full sm:w-auto">
                链路追踪
              </button>
              <button type="button" onClick={() => onNavigate('sys-classifier')} className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 w-full sm:w-auto">
                查询路由
              </button>
            </>
          )}
          <button type="button" onClick={handleRefresh} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 w-full sm:w-auto">
            <RefreshCw size={14} /> 刷新
          </button>
        </div>
      </div>

      <div className="w-full min-w-0">
      {activeTab === 0 && (
        <InfraTab rules={rules} setRules={setRules} maxQps={maxQps} maxErr={maxErr} maxP95={maxP95}
          showToast={showToast} showAddRule={showAddRule} setShowAddRule={setShowAddRule} onNavigate={onNavigate}
          apiMode={apiMode} usage={monitor.usage} services={monitor.health.components} />
      )}
      {activeTab === 1 && (
        <PipelineTab pipelines={pipelines} timeRange={timeRange} setTimeRange={setTimeRange} onNavigate={onNavigate} />
      )}
      {activeTab === 2 && (
        <Rag3IndexTab
          rows={filteredKBRows} kbQuery={kbQuery} setKbQuery={setKbQuery}
          alertOnly={alertOnly} setAlertOnly={setAlertOnly}
          indexFilter={indexFilter} setIndexFilter={setIndexFilter}
          selectedKb={selectedKb} setSelectedKb={setSelectedKb}
          lastRefresh={lastRefresh} onRefresh={handleRefresh} onNavigate={onNavigate} showToast={showToast}
        />
      )}
      {activeTab === 3 && (
        <CostTab budgetPct={budgetPct} costPeriod={costPeriod} setCostPeriod={setCostPeriod}
          maxDailyCost={maxDailyCost} onNavigate={onNavigate} showToast={showToast} />
      )}
      </div>
    </div>
  );
}

function InfraTab({
  rules, setRules, maxQps, maxErr, maxP95, showToast, showAddRule, setShowAddRule, onNavigate,
  apiMode, usage, services,
}: {
  rules: AlertRule[];
  setRules: React.Dispatch<React.SetStateAction<AlertRule[]>>;
  maxQps: number; maxErr: number; maxP95: number;
  showToast: (m: string) => void;
  showAddRule: boolean;
  setShowAddRule: (v: boolean) => void;
  onNavigate?: MonitorPageProps['onNavigate'];
  apiMode?: boolean;
  usage?: { qps?: number; totalQueriesToday?: number; avgLatencyMs?: number; successRate?: number };
  services?: Array<{ name: string; status: string; latencyMs: number; message: string }>;
}) {
  const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const metrics = INFRA_METRICS.map((m, i) => {
    if (!apiMode || !usage) return m;
    if (i === 0) return { ...m, value: String(usage.qps ?? m.value) };
    if (i === 1) return { ...m, value: String(usage.totalQueriesToday ?? m.value) };
    if (i === 2) return { ...m, value: `${usage.avgLatencyMs ?? m.value}ms` };
    if (i === 3) return { ...m, value: `${usage.successRate ?? m.value}%` };
    return m;
  });

  const serviceList = apiMode && services?.length
    ? services.map(s => ({
        name: s.name,
        health: (s.status === 'healthy' ? 'healthy' : s.status === 'down' ? 'down' : 'degraded') as ServiceHealth,
        latency: `${s.latencyMs}ms`,
        detail: s.message || '—',
      }))
    : SERVICE_STATUSES;

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => {
          const Icon = METRIC_ICONS[m.icon];
          return (
            <div key={m.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Icon size={14} className="text-blue-600" /></div>
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${m.positive ? 'text-green-600' : 'text-amber-600'}`}>
                  {m.change.includes('+') ? <TrendingUp size={10} /> : m.change.includes('-') ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {m.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{m.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">QPS 趋势（近 24h）</h3>
          <div className="flex items-end gap-1 h-20">
            {QPS_TREND_24H.map((v, i) => (
              <div key={i} className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t opacity-80 hover:opacity-100" style={{ height: `${(v / maxQps) * 100}%`, minHeight: 4 }} title={`${v}/s`} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">错误率 %</p>
              <div className="flex items-end gap-0.5 h-12">
                {ERROR_RATE_TREND_24H.map((v, i) => (
                  <div key={i} className="flex-1 bg-red-400 rounded-t opacity-70" style={{ height: `${(v / maxErr) * 100}%`, minHeight: 2 }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">P95 延迟 s</p>
              <div className="flex items-end gap-0.5 h-12">
                {P95_LATENCY_TREND_24H.map((v, i) => (
                  <div key={i} className="flex-1 bg-amber-400 rounded-t opacity-70" style={{ height: `${(v / maxP95) * 100}%`, minHeight: 2 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Server size={14} /> 服务状态</h3>
          <div className="space-y-2">
            {serviceList.map(s => (
              <div key={s.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${HEALTH_DOT[s.health]}`} />{s.name}
                </span>
                {s.detail ? <span className="text-[10px] text-amber-600 pl-4 sm:pl-0">{s.detail}</span> : <span className="text-[10px] text-green-600 pl-4 sm:pl-0">正常</span>}
              </div>
            ))}
          </div>
          {onNavigate && (
            <button type="button" onClick={() => onNavigate('sys-traces')} className="mt-3 text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
              查看链路追踪 <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>

      <TableCard minWidth={640}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-3 py-2">节点</th><th className="px-3 py-2 hidden sm:table-cell">角色</th>
              <th className="px-3 py-2">CPU</th><th className="px-3 py-2">内存</th><th className="px-3 py-2">磁盘</th><th className="px-3 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {RESOURCE_NODES.map(n => (
              <tr key={n.name} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-mono text-gray-800 dark:text-gray-200">
                  <span className="block">{n.name}</span>
                  <span className="text-[10px] text-gray-400 sm:hidden">{n.role}</span>
                </td>
                <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{n.role}</td>
                {[{ v: n.cpuPct, c: 'bg-blue-500' }, { v: n.memPct, c: 'bg-purple-500' }, { v: n.diskPct, c: 'bg-amber-500' }].map((bar, i) => (
                  <td key={i} className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[80px]">
                        <div className={`h-full ${bar.c} rounded-full`} style={{ width: `${bar.v}%` }} />
                      </div>
                      <span className="text-[10px] w-8">{bar.v}%</span>
                    </div>
                  </td>
                ))}
                <td className="px-3 py-2"><span className={`w-2 h-2 inline-block rounded-full ${HEALTH_DOT[n.status]}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Bell size={14} /> 告警规则</h3>
            <button type="button" onClick={() => setShowAddRule(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={11} /> 添加</button>
          </div>
          {rules.map(rule => (
            <div key={rule.id} className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${!rule.enabled ? 'opacity-60' : ''}`}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${LEVEL_STYLE[rule.level]}`}>{rule.level}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{rule.condition}</div>
                <div className="text-[10px] text-gray-500">{rule.channel}</div>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <button type="button" onClick={() => toggleRule(rule.id)} className={`text-[10px] px-2 py-0.5 rounded ${rule.enabled ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 bg-gray-100 dark:bg-gray-800'}`}>
                  {rule.enabled ? '已启用' : '已禁用'}
                </button>
                <button type="button" onClick={() => showToast('编辑规则（mock）')} className="text-[10px] px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-gray-600">编辑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">最近告警</h3>
          <div className="space-y-2">
            {RECENT_ALERTS.map(a => (
              <div key={a.id} className={`flex items-start gap-2 p-2.5 rounded-lg ${a.resolved ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${LEVEL_STYLE[a.level]}`}>{a.level}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${a.resolved ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{a.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}{a.resolved ? ' · 已恢复' : ''}</p>
                </div>
                {!a.resolved && (
                  <button type="button" onClick={() => showToast('已标记为已恢复（mock）')} className="text-[10px] text-blue-600 hover:underline flex-shrink-0">恢复</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddRule && (
        <AddAlertRuleModal
          onClose={() => setShowAddRule(false)}
          onSave={(rule) => { setRules(prev => [...prev, rule]); setShowAddRule(false); showToast('告警规则已添加'); }}
        />
      )}
    </div>
  );
}

function AddAlertRuleModal({ onClose, onSave }: { onClose: () => void; onSave: (rule: AlertRule) => void }) {
  const [metric, setMetric] = useState(ALERT_METRIC_OPTIONS[0]);
  const [threshold, setThreshold] = useState('');
  const [level, setLevel] = useState<AlertLevel>('P2');
  const [channels, setChannels] = useState<string[]>(['企业微信']);

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSave = () => {
    if (!threshold.trim()) return;
    onSave({
      id: `ar-${Date.now()}`,
      level,
      condition: `${metric} ${threshold}`,
      channel: channels.join(' + ') || '企业微信',
      enabled: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">添加告警规则</h2>
          <button type="button" onClick={onClose} className="text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">告警指标</label>
            <select value={metric} onChange={e => setMetric(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
              {ALERT_METRIC_OPTIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">阈值条件</label>
            <input value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="如 > 10s 或 下降 30%" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">告警级别</label>
            <div className="flex gap-2">
              {(['P0', 'P1', 'P2'] as AlertLevel[]).map(l => (
                <button key={l} type="button" onClick={() => setLevel(l)} className={`px-3 py-1.5 text-xs rounded-lg border ${level === l ? LEVEL_STYLE[l] + ' border-current' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">通知方式</label>
            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_CHANNELS.map(ch => (
                <button key={ch} type="button" onClick={() => toggleChannel(ch)} className={`text-[10px] px-2 py-1 rounded-lg border ${channels.includes(ch) ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>{ch}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存规则</button>
        </div>
      </div>
    </div>
  );
}

function PipelineTab({
  pipelines, timeRange, setTimeRange, onNavigate,
}: {
  pipelines: typeof PIPELINE_LATENCIES['24h'];
  timeRange: (typeof TIME_RANGES)[number];
  setTimeRange: (t: (typeof TIME_RANGES)[number]) => void;
  onNavigate?: MonitorPageProps['onNavigate'];
}) {
  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
        {PIPELINE_DEFINITIONS.map(p => {
          const sc = PIPELINE_STATUS_LABEL[p.status];
          return (
            <div key={p.key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-sm">{p.icon}</span>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{p.key}</span>
                <HubBadge variant={sc.variant}>{sc.label}</HubBadge>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full ${p.health >= 90 ? 'bg-green-500' : p.health >= 70 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${p.health}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 truncate">{p.health}% · {p.avgLatencyMs}ms</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: '路由成功率', value: `${ROUTE_STATS.successRate}%`, sub: '近 24h' },
          { label: '软路由触发', value: `${ROUTE_STATS.softRoutingPct}%`, sub: '主辅并行' },
          { label: '融合层延迟', value: `${ROUTE_STATS.fusionAvgMs}ms`, sub: 'L4 平均' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{s.label}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Adaptive RAG Tier 分布</h3>
          <div className="space-y-2">
            {TIER_ROUTE_DISTRIBUTION.map(t => (
              <div key={t.tier} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 dark:text-gray-400 w-24">{t.tier}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-8">{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">L1–L5 链路延迟</h3>
          <div className="space-y-2">
            {QUERY_LAYER_STATS.map(l => (
              <div key={l.layer} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs">
                <span className="text-gray-700 dark:text-gray-300">{l.layer}</span>
                <span className="text-gray-500 text-[10px] sm:text-xs">avg {l.avgMs}ms · P95 {l.p95Ms}ms</span>
              </div>
            ))}
          </div>
          {onNavigate && (
            <button type="button" onClick={() => onNavigate('sys-classifier')} className="mt-3 text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
              查询路由配置 <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">流水线延迟分布</h3>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_RANGES.map(t => (
              <button key={t} type="button" onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 text-[10px] rounded-lg ${timeRange === t ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t}</button>
            ))}
            {onNavigate && (
              <button type="button" onClick={() => onNavigate('sys-pipeline')} className="text-[10px] px-2 py-1 text-blue-600 hover:underline flex items-center gap-0.5">
                <GitBranch size={10} /> 流水线配置
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {pipelines.map(p => (
            <div key={p.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400 w-full sm:w-28 flex-shrink-0">{p.name}</span>
              <div className="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${Math.min(p.pct, 100)}%` }} />
              </div>
              <div className="flex gap-3 text-[10px] text-gray-500 flex-shrink-0">
                <span>avg {p.avgMs}ms</span><span>P95 {p.p95Ms}ms</span>
                <span className="hidden md:inline">{p.calls24h.toLocaleString()} 调用</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TableCard minWidth={560}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-3 py-2">流水线</th><th className="px-3 py-2">错误率</th><th className="px-3 py-2">超时率</th><th className="px-3 py-2">最近事件</th>
            </tr>
          </thead>
          <tbody>
            {PIPELINE_ERRORS.map(e => (
              <tr key={e.key} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-medium">{e.name}</td>
                <td className={`px-3 py-2 ${e.errorRate > 0.3 ? 'text-red-600' : 'text-gray-600'}`}>{(e.errorRate * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-gray-600">{(e.timeoutRate * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-gray-500">{e.lastIncident}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

function Rag3IndexTab({
  rows, kbQuery, setKbQuery, alertOnly, setAlertOnly, indexFilter, setIndexFilter,
  selectedKb, setSelectedKb, lastRefresh, onRefresh, onNavigate, showToast,
}: {
  rows: KBIndexAggregateRow[];
  kbQuery: string; setKbQuery: (q: string) => void;
  alertOnly: boolean; setAlertOnly: (v: boolean) => void;
  indexFilter: IndexFilter; setIndexFilter: (f: IndexFilter) => void;
  selectedKb: KBIndexAggregateRow | null;
  setSelectedKb: (r: KBIndexAggregateRow | null) => void;
  lastRefresh: string; onRefresh: () => void;
  onNavigate?: MonitorPageProps['onNavigate'];
  showToast: (m: string) => void;
}) {
  const kbAlerts = selectedKb ? INDEX_ALERT_DETAILS.filter(a => a.kbId === selectedKb.kbId) : [];

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Wiki 编译中', value: INDEX_SUMMARY.wikiCompiling, filter: 'wiki' as IndexFilter },
          { label: '待审核', value: INDEX_SUMMARY.wikiPendingReview, filter: 'all' as IndexFilter },
          { label: 'PI 失败', value: INDEX_SUMMARY.pageindexFailed, filter: 'pi' as IndexFilter },
          { label: '图谱构建', value: INDEX_SUMMARY.graphBuilding, filter: 'graph' as IndexFilter },
        ].map(c => (
          <button
            key={c.label}
            type="button"
            onClick={() => { setIndexFilter(c.filter === 'all' ? 'all' : c.filter); setAlertOnly(c.filter !== 'all'); }}
            className={`bg-white dark:bg-gray-900 rounded-xl border p-3 text-left transition-colors ${
              indexFilter === c.filter && c.filter !== 'all' ? 'border-violet-400 ring-1 ring-violet-200 dark:ring-violet-800' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
            }`}
          >
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{c.value}</div>
            <div className="text-[10px] text-gray-500">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={kbQuery} onChange={e => setKbQuery(e.target.value)} placeholder="搜索知识库…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" />
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <select value={alertOnly ? 'alert' : 'all'} onChange={e => setAlertOnly(e.target.value === 'alert')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 w-full sm:w-auto">
            <option value="all">全部知识库</option>
            <option value="alert">仅告警</option>
          </select>
          <button type="button" onClick={onRefresh} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 w-full sm:w-auto">
            <RefreshCw size={14} /> 刷新
          </button>
          <span className="text-xs text-gray-400 flex items-center gap-1 sm:ml-auto"><Clock size={12} /> 上次更新 {lastRefresh}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        <div className="lg:col-span-3 min-w-0">
          <TableCard minWidth={680}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-3 py-2">知识库</th><th className="px-3 py-2">Wiki</th><th className="px-3 py-2 hidden md:table-cell">PageIndex</th>
                  <th className="px-3 py-2 hidden lg:table-cell">图谱</th><th className="px-3 py-2">告警</th><th className="px-3 py-2 hidden sm:table-cell">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">无匹配知识库</td></tr>
                ) : rows.map(row => (
                  <tr
                    key={row.kbId}
                    onClick={() => setSelectedKb(row)}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${selectedKb?.kbId === row.kbId ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-gray-100 max-w-[140px] sm:max-w-none">
                      <span className="block truncate">{row.kbName}</span>
                      <span className="text-[9px] text-gray-400 md:hidden">
                        PI {row.pageindex.done}/{row.pageindex.total}
                        {row.pageindex.failed ? ` · 失败${row.pageindex.failed}` : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <ProgressMini done={row.wiki.done} total={row.wiki.total} alert={!!(row.wiki.compiling || row.wiki.pendingReview)} />
                      {(row.wiki.compiling || row.wiki.pendingReview) && (
                        <span className="text-[9px] text-amber-600 block mt-0.5">
                          {row.wiki.compiling ? `编译 ${row.wiki.compiling}` : ''}{row.wiki.pendingReview ? ` 待审 ${row.wiki.pendingReview}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <ProgressMini done={row.pageindex.done} total={row.pageindex.total} alert={!!row.pageindex.failed} />
                      {row.pageindex.failed && <span className="text-[9px] text-red-600 block mt-0.5">失败 {row.pageindex.failed}</span>}
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {row.graph ? (
                        <>
                          <ProgressMini done={row.graph.done} total={row.graph.total} alert={!!row.graph.building} />
                          {row.graph.building && <span className="text-[9px] text-orange-600 block mt-0.5">构建 {row.graph.building}</span>}
                        </>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.alertCount > 0 ? (
                        <span className="text-red-600 font-medium">{row.alertCount}</span>
                      ) : <CheckCircle size={12} className="text-green-500" />}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => onNavigate?.('kb-detail', { selectedKBId: row.kbId })} className="text-[10px] text-blue-600 hover:underline">进入库</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:sticky lg:top-0 lg:self-start">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 truncate">
            {selectedKb ? `${selectedKb.kbName} · 告警详情` : '选择知识库查看告警'}
          </h3>
          {selectedKb ? (
            <div className="space-y-2">
              {kbAlerts.length === 0 ? (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> 无活跃告警</p>
              ) : kbAlerts.map(a => (
                <div key={a.type} className="p-2.5 border border-gray-100 dark:border-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{a.title} <span className="text-red-600">×{a.count}</span></p>
                  {onNavigate && (
                    <button type="button" onClick={() => onNavigate(a.deepLinkPage, { selectedKBId: a.kbId })} className="text-[10px] text-blue-600 hover:underline mt-1">
                      {a.deepLinkLabel} →
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => showToast('已批量标记处理（mock）')} className="w-full mt-2 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                批量处理告警
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">点击左侧表格行查看 Wiki / PageIndex / 图谱告警及深链入口。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CostTab({
  budgetPct, costPeriod, setCostPeriod, maxDailyCost, onNavigate, showToast,
}: {
  budgetPct: number;
  costPeriod: string;
  setCostPeriod: (p: string) => void;
  maxDailyCost: number;
  onNavigate?: MonitorPageProps['onNavigate'];
  showToast: (m: string) => void;
}) {
  const c = COST_SNAPSHOT;

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <select value={costPeriod} onChange={e => setCostPeriod(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 w-full sm:w-auto">
          <option value="month">本月</option>
          <option value="week">近 7 天</option>
          <option value="day">今日</option>
        </select>
        <button type="button" onClick={() => showToast('成本报表已导出（mock）')} className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 w-full sm:w-auto sm:ml-auto">
          <Download size={13} /> 导出
        </button>
      </div>

      {budgetPct >= 65 && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
          budgetPct >= 85 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
            <AlertCircle size={16} className={budgetPct >= 85 ? 'text-red-600' : 'text-amber-600'} />
            月度预算已用 <strong>{budgetPct.toFixed(0)}%</strong>（{c.currency}{c.budgetUsed}/{c.budgetTotal}）
          </div>
          <button type="button" className="text-xs text-blue-600 hover:underline">调整预算</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500">今日 Token</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{c.todayTokens}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{c.currency}{c.todayCost}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500">本月 Token</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{c.monthTokens}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{c.currency}{c.monthCost}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-2">预算进度</p>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${budgetPct >= 85 ? 'bg-red-500' : budgetPct >= 65 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${budgetPct}%` }} />
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">{budgetPct.toFixed(0)}% 已用</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">近 7 日成本趋势</h3>
        <div className="flex items-end gap-2 h-24">
          {COST_DAILY_TREND.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-green-500 dark:bg-green-600 rounded-t opacity-80" style={{ height: `${(d.cost / maxDailyCost) * 100}%`, minHeight: 4 }} title={`¥${d.cost}`} />
              <span className="text-[9px] text-gray-400">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><DollarSign size={14} /> 模型分布</h3>
          <div className="space-y-2">
            {MODEL_COST_SHARES.map(m => (
              <div key={m.model} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 dark:text-gray-400 w-24 truncate">{m.model}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-8">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><HardDrive size={14} /> 知识库成本 Top5</h3>
          <div className="space-y-2">
            {COST_BY_KB.map((kb, i) => (
              <div key={kb.kbId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  <span className="text-gray-400 mr-1">#{i + 1}</span>{kb.kbName}
                </span>
                <span className="text-gray-500 flex-shrink-0">{c.currency}{kb.cost} · {kb.queries.toLocaleString()} 查询</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-0 md:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Route size={14} /> 流水线成本占比</h3>
          <div className="space-y-2">
            {PIPELINE_COST_SHARES.map(p => (
              <div key={p.pipeline} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs">
                <span className="text-gray-700 dark:text-gray-300">{p.pipeline}</span>
                <span className="text-gray-500">{p.pct}% · {c.currency}{p.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onNavigate && (
        <button type="button" onClick={() => onNavigate('eval-cost')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <ExternalLink size={14} /> 打开评测中心 · 成本分析
        </button>
      )}
    </div>
  );
}

export default MonitorPage;
