import { useState, useMemo, useEffect } from 'react';
import {
  GitBranch, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Search, Eye, RefreshCw, Folder, FolderOpen, Settings, Play, RotateCcw,
  SkipForward, Zap, Target, Layers, ArrowLeft, MessageSquare, Box, Pause,
  BarChart2, Clock, TrendingUp,
} from 'lucide-react';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../../components/hubUi';
import { mockKBs } from '../../mockData';
import {
  PAGEINDEX_STATS, PAGEINDEX_DOCUMENTS, PAGEINDEX_TREE_V5, PAGEINDEX_DEFAULT_SETTINGS,
  PAGEINDEX_BUILD_QUEUE, PAGEINDEX_PIPELINE_STEPS, PAGEINDEX_ANALYTICS, BUILD_STAGE_LABEL,
  getPageIndexActiveBuildJobs, getPageIndexDoc, getPageIndexTree, findTreeNode,
  getNodePreviewBbox, runMockTreeSearch, runMockLibrarySearch,
  type PageIndexDocument, type PageIndexDocStatus, type PageIndexTreeNode,
  type PageIndexSearchResult, type PageIndexSearchMode, type PageIndexLibrarySearchResult,
  type PageIndexBbox,
} from '../../data/pageIndexMock';

interface PageIndexHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

const DOC_STATUS: Record<PageIndexDocStatus, { variant: 'active' | 'indexing' | 'draft' | 'error'; label: string }> = {
  completed: { variant: 'active', label: '已建树' },
  building: { variant: 'indexing', label: '建树中' },
  pending: { variant: 'draft', label: '待建树' },
  failed: { variant: 'error', label: '失败' },
  skipped: { variant: 'draft', label: '已跳过' },
};

const NODE_TYPE_LABEL: Record<string, string> = {
  root: '文档根', part: '部', chapter: '章', section: '节', subsection: '小节', leaf: '叶节点',
};

const SEARCH_MODE_LABEL: Record<PageIndexSearchMode, string> = {
  llm_prompt: 'LLM Prompt 逐步推理',
  mcts_hybrid: 'MCTS 混合搜索',
};

export default function PageIndexHubPage({ kbId, onNavigate }: PageIndexHubPageProps) {
  const kb = mockKBs.find(k => k.kb_id === (kbId || 'kb-001')) || mockKBs[0];
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [debugDocId, setDebugDocId] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const activeBuildJobs = getPageIndexActiveBuildJobs();
  const buildingCount = activeBuildJobs.filter(j => j.stage !== 'queued').length;
  const queueActive = activeBuildJobs.length;

  const tabs = [
    '概览',
    '文档列表',
    `建树队列${queueActive > 0 ? ` (${queueActive})` : ''}`,
    '检索调试',
    '建树设置',
    '统计',
  ];

  const openDocDetail = (docId: string, debug = false) => {
    setSelectedDocId(docId);
    if (debug) setDebugDocId(docId);
  };

  if (selectedDocId) {
    const doc = getPageIndexDoc(selectedDocId);
    if (!doc) {
      setSelectedDocId(null);
      return null;
    }
    return (
      <>
        {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
        <DocDetailView
          doc={doc}
          autoFocusDebug={debugDocId === selectedDocId}
          onBack={() => { setSelectedDocId(null); setDebugDocId(null); }}
          showToast={showToast}
          onNavigate={onNavigate}
        />
      </>
    );
  }

  return (
    <>
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <HubPageShell
        title="PageIndex 管理"
        subtitle={`${kb.name} · 无向量推理式检索 · 树索引 Ingest → In-Context 树搜索 · ${PAGEINDEX_STATS.completed}/${PAGEINDEX_STATS.total} 已建树`}
        icon={<GitBranch size={16} className="text-cyan-600" />}
        badge={buildingCount > 0 ? { label: `${buildingCount} 建树中`, variant: 'indexing' } : { label: `${PAGEINDEX_STATS.buildRate}% 建树率`, variant: 'active' }}
        onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || kb.kb_id })}
        secondaryAction={{ label: '重建失败项', icon: <RefreshCw size={14} />, onClick: () => showToast('失败文档重建任务已提交（mock）') }}
        primaryAction={{ label: '批量重建', icon: <Layers size={14} />, onClick: () => showToast('批量重建已加入队列（mock）') }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 0 && <OverviewTab onViewDoc={id => openDocDetail(id)} onRetry={() => showToast('重试中…')} />}
        {activeTab === 1 && (
          <DocumentsTab
            onViewTree={id => openDocDetail(id)}
            onDebug={id => openDocDetail(id, true)}
            showToast={showToast}
          />
        )}
        {activeTab === 2 && <BuildQueueTab showToast={showToast} onViewDoc={id => openDocDetail(id)} />}
        {activeTab === 3 && (
          <LibrarySearchTab
            showToast={showToast}
            onOpenDoc={(docId, debug) => openDocDetail(docId, debug)}
          />
        )}
        {activeTab === 4 && <SettingsTab showToast={showToast} />}
        {activeTab === 5 && <StatsTab />}
      </HubPageShell>
    </>
  );
}

