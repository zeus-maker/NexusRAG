import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Search as SearchIcon, Trash2, RefreshCw, Settings, ArrowRight,
  FileText, Copy, Check, Mic, Star, ExternalLink, X, ChevronDown,
  Brain, Layers, List, Sparkles, GitBranch
} from 'lucide-react';
import { mockKBs } from '../mockData';
import { SearchSettingsPanel, DEFAULT_SEARCH_SETTINGS, type SearchSettings } from '../components/SearchSettingsPanel';
import {
  SEARCH_APPS, SEARCH_HISTORY, SEARCH_RESULTS, RELATED_SEARCHES,
  AI_SUMMARY_BY_QUERY, MINDMAP_NODES, SEARCH_SUGGESTIONS,
  type SearchApp, type SearchHistoryItem, type SearchResultItem,
} from '../data/searchMock';

type ResultTab = 'results' | 'summary' | 'related' | 'mindmap';
type SortKey = 'updated' | 'name' | 'queries';

function scoreToStars(score: number): number {
  if (score >= 0.95) return 5;
  if (score >= 0.85) return 4;
  if (score >= 0.75) return 3;
  if (score >= 0.65) return 2;
  return 1;
}

function highlightText(text: string, terms: string[]) {
  if (!terms.length) return text;
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  const termLower = new Set(terms.map(t => t.toLowerCase()));
  return parts.map((part, i) =>
    termLower.has(part.toLowerCase()) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-gray-100 px-0.5 rounded">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function groupHistory(items: SearchHistoryItem[]) {
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 86400000;
  const groups: { label: string; items: SearchHistoryItem[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '更早', items: [] },
  ];
  for (const item of items) {
    if (item.ts >= todayStart) groups[0].items.push(item);
    else if (item.ts >= yesterdayStart) groups[1].items.push(item);
    else groups[2].items.push(item);
  }
  return groups.filter(g => g.items.length > 0);
}

interface SearchPageProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [apps, setApps] = useState(SEARCH_APPS);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [listSort, setListSort] = useState<SortKey>('updated');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createKbIds, setCreateKbIds] = useState<string[]>(['kb-001']);
  const [toast, setToast] = useState<string | null>(null);

  const [history, setHistory] = useState(SEARCH_HISTORY);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('results');
  const [settings, setSettings] = useState<SearchSettings>(DEFAULT_SEARCH_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const abortRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredApps = useMemo(() => {
    let list = apps.filter(a =>
      !listQuery.trim() ||
      a.name.includes(listQuery) ||
      a.desc.includes(listQuery) ||
      a.kbs.some(k => k.includes(listQuery))
    );
    list = [...list].sort((a, b) => {
      if (listSort === 'name') return a.name.localeCompare(b.name, 'zh');
      if (listSort === 'queries') return b.queries - a.queries;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [apps, listQuery, listSort]);

  const selectedApp = apps.find(a => a.id === selectedAppId);
  const appHistory = useMemo(
    () => history.filter(h => h.appId === selectedAppId),
    [history, selectedAppId]
  );
  const historyGroups = useMemo(() => groupHistory(appHistory), [appHistory]);

  const aiSummary = useMemo(() => {
    if (!query.trim()) return null;
    return AI_SUMMARY_BY_QUERY[query.trim()] ?? AI_SUMMARY_BY_QUERY.default;
  }, [query, results]);

  const openApp = (appId: string, withSettings = false) => {
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    setSelectedAppId(appId);
    setSettings({ ...DEFAULT_SEARCH_SETTINGS, kbIds: [...app.kbIds] });
    setQuery('');
    setResults(null);
    setActiveTab('results');
    setShowSettings(withSettings);
  };

  const handleSearch = useCallback(() => {
    if (!query.trim() || loading) return;
    if (abortRef.current) clearTimeout(abortRef.current);
    setLoading(true);
    setResults(null);
    setActiveTab('results');

    const item: SearchHistoryItem = {
      id: `h-${Date.now()}`,
      query: query.trim(),
      appId: selectedAppId!,
      ts: Date.now(),
    };
    setHistory(prev => [item, ...prev.filter(h => !(h.appId === selectedAppId && h.query === query.trim()))]);

    abortRef.current = setTimeout(() => {
      const filtered = SEARCH_RESULTS.filter(r =>
        !settings.similarityThreshold || r.score >= settings.similarityThreshold
      ).slice(0, settings.topK);
      setResults(filtered.length ? filtered : SEARCH_RESULTS.slice(0, settings.topK));
      setLoading(false);
      if (settings.aiSummary) setActiveTab('results');
      abortRef.current = null;
    }, 900);
  }, [query, loading, selectedAppId, settings]);

  const handleCopy = (r: SearchResultItem) => {
    const text = `${r.title}\n${r.summary}\n来源: ${r.doc} P${r.page}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCreate = () => {
    if (!createName.trim()) {
      showToast('请输入应用名称');
      return;
    }
    const newApp: SearchApp = {
      id: `s-${Date.now()}`,
      name: createName.trim(),
      kbs: createKbIds.map(id => mockKBs.find(k => k.kb_id === id)?.name ?? id),
      kbIds: createKbIds,
      desc: '自定义搜索应用',
      icon: '🔍',
      queries: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setApps(prev => [newApp, ...prev]);
    setShowCreate(false);
    setCreateName('');
    showToast('搜索应用已创建');
    openApp(newApp.id);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const newSearch = () => {
    setQuery('');
    setResults(null);
    setActiveTab('results');
  };

  /* ── 列表页 ── */
  if (!selectedAppId) {
    return (
      <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">搜索应用</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">独立搜索应用，面向「搜索即答案」场景（RAGFlow 兼容）</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} /> 新建搜索应用
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-md">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={listQuery}
              onChange={e => setListQuery(e.target.value)}
              placeholder="搜索应用名称或知识库..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={listSort}
              onChange={e => setListSort(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            >
              <option value="updated">最近更新</option>
              <option value="name">名称</option>
              <option value="queries">查询次数</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{app.icon}</div>
                <span className="text-[10px] text-gray-400">更新 {app.updatedAt.slice(5)}</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{app.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed line-clamp-2">{app.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {app.kbs.map(kb => (
                  <span key={kb} className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">{kb}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{app.queries.toLocaleString()} 次查询</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openApp(app.id)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    打开
                  </button>
                  <button
                    type="button"
                    onClick={() => openApp(app.id, true)}
                    className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    设置
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-all min-h-40"
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">新建搜索应用</span>
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">新建搜索应用</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">应用名称</label>
                  <input
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    placeholder="如：合同条款快速检索"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">关联知识库</label>
                  {mockKBs.slice(0, 5).map(kb => (
                    <label key={kb.kb_id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createKbIds.includes(kb.kb_id)}
                        onChange={() => {
                          setCreateKbIds(prev =>
                            prev.includes(kb.kb_id)
                              ? prev.filter(id => id !== kb.kb_id)
                              : [...prev, kb.kb_id]
                          );
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{kb.icon} {kb.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">取消</button>
                <button type="button" onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const app = selectedApp!;

  const tabs: { key: ResultTab; label: string; icon: React.ReactNode; enabled: boolean }[] = [
    { key: 'results', label: '搜索结果', icon: <List size={13} />, enabled: true },
    { key: 'summary', label: 'AI 摘要', icon: <Brain size={13} />, enabled: settings.aiSummary },
    { key: 'related', label: '相关搜索', icon: <Sparkles size={13} />, enabled: settings.relatedSearch },
    { key: 'mindmap', label: '思维导图', icon: <GitBranch size={13} />, enabled: settings.mindmap },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* 搜索历史侧栏 */}
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => { setSelectedAppId(null); setShowSettings(false); }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
          >
            ← 返回列表
          </button>
          <button
            type="button"
            onClick={newSearch}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Plus size={12} /> 新搜索
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {historyGroups.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center py-4">暂无搜索历史</p>
          ) : (
            historyGroups.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">{group.label}</p>
                {group.items.map(item => (
                  <div key={item.id} className="group flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <button
                      type="button"
                      onClick={() => { setQuery(item.query); }}
                      className="flex-1 text-left text-xs text-gray-700 dark:text-gray-300 truncate"
                    >
                      {item.query}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
          <span className="text-xl">{app.icon}</span>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{app.name}</h1>
            <div className="flex gap-1 mt-0.5">
              {app.kbs.map(kb => (
                <span key={kb} className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">{kb}</span>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowSettings(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showSettings
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Settings size={13} /> 设置
          </button>
        </header>

        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto p-5">
            {/* 搜索框 */}
            <div className="max-w-3xl mx-auto mb-5">
              <div className="relative flex gap-2">
                <div className="flex-1 relative">
                  <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="输入检索问题，如：供应商违约金计算标准"
                    className="w-full pl-11 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  title="语音搜索（占位）"
                  className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Mic size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={!query.trim() || loading}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 font-medium text-sm min-w-20 flex items-center justify-center"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : '搜索'}
                </button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {SEARCH_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 空态 */}
            {!results && !loading && (
              <div className="max-w-3xl mx-auto text-center py-12">
                <div className="text-4xl mb-3">{app.icon}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">在上方输入问题，从 {app.kbs.join('、')} 中精准检索</p>
                <p className="text-xs text-gray-400 mt-2">支持 AI 摘要 · 相关搜索 · 思维导图 · 关键词高亮</p>
              </div>
            )}

            {loading && (
              <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                <RefreshCw size={16} className="animate-spin" /> 检索中…
              </div>
            )}

            {results && (
              <div className="max-w-3xl mx-auto">
                {/* 结果 Tab */}
                <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-700 pb-px flex-wrap">
                  {tabs.filter(t => t.enabled).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'results' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      找到 <strong className="text-gray-800 dark:text-gray-200">{results.length}</strong> 条相关结果
                      {settings.rerankEnabled && <span className="ml-2 text-blue-600">· Rerank 已启用</span>}
                    </p>
                    {results.map((r, idx) => (
                      <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-xs font-bold text-gray-400 flex-shrink-0">#{idx + 1}</span>
                            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                              {settings.highlightKeywords ? highlightText(r.title, r.highlightTerms) : r.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[10px] text-gray-500">{(r.score * 100).toFixed(1)}%</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={i < scoreToStars(r.score) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-2 pl-6">
                          {settings.highlightKeywords ? highlightText(r.summary, r.highlightTerms) : r.summary}
                        </p>
                        <div className="flex items-center justify-between pl-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <FileText size={10} />{r.doc} · P{r.page}
                            </span>
                            {r.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{tag}</span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigate('kb-detail', { selectedKBId: app.kbIds[0] })}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <ExternalLink size={10} /> 查看原文
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(r)}
                              className="text-[10px] text-gray-500 hover:underline flex items-center gap-0.5"
                            >
                              {copiedId === r.id ? <><Check size={10} /> 已复制</> : <><Copy size={10} /> 复制</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'summary' && settings.aiSummary && aiSummary && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">AI 智能摘要</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiSummary}</p>
                    <p className="text-[10px] text-gray-400 mt-3">基于 {results.length} 条检索结果生成 · POST /search-apps/&#123;id&#125;/summarize</p>
                  </div>
                )}

                {activeTab === 'related' && settings.relatedSearch && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                      <Sparkles size={13} /> 相关搜索推荐
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {RELATED_SEARCHES.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setQuery(s); }}
                          className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 hover:text-blue-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'mindmap' && settings.mindmap && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-1.5">
                      <Layers size={13} /> 知识结构思维导图
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold mb-4 shadow">
                        {MINDMAP_NODES.root}
                      </div>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                      <div className="flex flex-wrap gap-4 justify-center">
                        {MINDMAP_NODES.children.map((c, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mb-1" />
                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center min-w-20">
                              <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.label}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{c.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          <SearchSettingsPanel
            open={showSettings}
            settings={settings}
            onChange={setSettings}
            onClose={() => setShowSettings(false)}
            onSave={() => showToast('搜索设置已保存')}
          />
        </div>
      </div>
    </div>
  );
}
