import { useState, useMemo } from 'react';
import {
  Plus, StopCircle, TrendingUp, TrendingDown, Minus, BarChart2, CheckCircle,
  AlertCircle, Loader, FlaskConical, Clock, ChevronDown, X, Eye, Filter,
  Download, LayoutGrid, List, ThumbsUp, Play, Database
} from 'lucide-react';
import { mockKBs, evalTrends } from '../mockData';
import { EvalSubNav } from '../components/EvalSubNav';
import {
  AB_TEST_VARIABLES, LAYERED_EVAL, TREND_METRICS, SATISFACTION_SUMMARY,
  type FailureCase,
} from '../data/evalMock';
import { useEvalDashboard, useEvalRuns, useAbTests, useEvalDatasets } from '../hooks/useEvalData';
import { EvalRunDetailModal } from '../components/EvalRunDetailModal';
import { EvalFailureCaseDrawer } from '../components/EvalFailureCaseDrawer';
import { useKnowledgeBaseList } from '../hooks/useKbData';
import { evalService } from '../services/evalService';
import { getStoredAuth, useApiMode } from '../services/http';
import type { EvalRun } from '../types';

function formatEta(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '估算中…';
  if (seconds < 60) return `约 ${seconds} 秒`;
  const min = Math.ceil(seconds / 60);
  return min < 60 ? `约 ${min} 分钟` : `约 ${Math.floor(min / 60)} 小时 ${min % 60} 分`;
}

