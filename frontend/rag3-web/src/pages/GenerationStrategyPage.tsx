import { useState, useEffect } from 'react';
import { Sparkles, Save, Play } from 'lucide-react';
import { SystemSubNav, TableCard } from '../components/SystemSubNav';
import { GENERATION_STRATEGY_ROWS } from '../data/fusionMock';
import { useGenerationStrategy, systemService } from '../hooks/useSystemData';
import { useApiMode } from '../services/http';

interface GenerationStrategyPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

const AGENT_OPTIONS = ['法务问答 Agent', '财报分析 Agent', '合同审查 Agent', '通用 RAG Agent'];

export function GenerationStrategyPage({ onNavigate }: GenerationStrategyPageProps) {
  const apiMode = useApiMode();
  const { data: genData, refresh } = useGenerationStrategy();
  const [strategies, setStrategies] = useState(GENERATION_STRATEGY_ROWS);
  const [selectedAgent, setSelectedAgent] = useState(AGENT_OPTIONS[0]);
  const [refusalText, setRefusalText] = useState('抱歉，该问题超出知识库范围或您暂无访问权限，请联系管理员。');
  const [toolWhitelist, setToolWhitelist] = useState('search_kb, calc, web_fetch');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (apiMode && genData?.strategies?.length) setStrategies(genData.strategies);
  }, [apiMode, genData]);

  const handleSave = async () => {
    if (apiMode) {
      try {
        await systemService.putGenerationStrategy({
          strategies,
          activeType: genData?.activeType || 'single_rag',
        });
        refresh();
        showToast('生成策略已保存');
      } catch (e) {
        showToast((e as Error).message || '保存失败');
      }
      return;
    }
    showToast('生成策略已保存');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">系统管理</h1>
        {onNavigate && <SystemSubNav currentPage="sys-generation-strategy" onNavigate={onNavigate} />}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-600" /> 生成策略路由
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tier 默认 · max_iter · 工具调用 · 多 Agent 协作（§11.8.3）</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => showToast('生成策略测试通过')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Play size={14} /> 测试
          </button>
          <button type="button" onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={14} /> 保存
          </button>
        </div>
      </div>

      <TableCard minWidth={720}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">策略类型</th>
              <th className="px-4 py-3 font-medium">Tier 默认</th>
              <th className="px-4 py-3 font-medium">max_iter</th>
              <th className="px-4 py-3 font-medium">工具调用</th>
              <th className="px-4 py-3 font-medium">多 Agent</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map(row => (
              <tr key={row.type} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{row.label}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.tierDefault}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.maxIter}</td>
                <td className="px-4 py-3">{row.toolCall ? '✓' : '✗'}</td>
                <td className="px-4 py-3">{row.multiAgent ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">拒答话术</label>
          <textarea
            value={refusalText}
            onChange={e => setRefusalText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">工具白名单（逗号分隔）</label>
          <input
            value={toolWhitelist}
            onChange={e => setToolWhitelist(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Agent 画布绑定</label>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
          >
            {AGENT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
