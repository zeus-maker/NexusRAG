import { useState, useMemo } from 'react';
import {
  Plus, StopCircle, TrendingUp, TrendingDown, Minus, BarChart2, CheckCircle,
  AlertCircle, Loader, FlaskConical, Clock, ChevronDown, X, Eye, Filter
} from 'lucide-react';
import { mockEvalRuns, mockABTests, mockKBs, evalTrends } from '../mockData';
import { EvalSubNav } from '../components/EvalSubNav';
import { FAILURE_CASES, AB_TEST_VARIABLES } from '../data/evalMock';

interface EvalDashboardPageProps {
  onNavigate: (page: string) => void;
}

export function EvalDashboardPage({ onNavigate }: EvalDashboardPageProps) {
  const [period, setPeriod] = useState('30d');
  const [kbFilter, setKbFilter] = useState('');
  const [trendGranularity, setTrendGranularity] = useState<'日' | '周' | '月'>('月');

  const filteredRuns = useMemo(() =>
    mockEvalRuns.filter(r => !kbFilter || r.kb_id === kbFilter),
  [kbFilter]);

  const latest = filteredRuns.find(r => r.status === 'completed');

  const metrics = latest ? [
    { key: 'faithfulness', label: 'Faithfulness', value: latest.scores.faithfulness, baseline: latest.baseline_scores.faithfulness, icon: '🎯', desc: '答案忠实度' },
    { key: 'context_precision', label: 'Context Precision', value: latest.scores.context_precision, baseline: latest.baseline_scores.context_precision, icon: '📐', desc: '上下文精确度' },
    { key: 'answer_relevancy', label: 'Answer Relevancy', value: latest.scores.answer_relevancy, baseline: latest.baseline_scores.answer_relevancy, icon: '📊', desc: '答案相关性' },
    { key: 'hallucination_rate', label: 'Hallucination Rate', value: latest.scores.hallucination_rate, baseline: latest.baseline_scores.hallucination_rate, icon: '⚠️', desc: '幻觉率', lowerBetter: true },
  ] : [];

  const maxTrend = Math.max(...evalTrends.map(t => t.faithfulness), ...evalTrends.map(t => t.answer_relevancy));

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
            {mockKBs.map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
          </select>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">核心指标趋势</h3>
          <div className="flex gap-2">
            {(['日', '周', '月'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTrendGranularity(t)} className={`px-2.5 py-1 text-xs rounded-lg ${trendGranularity === t ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Simple chart */}
        <div className="flex items-end gap-1 h-32 mb-2">
          {evalTrends.map((point, i) => {
            const fH = (point.faithfulness / 1.0) * 100;
            const aH = (point.answer_relevancy / 1.0) * 100;
            return (
              <div key={i} className="flex-1 flex gap-0.5 items-end group relative">
                <div className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${fH}%` }} title={`Faithfulness: ${point.faithfulness}`}></div>
                <div className="flex-1 bg-green-500 rounded-sm opacity-70 hover:opacity-100 transition-opacity" style={{ height: `${aH}%` }} title={`Answer Relevancy: ${point.answer_relevancy}`}></div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">{point.month}</div>
              </div>
            );
          })}
        </div>
        <div className="h-5"></div>

        <div className="flex items-center gap-4 mt-2">
          {[
            { color: 'bg-blue-500', label: 'Faithfulness' },
            { color: 'bg-green-500', label: 'Answer Relevancy' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`}></div>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Layered evaluation */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">分层评测结果</h3>
        <div className="space-y-3">
          {[
            { level: '文档级', metric: '解析质量', score: 0.92, color: 'bg-blue-500' },
            { level: '块级', metric: '分块合理性', score: 0.88, color: 'bg-purple-500' },
            { level: '检索级', metric: 'Recall@10', score: 0.82, color: 'bg-orange-500' },
            { level: '生成级', metric: 'Faithfulness', score: 0.92, color: 'bg-green-500' },
            { level: '端到端', metric: '综合评分', score: 0.86, color: 'bg-blue-600' },
          ].map(l => (
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
              <div className="text-xs text-gray-500 mt-0.5">{mockKBs.find(k => k.kb_id === run.kb_id)?.name} · {run.test_set_size} 条样本 · {run.started_at.slice(0, 10)}</div>
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
  const [showCreate, setShowCreate] = useState(false);
  const [detailRunId, setDetailRunId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState(['faithfulness', 'context_precision', 'answer_relevancy']);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const detailRun = mockEvalRuns.find(r => r.run_id === detailRunId);

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

  const filteredTasks = mockEvalRuns.filter(r => !statusFilter || r.status === statusFilter);

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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="running">运行中</option>
            <option value="failed">失败</option>
          </select>
          <button type="button" onClick={() => onNavigate('eval-datasets')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Filter size={14} /> 评测集
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> 创建评测任务
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map(run => (
          <div key={run.run_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcons[run.status]}
                  <h3 className="text-sm font-semibold text-gray-900">{run.name}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {mockKBs.find(k => k.kb_id === run.kb_id)?.name} · {run.test_set_size} 条测试样本
                  {run.duration_min && ` · 耗时 ${run.duration_min} 分钟`}
                  · {run.started_at.slice(0, 10)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {run.status === 'completed' && (
                  <button type="button" onClick={() => setDetailRunId(run.run_id)} className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Eye size={11} /> 详情
                  </button>
                )}
              </div>
              {run.status === 'completed' && (
                <div className="flex flex-wrap gap-1.5 max-w-64 mt-2 sm:mt-0">
                  {Object.entries(run.scores).map(([k, v]) => {
                    const baseline = run.baseline_scores[k];
                    const diff = v - baseline;
                    const lowerBetter = k === 'hallucination_rate';
                    const improved = lowerBetter ? diff < 0 : diff > 0;
                    return (
                      <div key={k} className={`px-2 py-1 rounded-lg text-[10px] ${improved ? 'bg-green-50 text-green-700' : diff === 0 ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                        <span className="font-semibold">{v.toFixed(2)}</span>
                        <span className="opacity-70 ml-0.5">{improved ? '↑' : diff === 0 ? '' : '↓'}{Math.abs(diff).toFixed(2)}</span>
                        <span className="opacity-50 ml-1">{k === 'faithfulness' ? 'F' : k === 'context_precision' ? 'CP' : k === 'answer_relevancy' ? 'AR' : 'HR'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {run.status === 'completed' && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">失败案例 (Top 3)</h4>
                <div className="space-y-1.5">
                  {FAILURE_CASES.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-xs">
                      <span className="text-red-400 flex-shrink-0 font-bold">#{c.rank}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{c.query}</span>
                        <span className="text-gray-500 mx-1">→</span>
                        <span className="text-red-600 dark:text-red-400">{c.actual}</span>
                      </div>
                      <span className="text-red-500 font-medium flex-shrink-0">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {mockKBs.map(kb => <option key={kb.kb_id}>{kb.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评测集</label>
                <div className="space-y-2">
                  {[
                    { v: 'default', l: '使用默认评测集（500条）' },
                    { v: 'upload', l: '上传自定义评测集 (CSV/JSON)' },
                    { v: 'generate', l: '从历史查询生成（近30天）' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="testset" defaultChecked={opt.v === 'default'} className="text-blue-600" />
                      <span className="text-sm text-gray-700">{opt.l}</span>
                    </label>
                  ))}
                </div>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-sm text-gray-700">与上次评测结果对比</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">取消</button>
              <button onClick={() => { if (!taskName.trim()) return; setShowCreate(false); showToast('评测任务已创建，正在排队…'); }} disabled={!taskName} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                创建评测
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between sticky top-0 bg-white dark:bg-gray-900">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">评测结果: {detailRun.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {detailRun.status === 'completed' ? '✅ 完成' : detailRun.status} · {detailRun.duration_min}min · {detailRun.test_set_size} 条 · {detailRun.started_at.slice(0, 10)}
                </p>
              </div>
              <button type="button" onClick={() => setDetailRunId(null)} className="text-gray-400"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(detailRun.scores).map(([k, v]) => {
                  const baseline = detailRun.baseline_scores[k];
                  const diff = v - baseline;
                  const lowerBetter = k === 'hallucination_rate';
                  const improved = lowerBetter ? diff < 0 : diff > 0;
                  return (
                    <div key={k} className={`p-3 rounded-xl border ${improved ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <p className="text-[10px] text-gray-500 capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{v.toFixed(2)} <span className="text-xs font-normal">{improved ? '↑' : '↓'}{Math.abs(diff).toFixed(2)}</span></p>
                    </div>
                  );
                })}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">失败案例 Top 10</h4>
                <div className="space-y-2">
                  {FAILURE_CASES.map(c => (
                    <div key={c.rank} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                      <p className="font-medium text-gray-800 dark:text-gray-200">#{c.rank} {c.query}</p>
                      <p className="text-gray-500 mt-1">期望: {c.expected}</p>
                      <p className="text-red-600 dark:text-red-400">实际: {c.actual}</p>
                      <p className="text-gray-400 mt-1">{c.metric}: {c.score}</p>
                    </div>
                  ))}
                </div>
              </div>
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
  const [showCreate, setShowCreate] = useState(false);
  const [tests, setTests] = useState(mockABTests);
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [varGroup, setVarGroup] = useState(AB_TEST_VARIABLES[0].group);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const varOptions = AB_TEST_VARIABLES.find(g => g.group === varGroup)?.options ?? [];

  const stopTest = (testId: string) => {
    setTests(prev => prev.map(t => t.test_id === testId ? { ...t, status: 'completed' as const, winner: 'a' } : t));
    showToast('测试已停止');
  };

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

      <div className="space-y-4">
        {tests.map(test => (
          <div key={test.test_id} className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-5 ${test.status === 'running' ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className={test.status === 'running' ? 'text-blue-600' : 'text-gray-500'} />
                  <h3 className="text-sm font-bold text-gray-900">{test.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${test.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {test.status === 'running' ? '🟢 运行中' : '✅ 已完成'}
                  </span>
                  <span>流量 {test.traffic_ratio[0]}/{test.traffic_ratio[1]}</span>
                  <span>· 运行 {test.status === 'running' ? '3天' : '2天'}</span>
                </div>
              </div>
              {test.winner && (
                <div className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium border border-green-200">
                  胜出: Variant {test.winner.toUpperCase()} ({test.variant_a_name})
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: `Variant A: ${test.variant_a_name}`, metrics: test.metrics_a, samples: test.samples_a },
                { label: `Variant B: ${test.variant_b_name}`, metrics: test.metrics_b, samples: test.samples_b },
              ].map((v, i) => (
                <div key={i} className={`p-3 rounded-xl border ${test.winner === (i === 0 ? 'a' : 'b') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs font-semibold text-gray-700 mb-2">{v.label}</p>
                  <div className="space-y-1.5">
                    {Object.entries(v.metrics).map(([k, val]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600">{k === 'faithfulness' ? 'Faithfulness' : k === 'recall_10' ? 'Recall@10' : 'P95延迟'}</span>
                        <span className="text-xs font-bold text-gray-800">{k === 'p95_latency' ? `${val}s` : val.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">样本量: {v.samples.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {test.p_value !== null && (
              <div className={`p-2.5 rounded-lg text-xs ${test.p_value <= 0.05 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                统计显著性: p={test.p_value.toFixed(3)} {test.p_value <= 0.05 ? '✅ 已达到95%置信度' : '⚠️ 尚未达到显著性'}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {test.status === 'running' && (
                <>
                  <button className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">查看详情</button>
                  <button type="button" onClick={() => stopTest(test.test_id)} className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-1">
                    <StopCircle size={11} /> 停止测试
                  </button>
                  <button type="button" onClick={() => showToast('已全量切换到 Variant A')} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">全量切换到 A</button>
                </>
              )}
              {test.status === 'completed' && (
                <button className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">查看报告</button>
              )}
            </div>
          </div>
        ))}
      </div>

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
