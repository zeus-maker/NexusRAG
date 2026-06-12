import { PAGEINDEX_GLOBAL_FAILED_COUNT, PAGEINDEX_STATS } from './pageIndexMock';
import { WIKI_STATS } from './wikiMock';

export { WIKI_STATS, PAGEINDEX_STATS, PAGEINDEX_GLOBAL_FAILED_COUNT };

export const QUERY_TREND_7D = [52, 48, 71, 63, 58, 74, 92];
export const QUERY_TREND_30D = [28, 35, 22, 45, 38, 52, 31, 48, 55, 42, 60, 38, 44, 58, 67, 52, 48, 71, 63, 58, 74, 68, 55, 82, 76, 69, 85, 79, 88, 92];

export const TOP_KB_QUERIES = [
  { rank: 1, name: '法务合同知识库', count: 4520, kbId: 'kb-001' },
  { rank: 2, name: '财务报告知识库', count: 2100, kbId: 'kb-002' },
  { rank: 3, name: '研发技术文档库', count: 1850, kbId: 'kb-003' },
  { rank: 4, name: '合规政策知识库', count: 1240, kbId: 'kb-004' },
  { rank: 5, name: '产品手册知识库', count: 980, kbId: 'kb-006' },
];

export const TOP_CITED_DOCS = [
  { rank: 1, name: '供应商合同模板V5.pdf', count: 1240, kbId: 'kb-001' },
  { rank: 2, name: '合规政策汇编2024.pdf', count: 890, kbId: 'kb-004' },
  { rank: 3, name: '采购协议条款.docx', count: 756, kbId: 'kb-001' },
  { rank: 4, name: '知识产权协议范本.pdf', count: 612, kbId: 'kb-001' },
  { rank: 5, name: '审计报告Q2.pdf', count: 498, kbId: 'kb-002' },
];

export const QUERY_FAILURES = [
  { rank: 1, name: '扫描件合同.pdf', count: 89, reason: 'OCR 质量低', kbId: 'kb-001' },
  { rank: 2, name: '旧版合同模板.pdf', count: 56, reason: '索引过期', kbId: 'kb-001' },
  { rank: 3, name: '财务数据Q2.xlsx', count: 42, reason: '解析失败', kbId: 'kb-002' },
  { rank: 4, name: '手写备忘录.jpg', count: 31, reason: '无文本层', kbId: 'kb-003' },
  { rank: 5, name: '加密文档.pdf', count: 28, reason: '权限拒绝', kbId: 'kb-001' },
];

