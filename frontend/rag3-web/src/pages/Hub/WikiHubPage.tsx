import { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, FileText, CheckCircle, Clock, ChevronDown, Search, Plus,
  Eye, Settings, RefreshCw, Edit3, History, Check, X, RotateCcw,
  ExternalLink, Filter, GitCommit, AlertCircle, Pause, SkipForward,
  Folder, FolderOpen, FileCode, ScrollText,
} from 'lucide-react';
import { HubKBLayout } from '../../components/HubKBLayout';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../../components/hubUi';
import { useWikiHubData } from '../../hooks/useEnhancementHubData';
import { WikiHubContext, useWikiHubContext } from './wikiHubContext';
import {
  WIKI_COMMITS, WIKI_STATS, WIKI_LAYER_FILTERS,
  filterWikiTree, getWikiPage,
  type WikiPage, type WikiPageStatus, type WikiPageType, type WikiCompileJob, type WikiTreeNode,
  type WikiSourceDoc, type WikiIngestStatus,
} from '../../data/wikiMock';

interface WikiHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

const STATUS_CFG: Record<WikiPageStatus, { variant: 'active' | 'indexing' | 'error' | 'draft'; label: string }> = {
  published: { variant: 'active', label: '已发布' },
  reviewing: { variant: 'indexing', label: '待审核' },
  compiling: { variant: 'indexing', label: '编译中' },
  queued: { variant: 'draft', label: '排队中' },
  failed: { variant: 'error', label: '失败' },
  draft: { variant: 'draft', label: '草稿' },
};

const QUEUE_FILTERS = ['全部', '待审核', '编译中', '已发布', '失败', '排队中'] as const;

const INGEST_STATUS_CFG: Record<WikiIngestStatus, { variant: 'active' | 'indexing' | 'draft' | 'error'; label: string }> = {
  compiled: { variant: 'active', label: '已 Ingest' },
  compiling: { variant: 'indexing', label: '编译中' },
  pending: { variant: 'draft', label: '待 Ingest' },
  failed: { variant: 'error', label: '失败' },
};

const PAGE_TYPE_LABEL: Record<WikiPageType, string> = {
  raw: '原始资料',
  entity: '实体页',
  concept: '概念页',
  synthesis: '综合分析',
  comparison: '对比分析',
  index: '目录索引',
  log: '操作日志',
};

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith('- **')) {
      const parts = line.slice(2).split('**');
      return <li key={i} className="ml-4 list-disc text-sm text-gray-700 dark:text-gray-300 mb-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>)}</li>;
    }
    if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-sm text-gray-700 dark:text-gray-300 mb-1">{line.slice(2)}</li>;
    if (line === '') return <br key={i} />;
    return <p key={i} className="text-sm text-gray-700 dark:text-gray-300 mb-1 leading-relaxed">{line}</p>;
  });
}

