import React, { useState } from 'react';
import { TrendingUp, BarChart3, AlertCircle, CheckCircle, Clock, Play, Plus, RefreshCw, FileText, Users, DollarSign, ChevronRight, Activity } from 'lucide-react';

const tabs = ['仪表板', '任务', 'A/B 测试', '数据集', '满意度', '成本'];

const kpis = [
  { label: 'Faithfulness', value: 92, trend: '+3.2%', icon: CheckCircle, color: '#10b981' },
  { label: 'Context Precision', value: 88, trend: '+1.1%', icon: BarChart3, color: '#06b6d4' },
  { label: 'Answer Relevancy', value: 91, trend: '-2.0%', icon: TrendingUp, color: '#f59e0b' },
  { label: 'Hallucination Rate', value: 4, trend: '-1.2%', icon: AlertCircle, color: '#ef4444' },
];

const mockTasks = [
  { id: '1', name: '合同检索准确率评测', dataset: '法务合同-200', status: 'running', progress: 65, created: '6/6 10:00' },
  { id: '2', name: '财报问答质量评测', dataset: '财报QA-100', status: 'completed', progress: 100, created: '6/5 16:00' },
  { id: '3', name: '跨库检索对比评测', dataset: '混合-500', status: 'queued', progress: 0, created: '6/6 11:00' },
];

