import { useMemo, useState } from 'react';
import {
  X, Download, AlertTriangle, CheckCircle2, BarChart3, ListChecks, FileWarning,
} from 'lucide-react';
import type { EvalDataset, FailureCase } from '../data/evalMock';
import type { EvalRun } from '../types';
import { useRunScores } from '../hooks/useEvalData';

const METRIC_META: Record<string, { label: string; desc: string; lowerBetter?: boolean }> = {
  faithfulness: { label: 'Faithfulness', desc: '答案忠实度' },
  answer_relevancy: { label: 'Answer Relevancy', desc: '答案相关性' },
  context_precision: { label: 'Context Precision', desc: '上下文精确度' },
  context_recall: { label: 'Context Recall', desc: '上下文召回' },
  hallucination_rate: { label: 'Hallucination Rate', desc: '幻觉率', lowerBetter: true },
  'recall@10': { label: 'Recall@10', desc: '检索召回（代理）' },
  mrr: { label: 'MRR', desc: '平均倒数排名' },
  hit_rate: { label: 'Hit Rate', desc: '检索命中率' },
  retrieval_hit_count: { label: '检索片段数', desc: '平均检索命中条数' },
};

function formatEta(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '估算中…';
  if (seconds < 60) return `约 ${seconds} 秒`;
  const min = Math.ceil(seconds / 60);
  return min < 60 ? `约 ${min} 分钟` : `约 ${Math.floor(min / 60)} 小时 ${min % 60} 分`;
}

function ProgressBar({ run }: { run: EvalRun }) {
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

function MetricCard({ name, value }: { name: string; value: number }) {
  const meta = METRIC_META[name] || { label: name, desc: name };
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const good = meta.lowerBetter ? value < 0.3 : value >= 0.7;
  return (
    <div className={`p-3 rounded-xl border ${good ? 'bg-green-50/80 dark:bg-green-900/15 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
      <p className="text-[10px] text-gray-500">{meta.label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value.toFixed(3)}</p>
      <p className="text-[10px] text-gray-400">{meta.desc}</p>
      <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${good ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${meta.lowerBetter ? 100 - pct : pct}%` }}
        />
      </div>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value?: number }) {
  if (value == null || Number.isNaN(value)) return null;
  const ok = value >= 0.7;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] tabular-nums ${ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
      {label} {value.toFixed(2)}
    </span>
  );
}

function SampleRow({
  item,
  onSelect,
}: {
  item: FailureCase;
  onSelect: (c: FailureCase) => void;
}) {
  const m = item.metrics || {};
  const hits = m.retrieval_hit_count ?? 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
          #{item.rank} {item.query}
        </p>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{hits > 0 ? `${hits} 片段` : '无检索'}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        <ScoreChip label="F" value={m.faithfulness} />
        <ScoreChip label="AR" value={m.answer_relevancy} />
        <ScoreChip label="CP" value={m.context_precision} />
        <ScoreChip label="R@10" value={m['recall@10']} />
      </div>
    </button>
  );
}

export interface EvalRunDetailModalProps {
  run: EvalRun;
  kbName?: string;
  datasets: EvalDataset[];
  onClose: () => void;
  onExport: (runId: string) => void;
  onSelectCase: (c: FailureCase) => void;
}

