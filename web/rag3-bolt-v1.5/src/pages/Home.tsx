import { useMemo, useState } from 'react';
import {
  Plus, MessageSquare, Search, GitBranch, BarChart2,
  FileText, TrendingUp, Clock, ArrowRight, Zap, Database,
  Activity, BookOpen, Network, Upload, FlaskConical,
  Loader, ChevronRight, Sparkles, Target, Users,
  Bell, ExternalLink, Cpu, LayoutGrid, List, FileText as FileIcon,
  ChevronLeft, AlertCircle, HardDrive,
} from 'lucide-react';
import { WIKI_COMPILE_QUEUE } from '../data/wikiMock';
import { PAGEINDEX_BUILD_QUEUE } from '../data/pageIndexMock';
import { mockKBs, mockConversations, mockEvalRuns, mockABTests } from '../mockData';
import type { KnowledgeBase } from '../types';
import { SystemSectionTabs } from '../components/SystemSubNav';
import { KBCreateDialog, type KBCreateForm } from '../components/KBCreateDialog';
import { PAGEINDEX_GLOBAL_FAILED_COUNT } from '../data/pageIndexMock';
import {
  QUERY_TREND_7D, QUERY_TREND_30D, TOP_KB_QUERIES, TOP_CITED_DOCS, QUERY_FAILURES,
  RAG3_OPS, SYSTEM_HEALTH, PENDING_TASKS, RECENT_ACTIVITIES, ACTIVITY_TYPE_LABELS,
  HOME_SECTIONS, type HomeSection, QUICK_ACTION_PAGES,
  getPlatformStats, RAG3_INDEX_STATS, WIKI_STATS, PAGEINDEX_STATS,
} from '../data/homeMock';

interface HomePageProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
  currentUser: { name: string; role: string } | null;
}

const statusConfig = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  indexing: { label: '索引中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const ICON_MAP = {
  MessageSquare, Search, GitBranch, BarChart2, Upload, FlaskConical,
  Database, FileText, Cpu, TrendingUp, Target, Clock, AlertCircle, HardDrive,
  BookOpen, Loader, Sparkles, Network,
};

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function formatTime(iso: string) {
  const now = new Date('2026-06-06T12:00:00Z').getTime();
  const t = new Date(iso).getTime();
  const diff = now - t;
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  return Math.floor(diff / 86400000) + ' 天前';
}

const KB_PAGE_SIZE = 8;

