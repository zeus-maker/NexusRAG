import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquareWarning, TrendingUp, ChevronDown, X } from 'lucide-react';
import { EvalSubNav } from '../components/EvalSubNav';
import {
  SATISFACTION_SUMMARY, SATISFACTION_TREND, NEGATIVE_REASONS, NEGATIVE_CASES, type NegativeCase,
} from '../data/evalMock';
import { mockKBs } from '../mockData';
import { useSatisfaction } from '../hooks/useEvalData';
import { useKnowledgeBaseList } from '../hooks/useKbData';
import { useApiMode } from '../services/http';

interface EvalSatisfactionPageProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function EvalSatisfactionPage({ onNavigate }: EvalSatisfactionPageProps) {
  const apiMode = useApiMode();
  const [period, setPeriod] = useState('30d');
  const [kbFilter, setKbFilter] = useState('');
  const [detailCase, setDetailCase] = useState<NegativeCase | null>(null);
  const { data: satData } = useSatisfaction(period);
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = apiMode ? (kbList?.items ?? []) : mockKBs;
  const s = satData.summary;
  const negatives = satData.negatives;
  const periodLabel = period === '7d' ? '近 7 天' : period === '90d' ? '近 90 天' : '近 30 天';
  const trendScale = period === '7d' ? 0.5 : period === '90d' ? 1.2 : 1;
  const scaledTrend = (apiMode && satData.trend.length
    ? satData.trend.map((p: { positive_rate?: number }) => (p.positive_rate ?? 0) * 100)
    : SATISFACTION_TREND.map(v => Math.min(100, v * trendScale)));
  const maxTrend = Math.max(...scaledTrend, 1);

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">评测中心</h1>
        <EvalSubNav currentPage="eval-satisfaction" onNavigate={onNavigate} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">用户满意度分析（US-4.9）</p>
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
            {kbs.slice(0, 20).map(kb => <option key={kb.kb_id} value={kb.kb_id}>{kb.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '好评率', value: `${s.positiveRate}%`, icon: <ThumbsUp size={18} className="text-green-500" />, bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: '差评率', value: `${s.negativeRate}%`, icon: <ThumbsDown size={18} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: '纠错率', value: `${s.correctionRate}%`, icon: <MessageSquareWarning size={18} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'NPS', value: `+${s.nps}`, icon: <TrendingUp size={18} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className={`${card.bg} w-9 h-9 rounded-lg flex items-center justify-center mb-2`}>{card.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">满意度趋势（{periodLabel}）</h3>
        <div className="flex items-end gap-1 h-28">
          {scaledTrend.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t opacity-80 hover:opacity-100 transition-opacity"
              style={{ height: `${(v / maxTrend) * 100}%` }}
              title={`${v}%`}
            />
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">GET /api/v1/eval/satisfaction/trend</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">差评原因分布</h3>
          <div className="space-y-3">
            {NEGATIVE_REASONS.map(r => (
              <div key={r.reason}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{r.reason}</span>
                  <span className="text-gray-500">{r.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${r.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">低满意度对话 Top 10</h3>
          <div className="space-y-2">
            {negatives.map((c, i) => (
              <div key={c.convId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <button type="button" onClick={() => setDetailCase(c)} className="min-w-0 text-left flex-1">
                  <span className="text-[10px] text-gray-400 mr-2">#{i + 1}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.title}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{c.reason}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('chat', { selectedConvId: c.convId })}
                  className="text-[10px] text-blue-600 hover:underline flex-shrink-0 ml-2"
                >
                  对话
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailCase && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDetailCase(null)} />
          <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">差评详情</h3>
              <button type="button" onClick={() => setDetailCase(null)}><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-xs text-gray-500">{detailCase.kbName} · {detailCase.reason}</p>
              {detailCase.query && <div><p className="text-xs text-gray-500">用户问题</p><p className="text-gray-800 dark:text-gray-200">{detailCase.query}</p></div>}
              {detailCase.answer && <div><p className="text-xs text-gray-500">系统回答</p><p className="text-red-600 dark:text-red-400">{detailCase.answer}</p></div>}
              {detailCase.feedback && <div><p className="text-xs text-gray-500">用户反馈</p><p className="text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">{detailCase.feedback}</p></div>}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => { setDetailCase(null); onNavigate('eval-datasets'); }} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg">加入评测集</button>
              <button type="button" onClick={() => { setDetailCase(null); onNavigate('chat', { selectedConvId: detailCase.convId }); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg">查看对话</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
