import { useState } from 'react';
import {
  Plus, MessageSquare, Search, GitBranch, BarChart2,
  FileText, TrendingUp, Clock, ArrowRight, Zap, Database,
  Activity, BookOpen, Network, Upload, FlaskConical,
  Loader, ChevronRight, Sparkles, Target, Users,
  Bell, ExternalLink, Cpu
} from 'lucide-react';
import { mockKBs, mockConversations, mockEvalRuns, mockABTests } from '../mockData';
import { PAGEINDEX_GLOBAL_FAILED_COUNT } from '../data/pageIndexMock';

interface HomePageProps {
  onNavigate: (page: string, extra?: any) => void;
  currentUser: { name: string; role: string } | null;
}

const statusConfig = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  indexing: { label: '索引中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const QUERY_TREND = [28, 35, 22, 45, 38, 52, 31, 48, 55, 42, 60, 38, 44, 58, 67, 52, 48, 71, 63, 58, 74, 68, 55, 82, 76, 69, 85, 79, 88, 92];

const TOP_KB_QUERIES = [
  { rank: 1, name: '法务合同知识库', count: 4520, kbId: 'kb-001' },
  { rank: 2, name: '财务报告知识库', count: 2100, kbId: 'kb-002' },
  { rank: 3, name: '研发技术文档库', count: 1850, kbId: 'kb-003' },
  { rank: 4, name: '合规政策知识库', count: 1240, kbId: 'kb-004' },
  { rank: 5, name: '产品手册知识库', count: 980, kbId: 'kb-006' },
];

const TOP_CITED_DOCS = [
  { rank: 1, name: '供应商合同模板V5.pdf', count: 1240 },
  { rank: 2, name: '合规政策汇编2024.pdf', count: 890 },
  { rank: 3, name: '采购协议条款.docx', count: 756 },
  { rank: 4, name: '知识产权协议范本.pdf', count: 612 },
  { rank: 5, name: '审计报告Q2.pdf', count: 498 },
];

const QUERY_FAILURES = [
  { rank: 1, name: '扫描件合同.pdf', count: 89, reason: 'OCR 质量低' },
  { rank: 2, name: '旧版合同模板.pdf', count: 56, reason: '索引过期' },
  { rank: 3, name: '财务数据Q2.xlsx', count: 42, reason: '解析失败' },
  { rank: 4, name: '手写备忘录.jpg', count: 31, reason: '无文本层' },
  { rank: 5, name: '加密文档.pdf', count: 28, reason: '权限拒绝' },
];

const RAG3_OPS = [
  { label: 'Wiki 编译中', value: 12, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', page: 'wiki-hub' },
  { label: '待审核', value: 5, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', page: 'wiki-hub' },
  { label: 'PageIndex 失败', value: PAGEINDEX_GLOBAL_FAILED_COUNT, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', page: 'pageindex-hub' },
  { label: '实体待复核', value: 86, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', page: 'graphrag-hub' },
];

const SYSTEM_HEALTH = [
  { label: '向量引擎', value: 99.8, color: 'bg-green-500' },
  { label: 'LLM 服务', value: 97.2, color: 'bg-blue-500' },
  { label: '索引队列', value: 85.5, color: 'bg-amber-500' },
  { label: '缓存命中', value: 92.1, color: 'bg-purple-500' },
];

const PENDING_TASKS = [
  { icon: <Loader size={13} className="animate-spin text-blue-500" />, text: '财务报告知识库 · 向量索引重建', progress: 68 },
  { icon: <BookOpen size={13} className="text-violet-500" />, text: 'Wiki 编译 · 合规政策条目', progress: 45 },
  { icon: <GitBranch size={13} className="text-cyan-500" />, text: 'PageIndex 建树 · 审计报告.pdf', progress: 22 },
];

function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      {action && (
        <button type="button" onClick={action.onClick} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          {action.label} <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

function RankList({ items, variant }: {
  items: { rank: number; name: string; count: number; reason?: string }[];
  variant: 'query' | 'cite' | 'fail';
}) {
  const countColor = variant === 'fail' ? 'text-red-600' : 'text-blue-600';
  return (
    <div className="space-y-1">
      {items.map(item => (
        <div key={item.rank} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <span className={`text-[10px] font-bold w-4 text-center ${item.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
            {item.rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-800 dark:text-gray-200 truncate">{item.name}</div>
            {item.reason && <div className="text-[10px] text-gray-400 truncate">{item.reason}</div>}
          </div>
          <span className={`text-xs font-semibold flex-shrink-0 ${countColor}`}>
            {variant === 'fail' ? `${item.count}次` : item.count.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomePage({ onNavigate, currentUser }: HomePageProps) {
  const totalDocs = mockKBs.reduce((s, k) => s + k.doc_count, 0);
  const totalChunks = mockKBs.reduce((s, k) => s + k.chunk_count, 0);
  const indexingCount = mockKBs.filter(k => k.status === 'indexing').length;
  const runningEval = mockEvalRuns.find(e => e.status === 'running');
  const runningAB = mockABTests.find(t => t.status === 'running');
  const [leaderboardTab, setLeaderboardTab] = useState<'kb' | 'doc' | 'fail'>('kb');

  const quickActions = [
    { icon: MessageSquare, label: '新建对话', desc: 'RAG 问答', page: 'chat', color: 'from-blue-500 to-blue-600' },
    { icon: Search, label: '新建搜索', desc: '搜索应用', page: 'search', color: 'from-purple-500 to-purple-600' },
    { icon: GitBranch, label: '新建 Agent', desc: '工作流', page: 'agent', color: 'from-orange-500 to-orange-600' },
    { icon: BarChart2, label: '新建评测', desc: '质量回归', page: 'eval-tasks', color: 'from-green-500 to-green-600' },
    { icon: Upload, label: '上传文档', desc: '批量导入', page: 'kb-documents', color: 'from-cyan-500 to-cyan-600', extra: { selectedKBId: 'kb-001' } },
    { icon: FlaskConical, label: '检索测试', desc: '多通道', page: 'kb-retrieval-test', color: 'from-indigo-500 to-indigo-600', extra: { selectedKBId: 'kb-001' } },
  ];

  const recentActivities = [
    { icon: '✅', text: '供应商合同模板V5.pdf 解析完成，质量评分 96', time: '2分钟前', page: 'kb-documents', extra: { selectedKBId: 'kb-001' } },
    { icon: '📊', text: '6月Faithfulness评测完成，综合得分 0.92', time: '1小时前', page: 'eval-dashboard' },
    { icon: '⬆️', text: '王芳 上传了 采购协议条款.docx', time: '2小时前', page: 'kb-documents', extra: { selectedKBId: 'kb-001' } },
    { icon: '⚙️', text: 'PageIndex 流水线进度更新至 54.5%', time: '3小时前', page: 'pageindex-hub' },
    { icon: '🔍', text: 'GraphRAG 实体复核队列新增 12 条', time: '4小时前', page: 'graphrag-hub' },
    { icon: '👤', text: '李婷 创建了新用户 孙立', time: '今天 08:30', page: 'sys-users' },
  ];

  const today = new Date('2026-06-06');

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto p-6 flex flex-col gap-5">

        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  欢迎回来，{currentUser?.name || '用户'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> 系统运行中
                </span>
                {indexingCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Cpu size={10} /> {indexingCount} 库索引中
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                <span className="mx-2 text-gray-300">·</span>
                {currentUser?.role || '用户'}工作台
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigate('sys-monitor')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Activity size={14} /> 系统监控
              </button>
              <button
                type="button"
                onClick={() => onNavigate('kb-list')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                <Plus size={16} /> 创建知识库
              </button>
            </div>
          </div>
        </div>

        {/* 运营概览 US-1.9 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: '总文档', value: totalDocs.toLocaleString(), sub: '跨 6 个知识库', trend: '+326', icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Chunk 总数', value: (totalChunks / 1000).toFixed(1) + 'k', sub: '已向量化', trend: '+4.2k', icon: Database, iconColor: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: '本月查询', value: '45,200', sub: '较上月 +18%', trend: '+8.1k', icon: TrendingUp, iconColor: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: '命中率', value: '94.2%', sub: '7 天均值', trend: '+1.2%', icon: Target, iconColor: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${s.bg} p-2 rounded-lg`}><Icon size={16} className={s.iconColor} /></div>
                  <span className="text-[10px] font-medium text-green-600">+{s.trend}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{s.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* 主内容区：左宽右窄 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

          {/* 左侧主栏 */}
          <div className="xl:col-span-8 flex flex-col gap-4">

            {/* 最近知识库 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="最近知识库" action={{ label: '查看全部', onClick: () => onNavigate('kb-list') }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mockKBs.slice(0, 5).map(kb => {
                  const sc = statusConfig[kb.status];
                  return (
                    <button
                      key={kb.kb_id}
                      type="button"
                      onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}
                      className="flex flex-col p-3.5 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 hover:shadow-md dark:hover:border-blue-800 transition-all text-left group bg-gray-50/30 dark:bg-gray-800/30"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl">{kb.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 transition-colors">{kb.name}</div>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium mt-0.5 ${sc.color}`}>
                            <span className={`w-1 h-1 rounded-full ${sc.dot}`} />{sc.label}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div><div className="text-xs font-bold text-gray-800 dark:text-gray-200">{kb.doc_count}</div><div className="text-[9px] text-gray-400">文档</div></div>
                        <div><div className="text-xs font-bold text-gray-800 dark:text-gray-200">{(kb.chunk_count / 1000).toFixed(1)}k</div><div className="text-[9px] text-gray-400">Chunk</div></div>
                        <div><div className="text-xs font-bold text-gray-800 dark:text-gray-200">92%</div><div className="text-[9px] text-gray-400">质量</div></div>
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onNavigate('kb-list')}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all min-h-[120px]"
                >
                  <Plus size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-500">浏览更多知识库</span>
                </button>
              </div>
            </div>

            {/* 应用快捷入口 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="应用快捷入口" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {quickActions.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onNavigate(a.page, a.extra)}
                      className="group flex flex-col items-center gap-2 p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 hover:shadow-sm dark:hover:border-blue-800 transition-all bg-gray-50/50 dark:bg-gray-800/30"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{a.label}</div>
                        <div className="text-[10px] text-gray-400">{a.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RAG 3.0 增强索引运营 Widget §14.2 */}
            <div className="bg-gradient-to-r from-violet-50 via-white to-cyan-50 dark:from-violet-950/30 dark:via-gray-900 dark:to-cyan-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50 p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">RAG 3.0 增强索引运营</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded">平台管理员</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('sys-monitor')}
                  className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                >
                  查看全部 <ExternalLink size={11} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {RAG3_OPS.map(op => (
                  <button
                    key={op.label}
                    type="button"
                    onClick={() => onNavigate(op.page, { selectedKBId: 'kb-001' })}
                    className={`${op.bg} rounded-xl p-3 text-left hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-800 transition-all`}
                  >
                    <div className={`text-2xl font-bold ${op.color}`}>{op.value}</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{op.label}</div>
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
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => onNavigate(hub.id, { selectedKBId: 'kb-001' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Icon size={12} /> {hub.label} <ChevronRight size={11} className="text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 运营排行榜 US-1.9 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 pt-4 pb-0">
                <SectionHeader title="运营排行榜" action={{ label: '运营分析', onClick: () => onNavigate('eval-dashboard') }} />
                <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-4 px-4">
                  {([
                    { key: 'kb' as const, label: '查询最多知识库' },
                    { key: 'doc' as const, label: '被引用文档' },
                    { key: 'fail' as const, label: '查询失败' },
                  ]).map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setLeaderboardTab(t.key)}
                      className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                        leaderboardTab === t.key
                          ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                {leaderboardTab === 'kb' && (
                  <div className="space-y-1">
                    {TOP_KB_QUERIES.map(item => (
                      <button
                        key={item.rank}
                        type="button"
                        onClick={() => onNavigate('kb-detail', { selectedKBId: item.kbId })}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <span className={`text-[10px] font-bold w-4 text-center ${item.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>{item.rank}</span>
                        <span className="flex-1 text-xs text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                        <span className="text-xs font-semibold text-blue-600">{item.count.toLocaleString()}次</span>
                      </button>
                    ))}
                  </div>
                )}
                {leaderboardTab === 'doc' && <RankList items={TOP_CITED_DOCS} variant="cite" />}
                {leaderboardTab === 'fail' && <RankList items={QUERY_FAILURES} variant="fail" />}
              </div>
            </div>

            {/* 查询趋势 + 系统健康 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="近 30 天查询趋势" />
                <div className="flex items-end gap-0.5 h-20">
                  {QUERY_TREND.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-sm opacity-75 hover:opacity-100 transition-opacity"
                      style={{ height: `${(v / 92) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                  <span>5月7日</span>
                  <span className="text-blue-600 font-medium">今日 92 次</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="系统健康度" action={{ label: '详情', onClick: () => onNavigate('sys-monitor') }} />
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
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="xl:col-span-4 flex flex-col gap-4">

            {/* 进行中的任务 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="进行中的任务" action={{ label: '索引状态', onClick: () => onNavigate('kb-index-status', { selectedKBId: 'kb-002' }) }} />
              <div className="space-y-3">
                {PENDING_TASKS.map((task, i) => (
                  <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      {task.icon}
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{task.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">{task.progress}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近对话 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="最近对话" action={{ label: '查看全部', onClick: () => onNavigate('chat') }} />
              <div className="space-y-1">
                {mockConversations.slice(0, 5).map(conv => (
                  <button
                    key={conv.conv_id}
                    type="button"
                    onClick={() => onNavigate('chat', { selectedConvId: conv.conv_id })}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{conv.title}</div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">{conv.last_message}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 评测 & A/B 摘要 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-blue-200" />
                <span className="text-sm font-semibold">质量运营</span>
              </div>
              {runningEval && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-white/10 rounded-lg">
                  <Loader size={12} className="animate-spin text-blue-200" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{runningEval.name}</div>
                    <div className="text-[10px] text-blue-200">执行中 · {runningEval.test_set_size} 样本</div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { l: 'Faithfulness', v: '0.92' },
                  { l: 'Hallucination', v: '0.04' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{m.v}</div>
                    <div className="text-[10px] text-blue-200">{m.l}</div>
                  </div>
                ))}
              </div>
              {runningAB && (
                <div className="text-[11px] text-blue-200 mb-3 flex items-center gap-1.5">
                  <FlaskConical size={11} />
                  A/B 进行中：{runningAB.name.slice(0, 20)}…
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => onNavigate('eval-dashboard')} className="flex-1 text-xs py-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
                  评测看板
                </button>
                <button type="button" onClick={() => onNavigate('eval-ab-test')} className="flex-1 text-xs py-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
                  A/B 实验
                </button>
              </div>
            </div>

            {/* 最近动态 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Bell size={14} className="text-gray-400" /> 最近动态
                </h3>
              </div>
              <div className="space-y-3">
                {recentActivities.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => a.page && onNavigate(a.page, a.extra)}
                    className="w-full flex items-start gap-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1 -m-1 transition-colors"
                  >
                    <span className="text-sm flex-shrink-0 mt-0.5">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{a.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} />{a.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('sys-audit')}
                className="mt-3 w-full text-xs text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1"
              >
                查看审计日志 <ChevronRight size={12} />
              </button>
            </div>

            {/* 团队概览 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="团队协作" />
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['李', '王', '陈', '张'].map((initial, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-900">
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-700 dark:text-gray-300">12 位成员活跃</div>
                  <div className="text-[10px] text-gray-400">本周新增 3 份文档</div>
                </div>
                <button type="button" onClick={() => onNavigate('sys-users')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <Users size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
