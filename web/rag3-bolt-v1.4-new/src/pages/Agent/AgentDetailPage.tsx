import React, { useState } from 'react';
import { Zap, GitBranch, Play, Settings, ArrowLeft, Clock, CheckCircle, AlertCircle, Plus, Trash2, GripVertical, ChevronDown, FileText, Database, Search, MessageCircle, BarChart3, ArrowRight } from 'lucide-react';

interface AgentDetailPageProps {
  agentId: string;
  onNavigate: (page: string, id?: string) => void;
}

const pipelineSteps = [
  { id: '1', type: 'input', name: '文档输入', config: { source: '法务合同库', format: 'PDF' }, icon: FileText, color: '#06b6d4' },
  { id: '2', type: 'process', name: '文本分块', config: { strategy: '法律分块', chunkSize: 512 }, icon: GitBranch, color: '#8b5cf6' },
  { id: '3', type: 'process', name: '向量嵌入', config: { model: 'BGE-M3', dimension: 1024 }, icon: Database, color: '#10b981' },
  { id: '4', type: 'process', name: '混合检索', config: { mode: 'hybrid', topK: 10 }, icon: Search, color: '#f59e0b' },
  { id: '5', type: 'process', name: 'LLM 生成', config: { model: 'GPT-4o', temperature: 0.1 }, icon: MessageCircle, color: '#ec4899' },
  { id: '6', type: 'output', name: '质量评测', config: { metrics: ['Faithfulness', 'Relevancy'] }, icon: BarChart3, color: '#10b981' },
];

export default function AgentDetailPage({ agentId, onNavigate }: AgentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'runs' | 'settings'>('pipeline');

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="glass-panel border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('agent-list')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">合同审查 Agent</h1>
              <span className="neon-badge-active text-[10px]">
                <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 活跃
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">Pipeline · 342 次运行 · 98.2% 成功率</p>
          </div>
          <div className="flex gap-2">
            <button className="neon-button-primary flex items-center gap-2">
              <Play size={16} /> 运行
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel border-b border-white/5 px-6">
        <div className="flex gap-6">
          {(['pipeline', 'runs', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-3.5 text-sm transition-all duration-200 capitalize ${
                activeTab === tab ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab === 'pipeline' ? 'Pipeline 编辑' : tab === 'runs' ? '运行记录' : '设置'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'pipeline' && <PipelineEditor />}
        {activeTab === 'runs' && <RunsHistory />}
        {activeTab === 'settings' && <AgentSettings />}
      </div>
    </div>
  );
}

function PipelineEditor() {
  const [steps, setSteps] = useState(pipelineSteps);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const handleDeleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
    if (selectedStep === stepId) setSelectedStep(null);
  };

  const handleAddStep = () => {
    const newStep = {
      id: Date.now().toString(),
      type: 'process',
      name: '新步骤',
      config: { action: 'configure' },
      icon: Zap,
      color: '#06b6d4',
    };
    setSteps(prev => [...prev, newStep]);
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Pipeline Flow */}
      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/60">Pipeline 流程</h3>
          <button onClick={handleAddStep} className="neon-button text-xs flex items-center gap-1">
            <Plus size={12} /> 添加步骤
          </button>
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = selectedStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => setSelectedStep(step.id)}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  isSelected ? '!border-neon-cyan/30 !bg-white/[0.06]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-white/10 cursor-grab" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border"
                       style={{ background: `${step.color}15`, borderColor: `${step.color}25` }}>
                    <Icon size={16} style={{ color: step.color, opacity: 0.7 }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/80">{step.name}</span>
                      <span className="text-[10px] text-white/20 uppercase">{step.type}</span>
                    </div>
                    <p className="text-xs text-white/30">{Object.entries(step.config).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }} className="p-1 text-white/10 hover:text-red-400/60 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-px h-4 bg-gradient-to-b from-white/10 to-white/5" />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {steps.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-white/30 text-sm mb-3">Pipeline 为空</p>
            <button onClick={handleAddStep} className="neon-button text-xs">添加第一个步骤</button>
          </div>
        )}
      </div>

      {/* Config Panel */}
      <div className="col-span-2 glass-card p-4 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">步骤配置</h3>
        {selectedStep && steps.find(s => s.id === selectedStep) ? (
          <div className="space-y-4 animate-fade-in">
            {(() => {
              const step = steps.find(s => s.id === selectedStep)!;
              return (
                <>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">步骤名称</label>
                    <input type="text" defaultValue={step.name} className="glass-input" />
                  </div>
                  {Object.entries(step.config).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm text-white/50 mb-2">{key}</label>
                      <input type="text" defaultValue={String(value)} className="glass-input" />
                    </div>
                  ))}
                  <button className="neon-button-primary w-full text-xs">保存配置</button>
                </>
              );
            })()}
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-8">选择步骤查看配置</p>
        )}
      </div>
    </div>
  );
}

function RunsHistory() {
  const runs = [
    { id: '1', time: '6/6 10:00', duration: '3.2s', status: 'success', input: '合同V5违约条款', output: '违约金计算规则' },
    { id: '2', time: '6/6 09:45', duration: '2.8s', status: 'success', input: '采购协议审查', output: '协议合规报告' },
    { id: '3', time: '6/5 16:30', duration: '5.1s', status: 'error', input: '财报数据提取', output: '超时错误' },
  ];

  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <div key={run.id} className="glass-card p-4 !rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={run.status === 'success' ? 'neon-badge-active text-[10px]' : 'neon-badge-error text-[10px]'}>
                {run.status === 'success' ? '成功' : '失败'}
              </span>
              <span className="text-sm text-white/70">{run.input}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/30">
              <span>{run.time}</span>
              <span>·</span>
              <span>{run.duration}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentSettings() {
  return (
    <div className="glass-card p-6 max-w-lg !rounded-xl">
      <h3 className="text-sm font-semibold text-white/60 mb-5">Agent 配置</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">名称</label>
          <input type="text" defaultValue="合同审查 Agent" className="glass-input" />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">类型</label>
          <select className="glass-select">
            <option>Pipeline</option>
            <option>Agent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">调度模式</label>
          <select className="glass-select">
            <option>手动触发</option>
            <option>定时调度</option>
            <option>事件触发</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">并发限制</label>
          <input type="number" defaultValue={3} className="glass-input" />
        </div>
        <button className="neon-button-primary w-full">保存设置</button>
      </div>
    </div>
  );
}