function EvalRunProgressBar({ run }: { run: EvalRun }) {
  if (run.status !== 'running' && run.status !== 'pending') return null;
  const pct = Math.min(100, Math.max(0, run.progress ?? 0));
  const total = run.test_set_size || 0;
  const done = run.completed_cases ?? (total ? Math.round((pct / 100) * total) : 0);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
        <span>进度 {pct}% · 已完成 {done}/{total || '—'} 条</span>
        <span>预计剩余 {formatEta(run.eta_seconds)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface EvalDashboardPageProps {
  onNavigate: (page: string) => void;
}

export function EvalDashboardPage({ onNavigate }: EvalDashboardPageProps) {
  const [period, setPeriod] = useState('30d');
  const [kbFilter, setKbFilter] = useState('');
  const [trendGranularity, setTrendGranularity] = useState<'日' | '周' | '月'>('月');
  const [activeTrendMetrics, setActiveTrendMetrics] = useState(['faithfulness', 'answer_relevancy']);
  const apiMode = useApiMode();
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = apiMode ? (kbList?.items ?? []) : mockKBs;
  const { data: dash, loading: dashLoading } = useEvalDashboard(period, kbFilter);

  const filteredRuns = useMemo(() =>
    dash.runs.filter(r => !kbFilter || r.kb_id === kbFilter),
  [dash.runs, kbFilter]);

  const runningTask = dash.running[0] ?? filteredRuns.find(r => r.status === 'running');
  const latest = dash.latest ?? filteredRuns.find(r => r.status === 'completed');
  const qualityScore = dash.qualityScore || (LAYERED_EVAL.find(l => l.level === '端到端')?.score ?? 0.86);
  const satisfactionSummary = dash.satisfaction;

  const metrics = latest ? [
    { key: 'faithfulness', label: 'Faithfulness', value: latest.scores.faithfulness, baseline: latest.baseline_scores.faithfulness, icon: '🎯', desc: '答案忠实度' },
    { key: 'context_precision', label: 'Context Precision', value: latest.scores.context_precision, baseline: latest.baseline_scores.context_precision, icon: '📐', desc: '上下文精确度' },
    { key: 'answer_relevancy', label: 'Answer Relevancy', value: latest.scores.answer_relevancy, baseline: latest.baseline_scores.answer_relevancy, icon: '📊', desc: '答案相关性' },
    { key: 'hallucination_rate', label: 'Hallucination Rate', value: latest.scores.hallucination_rate, baseline: latest.baseline_scores.hallucination_rate, icon: '⚠️', desc: '幻觉率', lowerBetter: true },
  ] : [];

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-dashboard" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">监控 RAG 系统各层质量指标</p>
        <div className="flex gap-2">
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
              <option value="7d">近 7 天</option>
              <option value="30d">近 30 天</option>
              <option value="90d">近 90 天</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <select value={kbFilter} onChange={e => setKbFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
            <option value="">全部知识库</option>
            {kbs.map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
          </select>
        </div>
      </div>

      {runningTask && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300 min-w-0">
              <Loader size={16} className="animate-spin flex-shrink-0" />
              <span className="truncate">
                <strong>{runningTask.name}</strong>
                {runningTask.dataset_name ? ` · ${runningTask.dataset_name}` : ''}
                {' · '}{runningTask.test_set_size} 条样本
              </span>
            </div>
            <button type="button" onClick={() => onNavigate('eval-tasks')} className="text-xs text-blue-600 hover:underline flex-shrink-0">查看任务</button>
          </div>
          <EvalRunProgressBar run={runningTask} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-gray-800" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${qualityScore * 97.4} 97.4`} className="text-blue-600" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-gray-100">{(qualityScore * 100).toFixed(0)}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">综合质量分</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">端到端评分</p>
            <p className="text-[10px] text-green-600">较上期 +0.02</p>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: '创建评测', page: 'eval-tasks', icon: <Play size={14} /> },
            { label: 'A/B 测试', page: 'eval-ab-test', icon: <FlaskConical size={14} /> },
            { label: '评测数据集', page: 'eval-datasets', icon: <Database size={14} /> },
            { label: '回放评测', page: 'eval-replay', icon: <BarChart2 size={14} /> },
          ].map(a => (
            <button key={a.page} type="button" onClick={() => onNavigate(a.page)} className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <span className="text-blue-600">{a.icon}</span>
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => {
          const diff = m.value - m.baseline;
          const improved = m.lowerBetter ? diff < 0 : diff > 0;
          return (
            <div key={m.key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{m.icon}</span>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${improved ? 'text-green-600' : diff === 0 ? 'text-gray-500' : 'text-red-600'}`}>
                  {improved ? <TrendingUp size={12} /> : diff === 0 ? <Minus size={12} /> : <TrendingDown size={12} />}
                  {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '稳定'}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">{m.value.toFixed(2)}</div>
              <div className="text-xs text-gray-600 font-medium">{m.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
              <div className="mt-2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${m.value >= 0.9 ? 'bg-green-500' : m.value >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${m.key === 'hallucination_rate' ? m.value * 500 : m.value * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">核心指标趋势</h3>
          <div className="flex gap-2">
            {(['日', '周', '月'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTrendGranularity(t)} className={`px-2.5 py-1 text-xs rounded-lg ${trendGranularity === t ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {TREND_METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveTrendMetrics(prev => prev.includes(m.key) ? prev.filter(k => k !== m.key) : [...prev, m.key])}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border ${activeTrendMetrics.includes(m.key) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
            >
              <span className={`w-2 h-2 rounded-sm ${m.color}`} /> {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-1 h-32 mb-2">
          {evalTrends.map((point, i) => (
            <div key={i} className="flex-1 flex gap-0.5 items-end group relative">
              {activeTrendMetrics.map(key => {
                const m = TREND_METRICS.find(t => t.key === key)!;
                const val = (point as Record<string, number>)[key] ?? 0;
                const h = key === 'hallucination_rate' ? val * 500 : val * 100;
                return (
                  <div key={key} className={`flex-1 ${m.color} rounded-sm opacity-80 hover:opacity-100`} style={{ height: `${Math.min(h, 100)}%` }} title={`${m.label}: ${val}`} />
                );
              })}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">{point.month}</div>
            </div>
          ))}
        </div>
        <div className="h-5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Layered evaluation */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">分层评测结果</h3>
        <div className="space-y-3">
          {LAYERED_EVAL.map(l => (
            <div key={l.level} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-14 flex-shrink-0">{l.level}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${l.color} rounded-full transition-all`} style={{ width: `${l.score * 100}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-gray-800 w-8 text-right">{(l.score * 100).toFixed(0)}%</span>
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">{l.metric}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => onNavigate('eval-satisfaction')} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <ThumbsUp size={16} className="text-green-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">用户满意度</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{satisfactionSummary.positiveRate}%</p>
        <p className="text-xs text-gray-500 mt-1">好评率 · NPS +{satisfactionSummary.nps}{dashLoading ? ' · 加载中…' : ''}</p>
        <p className="text-[10px] text-blue-600 mt-3">查看详情 →</p>
      </button>
      </div>

      {/* Recent runs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">最近评测</h3>
          <button type="button" onClick={() => onNavigate('eval-tasks')} className="text-xs text-blue-600 hover:underline">查看全部</button>
        </div>
        {filteredRuns.map(run => (
          <div key={run.run_id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{run.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kbs.find(k => k.kb_id === run.kb_id)?.name} · {run.test_set_size} 条样本 · {String(run.started_at).slice(0, 10)}</div>
            </div>
            {run.status === 'running' ? (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Loader size={12} className="animate-spin" /> 运行中
              </span>
            ) : run.status === 'completed' ? (
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  {Object.entries(run.scores).slice(0, 2).map(([k, v]) => (
                    <span key={k} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      {k === 'faithfulness' ? 'F' : k === 'context_precision' ? 'CP' : k === 'answer_relevancy' ? 'AR' : 'HR'}:{v.toFixed(2)}
                    </span>
                  ))}
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            ) : (
              <AlertCircle size={14} className="text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EvalTasksPageProps {
  onNavigate: (page: string) => void;
}

export function EvalTasksPage({ onNavigate }: EvalTasksPageProps) {
  const apiMode = useApiMode();
  const [showCreate, setShowCreate] = useState(false);
  const [detailRunId, setDetailRunId] = useState<string | null>(null);
  const [failureCase, setFailureCase] = useState<FailureCase | null>(null);
  const [showAddToDataset, setShowAddToDataset] = useState(false);
  const [addToDatasetId, setAddToDatasetId] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [taskName, setTaskName] = useState('');
  const [createKbId, setCreateKbId] = useState('');
  const [createDatasetId, setCreateDatasetId] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState(['faithfulness', 'context_precision', 'answer_relevancy']);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = apiMode ? (kbList?.items ?? []) : mockKBs;
  const { data: runs, refresh: refreshRuns } = useEvalRuns('', statusFilter);
  const { data: datasets } = useEvalDatasets('', '');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const detailRun = runs.find(r => r.run_id === detailRunId);

  const exportRunCsv = async (runId: string) => {
    if (!apiMode) { showToast('演示模式：已模拟导出'); return; }
    try {
      const auth = getStoredAuth();
      const res = await fetch(evalService.exportRunUrl(runId), {
        headers: auth ? { Authorization: auth } : {},
      });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eval_${runId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('评测报告已导出');
    } catch (e) {
      showToast((e as Error).message || '导出失败');
    }
  };

  const stopRun = async (runId: string) => {
    if (apiMode) {
      try {
        await evalService.stopRun(runId);
        refreshRuns();
      } catch (e) {
        showToast((e as Error).message || '停止失败');
        return;
      }
    }
    showToast('评测任务已停止');
  };

  const createTask = async () => {
    if (!taskName.trim()) return;
    const kbId = createKbId || kbs[0]?.kb_id;
    const datasetId = createDatasetId || datasets[0]?.id;
    if (apiMode) {
      if (!kbId || !datasetId) {
        showToast('请选择知识库和评测集');
        return;
      }
      try {
        await evalService.createRun({
          name: taskName.trim(),
          dataset_id: datasetId,
          kb_id: kbId,
          evaluation_type: 'end_to_end',
          metrics: selectedMetrics,
        });
        refreshRuns();
      } catch (e) {
        showToast((e as Error).message || '创建失败');
        return;
      }
    }
    setShowCreate(false);
    showToast('评测任务已创建，正在排队…');
  };

  const allMetrics = [
    { key: 'faithfulness', label: 'Faithfulness' },
    { key: 'context_precision', label: 'Context Precision' },
    { key: 'answer_relevancy', label: 'Answer Relevancy' },
    { key: 'hallucination_rate', label: 'Hallucination Rate' },
    { key: 'context_recall', label: 'Context Recall' },
    { key: 'bleu_score', label: 'BLEU Score' },
  ];

  const statusIcons = {
    completed: <CheckCircle size={14} className="text-green-500" />,
    running: <Loader size={14} className="animate-spin text-blue-500" />,
    pending: <Clock size={14} className="text-gray-400" />,
    failed: <AlertCircle size={14} className="text-red-500" />,
  } as const;

  const filteredTasks = runs.filter(r => !statusFilter || r.status === statusFilter);

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-tasks" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">创建和管理知识库评测任务</p>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setViewMode('cards')} className={`px-2.5 py-2 ${viewMode === 'cards' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}><LayoutGrid size={14} /></button>
            <button type="button" onClick={() => setViewMode('table')} className={`px-2.5 py-2 ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}><List size={14} /></button>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="running">运行中</option>
            <option value="failed">失败</option>
          </select>
          <button
            type="button"
            onClick={() => {
              const rid = detailRunId || runs.find(r => r.status === 'completed')?.run_id;
              if (rid) void exportRunCsv(rid);
              else showToast('请先选择已完成的评测任务');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Download size={14} /> 导出
          </button>
          <button type="button" onClick={() => onNavigate('eval-datasets')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Filter size={14} /> 评测集
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateKbId(kbs[0]?.kb_id || '');
              setCreateDatasetId(datasets[0]?.id || '');
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} /> 创建评测任务
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-2">任务</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2">F</th>
                <th className="px-4 py-2">CP</th>
                <th className="px-4 py-2">AR</th>
                <th className="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(run => (
                <tr key={run.run_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{run.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {run.dataset_name || datasets.find(d => d.id === run.dataset_id)?.name || '评测集'}
                      {' · '}{run.test_set_size} 条 · {run.started_at.slice(0, 10)}
                    </p>
                    {run.status === 'running' && <EvalRunProgressBar run={run} />}
                  </td>
                  <td className="px-4 py-2.5">{statusIcons[run.status]}</td>
                  <td className="px-4 py-2.5 text-xs">{run.status === 'completed' ? run.scores.faithfulness.toFixed(2) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs">{run.status === 'completed' ? run.scores.context_precision.toFixed(2) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs">{run.status === 'completed' ? run.scores.answer_relevancy.toFixed(2) : '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {(run.status === 'completed' || run.status === 'running') && <button type="button" onClick={() => setDetailRunId(run.run_id)} className="text-[10px] text-blue-600">详情</button>}
                      {run.status === 'running' && <button type="button" onClick={() => stopRun(run.run_id)} className="text-[10px] text-red-600">停止</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="space-y-3">
        {filteredTasks.map(run => (
          <div key={run.run_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcons[run.status]}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{run.name}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {run.kb_name || kbs.find(k => k.kb_id === run.kb_id)?.name}
                  {' · '}{run.dataset_name || datasets.find(d => d.id === run.dataset_id)?.name || '评测集'}
                  {' · '}{run.test_set_size} 条样本
                  {run.duration_min != null && ` · 耗时 ${run.duration_min} 分钟`}
                  {' · '}{run.started_at.slice(0, 10)}
                </p>
                {run.status === 'running' && <EvalRunProgressBar run={run} />}
                {(run.status === 'failed' || (run.status === 'completed' && run.scores.faithfulness === 0)) && run.error_message && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{run.error_message}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                {run.status === 'running' && (
                  <button type="button" onClick={() => stopRun(run.run_id)} className="text-xs px-2 py-1 border border-red-200 dark:border-red-800 rounded-lg text-red-600 flex items-center gap-1">
                    <StopCircle size={11} /> 停止
                  </button>
                )}
                {(run.status === 'completed' || run.status === 'running') && (
                  <button type="button" onClick={() => setDetailRunId(run.run_id)} className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Eye size={11} /> 详情
                  </button>
                )}
                {run.status === 'completed' && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(run.scores).map(([k, v]) => {
                      const baseline = run.baseline_scores[k];
                      const diff = v - baseline;
                      const lowerBetter = k === 'hallucination_rate';
                      const improved = lowerBetter ? diff < 0 : diff > 0;
                      return (
                        <div key={k} className={`px-2 py-1 rounded-lg text-[10px] ${improved ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : diff === 0 ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                          <span className="font-semibold">{v.toFixed(2)}</span>
                          <span className="opacity-70 ml-0.5">{improved ? '↑' : diff === 0 ? '' : '↓'}{Math.abs(diff).toFixed(2)}</span>
                          <span className="opacity-50 ml-1">{k === 'faithfulness' ? 'F' : k === 'context_precision' ? 'CP' : k === 'answer_relevancy' ? 'AR' : 'HR'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {run.status === 'completed' && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailRunId(run.run_id)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  查看本任务失败案例与指标详情 →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Create task modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">创建评测任务</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">评测名称 <span className="text-red-500">*</span></label>
                <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="如：7月Faithfulness回归评测" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">目标知识库 <span className="text-red-500">*</span></label>
                <select value={createKbId} onChange={e => setCreateKbId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {kbs.map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">评测数据集 <span className="text-red-500">*</span></label>
                <select
                  value={createDatasetId || datasets[0]?.id || ''}
                  onChange={e => setCreateDatasetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                >
                  {datasets.length === 0 ? <option value="">请先在「评测数据集」页创建并导入样本</option> : datasets.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name} ({ds.sampleCount} 条)</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">失败案例与指标均基于所选数据集中的问答样本</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评测指标</label>
                <div className="grid grid-cols-2 gap-2">
                  {allMetrics.map(m => (
                    <label key={m.key} className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(m.key)}
                        onChange={e => setSelectedMetrics(prev => e.target.checked ? [...prev, m.key] : prev.filter(k => k !== m.key))}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs text-gray-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">取消</button>
              <button onClick={() => void createTask()} disabled={!taskName} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                创建评测
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRun && (
        <EvalRunDetailModal
          run={detailRun}
          kbName={detailRun.kb_name || kbs.find(k => k.kb_id === detailRun.kb_id)?.name}
          datasets={datasets}
          onClose={() => setDetailRunId(null)}
          onExport={rid => void exportRunCsv(rid)}
          onSelectCase={setFailureCase}
        />
      )}

      {failureCase && (
        <EvalFailureCaseDrawer
          caseItem={failureCase}
          kbId={detailRun?.kb_id}
          onClose={() => setFailureCase(null)}
          onAddToDataset={() => {
            setAddToDatasetId(detailRun?.dataset_id || datasets[0]?.id || '');
            setShowAddToDataset(true);
          }}
        />
      )}

      {showAddToDataset && failureCase && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">加入评测数据集</h3>
            <p className="text-xs text-gray-500 mb-2 truncate">Q: {failureCase.query}</p>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">目标数据集</label>
            <select
              value={addToDatasetId}
              onChange={e => setAddToDatasetId(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 mb-4"
            >
              {datasets.length === 0 ? <option value="">暂无数据集</option> : datasets.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddToDataset(false)} className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
              <button
                type="button"
                onClick={async () => {
                  if (!addToDatasetId) { showToast('请选择数据集'); return; }
                  if (apiMode) {
                    try {
                      await evalService.sampleFromChat({
                        dataset_id: addToDatasetId,
                        question: failureCase.query,
                        answer: failureCase.expected,
                      });
                    } catch (e) {
                      showToast((e as Error).message || '加入失败');
                      return;
                    }
                  }
                  setShowAddToDataset(false);
                  setFailureCase(null);
                  showToast('已加入评测数据集');
                }}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ABTestPageProps {
  onNavigate: (page: string) => void;
}

export function ABTestPage({ onNavigate }: ABTestPageProps) {
  const apiMode = useApiMode();
  const [showCreate, setShowCreate] = useState(false);
  const [reportTestId, setReportTestId] = useState<string | null>(null);
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [varGroup, setVarGroup] = useState(AB_TEST_VARIABLES[0].group);
  const [toast, setToast] = useState<string | null>(null);
  const { data: tests, refresh: refreshAb } = useAbTests();
  const { data: datasets } = useEvalDatasets('', '');
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = apiMode ? (kbList?.items ?? []) : mockKBs;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const varOptions = AB_TEST_VARIABLES.find(g => g.group === varGroup)?.options ?? [];
  const activeTests = tests.filter(t => t.status === 'running');
  const historyTests = tests.filter(t => t.status === 'completed');
  const reportTest = tests.find(t => t.test_id === reportTestId);

  const stopTest = async (testId: string) => {
    if (apiMode) {
      try {
        await evalService.stopAbTest(testId);
        refreshAb();
      } catch (e) {
        showToast((e as Error).message || '停止失败');
        return;
      }
    }
    showToast('测试已停止');
  };

  const renderTestCard = (test: (typeof tests)[0]) => (
    <div key={test.test_id} className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-5 ${test.status === 'running' ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className={test.status === 'running' ? 'text-blue-600' : 'text-gray-500'} />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{test.name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${test.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {test.status === 'running' ? '🟢 运行中' : '✅ 已完成'}
            </span>
            <span>流量 {test.traffic_ratio[0]}/{test.traffic_ratio[1]}</span>
          </div>
        </div>
        {test.winner && (
          <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg font-medium border border-green-200 dark:border-green-800">
            胜出: Variant {test.winner.toUpperCase()}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { label: `A: ${test.variant_a_name}`, metrics: test.metrics_a, samples: test.samples_a },
          { label: `B: ${test.variant_b_name}`, metrics: test.metrics_b, samples: test.samples_b },
        ].map((v, i) => (
          <div key={i} className={`p-3 rounded-xl border ${test.winner === (i === 0 ? 'a' : 'b') ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{v.label}</p>
            {Object.entries(v.metrics).map(([k, val]) => (
              <div key={k} className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400">
                <span>{k === 'faithfulness' ? 'Faithfulness' : k === 'recall_10' ? 'Recall@10' : 'P95'}</span>
                <span className="font-bold">{k === 'p95_latency' ? `${val}s` : val.toFixed(2)}</span>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 mt-2">样本: {v.samples.toLocaleString()}</p>
          </div>
        ))}
      </div>
      {test.p_value !== null && (
        <div className={`p-2.5 rounded-lg text-xs mb-3 ${test.p_value <= 0.05 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
          p={test.p_value.toFixed(3)} {test.p_value <= 0.05 ? '✅ 显著' : '⚠️ 未达显著'}
        </div>
      )}
      <div className="flex gap-2">
        {test.status === 'running' && (
          <>
            <button type="button" onClick={() => setReportTestId(test.test_id)} className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg">查看详情</button>
            <button type="button" onClick={() => stopTest(test.test_id)} className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 flex items-center gap-1"><StopCircle size={11} /> 停止</button>
          </>
        )}
        {test.status === 'completed' && (
          <button type="button" onClick={() => setReportTestId(test.test_id)} className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg">查看报告</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-ab-test" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">对比不同模型、策略的实际效果</p>
        <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> 创建 A/B 测试
        </button>
      </div>

      {activeTests.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">进行中 ({activeTests.length})</h3>
          <div className="space-y-4">{activeTests.map(test => renderTestCard(test))}</div>
        </div>
      )}
      {historyTests.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">历史测试</h3>
          <div className="space-y-4">{historyTests.map(test => renderTestCard(test))}</div>
        </div>
      )}

      {reportTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">A/B 报告: {reportTest.name}</h2>
              <button type="button" onClick={() => setReportTestId(null)}><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: reportTest.variant_a_name, m: reportTest.metrics_a },
                { label: reportTest.variant_b_name, m: reportTest.metrics_b },
              ].map((v, i) => (
                <div key={i} className={`p-3 rounded-xl border ${reportTest.winner === (i === 0 ? 'a' : 'b') ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <p className="text-xs font-semibold mb-2">{v.label}</p>
                  {Object.entries(v.m).map(([k, val]) => (
                    <p key={k} className="text-xs text-gray-600 dark:text-gray-400">{k}: <strong>{typeof val === 'number' && k !== 'p95_latency' ? val.toFixed(2) : val}</strong></p>
                  ))}
                </div>
              ))}
            </div>
            {reportTest.p_value !== null && (
              <p className="text-xs text-gray-500">p-value: {reportTest.p_value.toFixed(3)} · 样本 A/B: {reportTest.samples_a}/{reportTest.samples_b}</p>
            )}
            <button type="button" onClick={() => showToast('报告已导出 PDF')} className="mt-4 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">导出报告</button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">创建 A/B 测试</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">测试名称</label>
                <input placeholder="如：新旧嵌入模型对比" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">对比变量</label>
                <select value={varGroup} onChange={e => setVarGroup(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  {AB_TEST_VARIABLES.map(g => <option key={g.group} value={g.group}>{g.group}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Variant A</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    {varOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Variant B</label>
                  <select className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    {varOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">流量分配 A / B</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={10} max={90} value={trafficSplit} onChange={e => setTrafficSplit(parseInt(e.target.value))} className="flex-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16">{trafficSplit}/{100 - trafficSplit}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">取消</button>
              <button type="button" onClick={() => { setShowCreate(false); showToast('A/B 测试已创建'); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建测试</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
