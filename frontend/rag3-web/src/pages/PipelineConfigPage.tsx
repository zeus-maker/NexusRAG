import { useState, useMemo, useEffect } from 'react';
import {
  GitBranch, Settings, Route, Cpu, Play, Plus, RefreshCw,
  ChevronDown, ChevronRight, Zap, Activity, DollarSign, ExternalLink,
  CheckCircle, AlertCircle, Pause, Save, Eye,
} from 'lucide-react';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../components/hubUi';
import { SystemSubNav, SystemSectionTabs, TableCard } from '../components/SystemSubNav';
import {
  PIPELINE_DEFINITIONS, DEFAULT_ROUTING_RULES, DEFAULT_MODEL_CONFIG, PIPELINE_GLOBAL_SETTINGS,
  PIPELINE_STATS, PIPELINE_STATUS_LABEL, FUSION_STRATEGY_LABEL,
  EMBEDDING_OPTIONS, LLM_OPTIONS, RERANKER_OPTIONS, runMockRoutePreview,
  type PipelineDefinition, type PipelineStatus, type RoutingRule, type PipelineModelConfig,
  type FusionStrategy, type RoutePreviewResult,
} from '../data/pipelineMock';
import { usePipelineConfig, systemService } from '../hooks/useSystemData';
import { useApiMode } from '../services/http';

interface PipelineConfigPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

const TABS = ['概览', '五大流水线', '路由规则', '模型与融合', '全局设置'];

export function PipelineConfigPage({ onNavigate }: PipelineConfigPageProps) {
  const apiMode = useApiMode();
  const { data: apiConfig, loading, error, refresh } = usePipelineConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pipelines, setPipelines] = useState(PIPELINE_DEFINITIONS);
  const [rules, setRules] = useState(DEFAULT_ROUTING_RULES);
  const [models, setModels] = useState(DEFAULT_MODEL_CONFIG);
  const [globalSettings, setGlobalSettings] = useState(PIPELINE_GLOBAL_SETTINGS);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>('P2');

  useEffect(() => {
    if (apiMode && apiConfig?.definitions?.length) {
      setPipelines(apiConfig.definitions);
      setRules(apiConfig.routingRules || DEFAULT_ROUTING_RULES);
      setModels(apiConfig.modelConfig || DEFAULT_MODEL_CONFIG);
      setGlobalSettings({ ...PIPELINE_GLOBAL_SETTINGS, ...(apiConfig.globalSettings as typeof PIPELINE_GLOBAL_SETTINGS) });
    }
  }, [apiMode, apiConfig]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async () => {
    if (apiMode) {
      try {
        await systemService.putPipelineConfig({
          definitions: pipelines,
          routingRules: rules,
          modelConfig: models,
          globalSettings,
        });
        refresh();
        showToast('流水线配置已保存');
      } catch (e) {
        showToast((e as Error).message || '保存失败');
      }
      return;
    }
    showToast('流水线配置已保存');
  };

  const setPipelineStatus = (key: string, status: PipelineStatus) => {
    setPipelines(prev => prev.map(p => p.key === key ? { ...p, status } : p));
    showToast(`${key} 已设为${PIPELINE_STATUS_LABEL[status].label}`);
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">系统管理</h1>
        {onNavigate && <SystemSubNav currentPage="sys-pipeline" onNavigate={onNavigate} />}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GitBranch size={18} className="text-blue-600" /> 流水线配置
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">五大 RAG 流水线开关 · 分类器路由规则 · 模型与融合策略（§6.2）</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => showToast('配置已重置为默认（mock）')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <RefreshCw size={14} /> 重置
          </button>
          <button type="button" onClick={handleSave} disabled={loading && apiMode} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> 保存配置
          </button>
        </div>
      </div>

      <SystemSectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 0 && <OverviewTab pipelines={pipelines} onNavigate={onNavigate} />}
      {activeTab === 1 && (
        <PipelinesTab
          pipelines={pipelines}
          expanded={expandedPipeline}
          onExpand={setExpandedPipeline}
          onStatusChange={setPipelineStatus}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}
      {activeTab === 2 && (
        <RoutingTab rules={rules} setRules={setRules} showToast={showToast} apiMode={apiMode} />
      )}
      {activeTab === 3 && (
        <ModelsTab models={models} setModels={setModels} showToast={showToast} />
      )}
      {activeTab === 4 && (
        <GlobalSettingsTab settings={globalSettings} setSettings={setGlobalSettings} showToast={showToast} />
      )}
    </div>
  );
}