export const RAG3_OPS = [
  { label: 'Wiki 编译中', value: 12, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', page: 'wiki-hub' },
  { label: '待审核', value: 5, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', page: 'wiki-hub' },
  { label: 'PageIndex 失败', value: PAGEINDEX_GLOBAL_FAILED_COUNT, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', page: 'pageindex-hub' },
  { label: '实体待复核', value: 86, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', page: 'graphrag-hub' },
];

export const SYSTEM_HEALTH = [
  { label: '向量引擎', value: 99.8, color: 'bg-green-500' },
  { label: 'LLM 服务', value: 97.2, color: 'bg-blue-500' },
  { label: '索引队列', value: 85.5, color: 'bg-amber-500' },
  { label: '缓存命中', value: 92.1, color: 'bg-purple-500' },
];

export const PENDING_TASKS = [
  { id: 't1', type: 'index', text: '财务报告知识库 · 向量索引重建', progress: 68, kbId: 'kb-002', page: 'kb-index-status' },
  { id: 't2', type: 'wiki', text: 'Wiki 编译 · 合规政策条目', progress: 45, kbId: 'kb-004', page: 'wiki-hub' },
  { id: 't3', type: 'pageindex', text: 'PageIndex 建树 · 审计报告.pdf', progress: 22, kbId: 'kb-002', page: 'pageindex-hub' },
  { id: 't4', type: 'eval', text: '6月 Faithfulness 全量评测', progress: 54, kbId: 'kb-001', page: 'eval-tasks' },
];

export const RECENT_ACTIVITIES = [
  { id: 'a1', icon: '✅', type: 'parse', text: '供应商合同模板V5.pdf 解析完成，质量评分 96', time: '2分钟前', page: 'kb-documents', extra: { selectedKBId: 'kb-001' } },
  { id: 'a2', icon: '📊', type: 'eval', text: '6月Faithfulness评测完成，综合得分 0.92', time: '1小时前', page: 'eval-dashboard' },
  { id: 'a3', icon: '⬆️', type: 'upload', text: '王芳 上传了 采购协议条款.docx', time: '2小时前', page: 'kb-documents', extra: { selectedKBId: 'kb-001' } },
  { id: 'a4', icon: '⚙️', type: 'index', text: 'PageIndex 流水线进度更新至 54.5%', time: '3小时前', page: 'pageindex-hub' },
  { id: 'a5', icon: '🔍', type: 'graph', text: 'GraphRAG 实体复核队列新增 12 条', time: '4小时前', page: 'graphrag-hub' },
  { id: 'a6', icon: '👤', type: 'admin', text: '李婷 创建了新用户 孙立', time: '今天 08:30', page: 'sys-users' },
  { id: 'a7', icon: '⚠️', type: 'alert', text: 'PageIndex 失败任务达 8 条，需人工处理', time: '今天 09:15', page: 'pageindex-hub' },
  { id: 'a8', icon: '💬', type: 'chat', text: '新对话「合同违约条款查询」已创建', time: '今天 10:02', page: 'chat' },
];

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  all: '全部',
  parse: '解析',
  upload: '上传',
  index: '索引',
  eval: '评测',
  graph: '图谱',
  chat: '对话',
  admin: '管理',
  alert: '告警',
};

export const HOME_SECTIONS = ['概览', '运营分析', '我的知识库', '平台动态'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/** 平台运营统计（工作台首屏，随 period 切换查询类指标） */
export function getPlatformStats(period: '7d' | '30d', kbCount: number, activeKb: number, totalDocs: number, totalChunks: number, totalStorage: string) {
  return [
    { label: '知识库', value: String(kbCount), sub: `${activeKb} 活跃`, icon: 'Database', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '文档总数', value: totalDocs.toLocaleString(), sub: '全平台', icon: 'FileText', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Chunk 总数', value: (totalChunks / 1000).toFixed(1) + 'k', sub: '已向量化', icon: 'Cpu', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: '存储总量', value: totalStorage, sub: '含原始文件', icon: 'HardDrive', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
    { label: period === '7d' ? '7 日查询' : '本月查询', value: period === '7d' ? '12,400' : '45,200', sub: period === '7d' ? '较上周 +12%' : '较上月 +18%', icon: 'TrendingUp', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: '命中率', value: '94.2%', sub: '7 天均值', icon: 'Target', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Faithfulness', value: '0.92', sub: '最新评测', icon: 'BarChart2', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: '平均延迟', value: '1.8s', sub: 'P95 2.4s', icon: 'Clock', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: '错误率', value: '0.3%', sub: '近 24h', icon: 'AlertCircle', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: '活跃对话', value: '128', sub: '本周', icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ] as const;
}

/** RAG 3.0 增强索引统计（Wiki / PageIndex / 图谱） */
export const RAG3_INDEX_STATS = [
  { label: 'Wiki 已发布', value: String(WIKI_STATS.published), sub: `共 ${WIKI_STATS.total} 页`, icon: 'BookOpen', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', page: 'wiki-hub' },
  { label: 'Wiki 编译中', value: String(WIKI_STATS.compiling), sub: `${WIKI_STATS.reviewing} 待审核`, icon: 'Loader', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', page: 'wiki-hub' },
  { label: 'Wiki 引用率', value: `${WIKI_STATS.avgCiteRate}%`, sub: `浏览 ${WIKI_STATS.totalViews}`, icon: 'Sparkles', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', page: 'wiki-hub' },
  { label: 'PI 已建树', value: String(PAGEINDEX_STATS.completed), sub: `共 ${PAGEINDEX_STATS.total} 文档`, icon: 'GitBranch', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', page: 'pageindex-hub' },
  { label: 'PI 建树中', value: String(PAGEINDEX_STATS.building), sub: `进度 ${PAGEINDEX_STATS.buildRate}%`, icon: 'Network', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', page: 'pageindex-hub' },
  { label: 'PI 失败', value: String(PAGEINDEX_GLOBAL_FAILED_COUNT), sub: `${PAGEINDEX_STATS.pending} 待处理`, icon: 'AlertCircle', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', page: 'pageindex-hub' },
  { label: '图谱实体', value: '2.4k', sub: '86 待复核', icon: 'BarChart2', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', page: 'graphrag-hub' },
  { label: '增强检索命中', value: '96.1%', sub: 'Wiki+PI 融合', icon: 'Target', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', page: 'eval-dashboard' },
] as const;

export const QUICK_ACTION_PAGES = [
  { icon: 'MessageSquare', label: '新建对话', desc: 'RAG 问答', page: 'chat', color: 'from-blue-500 to-blue-600' },
  { icon: 'Search', label: '新建搜索', desc: '搜索应用', page: 'search', color: 'from-purple-500 to-purple-600' },
  { icon: 'GitBranch', label: '新建 Agent', desc: '工作流', page: 'agent', color: 'from-orange-500 to-orange-600' },
  { icon: 'BarChart2', label: '新建评测', desc: '质量回归', page: 'eval-tasks', color: 'from-green-500 to-green-600' },
  { icon: 'Upload', label: '上传文档', desc: '批量导入', page: 'kb-documents', color: 'from-cyan-500 to-cyan-600', extra: { selectedKBId: 'kb-001' } },
  { icon: 'FlaskConical', label: '检索测试', desc: '多通道', page: 'kb-retrieval-test', color: 'from-indigo-500 to-indigo-600', extra: { selectedKBId: 'kb-001' } },
] as const;