function OverviewTab({ onViewDoc, onRetry }: { onViewDoc: (id: string) => void; onRetry: () => void }) {
  const maxWeekly = Math.max(...PAGEINDEX_STATS.weeklyBuilds);
  const activeJobs = getPageIndexActiveBuildJobs().filter(j => j.stage !== 'queued');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="已建树" value={`${PAGEINDEX_STATS.completed}/${PAGEINDEX_STATS.total}`} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="建树率" value={`${PAGEINDEX_STATS.buildRate}%`} icon={<GitBranch size={18} className="text-cyan-600" />} />
        <HubStatCard label="平均深度" value={`${PAGEINDEX_STATS.avgDepth} 层`} icon={<Layers size={18} className="text-blue-500" />} />
        <HubStatCard label="失败文档" value={String(PAGEINDEX_STATS.failed)} icon={<AlertCircle size={18} className="text-red-500" />} />
      </div>

      <div className={`${hubCard} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">建树进度</h3>
          <span className="text-[10px] text-gray-400">总节点 {PAGEINDEX_STATS.totalNodes.toLocaleString()} · 平均搜索 {PAGEINDEX_STATS.avgSearchMs}ms</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-500" style={{ width: `${PAGEINDEX_STATS.buildRate}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{PAGEINDEX_STATS.completed}/{PAGEINDEX_STATS.total} 文档已完成</span>
          <span>{PAGEINDEX_STATS.buildRate}%</span>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-cyan-600 animate-spin" /> 建树进行中
            <span className="text-[10px] font-normal text-gray-400">（与建树队列同步）</span>
          </h3>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <div key={job.docId}>
                <div className="flex justify-between text-xs mb-1">
                  <button type="button" onClick={() => onViewDoc(job.docId)} className="text-gray-700 dark:text-gray-300 font-medium hover:text-cyan-600 hover:underline text-left">
                    {job.name}
                  </button>
                  <span className="text-gray-400">{job.eta ?? BUILD_STAGE_LABEL[job.stage]}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-1">{job.stepLabel}</p>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500" /> 最近失败
          </h3>
          <div className="space-y-2">
            {PAGEINDEX_STATS.recentFails.map(f => (
              <div key={f.docId} className="flex items-center justify-between gap-2 text-xs py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{f.name}</p>
                  <p className="text-gray-400">{f.reason} · {f.time}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={onRetry} className="text-cyan-600 hover:underline">重试</button>
                  <button type="button" onClick={() => onViewDoc(f.docId)} className="text-blue-600 hover:underline">调试</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">失败原因分布</h3>
          <div className="space-y-2">
            {PAGEINDEX_STATS.failDist.map(item => (
              <div key={item.reason} className="flex items-center gap-3">
                <span className="flex-1 text-xs text-gray-600 dark:text-gray-400">{item.reason}</span>
                <span className="text-xs text-gray-500 w-4 text-right">{item.count}</span>
                <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${(item.count / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-4 bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800`}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 mb-1">Vectorless Reasoning-based RAG</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              长文档不经分块向量化，LLM 在 JSON 树索引上做 In-Context 推理导航。FinanceBench 基准准确率 <strong>{PAGEINDEX_STATS.financeBenchRecall}%</strong>（传统向量 RAG ~50%）。
            </p>
          </div>
          <div className={`${hubCard} px-4 py-3 flex-shrink-0`}>
            <p className="text-[10px] text-gray-400">近 7 天建树</p>
            <div className="flex items-end gap-1 h-12 mt-1">
              {PAGEINDEX_STATS.weeklyBuilds.map((v, i) => (
                <div key={i} className="w-4 bg-cyan-500 rounded-t-sm opacity-80" style={{ height: `${(v / maxWeekly) * 100}%`, minHeight: 4 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({
  onViewTree, onDebug, showToast,
}: {
  onViewTree: (id: string) => void;
  onDebug: (id: string) => void;
  showToast: (m: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PageIndexDocStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => PAGEINDEX_DOCUMENTS.filter(d => {
    if (statusFilter !== 'all' && d.treeStatus !== statusFilter) return false;
    if (search && !d.name.includes(search)) return false;
    return true;
  }), [search, statusFilter]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档…" className={`${hubInput} pl-9`} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'completed', 'building', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${
                statusFilter === s ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              {s === 'all' ? '全部' : DOC_STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        两步流程：<strong>Ingest</strong> 将文档转为 JSON 树（Title + Summary + 页码）→ <strong>Query</strong> 时 LLM 推理导航至叶节点抽取答案。从文档列表进入单文档树预览与搜索调试。
      </p>

      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
              <th className="px-4 py-2.5 w-8">
                <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())} />
              </th>
              <th className="px-4 py-2.5">文档名</th>
              <th className="px-4 py-2.5">树深度</th>
              <th className="px-4 py-2.5">节点数</th>
              <th className="px-4 py-2.5">目录来源</th>
              <th className="px-4 py-2.5">状态</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{doc.name}</p>
                      <p className="text-[10px] text-gray-400">{doc.fileType} · {doc.size} · {doc.pages} 页 · {doc.updated}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{doc.depth > 0 ? doc.depth : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{doc.nodes > 0 ? doc.nodes : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {doc.tocSource === 'deepdoc' ? 'DeepDoc TOC' : doc.tocSource === 'llm' ? 'LLM 语义' : '手动正则'}
                </td>
                <td className="px-4 py-3">
                  <HubBadge variant={DOC_STATUS[doc.treeStatus].variant}>{DOC_STATUS[doc.treeStatus].label}</HubBadge>
                  {doc.treeStatus === 'building' && doc.buildProgress != null && (
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${doc.buildProgress}%` }} />
                    </div>
                  )}
                  {doc.failReason && <p className="text-[10px] text-red-500 mt-0.5">{doc.failReason}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {doc.treeStatus === 'completed' && (
                      <>
                        <button type="button" onClick={() => onViewTree(doc.id)} className="text-[10px] text-cyan-600 hover:underline font-medium">查看树</button>
                        <button type="button" onClick={() => onDebug(doc.id)} className="text-[10px] text-blue-600 hover:underline">调试</button>
                      </>
                    )}
                    {doc.treeStatus === 'failed' && (
                      <>
                        <button type="button" onClick={() => showToast('重试中…')} className="text-[10px] text-cyan-600 hover:underline flex items-center gap-0.5"><RotateCcw size={10} /> 重试</button>
                        <button type="button" onClick={() => showToast('已跳过')} className="text-[10px] text-gray-500 hover:underline flex items-center gap-0.5"><SkipForward size={10} /> 跳过</button>
                      </>
                    )}
                    {doc.treeStatus === 'pending' && (
                      <button type="button" onClick={() => showToast('建树任务已提交')} className="text-[10px] text-blue-600 hover:underline">触发建树</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className={`${hubCard} p-3 flex items-center gap-3`}>
          <span className="text-xs text-gray-500">已选 {selected.size} 项</span>
          <BtnPrimary onClick={() => showToast(`批量重建 ${selected.size} 个文档（mock）`)}>
            <RefreshCw size={12} /> 批量重建选中
          </BtnPrimary>
        </div>
      )}
    </div>
  );
}

function BuildQueueTab({
  showToast, onViewDoc,
}: {
  showToast: (m: string) => void;
  onViewDoc: (id: string) => void;
}) {
  const [queue, setQueue] = useState(PAGEINDEX_BUILD_QUEUE);

  return (
    <div className="space-y-4">
      <div className={`${hubCard} p-3 text-xs text-gray-600 dark:text-gray-400`}>
        <span className="font-medium">Ingest 流水线：</span>
        {PAGEINDEX_PIPELINE_STEPS.map((s, i) => (
          <span key={s}>{s}{i < PAGEINDEX_PIPELINE_STEPS.length - 1 ? ' → ' : ''}</span>
        ))}
        <span className="text-cyan-600 ml-2">（无分块向量化 · JSON 树索引直出）</span>
      </div>
      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
              <th className="px-4 py-2.5">文档</th>
              <th className="px-4 py-2.5">阶段</th>
              <th className="px-4 py-2.5">进度</th>
              <th className="px-4 py-2.5">节点</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.docName}</p>
                  <p className="text-[10px] text-gray-400">{item.stepLabel}{item.eta ? ` · ${item.eta}` : ''}</p>
                </td>
                <td className="px-4 py-3">
                  <HubBadge variant={item.stage === 'failed' ? 'error' : item.stage === 'done' ? 'active' : 'indexing'}>
                    {BUILD_STAGE_LABEL[item.stage]}
                  </HubBadge>
                </td>
                <td className="px-4 py-3 w-36">
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.stage === 'failed' ? 'bg-red-400' : item.stage === 'done' ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${item.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{item.progress}%</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.nodesBuilt != null ? item.nodesBuilt : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {item.stage === 'done' && (
                      <button type="button" onClick={() => onViewDoc(item.docId)} className="text-[10px] text-cyan-600 hover:underline">查看树</button>
                    )}
                    {item.stage !== 'done' && item.stage !== 'failed' && (
                      <button type="button" onClick={() => showToast('已暂停')} className="text-[10px] text-gray-600 flex items-center gap-0.5"><Pause size={10} /> 暂停</button>
                    )}
                    {item.stage === 'failed' && (
                      <>
                        <button type="button" onClick={() => showToast('重试中…')} className="text-[10px] text-cyan-600 flex items-center gap-0.5"><RotateCcw size={10} /> 重试</button>
                        <button type="button" onClick={() => onViewDoc(item.docId)} className="text-[10px] text-blue-600 hover:underline">调试</button>
                      </>
                    )}
                    {item.stage === 'queued' && (
                      <button type="button" onClick={() => setQueue(q => q.map(x => x.id === item.id ? { ...x, stage: 'parsing' as const, progress: 5, stepLabel: '开始文档解析' } : x))} className="text-[10px] text-cyan-600">优先</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LibrarySearchTab({
  showToast, onOpenDoc,
}: {
  showToast: (m: string) => void;
  onOpenDoc: (docId: string, debug?: boolean) => void;
}) {
  const [testQuery, setTestQuery] = useState('违约金如何计算');
  const [searchMode, setSearchMode] = useState<PageIndexSearchMode>('mcts_hybrid');
  const [result, setResult] = useState<PageIndexLibrarySearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const completedDocs = PAGEINDEX_DOCUMENTS.filter(d => d.treeStatus === 'completed');

  const handleSearch = () => {
    setSearching(true);
    setResult(null);
    setTimeout(() => {
      const r = runMockLibrarySearch(testQuery);
      setResult({ ...r, mode: searchMode });
      setSearching(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        库级树搜索调试：在 <strong>{completedDocs.length}</strong> 份已建树文档上执行 In-Context 推理导航，对比多文档命中与置信度（对齐 §11.2.3 单文档调试的库级扩展）。
      </p>
      <div className={`${hubCard} p-4 space-y-3`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              placeholder="输入测试查询，如：违约金如何计算"
              className={`${hubInput} pl-9`}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select className={hubSelect} value={searchMode} onChange={e => setSearchMode(e.target.value as PageIndexSearchMode)}>
            <option value="llm_prompt">LLM Prompt 逐步推理</option>
            <option value="mcts_hybrid">MCTS 混合搜索</option>
          </select>
          <BtnPrimary onClick={handleSearch} disabled={searching}>
            {searching ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {searching ? '推理中' : '执行库级搜索'}
          </BtnPrimary>
        </div>
        <div className="flex flex-wrap gap-2">
          {['违约金如何计算', '保密期限'].map(q => (
            <button key={q} type="button" onClick={() => setTestQuery(q)} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-cyan-50 hover:text-cyan-700">
              {q}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className={`${hubCard} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Zap size={12} className="text-cyan-600" /> 命中 {result.hits.length} 个叶节点 · 检索 {result.docsSearched} 文档
            </p>
            <span className="text-[10px] text-gray-500">{SEARCH_MODE_LABEL[result.mode]} · {result.totalMs}ms</span>
          </div>
          <div className="space-y-3">
            {result.hits.map((hit, i) => (
              <div key={`${hit.docId}-${hit.nodeId}`} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 bg-cyan-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{hit.docName}</span>
                    <span className="text-[10px] text-gray-400">→ {hit.nodeTitle}</span>
                  </div>
                  <span className="text-[10px] text-cyan-600">{(hit.confidence * 100).toFixed(0)}% · {hit.pageRange}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">{hit.excerpt}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onOpenDoc(hit.docId)} className="text-[10px] text-cyan-600 hover:underline">查看树</button>
                  <button type="button" onClick={() => onOpenDoc(hit.docId, true)} className="text-[10px] text-blue-600 hover:underline">单文档调试</button>
                  <button type="button" onClick={() => showToast('已跳转对话测试（mock）')} className="text-[10px] text-gray-500 hover:underline">在对话中测试</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${hubCard} p-4 bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800`}>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Vectorless vs 向量：</strong>PageIndex 在 {PAGEINDEX_ANALYTICS.vectorCompare.financeBench} 基准召回 <strong>{PAGEINDEX_ANALYTICS.vectorCompare.pageindexRecall}%</strong>，
          传统向量 RAG 约 {PAGEINDEX_ANALYTICS.vectorCompare.vectorRecall}%。适合长文档、结构化合同/财报等需精确定位的场景。
        </p>
      </div>
    </div>
  );
}

function StatsTab() {
  const maxWeekly = Math.max(...PAGEINDEX_ANALYTICS.weeklySearches);
  const maxType = Math.max(...PAGEINDEX_ANALYTICS.docTypeDist.map(d => d.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="P50 延迟" value={`${PAGEINDEX_ANALYTICS.searchLatencyP50}ms`} icon={<Clock size={18} className="text-cyan-600" />} />
        <HubStatCard label="P95 延迟" value={`${PAGEINDEX_ANALYTICS.searchLatencyP95}ms`} icon={<Clock size={18} className="text-amber-500" />} />
        <HubStatCard label="平均推理跳数" value={`${PAGEINDEX_ANALYTICS.avgHops} 跳`} icon={<TrendingUp size={18} className="text-blue-500" />} />
        <HubStatCard label="FinanceBench" value={`${PAGEINDEX_ANALYTICS.vectorCompare.pageindexRecall}%`} icon={<BarChart2 size={18} className="text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">文档类型分布</h3>
          <div className="space-y-2">
            {PAGEINDEX_ANALYTICS.docTypeDist.map(item => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="flex-1 text-xs text-gray-600 dark:text-gray-400">{item.type}</span>
                <span className="text-xs text-gray-500 w-8 text-right">{item.count}</span>
                <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(item.count / maxType) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-10">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">树深度分布（已建树）</h3>
          <div className="space-y-2">
            {PAGEINDEX_ANALYTICS.depthDist.map(item => (
              <div key={item.depth} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-gray-600 dark:text-gray-400">{item.depth}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.count} 文档</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">高频检索文档 Top 4</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-2">文档</th>
              <th className="pb-2">检索次数</th>
              <th className="pb-2">平均延迟</th>
            </tr>
          </thead>
          <tbody>
            {PAGEINDEX_ANALYTICS.topDocs.map((d, i) => (
              <tr key={d.docId} className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-2 text-xs text-gray-800 dark:text-gray-200">
                  <span className="text-gray-400 mr-2">{i + 1}</span>{d.name}
                </td>
                <td className="py-2 text-xs text-gray-600">{d.searches}</td>
                <td className="py-2 text-xs text-gray-600">{d.avgMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">近 7 天库级树搜索量</h3>
        <div className="flex items-end gap-1 h-16">
          {PAGEINDEX_ANALYTICS.weeklySearches.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-cyan-500 rounded-t-sm opacity-80" style={{ height: `${(v / maxWeekly) * 100}%`, minHeight: 4 }} />
              <span className="text-[9px] text-gray-400">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ showToast }: { showToast: (m: string) => void }) {
  const [settings, setSettings] = useState(PAGEINDEX_DEFAULT_SETTINGS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <GitBranch size={16} className="text-cyan-600" /> 树索引生成（Ingest）
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">目录识别</label>
            <div className="space-y-2">
              {[
                { v: 'auto' as const, l: '自动（DeepDoc TOC 提取）' },
                { v: 'manual' as const, l: '手动正则（如 第[一二三四五六七八九十]+条）' },
                { v: 'llm' as const, l: 'LLM 语义补全目录' },
              ].map(opt => (
                <label key={opt.v} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="radio" name="toc" checked={settings.tocMode === opt.v} onChange={() => setSettings(s => ({ ...s, tocMode: opt.v }))} className="text-cyan-600" />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">最大树深度</label>
              <input type="number" value={settings.maxDepth} onChange={e => setSettings(s => ({ ...s, maxDepth: +e.target.value }))} className={hubInput} min={3} max={12} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">节点 Token 上限</label>
              <input type="number" value={settings.maxTokenPerNode} onChange={e => setSettings(s => ({ ...s, maxTokenPerNode: +e.target.value }))} className={hubInput} step={64} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">适用文档类型</label>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { k: 'contract' as const, l: '合同' },
                { k: 'financial' as const, l: '财报' },
                { k: 'paper' as const, l: '论文' },
                { k: 'email' as const, l: '邮件' },
              ].map(t => (
                <label key={t.k} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={settings.docTypes[t.k]} onChange={e => setSettings(s => ({ ...s, docTypes: { ...s.docTypes, [t.k]: e.target.checked } }))} className="rounded text-cyan-600" />
                  {t.l}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={settings.autoBuildOnUpload} onChange={e => setSettings(s => ({ ...s, autoBuildOnUpload: e.target.checked }))} className="rounded text-cyan-600" />
            新文档入库自动触发建树
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={settings.incrementalRebuild} onChange={e => setSettings(s => ({ ...s, incrementalRebuild: e.target.checked }))} className="rounded text-cyan-600" />
            文档更新后增量重建变更节点
          </label>
        </div>
      </div>

      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Settings size={16} /> 树搜索（Query）与 LLM
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">搜索算法</label>
            <select
              className={hubSelect}
              value={settings.searchMode}
              onChange={e => setSettings(s => ({ ...s, searchMode: e.target.value as PageIndexSearchMode }))}
            >
              <option value="llm_prompt">LLM Prompt 逐步推理（轻量）</option>
              <option value="mcts_hybrid">MCTS 混合搜索（高准确率）</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">MCTS 适合 Tier 2-3 多跳推理；Prompt 模式延迟更低</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">搜索深度</label>
              <input type="number" value={settings.searchDepth} onChange={e => setSettings(s => ({ ...s, searchDepth: +e.target.value }))} className={hubInput} min={2} max={8} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">每层展开节点</label>
              <input type="number" value={settings.branchFactor} onChange={e => setSettings(s => ({ ...s, branchFactor: +e.target.value }))} className={hubInput} min={3} max={15} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">建树 / 搜索 LLM</label>
            <select className={hubSelect} value={settings.llmModel} onChange={e => setSettings(s => ({ ...s, llmModel: e.target.value }))}>
              <option value="deepseek-v4">DeepSeek-v4（推荐）</option>
              <option>GPT-4o</option>
              <option>Claude 3.5 Sonnet</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={settings.semanticToc} onChange={e => setSettings(s => ({ ...s, semanticToc: e.target.checked }))} className="rounded text-cyan-600" />
            LLM 目录语义补全（无 TOC 的 PDF）
          </label>
          <div className="flex gap-2 pt-2">
            <BtnSecondary className="flex-1 justify-center" onClick={() => setSettings(PAGEINDEX_DEFAULT_SETTINGS)}>重置默认</BtnSecondary>
            <BtnPrimary className="flex-1 justify-center" onClick={() => showToast('建树设置已保存')}>保存配置</BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PDF 解析预览 + bbox 高亮（§11.2.3 联动解析预览） ── */

const PDF_PAGE_MOCK_LINES: Record<number, string[]> = {
  3: [
    '第五条 违约责任',
    '',
    '5.1 迟延交货',
    '供应商迟延交货的，每迟延一日应按迟延交付货物',
    '价值的千分之五（0.5%）向采购方支付违约金。',
    '',
    '5.1.1 违约金计算',
    '累计违约金不超过合同总金额的 20%。',
    '5.1.2 解除权触发',
    '迟延超过 30 日采购方可解除合同。',
  ],
  8: [
    '第八条 保密义务',
    '',
    '8.1 保密范围',
    '技术信息、经营信息、客户名单等均属保密信息。',
    '',
    '8.2 保密期限',
    '保密义务自合同生效之日起至合同终止后满五年止。',
  ],
};

function PdfBboxPreview({
  docName, page, bbox, nodeTitle, highlightFromSearch, onOpenParse,
}: {
  docName: string;
  page: number;
  bbox?: PageIndexBbox;
  nodeTitle?: string;
  highlightFromSearch?: boolean;
  onOpenParse: () => void;
}) {
  const lines = PDF_PAGE_MOCK_LINES[page] ?? [
    docName,
    '',
    '（mock）DeepDoc 解析页预览',
    '点击树节点或执行树搜索后联动 bbox 高亮。',
  ];

  return (
    <div className={`${hubCard} flex flex-col overflow-hidden h-full`}>
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">解析预览</p>
          <p className="text-[10px] text-gray-400">P{page} · DeepDoc layout</p>
        </div>
        <button type="button" onClick={onOpenParse} className="text-[10px] text-cyan-600 hover:underline flex-shrink-0">全屏 →</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 bg-gray-100/80 dark:bg-gray-800/50 min-h-[240px]">
        <div className="relative bg-white dark:bg-gray-900 shadow-md rounded-sm mx-auto w-full max-w-[220px] min-h-[300px] p-3.5">
          <div className="absolute top-2 right-2 text-[8px] text-gray-300">P{page}</div>
          <div className="space-y-1.5 relative">
            {lines.map((line, i) => (
              <p key={i} className={`text-[8px] leading-snug ${line === '' ? 'h-1' : 'text-gray-600 dark:text-gray-400'}`}>
                {line || '\u00A0'}
              </p>
            ))}
            {bbox && (
              <div
                className={`absolute border-2 border-cyan-500 bg-cyan-400/25 rounded-sm pointer-events-none ${
                  highlightFromSearch ? 'ring-2 ring-cyan-300 animate-pulse' : ''
                }`}
                style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.w}%`, height: `${bbox.h}%` }}
              />
            )}
          </div>
        </div>
      </div>
      {bbox && nodeTitle && (
        <div className="px-3 py-2 border-t border-cyan-100 dark:border-cyan-900/40 bg-cyan-50/50 dark:bg-cyan-900/10 text-[10px] text-cyan-800 dark:text-cyan-200 flex-shrink-0">
          bbox 高亮: <strong>{nodeTitle}</strong> · P{page}
        </div>
      )}
    </div>
  );
}

/* ── 单文档树预览 + 树搜索调试（§11.2.3） ── */

function DocDetailView({
  doc, autoFocusDebug, onBack, showToast, onNavigate,
}: {
  doc: PageIndexDocument;
  autoFocusDebug?: boolean;
  onBack: () => void;
  showToast: (m: string) => void;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}) {
  const tree = getPageIndexTree(doc.id) ?? PAGEINDEX_TREE_V5;
  const [selectedNodeId, setSelectedNodeId] = useState('ch5-1-1');
  const [testQuery, setTestQuery] = useState('违约金如何计算');
  const [searchResult, setSearchResult] = useState<PageIndexSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(autoFocusDebug ?? false);

  const selectedNode = findTreeNode(tree, selectedNodeId) ?? tree;
  const { page: previewPage, bbox: previewBbox } = getNodePreviewBbox(selectedNode);

  const openParsePreview = () => {
    onNavigate('kb-parse', {
      selectedKBId: 'kb-001',
      pageIndexDocId: doc.id,
      highlightPage: previewPage,
      highlightNodeId: selectedNodeId,
    });
  };

  useEffect(() => {
    if (autoFocusDebug) setDebugExpanded(true);
  }, [autoFocusDebug]);

  const handleSearch = () => {
    setSearching(true);
    setSearchResult(null);
    setTimeout(() => {
      const result = runMockTreeSearch(testQuery);
      setSearchResult(result);
      setSelectedNodeId(result.targetNodeId);
      setSearching(false);
    }, 900);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950">
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex-shrink-0">
            <ArrowLeft size={14} /> 返回文档列表
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{doc.name}</span>
          <HubBadge variant={DOC_STATUS[doc.treeStatus].variant}>{DOC_STATUS[doc.treeStatus].label}</HubBadge>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <BtnSecondary onClick={() => showToast('重建树任务已提交')}><RefreshCw size={12} /> 重建树</BtnSecondary>
          <BtnSecondary onClick={openParsePreview}><Eye size={12} /> 解析预览</BtnSecondary>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* 左侧树结构预览 */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">JSON 树索引</p>
            <p className="text-[10px] text-gray-400">{doc.pages} 页 · {doc.nodes} 节点 · 深度 {doc.depth}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
            <IndexTreeNode node={tree} depth={0} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
          </div>
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
            No Chunking · No Top-K · Reasoning-based Retrieval
          </div>
        </div>

        {/* 中间：节点详情 + 树搜索调试 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-w-0">
          <div className={`${hubCard} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-cyan-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedNode.title}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
                {NODE_TYPE_LABEL[selectedNode.nodeType] ?? selectedNode.nodeType}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { l: '页码范围', v: selectedNode.startPage ? `P${selectedNode.startPage}${selectedNode.endPage && selectedNode.endPage !== selectedNode.startPage ? `-${selectedNode.endPage}` : ''}` : '—' },
                { l: 'Token 数', v: selectedNode.tokenCount ? String(selectedNode.tokenCount) : '—' },
                { l: '子节点', v: String(selectedNode.children?.length ?? 0) },
                { l: '节点 ID', v: selectedNode.id },
              ].map(s => (
                <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{s.v}</div>
                  <div className="text-[10px] text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
            {selectedNode.summary && (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{selectedNode.summary}</p>
            )}
            {previewBbox && (
              <button type="button" onClick={openParsePreview} className="mt-2 text-[10px] text-cyan-600 hover:underline flex items-center gap-1">
                <Eye size={10} /> 在解析预览中查看 P{previewPage} bbox
              </button>
            )}
          </div>

          <div className={`${hubCard} p-4`}>
            <button
              type="button"
              onClick={() => setDebugExpanded(p => !p)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200"
            >
              <span className="flex items-center gap-2"><Search size={14} className="text-blue-500" /> 树搜索调试（In-Context Reasoning）</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${debugExpanded ? '' : '-rotate-90'}`} />
            </button>

            {debugExpanded && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={testQuery}
                    onChange={e => setTestQuery(e.target.value)}
                    placeholder="输入测试查询，如：违约金如何计算"
                    className={`${hubInput} flex-1`}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <BtnPrimary onClick={handleSearch} disabled={searching}>
                    {searching ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    {searching ? '推理中' : '执行树搜索'}
                  </BtnPrimary>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['违约金如何计算', '保密期限是多久'].map(q => (
                    <button key={q} type="button" onClick={() => { setTestQuery(q); }} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-cyan-50 hover:text-cyan-700">
                      {q}
                    </button>
                  ))}
                </div>

                {searchResult && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                        <Zap size={12} /> 推理路径 · {SEARCH_MODE_LABEL[searchResult.mode]}
                      </p>
                      <span className="text-[10px] text-blue-600">
                        置信度 {(searchResult.confidence * 100).toFixed(0)}% · {searchResult.totalMs}ms
                      </span>
                    </div>
                    <div className="space-y-2">
                      {searchResult.steps.map(s => (
                        <div key={s.step} className="flex items-start gap-2 text-xs">
                          <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{s.step}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-blue-700 dark:text-blue-300 font-medium">{s.action}</span>
                            <span className="text-gray-500 mx-1">→</span>
                            <span className="text-gray-800 dark:text-gray-200">{s.result}</span>
                            {s.nodeId && (
                              <button type="button" onClick={() => setSelectedNodeId(s.nodeId!)} className="ml-2 text-cyan-600 hover:underline text-[10px]">定位</button>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{s.ms}ms</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                        定位节点: <strong>{searchResult.targetTitle}</strong> · {searchResult.pageRange} · Token {searchResult.tokenCount}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/40 rounded-lg p-2 leading-relaxed">{searchResult.excerpt}</p>
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setSelectedNodeId(searchResult.targetNodeId)} className="text-[10px] text-cyan-600 hover:underline flex items-center gap-0.5"><Box size={10} /> 在树中高亮</button>
                        <button type="button" onClick={() => showToast('已跳转对话测试（mock）')} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"><MessageSquare size={10} /> 在对话中测试</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 窄屏下 PDF 预览折叠在搜索调试下方 */}
          <div className="xl:hidden">
            <PdfBboxPreview
              docName={doc.name}
              page={previewPage}
              bbox={previewBbox}
              nodeTitle={selectedNode.title}
              highlightFromSearch={!!searchResult && searchResult.targetNodeId === selectedNodeId}
              onOpenParse={openParsePreview}
            />
          </div>
        </div>

        {/* 右侧：PDF bbox 预览（大屏常驻） */}
        <div className="hidden xl:flex w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 p-4 bg-white/50 dark:bg-gray-900/50">
          <PdfBboxPreview
            docName={doc.name}
            page={previewPage}
            bbox={previewBbox}
            nodeTitle={selectedNode.title}
            highlightFromSearch={!!searchResult && searchResult.targetNodeId === selectedNodeId}
            onOpenParse={openParsePreview}
          />
        </div>
      </div>
    </div>
  );
}

function IndexTreeNode({
  node, depth, selectedId, onSelect,
}: {
  node: PageIndexTreeNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <button
        type="button"
        onClick={() => { onSelect(node.id); if (hasChildren) setExpanded(p => !p); }}
        className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-left text-xs transition-colors ${
          isSelected ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        ) : <span className="w-3 flex-shrink-0" />}
        {hasChildren ? (
          expanded ? <FolderOpen size={12} className="text-cyan-600 flex-shrink-0" /> : <Folder size={12} className="text-cyan-500 flex-shrink-0" />
        ) : (
          <FileText size={12} className={`flex-shrink-0 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
        )}
        <span className="truncate flex-1">{node.title}</span>
        {node.startPage != null && (
          <span className="text-[9px] text-gray-400 flex-shrink-0">P{node.startPage}</span>
        )}
      </button>
      {expanded && hasChildren && node.children!.map(child => (
        <IndexTreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
