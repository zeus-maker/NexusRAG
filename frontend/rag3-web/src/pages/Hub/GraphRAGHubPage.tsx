import { useState, useMemo } from 'react';
import {
  Network, ChevronRight, Eye, Users, GitBranch, Settings, Layers, X,
  Search, RefreshCw, CheckCircle, AlertCircle, Play, Filter, RotateCcw,
  Pause, Globe, MapPin, DollarSign, BarChart3, FileText, ArrowLeft, Clock,
} from 'lucide-react';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../../components/hubUi';
import { mockKBs } from '../../mockData';
import {
  GRAPH_STATS, GRAPH_NODES, GRAPH_EDGES, GRAPH_COMMUNITIES, GRAPH_BUILD_QUEUE,
  GRAPH_REVIEW_QUEUE, GRAPH_SOURCE_DOCS, GRAPH_DEFAULT_SETTINGS, ENTITY_TYPE_CFG,
  BUILD_STAGE_LABEL, SUMMARY_STATUS_CFG, INDEX_MODE_LABEL, DOC_INDEX_STATUS_CFG,
  getGraphNode, getGraphSourceDoc, getDocSubgraph, runMockGraphSearch,
  type GraphIndexMode, type GraphEntityType, type GraphSearchMode,
  type GraphReviewItem, type GraphSearchPath, type GraphSourceDoc, type GraphDocIndexStatus,
} from '../../data/graphRAGMock';

interface GraphRAGHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

const PIPELINE_STEPS = ['切块', '实体抽取', '关系抽取', '图谱写入', '社区检测', '社区摘要'];

export default function GraphRAGHubPage({ kbId, onNavigate }: GraphRAGHubPageProps) {
  const kb = mockKBs.find(k => k.kb_id === (kbId || 'kb-001')) || mockKBs[0];
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [indexMode, setIndexMode] = useState<GraphIndexMode>('lazy');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [graphFocus, setGraphFocus] = useState<{ nodeIds: string[]; docName: string } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const pendingReview = GRAPH_REVIEW_QUEUE.filter(r => r.status === 'pending').length;
  const activeBuild = GRAPH_BUILD_QUEUE.filter(b => b.stage !== 'done' && b.stage !== 'failed').length;
  const onQueryCommunities = GRAPH_COMMUNITIES.filter(c => c.summaryStatus === 'on_query').length;
  const indexedDocCount = GRAPH_SOURCE_DOCS.filter(d => d.indexStatus === 'indexed').length;

  const tabs = [
    '概览',
    '文档列表',
    '可视化',
    `社区摘要${onQueryCommunities > 0 ? ` (${onQueryCommunities})` : ''}`,
    `建索引${activeBuild > 0 ? ` (${activeBuild})` : ''}`,
    `实体复核${pendingReview > 0 ? ` (${pendingReview})` : ''}`,
    '设置',
  ];

  const openDocGraph = (doc: GraphSourceDoc) => setSelectedDocId(doc.id);

  if (selectedDocId) {
    const doc = getGraphSourceDoc(selectedDocId);
    if (!doc) {
      setSelectedDocId(null);
      return null;
    }
    return (
      <>
        {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
        <DocGraphDetailView
          doc={doc}
          onBack={() => setSelectedDocId(null)}
          onOpenGlobal={() => {
            setGraphFocus({ nodeIds: doc.nodeIds, docName: doc.name });
            setSelectedDocId(null);
            setActiveTab(2);
          }}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <>
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <HubPageShell
        title="知识图谱管理"
        subtitle={`${kb.name} · 文档切块→实体/关系抽取→入图 · ${indexedDocCount}/${GRAPH_SOURCE_DOCS.length} 文档已索引 · ${GRAPH_STATS.entities.toLocaleString()} 实体`}
        icon={<Network size={16} className="text-amber-600" />}
        badge={pendingReview > 0 ? { label: `${pendingReview} 待复核`, variant: 'indexing' } : { label: '已构建', variant: 'active' }}
        onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || kb.kb_id })}
        secondaryAction={{ label: '暂停/恢复', icon: <Pause size={14} />, onClick: () => showToast('流水线已暂停（mock）') }}
        primaryAction={{ label: '批量重建', icon: <RefreshCw size={14} />, onClick: () => showToast('批量重建任务已提交（mock）') }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 0 && <OverviewTab indexMode={indexMode} onModeChange={setIndexMode} onGoVisualize={() => setActiveTab(2)} showToast={showToast} />}
        {activeTab === 1 && (
          <DocumentsTab
            onViewGraph={openDocGraph}
            onBuild={doc => showToast(`图谱构建已触发：${doc.name}（mock）`)}
            showToast={showToast}
          />
        )}
        {activeTab === 2 && (
          <VisualizationTab
            showToast={showToast}
            scopeNodeIds={graphFocus?.nodeIds}
            focusDocName={graphFocus?.docName}
            onClearFocus={() => setGraphFocus(null)}
          />
        )}
        {activeTab === 3 && <CommunityTab showToast={showToast} />}
        {activeTab === 4 && <BuildQueueTab showToast={showToast} />}
        {activeTab === 5 && <EntityReviewTab showToast={showToast} />}
        {activeTab === 6 && <SettingsTab indexMode={indexMode} onModeChange={setIndexMode} showToast={showToast} />}
      </HubPageShell>
    </>
  );
}