export function EvalRunDetailModal({
  run,
  kbName,
  datasets,
  onClose,
  onExport,
  onSelectCase,
}: EvalRunDetailModalProps) {
  const [tab, setTab] = useState<'overview' | 'all' | 'failures'>('overview');
  const failuresOnly = tab === 'failures';
  const { data: scoresData, loading } = useRunScores(run.run_id, {
    failuresOnly,
    pageSize: failuresOnly ? 10 : 50,
    sortBy: 'faithfulness',
    sortOrder: failuresOnly ? 'asc' : 'desc',
    pollMs: run.status === 'running' ? 5000 : undefined,
  });

  const items = scoresData.items;
  const datasetLabel = run.dataset_name || datasets.find(d => d.id === run.dataset_id)?.name || '评测集';

  const overviewMetrics = useMemo(() => {
    const keys = [
      'faithfulness', 'answer_relevancy', 'context_precision', 'hallucination_rate',
      'recall@10', 'mrr', 'hit_rate',
    ];
    const fromSummary = run.metrics_summary || {};
    const merged: Record<string, number> = { ...run.scores };
    for (const k of keys) {
      if (fromSummary[k] != null) merged[k] = Number(fromSummary[k]);
    }
    if (fromSummary.retrieval_hit_count != null) {
      merged.retrieval_hit_count = Number(fromSummary.retrieval_hit_count);
    }
    return keys
      .filter(k => merged[k] != null && !Number.isNaN(merged[k]))
      .map(k => ({ key: k, value: merged[k] }));
  }, [run]);

  const distribution = useMemo(() => {
    const buckets = [
      { label: '≥0.9', min: 0.9, max: 1.01, count: 0 },
      { label: '0.7–0.9', min: 0.7, max: 0.9, count: 0 },
      { label: '0.5–0.7', min: 0.5, max: 0.7, count: 0 },
      { label: '<0.5', min: -0.01, max: 0.5, count: 0 },
    ];
    for (const item of scoresData.items) {
      const f = item.metrics?.faithfulness ?? item.score;
      if (f == null) continue;
      const b = buckets.find(x => f >= x.min && f < x.max);
      if (b) b.count += 1;
    }
    return buckets;
  }, [scoresData.items]);

  const lowScoreCount = useMemo(
    () => scoresData.items.filter(i => (i.metrics?.faithfulness ?? i.score) < 0.7).length,
    [scoresData.items],
  );

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: BarChart3 },
    { id: 'all' as const, label: `全部样本 (${scoresData.totalCases || run.test_set_size})`, icon: ListChecks },
    { id: 'failures' as const, label: `低分案例 (${tab === 'failures' ? scoresData.total : lowScoreCount})`, icon: FileWarning },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between gap-4 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">评测详情 · {run.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
              <span>{run.status === 'completed' ? '✅ 已完成' : run.status === 'running' ? '⏳ 运行中' : run.status}</span>
              <span>{kbName || '知识库'}</span>
              <span>{datasetLabel}</span>
              <span>{run.test_set_size} 条样本</span>
              {run.duration_min != null && <span>{run.duration_min} 分钟</span>}
              <span>{run.started_at}</span>
            </p>
            {run.evaluation_type && (
              <p className="text-[10px] text-gray-400 mt-1">
                类型 {run.evaluation_type}
                {run.metrics_requested?.length ? ` · 指标 ${run.metrics_requested.join(', ')}` : ''}
              </p>
            )}
            {run.status === 'running' && <ProgressBar run={run} />}
          </div>
          <div className="flex items-start gap-2 flex-shrink-0">
            {run.status === 'completed' && (
              <button
                type="button"
                onClick={() => onExport(run.run_id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Download size={12} /> 导出
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        {(run.diagnosis || run.error_message) && (
          <div className="mx-6 mt-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{run.diagnosis || run.error_message}</span>
          </div>
        )}

        {run.zero_retrieval_cases != null && run.zero_retrieval_cases > 0 && (
          <div className="mx-6 mt-2 text-[10px] text-gray-500">
            检索为空样本：{run.zero_retrieval_cases}/{run.test_set_size}
          </div>
        )}

        <div className="px-6 pt-4 flex gap-1 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {overviewMetrics.map(({ key, value }) => (
                  <MetricCard key={key} name={key} value={value} />
                ))}
              </div>
              {run.status === 'completed' && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Faithfulness 分布</h4>
                  <div className="space-y-2">
                    {distribution.map(b => (
                      <div key={b.label} className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-gray-500 tabular-nums">{b.label}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${scoresData.totalCases ? (b.count / scoresData.totalCases) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500 tabular-nums">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {run.status === 'completed' && scoresData.total === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 size={16} />
                  暂无低于阈值的低分案例（faithfulness ≥ 0.7）
                </div>
              )}
            </div>
          )}

          {(tab === 'all' || tab === 'failures') && (
            <div>
              {loading ? (
                <p className="text-xs text-gray-400 py-8 text-center">加载样本结果中…</p>
              ) : items.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">
                  {tab === 'failures' ? '暂无低于阈值的失败案例' : '暂无样本结果（任务可能仍在运行）'}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <SampleRow key={`${item.rank}-${item.caseId || item.query}`} item={item} onSelect={onSelectCase} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
