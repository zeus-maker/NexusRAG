import React, { useState } from 'react';
import { Plus, Play, Zap, ArrowRight, Settings, Clock, CheckCircle, Circle, AlertCircle, GitBranch, Workflow, Search, Grid3X3, List } from 'lucide-react';

interface AgentListPageProps {
  onNavigate?: (page: string, id?: string) => void;
}

const mockAgents = [
  { id: '1', name: '合同审查 Agent', type: 'Pipeline', updated: '6/6 10:00', status: 'active', runs: 342, success: 98.2 },
  { id: '2', name: '财报分析 Agent', type: 'Agent', updated: '6/5 16:30', status: 'draft', runs: 0, success: 0 },
  { id: '3', name: '合规检查 Pipeline', type: 'Pipeline', updated: '6/4 09:15', status: 'active', runs: 156, success: 95.5 },
  { id: '4', name: '文档分类 Agent', type: 'Agent', updated: '6/3 14:00', status: 'error', runs: 89, success: 82.1 },
];

export default function AgentListPage({ onNavigate }: AgentListPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const filtered = mockAgents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent & Pipeline</h1>
          <p className="text-white/40 text-sm mt-1">自动化工作流和智能代理</p>
        </div>
        <button className="neon-button-primary flex items-center gap-2">
          <Plus size={18} /> 新建 Agent
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '活跃 Agent', value: '2', icon: Zap, color: '#10b981' },
          { label: 'Pipeline', value: '2', icon: GitBranch, color: '#06b6d4' },
          { label: '总运行次数', value: '587', icon: Play, color: '#f59e0b' },
          { label: '平均成功率', value: '96.8%', icon: CheckCircle, color: '#8b5cf6' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color: stat.color, opacity: 0.6 }} />
                <div>
                  <div className="text-lg font-bold text-white/80">{stat.value}</div>
                  <div className="text-[10px] text-white/30">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + View toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-white/25" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Agent..."
            className="glass-input pl-9"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto glass-panel rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-neon-cyan' : 'text-white/30 hover:text-white/60'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-neon-cyan' : 'text-white/30 hover:text-white/60'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((agent) => (
            <div key={agent.id} className="glass-card p-5 cursor-pointer group" onClick={() => onNavigate?.('agent-detail', agent.id)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    agent.type === 'Pipeline'
                      ? 'bg-cyan-500/10 border-cyan-500/20'
                      : 'bg-violet-500/10 border-violet-500/20'
                  }`}>
                    {agent.type === 'Pipeline' ? <GitBranch size={18} className="text-cyan-400/70" /> : <Zap size={18} className="text-violet-400/70" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{agent.name}</h3>
                    <p className="text-xs text-white/30">{agent.type}</p>
                  </div>
                </div>
                <span className={agent.status === 'active' ? 'neon-badge-active' : agent.status === 'draft' ? 'neon-badge-draft' : 'neon-badge-error'}>
                  {agent.status === 'active' ? '活跃' : agent.status === 'draft' ? '草稿' : '错误'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-white/25">运行次数</p>
                  <p className="text-sm font-bold text-white/70">{agent.runs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/25">成功率</p>
                  <p className="text-sm font-bold text-white/70">{agent.success > 0 ? `${agent.success}%` : '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/20 flex items-center gap-1">
                  <Clock size={12} /> {agent.updated}
                </span>
                <div className="flex gap-2">
                  {agent.status === 'active' && (
                    <button className="neon-button text-xs flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Play size={12} /> 运行
                    </button>
                  )}
                  <button className="neon-button-ghost p-1.5" onClick={e => e.stopPropagation()}>
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden !rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">名称</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">类型</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">最近运行</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">运行次数</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.id} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer" onClick={() => onNavigate?.('agent-detail', agent.id)}>
                  <td className="px-5 py-3 text-sm text-white/80">{agent.name}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{agent.type}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{agent.updated}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{agent.runs}</td>
                  <td className="px-5 py-3">
                    <span className={agent.status === 'active' ? 'neon-badge-active' : agent.status === 'draft' ? 'neon-badge-draft' : 'neon-badge-error'}>
                      {agent.status === 'active' ? '活跃' : agent.status === 'draft' ? '草稿' : '错误'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-neon-cyan/60 hover:text-neon-cyan flex items-center gap-1 text-sm" onClick={e => e.stopPropagation()}>
                      详情 <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
