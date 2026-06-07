import { useState } from 'react';
import { Route, Save, Play } from 'lucide-react';
import { SystemSubNav } from '../components/SystemSubNav';
import {
  DEFAULT_RETRIEVAL_STRATEGY,
  ROUTER_MODE_LABEL,
  CHANNEL_OPTIONS,
  runMockRetrievalTest,
  type RetrievalRouterMode,
  type RetrievalTestResult,
} from '../data/fusionMock';

interface RetrievalStrategyPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

export function RetrievalStrategyPage({ onNavigate }: RetrievalStrategyPageProps) {
  const [config, setConfig] = useState(DEFAULT_RETRIEVAL_STRATEGY);
  const [testQuery, setTestQuery] = useState('AMD收购Xilinx的影响');
  const [testResult, setTestResult] = useState<RetrievalTestResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const runTest = () => {
    const result = runMockRetrievalTest(testQuery);
    setTestResult(result);
    showToast('路由测试完成');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">系统管理</h1>
        {onNavigate && <SystemSubNav currentPage="sys-retrieval-strategy" onNavigate={onNavigate} />}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Route size={18} className="text-violet-600" /> 检索策略路由
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">LLM-as-Router · 决策树 · Primary/Secondary 通道（§11.8.2）</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={runTest} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Play size={14} /> 测试
          </button>
          <button type="button" onClick={() => showToast('检索策略已保存')} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={14} /> 保存
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">路由模式</h3>
        <div className="flex flex-wrap gap-4">
          {(Object.entries(ROUTER_MODE_LABEL) as [RetrievalRouterMode, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="router-mode"
                checked={config.mode === key}
                onChange={() => setConfig(prev => ({ ...prev, mode: key }))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">决策树预览（源 §27.2）</h3>
        <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          {config.decisionTree.join('\n')}
        </pre>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary</label>
            <select
              value={config.primary}
              onChange={e => setConfig(prev => ({ ...prev, primary: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            >
              {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Secondary</label>
            <select
              value={config.secondary}
              onChange={e => setConfig(prev => ({ ...prev, secondary: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            >
              {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">测试查询</label>
            <input
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
              placeholder="输入测试查询…"
            />
          </div>
          <button type="button" onClick={runTest} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            运行路由
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg text-sm">
            <span className="text-gray-600 dark:text-gray-400">「{testResult.query}」→ </span>
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              primary={testResult.primary}
            </span>
            <span className="text-gray-500"> · secondary={testResult.secondary} · </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{(testResult.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
