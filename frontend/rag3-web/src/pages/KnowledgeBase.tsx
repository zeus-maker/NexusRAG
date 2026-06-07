import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, MoreHorizontal, Database, FileText,
  Cpu, Clock, TrendingUp, ArrowRight, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Loader, BookOpen, Network,
  ChevronRight, GitBranch, Edit, LayoutGrid, List,
  FlaskConical, Activity, Archive, Copy, Download,
  ChevronLeft, AlertCircle as AlertIcon, Eye, Columns3,
} from 'lucide-react';
import { DocumentParsePreviewPanel } from '../components/kb/DocumentParsePreviewPanel';
import { DocumentActionMenu, parseStatusFilterLabel } from '../components/kb/DocumentActionMenu';
import { ChunkSplitDialog } from '../components/kb/ChunkSplitDialog';
import type { ParseStatus } from '../types';
import { getPageIndexDocIdForKbDoc } from '../data/pageIndexMock';
import { mockKBs, mockDocuments, mockChunks, mockIndexStatuses } from '../mockData';
import type { KnowledgeBase } from '../types';
import {
  useKnowledgeBaseList,
  useKnowledgeBase,
  useDocuments,
  useChunks,
  useIndexTrace,
  useIngestionLogs,
  createKnowledgeBase,
  deleteKnowledgeBase,
  uploadKbDocuments,
  uploadKbFromUrl,
  deleteKbDocuments,
  parseKbDocuments,
  stopKbDocuments,
  splitKbChunk,
  mergeKbChunks,
  setKbChunkAvailability,
} from '../hooks/useKbData';
import type { Chunk } from '../types';
import { useRealApi } from '../services/http';
import { PARSE_STATUS_UI } from '../services/kbMappers';
import { kbApi } from '../services/kbApi';
import { KBCreateDialog, type KBCreateForm } from '../components/KBCreateDialog';
import { addToRecycleBin, getRecycleBinCount } from '../data/kbRecycleBin';
import { PAGEINDEX_GLOBAL_FAILED_COUNT } from '../data/pageIndexMock';
import { KBDetailLayout } from '../components/KBDetailLayout';
import {
  getGovernanceSummary, getKBHealthScore, getKBHealthFailures,
  getGovernedDocuments, getUploadQueue, PIPELINE_STAGE_LABELS, CERT_LABELS,
  getAllChunkQuality, FAILURE_STAGE_LABELS,
} from '../data/kbGovernanceMock';

const statusConfig = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  indexing: { label: '索引中', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500 animate-pulse' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function formatTime(iso: string) {
  const now = new Date('2026-06-05T12:00:00Z').getTime();
  const t = new Date(iso).getTime();
  const diff = now - t;
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  return Math.floor(diff / 86400000) + ' 天前';
}

const PAGE_SIZE = 8;
const SORT_OPTIONS = [
  { v: 'updated', l: '最近更新' },
  { v: 'name', l: '名称' },
  { v: 'docs', l: '文档数' },
  { v: 'chunks', l: 'Chunk 数' },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['v'];

function sortKBs(list: KnowledgeBase[], sortBy: SortKey, desc: boolean) {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'updated') cmp = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    else if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'zh-CN');
    else if (sortBy === 'docs') cmp = b.doc_count - a.doc_count;
    else if (sortBy === 'chunks') cmp = b.chunk_count - a.chunk_count;
    return desc ? cmp : -cmp;
  });
  return sorted;
}

