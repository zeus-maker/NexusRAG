import { useState } from 'react';
import {
  Plus, MessageSquare, Search, GitBranch, BarChart2,
  FileText, TrendingUp, Clock, ArrowRight, Zap, Database,
  Activity, CheckCircle, Loader, BookOpen, Network
} from 'lucide-react';
import { mockKBs, mockConversations } from '../mockData';

interface HomePageProps {
  onNavigate: (page: string, extra?: any) => void;
  currentUser: { name: string; role: string } | null;
}

export function HomePage({ onNavigate, currentUser }: HomePageProps) {
  const totalDocs = mockKBs.reduce((s, k) => s + k.doc_count, 0);
  const totalChunks = mockKBs.reduce((s, k) => s + k.chunk_count, 0);

  const quickActions = [
    { icon: <MessageSquare size={16} />, label: '新建对话', page: 'chat', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { icon: <Search size={16} />, label: '新建搜索', page: 'search', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { icon: <GitBranch size={16} />, label: '新建 Agent', page: 'agent', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
    { icon: <BarChart2 size={16} />, label: '新建评测', page: 'eval-tasks', color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  ];

  const systemHealth = [
    { label: 'Faithfulness', value: '0.92', trend: '+0.03', good: true },
    { label: '平均延迟', value: '1.8s', trend: '-0.2s', good: true },
    { label: '命中率', value: '94.2%', trend: '+1.2%', good: true },
    { label: '错误率', value: '0.3%', trend: '稳定', good: true },
  ];

  const recentActivities = [
    { icon: '✅', text: '供应商合同模板V5.pdf 解析完成，质量评分 96', time: '2分钟前', color: 'text-green-600' },
    { icon: '📊', text: '6月Faithfulness评测完成，综合得分 0.92', time: '1小时前', color: 'text-blue-600' },
    { icon: '⬆️', text: '王芳 上传了 采购协议条款.docx', time: '2小时前', color: 'text-gray-600' },
    { icon: '⚙️', text: 'PageIndex 流水线进度更新至 54.5%', time: '3小时前', color: 'text-orange-600' },
    { icon: '👤', text: '李婷 创建了新用户 孙立', time: '今天 08:30', color: 'text-gray-600' },
  ];

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Welcome header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            欢迎回来，{currentUser?.name || '用户'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date('2026-06-06').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('kb-list')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus size={16} /> 创建知识库
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '文档总数', value: totalDocs.toLocaleString(), icon: <FileText size={16} className="text-blue-500" />, bg: 'bg-blue-50', sub: '跨所有知识库' },
          { label: 'Chunk 总数', value: (totalChunks / 1000).toFixed(1) + 'k', icon: <Database size={16} className="text-purple-500" />, bg: 'bg-purple-50', sub: '已向量化' },
          { label: '本月查询', value: '45,200', icon: <TrendingUp size={16} className="text-green-500" />, bg: 'bg-green-50', sub: '较上月 +18%' },
          { label: '命中率', value: '94.2%', icon: <Activity size={16} className="text-orange-500" />, bg: 'bg-orange-50', sub: '7天均值' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`${s.bg} p-2 rounded-lg`}>{s.icon}</div>
            </div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent KBs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">最近知识库</h3>
              <button onClick={() => onNavigate('kb-list')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                查看全部 <ArrowRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mockKBs.slice(0, 5).map(kb => (
                <button
                  key={kb.kb_id}
                  onClick={() => onNavigate('kb-detail', { selectedKBId: kb.kb_id })}
                  className="flex items-center gap-2.5 p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
                >
                  <span className="text-xl flex-shrink-0">{kb.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{kb.name}</div>
                    <div className="text-[10px] text-gray-400">{kb.doc_count} 文档</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => onNavigate('kb-list')}
                className="flex items-center justify-center gap-1.5 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all"
              >
                <Plus size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">更多</span>
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">应用快捷入口</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(a.page as any)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${a.color}`}
                >
                  <div className="w-8 h-8 bg-white/60 rounded-lg flex items-center justify-center">{a.icon}</div>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System health */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">系统健康度</h3>
              <button onClick={() => onNavigate('sys-monitor')} className="text-xs text-blue-600 hover:underline">详情</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {systemHealth.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{m.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                  <div className={`text-[10px] mt-1 font-medium ${m.good ? 'text-green-600' : 'text-red-600'}`}>{m.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Recent conversations */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">最近对话</h3>
              <button onClick={() => onNavigate('chat')} className="text-xs text-blue-600 hover:underline">查看全部</button>
            </div>
            <div className="space-y-2">
              {mockConversations.slice(0, 4).map(conv => (
                <button
                  key={conv.conv_id}
                  onClick={() => onNavigate('chat', { selectedConvId: conv.conv_id })}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{conv.title}</div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">{conv.last_message}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">最近动态</h3>
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-sm flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={9} />{a.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eval summary */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-blue-200" />
              <span className="text-sm font-semibold">最新评测</span>
            </div>
            <div className="text-xs text-blue-200 mb-3">6月Faithfulness回归评测</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Faithfulness', v: '0.92', good: true },
                { l: 'Hallucination', v: '0.04', good: true },
              ].map((m, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{m.v}</div>
                  <div className="text-[10px] text-blue-200">{m.l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('eval-dashboard')} className="mt-3 w-full text-xs text-blue-200 hover:text-white text-center hover:underline">
              查看完整报告 →
            </button>
          </div>
        </div>
      </div>

      {/* RAG 3.0 Hub 快捷入口 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">RAG 3.0 增强层</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { id: 'wiki-hub', label: 'Wiki Hub', desc: 'LLM Wiki 知识库管理', icon: BookOpen, color: 'text-violet-500', hover: 'hover:border-violet-300' },
            { id: 'pageindex-hub', label: 'PageIndex Hub', desc: '文档树索引管理', icon: Network, color: 'text-cyan-600', hover: 'hover:border-cyan-300' },
            { id: 'graphrag-hub', label: 'GraphRAG Hub', desc: '知识图谱可视化', icon: BarChart2, color: 'text-amber-600', hover: 'hover:border-amber-300' },
          ] as const).map(hub => {
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                onClick={() => onNavigate(hub.id)}
                className={`bg-white rounded-xl border border-gray-200 p-5 text-left transition-all group hover:shadow-md ${hub.hover}`}
              >
                <Icon size={22} className={`${hub.color} mb-3 opacity-80`} />
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{hub.label}</div>
                <div className="text-xs text-gray-500 mt-1">{hub.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
