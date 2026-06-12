import { useState } from 'react';
import {
  DollarSign, BarChart2, TrendingUp, Clock, Filter, Download,
  Play, Pause, RefreshCw, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Database, Zap, Users, FileText,
  Activity, Plus, ArrowRight, MessageSquare, Loader
} from 'lucide-react';
import { EvalSubNav } from '../components/EvalSubNav';
import { COST_BREAKDOWN, BUDGET_CONFIG, REPLAY_TASKS } from '../data/evalMock';

// ─── Cost Center ───────────────────────────────────────────────────────────────

const COST_BY_KB = [
  { name: '合同知识库', tokens: 1_840_000, cost: 5.52, queries: 12400, color: 'bg-blue-500' },
  { name: '供应商管理KB', tokens: 980_000, cost: 2.94, queries: 6800, color: 'bg-purple-500' },
  { name: '财务报告KB', tokens: 760_000, cost: 2.28, queries: 4200, color: 'bg-green-500' },
  { name: '产品手册KB', tokens: 540_000, cost: 1.62, queries: 9100, color: 'bg-orange-500' },
  { name: '法规政策KB', tokens: 420_000, cost: 1.26, queries: 3200, color: 'bg-red-500' },
  { name: 'HR知识库', tokens: 310_000, cost: 0.93, queries: 2800, color: 'bg-yellow-500' },
];

const COST_BY_USER = [
  { name: '王芳', dept: '采购部', tokens: 680_000, cost: 2.04, queries: 4200 },
  { name: '李婷', dept: '平台管理', tokens: 540_000, cost: 1.62, queries: 3800 },
  { name: '张三', dept: '财务部', tokens: 420_000, cost: 1.26, queries: 2900 },
  { name: '孙立', dept: '法务部', tokens: 380_000, cost: 1.14, queries: 2400 },
  { name: '赵敏', dept: 'HR', tokens: 290_000, cost: 0.87, queries: 1900 },
];

const COST_BY_MODEL = [
  { name: 'gpt-4o', type: 'LLM', tokens: 2_100_000, cost: 18.90, share: 52 },
  { name: 'gpt-4o-mini', type: 'LLM', tokens: 1_800_000, cost: 1.80, share: 14 },
  { name: 'claude-3-5-sonnet', type: 'LLM', tokens: 680_000, cost: 10.20, share: 22 },
  { name: 'text-embedding-3-small', type: 'Embedding', tokens: 12_400_000, cost: 1.24, share: 8 },
  { name: 'bge-large-zh', type: 'Embedding', tokens: 8_200_000, cost: 0, share: 4 },
];

const DAILY_COST = [4.2, 3.8, 5.1, 4.9, 6.2, 5.8, 7.1, 6.4, 5.9, 7.8, 8.2, 7.4, 6.8, 9.1];

interface EvalExtraPageProps {
  onNavigate: (page: string) => void;
}