export default function WikiHubPage({ kbId, onNavigate }: WikiHubPageProps) {
  const wiki = useWikiHubData(kbId || 'kb-001');
  const kb = wiki.kb;
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [browserFocus, setBrowserFocus] = useState<{ slug: string; rawPath?: string } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const reviewingCount = wiki.compileQueue.filter(q => q.status === 'reviewing').length;
  const compilingCount = wiki.compileQueue.filter(q => q.status === 'compiling').length;
  const ingestedCount = wiki.sourceDocs.filter(d => d.ingestStatus === 'compiled').length;

  const tabs = [
    '文档列表',
    'Wiki 浏览器',
    `编译队列${reviewingCount + compilingCount > 0 ? ` (${reviewingCount + compilingCount})` : ''}`,
    '编译设置',
    '统计',
  ];

  return (
    <HubKBLayout kbId={kbId || kb.kb_id} activeKey="wiki-hub" onNavigate={onNavigate}>
      <WikiHubContext.Provider value={wiki}>
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <HubPageShell
        title="LLM Wiki 知识库"
        subtitle={`${kb.name} · raw/ 原始资料 → wiki/ 编译知识库 · ${ingestedCount}/${wiki.sourceDocs.length} 文档已 Ingest · ${wiki.stats.published}/${wiki.stats.total} Wiki 页${wiki.isApiMode ? ' · API' : ''}`}
        icon={<BookOpen size={16} className="text-violet-500" />}
        badge={compilingCount > 0 ? { label: `${compilingCount} 编译中`, variant: 'indexing' } : undefined}
        onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || kb.kb_id })}
        secondaryAction={{
          label: '触发全量编译',
          icon: <RefreshCw size={14} />,
          onClick: () => void wiki.runBuild().then(() => showToast(wiki.isApiMode ? '已提交 Wiki 全量编译' : '全量编译任务已加入队列（mock）')),
        }}
        primaryAction={{
          label: '新建页面',
          icon: <Plus size={14} />,
          onClick: () => showToast(wiki.isApiMode ? '新建 Wiki 页需后端 Git 仓库 API，当前由 Ingest 自动生成' : '新建 Wiki 页面（mock）'),
        }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 0 && (
          <DocumentsTab
            onViewWiki={doc => {
              setBrowserFocus({ slug: doc.primaryWikiSlug || doc.relatedSlugs[0] || '', rawPath: doc.rawPath });
              setActiveTab(1);
            }}
            showToast={showToast}
          />
        )}
        {activeTab === 1 && (
          <BrowserTab
            focusSlug={browserFocus?.slug}
            focusRawPath={browserFocus?.rawPath}
            onClearFocus={() => setBrowserFocus(null)}
            onApprove={slug => showToast(wiki.isApiMode ? `[[${slug}]] 已发布（API 模式条目默认已发布）` : `[[${slug}]] 已发布`)}
          />
        )}
        {activeTab === 2 && <CompileQueueTab showToast={showToast} />}
        {activeTab === 3 && <CompileSettingsTab showToast={showToast} />}
        {activeTab === 4 && <StatsTab />}
      </HubPageShell>
      </WikiHubContext.Provider>
    </HubKBLayout>
  );
}

function WikiTreeItem({
  node, depth, selectedSlug, onSelect,
}: {
  node: WikiTreeNode;
  depth: number;
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = node.nodeType === 'folder';
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = node.slug === selectedSlug;

  const handleClick = () => {
    if (node.slug) onSelect(node.slug);
    if (isFolder && hasChildren) setExpanded(p => !p);
  };

  const icon = node.pageType === 'index' ? <FileCode size={14} className="text-violet-600" />
    : node.pageType === 'log' ? <ScrollText size={14} className="text-gray-500" />
    : isFolder
      ? (expanded ? <FolderOpen size={14} className="text-violet-500" /> : <Folder size={14} className="text-violet-400" />)
      : <FileText size={14} className={isSelected ? 'text-violet-600' : 'text-gray-400'} />;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-left text-sm transition-colors group ${
          isSelected ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        ) : <span className="w-3.5 flex-shrink-0" />}
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate flex-1">
          {node.nodeType === 'page' && node.pageType !== 'index' && node.pageType !== 'log' ? `[[${node.title}]]` : node.title}
        </span>
        {node.status && node.nodeType === 'page' && (
          <span className={`text-[9px] flex-shrink-0 px-1 rounded ${STATUS_CFG[node.status].variant === 'active' ? 'text-green-600' : node.status === 'reviewing' ? 'text-amber-600' : 'text-gray-400'}`}>
            {STATUS_CFG[node.status].label}
          </span>
        )}
      </button>
      {expanded && hasChildren && node.children!.map(child => (
        <WikiTreeItem key={child.id} node={child} depth={depth + 1} selectedSlug={selectedSlug} onSelect={onSelect} />
      ))}
    </div>
  );
}

