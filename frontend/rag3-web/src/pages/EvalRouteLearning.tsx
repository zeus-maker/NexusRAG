import { useState } from 'react';
import { Brain, Upload, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { EvalSubNav } from '../components/EvalSubNav';
import { ROUTE_LEARNING } from '../data/evalMock';
import { useRouteLearning } from '../hooks/useEvalData';
import { evalService } from '../services/evalService';
import { useApiMode } from '../services/http';

interface EvalRouteLearningPageProps {
  onNavigate: (page: string) => void;
}

export function EvalRouteLearningPage({ onNavigate }: EvalRouteLearningPageProps) {
  const apiMode = useApiMode();
  const [training, setTraining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { data: rl, refresh } = useRouteLearning();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleTrain = async () => {
    setTraining(true);
    if (apiMode) {
      try {
        const res = await evalService.trainRouteLearning();
        showToast(`训练完成，准确率 ${(res.data.accuracy * 100).toFixed(1)}%`);
        refresh();
      } catch (e) {
        showToast((e as Error).message || '训练失败');
      } finally {
        setTraining(false);
      }
      return;
    }
    setTimeout(() => { setTraining(false); showToast('路由模型训练完成，准确率 94.2%'); }, 2000);
  };

  const handlePublish = async () => {
    if (apiMode) {
      try {
        await evalService.publishRouteLearning();
        showToast('已发布到生产');
        refresh();
      } catch (e) {
        showToast((e as Error).message || '发布失败');
      }
      return;
    }
    showToast('已发布（演示）');
  };

  const handleRollback = async () => {
    if (apiMode) {
      try {
        await evalService.rollbackRouteLearning();
        showToast('已回滚上一版本');
        refresh();
      } catch (e) {
        showToast((e as Error).message || '回滚失败');
      }
      return;
    }
    showToast('已回滚（演示）');
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-route-learning" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">路由在线学习</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">基于生产反馈优化四分类器路由矩阵（§11.3.7）</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => showToast('样本导入（占位）')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800">
            <Upload size={14} /> 导入样本
          </button>
          <button type="button" onClick={handleTrain} disabled={training} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {training ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
            {training ? '训练中…' : '触发训练'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '当前模型', value: rl.modelVersion, sub: rl.status === 'ready' ? '✅ 已发布' : '草稿' },
          { label: '路由准确率', value: `${(rl.accuracy * 100).toFixed(1)}%`, sub: '验证集' },
          { label: '训练样本', value: rl.samples.toLocaleString(), sub: '累计' },
          { label: '待审核', value: String(rl.pendingReview), sub: '人工复核队列' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{c.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Brain size={16} /> Tier 分布（训练集）
          </h3>
          <div className="space-y-3">
            {rl.tiers.map(t => (
              <div key={t.tier}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{t.tier}</span>
                  <span className="text-gray-500">{t.count.toLocaleString()} ({t.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">版本与操作</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{rl.modelVersion} · 生产环境</p>
                <p className="text-xs text-gray-500">最近训练 {rl.lastTrain}</p>
              </div>
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">v2.0 · 可回滚</p>
                <p className="text-xs text-gray-500">准确率 92.8%</p>
              </div>
              <button type="button" onClick={() => void handleRollback()} className="text-xs text-blue-600 hover:underline">回滚</button>
            </div>
            <button type="button" onClick={() => void handlePublish()} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              发布当前模型
            </button>
            <p className="text-[10px] text-gray-400">API: POST /api/v1/eval/route-learning/train · publish · rollback</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-300">待审核样本 {rl.pendingReview} 条</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">人工标注 Tier 标签后可加入下一轮训练。跳转 <button type="button" onClick={() => onNavigate('sys-classifier')} className="underline">分类器路由</button> 查看矩阵。</p>
        </div>
      </div>
    </div>
  );
}
