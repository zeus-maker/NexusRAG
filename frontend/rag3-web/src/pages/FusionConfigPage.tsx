import { useState, useEffect } from 'react';
import { Layers, Save, Play, Eye } from 'lucide-react';
import { SystemSubNav, TableCard } from '../components/SystemSubNav';
import { useFusionConfig, systemService } from '../hooks/useSystemData';
import { useApiMode } from '../services/http';
import {
  DEFAULT_FUSION_CONFIG,
  CONFLICT_POLICY_LABEL,
  DEDUP_STRATEGY_LABEL,
  RERANK_MODEL_OPTIONS,
  type FusionConfig,
  type ConflictPolicy,
  type DedupStrategy,
} from '../data/fusionMock';

interface FusionConfigPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

export function FusionConfigPage({ onNavigate }: FusionConfigPageProps) {
  const apiMode = useApiMode();
  const { data: apiConfig, loading, error, refresh } = useFusionConfig();
  const [config, setConfig] = useState<FusionConfig>(DEFAULT_FUSION_CONFIG);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (apiMode && apiConfig) setConfig(apiConfig);
  }, [apiMode, apiConfig]);

  const handlePreview = () => {
    const weightSum = config.channelWeights.reduce((s, c) => s + c.weight, 0);
    if (apiMode) {
      showToast(`预览：RRF k=${config.rrfK} · 通道权重 ${weightSum.toFixed(2)} · 精排 Top-${config.rerankTopN}`);
      return;
    }
    showToast('融合预览已生成（mock）');
  };

  const handleTest = () => {
    const ok = config.rerankTopN > 0 && config.channelWeights.every(c => c.weight >= 0);
    if (apiMode) {
      showToast(ok ? '融合参数校验通过' : '参数无效，请检查 Top-K 与权重');
      return;
    }
    showToast('融合配置测试通过');
  };

  const handleSave = async () => {
    if (apiMode) {
      try {
        await systemService.putFusionConfig(config);
        refresh();
        showToast('融合配置已保存');
      } catch (e) {
        showToast((e as Error).message || '保存失败');
      }
      return;
    }
    showToast('融合配置已保存');
  };

  const updateTopK = (key: keyof FusionConfig['topK'], val: number) => {
    setConfig(prev => ({ ...prev, topK: { ...prev.topK, [key]: val } }));
  };

  const updateWeight = (idx: number, weight: number) => {
    setConfig(prev => ({
      ...prev,
      channelWeights: prev.channelWeights.map((c, i) => i === idx ? { ...c, weight } : c),
    }));
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">系统管理</h1>
        {onNavigate && <SystemSubNav currentPage="sys-fusion" onNavigate={onNavigate} />}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" /> 融合与精排配置
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">L4 召回漏斗 Top-K · Weighted RRF · Cross-Encoder 精排（§11.8.1）</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handlePreview} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Eye size={14} /> 预览融合效果
          </button>
          <button type="button" onClick={handleTest} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Play size={14} /> 测试
          </button>
          <button type="button" onClick={handleSave} disabled={loading && apiMode} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> 保存
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">召回阶段（漏斗 Top-K）</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {([
            ['vector', '向量召回 Top-K'],
            ['bm25', 'BM25 Top-K'],
            ['pageindex', 'PageIndex'],
            ['graphrag_local', 'GraphRAG Local'],
            ['wiki', 'Wiki'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                min={1}
                max={500}
                value={config.topK[key]}
                onChange={e => updateTopK(key, Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Weighted RRF（源 §33.7）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">RRF 常数 k</label>
            <input
              type="number"
              min={1}
              max={120}
              value={config.rrfK}
              onChange={e => setConfig(prev => ({ ...prev, rrfK: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">冲突消解</label>
            <select
              value={config.conflictPolicy}
              onChange={e => setConfig(prev => ({ ...prev, conflictPolicy: e.target.value as ConflictPolicy }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            >
              {Object.entries(CONFLICT_POLICY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">去重策略</label>
            <select
              value={config.dedupStrategy}
              onChange={e => setConfig(prev => ({ ...prev, dedupStrategy: e.target.value as DedupStrategy }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            >
              {Object.entries(DEDUP_STRATEGY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <TableCard minWidth={560}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">通道</th>
                <th className="px-4 py-3 font-medium">信任权重</th>
                <th className="px-4 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {config.channelWeights.map((row, idx) => (
                <tr key={row.channel} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{row.channel}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      max={3}
                      step={0.1}
                      value={row.weight}
                      onChange={e => updateWeight(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">精排阶段（Cross-Encoder）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">精排模型</label>
            <select
              value={config.rerankModel}
              onChange={e => setConfig(prev => ({ ...prev, rerankModel: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            >
              {RERANK_MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">精排 Top-N</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.rerankTopN}
              onChange={e => setConfig(prev => ({ ...prev, rerankTopN: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={config.conflictAnnotate}
            onChange={e => setConfig(prev => ({ ...prev, conflictAnnotate: e.target.checked }))}
            className="rounded"
          />
          冲突标注（答案侧高亮矛盾片段）
        </label>
      </div>
    </div>
  );
}