export function CostCenterPage({ onNavigate }: EvalExtraPageProps) {
  const [tab, setTab] = useState<'kb' | 'user' | 'model' | 'trend'>('kb');

  const totalTokens = COST_BY_KB.reduce((s, k) => s + k.tokens, 0);
  const totalCost = COST_BY_KB.reduce((s, k) => s + k.cost, 0);
  const maxTokens = Math.max(...COST_BY_KB.map(k => k.tokens));

  const TABS = [
    { id: 'kb', label: '按知识库' },
    { id: 'user', label: '按用户' },
    { id: 'model', label: '按模型' },
    { id: 'trend', label: '趋势' },
  ] as const;

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5 bg-gray-50 dark:bg-gray-950">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-cost" onNavigate={onNavigate} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">成本中心</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Token消耗与费用分析 — 2026年6月</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
            <option>本月</option>
            <option>上月</option>
            <option>最近7天</option>
          </select>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={13} /> 导出
          </button>
        </div>
      </div>

      {BUDGET_CONFIG.used / BUDGET_CONFIG.total >= 0.65 && (
        <div className={`p-3 rounded-xl border flex items-center justify-between ${BUDGET_CONFIG.used / BUDGET_CONFIG.total >= 0.85 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={16} className={BUDGET_CONFIG.used / BUDGET_CONFIG.total >= 0.85 ? 'text-red-600' : 'text-amber-600'} />
            <span className="text-gray-800 dark:text-gray-200">月度预算已用 <strong>{((BUDGET_CONFIG.used / BUDGET_CONFIG.total) * 100).toFixed(0)}%</strong>（{BUDGET_CONFIG.currency}{BUDGET_CONFIG.used}/{BUDGET_CONFIG.total}）</span>
          </div>
          <button type="button" className="text-xs text-blue-600 hover:underline">调整预算</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COST_BREAKDOWN.map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <span className="text-lg">{c.icon}</span>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{BUDGET_CONFIG.currency}{c.amount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总 Token 消耗', value: (totalTokens / 1_000_000).toFixed(1) + 'M', icon: <Database size={15} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20', sub: '本月累计' },
          { label: '预估总费用', value: BUDGET_CONFIG.currency + BUDGET_CONFIG.used, icon: <DollarSign size={15} className="text-green-500" />, bg: 'bg-green-50 dark:bg-green-900/20', sub: '含模型API费用' },
          { label: '总查询数', value: COST_BY_KB.reduce((s, k) => s + k.queries, 0).toLocaleString(), icon: <MessageSquare size={15} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-900/20', sub: '本月' },
          { label: '平均每查询成本', value: '¥0.008', icon: <TrendingUp size={15} className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20', sub: '较上月 -8%' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* By KB */}
      {tab === 'kb' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
          {COST_BY_KB.map((kb, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-xs font-medium text-gray-700 w-28 flex-shrink-0">{kb.name}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${kb.color} opacity-70 transition-all duration-500`}
                  style={{ width: `${(kb.tokens / maxTokens) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 w-20 text-right">{(kb.tokens / 1_000_000).toFixed(2)}M tok</div>
              <div className="text-xs font-semibold text-gray-800 w-16 text-right">${kb.cost.toFixed(2)}</div>
              <div className="text-[11px] text-gray-400 w-16 text-right">{kb.queries.toLocaleString()} Q</div>
            </div>
          ))}
          <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-800">
            <span>合计</span>
            <span>{(totalTokens / 1_000_000).toFixed(1)}M tokens</span>
            <span>${totalCost.toFixed(2)}</span>
            <span>{COST_BY_KB.reduce((s, k) => s + k.queries, 0).toLocaleString()} Q</span>
          </div>
        </div>
      )}

      {/* By User */}
      {tab === 'user' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['用户', '部门', 'Token消耗', '费用', '查询次数', '占比'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {COST_BY_USER.map((u, i) => {
                const share = (u.tokens / COST_BY_USER.reduce((s, x) => s + x.tokens, 0)) * 100;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3 px-4 text-gray-500">{u.dept}</td>
                    <td className="py-3 px-4">{(u.tokens / 1_000_000).toFixed(2)}M</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">${u.cost.toFixed(2)}</td>
                    <td className="py-3 px-4">{u.queries.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-gray-500">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* By Model */}
      {tab === 'model' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['模型', '类型', 'Token消耗', '费用', '占费用比'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {COST_BY_MODEL.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{m.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-medium ${m.type === 'LLM' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{(m.tokens / 1_000_000).toFixed(1)}M</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{m.cost > 0 ? '$' + m.cost.toFixed(2) : '免费'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${m.share}%` }} />
                      </div>
                      <span className="text-gray-500">{m.share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trend */}
      {tab === 'trend' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">每日费用趋势</h3>
          <div className="flex items-end gap-1 h-36">
            {DAILY_COST.map((v, i) => {
              const maxV = Math.max(...DAILY_COST);
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${(v / maxV) * 100}%` }}
                    title={`$${v}`}
                  />
                  <span className="text-[9px] text-gray-400">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>6月1日</span>
            <span>峰值 $9.10 (6月14日)</span>
            <span>6月{DAILY_COST.length}日</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Replay Evaluation Page ────────────────────────────────────────────────────

const PROD_QUERIES = [
  { id: 'q1', query: '供应商合同中关于违约责任的条款有哪些？', kb: '合同知识库', time: '2026-06-05 14:32', tier: 'Tier3', selected: true },
  { id: 'q2', query: '最新的采购政策有哪些变化？', kb: '供应商管理KB', time: '2026-06-05 13:15', tier: 'Tier2', selected: true },
  { id: 'q3', query: 'Q2财务报告主要亮点', kb: '财务报告KB', time: '2026-06-05 11:08', tier: 'Tier2', selected: false },
  { id: 'q4', query: '产品A的技术规格和认证', kb: '产品手册KB', time: '2026-06-04 16:45', tier: 'Tier1', selected: true },
  { id: 'q5', query: '知识产权保护相关法规解读', kb: '法规政策KB', time: '2026-06-04 10:22', tier: 'Tier4', selected: false },
  { id: 'q6', query: '员工绩效考核标准说明', kb: 'HR知识库', time: '2026-06-03 09:30', tier: 'Tier1', selected: true },
];

const REPLAY_RESULTS = [
  { id: 'q1', query: '供应商合同中...', v1_f: 0.88, v2_f: 0.93, v1_lat: 1840, v2_lat: 1620, delta: +0.05, win: 'v2' },
  { id: 'q2', query: '最新的采购政策...', v1_f: 0.91, v2_f: 0.89, v1_lat: 920, v2_lat: 880, delta: -0.02, win: 'v1' },
  { id: 'q4', query: '产品A的技术规格...', v1_f: 0.95, v2_f: 0.96, v1_lat: 680, v2_lat: 590, delta: +0.01, win: 'v2' },
  { id: 'q6', query: '员工绩效考核标准...', v1_f: 0.82, v2_f: 0.90, v1_lat: 750, v2_lat: 710, delta: +0.08, win: 'v2' },
];

export function ReplayPage({ onNavigate }: EvalExtraPageProps) {
  const [step, setStep] = useState<'sample' | 'config' | 'running' | 'result'>('sample');
  const [selected, setSelected] = useState(new Set(PROD_QUERIES.filter(q => q.selected).map(q => q.id)));
  const [progress, setProgress] = useState(0);

  const toggleQuery = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const startReplay = () => {
    setStep('running');
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setStep('result');
      }
      setProgress(Math.min(p, 100));
    }, 400);
  };

  const avgDelta = REPLAY_RESULTS.reduce((s, r) => s + r.delta, 0) / REPLAY_RESULTS.length;

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5 bg-gray-50 dark:bg-gray-950">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-replay" onNavigate={onNavigate} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">回放评测</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">从生产查询中抽样，离线回放对比两个版本</p>
        </div>
        {step === 'result' && (
          <button onClick={() => setStep('sample')} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            新建回放
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">历史回放任务</h3>
          <span className="text-[10px] text-gray-400">GET /api/v1/eval/replay/tasks</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-2">任务</th>
              <th className="px-4 py-2">状态</th>
              <th className="px-4 py-2">样本</th>
              <th className="px-4 py-2">在线 F</th>
              <th className="px-4 py-2">回放 F</th>
              <th className="px-4 py-2">Δ</th>
            </tr>
          </thead>
          <tbody>
            {REPLAY_TASKS.map(t => (
              <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                  <p className="text-[10px] text-gray-400">{t.dateRange}</p>
                </td>
                <td className="px-4 py-2.5">
                  {t.status === 'running' ? (
                    <span className="text-[10px] text-blue-600 flex items-center gap-1"><Loader size={10} className="animate-spin" /> {t.progress}%</span>
                  ) : t.status === 'completed' ? (
                    <span className="text-[10px] text-green-600">完成</span>
                  ) : (
                    <span className="text-[10px] text-red-600">失败</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">{t.sampleCount}</td>
                <td className="px-4 py-2.5 text-xs">{t.onlineF.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-xs">{t.replayF.toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${t.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { id: 'sample', label: '1. 选择查询样本' },
          { id: 'config', label: '2. 配置版本' },
          { id: 'running', label: '3. 执行回放' },
          { id: 'result', label: '4. 查看结果' },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              step === s.id ? 'bg-blue-600 text-white' :
              ['sample', 'config', 'running', 'result'].indexOf(step) > i ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {['sample', 'config', 'running', 'result'].indexOf(step) > i && <CheckCircle size={12} />}
              {s.label}
            </div>
            {i < arr.length - 1 && <ArrowRight size={13} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Sample selection */}
      {step === 'sample' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">已选 <strong>{selected.size}</strong> 条查询</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set(PROD_QUERIES.map(q => q.id)))} className="text-xs text-blue-600 hover:underline">全选</button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:underline">清空</button>
            </div>
          </div>
          {PROD_QUERIES.map(q => (
            <div
              key={q.id}
              onClick={() => toggleQuery(q.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                selected.has(q.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected.has(q.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {selected.has(q.id) && <CheckCircle size={10} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{q.query}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{q.kb} · {q.time}</div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                q.tier === 'Tier4' ? 'bg-red-100 text-red-700' :
                q.tier === 'Tier3' ? 'bg-orange-100 text-orange-700' :
                q.tier === 'Tier2' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>{q.tier}</span>
            </div>
          ))}
          <button
            onClick={() => setStep('config')}
            disabled={selected.size === 0}
            className="self-end px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            下一步 →
          </button>
        </div>
      )}

      {/* Step 2: Config */}
      {step === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {['版本 A (当前)', '版本 B (对比)'].map((label, vi) => (
            <div key={vi} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">{label}</h3>
              <div className="space-y-3">
                {[
                  { label: '检索管道', options: ['Hybrid', 'Vector', 'PageIndex', 'Graph+PageIndex'] },
                  { label: 'Rerank', options: ['启用', '禁用'] },
                  { label: 'Top-K', options: ['5', '8', '10', '15'] },
                  { label: 'LLM模型', options: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'] },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                    <select
                      defaultValue={vi === 1 ? f.options[1] : f.options[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    >
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="lg:col-span-2 flex items-center justify-between">
            <button onClick={() => setStep('sample')} className="text-xs px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              ← 上一步
            </button>
            <button onClick={startReplay} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              开始回放 ({selected.size} 条查询)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Running */}
      {step === 'running' && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <RefreshCw size={28} className="text-blue-600 animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-base font-semibold text-gray-800 mb-1">正在执行回放评测...</div>
            <div className="text-sm text-gray-500">已处理 {Math.round(progress / 100 * selected.size)}/{selected.size} 条查询</div>
          </div>
          <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-sm font-medium text-blue-600">{Math.round(progress)}%</div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'result' && (
        <div className="flex flex-col gap-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '版本A平均Faithfulness', value: (REPLAY_RESULTS.reduce((s, r) => s + r.v1_f, 0) / REPLAY_RESULTS.length).toFixed(3), good: false },
              { label: '版本B平均Faithfulness', value: (REPLAY_RESULTS.reduce((s, r) => s + r.v2_f, 0) / REPLAY_RESULTS.length).toFixed(3), good: true },
              { label: '平均提升', value: (avgDelta >= 0 ? '+' : '') + avgDelta.toFixed(3), good: avgDelta > 0 },
              { label: '版本B胜出', value: REPLAY_RESULTS.filter(r => r.win === 'v2').length + '/' + REPLAY_RESULTS.length, good: true },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className={`text-xl font-bold ${s.good ? 'text-green-600' : 'text-gray-800'}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">逐条对比</span>
              <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Download size={13} /> 导出
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['查询', 'A Faithfulness', 'B Faithfulness', '变化', 'A延迟', 'B延迟', '胜出'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {REPLAY_RESULTS.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{r.query}</td>
                    <td className="py-3 px-4 font-medium">{r.v1_f.toFixed(3)}</td>
                    <td className="py-3 px-4 font-medium">{r.v2_f.toFixed(3)}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${r.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.delta > 0 ? '+' : ''}{r.delta.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{r.v1_lat}ms</td>
                    <td className="py-3 px-4 text-gray-500">{r.v2_lat}ms</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.win === 'v2' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.win === 'v2' ? '版本B' : '版本A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
