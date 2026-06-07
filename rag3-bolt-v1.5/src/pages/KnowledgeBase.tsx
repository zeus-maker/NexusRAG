import { useState, useMemo } from 'react';
import {
  Plus, Search, MoreHorizontal, Database, FileText,
  Cpu, Clock, TrendingUp, ArrowRight, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Loader, BookOpen, Network,
  ChevronRight, GitBranch, Edit, LayoutGrid, List,
  FlaskConical, Activity, Archive, Copy, Download,
  ChevronLeft, AlertCircle as AlertIcon
} from 'lucide-react';
import { mockKBs, mockDocuments, mockChunks, mockIndexStatuses } from '../mockData';
import type { KnowledgeBase } from '../types';
import { KBCreateDialog, type KBCreateForm } from '../components/KBCreateDialog';
import { addToRecycleBin, getRecycleBinCount } from '../data/kbRecycleBin';

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

  const filtered = useMemo(() => {
    const list = mockKBs.filter(kb => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || kb.name.toLowerCase().includes(q) || kb.description.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || kb.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return sortKBs(list, sortBy, sortDesc);
  }, [search, statusFilter, sortBy, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    { icon: <Download size={13} />, label: '导出', action: () => showToast('导出任务已创建，可在详情页查看') },
    { icon: <Copy size={13} />, label: '复制配置', action: () => showToast('配置已复制到剪贴板（原型）') },
    { icon: <Archive size={13} />, label: '归档', action: () => showToast(`「${kb.name}」已标记归档`) },
    { icon: <Trash2 size={13} />, label: '删除', action: () => setDeleteTarget(kb), danger: true },
  ];

  const handleCreate = async (form: KBCreateForm) => {
    await new Promise(r => setTimeout(r, 900));
    onNavigate('kb-detail', { selectedKBId: 'kb-001' });
    showToast(`知识库「${form.name.trim()}」创建成功，已进入详情`);
  };

  const moveToRecycleBin = (kb: KnowledgeBase) => {
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">知识库管理</h1>
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
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus size={16} /> 创建知识库
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '知识库总数', value: mockKBs.length, sub: `${mockKBs.filter(k => k.status === 'active').length} 活跃`, icon: Database, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '文档总数', value: mockKBs.reduce((s, k) => s + k.doc_count, 0).toLocaleString(), sub: '全库合计', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Chunk 总数', value: (mockKBs.reduce((s, k) => s + k.chunk_count, 0) / 1000).toFixed(1) + 'k', sub: '已向量化', icon: Cpu, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: '存储总量', value: formatBytes(mockKBs.reduce((s, k) => s + k.total_size_bytes, 0)), sub: '含原始文件', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
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

      {filtered.length === 0 ? (
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
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const [tab, setTab] = useState<'overview' | 'documents' | 'index' | 'settings'>('overview');

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'documents', label: '文档' },
    { key: 'index', label: '索引状态' },
    { key: 'settings', label: '设置' },
  ] as const;

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('kb-list')} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          ← 返回
        </button>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{kb.icon}</span>
          <h1 className="text-lg font-bold text-gray-900">{kb.name}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[kb.status].color}`}>{statusConfig[kb.status].label}</span>
        </div>
        <button
          onClick={() => onNavigate('kb-documents', { selectedKBId: kb.kb_id })}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
        >
          <FileText size={14} /> 管理文档
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'documents') onNavigate('kb-documents', { selectedKBId: kb.kb_id });
              else if (t.key === 'index') onNavigate('kb-index-status', { selectedKBId: kb.kb_id });
              else if (t.key === 'settings') onNavigate('kb-settings', { selectedKBId: kb.kb_id });
              else setTab(t.key as 'overview');
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '文档总数', value: kb.doc_count, icon: '📄', color: 'bg-blue-50 text-blue-700' },
          { label: 'Chunk 数', value: kb.chunk_count.toLocaleString(), icon: '📦', color: 'bg-purple-50 text-purple-700' },
          { label: '存储大小', value: formatBytes(kb.total_size_bytes), icon: '💾', color: 'bg-green-50 text-green-700' },
          { label: '解析质量', value: '92.5', icon: '⭐', color: 'bg-amber-50 text-amber-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* RAG 3.0 Hub 入口 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">RAG 3.0 增强层</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { id: 'pageindex-hub', label: 'PageIndex 树索引', desc: '85/156 建树率 54.5%', detail: '失败: 12 个文档', icon: GitBranch, accent: 'text-cyan-600', border: 'hover:border-cyan-300' },
            { id: 'wiki-hub', label: 'LLM Wiki 知识库', desc: '12/42 页面已发布', detail: '待审核: 3 个, 编译中: 2 个', icon: BookOpen, accent: 'text-violet-600', border: 'hover:border-violet-300' },
            { id: 'graphrag-hub', label: 'GraphRAG 图谱', desc: '社区: 24 个, 实体: 1.2K', detail: '实体复核: 86 待确认', icon: Network, accent: 'text-amber-600', border: 'hover:border-amber-300' },
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
            {[
              { name: '合同模板V6.pdf', time: '2小时前', type: 'PDF' },
              { name: '审计报告.pdf', time: '1天前', type: 'PDF' },
              { name: '财务数据.xlsx', time: '2天前', type: 'XLSX' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileText size={13} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{f.name}</div>
                  <div className="text-[10px] text-gray-400">{f.type} · {f.time}</div>
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
      </>}
    </div>
  );
}

interface DocumentPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function DocumentPage({ kbId, onNavigate }: DocumentPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const parseStatusConfig = {
    pending: { label: '等待中', color: 'bg-gray-100 text-gray-600', icon: <Clock size={11} /> },
    parsing: { label: '解析中', color: 'bg-blue-100 text-blue-700', icon: <Loader size={11} className="animate-spin" /> },
    parsed: { label: '已解析', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={11} /> },
    failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={11} /> },
  };

  const filtered = mockDocuments.filter(d => d.kb_id === kbId && d.original_name.includes(search));

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-bold text-gray-900">{kb.name} · 文档管理</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            🔗 URL导入
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> 上传文档
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm font-medium text-gray-700">拖拽文件至此处，或点击选择文件</p>
        <p className="text-xs text-gray-500 mt-1">支持 PDF / DOCX / PPTX / XLSX / CSV / TXT / MD / HTML 等16+格式 · 单文件上限 100MB · 批量上传最多100个</p>
      </div>

      {/* Upload queue simulation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">上传队列 (2/3)</span>
          <button className="text-xs text-gray-500 hover:text-gray-700">清空已完成</button>
        </div>
        {[
          { name: '合同模板V6.pdf', size: '2.3 MB', progress: 100, status: 'done' },
          { name: '审计报告.pdf', size: '5.0 MB', progress: 58, status: 'parsing' },
          { name: '数据表.xlsx', size: '1.2 MB', progress: 22, status: 'uploading' },
        ].map((f, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50 last:border-0">
            <FileText size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{f.size}</span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              <div className={`h-full rounded-full transition-all ${f.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${f.progress}%` }}></div>
            </div>
            <span className={`text-[10px] flex-shrink-0 ${f.status === 'done' ? 'text-green-600' : f.status === 'parsing' ? 'text-blue-600' : 'text-gray-500'}`}>
              {f.status === 'done' ? '✅完成' : f.status === 'parsing' ? '🔄解析中' : '⬆上传中'}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文档名称..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {selectedDocs.length > 0 && (
          <button className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
            <Trash2 size={12} /> 删除选中 ({selectedDocs.length})
          </button>
        )}
      </div>

      {/* Document table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">文件名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">大小</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">质量评分</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden xl:table-cell">上传时间</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => {
              const sc = parseStatusConfig[doc.parse_status];
              return (
                <tr key={doc.doc_id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.doc_id)}
                      onChange={e => setSelectedDocs(p => e.target.checked ? [...p, doc.doc_id] : p.filter(id => id !== doc.doc_id))}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
                      className="flex items-center gap-2 hover:text-blue-700 transition-colors text-left"
                    >
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 hover:text-blue-700 font-medium">{doc.original_name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{doc.file_type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                      {sc.icon}{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {doc.parse_quality_score > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${doc.parse_quality_score >= 90 ? 'bg-green-500' : doc.parse_quality_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${doc.parse_quality_score}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${doc.parse_quality_score >= 90 ? 'text-green-600' : doc.parse_quality_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{doc.parse_quality_score}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">--</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{formatTime(doc.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ChunkPreviewPageProps {
  kbId: string;
  docId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function ChunkPreviewPage({ kbId, docId, onNavigate }: ChunkPreviewPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const doc = mockDocuments.find(d => d.doc_id === docId) || mockDocuments[0];
  const [strategy, setStrategy] = useState('通用分块');
  const [chunkSize, setChunkSize] = useState('512');

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

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onNavigate('kb-documents', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-48">{doc.original_name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900">分块预览</span>
        </div>
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-gray-700">
          <RefreshCw size={13} /> 重新分块
        </button>
      </div>

      {/* Config row */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">分块策略</span>
          <select value={strategy} onChange={e => setStrategy(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
            <option>通用分块</option>
            <option>模板分块</option>
            <option>表格优先</option>
            <option>代码感知</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Chunk大小</span>
          <select value={chunkSize} onChange={e => setChunkSize(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
            <option>256</option><option>512</option><option>1024</option>
          </select>
        </div>
        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span><strong className="text-gray-800">5</strong> 块</span>
          <span>平均 <strong className="text-gray-800">412</strong> Token</span>
          <span>最大 <strong className="text-gray-800">512</strong></span>
          <span>最小 <strong className="text-gray-800">256</strong></span>
        </div>
      </div>

      {/* Chunks list */}
      <div className="space-y-3">
        {mockChunks.map(chunk => {
          const tc = contentTypeConfig[chunk.content_type];
          return (
            <div key={chunk.chunk_id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-600">#{chunk.chunk_index}</span>
                  <span className="text-xs font-medium text-gray-800">{chunk.section_title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tc.color}`}>{tc.icon} {tc.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${aclConfig[chunk.acl_level] || 'bg-gray-100 text-gray-600'}`}>🔒 {chunk.acl_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{chunk.token_count} Token</span>
                  <span className="text-[10px] text-gray-500">P{chunk.page_number}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                {chunk.content_type === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          {['类型', '计算标准', '上限'].map(h => (
                            <th key={h} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[['交货延迟', '日 0.5%', '20%'], ['质量不合规', '实际损失赔偿', '30%'], ['提前解约', '合同金额15%', '15%']].map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {row.map((cell, j) => (
                              <td key={j} className="border border-gray-200 px-3 py-1.5 text-gray-700">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{chunk.content_preview}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-100">
                <button className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">拆分</button>
                <button className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">合并↓</button>
                <button className="text-[10px] px-2 py-1 border border-red-100 rounded hover:bg-red-50 text-red-600">排除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IndexStatusPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function IndexStatusPage({ kbId, onNavigate }: IndexStatusPageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  // mockIndexStatuses imported above
  const statusConfig2 = {
    running: { label: '索引中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
    failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
    paused: { label: '已暂停', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
    not_started: { label: '未开始', color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-bold text-gray-900">{kb.name} · 索引状态</h1>
        </div>
        <button className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1.5">
          <RefreshCw size={13} /> 全部重建索引
        </button>
      </div>

      {/* Index status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {mockIndexStatuses.map((idx: any) => {
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

      {/* Failed docs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">失败文档</h3>
          <span className="text-xs text-gray-500">共 2 个</span>
        </div>
        {[
          { name: '复杂表格报告.pdf', pipeline: '向量索引', reason: '嵌入请求超时' },
          { name: '扫描件合同.pdf', pipeline: 'PageIndex', reason: 'LLM 解析超时' },
        ].map((f, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
            <FileText size={14} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 font-medium">{f.name}</div>
              <div className="text-xs text-gray-500">{f.pipeline} · {f.reason}</div>
            </div>
            <div className="flex gap-2">
              <button className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">重试</button>
              <button className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">跳过</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