function DocumentsTab({
  onViewGraph, onBuild, showToast,
}: {
  onViewGraph: (doc: GraphSourceDoc) => void;
  onBuild: (doc: GraphSourceDoc) => void;
  showToast: (m: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GraphDocIndexStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => GRAPH_SOURCE_DOCS.filter(d => {
    if (statusFilter !== 'all' && d.indexStatus !== statusFilter) return false;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="知识库文档" value={String(GRAPH_SOURCE_DOCS.length)} icon={<FileText size={18} className="text-amber-500" />} />
        <HubStatCard label="已入图" value={String(GRAPH_SOURCE_DOCS.filter(d => d.indexStatus === 'indexed').length)} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="构建中" value={String(GRAPH_SOURCE_DOCS.filter(d => d.indexStatus === 'building').length)} icon={<RefreshCw size={18} className="text-blue-500" />} />
        <HubStatCard label="待构建" value={String(GRAPH_SOURCE_DOCS.filter(d => d.indexStatus === 'pending').length)} icon={<Clock size={18} className="text-gray-500" />} />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档…" className={`${hubInput} pl-9`} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'indexed', 'building', 'pending', 'failed'] as const).map(s => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${statusFilter === s ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700' : 'border-gray-200 text-gray-500'}`}>
              {s === 'all' ? '全部' : DOC_INDEX_STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        GraphRAG 工作流：文档切块 → 实体/关系抽取 → 写入图谱 →（全量模式）Leiden 社区 + LLM 摘要。先选文档，再查看该文档子图。
      </p>

      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80">
              <th className="px-4 py-2.5 w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())} /></th>
              <th className="px-4 py-2.5">文档</th>
              <th className="px-4 py-2.5">实体/关系</th>
              <th className="px-4 py-2.5">社区</th>
              <th className="px-4 py-2.5">模式</th>
              <th className="px-4 py-2.5">状态</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-gray-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                      <p className="text-[10px] text-gray-400">{doc.fileType} · {doc.size} · {doc.pages} 页 · {doc.updated}</p>
                      {doc.note && <p className="text-[10px] text-gray-500">{doc.note}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {doc.entityCount > 0 ? `${doc.entityCount} 实体 · ${doc.relationCount} 关系` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                  {doc.communityIds.length > 0 ? doc.communityIds.join(', ') : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{INDEX_MODE_LABEL[doc.mode].label}</td>
                <td className="px-4 py-3">
                  <HubBadge variant={DOC_INDEX_STATUS_CFG[doc.indexStatus].variant}>{DOC_INDEX_STATUS_CFG[doc.indexStatus].label}</HubBadge>
                  {doc.buildProgress != null && (
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${doc.buildProgress}%` }} />
                    </div>
                  )}
                  {doc.failReason && <p className="text-[10px] text-red-500 mt-0.5">{doc.failReason}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {doc.indexStatus === 'indexed' && doc.nodeIds.length > 0 && (
                      <button type="button" onClick={() => onViewGraph(doc)} className="text-[10px] text-amber-600 hover:underline font-medium">查看图谱</button>
                    )}
                    {doc.indexStatus !== 'building' && doc.indexStatus !== 'indexed' && (
                      <button type="button" onClick={() => onBuild(doc)} className="text-[10px] text-blue-600 hover:underline">触发构建</button>
                    )}
                    {doc.indexStatus === 'failed' && (
                      <button type="button" onClick={() => showToast('重试中…')} className="text-[10px] text-red-600 hover:underline">重试</button>
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
          <BtnPrimary onClick={() => showToast(`批量构建 ${selected.size} 个文档（mock）`)}>
            <RefreshCw size={12} /> 批量构建图谱
          </BtnPrimary>
        </div>
      )}
    </div>
  );
}

function DocGraphDetailView({
  doc, onBack, onOpenGlobal, showToast,
}: {
  doc: GraphSourceDoc;
  onBack: () => void;
  onOpenGlobal: () => void;
  showToast: (m: string) => void;
}) {
  const subgraph = getDocSubgraph(doc.nodeIds);
  const [selectedNodeId, setSelectedNodeId] = useState(doc.primaryNodeId);
  const [testQuery, setTestQuery] = useState('供应商违约金如何计算');
  const [searchResult, setSearchResult] = useState<GraphSearchPath | null>(null);
  const selectedNode = selectedNodeId ? getGraphNode(selectedNodeId) : null;

  const handleSearch = () => {
    setTimeout(() => {
      const result = runMockGraphSearch(testQuery, 'local');
      setSearchResult(result);
      const last = result.localPath.nodes[result.localPath.nodes.length - 1];
      if (doc.nodeIds.includes(last)) setSelectedNodeId(last);
    }, 600);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950">
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 flex-shrink-0">
            <ArrowLeft size={14} /> 返回文档列表
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{doc.name}</span>
          <HubBadge variant={DOC_INDEX_STATUS_CFG[doc.indexStatus].variant}>{DOC_INDEX_STATUS_CFG[doc.indexStatus].label}</HubBadge>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <BtnSecondary onClick={onOpenGlobal}><Network size={12} /> 在全局图谱中查看</BtnSecondary>
          <BtnSecondary onClick={() => showToast('重建图谱（mock）')}><RefreshCw size={12} /> 重建</BtnSecondary>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-700 mb-2">文档子图</p>
          <p className="text-[10px] text-gray-400 mb-3">{doc.entityCount} 实体 · {doc.relationCount} 关系 · 社区 {doc.communityIds.join(', ') || '—'}</p>
          <div className="space-y-1">
            {subgraph.nodes.map(n => (
              <button key={n.id} type="button" onClick={() => setSelectedNodeId(n.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 ${selectedNodeId === n.id ? 'bg-amber-50 text-amber-800 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ENTITY_TYPE_CFG[n.entityType].color }} />
                <span className="truncate">{n.label}</span>
                <span className="text-[9px] text-gray-400 ml-auto">{ENTITY_TYPE_CFG[n.entityType].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <GraphCanvas
            nodes={subgraph.nodes}
            edges={subgraph.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            highlightNodes={new Set(searchResult?.localPath.nodes ?? [])}
            highlightEdges={new Set(searchResult?.localPath.edges ?? [])}
            height={280}
          />

          {selectedNode && (
            <div className={`${hubCard} p-4`}>
              <h3 className="text-sm font-bold text-gray-900 mb-2">{selectedNode.label}</h3>
              <p className="text-xs text-gray-500 mb-2">置信度 {(selectedNode.confidence * 100).toFixed(0)}% · {selectedNode.source}</p>
              {selectedNode.summary && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{selectedNode.summary}</p>}
            </div>
          )}

          <div className={`${hubCard} p-4`}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Search size={14} className="text-blue-500" /> 文档内 Local 检索调试</h3>
            <div className="flex gap-2 mb-3">
              <input value={testQuery} onChange={e => setTestQuery(e.target.value)} className={`${hubInput} flex-1`} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <BtnPrimary onClick={handleSearch}><Play size={14} /> 执行</BtnPrimary>
            </div>
            {searchResult && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">{searchResult.localPath.description} · {searchResult.totalMs}ms</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GraphCanvas({
  nodes, edges, selectedNodeId, onSelectNode, highlightNodes, highlightEdges, height = 320,
}: {
  nodes: typeof GRAPH_NODES;
  edges: typeof GRAPH_EDGES;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  highlightNodes: Set<string>;
  highlightEdges: Set<string>;
  height?: number;
}) {
  return (
    <div className={`${hubCard} p-4`}>
      <div className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const highlighted = highlightEdges.has(edge.id) || (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId));
            return (
              <g key={edge.id}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={highlighted ? '#f59e0b' : '#d1d5db'} strokeWidth={highlighted ? 0.35 : 0.2} />
                <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 1} textAnchor="middle" fill="#9ca3af" fontSize="1.8">{edge.relation}</text>
              </g>
            );
          })}
          {nodes.map(node => {
            const cfg = ENTITY_TYPE_CFG[node.entityType];
            const isSelected = selectedNodeId === node.id;
            const isPath = highlightNodes.has(node.id);
            return (
              <g key={node.id} onClick={() => onSelectNode(node.id === selectedNodeId ? null : node.id)} style={{ cursor: 'pointer' }}>
                <circle cx={node.x} cy={node.y} r={node.size / 9} fill={cfg.color}
                  fillOpacity={isSelected || isPath ? 1 : 0.75}
                  stroke={isSelected ? '#1d4ed8' : isPath ? '#f59e0b' : cfg.color} strokeWidth={isSelected || isPath ? 0.5 : 0.15} />
                <text x={node.x} y={node.y + node.size / 9 + 3.5} textAnchor="middle" fill="#374151" fontSize="2.2">{node.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function OverviewTab({
  indexMode, onModeChange, onGoVisualize, showToast,
}: {
  indexMode: GraphIndexMode;
  onModeChange: (m: GraphIndexMode) => void;
  onGoVisualize: () => void;
  showToast: (m: string) => void;
}) {
  const maxSize = Math.max(...GRAPH_STATS.communitySizes);

  return (
    <div className="space-y-4">
      <div className={`${hubCard} p-4`}>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">索引模式</p>
        <div className="flex flex-wrap gap-2">
          {(['lazy', 'full', 'lightrag'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                indexMode === m ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 font-medium' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <span className="block font-medium">{INDEX_MODE_LABEL[m].label}</span>
              <span className="block text-[10px] opacity-80 mt-0.5">{INDEX_MODE_LABEL[m].desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <HubStatCard label="实体" value={GRAPH_STATS.entities.toLocaleString()} icon={<Network size={18} className="text-amber-500" />} />
        <HubStatCard label="关系" value={GRAPH_STATS.relations.toLocaleString()} icon={<GitBranch size={18} className="text-blue-500" />} />
        <HubStatCard label="社区" value={String(GRAPH_STATS.communities)} icon={<Users size={18} className="text-purple-500" />} />
        <HubStatCard label="已索引" value={`${GRAPH_STATS.indexedDocs}/${GRAPH_STATS.totalDocs}`} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="失败" value={String(GRAPH_STATS.failedDocs)} icon={<AlertCircle size={18} className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${hubCard} p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">索引成本估算</h3>
          </div>
          <div className="flex items-baseline gap-4 text-sm">
            <span>Lazy <strong className="text-green-600">¥{GRAPH_STATS.lazyCostYuan}</strong></span>
            <span className="text-gray-400">vs</span>
            <span>全量 GraphRAG <strong className="text-red-600">¥{GRAPH_STATS.fullCostYuan}</strong></span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">LazyGraphRAG 跳过预计算社区摘要，索引成本约为全量 0.1%</p>
        </div>

        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <BarChart3 size={14} /> 最近查询检索模式
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Local（实体邻域）', pct: GRAPH_STATS.queryModeDist.local, color: 'bg-blue-500' },
              { label: 'Global（社区摘要）', pct: GRAPH_STATS.queryModeDist.global, color: 'bg-purple-500' },
              { label: 'Hybrid（Dual）', pct: GRAPH_STATS.queryModeDist.hybrid, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-500">{item.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">高频实体</h3>
        <div className="space-y-2">
          {GRAPH_STATS.topEntities.map(entity => (
            <div key={entity.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entity.color }} />
              <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{entity.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">{ENTITY_TYPE_CFG[entity.type].label}</span>
              <span className="text-xs text-blue-600 font-medium">{entity.connections} 连接</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">社区规模分布（Leiden）</h3>
        <div className="flex items-end gap-1 h-24">
          {GRAPH_STATS.communitySizes.map((val, idx) => (
            <div key={idx} className="flex-1 bg-amber-400 rounded-t-sm opacity-80" style={{ height: `${(val / maxSize) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <BtnPrimary onClick={onGoVisualize}><Eye size={14} /> 进入可视化</BtnPrimary>
        <BtnSecondary onClick={() => showToast('批量重建已提交')}><RefreshCw size={14} /> 批量重建</BtnSecondary>
      </div>
    </div>
  );
}

function VisualizationTab({
  showToast, scopeNodeIds, focusDocName, onClearFocus,
}: {
  showToast: (m: string) => void;
  scopeNodeIds?: string[];
  focusDocName?: string;
  onClearFocus?: () => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(scopeNodeIds?.[0] ?? 'n4');
  const [entityFilter, setEntityFilter] = useState<GraphEntityType | 'all'>('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [hopDepth, setHopDepth] = useState(2);
  const [testQuery, setTestQuery] = useState('供应商违约金如何计算');
  const [searchMode, setSearchMode] = useState<GraphSearchMode>('local');
  const [searchResult, setSearchResult] = useState<GraphSearchPath | null>(null);
  const [searching, setSearching] = useState(false);

  const scopeSet = useMemo(() => scopeNodeIds?.length ? new Set(scopeNodeIds) : null, [scopeNodeIds]);

  const filteredNodes = useMemo(() => GRAPH_NODES.filter(n => {
    if (scopeSet && !scopeSet.has(n.id)) return false;
    if (entityFilter !== 'all' && n.entityType !== entityFilter) return false;
    if (communityFilter !== 'all' && n.communityId !== communityFilter) return false;
    return true;
  }), [entityFilter, communityFilter, scopeSet]);

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = GRAPH_EDGES.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));

  const highlightNodes = new Set(searchResult?.localPath.nodes ?? []);
  const highlightEdges = new Set(searchResult?.localPath.edges ?? []);

  const selectedNode = selectedNodeId ? getGraphNode(selectedNodeId) : null;

  const handleSearch = () => {
    setSearching(true);
    setSearchResult(null);
    setTimeout(() => {
      const result = runMockGraphSearch(testQuery, searchMode);
      setSearchResult(result);
      if (result.localPath.nodes[0]) setSelectedNodeId(result.localPath.nodes[result.localPath.nodes.length - 1]);
      setSearching(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {focusDocName && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span>正在查看源自 <strong>{focusDocName}</strong> 的文档子图（{scopeNodeIds?.length ?? 0} 个实体）</span>
          {onClearFocus && <button type="button" onClick={onClearFocus} className="text-amber-600 hover:underline">查看全库图谱</button>}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* 筛选侧栏 */}
        <div className={`${hubCard} p-4 xl:col-span-1 space-y-3`}>
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Filter size={12} /> 图谱筛选</h3>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">实体类型</label>
            <select className={hubSelect} value={entityFilter} onChange={e => setEntityFilter(e.target.value as GraphEntityType | 'all')}>
              <option value="all">全部</option>
              {(Object.keys(ENTITY_TYPE_CFG) as GraphEntityType[]).map(t => (
                <option key={t} value={t}>{ENTITY_TYPE_CFG[t].label} ({t})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">社区</label>
            <select className={hubSelect} value={communityFilter} onChange={e => setCommunityFilter(e.target.value)}>
              <option value="all">全部社区</option>
              {GRAPH_COMMUNITIES.map(c => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">遍历深度</label>
            <select className={hubSelect} value={hopDepth} onChange={e => setHopDepth(+e.target.value)}>
              <option value={1}>1-hop</option>
              <option value={2}>2-hop</option>
              <option value={3}>3-hop</option>
            </select>
          </div>
          {searchResult && (
            <button type="button" onClick={() => setSearchResult(null)} className="text-xs text-amber-600 hover:underline w-full text-left">
              清除检索路径高亮
            </button>
          )}
        </div>

        {/* 力导向图画布 */}
        <div className={`${hubCard} p-4 xl:col-span-3`} style={{ minHeight: 380 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Network size={16} className="text-amber-600" /> 力导向图
            </h3>
            {selectedNodeId && (
              <button type="button" onClick={() => setSelectedNodeId(null)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X size={12} /> 清除选中
              </button>
            )}
          </div>
          <div className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden" style={{ height: 320 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              {filteredEdges.map(edge => {
                const from = GRAPH_NODES.find(n => n.id === edge.from)!;
                const to = GRAPH_NODES.find(n => n.id === edge.to)!;
                const highlighted = highlightEdges.has(edge.id) || (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId));
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={edge.id}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={highlighted ? '#f59e0b' : '#d1d5db'} strokeWidth={highlighted ? 0.35 : 0.2} />
                    <text x={midX} y={midY - 1} textAnchor="middle" fill="#9ca3af" fontSize="1.8">{edge.relation}</text>
                  </g>
                );
              })}
              {filteredNodes.map(node => {
                const cfg = ENTITY_TYPE_CFG[node.entityType];
                const isSelected = selectedNodeId === node.id;
                const isPath = highlightNodes.has(node.id);
                return (
                  <g key={node.id} onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <circle cx={node.x} cy={node.y} r={node.size / 9} fill={cfg.color}
                      fillOpacity={isSelected || isPath ? 1 : 0.75}
                      stroke={isSelected ? '#1d4ed8' : isPath ? '#f59e0b' : cfg.color} strokeWidth={isSelected || isPath ? 0.5 : 0.15} />
                    <text x={node.x} y={node.y + node.size / 9 + 3.5} textAnchor="middle" fill="#374151" fontSize="2.2">{node.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 节点详情 */}
        <div className={`${hubCard} p-4 xl:col-span-1`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">节点详情</h3>
          {selectedNode ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: ENTITY_TYPE_CFG[selectedNode.entityType].color }} />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedNode.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">类型</span><p>{ENTITY_TYPE_CFG[selectedNode.entityType].label}</p></div>
                <div><span className="text-gray-400">社区</span><p>{selectedNode.communityId}</p></div>
                <div><span className="text-gray-400">置信度</span><p>{(selectedNode.confidence * 100).toFixed(0)}%</p></div>
                <div><span className="text-gray-400">连接</span><p>{selectedNode.connections}</p></div>
              </div>
              {selectedNode.source && <p className="text-[10px] text-gray-500">来源: {selectedNode.source}</p>}
              {selectedNode.summary && <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">{selectedNode.summary}</p>}
              <div className="space-y-1">
                {GRAPH_EDGES.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map(edge => {
                  const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                  const other = getGraphNode(otherId)!;
                  return (
                    <button key={edge.id} type="button" onClick={() => setSelectedNodeId(otherId)}
                      className="flex items-center gap-2 text-xs w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400">{edge.relation}</span>
                      <span>{other.label}</span>
                      <ChevronRight size={10} className="ml-auto text-gray-400" />
                    </button>
                  );
                })}
              </div>
              <BtnSecondary className="w-full justify-center text-xs" onClick={() => showToast('跳转解析预览（mock）')}>
                <Eye size={11} /> 查看原文
              </BtnSecondary>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Network size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">点击节点查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 检索模式调试 */}
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Search size={14} className="text-blue-500" /> 图谱检索调试（Local / Global / Dual）
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['local', 'global', 'dual'] as const).map(m => (
            <button key={m} type="button" onClick={() => setSearchMode(m)}
              className={`px-3 py-1 text-xs rounded-lg border ${searchMode === m ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
              {m === 'local' ? 'Local' : m === 'global' ? 'Global' : 'Dual'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input value={testQuery} onChange={e => setTestQuery(e.target.value)} placeholder="输入测试查询…" className={`${hubInput} flex-1`} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <BtnPrimary onClick={handleSearch} disabled={searching}>
            {searching ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {searching ? '检索中' : '执行'}
          </BtnPrimary>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {['供应商违约金如何计算', 'X公司收购Y的影响'].map(q => (
            <button key={q} type="button" onClick={() => setTestQuery(q)} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-amber-50 text-gray-600">{q}</button>
          ))}
        </div>
        {searchResult && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                <MapPin size={12} /> {searchResult.localPath.description}
              </span>
              <span className="text-gray-500">{searchResult.totalMs}ms</span>
            </div>
            {searchResult.globalCommunity && (
              <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 text-xs">
                <p className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1 mb-1">
                  <Globe size={12} /> Global 社区 #{searchResult.globalCommunity.id} · {searchResult.globalCommunity.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{searchResult.globalCommunity.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityTab({ showToast }: { showToast: (m: string) => void }) {
  const [selectedId, setSelectedId] = useState('C3');

  const selected = GRAPH_COMMUNITIES.find(c => c.id === selectedId);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        LazyGraphRAG：社区摘要在查询时按需生成；全量模式可预计算 Leiden 社区 + LLM 摘要。
      </p>
      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80">
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">社区主题</th>
              <th className="px-4 py-2.5">实体数</th>
              <th className="px-4 py-2.5">摘要状态</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {GRAPH_COMMUNITIES.map(c => (
              <tr key={c.id}
                className={`border-b border-gray-50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50/50 ${selectedId === c.id ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <td className="px-4 py-3 text-xs font-mono text-amber-700">{c.id}</td>
                <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{c.entityCount}</td>
                <td className="px-4 py-3">
                  <HubBadge variant={SUMMARY_STATUS_CFG[c.summaryStatus].variant}>{SUMMARY_STATUS_CFG[c.summaryStatus].label}</HubBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {c.summaryStatus === 'generated' && (
                      <button type="button" onClick={() => showToast('重新生成摘要（mock）')} className="text-[10px] text-blue-600 hover:underline">重新生成</button>
                    )}
                    {c.summaryStatus === 'on_query' && (
                      <button type="button" onClick={() => showToast('预生成已触发')} className="text-[10px] text-amber-600 hover:underline">预生成</button>
                    )}
                    {c.summaryStatus === 'failed' && (
                      <button type="button" onClick={() => showToast('重试中…')} className="text-[10px] text-red-600 hover:underline">重试</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {selected.id} · {selected.name} 摘要预览
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selected.summary}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{selected.detail}</p>
          <p className="text-[10px] text-gray-400 mt-2">Leiden level={selected.level}{selected.queryHits != null ? ` · 查询命中 ${selected.queryHits} 次` : ''}</p>
        </div>
      )}
    </div>
  );
}

function BuildQueueTab({ showToast }: { showToast: (m: string) => void }) {
  const [queue, setQueue] = useState(GRAPH_BUILD_QUEUE);

  return (
    <div className="space-y-4">
      <div className={`${hubCard} p-3 text-xs text-gray-600 dark:text-gray-400`}>
        <span className="font-medium">流水线：</span>
        {PIPELINE_STEPS.map((s, i) => (
          <span key={s}>
            {s}{i < PIPELINE_STEPS.length - 1 ? ' → ' : ''}
          </span>
        ))}
        <span className="text-amber-600 ml-2">（Lazy 模式跳过「社区检测→社区摘要」）</span>
      </div>
      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-2.5">文档</th>
              <th className="px-4 py-2.5">阶段</th>
              <th className="px-4 py-2.5">进度</th>
              <th className="px-4 py-2.5">模式</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900">{item.docName}</p>
                  <p className="text-[10px] text-gray-400">{item.stepLabel}</p>
                </td>
                <td className="px-4 py-3">
                  <HubBadge variant={item.stage === 'failed' ? 'error' : item.stage === 'done' ? 'active' : 'indexing'}>
                    {BUILD_STAGE_LABEL[item.stage]}
                  </HubBadge>
                </td>
                <td className="px-4 py-3 w-32">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.stage === 'failed' ? 'bg-red-400' : 'bg-amber-500'}`} style={{ width: `${item.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{item.progress}%</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{INDEX_MODE_LABEL[item.mode].label}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.stage !== 'done' && item.stage !== 'failed' && (
                      <button type="button" onClick={() => showToast('已暂停')} className="text-[10px] text-gray-600 flex items-center gap-0.5"><Pause size={10} /> 暂停</button>
                    )}
                    {item.stage === 'failed' && (
                      <button type="button" onClick={() => showToast('重试中…')} className="text-[10px] text-blue-600 flex items-center gap-0.5"><RotateCcw size={10} /> 重试</button>
                    )}
                    {item.stage === 'queued' && (
                      <button type="button" onClick={() => setQueue(q => q.map(x => x.id === item.id ? { ...x, stage: 'entity' as const, progress: 5 } : x))} className="text-[10px] text-amber-600">优先</button>
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

function EntityReviewTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<GraphReviewItem[]>(GRAPH_REVIEW_QUEUE);
  const pending = items.filter(e => e.status === 'pending').length;

  const confirm = (id: string) => setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'confirmed' as const } : x));
  const reject = (id: string) => setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'rejected' as const } : x));

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">低置信实体/关系人工确认（抽取质量 &lt; 0.7 进入复核队列）</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{pending} 个待确认</span>
        <div className="flex gap-2">
          <BtnSecondary disabled={pending === 0} onClick={() => { setItems(e => e.map(x => x.status === 'pending' ? { ...x, status: 'confirmed' as const } : x)); showToast(`已批量确认 ${pending} 项`); }}>
            批量确认
          </BtnSecondary>
          <BtnSecondary onClick={() => showToast('导出 CSV（mock）')}>导出待复核</BtnSecondary>
        </div>
      </div>
      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-2.5">类型</th>
              <th className="px-4 py-2.5">内容</th>
              <th className="px-4 py-2.5">置信度</th>
              <th className="px-4 py-2.5">来源</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className={`border-b border-gray-50 ${item.status === 'rejected' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.itemType === 'relation' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.itemType === 'relation' ? '关系' : '实体'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                  {item.itemType === 'relation' ? item.content : (
                    <span>{item.content}{item.entityType && <span className="text-gray-400 ml-1">({item.entityType}?)</span>}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={item.confidence < 0.7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.source}</td>
                <td className="px-4 py-3">
                  {item.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => confirm(item.id)} className="text-[10px] text-green-600 hover:underline">确认</button>
                      <button type="button" onClick={() => reject(item.id)} className="text-[10px] text-red-600 hover:underline">删除</button>
                      {item.itemType === 'entity' && (
                        <button type="button" onClick={() => showToast('修改类型（mock）')} className="text-[10px] text-blue-600 hover:underline">改类型</button>
                      )}
                    </div>
                  ) : (
                    <HubBadge variant={item.status === 'confirmed' ? 'active' : 'error'}>
                      {item.status === 'confirmed' ? '已确认' : '已拒绝'}
                    </HubBadge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({
  indexMode, onModeChange, showToast,
}: {
  indexMode: GraphIndexMode;
  onModeChange: (m: GraphIndexMode) => void;
  showToast: (m: string) => void;
}) {
  const [settings, setSettings] = useState(GRAPH_DEFAULT_SETTINGS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Layers size={16} className="text-amber-600" /> 索引模式
        </h3>
        <div className="space-y-3">
          {(['lazy', 'full', 'lightrag'] as const).map(m => (
            <label key={m} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              indexMode === m ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <input type="radio" name="indexMode" checked={indexMode === m} onChange={() => { onModeChange(m); setSettings(s => ({ ...s, indexMode: m })); }} className="mt-0.5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{INDEX_MODE_LABEL[m].label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{INDEX_MODE_LABEL[m].desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Settings size={16} /> 抽取与存储
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">实体类型</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ENTITY_TYPE_CFG) as GraphEntityType[]).map(t => (
                <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={settings.entityTypes.includes(t)}
                    onChange={e => setSettings(s => ({
                      ...s,
                      entityTypes: e.target.checked ? [...s.entityTypes, t] : s.entityTypes.filter(x => x !== t),
                    }))}
                    className="rounded text-amber-600" />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">关系抽取 LLM</label>
              <select className={hubSelect} value={settings.relationLlm} onChange={e => setSettings(s => ({ ...s, relationLlm: e.target.value }))}>
                <option value="deepseek-v4">DeepSeek-v4</option>
                <option>GPT-4o</option>
                <option>Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">社区算法</label>
              <select className={hubSelect} value={settings.communityAlgo} onChange={e => setSettings(s => ({ ...s, communityAlgo: e.target.value }))}>
                <option value="leiden">Leiden</option>
                <option>Louvain</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">图数据库</label>
            <select className={hubSelect} value={settings.graphStore} onChange={e => setSettings(s => ({ ...s, graphStore: e.target.value }))}>
              <option value="neo4j">Neo4j</option>
              <option>内嵌存储</option>
            </select>
          </div>
          {indexMode === 'lazy' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={settings.lazyOnQuerySummary} onChange={e => setSettings(s => ({ ...s, lazyOnQuerySummary: e.target.checked }))} className="rounded text-amber-600" />
                查询时生成社区摘要
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={settings.lazySkipPrecompute} onChange={e => setSettings(s => ({ ...s, lazySkipPrecompute: e.target.checked }))} className="rounded text-amber-600" />
                跳过预计算社区
              </label>
            </div>
          )}
          {indexMode === 'full' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={settings.fullAutoSummary} onChange={e => setSettings(s => ({ ...s, fullAutoSummary: e.target.checked }))} className="rounded text-amber-600" />
                入库自动触发社区摘要
              </label>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大社区数</label>
                <input type="number" value={settings.maxCommunities} onChange={e => setSettings(s => ({ ...s, maxCommunities: +e.target.value }))} className={hubInput} />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <BtnSecondary className="flex-1 justify-center" onClick={() => showToast('成本估算：Lazy ¥12 / 全量 ¥1200（mock）')}>估算成本</BtnSecondary>
            <BtnSecondary className="flex-1 justify-center" onClick={() => setSettings(GRAPH_DEFAULT_SETTINGS)}>重置</BtnSecondary>
            <BtnPrimary className="flex-1 justify-center" onClick={() => showToast('图谱设置已保存')}>保存</BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
