import React, { useState } from 'react';
import { GitBranch, FileText, CheckCircle, AlertCircle, ChevronRight, ChevronDown, ArrowLeft, Search, Eye, BarChart3, RefreshCw, Folder, FolderOpen } from 'lucide-react';

interface PageIndexHubPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const tabs = ['概览', '文档列表', '单文档树'];

const mockDocuments = [
  { id: '1', name: '合同模板V5.pdf', treeStatus: 'completed', nodes: 86, depth: 4, updated: '2小时前' },
  { id: '2', name: '采购协议条款.pdf', treeStatus: 'completed', nodes: 64, depth: 3, updated: '1天前' },
  { id: '3', name: '保密协议合集.pdf', treeStatus: 'building', nodes: 32, depth: 2, updated: '刚刚' },
  { id: '4', name: '供应商管理规范.docx', treeStatus: 'failed', nodes: 0, depth: 0, updated: '3天前' },
  { id: '5', name: '财务报告Q3.xlsx', treeStatus: 'completed', nodes: 45, depth: 3, updated: '5天前' },
];

// Mock tree structure
const mockTree = {
  title: '合同模板V5.pdf',
  children: [
    {
      title: '1. 总则',
      children: [
        { title: '1.1 适用范围', children: [] },
        { title: '1.2 定义与解释', children: [
          { title: '1.2.1 供应商定义', children: [] },
          { title: '1.2.2 违约定义', children: [] },
        ] },
      ],
    },
    {
      title: '2. 权利义务',
      children: [
        { title: '2.1 供应商义务', children: [] },
        { title: '2.2 采购方权利', children: [] },
      ],
    },
    {
      title: '5. 违约责任',
      children: [
        { title: '5.1 迟延交货', children: [
          { title: '5.1.1 违约金计算', children: [] },
          { title: '5.1.2 解除合同条件', children: [] },
        ] },
        { title: '5.2 质量违约', children: [] },
      ],
    },
  ],
};

function TreeNode({ node, depth = 0 }: { node: { title: string; children: Array<{ title: string; children: never[] }> }; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <ChevronDown size={14} className={`text-white/20 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        ) : (
          <div className="w-3.5" />
        )}
        {hasChildren ? (
          expanded ? <FolderOpen size={14} className="text-cyan-400/50" /> : <Folder size={14} className="text-cyan-400/30" />
        ) : (
          <FileText size={14} className="text-white/20 group-hover:text-neon-cyan/40 transition-colors" />
        )}
        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{node.title}</span>
      </div>
      {expanded && hasChildren && (
        <div className="animate-slide-up">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageIndexHubPage({ onNavigate }: PageIndexHubPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="glass-panel border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('kb-detail', '1')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <GitBranch size={20} className="text-cyan-400/70" /> PageIndex Hub
              </h1>
              <span className="neon-badge-active text-[10px]">
                <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 85/156 已建树
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">文档树索引管理 · 建树率 54.5%</p>
          </div>
          <button onClick={() => alert('重建失败项任务已提交（模拟）')} className="neon-button flex items-center gap-2">
            <RefreshCw size={16} /> 重建失败项
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel border-b border-white/5 px-6">
        <div className="flex gap-6">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-1 py-3.5 text-sm transition-all duration-200 ${activeTab === idx ? 'tab-active' : 'tab-inactive'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <DocumentsTab />}
        {activeTab === 2 && <TreeTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '已建树', value: '85', icon: CheckCircle, color: '#10b981' },
          { label: '建树中', value: '12', icon: RefreshCw, color: '#f59e0b' },
          { label: '失败', value: '12', icon: AlertCircle, color: '#ef4444' },
          { label: '总节点数', value: '6.8K', icon: GitBranch, color: '#06b6d4' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-5">
              <Icon size={18} style={{ color: stat.color, opacity: 0.6 }} className="mb-3" />
              <div className="stat-value mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">建树进度</h3>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden progress-bar-glow mb-2">
          <div className="h-full rounded-full" style={{ width: '54.5%', background: 'linear-gradient(90deg, #06b6d4, #10b981)', boxShadow: '0 0 12px rgba(6,182,212,0.3)' }} />
        </div>
        <div className="flex justify-between text-xs text-white/30">
          <span>85/156 文档已完成</span>
          <span>54.5%</span>
        </div>
      </div>

      {/* Failure Reasons */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400/60" /> 失败原因分布
        </h3>
        <div className="space-y-2">
          {[
            { reason: 'PDF 扫描件无法解析', count: 5, color: '#ef4444' },
            { reason: '表格结构提取失败', count: 4, color: '#f59e0b' },
            { reason: '页面为空/无内容', count: 2, color: '#8b5cf6' },
            { reason: '编码格式异常', count: 1, color: '#06b6d4' },
          ].map((item) => (
            <div key={item.reason} className="flex items-center gap-3">
              <div className="flex-1 text-xs text-white/50">{item.reason}</div>
              <span className="text-xs text-white/30 w-8 text-right">{item.count}</span>
              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(item.count / 5) * 100}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-white/25" size={16} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索文档..." className="glass-input pl-9" />
      </div>

      <div className="space-y-2">
        {mockDocuments.map((doc) => (
          <div key={doc.id} className="glass-card p-4 !rounded-xl cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-white/20 group-hover:text-cyan-400/50 transition-colors" />
                <div>
                  <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{doc.name}</h3>
                  <p className="text-xs text-white/30">{doc.nodes > 0 ? `${doc.nodes} 节点 · 深度 ${doc.depth}` : '未建树'} · {doc.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={
                  doc.treeStatus === 'completed' ? 'neon-badge-active text-[10px]' :
                  doc.treeStatus === 'building' ? 'neon-badge-indexing text-[10px]' :
                  'neon-badge-error text-[10px]'
                }>
                  {doc.treeStatus === 'completed' ? '已建树' : doc.treeStatus === 'building' ? '建树中' : '失败'}
                </span>
                <ChevronRight size={14} className="text-white/10 group-hover:text-white/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeTab() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Tree View */}
      <div className="col-span-3 glass-card p-4 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <GitBranch size={16} className="text-neon-cyan/60" /> 文档树结构
        </h3>
        <div className="border border-white/5 rounded-lg p-2">
          <TreeNode node={mockTree} />
        </div>
      </div>

      {/* Detail Panel */}
      <div className="col-span-2 glass-card p-4 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">节点详情</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/30 mb-1">当前选中</p>
            <p className="text-sm text-white/70">5.1.1 违约金计算</p>
          </div>
          <div>
            <p className="text-xs text-white/30 mb-1">层级深度</p>
            <p className="text-sm text-white/70">3</p>
          </div>
          <div>
            <p className="text-xs text-white/30 mb-1">关联块数</p>
            <p className="text-sm text-white/70">24</p>
          </div>
          <div>
            <p className="text-xs text-white/30 mb-1">内容预览</p>
            <p className="text-xs text-white/50 leading-relaxed">供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金...</p>
          </div>
          <button onClick={() => alert('完整内容查看（模拟）')} className="neon-button w-full text-xs flex items-center justify-center gap-1">
            <Eye size={12} /> 查看完整内容
          </button>
        </div>
      </div>
    </div>
  );
}