function OverviewTab({ pipelines, onNavigate }: { pipelines: PipelineDefinition[]; onNavigate?: PipelineConfigPageProps['onNavigate'] }) {
  const maxWeekly = Math.max(...PIPELINE_STATS.weeklyRoutes);

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="启用流水线" value={`${PIPELINE_STATS.activeCount}/5`} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="今日路由决策" value={PIPELINE_STATS.todayRoutes.toLocaleString()} icon={<Route size={18} className="text-blue-500" />} />
        <HubStatCard label="路由成功率" value={`${PIPELINE_STATS.routeSuccessRate}%`} icon={<Activity size={18} className="text-cyan-600" />} />
        <HubStatCard label="融合层延迟" value={`${PIPELINE_STATS.avgFusionMs}ms`} icon={<Zap size={18} className="text-amber-500" />} />
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">五大流水线健康度</h3>
        <div className="space-y-3">
          {pipelines.map(p => {
            const sc = PIPELINE_STATUS_LABEL[p.status];
            return (
              <div key={p.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg w-6 flex-shrink-0">{p.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 sm:w-28 flex-shrink-0 truncate">{p.shortName}</span>
                  <div className="flex-1 min-w-0 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.health >= 90 ? 'bg-green-500' : p.health >= 70 ? 'bg-amber-500' : p.health > 0 ? 'bg-red-400' : 'bg-gray-300'}`}
                      style={{ width: `${p.health}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pl-8 sm:pl-0">
                  <HubBadge variant={sc.variant}>{sc.label}</HubBadge>
                  <span className="text-[10px] text-gray-400">{p.avgLatencyMs}ms</span>
                  {p.hubPage && onNavigate && (
                    <button type="button" onClick={() => onNavigate(p.hubPage!)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                      <ExternalLink size={10} /> Hub
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">路由决策流（L2）</h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 font-mono bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p>查询 → <span className="text-blue-600">意图分类器</span> → <span className="text-blue-600">复杂度 Tier</span></p>
            <p>     → <span className="text-blue-600">文档类型</span> + <span className="text-blue-600">安全分级</span></p>
            <p>     → <span className="text-purple-600 font-semibold">[路由决策]</span> → 主通道 + 辅通道</p>
            <p>     → <span className="text-amber-600">融合层 §11.8</span> → 生成</p>
          </div>
        </div>
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">近 7 日路由量</h3>
          <div className="flex items-end gap-1 h-20">
            {PIPELINE_STATS.weeklyRoutes.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${(v / maxWeekly) * 100}%`, minHeight: 4 }} />
                <span className="text-[9px] text-gray-400">{(v / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelinesTab({
  pipelines, expanded, onExpand, onStatusChange, onNavigate, showToast,
}: {
  pipelines: PipelineDefinition[];
  expanded: string | null;
  onExpand: (k: string | null) => void;
  onStatusChange: (key: string, status: PipelineStatus) => void;
  onNavigate?: PipelineConfigPageProps['onNavigate'];
  showToast: (m: string) => void;
}) {
  return (
    <div className="space-y-3 w-full min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        启用 / 仅索引 / 禁用 三态开关。仅索引时参与入库但不作为检索主通道；禁用则跳过建索引与检索。
      </p>
      {pipelines.map(p => {
        const sc = PIPELINE_STATUS_LABEL[p.status];
        const isOpen = expanded === p.key;
        return (
          <div key={p.key} className={`${hubCard} overflow-hidden`}>
            <div className="px-3 sm:px-4 py-3 flex flex-col gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.status !== 'disabled' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                  {p.key}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                    <HubBadge variant={sc.variant}>{sc.label}</HubBadge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 sm:truncate">{p.desc}</p>
                </div>
                <button type="button" onClick={() => onExpand(isOpen ? null : p.key)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 sm:hidden">
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 sm:hidden pl-12">
                <span>{p.indexed}/{p.total || '—'} 索引</span>
                <span>avg {p.avgLatencyMs}ms</span>
                <span>{p.dailyCalls.toLocaleString()} 调用/日</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-12 sm:pl-0">
                <div className="hidden sm:flex items-center gap-4 text-[10px] text-gray-400">
                  <span>{p.indexed}/{p.total || '—'} 索引</span>
                  <span>avg {p.avgLatencyMs}ms</span>
                  <span>{p.dailyCalls.toLocaleString()} 调用/日</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {(['active', 'index_only', 'disabled'] as PipelineStatus[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatusChange(p.key, s)}
                      className={`text-[10px] px-2 py-1 rounded-lg border ${
                        p.status === s ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {PIPELINE_STATUS_LABEL[s].label}
                    </button>
                  ))}
                  <button type="button" onClick={() => onExpand(isOpen ? null : p.key)} className="p-1 text-gray-400 hover:text-gray-600 hidden sm:block">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 pb-2">
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.health >= 90 ? 'bg-green-500' : p.health >= 70 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${p.health}%` }} />
              </div>
            </div>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {p.stages.map((s, i) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      {s}{i < p.stages.length - 1 ? ' →' : ''}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { l: '健康度', v: `${p.health}%` },
                    { l: 'P95 延迟', v: `${p.p95LatencyMs}ms` },
                    { l: '成本/1k', v: `¥${p.costPer1k}` },
                    { l: '日调用', v: p.dailyCalls.toLocaleString() },
                  ].map(item => (
                    <div key={item.l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.v}</div>
                      <div className="text-[10px] text-gray-500">{item.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {p.hubPage && onNavigate && (
                    <BtnSecondary onClick={() => onNavigate(p.hubPage!)}>
                      <ExternalLink size={12} /> 进入 {p.shortName} Hub
                    </BtnSecondary>
                  )}
                  <BtnSecondary onClick={() => showToast(`${p.key} 参数面板（mock）`)}>
                    <Settings size={12} /> 高级配置
                  </BtnSecondary>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoutingTab({
  rules, setRules, showToast, apiMode,
}: {
  rules: RoutingRule[];
  setRules: React.Dispatch<React.SetStateAction<RoutingRule[]>>;
  showToast: (m: string) => void;
  apiMode: boolean;
}) {
  const [testQuery, setTestQuery] = useState('违约金如何计算');
  const [preview, setPreview] = useState<RoutePreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const enabledRules = useMemo(() => rules.filter(r => r.enabled), [rules]);

  const runPreview = async () => {
    setPreviewing(true);
    setPreview(null);
    if (apiMode) {
      try {
        const { data } = await systemService.classifierPreview({ query: testQuery });
        setPreview(data as RoutePreviewResult);
      } catch (e) {
        showToast((e as Error).message || '预览失败');
      }
      setPreviewing(false);
      return;
    }
    setTimeout(() => {
      setPreview(runMockRoutePreview(testQuery));
      setPreviewing(false);
    }, 700);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className={`${hubCard} p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
          <Route size={14} className="text-blue-600" /> 路由规则可视化
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
          {['查询复杂度 Tier', '文档类型', '用户意图', '安全分级'].map(dim => (
            <div key={dim} className="px-2 py-1.5 bg-white/60 dark:bg-gray-900/40 rounded-lg text-center border border-blue-100 dark:border-blue-900">
              {dim}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">↓ 路由决策引擎 ↓ 主通道 + 辅通道 → 融合策略（§11.8）</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">规则列表（{enabledRules.length} 条启用）</h3>
        <BtnSecondary onClick={() => showToast('添加规则（mock）')}>
          <Plus size={12} /> 添加规则
        </BtnSecondary>
      </div>

      <TableCard minWidth={880}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
              <th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">文档类型</th>
              <th className="px-3 py-2">意图</th>
              <th className="px-3 py-2">安全</th>
              <th className="px-3 py-2">主通道</th>
              <th className="px-3 py-2">辅通道</th>
              <th className="px-3 py-2">融合</th>
              <th className="px-3 py-2">7日命中</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className={`border-b border-gray-50 dark:border-gray-800/50 ${!rule.enabled ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200">{rule.tier}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{rule.docType}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{rule.intent}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{rule.security}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {rule.primary.map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {rule.secondary.length ? rule.secondary.map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{c}</span>
                    )) : <span className="text-gray-300">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-[10px] text-gray-500">{FUSION_STRATEGY_LABEL[rule.fusion]}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{rule.hitCount7d || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => toggleRule(rule.id)} className="text-[10px] text-blue-600 hover:underline">
                      {rule.enabled ? '禁用' : '启用'}
                    </button>
                    <button type="button" onClick={() => showToast('编辑规则（mock）')} className="text-[10px] text-gray-500 hover:underline">编辑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <div className={`${hubCard} dark:bg-gray-900 dark:border-gray-700 p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Eye size={14} className="text-cyan-600" /> 路由效果预览
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            placeholder="输入测试查询…"
            className={`${hubInput} flex-1 min-w-[200px]`}
            onKeyDown={e => e.key === 'Enter' && runPreview()}
          />
          <BtnPrimary onClick={runPreview} disabled={previewing}>
            {previewing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {previewing ? '路由中' : '预览路由'}
          </BtnPrimary>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.keys({ '违约金如何计算': 1, 'AMD收购Xilinx对供应链的影响': 1 }).map(q => (
            <button key={q} type="button" onClick={() => setTestQuery(q)} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-blue-50">
              {q.length > 20 ? `${q.slice(0, 18)}…` : q}
            </button>
          ))}
        </div>
        {preview && (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-white/70 rounded">{preview.tier}</span>
              <span className="px-2 py-0.5 bg-white/70 rounded">{preview.docType}</span>
              <span className="px-2 py-0.5 bg-white/70 rounded">{preview.intent}</span>
              <span className="px-2 py-0.5 bg-white/70 rounded">{preview.security}</span>
            </div>
            <p><strong>主通道：</strong>{preview.primary.join(' + ')}</p>
            {preview.secondary.length > 0 && <p><strong>辅通道：</strong>{preview.secondary.join(' + ')}</p>}
            <p><strong>融合：</strong>{FUSION_STRATEGY_LABEL[preview.fusion]} · 置信度 {(preview.confidence * 100).toFixed(0)}% · 预估 {preview.estLatencyMs}ms</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelsTab({
  models, setModels, showToast,
}: {
  models: PipelineModelConfig;
  setModels: React.Dispatch<React.SetStateAction<PipelineModelConfig>>;
  showToast: (m: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
      <div className={`${hubCard} p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-blue-600" /> 模型配置
        </h3>
        <div className="space-y-4">
          {[
            { key: 'embedding' as const, label: '嵌入模型', options: EMBEDDING_OPTIONS },
            { key: 'llm' as const, label: 'LLM 模型（生成/建树）', options: LLM_OPTIONS },
            { key: 'reranker' as const, label: 'Reranker 模型', options: RERANKER_OPTIONS },
            { key: 'classifier' as const, label: '分类器模型', options: LLM_OPTIONS },
            { key: 'fallbackLlm' as const, label: '降级 Fallback LLM', options: LLM_OPTIONS },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              <select
                className={hubSelect}
                value={models[field.key]}
                onChange={e => setModels(m => ({ ...m, [field.key]: e.target.value }))}
              >
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              分类器温度: {models.classifierTemperature}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={models.classifierTemperature}
              onChange={e => setModels(m => ({ ...m, classifierTemperature: +e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" /> 融合策略默认值（§11.8）
        </h3>
        <div className="space-y-3">
          {(['rrf', 'weighted', 'cross_encoder', 'cascade'] as FusionStrategy[]).map(f => (
            <label key={f} className="flex items-start gap-2 p-3 border border-gray-100 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <input type="radio" name="defaultFusion" defaultChecked={f === 'rrf'} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{FUSION_STRATEGY_LABEL[f]}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {f === 'rrf' && '多通道倒数排名融合，适合 Tier1-2 异构通道'}
                  {f === 'weighted' && '按通道权重加权，Tier3 主辅通道组合'}
                  {f === 'cross_encoder' && '精排模型二次排序，Tier4 高准确率场景'}
                  {f === 'cascade' && '主通道优先，辅通道补召回'}
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className={`mt-4 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-xs text-gray-600 dark:text-gray-400`}>
          <DollarSign size={12} className="inline text-amber-600 mr-1" />
          今日流水线 LLM 成本约 <strong>¥38.5</strong>（P2 PageIndex 占 42%）
        </div>
        <BtnPrimary className="w-full justify-center mt-4" onClick={() => showToast('模型配置已保存')}>
          保存模型配置
        </BtnPrimary>
      </div>
    </div>
  );
}

function GlobalSettingsTab({
  settings, setSettings, showToast,
}: {
  settings: typeof PIPELINE_GLOBAL_SETTINGS;
  setSettings: React.Dispatch<React.SetStateAction<typeof PIPELINE_GLOBAL_SETTINGS>>;
  showToast: (m: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
      <div className={`${hubCard} p-4 sm:p-5 space-y-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">运行时参数</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">最大并发</label>
            <input type="number" value={settings.maxConcurrency} onChange={e => setSettings(s => ({ ...s, maxConcurrency: +e.target.value }))} className={hubInput} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">路由超时 (ms)</label>
            <input type="number" value={settings.routeTimeoutMs} onChange={e => setSettings(s => ({ ...s, routeTimeoutMs: +e.target.value }))} className={hubInput} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">重试次数</label>
            <input type="number" value={settings.retryCount} min={0} max={5} onChange={e => setSettings(s => ({ ...s, retryCount: +e.target.value }))} className={hubInput} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">软路由置信差</label>
            <input type="number" value={settings.softRoutingGap} step={0.05} min={0} max={0.5} onChange={e => setSettings(s => ({ ...s, softRoutingGap: +e.target.value }))} className={hubInput} />
            <p className="text-[10px] text-gray-400 mt-0.5">gap &lt; 阈值时同时调用主/辅流水线</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={settings.enableRouteCache} onChange={e => setSettings(s => ({ ...s, enableRouteCache: e.target.checked }))} className="rounded text-blue-600" />
          启用路由决策缓存（Redis TTL {settings.cacheTtlSec}s）
        </label>
      </div>

      <div className={`${hubCard} p-4 sm:p-5 space-y-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Pause size={14} /> 灰度发布（§6.6）
        </h3>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">灰度流水线</label>
          <select className={hubSelect} value={settings.grayReleasePipeline} onChange={e => setSettings(s => ({ ...s, grayReleasePipeline: e.target.value }))}>
            {PIPELINE_DEFINITIONS.map(p => <option key={p.key} value={`${p.key} ${p.shortName}`}>{p.key} {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            流量比例: {settings.grayReleasePercent}%
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={settings.grayReleasePercent}
            onChange={e => setSettings(s => ({ ...s, grayReleasePercent: +e.target.value }))}
            className="w-full"
          />
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>当前 {settings.grayReleasePercent}% 查询走 {settings.grayReleasePipeline} 新版本，其余走稳定配置。</span>
        </div>
        <BtnPrimary className="w-full justify-center" onClick={() => showToast('全局设置已保存')}>
          保存全局设置
        </BtnPrimary>
      </div>
    </div>
  );
}

export default PipelineConfigPage;
