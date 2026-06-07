import { useEffect, useMemo, useState } from 'react';
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
import { useRealApi } from '../services/http';
import { searchKb } from '../hooks/useKbData';
import { useLlmModels, useTenantModels } from '../hooks/useLlmData';
import {
  API_AVAILABLE_CHANNELS,
  API_RAG3_CHANNELS,
  buildRealRetrievalResult,
  fetchRag3ChannelResult,
  type RealApiChannel,
} from '../utils/retrievalTestApi';

interface RetrievalTestPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

const ALL_MOCK_CHANNELS: RetrievalChannel[] = ['vector', 'bm25', 'pageindex', 'graphrag', 'wiki'];

const MOCK_RESULT_TABS = ['分路', '融合对比', '精排前后'] as const;
const API_RESULT_TABS = ['分路', '混合检索', '精排前后'] as const;
type ResultTab = (typeof MOCK_RESULT_TABS)[number] | (typeof API_RESULT_TABS)[number];

const DEFAULT_API_CHANNELS: RealApiChannel[] = ['vector', 'bm25'];

export function RetrievalTestPage({ kbId, onNavigate }: RetrievalTestPageProps) {
  const [query, setQuery] = useState('违约金如何计算');
  const [threshold, setThreshold] = useState(0.2);
  const [vectorWeight, setVectorWeight] = useState(0.3);
  const [enabledChannels, setEnabledChannels] = useState<Set<RetrievalChannel>>(
    new Set(ALL_MOCK_CHANNELS),
  );
  const [apiChannels, setApiChannels] = useState<Set<RealApiChannel>>(new Set(DEFAULT_API_CHANNELS));
  const [useKg, setUseKg] = useState(false);
  const [keywordEnhance, setKeywordEnhance] = useState(false);
  const [useRerank, setUseRerank] = useState(true);
  const [rerankModel, setRerankModel] = useState(RERANK_MODEL_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullRetrievalResult | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('分路');
  const [channelTab, setChannelTab] = useState<RetrievalChannel>('vector');
  const [toast, setToast] = useState<string | null>(null);

  const { options: rerankOptions } = useLlmModels('rerank');
  const { data: tenantModels } = useTenantModels();

  const effectiveRerankId = useMemo(() => {
    if (!useRealApi) return undefined;
    if (rerankModel.includes('@')) return rerankModel;
    return tenantModels.rerank_id || rerankOptions.find(o => !o.disabled)?.value || undefined;
  }, [rerankModel, tenantModels.rerank_id, rerankOptions]);

  useEffect(() => {
    if (useRealApi && tenantModels.rerank_id) {
      setRerankModel(tenantModels.rerank_id);
    }
  }, [tenantModels.rerank_id]);

  const resultTabs = useRealApi ? API_RESULT_TABS : MOCK_RESULT_TABS;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const toggleMockChannel = (ch: RetrievalChannel) => {
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

  const toggleApiChannel = (ch: RealApiChannel) => {
    setApiChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) {
        if (next.size > 1) next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const canRunTest = useRealApi
    ? apiChannels.size > 0
    : enabledChannels.size > 0;

  const handleViewChunk = (hit: { chunkId: string; docId?: string }) => {
    if (!hit.docId) {
      showToast('该结果缺少 doc_id，无法跳转分块页');
      return;
    }
    onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: hit.docId });
  };

  const handleTest = async () => {
    if (!query.trim() || !canRunTest) return;
    setLoading(true);
    setResult(null);
    try {
      if (useRealApi) {
        const baseParams = {
          similarity_threshold: threshold,
          vector_similarity_weight: vectorWeight,
          top_k: 64,
          size: 10,
          keyword: keywordEnhance,
          use_kg: useKg,
        };
        const t0 = performance.now();
        const pre = await searchKb(kbId, query.trim(), baseParams);
        let post = null;
        const rerankMeta = {
          attempted: Boolean(useRerank && effectiveRerankId),
          error: null as string | null,
        };
        if (rerankMeta.attempted) {
          try {
            post = await searchKb(kbId, query.trim(), { ...baseParams, rerank_id: effectiveRerankId });
          } catch (rerankErr) {
            const msg = rerankErr instanceof Error ? rerankErr.message : 'Rerank 请求失败';
            rerankMeta.error = msg;
            showToast(`精排失败：${msg}。已展示精排前结果，请检查系统管理中的 Rerank API Key 与模型。`);
          }
        }
        const latencyMs = Math.round(performance.now() - t0);

        const ragflowChannels = [...apiChannels].filter(
          (ch): ch is 'vector' | 'bm25' | 'graphrag' => ch === 'vector' || ch === 'bm25' || ch === 'graphrag',
        );
        const res = buildRealRetrievalResult({
          query: query.trim(),
          pre,
          post,
          vectorWeight,
          enabledChannels: new Set(ragflowChannels),
          useKg,
          latencyMs,
          rerankMeta,
        });
        const rag3Channels = API_RAG3_CHANNELS.filter(ch => apiChannels.has(ch));
        if (rag3Channels.length) {
          const rag3Results = await Promise.all(
            rag3Channels.map(ch => fetchRag3ChannelResult(kbId, ch, query.trim())),
          );
          res.channels = [...res.channels, ...rag3Results];
          res.totalLatencyMs += rag3Results.reduce((s, c) => s + c.latencyMs, 0);
        }
        setResult(res);
        setChannelTab(res.channels[0]?.channel ?? 'vector');
      } else {
        await new Promise(r => setTimeout(r, 1100));
        const res = runMockFullChannelRetrieval(query.trim(), {
          enabledChannels: [...enabledChannels],
          useRerank,
          threshold,
        });
        setResult(res);
        setChannelTab(res.channels[0]?.channel ?? 'vector');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '检索失败');
    } finally {
      setLoading(false);
    }
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {useRealApi
                ? 'RAGFlow 混合检索 + RAG3 PageIndex/Wiki 通道 · GraphRAG 对应 use_kg'
                : '五通道分路 + Weighted RRF 融合对比（§10.5 mock）'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => showToast(useRealApi ? '评测样本 API 待 Phase 2 接入' : '已保存为评测样本（mock）')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <BookmarkPlus size={13} /> 保存为评测样本
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
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
                  {useRealApi ? (
                    <>
                      {API_AVAILABLE_CHANNELS.map(ch => (
                        <label key={ch} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={apiChannels.has(ch)}
                            onChange={() => toggleApiChannel(ch)}
                            className="rounded text-blue-600"
                          />
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_META[ch].color}`}>
                            {CHANNEL_META[ch].label}
                          </span>
                          {ch === 'graphrag' && (
                            <span className="text-[9px] text-gray-400">需开启知识图谱</span>
                          )}
                        </label>
                      ))}
                    </>
                  ) : (
                    ALL_MOCK_CHANNELS.map(ch => (
                      <label key={ch} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={enabledChannels.has(ch)}
                          onChange={() => toggleMockChannel(ch)}
                          className="rounded text-blue-600"
                        />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_META[ch].color}`}>
                          {CHANNEL_META[ch].label}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  相似度阈值 <span className="text-blue-600">{threshold}</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full" />
              </div>

              {useRealApi && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    向量权重 <span className="text-blue-600">{vectorWeight}</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1">（关键词 { (1 - vectorWeight).toFixed(2) }）</span>
                  </label>
                  <input type="range" min={0} max={1} step={0.05} value={vectorWeight} onChange={e => setVectorWeight(Number(e.target.value))} className="w-full" />
                </div>
              )}

              {useRealApi && (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-700 dark:text-gray-300">关键词增强（keyword）</span>
                  <input type="checkbox" checked={keywordEnhance} onChange={e => setKeywordEnhance(e.target.checked)} className="rounded text-blue-600" />
                </label>
              )}

              {useRealApi && (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-700 dark:text-gray-300">知识图谱（use_kg）</span>
                  <input type="checkbox" checked={useKg} onChange={e => setUseKg(e.target.checked)} className="rounded text-blue-600" />
                </label>
              )}

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
                    {useRealApi && rerankOptions.length > 0
                      ? rerankOptions.map(m => (
                        <option key={m.value} value={m.value} disabled={m.disabled}>{m.label}</option>
                      ))
                      : RERANK_MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {useRealApi && useRerank && !effectiveRerankId && (
                    <p className="text-[10px] text-amber-600 mt-1">未配置租户 Rerank 模型，精排前后将相同</p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-gray-500">元数据过滤</label>
                  <button
                    type="button"
                    onClick={() => showToast(useRealApi ? '元数据过滤 UI 待后续迭代' : 'mock 模式暂无')}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={10} /> 添加
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-[10px] text-gray-500 italic">暂无过滤条件</div>
              </div>

              <button
                type="button"
                onClick={handleTest}
                disabled={!query.trim() || loading || !canRunTest}
                className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><RefreshCw size={14} className="animate-spin" /> 检索中…</>
                  : <><Search size={14} /> {useRealApi ? '执行混合检索' : '执行全通道检索'}</>}
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

          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              {resultTabs.map(tab => (
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
                  {result.isRealApi
                    ? `延迟 ${result.totalLatencyMs}ms · 向量权重 ${result.vectorWeight ?? vectorWeight}`
                    : `总延迟 ${result.totalLatencyMs}ms · RRF k=${result.rrfK}`}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Search size={40} className="opacity-30" />
                  <p className="text-sm">{useRealApi ? '配置参数后点击「执行混合检索」' : '配置通道后点击「执行全通道检索」'}</p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600">
                  <RefreshCw size={32} className="animate-spin opacity-60" />
                  <p className="text-sm">
                    {useRealApi ? 'RAGFlow 混合检索' : '向量 · BM25 · PageIndex · GraphRAG · Wiki 并行召回…'}
                    {useRealApi && useRerank && effectiveRerankId ? ' + Rerank 对比' : ''}
                  </p>
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
                  {activeChannel && (
                    <ChannelPanel channel={activeChannel} onViewChunk={handleViewChunk} />
                  )}
                </div>
              )}

              {result && (resultTab === '融合对比' || resultTab === '混合检索') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {result.isRealApi
                        ? `混合检索 Top-${result.fusion.length}（similarity 降序）`
                        : `融合后（Weighted RRF k=${result.rrfK}）Top-${result.fusion.length}`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(useRealApi ? '导出 JSON 待接入' : 'JSON 已导出（mock）')}
                        className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800"
                      >
                        <Download size={12} /> 导出 JSON
                      </button>
                      {!result.isRealApi && (
                        <button type="button" onClick={() => showToast('与线上一致性：98.2%（mock）')} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800">
                          <GitCompare size={12} /> 与线上一致性对比
                        </button>
                      )}
                    </div>
                  </div>
                  {result.fusion.map(hit => (
                    <FusionHitCard
                      key={hit.chunkId}
                      hit={hit}
                      showRerank={false}
                      isRealApi={result.isRealApi}
                      onViewChunk={() => handleViewChunk(hit)}
                    />
                  ))}
                </div>
              )}

              {result && resultTab === '精排前后' && (
                <RerankComparePanel
                  result={result}
                  useRerank={useRerank}
                  rerankModelLabel={result.isRealApi
                    ? (effectiveRerankId || rerankModel || '未配置')
                    : rerankModel}
                  onViewChunk={handleViewChunk}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </KBDetailLayout>
  );
}

function RerankComparePanel({
  result,
  useRerank,
  rerankModelLabel,
  onViewChunk,
}: {
  result: FullRetrievalResult;
  useRerank: boolean;
  rerankModelLabel: string;
  onViewChunk: (hit: FusionHit) => void;
}) {
  const hasPre = result.fusion.length > 0;
  const hasPost = result.fusionReranked.length > 0;
  const rerankMeta = result.rerankMeta;
  const rerankAttempted = result.isRealApi
    ? Boolean(rerankMeta?.attempted)
    : useRerank;
  const postHits = hasPost
    ? result.fusionReranked
    : result.isRealApi && rerankAttempted
      ? []
      : result.fusion;

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {result.isRealApi
          ? `Rerank 精排对比 · ${rerankModelLabel}`
          : `Cross-Encoder 精排对比 · ${rerankModelLabel}`}
      </p>

      {!hasPre ? (
        <p className="text-xs text-gray-500">无满足阈值的检索结果，请调整问题或相似度阈值后重试</p>
      ) : !result.isRealApi || useRerank || hasPost ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">
              {result.isRealApi ? '精排前（混合 similarity）' : '精排前（WRRF）'}
            </h4>
            <div className="space-y-2">
              {result.fusion.map(hit => (
                <FusionHitCard
                  key={`pre-${hit.chunkId}`}
                  hit={hit}
                  showRerank={false}
                  compact
                  isRealApi={result.isRealApi}
                  onViewChunk={() => onViewChunk(hit)}
                />
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">精排后</h4>
            {hasPost || !result.isRealApi ? (
              <div className="space-y-2">
                {postHits.map(hit => (
                  <FusionHitCard
                    key={`post-${hit.chunkId}`}
                    hit={hit}
                    showRerank={hasPost && (result.isRealApi ? rerankAttempted : useRerank)}
                    compact
                    isRealApi={result.isRealApi}
                    onViewChunk={() => onViewChunk(hit)}
                  />
                ))}
              </div>
            ) : rerankMeta?.error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">精排请求失败</p>
                <p className="break-words">{rerankMeta.error}</p>
                <p className="mt-2 text-[10px] text-amber-700/80 dark:text-amber-300/80">
                  左侧为未精排结果。请检查系统管理 → 模型管理中的通义 Rerank API Key 与模型配置。
                </p>
              </div>
            ) : rerankAttempted ? (
              <p className="text-xs text-gray-500">精排返回空结果（可能阈值过高或候选集为空）</p>
            ) : (
              <p className="text-xs text-gray-500">请开启 Rerank 并配置租户 Rerank 模型以对比精排前后</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">请开启 Rerank 并配置租户 Rerank 模型以对比精排前后</p>
      )}
    </div>
  );
}

function ChannelPanel({
  channel,
  onViewChunk,
}: {
  channel: ChannelResult;
  onViewChunk: (hit: ChannelHit) => void;
}) {
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
            <button
              type="button"
              onClick={() => onViewChunk(hit)}
              className="text-[10px] text-blue-600 hover:underline mt-1.5"
            >
              查看 Chunk
            </button>
          </div>
        ))}
        {channel.hits.length === 0 && (
          <p className="text-xs text-gray-400 italic">无满足阈值的结果</p>
        )}
      </div>
    </div>
  );
}

function FusionHitCard({
  hit,
  showRerank,
  compact,
  isRealApi,
  onViewChunk,
}: {
  hit: FusionHit;
  showRerank: boolean;
  compact?: boolean;
  isRealApi?: boolean;
  onViewChunk?: () => void;
}) {
  const score = showRerank && hit.rerankScore != null ? hit.rerankScore : hit.wrrfScore;
  const scoreLabel = showRerank && hit.rerankScore != null
    ? 'Rerank'
    : isRealApi
      ? 'Similarity'
      : 'WRRF';

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${compact ? 'p-2.5' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs min-w-0">
          <span className="font-bold text-gray-400">#{hit.rank}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{hit.doc}</span>
          {hit.page != null && <span className="text-gray-500">P{hit.page}</span>}
          {hit.evalLabel === 'relevant' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">✅ 相关</span>
          )}
          {hit.evalLabel === 'false_positive' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">❌ 误召回</span>
          )}
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
          {onViewChunk && (
            <button type="button" onClick={onViewChunk} className="text-[10px] text-blue-600 hover:underline mt-1.5">
              查看 Chunk
            </button>
          )}
        </>
      )}
    </div>
  );
}
