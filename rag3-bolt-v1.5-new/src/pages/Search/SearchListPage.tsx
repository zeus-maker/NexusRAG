import React, { useState } from 'react';
import { Plus, Search, Sparkles, ArrowRight, Play, Settings, BarChart3, Clock } from 'lucide-react';

interface SearchListPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const mockSearchApps = [
  { id: '1', name: '合同条款快速检索', kb: '法务合同库', updated: '6/6', queries: '2.4K/月', avgTime: '180ms', status: 'active' },
  { id: '2', name: '财报指标查询', kb: '财务报告库', updated: '6/5', queries: '890/月', avgTime: '220ms', status: 'active' },
  { id: '3', name: '合规政策搜索', kb: '合规政策库', updated: '6/1', queries: '1.2K/月', avgTime: '195ms', status: 'active' },
];

export default function SearchListPage({ onNavigate }: SearchListPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">搜索应用</h1>
          <p className="text-white/40 text-sm mt-1">配置和管理搜索应用</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="neon-button-primary flex items-center gap-2">
          <Plus size={18} /> 新建搜索应用
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mockSearchApps.map((app) => (
          <div key={app.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/15">
                <Search size={20} className="text-amber-400/70" />
              </div>
              <span className="neon-badge-active text-[10px]">
                <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 活跃
              </span>
            </div>

            <h3 className="text-sm font-semibold text-white/90 mb-2">{app.name}</h3>
            <p className="text-xs text-white/40 mb-4">关联: {app.kb}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] text-white/25 mb-0.5">查询量</p>
                <p className="text-sm font-bold text-white/70">{app.queries}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 mb-0.5">平均耗时</p>
                <p className="text-sm font-bold text-white/70">{app.avgTime}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('search', app.id)}
                className="neon-button flex-1 flex items-center justify-center gap-1.5 text-xs"
              >
                <Play size={14} /> 打开
              </button>
              <button onClick={() => alert('搜索应用设置（模拟）')} className="neon-button-ghost p-2">
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-xl p-6 max-w-lg w-full mx-4 animate-scale-in shadow-glass border-white/10">
            <h2 className="text-xl font-bold text-white mb-5">新建搜索应用</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/50 mb-2">应用名称 *</label>
                <input type="text" value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="输入搜索应用名称" className="glass-input" />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">关联知识库</label>
                <select className="glass-select">
                  <option>法务合同库</option>
                  <option>财务报告库</option>
                  <option>合规政策库</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateModal(false); setNewAppName(''); }} className="neon-button-ghost flex-1">取消</button>
              <button onClick={() => { setShowCreateModal(false); setNewAppName(''); }} className="neon-button-primary flex-1">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
