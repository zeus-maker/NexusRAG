import { useState } from 'react';
import {
  Network, ChevronRight, Eye,
  Users, GitBranch, Settings, Layers, X, Zap,
} from 'lucide-react';
import { HubPageShell } from '../../components/HubPageShell';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../../components/hubUi';

interface GraphRAGHubPageProps {
  kbId?: string;
  onNavigate: (page: string, extra?: any) => void;
}

const tabs = ['概览', '可视化', '社区摘要', '建索引队列', '实体复核', '设置'];

const graphNodes = [
  { id: '1', label: '供应商', x: 50, y: 40, size: 24, color: '#f59e0b' },
  { id: '2', label: '采购方', x: 30, y: 25, size: 20, color: '#10b981' },
  { id: '3', label: '违约金', x: 65, y: 55, size: 18, color: '#3b82f6' },
  { id: '4', label: '合同解除', x: 45, y: 70, size: 16, color: '#8b5cf6' },
  { id: '5', label: '付款条件', x: 75, y: 30, size: 14, color: '#ec4899' },
];

const graphEdges = [
  { from: '1', to: '2' }, { from: '1', to: '3' }, { from: '2', to: '3' },
  { from: '1', to: '4' }, { from: '2', to: '5' },
];

export default function GraphRAGHubPage({ kbId, onNavigate }: GraphRAGHubPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <HubPageShell
      title="GraphRAG Hub"
      subtitle="知识图谱可视化 · 24 社区 · 1.2K 实体"
      icon={<Network size={16} className="text-amber-600" />}
      badge={{ label: '已构建', variant: 'active' }}
      onBack={() => onNavigate('kb-detail', { selectedKBId: kbId || 'kb-001' })}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 0 && <OverviewTab />}
      {activeTab === 1 && <VisualizationTab />}
      {activeTab === 2 && <CommunitySummaryTab />}
      {activeTab === 3 && <IndexQueueTab />}
      {activeTab === 4 && <EntityReviewTab />}
      {activeTab === 5 && <SettingsTab />}
    </HubPageShell>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="实体数" value="1,247" icon={<Network size={18} className="text-amber-500" />} />
        <HubStatCard label="关系数" value="3,891" icon={<GitBranch size={18} className="text-blue-500" />} />
        <HubStatCard label="社区数" value="24" icon={<Users size={18} className="text-purple-500" />} />
        <HubStatCard label="图直径" value="8" icon={<Layers size={18} className="text-green-500" />} />
      </div>
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">高频实体</h3>
        <div className="space-y-2">
          {[
            { name: '供应商', type: '角色', connections: 186, color: '#f59e0b' },
            { name: '违约金', type: '条款', connections: 142, color: '#3b82f6' },
            { name: '采购方', type: '角色', connections: 128, color: '#10b981' },
          ].map(entity => (
            <div key={entity.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-2 h-2 rounded-full" style={{ background: entity.color }} />
              <span className="text-sm text-gray-800 flex-1">{entity.name}</span>
              <span className="text-xs text-gray-500">{entity.type}</span>
              <span className="text-xs text-blue-600 font-medium">{entity.connections} 连接</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">社区规模分布</h3>
        <div className="flex items-end gap-1 h-24">
          {[35, 52, 28, 86, 44, 67, 31, 58, 23, 41, 72, 39].map((val, idx) => (
            <div key={idx} className="flex-1 bg-amber-400 rounded-t-sm opacity-80" style={{ height: `${(val / 100) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualizationTab() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className={`${hubCard} p-4 lg:col-span-3`} style={{ minHeight: 360 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Network size={16} className="text-amber-600" /> 力导向图
          </h3>
          {selectedNode && (
            <button onClick={() => setSelectedNode(null)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> 清除选中
            </button>
          )}
        </div>
        <div className="relative w-full bg-gray-50 rounded-lg border border-gray-100 overflow-hidden" style={{ height: 300 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            {graphEdges.map((edge, idx) => {
              const from = graphNodes.find(n => n.id === edge.from)!;
              const to = graphNodes.find(n => n.id === edge.to)!;
              const active = selectedNode && (edge.from === selectedNode || edge.to === selectedNode);
              return (
                <line key={idx} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={active ? '#3b82f6' : '#d1d5db'} strokeWidth={active ? 0.3 : 0.2} />
              );
            })}
            {graphNodes.map(node => {
              const isSelected = selectedNode === node.id;
              return (
                <g key={node.id} onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={node.x} cy={node.y} r={node.size / 8} fill={node.color} fillOpacity={isSelected ? 1 : 0.7}
                    stroke={isSelected ? '#1d4ed8' : node.color} strokeWidth={isSelected ? 0.4 : 0.1} />
                  <text x={node.x} y={node.y + node.size / 8 + 3} textAnchor="middle" fill="#374151" fontSize="2.2">{node.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className={`${hubCard} p-4 lg:col-span-2`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">节点详情</h3>
        {selectedNode ? (
          (() => {
            const node = graphNodes.find(n => n.id === selectedNode)!;
            const connections = graphEdges.filter(e => e.from === selectedNode || e.to === selectedNode);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: node.color }} />
                  <span className="font-semibold text-gray-900">{node.label}</span>
                </div>
                <p className="text-xs text-gray-500">连接数 {connections.length}</p>
                <div className="space-y-1">
                  {connections.map((edge, i) => {
                    const relatedId = edge.from === selectedNode ? edge.to : edge.from;
                    const related = graphNodes.find(n => n.id === relatedId)!;
                    return (
                      <button key={i} onClick={() => setSelectedNode(relatedId)}
                        className="flex items-center gap-2 text-xs w-full text-left p-2 rounded-lg hover:bg-gray-50 text-gray-700">
                        <div className="w-2 h-2 rounded-full" style={{ background: related.color }} />
                        {related.label}
                        <ChevronRight size={10} className="ml-auto text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Network size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">点击节点查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunitySummaryTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const communities = [
    { id: '1', name: '违约责任', entities: 12, summary: '涉及供应商违约、违约金计算、合同解除条件等条款', detail: '违约金比例 0.3%-0.5%，迟延交货千分之五/日。', status: 'completed' as const },
    { id: '2', name: '付款条款', entities: 8, summary: '涵盖付款条件、付款周期、逾期利息计算等内容', detail: '月结60天，逾期年化8%。', status: 'review' as const },
  ];

  return (
    <div className="space-y-3">
      {communities.map(c => (
        <div key={c.id} className={`${hubCard} p-4 cursor-pointer hover:border-blue-300`} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Users size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">C{c.id} · {c.name}</h3>
                <p className="text-xs text-gray-500">{c.entities} 实体</p>
              </div>
            </div>
            <HubBadge variant={c.status === 'completed' ? 'active' : 'indexing'}>
              {c.status === 'completed' ? '已生成' : '待审核'}
            </HubBadge>
          </div>
          <p className="text-sm text-gray-600">{c.summary}</p>
          {expandedId === c.id && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">{c.detail}</p>
              {c.status === 'review' && (
                <div className="flex gap-2 mt-3">
                  <BtnSecondary onClick={e => e.stopPropagation()}>确认发布</BtnSecondary>
                  <button onClick={e => e.stopPropagation()} className="text-xs text-red-600 hover:underline px-2">打回修改</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IndexQueueTab() {
  const [queue, setQueue] = useState([
    { id: '1', name: '全量社区索引', status: 'running' as const, progress: 72, step: 'Embedding 18/24' },
    { id: '2', name: '增量实体索引', status: 'queued' as const, progress: 0, step: '等待中' },
  ]);

  return (
    <div className="space-y-3">
      {queue.map(item => (
        <div key={item.id} className={`${hubCard} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
            <div className="flex items-center gap-2">
              <HubBadge variant={item.status === 'running' ? 'indexing' : 'draft'}>
                {item.status === 'running' ? '运行中' : '排队中'}
              </HubBadge>
              {item.status === 'queued' ? (
                <BtnSecondary onClick={() => setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'running' as const, progress: 5 } : x))}>
                  <Zap size={10} /> 启动
                </BtnSecondary>
              ) : (
                <button onClick={() => setQueue(q => q.filter(x => x.id !== item.id))} className="text-xs text-red-600 hover:underline">取消</button>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${item.progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">{item.step} · {item.progress}%</p>
        </div>
      ))}
    </div>
  );
}

function EntityReviewTab() {
  const [entities, setEntities] = useState([
    { id: '1', name: '供应商评级降级', type: '事件', source: '供应商管理规范.docx', confidence: 0.78, status: 'pending' as const },
    { id: '2', name: '逾期利息', type: '条款', source: '付款条款汇总.wiki', confidence: 0.82, status: 'pending' as const },
    { id: '3', name: '合同生效日', type: '日期', source: '合同模板V5.pdf', confidence: 0.91, status: 'confirmed' as const },
  ]);

  const pending = entities.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{pending} 个待确认实体</span>
        <BtnSecondary disabled={pending === 0} onClick={() => setEntities(e => e.map(x => x.status === 'pending' ? { ...x, status: 'confirmed' as const } : x))}>
          批量确认
        </BtnSecondary>
      </div>
      {entities.map(entity => (
        <div key={entity.id} className={`${hubCard} p-4`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${entity.status === 'confirmed' ? 'bg-green-500' : entity.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <div>
                <h3 className={`text-sm font-medium ${entity.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{entity.name}</h3>
                <p className="text-xs text-gray-500">{entity.type} · {entity.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">置信度 {(entity.confidence * 100).toFixed(0)}%</span>
              {entity.status === 'pending' ? (
                <>
                  <BtnSecondary onClick={() => setEntities(e => e.map(x => x.id === entity.id ? { ...x, status: 'confirmed' as const } : x))}>确认</BtnSecondary>
                  <button onClick={() => setEntities(e => e.map(x => x.id === entity.id ? { ...x, status: 'rejected' as const } : x))} className="text-xs text-red-600 hover:underline">拒绝</button>
                </>
              ) : (
                <HubBadge variant={entity.status === 'confirmed' ? 'active' : 'error'}>
                  {entity.status === 'confirmed' ? '已确认' : '已拒绝'}
                </HubBadge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [autoBuild, setAutoBuild] = useState(false);

  return (
    <div className={`${hubCard} p-5 max-w-lg`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings size={16} className="text-gray-500" /> GraphRAG 配置
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">社区检测算法</label>
          <select className={hubSelect} defaultValue="leiden"><option>Leiden</option><option>Louvain</option></select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">实体提取模型</label>
          <select className={hubSelect} defaultValue="gpt4o"><option>GPT-4o</option><option>Claude 3.5 Sonnet</option></select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">自动构建索引</span>
          <button onClick={() => setAutoBuild(p => !p)} className={`w-11 h-6 rounded-full relative transition-colors ${autoBuild ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${autoBuild ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <BtnPrimary className="w-full justify-center" onClick={() => alert('配置已保存')}>保存配置</BtnPrimary>
      </div>
    </div>
  );
}
