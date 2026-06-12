import { useState, useMemo } from 'react';
import {
  Search, Trash2, RotateCcw, AlertTriangle, Database, FileText,
  ChevronLeft, Clock, User, HardDrive
} from 'lucide-react';
import { getRecycleBinItems, setRecycleBinItems, type RecycleBinItem } from '../data/kbRecycleBin';

function formatBytes(bytes: number) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function formatDeletedAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface KBRecycleBinPageProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

type TimeFilter = 'all' | '7d' | '30d';
type SortKey = 'deleted' | 'daysLeft' | 'name';

export function KBRecycleBinPage({ onNavigate }: KBRecycleBinPageProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('deleted');
  const [selected, setSelected] = useState<string[]>([]);
  const [items, setItemsState] = useState<RecycleBinItem[]>(getRecycleBinItems);
  const setItems = (updater: RecycleBinItem[] | ((prev: RecycleBinItem[]) => RecycleBinItem[])) => {
    setItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setRecycleBinItems(next);
      return next;
    });
  };
  const [toast, setToast] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<RecycleBinItem | RecycleBinItem[] | 'all' | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const filtered = useMemo(() => {
    let list = items.filter(it => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || it.name.toLowerCase().includes(q) || it.kb.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || (typeFilter === 'kb' ? it.type === '知识库' : it.type === '文档');
      const matchTime = timeFilter === 'all'
        || (timeFilter === '7d' ? it.daysLeft <= 7 : it.daysLeft <= 30);
      return matchSearch && matchType && matchTime;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'daysLeft') return a.daysLeft - b.daysLeft;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
      return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
    });
    return list;
  }, [items, search, typeFilter, timeFilter, sortBy]);

  const expiringSoon = items.filter(i => i.daysLeft <= 7).length;

  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(p => p.length === filtered.length && filtered.length > 0 ? [] : filtered.map(f => f.id));

  const restoreItems = (ids: string[]) => {
    const restored = items.filter(i => ids.includes(i.id));
    setItems(p => p.filter(i => !ids.includes(i.id)));
    setSelected(p => p.filter(id => !ids.includes(id)));
    showToast(`已恢复 ${restored.length} 项，已回到原知识库`);
  };

  const purgeItems = (target: RecycleBinItem | RecycleBinItem[] | 'all') => {
    if (Array.isArray(target)) {
      const ids = target.map(t => t.id);
      setItems(p => p.filter(i => !ids.includes(i.id)));
      setSelected(p => p.filter(id => !ids.includes(id)));
      showToast(`已永久删除 ${ids.length} 项`);
    } else if (target === 'all') {
      setItems([]);
      setSelected([]);
      showToast('回收站已清空');
    } else {
      setItems(p => p.filter(i => i.id !== target.id));
      setSelected(p => p.filter(id => id !== target.id));
      showToast(`已永久删除「${target.name}」`);
    }
    setPurgeTarget(null);
    setPurgeConfirm('');
  };

  const openPurge = (target: RecycleBinItem | RecycleBinItem[] | 'all') => {
    setPurgeTarget(target);
    setPurgeConfirm('');
  };

  const purgeCount = purgeTarget === 'all'
    ? items.length
    : Array.isArray(purgeTarget)
      ? purgeTarget.length
      : purgeTarget ? 1 : 0;

  const purgeLabel = purgeTarget === 'all'
    ? '全部项目'
    : Array.isArray(purgeTarget)
      ? `${purgeTarget.length} 个项目`
      : purgeTarget?.name ?? '';

  const canPurge = purgeConfirm === '永久删除' || (purgeCount === 1 && purgeTarget !== 'all' && !Array.isArray(purgeTarget));

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto bg-gray-50/40 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate('kb-list')} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center gap-1">
            <ChevronLeft size={14} /> 知识库列表
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">回收站</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => openPurge('all')}
            className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
          >
            清空回收站
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => restoreItems(selected)}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-40 flex items-center gap-1"
          >
            <RotateCcw size={12} /> 批量恢复 ({selected.length || 0})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '回收项总数', value: items.length, icon: Trash2, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
          { label: '知识库', value: items.filter(i => i.type === '知识库').length, icon: Database, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '文档', value: items.filter(i => i.type === '文档').length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: '7 天内到期', value: expiringSoon, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
              <div className={`${s.bg} p-2 rounded-lg`}><Icon size={16} className={s.color} /></div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>回收站内容保留 <strong>30 天</strong>，到期自动永久删除。恢复后文档与索引将按原配置重新可用。</span>
      </p>

      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索名称或原属知识库..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200">
          <option value="all">全部类型</option>
          <option value="kb">知识库</option>
          <option value="doc">文档</option>
        </select>
        <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as TimeFilter)} className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200">
          <option value="all">全部时间</option>
          <option value="30d">30 天内删除</option>
          <option value="7d">即将到期 (≤7天)</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200">
          <option value="deleted">删除时间</option>
          <option value="daysLeft">剩余天数</option>
          <option value="name">名称</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-1">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Trash2 size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{items.length === 0 ? '回收站为空' : '无匹配结果'}</p>
            {items.length > 0 && (
              <button type="button" onClick={() => { setSearch(''); setTypeFilter('all'); setTimeFilter('all'); }} className="mt-2 text-xs text-blue-600 hover:underline">清除筛选</button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.length === filtered.length} onChange={toggleAll} className="rounded" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">名称</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">类型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">原属知识库</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">详情</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">删除时间</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">剩余</th>
                <th className="w-28 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(it.id)} onChange={() => toggleSelect(it.id)} className="rounded" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {it.type === '知识库' ? <Database size={14} className="text-blue-500 flex-shrink-0" /> : <FileText size={14} className="text-purple-500 flex-shrink-0" />}
                      <span className="font-medium text-gray-800 dark:text-gray-200">{it.name}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 ml-5">
                      <User size={9} />{it.deletedBy}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${it.type === '知识库' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                      {it.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                    {it.kbId ? (
                      <button type="button" onClick={() => onNavigate('kb-detail', { selectedKBId: it.kbId })} className="text-blue-600 hover:underline">{it.kb}</button>
                    ) : it.kb}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-500 hidden lg:table-cell">
                    {it.type === '文档' && it.sizeBytes != null && (
                      <span className="flex items-center gap-1"><HardDrive size={10} />{formatBytes(it.sizeBytes)} · {it.fileType}</span>
                    )}
                    {it.type === '知识库' && it.docCount != null && (
                      <span>{it.docCount} 个文档</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDeletedAt(it.deletedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${it.daysLeft <= 7 ? 'text-red-600' : it.daysLeft <= 14 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {it.daysLeft} 天
                      {it.daysLeft <= 7 && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded">即将删除</span>}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-1 justify-end">
                      <button type="button" onClick={() => restoreItems([it.id])} className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded hover:bg-blue-100">恢复</button>
                      <button type="button" onClick={() => openPurge(it)} className="text-[10px] px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected.length > 0 && (
        <div className="sticky bottom-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-center justify-between z-10">
          <span className="text-xs text-gray-600 dark:text-gray-400">已选 <strong>{selected.length}</strong> 项</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => restoreItems(selected)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">恢复</button>
            <button
              type="button"
              onClick={() => openPurge(items.filter(i => selected.includes(i.id)))}
              className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              永久删除
            </button>
            <button type="button" onClick={() => setSelected([])} className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700">取消选择</button>
          </div>
        </div>
      )}

      {purgeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle size={20} /> 永久删除
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              确定永久删除 <strong>{purgeLabel}</strong>？此操作不可恢复。
            </p>
            {(purgeCount > 1 || purgeTarget === 'all') && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">请输入「永久删除」以确认</label>
                <input
                  value={purgeConfirm}
                  onChange={e => setPurgeConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  placeholder="永久删除"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setPurgeTarget(null); setPurgeConfirm(''); }} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
              <button
                type="button"
                disabled={!canPurge}
                onClick={() => purgeItems(purgeTarget)}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40"
              >
                确认永久删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
