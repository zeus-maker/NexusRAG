import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Database, FileText, HardDrive, Star, ArrowRight, Filter, Grid3X3, List } from 'lucide-react';

interface KBListPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const mockKBs = [
  { id: '1', name: '法务合同知识库', docs: 156, chunks: 12840, storage: '500MB', quality: 92.5, status: 'active', updated: '2小时前', lang: '中文', strategy: '法律分块' },
  { id: '2', name: '财务报告知识库', docs: 89, chunks: 6230, storage: '280MB', quality: 88.2, status: 'indexing', updated: '5分钟前', lang: '中文', strategy: '论文分块' },
  { id: '3', name: '研发文档知识库', docs: 234, chunks: 18500, storage: '750MB', quality: 91.3, status: 'active', updated: '1天前', lang: '英文', strategy: '通用分块' },
  { id: '4', name: '合规政策知识库', docs: 45, chunks: 3200, storage: '120MB', quality: 85.7, status: 'active', updated: '3天前', lang: '中文', strategy: '法律分块' },
  { id: '5', name: '产品手册知识库', docs: 78, chunks: 5400, storage: '210MB', quality: 90.1, status: 'active', updated: '5天前', lang: '中英', strategy: '通用分块' },
  { id: '6', name: '技术规范知识库', docs: 112, chunks: 8900, storage: '380MB', quality: 87.4, status: 'error', updated: '1周前', lang: '英文', strategy: '论文分块' },
];

export default function KBListPage({ onNavigate }: KBListPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKBName, setNewKBName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部状态');

  const filteredKBs = mockKBs.filter(kb => {
    const matchesSearch = kb.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '全部状态' || (statusFilter === '活跃' && kb.status === 'active') || (statusFilter === '索引中' && kb.status === 'indexing') || (statusFilter === '错误' && kb.status === 'error');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">知识库管理</h1>
          <p className="text-white/40 text-sm mt-1">管理和配置企业知识库</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="neon-button-primary flex items-center gap-2">
          <Plus size={18} />
          创建知识库
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-white/25" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索知识库..."
            className="glass-input pl-9"
          />
        </div>
        <select className="glass-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>全部状态</option>
          <option>活跃</option>
          <option>索引中</option>
          <option>错误</option>
        </select>
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

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filteredKBs.map((kb) => (
            <div
              key={kb.id}
              onClick={() => onNavigate('kb-detail', kb.id)}
              className="glass-card p-5 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-white/10 group-hover:border-neon-cyan/30 transition-colors">
                  <Database size={20} className="text-neon-cyan/70" />
                </div>
                <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white/60 transition-colors" onClick={e => e.stopPropagation()}>
                  <MoreVertical size={16} />
                </button>
              </div>

              <h3 className="text-sm font-semibold text-white/90 group-hover:text-white mb-3 transition-colors">{kb.name}</h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-white/30 mb-0.5">文档</p>
                  <p className="text-base font-bold text-white/80">{kb.docs}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-0.5">知识块</p>
                  <p className="text-base font-bold text-white/80">{kb.chunks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-0.5">存储</p>
                  <p className="text-base font-bold text-white/80">{kb.storage}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-0.5">质量</p>
                  <p className="text-base font-bold text-white/80">{kb.quality}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={kb.status === 'active' ? 'neon-badge-active' : kb.status === 'indexing' ? 'neon-badge-indexing' : 'neon-badge-error'}>
                  <div className={kb.status === 'active' ? 'glow-dot-green' : kb.status === 'indexing' ? 'glow-dot-yellow' : 'glow-dot-red'} style={{ width: 6, height: 6 }} />
                  {kb.status === 'active' ? '活跃' : kb.status === 'indexing' ? '索引中' : '错误'}
                </span>
                <span className="text-xs text-white/25">{kb.updated}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="glass-card overflow-hidden !rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">名称</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">文档</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">知识块</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">存储</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">质量</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredKBs.map((kb) => (
                <tr key={kb.id} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => onNavigate('kb-detail', kb.id)}>
                  <td className="px-5 py-3 text-sm text-white/80">{kb.name}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{kb.docs}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{kb.chunks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{kb.storage}</td>
                  <td className="px-5 py-3 text-sm text-white/50">{kb.quality}%</td>
                  <td className="px-5 py-3">
                    <span className={kb.status === 'active' ? 'neon-badge-active' : kb.status === 'indexing' ? 'neon-badge-indexing' : 'neon-badge-error'}>
                      {kb.status === 'active' ? '活跃' : kb.status === 'indexing' ? '索引中' : '错误'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-neon-cyan/60 hover:text-neon-cyan transition-colors text-sm flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      详情 <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel rounded-xl p-6 max-w-lg w-full mx-4 animate-scale-in shadow-glass border-white/10">
            <h2 className="text-xl font-bold text-white mb-5">创建知识库</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/50 mb-2">知识库名称 *</label>
                <input
                  type="text"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  placeholder="输入知识库名称"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">描述</label>
                <textarea
                  placeholder="输入描述（选填）"
                  rows={3}
                  className="glass-input resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">默认语言</label>
                  <select className="glass-select">
                    <option>中文</option>
                    <option>英文</option>
                    <option>中英混合</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">分块策略</label>
                  <select className="glass-select">
                    <option>通用分块</option>
                    <option>论文分块</option>
                    <option>法律分块</option>
                    <option>手册分块</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">嵌入模型</label>
                <select className="glass-select">
                  <option>BGE-M3 (推荐)</option>
                  <option>text-embedding-3-large</option>
                  <option>m3e-large</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="neon-button-ghost flex-1">
                取消
              </button>
              <button
                onClick={() => { setShowCreateModal(false); setNewKBName(''); }}
                className="neon-button-primary flex-1"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
