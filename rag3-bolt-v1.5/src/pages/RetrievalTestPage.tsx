import { useState } from 'react';
import {
  Search, RefreshCw, Plus, Download, GitCompare, BookmarkPlus,
  ExternalLink, Layers,
} from 'lucide-react';
import { KBDetailLayout } from '../components/KBDetailLayout';
import { RERANK_MODEL_OPTIONS } from '../data/fusionMock';
import {
  CHANNEL_META,
  SAMPLE_QUERIES,
  runMockFullChannelRetrieval,
  type RetrievalChannel,
  type FullRetrievalResult,
  type ChannelResult,
  type FusionHit,
} from '../data/retrievalTestMock';

interface RetrievalTestPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

const ALL_CHANNELS: RetrievalChannel[] = ['vector', 'bm25', 'pageindex', 'graphrag', 'wiki'];

const RESULT_TABS = ['分路', '融合对比', '精排前后'] as const;
type ResultTab = (typeof RESULT_TABS)[number];

export function RetrievalTestPage({ kbId, onNavigate }: RetrievalTestPageProps) {
  const [query, setQuery] = useState('违约金如何计算');
  const [threshold, setThreshold] = useState(0.2);
  const [enabledChannels, setEnabledChannels] = useState<Set<RetrievalChannel>>(new Set(ALL_CHANNELS));
  const [useRerank, setUseRerank] = useState(true);
  const [rerankModel, setRerankModel] = useState(RERANK_MODEL_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullRetrievalResult | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('分路');
  const [channelTab, setChannelTab] = useState<RetrievalChannel>('vector');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const toggleChannel = (ch: RetrievalChannel) => {
    setEnabledChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) {
        if (next.size > 1) next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleTest = () => {
    if (!query.trim() || enabledChannels.size === 0) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const res = runMockFullChannelRetrieval(query.trim(), {
        enabledChannels: [...enabledChannels],
        useRerank,
        threshold,
      });
      setResult(res);
      const first = res.channels[0]?.channel ?? 'vector';
      setChannelTab(first);
      setLoading(false);
    }, 1100);
  };

  const activeChannel = result?.channels.find(c => c.channel === channelTab);

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-retrieval-test" onNavigate={onNavigate}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">检索测试</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">五通道分路 + Weighted RRF 融合对比（§10.5）</p>
          </div>
          <button
            type="button"
            onClick={() => showToast('已保存为评测样本（mock）')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <BookmarkPlus size={13} /> 保存为评测样本
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 左侧配置 */}
          <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">测试问题</label>
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SAMPLE_QUERIES.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuery(q)}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-blue-50 hover:text-blue-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">通道启用</label>
                <div className="space-y-1.5">
                  {ALL_CHANNELS.map(ch => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={enabledChannels.has(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded text-blue-600"
                      />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_META[ch].color}`}>
                        {CHANNEL_META[ch].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  相似度阈值 <span className="text-blue-600">{threshold}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full" />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-gray-700 dark:text-gray-300">Rerank 精排</span>
                <input type="checkbox" checked={useRerank} onChange={e => setUseRerank(e.target.checked)} className="rounded text-blue-600" />
              </label>

              {useRerank && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Rerank 模型</label>
                  <select
                    value={rerankModel}
                    onChange={e => setRerankModel(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    {RERANK_MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-gray-500">元数据过滤</label>
                  <button type="button" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <Plus size={10} /> 添加
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-[10px] text-gray-500 italic">暂无过滤条件</div>
              </div>

              <button
                type="button"
                onClick={handleTest}
                disabled={!query.trim() || loading || enabledChannels.size === 0}
                className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? <><RefreshCw size={14} className="animate-spin" /> 全通道检索中...</> : <><Search size={14} /> 执行全通道检索</>}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('sys-fusion')}
                className="w-full py-2 text-xs text-indigo-600 hover:underline flex items-center justify-center gap-1"
              >
                <Layers size={12} /> 融合配置（全局）
                <ExternalLink size={10} />
              </button>
            </div>
          </div>

          {/* 右侧结果 */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              {RESULT_TABS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResultTab(tab)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                    resultTab === tab
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
              {result && (
                <span className="ml-auto text-[10px] text-gray-400 pb-2">
                  总延迟 {result.totalLatencyMs}ms · RRF k={result.rrfK}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Search size={40} className="opacity-30" />
                  <p className="text-sm">配置通道后点击「执行全通道检索」</p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600">
                  <RefreshCw size={32} className="animate-spin opacity-60" />
                  <p className="text-sm">向量 · BM25 · PageIndex · GraphRAG · Wiki 并行召回…</p>
                </div>
              )}

              {result && resultTab === '分路' && (
                <div className="space-y-4">
                  <div className="flex gap-1 flex-wrap">
                    {result.channels.map(ch => (
                      <button
                        key={ch.channel}
                        type="button"
                        onClick={() => setChannelTab(ch.channel)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          channelTab === ch.channel
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                  {activeChannel && <ChannelPanel channel={activeChannel} />}
                </div>
              )}

              {result && resultTab === '融合对比' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      融合后（Weighted RRF k={result.rrfK}）Top-{result.fusion.length}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => showToast('JSON 已导出（mock）')} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800">
                        <Download size={12} /> 导出 JSON
                      </button>
                      <button type="button" onClick={() => showToast('与线上一致性：98.2%（mock）')} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800">
                        <GitCompare size={12} /> 与线上一致性对比
                      </button>
                    </div>
                  </div>
                  {result.fusion.map(hit => (
                    <FusionHitCard key={hit.chunkId} hit={hit} showRerank={false} />
                  ))}
                </div>
              )}

              {result && resultTab === '精排前后' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Cross-Encoder 精排对比 · {rerankModel}
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">精排前（WRRF）</h4>
                      <div className="space-y-2">
                        {result.fusion.map(hit => (
                          <FusionHitCard key={`pre-${hit.chunkId}`} hit={hit} showRerank={false} compact />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">精排后</h4>
                      <div className="space-y-2">
                        {(useRerank ? result.fusionReranked : result.fusion).map(hit => (
                          <FusionHitCard key={`post-${hit.chunkId}`} hit={hit} showRerank compact />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </KBDetailLayout>
  );
}

function ChannelPanel({ channel }: { channel: ChannelResult }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${CHANNEL_META[channel.channel].color}`}>
          {channel.label}
        </span>
        <span className="text-xs text-gray-500">Top-{channel.hits.length} · 延迟 {channel.latencyMs}ms</span>
      </div>
      <div className="space-y-2">
        {channel.hits.map(hit => (
          <div key={hit.chunkId} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-gray-400">#{hit.rank}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{hit.doc}</span>
                {hit.page != null && <span className="text-gray-500">P{hit.page}</span>}
              </div>
              <span className="text-xs font-bold text-blue-600">{hit.score.toFixed(3)}</span>
            </div>
            {hit.section && <p className="text-[10px] text-gray-500 italic mb-1">{hit.section}</p>}
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{hit.snippet}</p>
            <button type="button" className="text-[10px] text-blue-600 hover:underline mt-1.5">查看 Chunk</button>
          </div>
        ))}
        {channel.hits.length === 0 && (
          <p className="text-xs text-gray-400 italic">无满足阈值的结果</p>
        )}
      </div>
    </div>
  );
}

