import React, { useState } from 'react';
import { Network, CheckCircle, AlertCircle, ChevronRight, ArrowLeft, Search, Eye, BarChart3, RefreshCw, Users, GitBranch, Settings, Layers, X, Zap } from 'lucide-react';

interface GraphRAGHubPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const tabs = ['概览', '可视化', '社区摘要', '建索引队列', '实体复核', '设置'];

export default function GraphRAGHubPage({ onNavigate }: GraphRAGHubPageProps) {
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
                <Network size={20} className="text-amber-400/70" /> GraphRAG Hub
              </h1>
              <span className="neon-badge-active text-[10px]">
                <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 已构建
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">知识图谱可视化 · 24 社区 · 1.2K 实体</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel border-b border-white/5 px-6">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-1 py-3.5 text-sm transition-all duration-200 whitespace-nowrap ${activeTab === idx ? 'tab-active' : 'tab-inactive'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <VisualizationTab />}
        {activeTab === 2 && <CommunitySummaryTab />}
        {activeTab === 3 && <IndexQueueTab />}
        {activeTab === 4 && <EntityReviewTab />}
        {activeTab === 5 && <SettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '实体数', value: '1,247', icon: Network, color: '#f59e0b' },
          { label: '关系数', value: '3,891', icon: GitBranch, color: '#06b6d4' },
          { label: '社区数', value: '24', icon: Users, color: '#8b5cf6' },
          { label: '图直径', value: '8', icon: Layers, color: '#10b981' },
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

      {/* Top Entities */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">高频实体</h3>
        <div className="space-y-2">
          {[
            { name: '供应商', type: '角色', connections: 186, color: '#f59e0b' },
            { name: '违约金', type: '条款', connections: 142, color: '#06b6d4' },
            { name: '采购方', type: '角色', connections: 128, color: '#10b981' },
            { name: '合同解除', type: '事件', connections: 96, color: '#8b5cf6' },
            { name: '付款条件', type: '条款', connections: 84, color: '#ec4899' },
          ].map((entity) => (
            <div key={entity.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div className="w-2 h-2 rounded-full" style={{ background: entity.color, boxShadow: `0 0 8px ${entity.color}40` }} />
              <span className="text-sm text-white/70 flex-1">{entity.name}</span>
              <span className="text-xs text-white/30">{entity.type}</span>
              <span className="text-xs text-white/20">{entity.connections} 连接</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community Distribution */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">社区规模分布</h3>
        <div className="flex items-end gap-2 h-28">
          {[35, 52, 28, 86, 44, 67, 31, 58, 23, 41, 72, 39, 55, 48, 62, 33, 47, 29, 76, 51, 38, 44, 56, 41].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-sm transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${(val / 100) * 100}%`,
                  background: `linear-gradient(180deg, rgba(245,158,11,0.5), rgba(245,158,11,0.1))`,
                  minHeight: '2px',
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-white/15 mt-1">
          <span>C1</span>
          <span>C12</span>
          <span>C24</span>
        </div>
      </div>
    </div>
  );
}

const graphNodes = [
  { id: '1', label: '供应商', x: 50, y: 40, size: 24, color: '#f59e0b' },
  { id: '2', label: '采购方', x: 30, y: 25, size: 20, color: '#10b981' },
  { id: '3', label: '违约金', x: 65, y: 55, size: 18, color: '#06b6d4' },
  { id: '4', label: '合同解除', x: 45, y: 70, size: 16, color: '#8b5cf6' },
  { id: '5', label: '付款条件', x: 75, y: 30, size: 14, color: '#ec4899' },
  { id: '6', label: '迟延交货', x: 20, y: 60, size: 12, color: '#06b6d4' },
  { id: '7', label: '质量违约', x: 80, y: 65, size: 12, color: '#8b5cf6' },
];

const graphEdges = [
  { from: '1', to: '2' }, { from: '1', to: '3' }, { from: '2', to: '3' },
  { from: '1', to: '4' }, { from: '3', to: '4' }, { from: '2', to: '5' },
  { from: '1', to: '6' }, { from: '6', to: '3' }, { from: '1', to: '7' },
];

function VisualizationTab() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeNodeId = selectedNode || hoveredNode;

  const connectedNodeIds = activeNodeId
    ? new Set([
        activeNodeId,
        ...graphEdges
          .filter(e => e.from === activeNodeId || e.to === activeNodeId)
          .flatMap(e => [e.from, e.to]),
      ])
    : null;

  const isConnectedEdge = (from: string, to: string) => {
    if (!activeNodeId) return false;
    return (from === activeNodeId || to === activeNodeId);
  };

  const handleRelatedClick = (relatedId: string) => {
    setSelectedNode(relatedId);
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Graph Area */}
      <div className="col-span-3 glass-card p-4 !rounded-xl relative" style={{ minHeight: '400px' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
            <Network size={16} className="text-amber-400/60" /> 力导向图
          </h3>
          {selectedNode && (
            <button
              onClick={() => setSelectedNode(null)}
              className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={12} /> 清除选中
            </button>
          )}
        </div>

        {/* SVG Graph */}
        <div className="relative w-full bg-white/[0.01] rounded-lg border border-white/5 overflow-hidden" style={{ height: '340px' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            {/* Edges */}
            {graphEdges.map((edge, idx) => {
              const from = graphNodes.find(n => n.id === edge.from)!;
              const to = graphNodes.find(n => n.id === edge.to)!;
              const connected = isConnectedEdge(edge.from, edge.to);
              const dimmed = activeNodeId && !connected;
              return (
                <line
                  key={idx}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={connected ? '#06b6d4' : dimmed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={connected ? 0.25 : 0.15}
                  strokeOpacity={connected ? 0.8 : dimmed ? 0.3 : 1}
                  style={{ transition: 'stroke 0.2s, stroke-opacity 0.2s, stroke-width 0.2s' }}
                />
              );
            })}
            {/* Nodes */}
            {graphNodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              const isActive = isSelected || isHovered;
              const isDimmed = connectedNodeIds && !connectedNodeIds.has(node.id);
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  opacity={isDimmed ? 0.2 : 1}
                >
                  {/* Outer glow for selected/hovered */}
                  {isActive && (
                    <circle
                      cx={node.x} cy={node.y}
                      r={node.size / 5}
                      fill="transparent"
                      stroke={node.color}
                      strokeWidth="0.08"
                      strokeOpacity={0.4}
                      style={{ transition: 'all 0.3s' }}
                    />
                  )}
                  {/* Pulse ring for selected */}
                  {isSelected && (
                    <circle
                      cx={node.x} cy={node.y}
                      r={node.size / 4.5}
                      fill="transparent"
                      stroke={node.color}
                      strokeWidth="0.06"
                      strokeOpacity={0.2}
                      strokeDasharray="1 1.5"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={node.x} cy={node.y}
                    r={node.size / 8}
                    fill={node.color}
                    fillOpacity={isActive ? 0.8 : 0.4}
                    stroke={node.color}
                    strokeWidth={isActive ? 0.3 : 0.1}
                    strokeOpacity={isActive ? 0.9 : 0.5}
                    style={{ transition: 'fill-opacity 0.2s, stroke-width 0.2s, stroke-opacity 0.2s' }}
                  />
                  {/* Label */}
                  <text
                    x={node.x} y={node.y + node.size / 8 + 3}
                    textAnchor="middle"
                    fill={isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)'}
                    fontSize="2"
                    style={{ transition: 'fill 0.2s' }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="col-span-2 glass-card p-4 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">节点详情</h3>
        {selectedNode ? (
          <div className="space-y-3 animate-fade-in">
            {(() => {
              const node = graphNodes.find(n => n.id === selectedNode)!;
              const connections = graphEdges.filter(e => e.from === selectedNode || e.to === selectedNode);
              return (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: node.color, boxShadow: `0 0 8px ${node.color}40` }} />
                    <span className="text-base font-bold text-white">{node.label}</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1">类型</p>
                    <p className="text-sm text-white/60">核心实体</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1">连接数</p>
                    <p className="text-sm text-white/60">{connections.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1">关联实体</p>
                    <div className="space-y-1.5">
                      {connections.map((edge) => {
                        const relatedId = edge.from === selectedNode ? edge.to : edge.from;
                        const related = graphNodes.find(n => n.id === relatedId)!;
                        return (
                          <button
                            key={relatedId}
                            onClick={() => handleRelatedClick(relatedId)}
                            className="flex items-center gap-2 text-xs w-full text-left p-1.5 rounded-md hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="w-2 h-2 rounded-full" style={{ background: related.color }} />
                            <span className="text-white/50 group-hover:text-white/80 transition-colors">{related.label}</span>
                            <ChevronRight size={10} className="text-white/10 group-hover:text-white/30 ml-auto transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : hoveredNode ? (
          <div className="space-y-3 animate-fade-in">
            {(() => {
              const node = graphNodes.find(n => n.id === hoveredNode)!;
              const connectionCount = graphEdges.filter(e => e.from === hoveredNode || e.to === hoveredNode).length;
              return (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: node.color, boxShadow: `0 0 8px ${node.color}40` }} />
                    <span className="text-base font-bold text-white">{node.label}</span>
                  </div>
                  <p className="text-xs text-white/40">{connectionCount} 个关联实体</p>
                  <p className="text-xs text-white/25">点击节点查看完整详情</p>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <Network size={28} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">悬停预览 · 点击选中</p>
            <p className="text-xs text-white/20">选中节点将高亮关联路径</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunitySummaryTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const communities = [
    { id: '1', name: '违约责任', entities: 12, summary: '涉及供应商违约、违约金计算、合同解除条件等条款', detail: '包含违约金比例(0.3%-0.5%)、迟延交货违约金(千分之五/日)、合同解除条件(迟延超30日)等核心条款。', status: 'completed' },
    { id: '2', name: '付款条款', entities: 8, summary: '涵盖付款条件、付款周期、逾期利息计算等内容', detail: '涵盖付款周期(月结60天)、逾期利息(年化8%)、付款方式(银行转账/承兑汇票)等。', status: 'completed' },
    { id: '3', name: '供应商管理', entities: 15, summary: '供应商评级、准入标准、考核机制相关条款', detail: '供应商评级(A/B/C/D四级)、准入标准(注册资本≥500万)、考核机制(季度评估)。', status: 'completed' },
    { id: '4', name: '保密协议', entities: 6, summary: '保密范围、期限、违约责任相关条款', detail: '保密范围(技术资料、商务信息)、保密期限(合同终止后3年)、违约责任(赔偿实际损失)。', status: 'review' },
  ];

  return (
    <div className="space-y-3">
      {communities.map((community) => {
        const isExpanded = expandedId === community.id;
        return (
          <div
            key={community.id}
            className="glass-card p-5 !rounded-xl cursor-pointer group"
            onClick={() => setExpandedId(isExpanded ? null : community.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                  <Users size={16} className="text-amber-400/60" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">C{community.id} · {community.name}</h3>
                  <p className="text-xs text-white/30">{community.entities} 实体</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={community.status === 'completed' ? 'neon-badge-active text-[10px]' : 'neon-badge-indexing text-[10px]'}>
                  {community.status === 'completed' ? '已生成' : '待审核'}
                </span>
                <ChevronRight size={14} className={`text-white/20 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">{community.summary}</p>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/5 animate-fade-in">
                <p className="text-xs text-white/40 leading-relaxed">{community.detail}</p>
                {community.status === 'review' && (
                  <div className="flex gap-2 mt-3">
                    <button className="neon-button text-xs" onClick={e => e.stopPropagation()}>确认发布</button>
                    <button className="neon-button-ghost text-xs text-red-400/60" onClick={e => e.stopPropagation()}>打回修改</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IndexQueueTab() {
  const [queue, setQueue] = useState([
    { id: '1', name: '全量社区索引', status: 'running', progress: 72, step: 'Embedding communities 18/24' },
    { id: '2', name: '增量实体索引', status: 'queued', progress: 0, step: '等待中' },
  ]);

  const handleCancel = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleStart = (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'running', step: '准备中...', progress: 5 } : q));
  };

  return (
    <div className="space-y-3">
      {queue.map((item) => (
        <div key={item.id} className="glass-card p-5 !rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80">{item.name}</h3>
            <div className="flex items-center gap-2">
              <span className={item.status === 'running' ? 'neon-badge-indexing text-[10px]' : 'neon-badge-draft text-[10px]'}>
                {item.status === 'running' ? '运行中' : '排队中'}
              </span>
              {item.status === 'queued' ? (
                <button onClick={() => handleStart(item.id)} className="neon-button text-xs px-2 py-1 flex items-center gap-1">
                  <Zap size={10} /> 启动
                </button>
              ) : (
                <button onClick={() => handleCancel(item.id)} className="neon-button-ghost text-xs px-2 py-1 text-red-400/60 hover:text-red-400">
                  取消
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2 progress-bar-glow">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.progress}%`, background: item.status === 'running' ? '#f59e0b' : '#374151' }} />
          </div>
          <p className="text-xs text-white/30">{item.step} · {item.progress}%</p>
        </div>
      ))}
      {queue.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BarChart3 size={28} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">队列为空</p>
          <button className="neon-button text-xs mt-3">新建索引任务</button>
        </div>
      )}
    </div>
  );
}

function EntityReviewTab() {
  const [entities, setEntities] = useState([
    { id: '1', name: '供应商评级降级', type: '事件', source: '供应商管理规范.docx', confidence: 0.78, status: 'pending' as const },
    { id: '2', name: '逾期利息', type: '条款', source: '付款条款汇总.wiki', confidence: 0.82, status: 'pending' as const },
    { id: '3', name: '合同生效日', type: '日期', source: '合同模板V5.pdf', confidence: 0.91, status: 'confirmed' as const },
  ]);

  const handleConfirm = (id: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, status: 'confirmed' as const } : e));
  };

  const handleReject = (id: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const } : e));
  };

  const handleBatchConfirm = () => {
    setEntities(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'confirmed' as const } : e));
  };

  const pendingCount = entities.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30">{pendingCount} 个待确认实体</span>
        <button onClick={handleBatchConfirm} disabled={pendingCount === 0} className={`text-xs ${pendingCount > 0 ? 'neon-button' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5 px-3 py-1.5 rounded-lg'}`}>
          批量确认
        </button>
      </div>
      {entities.map((entity) => (
        <div key={entity.id} className="glass-card p-4 !rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: entity.status === 'confirmed' ? '#10b981' : entity.status === 'rejected' ? '#ef4444' : '#f59e0b' }} />
              <div>
                <h3 className={`text-sm ${entity.status === 'rejected' ? 'text-white/30 line-through' : 'text-white/80'}`}>{entity.name}</h3>
                <p className="text-xs text-white/30">{entity.type} · {entity.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">置信度 {(entity.confidence * 100).toFixed(0)}%</span>
              {entity.status === 'pending' ? (
                <div className="flex gap-1">
                  <button onClick={() => handleConfirm(entity.id)} className="neon-button text-xs px-2 py-1">确认</button>
                  <button onClick={() => handleReject(entity.id)} className="neon-button-ghost text-xs px-2 py-1 text-red-400/60 hover:text-red-400">拒绝</button>
                </div>
              ) : entity.status === 'confirmed' ? (
                <span className="neon-badge-active text-[10px]">已确认</span>
              ) : (
                <span className="neon-badge-error text-[10px]">已拒绝</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({
    algorithm: 'Leiden',
    model: 'GPT-4o',
    maxCommunitySize: 50,
    autoBuild: false,
  });

  return (
    <div className="glass-card p-6 max-w-lg !rounded-xl">
      <h3 className="text-sm font-semibold text-white/60 mb-5 flex items-center gap-2">
        <Settings size={16} className="text-neon-cyan/60" /> GraphRAG 配置
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">社区检测算法</label>
          <select className="glass-select" value={settings.algorithm} onChange={e => setSettings(s => ({ ...s, algorithm: e.target.value }))}>
            <option>Leiden</option>
            <option>Louvain</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">实体提取模型</label>
          <select className="glass-select" value={settings.model} onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}>
            <option>GPT-4o</option>
            <option>Claude 3.5 Sonnet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">社区最大规模</label>
          <input type="number" value={settings.maxCommunitySize} onChange={e => setSettings(s => ({ ...s, maxCommunitySize: parseInt(e.target.value) || 0 }))} className="glass-input" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-white/50">自动构建索引</label>
          <button
            onClick={() => setSettings(s => ({ ...s, autoBuild: !s.autoBuild }))}
            className={`w-10 h-5 rounded-full transition-all duration-200 relative ${settings.autoBuild ? 'bg-neon-cyan/30' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200 ${settings.autoBuild ? 'left-5 bg-neon-cyan' : 'left-0.5 bg-white/30'}`} />
          </button>
        </div>
        <button className="neon-button-primary w-full" onClick={() => alert('配置已保存')}>保存配置</button>
      </div>
    </div>
  );
}