function DocumentsTab({
  onViewWiki, showToast,
}: {
  onViewWiki: (doc: WikiSourceDoc) => void;
  showToast: (m: string) => void;
}) {
  const wiki = useWikiHubContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WikiIngestStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return wiki.sourceDocs.filter(d => {
      if (statusFilter !== 'all' && d.ingestStatus !== statusFilter) return false;
      if (search && !d.name.includes(search) && !d.rawPath.includes(search)) return false;
      return true;
    });
  }, [search, statusFilter, wiki.sourceDocs]);

  const pendingCount = wiki.sourceDocs.filter(d => d.ingestStatus === 'pending').length;
  const compilingDocCount = wiki.sourceDocs.filter(d => d.ingestStatus === 'compiling').length;

  const handleIngest = (doc: WikiSourceDoc) => {
    if (wiki.isApiMode) {
      void wiki.runBuild([doc.id]).then(() => showToast(`已提交 Ingest：${doc.name}`));
    } else {
      showToast(`Ingest 已触发：${doc.name}（mock）`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="原始文档" value={String(wiki.sourceDocs.length)} icon={<FileText size={18} className="text-violet-500" />} />
        <HubStatCard label="已 Ingest" value={String(wiki.sourceDocs.filter(d => d.ingestStatus === 'compiled').length)} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="编译中" value={String(compilingDocCount)} icon={<RefreshCw size={18} className="text-blue-500" />} />
        <HubStatCard label="待 Ingest" value={String(pendingCount)} icon={<Clock size={18} className="text-amber-500" />} />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 raw/ 文档…" className={`${hubInput} pl-9`} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'compiled', 'compiling', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${
                statusFilter === s ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              {s === 'all' ? '全部' : INGEST_STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
        Karpathy 工作流：原始资料放入 <code className="text-violet-600">raw/</code>（只读）→ Ingest 编译 → LLM 维护 <code className="text-violet-600">wiki/</code> 目录树。先选文档，再查看产出 Wiki 页。
      </p>

      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
              <th className="px-4 py-2.5">原始文档 (raw/)</th>
              <th className="px-4 py-2.5">类型</th>
              <th className="px-4 py-2.5">Ingest 状态</th>
              <th className="px-4 py-2.5">Wiki 产出</th>
              <th className="px-4 py-2.5">最近 Ingest</th>
              <th className="px-4 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{doc.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{doc.rawPath}</p>
                      {doc.ingestNote && <p className="text-[10px] text-gray-500 mt-0.5">{doc.ingestNote}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{doc.fileType} · {doc.size}</td>
                <td className="px-4 py-3">
                  <HubBadge variant={INGEST_STATUS_CFG[doc.ingestStatus].variant}>{INGEST_STATUS_CFG[doc.ingestStatus].label}</HubBadge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {doc.wikiPageCount > 0 ? (
                    <span>{doc.wikiPageCount} 页 · {doc.relatedSlugs.slice(0, 2).map(s => `[[${wiki.getPage(s)?.title ?? getWikiPage(s)?.title ?? s}]]`).join('、')}{doc.relatedSlugs.length > 2 ? '…' : ''}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{doc.lastIngest}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {doc.wikiPageCount > 0 && (
                      <button type="button" onClick={() => onViewWiki(doc)} className="text-[10px] text-violet-600 hover:underline font-medium">
                        查看 Wiki
                      </button>
                    )}
                    {doc.ingestStatus !== 'compiling' && (
                      <button type="button" onClick={() => handleIngest(doc)} className="text-[10px] text-blue-600 hover:underline">
                        {doc.ingestStatus === 'pending' ? '触发 Ingest' : '重新 Ingest'}
                      </button>
                    )}
                    {doc.ingestStatus === 'failed' && (
                      <button type="button" onClick={() => handleIngest(doc)} className="text-[10px] text-red-600 hover:underline">重试</button>
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

function BrowserTab({
  onApprove, focusSlug, focusRawPath, onClearFocus,
}: {
  onApprove: (slug: string) => void;
  focusSlug?: string;
  focusRawPath?: string;
  onClearFocus?: () => void;
}) {
  const wiki = useWikiHubContext();
  const [search, setSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<WikiPageType | 'all'>('all');
  const [selectedSlug, setSelectedSlug] = useState(wiki.pages[0]?.slug ?? 'supplier-penalty');
  const [showEditor, setShowEditor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (focusSlug) setSelectedSlug(focusSlug);
  }, [focusSlug]);

  useEffect(() => {
    if (!focusSlug && wiki.pages[0]?.slug) setSelectedSlug(wiki.pages[0].slug);
  }, [wiki.pages, focusSlug]);

  const filteredTree = useMemo(
    () => filterWikiTree(wiki.tree, layerFilter, search),
    [wiki.tree, layerFilter, search],
  );

  const page = wiki.getPage(selectedSlug) ?? getWikiPage(selectedSlug);

  const openEditor = () => {
    if (!page) return;
    setEditContent(page.content);
    setShowEditor(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 -m-6 min-h-[calc(100%+3rem)]">
      {/* 左侧 wiki/ 目录树（index.md catalog） */}
      <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">wiki/ 目录树</p>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索页面…" className={`${hubInput} pl-8 py-1.5 text-xs`} />
          </div>
        </div>
        <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 mb-1.5 px-1">Layer 页面类型</p>
          <div className="flex flex-wrap gap-1">
            {WIKI_LAYER_FILTERS.map(l => (
              <button
                key={l.key}
                type="button"
                title={l.desc}
                onClick={() => setLayerFilter(l.key)}
                className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                  layerFilter === l.key
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 min-h-[280px] lg:min-h-0">
          {filteredTree ? (
            <WikiTreeItem node={filteredTree} depth={0} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">无匹配页面</p>
          )}
        </div>
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          raw/ 只读 · LLM 维护 wiki/ · schema 配置
        </div>
      </div>

      {/* 右侧 Wiki 页面预览 */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/50">
        {focusRawPath && (
          <div className="max-w-2xl mx-auto mb-4 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg text-xs text-violet-800 dark:text-violet-200 flex flex-wrap items-center justify-between gap-2">
            <span>正在查看源自 <code className="font-mono">{focusRawPath}</code> 的 Wiki 产出</span>
            {onClearFocus && (
              <button type="button" onClick={onClearFocus} className="text-violet-600 hover:underline">查看全部 Wiki</button>
            )}
          </div>
        )}
        {page ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">[[{page.title}]]</h1>
                  <span className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">{PAGE_TYPE_LABEL[page.pageType]}</span>
                  <HubBadge variant={STATUS_CFG[page.status].variant}>{STATUS_CFG[page.status].label}</HubBadge>
                  {page.citeRate !== null && (
                    <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">引用率 {page.citeRate}%</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {page.version} · {page.author} · {page.updated}
                  {page.rawSource && <> · 源自 <code className="text-violet-600">{page.rawSource}</code></>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {page.pageType !== 'raw' && page.pageType !== 'log' && (
                  <>
                    <BtnSecondary onClick={openEditor}><Edit3 size={12} /> 编辑</BtnSecondary>
                    <BtnSecondary onClick={() => setShowHistory(true)}><History size={12} /> 版本历史</BtnSecondary>
                  </>
                )}
                {page.status === 'reviewing' && (
                  <BtnPrimary onClick={() => onApprove(page.slug)}><Check size={12} /> 审核通过</BtnPrimary>
                )}
              </div>
            </div>
            <div className={`${hubCard} p-5 mb-4 bg-white`}>{renderMarkdown(page.content)}</div>
            {(page.sources.length > 0 || page.related.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {page.sources.length > 0 && (
                  <div className={`${hubCard} p-4 bg-white`}>
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">引用来源</h4>
                    {page.sources.map(s => (
                      <button key={s} type="button" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-1 w-full text-left">
                        <ExternalLink size={11} /> {s}
                      </button>
                    ))}
                  </div>
                )}
                {page.related.length > 0 && (
                  <div className={`${hubCard} p-4 bg-white`}>
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">交叉引用</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {page.related.map(r => (
                        <span key={r} className="text-xs font-mono px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg cursor-pointer hover:bg-violet-100">[[{r}]]</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-12">在左侧目录树选择 Wiki 页面</p>
        )}
      </div>

      {showEditor && page && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">编辑: [[{page.title}]]</h3>
              <button type="button" onClick={() => setShowEditor(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="flex-1 p-4 text-sm font-mono border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 resize-none focus:outline-none" />
              <div className="flex-1 p-4 overflow-y-auto">{renderMarkdown(editContent)}</div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <BtnSecondary onClick={() => setShowEditor(false)}>取消</BtnSecondary>
              <BtnPrimary onClick={() => { setShowEditor(false); }}>保存</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {showHistory && page && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><GitCommit size={16} /> [[{page.title}]] 版本历史</h3>
              <button type="button" onClick={() => setShowHistory(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {WIKI_COMMITS.map(c => (
                <div key={c.id} className={`${hubCard} p-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.id} · {c.time} · {c.author}</p>
                    </div>
                    <button type="button" className="text-[10px] text-blue-600 hover:underline">回滚</button>
                  </div>
                  {c.diff && (
                    <div className="mt-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span className="text-red-500 line-through">{c.diff.removed}</span>
                      <span className="mx-2 text-gray-300">→</span>
                      <span className="text-green-600">{c.diff.added}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompileQueueTab({ showToast }: { showToast: (m: string) => void }) {
  const wiki = useWikiHubContext();
  const [filter, setFilter] = useState<string>('全部');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewNote, setReviewNote] = useState('');
  const queue = wiki.compileQueue;

  const retryJob = (job: WikiCompileJob) => {
    const docId = job.id.replace(/^(build|pending|failed)-/, '');
    if (wiki.isApiMode) {
      void wiki.runBuild([docId]).then(() => showToast(`已提交重试：${job.title}`));
    } else {
      showToast('重试中…');
    }
  };

  const filtered = useMemo(() => {
    const list = filter === '全部' ? queue : queue.filter(q => STATUS_CFG[q.status].label === filter || (filter === '排队中' && q.status === 'queued'));
    return [...list].sort((a, b) => {
      if (a.status === 'reviewing' && b.status !== 'reviewing') return -1;
      if (b.status === 'reviewing' && a.status !== 'reviewing') return 1;
      return (b.citeRate ?? 0) - (a.citeRate ?? 0);
    });
  }, [queue, filter]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const approveSelected = () => {
    showToast(wiki.isApiMode ? `已通过 ${selected.size} 项（API 条目默认已发布）` : `已通过 ${selected.size} 项`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {QUEUE_FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs rounded-lg border ${filter === f ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>{f}</button>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Filter size={11} /> 引用率 &gt; 80% 待审核项置顶</span>
      </div>

      <div className={`${hubCard} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-2 w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())} /></th>
              <th className="px-4 py-2">页面</th>
              <th className="px-4 py-2">状态</th>
              <th className="px-4 py-2">引用率</th>
              <th className="px-4 py-2">优先级</th>
              <th className="px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && wiki.isApiMode && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">暂无排队或进行中的编译任务</td></tr>
            )}
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900 text-xs">[[{item.title}]]</p>
                  <p className="text-[10px] text-gray-400">{item.step} · {item.started}</p>
                  {item.status === 'compiling' && (
                    <div className="w-24 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5"><HubBadge variant={STATUS_CFG[item.status].variant}>{STATUS_CFG[item.status].label}</HubBadge></td>
                <td className="px-4 py-2.5 text-xs">{item.citeRate !== null ? `${item.citeRate}%` : '—'}</td>
                <td className="px-4 py-2.5 text-xs">{item.priority}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {item.status === 'reviewing' && (
                      <>
                        <button type="button" onClick={() => showToast('预览（mock）')} className="text-[10px] text-blue-600">预览</button>
                        <button type="button" onClick={() => showToast('已通过')} className="text-[10px] text-green-600">通过</button>
                        <button type="button" onClick={() => showToast('已退回修改')} className="text-[10px] text-red-600">退回</button>
                      </>
                    )}
                    {item.status === 'compiling' && (
                      <button type="button" disabled={wiki.isApiMode} onClick={() => showToast(wiki.isApiMode ? '暂停暂不支持' : '已暂停')} className={`text-[10px] flex items-center gap-0.5 ${wiki.isApiMode ? 'text-gray-400' : 'text-gray-600'}`}><Pause size={10} /> 暂停</button>
                    )}
                    {item.status === 'failed' && (
                      <>
                        <button type="button" onClick={() => retryJob(item)} className="text-[10px] text-blue-600 flex items-center gap-0.5"><RotateCcw size={10} /> 重试</button>
                        <button type="button" onClick={() => showToast('已跳过')} className="text-[10px] text-gray-500 flex items-center gap-0.5"><SkipForward size={10} /> 跳过</button>
                      </>
                    )}
                    {(item.status === 'published' || item.status === 'queued') && (
                      <button type="button" onClick={() => retryJob(item)} className="text-[10px] text-blue-600">
                        {item.status === 'queued' ? '触发' : '重编译'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${hubCard} p-4 flex flex-wrap gap-3 items-end`}>
        <div className="flex-1 min-w-48">
          <label className="text-xs text-gray-500 block mb-1">审核说明</label>
          <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="批量审核备注（可选）" className={hubInput} />
        </div>
        <BtnPrimary onClick={approveSelected} disabled={selected.size === 0}><Check size={14} /> 通过选中 ({selected.size})</BtnPrimary>
        <BtnSecondary onClick={() => showToast('已批量退回')}>退回修改</BtnSecondary>
      </div>
    </div>
  );
}

function CompileSettingsTab({ showToast }: { showToast: (m: string) => void }) {
  const [trigger, setTrigger] = useState('manual');
  const [autoPublish, setAutoPublish] = useState(false);
  const [manualReview, setManualReview] = useState(true);
  const [autoCommit, setAutoCommit] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Settings size={16} /> 编译策略</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">触发策略</label>
            <div className="space-y-2">
              {[
                { v: 'auto', l: '新文档自动编译' },
                { v: 'scheduled', l: '定时全量（每日 02:00）' },
                { v: 'manual', l: '手动触发' },
              ].map(opt => (
                <label key={opt.v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="trigger" checked={trigger === opt.v} onChange={() => setTrigger(opt.v)} className="text-violet-600" />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">编译 LLM</label>
            <select className={hubSelect} defaultValue="deepseek">
              <option value="deepseek">DeepSeek-v4（推荐）</option>
              <option>GPT-4o</option>
              <option>Claude 3.5 Sonnet</option>
              <option>Qwen-Max</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">实体抽取阈值</label>
            <input type="range" min={50} max={95} defaultValue={75} className="w-full" />
            <p className="text-[10px] text-gray-400 mt-1">当前 0.75 · 低于阈值不建页</p>
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-5`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">审核与 Git</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={manualReview} onChange={e => setManualReview(e.target.checked)} className="rounded text-violet-600" />
            <span className="text-sm text-gray-700">引用率 &gt; 80% 需人工审核</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoPublish} onChange={e => setAutoPublish(e.target.checked)} className="rounded text-violet-600" />
            <span className="text-sm text-gray-700">审核通过后自动发布</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Git 分支</label>
            <select className={hubSelect} defaultValue="main">
              <option value="main">main（生产）</option>
              <option>experiment（实验）</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoCommit} onChange={e => setAutoCommit(e.target.checked)} className="rounded text-violet-600" />
            <span className="text-sm text-gray-700">编译完成自动 commit</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">增量策略</label>
            <div className="space-y-1.5 text-sm text-gray-700">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> 新实体自动建页</label>
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> 更新关联综合页</label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <BtnSecondary className="flex-1 justify-center">重置默认</BtnSecondary>
            <BtnPrimary className="flex-1 justify-center" onClick={() => showToast('编译设置已保存')}>保存配置</BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  const wiki = useWikiHubContext();
  const stats = wiki.stats;
  const maxCompile = Math.max(...(stats.weeklyCompile?.length ? stats.weeklyCompile : [1]));

  return (
    <div className="space-y-5">
      {wiki.isApiMode && (
        <div className={`${hubCard} p-3 text-xs text-violet-800 dark:text-violet-200 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800`}>
          统计指标来自 RAG3 <code className="text-[10px]">GET /rag3/datasets/:id/wiki/entries</code>；层级分布与周编译趋势在真实 Ingest 积累后逐步有数据。
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="已发布页面" value={`${stats.published}/${stats.total}`} icon={<CheckCircle size={18} className="text-green-500" />} />
        <HubStatCard label="待审核" value={String(stats.reviewing)} icon={<Clock size={18} className="text-yellow-500" />} />
        <HubStatCard label="编译中" value={String(stats.compiling)} icon={<RefreshCw size={18} className="text-blue-500" />} />
        <HubStatCard label="平均引用率" value={stats.avgCiteRate ? `${stats.avgCiteRate}%` : '—'} icon={<Eye size={18} className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">层级分布</h3>
          <div className="space-y-3">
            {(stats.layerDist ?? WIKI_STATS.layerDist).map(l => (
              <div key={l.layer}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700">{l.layer}</span>
                  <span className="text-gray-500">{l.count} ({l.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${l.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${hubCard} p-4`}>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">高引用页面 Top 5</h3>
          <div className="space-y-2">
            {(stats.topCited ?? WIKI_STATS.topCited).map((t, i) => (
              <div key={t.title} className="flex items-center justify-between text-sm">
                <span className="text-gray-700"><span className="text-gray-400 mr-2">#{i + 1}</span>{t.title}</span>
                <span className="text-xs font-medium text-violet-600">{t.cites} 次引用</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">编译趋势（近 7 天）</h3>
        <div className="flex items-end gap-2 h-28">
          {(stats.weeklyCompile ?? WIKI_STATS.weeklyCompile).map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-violet-500 rounded-t-sm opacity-80" style={{ height: `${(val / maxCompile) * 100}%`, minHeight: 4 }} />
              <span className="text-[10px] text-gray-400">{['一', '二', '三', '四', '五', '六', '日'][idx]}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">GET /api/v1/rag3/datasets/&#123;kb_id&#125;/wiki/entries</p>
      </div>

      {stats.failed > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} />
          {stats.failed} 个文档编译失败，请前往编译队列处理
        </div>
      )}
    </div>
  );
}