function FusionHitCard({ hit, showRerank, compact }: { hit: FusionHit; showRerank: boolean; compact?: boolean }) {
  const score = showRerank && hit.rerankScore != null ? hit.rerankScore : hit.wrrfScore;
  const scoreLabel = showRerank && hit.rerankScore != null ? 'Rerank' : 'WRRF';

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${compact ? 'p-2.5' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs min-w-0">
          <span className="font-bold text-gray-400">#{hit.rank}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{hit.doc}</span>
          {hit.page != null && <span className="text-gray-500">P{hit.page}</span>}
          <div className="flex gap-1">
            {hit.sources.map(s => (
              <span key={s} className={`text-[9px] px-1 py-0.5 rounded ${CHANNEL_META[s].color}`}>{CHANNEL_META[s].label}</span>
            ))}
          </div>
        </div>
        <span className="text-xs font-bold text-indigo-600 flex-shrink-0">{scoreLabel} {score.toFixed(3)}</span>
      </div>
      {!compact && (
        <>
          {hit.section && <p className="text-[10px] text-gray-500 italic mt-1">{hit.section}</p>}
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{hit.snippet}</p>
          <button type="button" className="text-[10px] text-blue-600 hover:underline mt-1.5">查看 Chunk</button>
        </>
      )}
    </div>
  );
}