export function HomePage({ onNavigate, currentUser }: HomePageProps) {
  const [section, setSection] = useState(0);
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const [search, setSearch] = useState('');
  const [kbStatus, setKbStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [kbPage, setKbPage] = useState(1);
  const [activityType, setActivityType] = useState('all');
  const [leaderboardTab, setLeaderboardTab] = useState<'kb' | 'doc' | 'fail'>('kb');
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const totalDocs = mockKBs.reduce((s, k) => s + k.doc_count, 0);
  const totalChunks = mockKBs.reduce((s, k) => s + k.chunk_count, 0);
  const totalStorage = formatBytes(mockKBs.reduce((s, k) => s + k.total_size_bytes, 0));
  const platformStats = getPlatformStats(period, mockKBs.length, mockKBs.filter(k => k.status === 'active').length, totalDocs, totalChunks, totalStorage);
  const indexingCount = mockKBs.filter(k => k.status === 'indexing').length;
  const runningEval = mockEvalRuns.find(e => e.status === 'running');
  const runningAB = mockABTests.find(t => t.status === 'running');
  const queryTrend = period === '7d' ? QUERY_TREND_7D : QUERY_TREND_30D;
  const today = new Date('2026-06-06');

  const filteredKBs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockKBs.filter(kb => {
      const matchSearch = !q || kb.name.toLowerCase().includes(q) || kb.description.toLowerCase().includes(q);
      const matchStatus = kbStatus === 'all' || kb.status === kbStatus;
      return matchSearch && matchStatus;
    });
  }, [search, kbStatus]);

  const kbTotalPages = Math.max(1, Math.ceil(filteredKBs.length / KB_PAGE_SIZE));
  const pagedKBs = filteredKBs.slice((kbPage - 1) * KB_PAGE_SIZE, kbPage * KB_PAGE_SIZE);

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RECENT_ACTIVITIES.filter(a => {
      if (activityType !== 'all' && a.type !== activityType) return false;
      if (q && !a.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, activityType]);

  const handleCreate = async (form: KBCreateForm) => {
    await new Promise(r => setTimeout(r, 600));
    onNavigate('kb-detail', { selectedKBId: 'kb-001' });
    showToast(`知识库「${form.name.trim()}」创建成功`);
  };

  const activeSection = HOME_SECTIONS[section] as HomeSection;

  return (
    <div className="p-6 flex flex-col gap-5 h-full min-h-0 overflow-y-auto bg-gray-50/30 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      {/* 页头 — 对齐知识库管理 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            工作台
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              · 欢迎回来，{currentUser?.name || '用户'}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            <span className="mx-1.5">·</span>
            {currentUser?.role || '用户'} · 企业知识库运营驾驶舱（§10.2）
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('sys-monitor')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Activity size={14} /> 系统监控
          </button>
          <button
            type="button"
            onClick={() => onNavigate('eval-dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <BarChart2 size={14} /> 评测中心
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

      {/* 运营告警条 */}
      {(indexingCount > 0 || PAGEINDEX_GLOBAL_FAILED_COUNT > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start sm:items-center gap-2 text-sm text-amber-800 dark:text-amber-300 min-w-0">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="line-clamp-2 sm:line-clamp-none">
              {indexingCount > 0 && <><strong>{indexingCount}</strong> 个知识库索引中</>}
              {indexingCount > 0 && PAGEINDEX_GLOBAL_FAILED_COUNT > 0 && ' · '}
              {PAGEINDEX_GLOBAL_FAILED_COUNT > 0 && <>PageIndex 失败 <strong>{PAGEINDEX_GLOBAL_FAILED_COUNT}</strong> 条</>}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {indexingCount > 0 && (
              <button type="button" onClick={() => onNavigate('kb-index-status', { selectedKBId: 'kb-002' })} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">索引状态</button>
            )}
            {PAGEINDEX_GLOBAL_FAILED_COUNT > 0 && (
              <button type="button" onClick={() => onNavigate('pageindex-hub')} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">处理失败</button>
            )}
          </div>
        </div>
      )}

      {runningEval && (
        <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300 min-w-0">
            <Loader size={16} className="animate-spin flex-shrink-0" />
            <span className="truncate"><strong>{runningEval.name}</strong> 运行中 · {runningEval.test_set_size} 条样本</span>
          </div>
          <button type="button" onClick={() => onNavigate('eval-tasks')} className="text-xs text-blue-600 hover:underline flex-shrink-0">查看任务</button>
        </div>
      )}

      {/* 统计卡片 — 平台运营 + RAG3 增强索引双行 */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">平台运营</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {platformStats.map((s, i) => (
              <StatCard key={i} stat={s} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">RAG 3.0 增强索引（Wiki · PageIndex · 图谱）</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {RAG3_INDEX_STATS.map((s, i) => (
              <StatCard key={i} stat={s} onClick={'page' in s ? () => onNavigate(s.page, { selectedKBId: 'kb-001' }) : undefined} />
            ))}
          </div>
        </div>
      </div>

      {/* 工具栏 — 对齐 KB 筛选条 */}
      <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setKbPage(1); }}
              placeholder={activeSection === '平台动态' ? '搜索动态内容...' : '搜索知识库名称或描述...'}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-1.5">
            {(['7d', '30d'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {p === '7d' ? '近 7 天' : '近 30 天'}
              </button>
            ))}
          </div>
          {(activeSection === '我的知识库' || section === 0) && (
            <div className="flex gap-1.5 flex-wrap">
              {[{ v: 'all', l: '全部' }, { v: 'active', l: '活跃' }, { v: 'indexing', l: '索引中' }].map(f => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => { setKbStatus(f.v); setKbPage(1); }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${kbStatus === f.v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          )}
          {activeSection === '平台动态' && (
            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
            >
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          )}
          {(activeSection === '我的知识库' || activeSection === '平台动态') && (
            <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><LayoutGrid size={14} /></button>
              <button type="button" onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><List size={14} /></button>
            </div>
          )}
        </div>
        <SystemSectionTabs tabs={[...HOME_SECTIONS]} activeTab={section} onTabChange={setSection} />
      </div>

      {/* 快捷入口条 */}
      {(activeSection === '概览' || activeSection === '运营分析') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {QUICK_ACTION_PAGES.map((a, i) => {
            const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
            return (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(a.page, 'extra' in a ? a.extra : undefined)}
                className="group flex items-center gap-2.5 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{a.label}</div>
                  <div className="text-[10px] text-gray-400 truncate">{a.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ========== 概览 ========== */}
      {activeSection === '概览' && (
        <div className="flex flex-col gap-4">
          <Rag3Widget onNavigate={onNavigate} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WikiHubPanel onNavigate={onNavigate} />
            <PageIndexHubPanel onNavigate={onNavigate} />
          </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockKBs.slice(0, 5).map(kb => (
                <WorkbenchKBCard key={kb.kb_id} kb={kb} onNavigate={onNavigate} compact />
              ))}
              <button
                type="button"
                onClick={() => onNavigate('kb-list')}
                className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 min-h-[160px] bg-white dark:bg-gray-900"
              >
                <Plus size={20} className="text-gray-400" />
                <span className="text-xs text-gray-500">查看全部知识库</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrendCard trend={queryTrend} period={period} />
              <HealthCard onNavigate={onNavigate} />
            </div>
          </div>
          <div className="xl:col-span-4 flex flex-col gap-4">
            <TasksCard onNavigate={onNavigate} />
            <ConversationsCard onNavigate={onNavigate} />
            <EvalSummaryCard onNavigate={onNavigate} runningAB={runningAB} />
            <ActivitiesPreview onNavigate={onNavigate} onViewAll={() => setSection(3)} />
          </div>
        </div>
        </div>
      )}

      {/* ========== 运营分析 ========== */}
      {activeSection === '运营分析' && (
        <div className="flex flex-col gap-4">
          <Rag3Widget onNavigate={onNavigate} />
          <LeaderboardCard
            tab={leaderboardTab}
            onTabChange={setLeaderboardTab}
            onNavigate={onNavigate}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrendCard trend={queryTrend} period={period} large />
            <HealthCard onNavigate={onNavigate} />
          </div>
        </div>
      )}

      {/* ========== 我的知识库 ========== */}
      {activeSection === '我的知识库' && (
        <>
          {filteredKBs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
              <Database size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">未找到匹配的知识库</p>
              <button type="button" onClick={() => { setSearch(''); setKbStatus('all'); }} className="mt-2 text-xs text-blue-600 hover:underline">清除筛选</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pagedKBs.map(kb => <WorkbenchKBCard key={kb.kb_id} kb={kb} onNavigate={onNavigate} />)}
              <div
                onClick={() => setShowCreate(true)}
                className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 cursor-pointer min-h-[200px]"
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">文档</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Chunk</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">更新</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedKBs.map(kb => {
                    const sc = statusConfig[kb.status];
                    return (
                      <tr key={kb.kb_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })} className="flex items-center gap-2 text-left hover:text-blue-600">
                            <span className="text-lg">{kb.icon}</span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{kb.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">{kb.doc_count}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden lg:table-cell">{(kb.chunk_count / 1000).toFixed(1)}k</td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatTime(kb.updated_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => onNavigate('kb-documents', { selectedKBId: kb.kb_id })} className="text-xs text-blue-600 hover:underline">文档</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredKBs.length > KB_PAGE_SIZE && (
            <Pagination page={kbPage} totalPages={kbTotalPages} onPageChange={setKbPage} total={filteredKBs.length} />
          )}
        </>
      )}

      {/* ========== 平台动态 ========== */}
      {activeSection === '平台动态' && (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 w-28">时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 w-16">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">内容</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map(a => (
                    <tr
                      key={a.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => onNavigate(a.page, a.extra)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500">{a.time}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{ACTIVITY_TYPE_LABELS[a.type] || a.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">{a.icon} {a.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredActivities.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onNavigate(a.page, a.extra)}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 text-left transition-colors"
                >
                  <span className="text-xl">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-1">{ACTIVITY_TYPE_LABELS[a.type]} · {a.time}</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{a.text}</div>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <button type="button" onClick={() => onNavigate('sys-audit')} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
              查看完整审计日志 <ChevronRight size={12} />
            </button>
          </div>
        </>
      )}

      <KBCreateDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}

function StatCard({
  stat,
  onClick,
}: {
  stat: { label: string; value: string; sub: string; icon: string; color: string; bg: string };
  onClick?: () => void;
}) {
  const Icon = ICON_MAP[stat.icon as keyof typeof ICON_MAP] ?? Database;
  const inner = (
    <>
      <div className={`${stat.bg} p-2 rounded-lg flex-shrink-0`}><Icon size={16} className={stat.color} /></div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
        <div className="text-[10px] text-gray-400 truncate">{stat.sub}</div>
      </div>
    </>
  );
  const cls = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex items-center gap-3 min-w-0 w-full text-left transition-colors';
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm cursor-pointer`}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function WikiHubPanel({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-violet-200 dark:border-violet-900/50 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-lg"><BookOpen size={16} className="text-violet-600" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">LLM Wiki 知识库</h3>
            <p className="text-[10px] text-gray-500">Karpathy 工作流 · raw/ → wiki/ 编译</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('wiki-hub', { selectedKBId: 'kb-001' })} className="text-xs text-violet-600 hover:underline flex items-center gap-1">
          Wiki Hub <ExternalLink size={11} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { l: '已发布', v: WIKI_STATS.published, c: 'text-green-600' },
          { l: '编译中', v: WIKI_STATS.compiling, c: 'text-blue-600' },
          { l: '待审核', v: WIKI_STATS.reviewing, c: 'text-amber-600' },
          { l: '失败', v: WIKI_STATS.failed, c: 'text-red-600' },
        ].map(s => (
          <div key={s.l} className="bg-violet-50/50 dark:bg-violet-950/20 rounded-lg p-2 text-center">
            <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-1.5 mb-3">
        <p className="text-[10px] font-medium text-gray-500">编译队列</p>
        {WIKI_COMPILE_QUEUE.slice(0, 3).map(job => (
          <button
            key={job.id}
            type="button"
            onClick={() => onNavigate('wiki-hub', { selectedKBId: 'kb-001' })}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left"
          >
            <span className="text-xs text-gray-800 dark:text-gray-200 truncate">{job.title}</span>
            <span className={`text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded ${
              job.status === 'failed' ? 'bg-red-100 text-red-700' : job.status === 'compiling' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>{job.step}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={() => onNavigate('wiki-hub', { selectedKBId: 'kb-001' })} className="flex-1 text-xs py-2 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300">
          进入 Wiki Hub
        </button>
        <button type="button" onClick={() => onNavigate('kb-wiki', { selectedKBId: 'kb-001' })} className="flex-1 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          Wiki 浏览器
        </button>
      </div>
    </div>
  );
}

function PageIndexHubPanel({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-cyan-200 dark:border-cyan-900/50 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg"><Network size={16} className="text-cyan-600" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">PageIndex 管理</h3>
            <p className="text-[10px] text-gray-500">文档树索引 · MCTS / LLM 检索</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('pageindex-hub', { selectedKBId: 'kb-001' })} className="text-xs text-cyan-600 hover:underline flex items-center gap-1">
          PageIndex Hub <ExternalLink size={11} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { l: '已建树', v: PAGEINDEX_STATS.completed, c: 'text-green-600' },
          { l: '建树中', v: PAGEINDEX_STATS.building, c: 'text-blue-600' },
          { l: '待处理', v: PAGEINDEX_STATS.pending, c: 'text-amber-600' },
          { l: '失败', v: PAGEINDEX_GLOBAL_FAILED_COUNT, c: 'text-red-600' },
        ].map(s => (
          <div key={s.l} className="bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg p-2 text-center">
            <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-1.5 mb-3">
        <p className="text-[10px] font-medium text-gray-500">建树队列 · 全局进度 {PAGEINDEX_STATS.buildRate}%</p>
        {PAGEINDEX_BUILD_QUEUE.slice(0, 3).map(job => (
          <button
            key={job.id}
            type="button"
            onClick={() => onNavigate('pageindex-hub', { selectedKBId: 'kb-001' })}
            className="w-full px-2 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-left"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-gray-800 dark:text-gray-200 truncate">{job.docName}</span>
              <span className="text-[10px] text-gray-500 flex-shrink-0">{job.progress}%</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${job.progress}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">{job.stepLabel}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={() => onNavigate('pageindex-hub', { selectedKBId: 'kb-001' })} className="flex-1 text-xs py-2 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300">
          进入 PageIndex Hub
        </button>
        <button type="button" onClick={() => onNavigate('kb-pageindex-tree', { selectedKBId: 'kb-001' })} className="flex-1 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          文档树浏览
        </button>
      </div>
    </div>
  );
}

function WorkbenchKBCard({
  kb, onNavigate, compact = false,
}: {
  kb: KnowledgeBase;
  onNavigate: HomePageProps['onNavigate'];
  compact?: boolean;
}) {
  const sc = statusConfig[kb.status];
  const indexPct = kb.status === 'indexing' ? 68 : 100;

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700 cursor-pointer transition-all group flex flex-col"
      onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <span className="text-2xl flex-shrink-0">{kb.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-blue-700">{kb.name}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </div>
      </div>
      {!compact && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{kb.description}</p>}
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
          <div className="flex justify-between text-[9px] text-gray-500 mb-0.5"><span>索引进度</span><span>{indexPct}%</span></div>
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${indexPct}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        {[
          { icon: FileIcon, label: '文档', page: 'kb-documents' },
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
      {!compact && (
        <div className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
          <Clock size={10} />更新 {formatTime(kb.updated_at)}
        </div>
      )}
    </div>
  );
}

function TrendCard({ trend, period, large }: { trend: number[]; period: string; large?: boolean }) {
  const max = Math.max(...trend);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">查询趋势（{period === '7d' ? '近 7 天' : '近 30 天'}）</h3>
      <div className={`flex items-end gap-0.5 ${large ? 'h-28' : 'h-20'}`}>
        {trend.map((v, i) => (
          <div key={i} className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-sm opacity-75 hover:opacity-100 transition-opacity" style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-2">
        <span>{period === '7d' ? '6月1日' : '5月7日'}</span>
        <span className="text-blue-600 font-medium">峰值 {max} 次/日</span>
      </div>
    </div>
  );
}

function HealthCard({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">系统健康度</h3>
        <button type="button" onClick={() => onNavigate('sys-monitor')} className="text-xs text-blue-600 hover:underline">详情</button>
      </div>
      <div className="space-y-2.5">
        {SYSTEM_HEALTH.map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{item.value}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksCard({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">进行中的任务</h3>
        <button type="button" onClick={() => onNavigate('sys-monitor', { monitorTab: 1 })} className="text-xs text-blue-600 hover:underline flex items-center gap-1">流水线 <ArrowRight size={11} /></button>
      </div>
      <div className="space-y-3">
        {PENDING_TASKS.map(task => (
          <button
            key={task.id}
            type="button"
            onClick={() => onNavigate(task.page, { selectedKBId: task.kbId })}
            className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="text-xs text-gray-700 dark:text-gray-300 truncate mb-1.5">{task.text}</div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1 text-right">{task.progress}%</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationsCard({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">最近对话</h3>
        <button type="button" onClick={() => onNavigate('chat')} className="text-xs text-blue-600 hover:underline">查看全部</button>
      </div>
      <div className="space-y-1">
        {mockConversations.slice(0, 4).map(conv => (
          <button
            key={conv.conv_id}
            type="button"
            onClick={() => onNavigate('chat', { selectedConvId: conv.conv_id })}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start gap-2">
              <MessageSquare size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{conv.title}</div>
                <div className="text-[10px] text-gray-400 truncate">{conv.last_message}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EvalSummaryCard({
  onNavigate, runningAB,
}: {
  onNavigate: HomePageProps['onNavigate'];
  runningAB: (typeof mockABTests)[0] | undefined;
}) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-blue-200" /><span className="text-sm font-semibold">质量运营</span></div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[{ l: 'Faithfulness', v: '0.92' }, { l: 'Hallucination', v: '0.04' }].map((m, i) => (
          <div key={i} className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{m.v}</div>
            <div className="text-[10px] text-blue-200">{m.l}</div>
          </div>
        ))}
      </div>
      {runningAB && (
        <div className="text-[11px] text-blue-200 mb-3 flex items-center gap-1.5">
          <FlaskConical size={11} />A/B 进行中：{runningAB.name.slice(0, 18)}…
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => onNavigate('eval-dashboard')} className="flex-1 text-xs py-1.5 bg-white/15 hover:bg-white/25 rounded-lg">评测看板</button>
        <button type="button" onClick={() => onNavigate('eval-ab-test')} className="flex-1 text-xs py-1.5 bg-white/15 hover:bg-white/25 rounded-lg">A/B 实验</button>
      </div>
    </div>
  );
}

function ActivitiesPreview({ onNavigate, onViewAll }: { onNavigate: HomePageProps['onNavigate']; onViewAll: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5"><Bell size={14} className="text-gray-400" />最近动态</h3>
        <button type="button" onClick={onViewAll} className="text-xs text-blue-600 hover:underline">全部</button>
      </div>
      <div className="space-y-2">
        {RECENT_ACTIVITIES.slice(0, 4).map(a => (
          <button key={a.id} type="button" onClick={() => onNavigate(a.page, a.extra)} className="w-full flex items-start gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1 transition-colors">
            <span className="text-sm">{a.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{a.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Rag3Widget({ onNavigate }: { onNavigate: HomePageProps['onNavigate'] }) {
  return (
    <div className="bg-gradient-to-r from-violet-50 via-white to-cyan-50 dark:from-violet-950/30 dark:via-gray-900 dark:to-cyan-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">RAG 3.0 增强索引运营</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded">§14.2</span>
        </div>
        <button type="button" onClick={() => onNavigate('sys-monitor', { monitorTab: 2 })} className="text-xs text-violet-600 hover:underline flex items-center gap-1">
          监控巡检 <ExternalLink size={11} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {RAG3_OPS.map(op => (
          <button key={op.label} type="button" onClick={() => onNavigate(op.page, { selectedKBId: 'kb-001' })} className={`${op.bg} rounded-xl p-3 text-left hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-800 transition-all`}>
            <div className={`text-2xl font-bold ${op.color}`}>{op.value}</div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">{op.label}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'wiki-hub', label: 'Wiki Hub', icon: BookOpen },
          { id: 'pageindex-hub', label: 'PageIndex 管理', icon: Network },
          { id: 'graphrag-hub', label: '知识图谱管理', icon: BarChart2 },
        ] as const).map(hub => {
          const Icon = hub.icon;
          return (
            <button key={hub.id} type="button" onClick={() => onNavigate(hub.id, { selectedKBId: 'kb-001' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-violet-300 text-gray-700 dark:text-gray-300">
              <Icon size={12} />{hub.label}<ChevronRight size={11} className="text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardCard({
  tab, onTabChange, onNavigate,
}: {
  tab: 'kb' | 'doc' | 'fail';
  onTabChange: (t: 'kb' | 'doc' | 'fail') => void;
  onNavigate: HomePageProps['onNavigate'];
}) {
  const items = tab === 'kb' ? TOP_KB_QUERIES : tab === 'doc' ? TOP_CITED_DOCS : QUERY_FAILURES;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">运营排行榜（US-1.9）</h3>
          <button type="button" onClick={() => onNavigate('eval-dashboard')} className="text-xs text-blue-600 hover:underline">运营分析</button>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-4 px-4">
          <SystemSectionTabs
            tabs={['查询最多知识库', '被引用文档', '查询失败']}
            activeTab={tab === 'kb' ? 0 : tab === 'doc' ? 1 : 2}
            onTabChange={i => onTabChange(i === 0 ? 'kb' : i === 1 ? 'doc' : 'fail')}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-1">
          {items.map(item => (
            <button
              key={item.rank}
              type="button"
              onClick={() => 'kbId' in item && item.kbId && onNavigate('kb-detail', { selectedKBId: item.kbId })}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
            >
              <span className={`text-[10px] font-bold w-5 text-center ${item.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>{item.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-800 dark:text-gray-200 truncate">{item.name}</div>
                {'reason' in item && item.reason && <div className="text-[10px] text-gray-400">{item.reason}</div>}
              </div>
              <span className={`text-xs font-semibold flex-shrink-0 ${tab === 'fail' ? 'text-red-600' : 'text-blue-600'}`}>
                {tab === 'fail' ? `${item.count}次` : item.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange, total }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; total: number;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>共 {total} 项</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="p-1.5 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ChevronLeft size={14} />
        </button>
        <span>{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="p-1.5 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
