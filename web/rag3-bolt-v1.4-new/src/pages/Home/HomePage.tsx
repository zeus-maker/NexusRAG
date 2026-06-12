import React from 'react';
import { Database, MessageCircle, Search, Zap, TrendingUp, FileText, Activity, ArrowRight, Sparkles, Cpu, Network, BarChart3 } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, id?: string) => void;
}

const kbs = [
  { id: '1', name: '法务合同', docs: 156, chunks: '12.8K', status: 'active', quality: 92.5 },
  { id: '2', name: '财务报告', docs: 89, chunks: '6.2K', status: 'indexing', quality: 88.2 },
  { id: '3', name: '研发文档', docs: 234, chunks: '18.5K', status: 'active', quality: 91.3 },
  { id: '4', name: '合规政策', docs: 45, chunks: '3.2K', status: 'active', quality: 85.7 },
];

const quickActions = [
  { id: 'kb-list', label: '新建知识库', icon: Database, color: 'from-cyan-500 to-blue-600', glow: 'neon-cyan' },
  { id: 'chat', label: '开启对话', icon: MessageCircle, color: 'from-emerald-500 to-teal-600', glow: 'neon-green' },
  { id: 'search-list', label: '搜索应用', icon: Search, color: 'from-amber-500 to-orange-600', glow: 'neon-orange' },
  { id: 'agent-list', label: '创建 Agent', icon: Zap, color: 'from-rose-500 to-pink-600', glow: 'neon-orange' },
];

const stats = [
  { label: '总文档数', value: '12,486', icon: FileText, trend: '+326', trendUp: true },
  { label: '知识块', value: '1.86M', icon: Database, trend: '+42K', trendUp: true },
  { label: '本月查询', value: '45.2K', icon: Activity, trend: '+8.1K', trendUp: true },
  { label: '命中率', value: '94.2%', icon: TrendingUp, trend: '+1.3%', trendUp: true },
];

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            欢迎回来，<span className="text-neon-cyan">李婷</span>
          </h1>
          <p className="text-white/40 text-sm">AI 驱动的企业级知识库系统 · RAG 3.0</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="neon-badge-active">
            <div className="glow-dot-green" /> 系统运行中
          </span>
          <span className="neon-badge-indexing">
            <Cpu size={12} /> 3 任务执行中
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="glass-card p-5 text-left group relative overflow-hidden"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                   style={{ boxShadow: `0 0 20px rgba(0,0,0,0.3)` }}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{action.label}</div>
              <div className="text-xs text-white/30 mt-1">点击创建</div>
              <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all duration-300" />
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className="text-white/20 group-hover:text-neon-cyan/60 transition-colors duration-300" />
                <span className="text-xs text-emerald-400/80 font-medium">
                  {stat.trendUp ? '+' : ''}{stat.trend}
                </span>
              </div>
              <div className="stat-value mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* System Status + Recent KBs */}
      <div className="grid grid-cols-3 gap-4">
        {/* System Health */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-neon-cyan" /> 系统健康
          </h3>
          <div className="space-y-3">
            {[
              { label: '向量引擎', value: 99.8, color: '#10b981' },
              { label: 'LLM 服务', value: 97.2, color: '#06b6d4' },
              { label: '索引队列', value: 85.5, color: '#f59e0b' },
              { label: '缓存命中率', value: 92.1, color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">{item.label}</span>
                  <span className="text-white/70">{item.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-bar-glow transition-all duration-1000"
                       style={{ width: `${item.value}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent KBs */}
        <div className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Database size={16} className="text-neon-cyan" /> 最近知识库
            </h3>
            <button onClick={() => onNavigate('kb-list')} className="text-xs text-neon-cyan/60 hover:text-neon-cyan transition-colors flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kbs.map((kb) => (
              <div
                key={kb.id}
                onClick={() => onNavigate('kb-detail', kb.id)}
                className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-neon-cyan/20 hover:bg-white/[0.04] cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-white/10">
                    <Database size={16} className="text-neon-cyan/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{kb.name}</div>
                    <div className="text-xs text-white/30">{kb.docs} 文档 · {kb.chunks} 块</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={kb.status === 'active' ? 'neon-badge-active' : 'neon-badge-indexing'}>
                    <div className={kb.status === 'active' ? 'glow-dot-green' : 'glow-dot-yellow'} style={{ width: 6, height: 6 }} />
                    {kb.status === 'active' ? '活跃' : '索引中'}
                  </span>
                  <span className="text-xs text-white/30">质量 {kb.quality}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Hubs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: 'wiki-hub', label: 'Wiki Hub', desc: 'LLM Wiki 知识库管理', icon: Sparkles, color: 'from-violet-500/20 to-purple-600/20', border: 'border-violet-500/20 hover:border-violet-500/40' },
          { id: 'pageindex-hub', label: 'PageIndex Hub', desc: '文档树索引管理', icon: Network, color: 'from-cyan-500/20 to-teal-600/20', border: 'border-cyan-500/20 hover:border-cyan-500/40' },
          { id: 'graphrag-hub', label: 'GraphRAG Hub', desc: '知识图谱可视化', icon: BarChart3, color: 'from-amber-500/20 to-orange-600/20', border: 'border-amber-500/20 hover:border-amber-500/40' },
        ].map((hub) => {
          const Icon = hub.icon;
          return (
            <button
              key={hub.id}
              onClick={() => onNavigate(hub.id)}
              className={`p-5 rounded-lg bg-gradient-to-br ${hub.color} border ${hub.border} text-left transition-all duration-300 group hover:shadow-glass`}
            >
              <Icon size={24} className="text-white/40 group-hover:text-white/70 transition-colors mb-3" />
              <div className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{hub.label}</div>
              <div className="text-xs text-white/30 mt-1">{hub.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