export default function EvaluationPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">评测中心</h1>
          <p className="text-white/40 text-sm mt-1">RAG 系统质量评估与监控</p>
        </div>
        <button onClick={() => alert('新建评测任务（模拟）')} className="neon-button-primary flex items-center gap-2">
          <Plus size={18} /> 新建评测
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend.startsWith('+');
          const isHalu = kpi.label === 'Hallucination Rate';
          const trendPositive = isHalu ? kpi.trend.startsWith('-') : isPositive;
          return (
            <div key={kpi.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} style={{ color: kpi.color, opacity: 0.6 }} />
                <span className={`text-xs font-medium ${trendPositive ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="stat-value mb-1" style={{ background: `linear-gradient(135deg, ${kpi.color}, ${kpi.color}90)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {kpi.value}{kpi.label === 'Hallucination Rate' ? '%' : '%'}
              </div>
              <div className="text-xs text-white/40">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="glass-card !rounded-xl overflow-hidden">
        <div className="flex border-b border-white/5">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 px-4 py-3 text-sm text-center transition-all duration-200 ${
                activeTab === idx ? 'text-neon-cyan border-b-2 border-neon-cyan bg-white/[0.03]' : 'text-white/30 hover:text-white/60 border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 0 && <DashboardContent />}
          {activeTab === 1 && <TasksContent />}
          {activeTab === 2 && <ABTestContent />}
          {activeTab === 3 && <DatasetsContent />}
          {activeTab === 4 && <SatisfactionContent />}
          {activeTab === 5 && <CostContent />}
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-5">
      {/* Metric Trends (mock chart) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-semibold text-white/60 mb-3">Faithfulness 趋势</h3>
          <div className="flex items-end gap-1.5 h-24">
            {[78, 82, 85, 83, 88, 90, 92].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${(val / 100) * 100}%`,
                    background: `linear-gradient(180deg, rgba(16,185,129,0.5), rgba(16,185,129,0.05))`,
                    minHeight: '2px',
                  }}
                />
                <span className="text-[8px] text-white/15">{['5/1', '', '5/15', '', '6/1', '', '6/6'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-semibold text-white/60 mb-3">Hallucination Rate 趋势</h3>
          <div className="flex items-end gap-1.5 h-24">
            {[12, 10, 8, 9, 7, 5, 4].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${(val / 15) * 100}%`,
                    background: `linear-gradient(180deg, rgba(239,68,68,0.5), rgba(239,68,68,0.05))`,
                    minHeight: '2px',
                  }}
                />
                <span className="text-[8px] text-white/15">{['5/1', '', '5/15', '', '6/1', '', '6/6'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent evaluations */}
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-semibold text-white/60 mb-3">最近评测结果</h3>
        <div className="space-y-2">
          {[
            { name: '合同检索评测', score: 92, time: '2小时前' },
            { name: '财报QA评测', score: 88, time: '1天前' },
            { name: '跨库检索评测', score: 85, time: '3天前' },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-white/[0.03] transition-colors">
              <span className="text-sm text-white/60">{item.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-neon-cyan/60" style={{ width: `${item.score}%` }} />
                </div>
                <span className="text-xs text-white/40">{item.score}%</span>
                <span className="text-xs text-white/20">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksContent() {
  return (
    <div className="space-y-3">
      {mockTasks.map((task) => (
        <div key={task.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={task.status === 'running' ? 'neon-badge-indexing text-[10px]' : task.status === 'completed' ? 'neon-badge-active text-[10px]' : 'neon-badge-draft text-[10px]'}>
                {task.status === 'running' ? '运行中' : task.status === 'completed' ? '已完成' : '排队中'}
              </span>
              <h3 className="text-sm font-medium text-white/70">{task.name}</h3>
            </div>
            <span className="text-xs text-white/20">{task.created}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">数据集: {task.dataset}</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${task.progress}%`,
                background: task.status === 'running' ? '#f59e0b' : task.status === 'completed' ? '#10b981' : '#4b5563'
              }} />
            </div>
            <span className="text-xs text-white/30">{task.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ABTestContent() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-semibold text-white/60 mb-3">活跃 A/B 实验</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm text-white/70">方案 A · BGE-M3</span>
            </div>
            <div className="text-xs text-white/40">Faithfulness: 92% · 响应: 180ms</div>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm text-white/70">方案 B · text-3-large</span>
            </div>
            <div className="text-xs text-white/40">Faithfulness: 89% · 响应: 220ms</div>
          </div>
        </div>
      </div>
      <button onClick={() => alert('创建新实验（模拟）')} className="neon-button text-xs flex items-center gap-1">
        <Plus size={12} /> 创建新实验
      </button>
    </div>
  );
}

function DatasetsContent() {
  const datasets = [
    { name: '法务合同-200', size: '200 条', created: '6/5', type: '检索评测' },
    { name: '财报QA-100', size: '100 条', created: '6/4', type: '生成评测' },
    { name: '混合-500', size: '500 条', created: '6/6', type: '跨库评测' },
  ];

  return (
    <div className="space-y-2">
      {datasets.map((ds) => (
        <div key={ds.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-white/20" />
            <div>
              <span className="text-sm text-white/70">{ds.name}</span>
              <span className="text-xs text-white/30 ml-2">{ds.size}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/25">
            <span>{ds.type}</span>
            <span>{ds.created}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SatisfactionContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
          <div className="stat-value text-2xl mb-1">4.2</div>
          <div className="text-xs text-white/40">平均评分 (5分制)</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
          <div className="stat-value-green text-2xl mb-1">78%</div>
          <div className="text-xs text-white/40">正面反馈率</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
          <div className="stat-value text-2xl mb-1" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>1.2K</div>
          <div className="text-xs text-white/40">总反馈数</div>
        </div>
      </div>
      {/* Rating distribution */}
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-semibold text-white/60 mb-3">评分分布</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-xs text-white/30 w-8">{rating} 星</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${rating === 5 ? 45 : rating === 4 ? 33 : rating === 3 ? 12 : rating === 2 ? 6 : 4}%`,
                  background: rating >= 4 ? '#10b981' : rating === 3 ? '#f59e0b' : '#ef4444'
                }} />
              </div>
              <span className="text-xs text-white/25 w-8 text-right">
                {rating === 5 ? '45%' : rating === 4 ? '33%' : rating === 3 ? '12%' : rating === 2 ? '6%' : '4%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CostContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <DollarSign size={18} className="text-neon-cyan/60 mb-2" />
          <div className="stat-value text-xl mb-1">$2,340</div>
          <div className="text-xs text-white/40">本月总成本</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <Activity size={18} className="text-amber-400/60 mb-2" />
          <div className="stat-value text-xl mb-1">$0.052</div>
          <div className="text-xs text-white/40">平均单次查询</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <TrendingUp size={18} className="text-emerald-400/60 mb-2" />
          <div className="stat-value-green text-xl mb-1">-12%</div>
          <div className="text-xs text-white/40">较上月变化</div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-semibold text-white/60 mb-3">成本分布</h3>
        <div className="space-y-2">
          {[
            { label: 'LLM 调用', amount: '$1,560', percent: 67, color: '#06b6d4' },
            { label: 'Embedding', amount: '$420', percent: 18, color: '#10b981' },
            { label: '存储', amount: '$240', percent: 10, color: '#8b5cf6' },
            { label: '计算', amount: '$120', percent: 5, color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-20">{item.label}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: item.color }} />
              </div>
              <span className="text-xs text-white/30 w-12 text-right">{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