interface KBListPageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function KBListPage({ onNavigate }: KBListPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('updated');
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [recycleCount, setRecycleCount] = useState(getRecycleBinCount);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: listResult, loading, error, refresh, isApiMode } = useKnowledgeBaseList(
    sortBy, sortDesc, search, page, PAGE_SIZE, statusFilter,
  );

  const filtered = useMemo(() => {
    if (isApiMode) return listResult.items;
    const list = mockKBs.filter(kb => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || kb.name.toLowerCase().includes(q) || kb.description.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || kb.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return sortKBs(list, sortBy, sortDesc);
  }, [isApiMode, listResult.items, search, statusFilter, sortBy, sortDesc]);

  const totalCount = isApiMode ? listResult.total : filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paged = isApiMode ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statsSource = isApiMode ? listResult.items : mockKBs;
  const kbStats = useMemo(() => ({
    total: isApiMode ? listResult.total : mockKBs.length,
    active: statsSource.filter(k => k.status === 'active').length,
    docs: statsSource.reduce((s, k) => s + k.doc_count, 0),
    chunks: statsSource.reduce((s, k) => s + k.chunk_count, 0),
    storage: statsSource.reduce((s, k) => s + k.total_size_bytes, 0),
  }), [isApiMode, listResult.total, listResult.items, statsSource]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const kbMenuActions = (kb: KnowledgeBase) => [
    { icon: <Edit size={13} />, label: '编辑设置', action: () => onNavigate('kb-settings', { selectedKBId: kb.kb_id }) },
    { icon: <FileText size={13} />, label: '查看文档', action: () => onNavigate('kb-documents', { selectedKBId: kb.kb_id }) },
    { icon: <FlaskConical size={13} />, label: '检索测试', action: () => onNavigate('kb-retrieval-test', { selectedKBId: kb.kb_id }) },
    { icon: <Activity size={13} />, label: '索引状态', action: () => onNavigate('kb-index-status', { selectedKBId: kb.kb_id }) },
    { icon: <RefreshCw size={13} />, label: '重建索引', action: () => showToast(`已提交「${kb.name}」全量重建`) },
    { icon: <Download size={13} />, label: '导出', action: () => onNavigate('kb-export', { selectedKBId: kb.kb_id }) },
    { icon: <Copy size={13} />, label: '复制配置', action: () => showToast('配置已复制到剪贴板（原型）') },
    { icon: <Archive size={13} />, label: '归档', action: () => showToast(`「${kb.name}」已标记归档`) },
    { icon: <Trash2 size={13} />, label: '删除', action: () => setDeleteTarget(kb), danger: true },
  ];

  const handleCreate = async (form: KBCreateForm) => {
    setCreating(true);
    try {
      if (isApiMode) {
        const created = await createKnowledgeBase(form);
        refresh();
        onNavigate('kb-detail', { selectedKBId: created.kb_id });
        showToast(`知识库「${created.name}」创建成功`);
      } else {
        await new Promise(r => setTimeout(r, 900));
        onNavigate('kb-detail', { selectedKBId: 'kb-001' });
        showToast(`知识库「${form.name.trim()}」创建成功，已进入详情`);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '创建失败');
      throw e;
    } finally {
      setCreating(false);
    }
  };

  const moveToRecycleBin = async (kb: KnowledgeBase) => {
    try {
      if (isApiMode) {
        await deleteKnowledgeBase([kb.kb_id]);
        refresh();
        showToast(`「${kb.name}」已删除`);
      } else {
        addToRecycleBin({
          id: `rb-${Date.now()}`,
          name: kb.name,
          type: '知识库',
          kb: '—',
          deletedAt: new Date().toISOString(),
          daysLeft: 30,
          deletedBy: '当前用户',
          docCount: kb.doc_count,
        });
        setRecycleCount(getRecycleBinCount());
        showToast(`「${kb.name}」已移入回收站`);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败');
    }
    setDeleteTarget(null);
  };

  const KBCard = ({ kb }: { kb: KnowledgeBase }) => {
    const sc = statusConfig[kb.status];
    const indexPct = kb.status === 'indexing' ? 68 : 100;
    return (
      <div
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700 cursor-pointer transition-all group relative flex flex-col"
        onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="text-2xl flex-shrink-0">{kb.icon}</div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight group-hover:text-blue-700 truncate">{kb.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${sc.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
              </span>
            </div>
          </div>
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setOpenMenu(openMenu === kb.kb_id ? null : kb.kb_id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <MoreHorizontal size={14} />
            </button>
            {openMenu === kb.kb_id && (
              <div className="absolute right-0 top-6 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-30 overflow-hidden">
                {kbMenuActions(kb).map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { m.action(); setOpenMenu(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${(m as { danger?: boolean }).danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed flex-1">{kb.description}</p>

        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{kb.chunk_strategy}</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded truncate max-w-[120px]">{kb.embedding_model}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { v: kb.doc_count, l: '文档' },
            { v: (kb.chunk_count / 1000).toFixed(1) + 'k', l: 'Chunk' },
            { v: formatBytes(kb.total_size_bytes), l: '存储' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1.5 text-center">
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{s.v}</div>
              <div className="text-[9px] text-gray-500">{s.l}</div>
            </div>
          ))}
        </div>

        {kb.status === 'indexing' && (
          <div className="mb-2">
            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
              <span>索引进度</span><span>{indexPct}%</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${indexPct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
          {[
            { icon: FileText, label: '文档', page: 'kb-documents' },
            { icon: FlaskConical, label: '检索', page: 'kb-retrieval-test' },
            { icon: Activity, label: '索引', page: 'kb-index-status' },
          ].map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.page}
                type="button"
                onClick={() => onNavigate(link.page, { selectedKBId: kb.kb_id })}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Icon size={10} />{link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5">
          <span>{kb.language}</span>
          <div className="flex items-center gap-1">
            <Clock size={10} /><span>更新 {formatTime(kb.updated_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50/30 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            知识库管理
            {isApiMode && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                API
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">管理企业知识库，配置解析分块与 RAG 3.0 增强索引</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { onNavigate('kb-recycle-bin'); setRecycleCount(getRecycleBinCount()); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 relative"
          >
            <Trash2 size={14} /> 回收站
            {recycleCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {recycleCount > 99 ? '99+' : recycleCount}
              </span>
            )}
          </button>
          {isApiMode && (
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-60"
          >
            <Plus size={16} /> 创建知识库
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '知识库总数', value: kbStats.total, sub: `${kbStats.active} 活跃`, icon: Database, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '文档总数', value: kbStats.docs.toLocaleString(), sub: isApiMode ? '当前页合计' : '全库合计', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Chunk 总数', value: (kbStats.chunks / 1000).toFixed(1) + 'k', sub: '已向量化', icon: Cpu, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: '存储总量', value: formatBytes(kbStats.storage), sub: '含原始文件', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className={`${s.bg} p-2 rounded-lg`}><Icon size={16} className={s.color} /></div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{s.label}</div>
                <div className="text-[10px] text-gray-400">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索知识库名称或描述..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'all', l: '全部' }, { v: 'active', l: '活跃' }, { v: 'indexing', l: '索引中' }, { v: 'archived', l: '已归档' }].map(f => (
            <button
              key={f.v}
              type="button"
              onClick={() => { setStatusFilter(f.v); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${statusFilter === f.v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
        >
          {SORT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setSortDesc(d => !d)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
        >
          {sortDesc ? '↓ 降序' : '↑ 升序'}
        </button>
        <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <button type="button" onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><LayoutGrid size={14} /></button>
          <button type="button" onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><List size={14} /></button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={refresh} className="ml-auto text-xs underline">重试</button>
        </div>
      )}

      {loading && paged.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader size={32} className="mx-auto text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-500">正在加载知识库列表…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <Database size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">未找到匹配的知识库</p>
          <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-2 text-xs text-blue-600 hover:underline">清除筛选</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map(kb => <KBCard key={kb.kb_id} kb={kb} />)}
          <div
            onClick={() => setShowCreate(true)}
            className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer min-h-[200px]"
          >
            <Plus size={20} className="text-gray-400" />
            <span className="text-sm text-gray-500">创建新知识库</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">知识库</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">状态</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">文档</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Chunk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">嵌入模型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden xl:table-cell">更新时间</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {paged.map(kb => {
                const sc = statusConfig[kb.status];
                return (
                  <tr key={kb.kb_id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{kb.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{kb.name}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{kb.chunk_strategy}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{kb.doc_count}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">{(kb.chunk_count / 1000).toFixed(1)}k</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell truncate max-w-[140px]">{kb.embedding_model}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{formatTime(kb.updated_at)}</td>
                    <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => setOpenMenu(openMenu === kb.kb_id ? null : kb.kb_id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>共 {filtered.length} 个知识库，第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded text-xs ${page === n ? 'bg-blue-600 text-white' : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {n}
              </button>
            ))}
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      <KBCreateDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 text-red-600 mb-3"><AlertIcon size={20} /> 删除知识库</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">确定删除「{deleteTarget.name}」？</p>
            <p className="text-xs text-gray-500 mb-4">将移入回收站，保留 30 天可恢复。</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
              <button type="button" onClick={() => moveToRecycleBin(deleteTarget)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">移入回收站</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KBDetailPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function KBDetailPage({ kbId, onNavigate }: KBDetailPageProps) {
  const { data: kb, loading: kbLoading, error: kbError } = useKnowledgeBase(kbId);
  const { data: recentDocs } = useDocuments(kbId);
  const governance = useRealApi ? null : getGovernanceSummary(kbId);
  const health = useRealApi
    ? { overall: Math.min(100, Math.round((kb.chunk_count > 0 ? 85 : 60) + (kb.doc_count > 0 ? 10 : 0))) }
    : getKBHealthScore(kbId);

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-detail" onNavigate={onNavigate} kbOverride={kb}>
      <div className="p-6 flex flex-col gap-5">
        {kbError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{kbError}</div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{kb.icon}</span>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              概览{kbLoading && useRealApi ? '（加载中）' : ''}
            </h1>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[kb.status].color}`}>{statusConfig[kb.status].label}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('kb-documents', { selectedKBId: kb.kb_id })}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
          >
            <FileText size={14} /> 管理文档
          </button>
        </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: '文档总数', value: kb.doc_count, icon: '📄', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
          { label: 'Chunk 数', value: kb.chunk_count.toLocaleString(), icon: '📦', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
          { label: '存储大小', value: formatBytes(kb.total_size_bytes), icon: '💾', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
          { label: '解析质量', value: '92.5', icon: '⭐', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
          { label: '健康分', value: health.overall, icon: '💚', color: health.overall >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {useRealApi ? (
        <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">运行状态</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-800 dark:text-blue-300 mb-3">
            <span>文档 <strong>{kb.doc_count}</strong></span>
            <span>Chunk <strong>{kb.chunk_count.toLocaleString()}</strong></span>
            <span>嵌入模型 <strong>{kb.embedding_model}</strong></span>
            <span>分块策略 <strong>{kb.chunk_strategy}</strong></span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('kb-index-status', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-900">
              索引状态
            </button>
            <button type="button" onClick={() => onNavigate('kb-logs', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-900">
              摄取日志
            </button>
            <button type="button" onClick={() => onNavigate('kb-retrieval-test', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-900">
              检索测试
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">治理摘要</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-800 dark:text-amber-300 mb-3">
            <span>⚠ 陈旧 <strong>{governance!.stale_count}</strong></span>
            <span>待认证 <strong>{governance!.pending_certification}</strong></span>
            <span>解析待复核 <strong>{governance!.parse_review_count}</strong></span>
            <span>ACL 异常 <strong>{governance!.acl_anomaly_count}</strong></span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('kb-governance-stale', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-amber-300 rounded-lg hover:bg-amber-100 text-amber-900">
              查看陈旧队列
            </button>
            <button type="button" onClick={() => onNavigate('kb-index-status', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-amber-300 rounded-lg hover:bg-amber-100 text-amber-900">
              失败归因 → 索引状态
            </button>
            <button type="button" onClick={() => onNavigate('kb-logs', { selectedKBId: kbId })} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-amber-300 rounded-lg hover:bg-amber-100 text-amber-900">
              处理日志
            </button>
          </div>
        </div>
      )}

      {/* 增强索引 Hub 入口 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">增强索引</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { id: 'pageindex-hub', label: 'PageIndex 管理', desc: '无向量树索引 · 85/156 已建树', detail: `建树率 54.5% · 失败 ${PAGEINDEX_GLOBAL_FAILED_COUNT} 个`, icon: GitBranch, accent: 'text-cyan-600', border: 'hover:border-cyan-300' },
            { id: 'wiki-hub', label: 'LLM Wiki 知识库', desc: '12/42 页面已发布', detail: '待审核: 3 个, 编译中: 2 个', icon: BookOpen, accent: 'text-violet-600', border: 'hover:border-violet-300' },
            { id: 'graphrag-hub', label: '知识图谱管理', desc: 'LazyGraphRAG · 1.2K 实体', detail: '48 社区 · 86 实体待复核', icon: Network, accent: 'text-amber-600', border: 'hover:border-amber-300' },
          ] as const).map(hub => {
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                onClick={() => onNavigate(hub.id, { selectedKBId: kb.kb_id })}
                className={`bg-white rounded-xl border border-gray-200 p-5 text-left transition-all group hover:shadow-md ${hub.border}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={20} className={`${hub.accent} opacity-70`} />
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{hub.label}</h4>
                </div>
                <p className="text-xs text-gray-600 mb-1">{hub.desc}</p>
                <p className="text-xs text-gray-400 mb-3">{hub.detail}</p>
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  进入 <ChevronRight size={14} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Query trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">近30天查询趋势</h3>
          <div className="flex items-end gap-1 h-24">
            {[28, 35, 22, 45, 38, 52, 31, 48, 55, 42, 60, 38, 44, 58, 67, 52, 48, 71, 63, 58, 74, 68, 55, 82, 76, 69, 85, 79, 88, 92].map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${(v / 92) * 100}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>5月7日</span>
            <span>今日 92 次</span>
          </div>
        </div>

        {/* Doc type distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">文档类型分布</h3>
          <div className="space-y-2">
            {[
              { type: 'PDF', count: 85, color: 'bg-red-500', pct: 85 },
              { type: 'DOCX', count: 42, color: 'bg-blue-500', pct: 42 },
              { type: 'XLSX', count: 18, color: 'bg-green-500', pct: 18 },
              { type: '其他', count: 11, color: 'bg-gray-400', pct: 11 },
            ].map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-8">{d.type}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }}></div>
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent uploads & top queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">最近上传</h3>
          <div className="space-y-2">
            {(useRealApi ? recentDocs.slice(0, 3) : [
              { original_name: '合同模板V6.pdf', uploaded_at: new Date(Date.now() - 7200000).toISOString(), file_type: 'PDF' },
              { original_name: '审计报告.pdf', uploaded_at: new Date(Date.now() - 86400000).toISOString(), file_type: 'PDF' },
              { original_name: '财务数据.xlsx', uploaded_at: new Date(Date.now() - 172800000).toISOString(), file_type: 'XLSX' },
            ]).map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileText size={13} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{'original_name' in f ? f.original_name : (f as { name: string }).name}</div>
                  <div className="text-[10px] text-gray-400">{'file_type' in f ? f.file_type : (f as { type: string }).type} · {formatTime('uploaded_at' in f ? f.uploaded_at : new Date().toISOString())}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">高频查询</h3>
          <div className="space-y-2">
            {[
              { query: '供应商违约金条款', count: 143 },
              { query: '知识产权归属模板', count: 98 },
              { query: '合同解除条件', count: 76 },
              { query: '保密协议有效期', count: 64 },
            ].map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-800 truncate">{q.query}</div>
                </div>
                <span className="text-xs text-blue-600 font-medium flex-shrink-0">{q.count}次</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </KBDetailLayout>
  );
}

interface DocumentPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function DocumentPage({ kbId, onNavigate }: DocumentPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParseStatus | 'all'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urlName, setUrlName] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [menuDocId, setMenuDocId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const { data: documents, loading: docsLoading, error: docsError, refresh: refreshDocs } = useDocuments(kbId, search);
  const governedMap = useRealApi ? {} : Object.fromEntries(getGovernedDocuments(kbId).map(g => [g.doc_id, g]));
  const uploadQueue = useRealApi
    ? documents.filter(d => d.parse_status === 'parsing' || d.parse_status === 'pending').map(d => ({
        name: d.original_name,
        size: formatBytes(d.file_size),
        progress: d.parse_status === 'parsing' ? 50 : 10,
        stage: d.parse_status === 'parsing' ? 'parsing' as const : 'uploading' as const,
      }))
    : getUploadQueue();

  const filtered = useMemo(() => {
    const base = useRealApi
      ? documents
      : mockDocuments.filter(d => d.kb_id === kbId && d.original_name.includes(search));
    const byStatus = statusFilter === 'all' ? base : base.filter(d => d.parse_status === statusFilter);
    return byStatus;
  }, [documents, statusFilter, kbId, search]);

  const previewDoc = previewDocId ? filtered.find(d => d.doc_id === previewDocId) : filtered[0] ?? null;

  useEffect(() => {
    if (!useRealApi) return;
    const hasParsing = documents.some(d => d.parse_status === 'parsing' || d.parse_status === 'pending');
    if (!hasParsing) return;
    const timer = window.setInterval(() => refreshDocs(), 4000);
    return () => window.clearInterval(timer);
  }, [documents, refreshDocs]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedDocs(checked ? filtered.map(d => d.doc_id) : []);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    if (!useRealApi) {
      showToast('演示模式：上传已模拟');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadKbDocuments(kbId, list);
      refreshDocs();
      showToast(`已上传 ${list.length} 个文件`);
      if (uploaded.length && !previewDocId) setPreviewDocId(uploaded[0].doc_id);
      const ids = uploaded.map(d => d.doc_id);
      if (ids.length) {
        await parseKbDocuments(kbId, ids);
        showToast('已提交解析任务');
        refreshDocs();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedDocs.length) return;
    if (!useRealApi) { showToast('演示模式'); return; }
    if (!confirm(`确定删除 ${selectedDocs.length} 个文档？`)) return;
    setActionLoading(true);
    try {
      await deleteKbDocuments(kbId, selectedDocs);
      setSelectedDocs([]);
      refreshDocs();
      showToast('已删除');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocAction = async (
    docId: string,
    action: 'parse' | 'reparse' | 'stop' | 'delete' | 'download' | 'preview' | 'chunks',
  ) => {
    setMenuDocId(null);
    setMenuAnchor(null);
    if (action === 'preview') {
      setPreviewDocId(docId);
      setShowPreview(true);
      return;
    }
    if (action === 'chunks') {
      onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: docId });
      return;
    }
    if (!useRealApi) { showToast('演示模式'); return; }
    setActionLoading(true);
    try {
      if (action === 'parse' || action === 'reparse') {
        await parseKbDocuments(kbId, [docId]);
        showToast(action === 'reparse' ? '已提交重新解析' : '已提交解析');
      } else if (action === 'stop') {
        await stopKbDocuments(kbId, [docId]);
        showToast('已停止解析');
      } else if (action === 'delete') {
        if (!confirm('确定删除该文档？')) return;
        await deleteKbDocuments(kbId, [docId]);
        if (previewDocId === docId) setPreviewDocId(null);
        showToast('已删除');
      } else if (action === 'download') {
        const blob = await kbApi.fetchDocumentPreview(docId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filtered.find(d => d.doc_id === docId)?.original_name || 'document';
        a.click();
        URL.revokeObjectURL(url);
      }
      refreshDocs();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchParse = async (ids: string[]) => {
    if (!ids.length || !useRealApi) return;
    setActionLoading(true);
    try {
      await parseKbDocuments(kbId, ids);
      refreshDocs();
      showToast(`已提交 ${ids.length} 个文档解析`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '解析失败');
    } finally {
      setActionLoading(false);
    }
  };

  const openDocMenu = (docId: string) => {
    const btn = menuBtnRefs.current[docId];
    if (!btn) return;
    if (menuDocId === docId) {
      setMenuDocId(null);
      setMenuAnchor(null);
      return;
    }
    setMenuDocId(docId);
    setMenuAnchor(btn.getBoundingClientRect());
  };

  const handleUrlImport = async () => {
    if (!urlName.trim() || !urlValue.trim()) return;
    setUploading(true);
    try {
      const doc = await uploadKbFromUrl(kbId, urlName.trim(), urlValue.trim());
      setShowUrlImport(false);
      setUrlName('');
      setUrlValue('');
      refreshDocs();
      setPreviewDocId(doc.doc_id);
      await parseKbDocuments(kbId, [doc.doc_id]);
      showToast('URL 导入成功，已提交解析');
      refreshDocs();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'URL 导入失败');
    } finally {
      setUploading(false);
    }
  };

  const canPreview = previewDoc && (
    useRealApi
      ? previewDoc.parse_status === 'parsed'
      : getPageIndexDocIdForKbDoc(previewDoc.doc_id) && previewDoc.parse_status === 'parsed'
  );

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-documents" onNavigate={onNavigate}>
    <div className="flex flex-col h-full min-h-0">
    {toast && (
      <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
    )}
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.html"
      onChange={e => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }}
    />
    <div className={`flex flex-col flex-1 min-h-0 ${showPreview && previewDoc && canPreview ? '' : ''}`}>
    <div className="p-6 flex flex-col gap-4 flex-shrink-0">
      {docsError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{docsError}</div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">
            文档管理{docsLoading && useRealApi ? '（加载中）' : ''}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{useRealApi ? 'RAGFlow 文档 API：上传 / 解析 / 删除 / 预览' : '五态流水线 + 解析预览三栏（§3.4 PageIndex bbox 联动）'}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg ${showPreview ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
          >
            <Columns3 size={14} /> 解析预览
          </button>
          <button
            type="button"
            onClick={() => refreshDocs()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            title="刷新文档列表"
          >
            <RefreshCw size={14} /> 刷新
          </button>
          <button
            type="button"
            onClick={() => setShowUrlImport(true)}
            disabled={!useRealApi}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            🔗 URL导入
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
            {uploading ? '上传中…' : '上传文档'}
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm font-medium text-gray-700">拖拽文件至此处，或点击选择文件</p>
        <p className="text-xs text-gray-500 mt-1">支持 PDF / DOCX / PPTX / XLSX / CSV / TXT / MD / HTML 等16+格式 · 单文件上限 100MB · 批量上传最多100个</p>
      </div>

      {uploadQueue.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {useRealApi ? '解析队列' : '上传队列'} ({uploadQueue.filter(f => f.stage !== 'indexed').length}/{uploadQueue.length})
            </span>
            {useRealApi && (
              <button type="button" onClick={() => refreshDocs()} className="text-xs text-gray-500 hover:text-gray-700">刷新</button>
            )}
          </div>
          {uploadQueue.map((f, i) => {
            const st = PIPELINE_STAGE_LABELS[f.stage] ?? PIPELINE_STAGE_LABELS.parsing;
            return (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <FileText size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{f.name}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{f.size}</span>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <div className={`h-full rounded-full transition-all ${f.stage === 'indexed' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${f.progress}%` }}></div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档名称..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {useRealApi && (
          <div className="flex gap-1 flex-wrap">
            {(['all', 'pending', 'parsing', 'parsed', 'failed'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {parseStatusFilterLabel(s)}
              </button>
            ))}
          </div>
        )}
        {selectedDocs.length > 0 && (
          <>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleDeleteSelected()}
              className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 size={12} /> 删除 ({selectedDocs.length})
            </button>
            {useRealApi && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleBatchParse(selectedDocs)}
                className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw size={12} /> 解析选中
              </button>
            )}
          </>
        )}
        {useRealApi && filtered.some(d => d.parse_status === 'pending' || d.parse_status === 'failed') && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleBatchParse(
              filtered.filter(d => d.parse_status === 'pending' || d.parse_status === 'failed').map(d => d.doc_id),
            )}
            className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} /> 批量解析待处理
          </button>
        )}
      </div>

      {/* Document table */}
      <div className={`bg-white rounded-xl border border-gray-200 ${showPreview && canPreview ? 'max-h-[42vh] overflow-y-auto' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={filtered.length > 0 && selectedDocs.length === filtered.length}
                  onChange={e => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">文件名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">大小</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{useRealApi ? '解析状态' : '流水线'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">{useRealApi ? 'Chunk' : '认证'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">{useRealApi ? '上传者' : '质量'}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden xl:table-cell">上传时间</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                  {docsLoading ? '加载中…' : '暂无文档，请上传或调整筛选条件'}
                </td>
              </tr>
            )}
            {filtered.map((doc, i) => {
              const gov = governedMap[doc.doc_id];
              const stage = gov ? PIPELINE_STAGE_LABELS[gov.pipeline_stage] : PIPELINE_STAGE_LABELS.indexed;
              const cert = gov ? CERT_LABELS[gov.certification_status] : CERT_LABELS.draft;
              const parseUi = PARSE_STATUS_UI[doc.parse_status];
              return (
                <tr
                  key={doc.doc_id}
                  onClick={() => { setPreviewDocId(doc.doc_id); setShowPreview(true); }}
                  className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer ${previewDocId === doc.doc_id ? 'bg-cyan-50/60' : i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.doc_id)}
                      onChange={e => setSelectedDocs(p => e.target.checked ? [...p, doc.doc_id] : p.filter(id => id !== doc.doc_id))}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium truncate">{doc.original_name}</span>
                      {doc.parse_status === 'parsed' && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setPreviewDocId(doc.doc_id); setShowPreview(true); }}
                          className="p-0.5 text-cyan-600 hover:bg-cyan-50 rounded flex-shrink-0"
                          title="解析预览"
                        >
                          <Eye size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{doc.file_type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3">
                    {useRealApi ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${parseUi.color}`}>
                        {doc.parse_status === 'parsing' && <Loader size={10} className="animate-spin" />}
                        {parseUi.label}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${stage.color}`}>
                        {gov?.is_stale && <AlertIcon size={10} />}{stage.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {useRealApi ? (
                      <span className="text-xs text-gray-600">{doc.chunk_count}</span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cert.color}`}>{cert.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {useRealApi ? (
                      <span className="text-xs text-gray-500">{doc.uploaded_by}</span>
                    ) : doc.parse_quality_score > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${doc.parse_quality_score >= 90 ? 'bg-green-500' : doc.parse_quality_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${doc.parse_quality_score}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${doc.parse_quality_score >= 90 ? 'text-green-600' : doc.parse_quality_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{doc.parse_quality_score}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">--</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{formatTime(doc.uploaded_at)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      {doc.parse_status === 'parsed' && (
                        <button
                          type="button"
                          onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
                          className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 whitespace-nowrap"
                        >
                          分块
                        </button>
                      )}
                      <button
                        type="button"
                        ref={el => { menuBtnRefs.current[doc.doc_id] = el; }}
                        onClick={() => openDocMenu(doc.doc_id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {menuDocId && menuAnchor && (() => {
      const menuDoc = filtered.find(d => d.doc_id === menuDocId);
      if (!menuDoc) return null;
      return (
        <DocumentActionMenu
          doc={menuDoc}
          anchorRect={menuAnchor}
          onClose={() => { setMenuDocId(null); setMenuAnchor(null); }}
          onAction={action => void handleDocAction(menuDoc.doc_id, action)}
        />
      );
    })()}

    {showPreview && previewDoc && canPreview && (
      <div className="flex-1 min-h-[240px] flex flex-col border-t border-gray-200 dark:border-gray-700 overflow-hidden">
        <DocumentParsePreviewPanel
          doc={previewDoc}
          kbId={kbId}
          governed={governedMap[previewDoc.doc_id]}
          onNavigate={onNavigate}
        />
      </div>
    )}
    {showPreview && previewDoc && !canPreview && (
      <div className="flex-1 min-h-[120px] flex items-center justify-center border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 p-6">
        {useRealApi ? (
          <div className="text-center space-y-2">
            <p>文档尚未解析完成，无法预览分块</p>
            {(previewDoc.parse_status === 'pending' || previewDoc.parse_status === 'failed') && (
              <button
                type="button"
                onClick={() => void handleDocAction(previewDoc.doc_id, 'parse')}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                立即解析
              </button>
            )}
          </div>
        ) : '选中文档暂不支持解析预览（需已解析且已建树）'}
      </div>
    )}
    </div>

    {showUrlImport && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">URL 导入</h3>
          <p className="text-xs text-gray-500">将网页转为 PDF 并入库（RAGFlow web 上传）</p>
          <input value={urlName} onChange={e => setUrlName(e.target.value)} placeholder="文档名称" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800" />
          <input value={urlValue} onChange={e => setUrlValue(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowUrlImport(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">取消</button>
            <button type="button" disabled={uploading} onClick={() => void handleUrlImport()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {uploading ? '导入中…' : '导入'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    </KBDetailLayout>
  );
}

interface ChunkPreviewPageProps {
  kbId: string;
  docId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function ChunkPreviewPage({ kbId, docId, onNavigate }: ChunkPreviewPageProps) {
  const { data: docList, loading: docsLoading } = useDocuments(kbId);
  const doc = useRealApi
    ? docList.find(d => d.doc_id === docId)
    : (mockDocuments.find(d => d.doc_id === docId) || mockDocuments[0]);
  const effectiveDocId = doc?.doc_id || docId;
  const [chunkPage, setChunkPage] = useState(1);
  const [chunkSearch, setChunkSearch] = useState('');
  const CHUNK_PAGE_SIZE = 30;
  const { data: chunkResult, loading: chunksLoading, error: chunksError, refresh: refreshChunks } = useChunks(
    kbId,
    effectiveDocId,
    { page: chunkPage, page_size: CHUNK_PAGE_SIZE, keywords: chunkSearch.trim() || undefined },
  );
  const chunks = useRealApi ? chunkResult.items : mockChunks;
  const [strategy, setStrategy] = useState('通用分块');
  const [chunkSize, setChunkSize] = useState('512');
  const [toast, setToast] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [splitTarget, setSplitTarget] = useState<Chunk | null>(null);
  const [chunkActionId, setChunkActionId] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSplitChunk = async (chunk: Chunk, splitAt: number) => {
    setChunkActionId(chunk.chunk_id);
    try {
      await splitKbChunk(kbId, effectiveDocId, chunk.chunk_id, splitAt);
      showToast(`Chunk #${chunk.chunk_index} 已拆分为两块`);
      setSplitTarget(null);
      refreshChunks();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '拆分失败');
      throw e;
    } finally {
      setChunkActionId(null);
    }
  };

  const handleMergeWithNext = async (chunk: Chunk, index: number) => {
    const next = chunks[index + 1];
    if (!next) {
      showToast('没有下一块可合并（仅限当前页）');
      return;
    }
    if (!useRealApi) {
      showToast(`Chunk #${chunk.chunk_index} 已与下一块合并（原型）`);
      return;
    }
    if (!confirm(`将 Chunk #${chunk.chunk_index} 与 #${next.chunk_index} 合并？`)) return;
    setChunkActionId(chunk.chunk_id);
    try {
      await mergeKbChunks(kbId, effectiveDocId, chunk.chunk_id, next.chunk_id);
      showToast('已合并分块');
      refreshChunks();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '合并失败');
    } finally {
      setChunkActionId(null);
    }
  };

  const handleToggleExclude = async (chunk: Chunk) => {
    const isExcluded = useRealApi ? chunk.available === false : excluded.has(chunk.chunk_id);
    if (!useRealApi) {
      if (isExcluded) {
        setExcluded(prev => { const n = new Set(prev); n.delete(chunk.chunk_id); return n; });
        showToast(`Chunk #${chunk.chunk_index} 已恢复检索`);
      } else {
        setExcluded(prev => new Set(prev).add(chunk.chunk_id));
        showToast(`Chunk #${chunk.chunk_index} 已排除检索`);
      }
      return;
    }
    setChunkActionId(chunk.chunk_id);
    try {
      await setKbChunkAvailability(kbId, effectiveDocId, [chunk.chunk_id], isExcluded);
      showToast(isExcluded ? '已恢复参与检索' : '已排除，不参与检索');
      refreshChunks();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败');
    } finally {
      setChunkActionId(null);
    }
  };
  const qualityMap = useRealApi ? {} : Object.fromEntries(getAllChunkQuality().map(q => [q.chunk_id, q]));
  const totalPages = Math.max(1, Math.ceil(chunkResult.total / CHUNK_PAGE_SIZE));

  const contentTypeConfig = {
    text: { label: '文本', color: 'bg-gray-100 text-gray-600', icon: '📄' },
    table: { label: '表格', color: 'bg-green-100 text-green-700', icon: '📊' },
    image: { label: '图片', color: 'bg-orange-100 text-orange-700', icon: '🖼️' },
    formula: { label: '公式', color: 'bg-purple-100 text-purple-700', icon: '∑' },
    code: { label: '代码', color: 'bg-blue-100 text-blue-700', icon: '</>' },
  };

  const aclConfig: Record<string, string> = {
    internal: 'bg-yellow-100 text-yellow-700',
    confidential: 'bg-red-100 text-red-700',
    public: 'bg-green-100 text-green-700',
    restricted: 'bg-purple-100 text-purple-700',
  };

  if (useRealApi && !docsLoading && !doc) {
    return (
      <KBDetailLayout kbId={kbId} activeKey="kb-documents" onNavigate={onNavigate}>
        <div className="p-6 text-center text-sm text-gray-500 space-y-3">
          <p>未找到文档（ID: {docId}）</p>
          <button type="button" onClick={() => onNavigate('kb-documents', { selectedKBId: kbId })} className="text-xs text-blue-600 hover:underline">
            返回文档列表
          </button>
        </div>
      </KBDetailLayout>
    );
  }

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-documents" onNavigate={onNavigate}>
    {toast && (
      <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
    )}
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('kb-documents', { selectedKBId: kbId, selectedDocId: effectiveDocId })}
            className="text-xs text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            <ChevronLeft size={12} /> 返回文档列表
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate max-w-md">{doc?.original_name ?? '—'} · 分块预览{chunksLoading && useRealApi ? '（加载中）' : ''}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {useRealApi
              ? `共 ${chunkResult.total} 块 · 第 ${chunkPage}/${totalPages} 页`
              : '主题纯度 / 跨节 / 重叠 · 排除块不参与检索（US-1.14）'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('kb-retrieval-test', { selectedKBId: kbId })}
            className="px-3 py-1.5 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1.5"
          >
            <FlaskConical size={13} /> 检索测试
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!useRealApi) { showToast('重新分块任务已提交（原型）'); return; }
              if (!doc) return;
              try {
                await parseKbDocuments(kbId, [doc.doc_id]);
                showToast('已提交重新解析');
                refreshChunks();
              } catch (e) {
                showToast(e instanceof Error ? e.message : '操作失败');
              }
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-gray-700"
          >
            <RefreshCw size={13} /> 重新解析
          </button>
        </div>
      </div>

      {/* Config row */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-4 flex-wrap">
        {useRealApi ? (
          <>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={chunkSearch}
                onChange={e => { setChunkSearch(e.target.value); setChunkPage(1); }}
                placeholder="搜索分块内容…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>本页 <strong className="text-gray-800">{chunks.length}</strong> 块</span>
              {chunks.length > 0 && (
                <span>约 <strong className="text-gray-800">{Math.round(chunks.reduce((s, c) => s + c.token_count, 0) / chunks.length)}</strong> 字/块</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">分块策略</span>
              <select value={strategy} onChange={e => setStrategy(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                <option>通用分块</option><option>模板分块</option><option>表格优先</option><option>代码感知</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Chunk大小</span>
              <select value={chunkSize} onChange={e => setChunkSize(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                <option>256</option><option>512</option><option>1024</option>
              </select>
            </div>
          </>
        )}
      </div>

      {chunksError && useRealApi && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{chunksError}</div>
      )}

      {useRealApi && !chunksLoading && chunkResult.total === 0 && (
        <div className="text-center py-12 text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
          {doc?.parse_status === 'parsed' ? '暂无分块数据' : '文档尚未解析完成'}
        </div>
      )}

      {/* Chunks list */}
      <div className="space-y-3">
        {chunks.map((chunk, index) => {
          const tc = contentTypeConfig[chunk.content_type];
          const q = qualityMap[chunk.chunk_id];
          const isExcluded = useRealApi
            ? chunk.available === false
            : excluded.has(chunk.chunk_id) || q?.excluded_from_retrieval;
          const acting = chunkActionId === chunk.chunk_id;
          const isExpanded = expandedId === chunk.chunk_id;
          const preview = chunk.content_preview;
          const displayText = isExpanded || preview.length <= 320 ? preview : `${preview.slice(0, 320)}…`;
          return (
            <div key={chunk.chunk_id} className={`bg-white dark:bg-gray-900 rounded-xl border transition-colors overflow-hidden ${isExcluded ? 'border-red-200 opacity-60' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">#{chunk.chunk_index}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{chunk.section_title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tc.color}`}>{tc.icon} {tc.label}</span>
                  {isExcluded && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">已排除检索</span>
                  )}
                  {!useRealApi && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${aclConfig[chunk.acl_level] || 'bg-gray-100 text-gray-600'}`}>🔒 {chunk.acl_level}</span>
                  )}
                  {q && (
                    <>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${q.topical_purity >= 0.9 ? 'bg-green-100 text-green-700' : q.topical_purity >= 0.8 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        纯度 {(q.topical_purity * 100).toFixed(0)}%
                      </span>
                      {q.crosses_section && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">跨节</span>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">~{chunk.token_count} 字</span>
                  {chunk.page_number > 0 && <span className="text-[10px] text-gray-500">P{chunk.page_number}</span>}
                </div>
              </div>
              <div className="px-4 py-3">
                <pre className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans break-words">{displayText}</pre>
                {preview.length > 320 && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : chunk.chunk_id)}
                    className="text-[10px] text-blue-600 hover:underline mt-2"
                  >
                    {isExpanded ? '收起' : '展开全文'}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  disabled={acting || chunk.content_preview.length < 16}
                  onClick={() => useRealApi ? setSplitTarget(chunk) : showToast(`Chunk #${chunk.chunk_index} 已拆分（原型）`)}
                  className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                >
                  拆分
                </button>
                <button
                  type="button"
                  disabled={acting || index >= chunks.length - 1}
                  onClick={() => void handleMergeWithNext(chunk, index)}
                  className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                >
                  合并↓
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleToggleExclude(chunk)}
                  className={`text-[10px] px-2 py-1 border rounded disabled:opacity-40 ${
                    isExcluded
                      ? 'border-green-200 text-green-700 hover:bg-green-50'
                      : 'border-red-100 text-red-600 hover:bg-red-50'
                  }`}
                >
                  {isExcluded ? '恢复检索' : '排除检索'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {useRealApi && chunkResult.total > CHUNK_PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button type="button" disabled={chunkPage <= 1} onClick={() => setChunkPage(p => p - 1)} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronLeft size={14} /></button>
          <span className="text-xs text-gray-500">{chunkPage} / {totalPages}</span>
          <button type="button" disabled={chunkPage >= totalPages} onClick={() => setChunkPage(p => p + 1)} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      )}

      {splitTarget && (
        <ChunkSplitDialog
          chunk={splitTarget}
          open
          onClose={() => setSplitTarget(null)}
          onConfirm={pos => handleSplitChunk(splitTarget, pos)}
        />
      )}
    </div>
    </KBDetailLayout>
  );
}

interface IndexStatusPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function IndexStatusPage({ kbId, onNavigate }: IndexStatusPageProps) {
  const { data: kb } = useKnowledgeBase(kbId);
  const { data: docs, refresh: refreshDocs } = useDocuments(kbId);
  const { data: graphTrace } = useIndexTrace(kbId, 'graph');
  const { data: raptorTrace } = useIndexTrace(kbId, 'raptor');
  const health = useRealApi
    ? { overall: Math.min(100, 70 + Math.round((docs.filter(d => d.parse_status === 'parsed').length / Math.max(docs.length, 1)) * 30)), dimensions: { vector: 90, parse: 85, graph: 60, wiki: 0, pageindex: 0 } }
    : getKBHealthScore(kbId);
  const failures = useRealApi
    ? docs.filter(d => d.parse_status === 'failed').map(d => ({
        doc_name: d.original_name,
        stage: 'parse' as const,
        reason: '解析失败',
        deep_link_page: 'kb-documents',
        deep_link_extra: { selectedKBId: kbId, selectedDocId: d.doc_id },
      }))
    : getKBHealthFailures(kbId);

  const apiIndexCards = useRealApi ? [
    { pipeline: 'vector', label: '向量索引', indexed: docs.filter(d => d.parse_status === 'parsed').length, total: docs.length || 1, health: 90, status: docs.some(d => d.parse_status === 'parsing') ? 'running' as const : 'completed' as const, last_updated: '实时', failed_count: docs.filter(d => d.parse_status === 'failed').length },
    { pipeline: 'graph', label: 'GraphRAG', indexed: Number((graphTrace as { progress?: number })?.progress ?? 0), total: 100, health: 70, status: ((graphTrace as { status?: string })?.status === 'running' ? 'running' : 'not_started') as 'running' | 'not_started', last_updated: '—', failed_count: 0 },
    { pipeline: 'raptor', label: 'RAPTOR', indexed: Number((raptorTrace as { progress?: number })?.progress ?? 0), total: 100, health: 65, status: ((raptorTrace as { status?: string })?.status === 'running' ? 'running' : 'not_started') as 'running' | 'not_started', last_updated: '—', failed_count: 0 },
  ] : mockIndexStatuses;

  const statusConfig2 = {
    running: { label: '索引中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
    failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
    paused: { label: '已暂停', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
    not_started: { label: '未开始', color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  };

  const healthColor = health.overall >= 85 ? 'text-green-600' : health.overall >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <KBDetailLayout kbId={kbId} activeKey="kb-index-status" onNavigate={onNavigate}>
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">索引状态</h1>
          <p className="text-xs text-gray-500 mt-0.5">五维健康分 + 失败归因深链（US-1.15）</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!useRealApi) return;
            const pending = docs.filter(d => d.parse_status === 'pending' || d.parse_status === 'failed').map(d => d.doc_id);
            if (pending.length) {
              await parseKbDocuments(kbId, pending);
              refreshDocs();
            }
          }}
          className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> {useRealApi ? '重试失败解析' : '全部重建索引'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900 p-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">综合健康分</div>
          <div className={`text-3xl font-bold ${healthColor}`}>{health.overall}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(health.dimensions).map(([key, val]) => (
            <div key={key} className="text-center min-w-[56px]">
              <div className="text-[10px] text-gray-500 uppercase">{key}</div>
              <div className={`text-sm font-bold ${val >= 85 ? 'text-green-600' : val >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Index status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {apiIndexCards.map((idx: typeof mockIndexStatuses[0]) => {
          const sc = statusConfig2[idx.status as keyof typeof statusConfig2];
          const pct = Math.round((idx.indexed / idx.total) * 100);
          return (
            <div key={idx.pipeline} className={`${sc.bg} rounded-xl p-4 border border-white/60`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">{idx.label}</span>
                <div className={`w-2 h-2 rounded-full ${sc.dot}`}></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{pct}%</div>
              <div className="text-[10px] text-gray-600 mb-2">{idx.indexed} / {idx.total}</div>
              <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${sc.dot.replace('animate-pulse', '').trim()}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">健康 {idx.health}</span>
                <span className="text-[10px] text-gray-500">{idx.last_updated}</span>
              </div>
              {idx.failed_count > 0 && (
                <button className="mt-2 text-[10px] text-red-600 hover:underline">重试 {idx.failed_count} 失败</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">失败归因</h3>
          <span className="text-xs text-gray-500">共 {failures.length} 项</span>
        </div>
        {failures.map((f, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <FileText size={14} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">{f.doc_name}</div>
              <div className="text-xs text-gray-500">
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 mr-1">{FAILURE_STAGE_LABELS[f.stage]}</span>
                {f.reason}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigate(f.deep_link_page, f.deep_link_extra ?? { selectedKBId: kbId })}
                className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                定位
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!useRealApi) return;
                  const docId = (f.deep_link_extra as { selectedDocId?: string } | undefined)?.selectedDocId;
                  if (docId) {
                    await parseKbDocuments(kbId, [docId]);
                    refreshDocs();
                  }
                }}
                className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
              >
                重试
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </KBDetailLayout>
  );
}
