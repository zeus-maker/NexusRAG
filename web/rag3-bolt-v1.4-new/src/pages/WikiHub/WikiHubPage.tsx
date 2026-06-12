import React, { useState } from 'react';
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, Search, Plus, ArrowLeft, Edit3, Eye, GitBranch, BarChart3, Settings, RefreshCw, ExternalLink } from 'lucide-react';

interface WikiHubPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const tabs = ['浏览器', '编译队列', '编译设置', '统计'];

const mockPages = [
  { id: '1', title: '违约金计算规则', status: 'published', version: 'v3.2', updated: '2小时前', views: 342, author: '李婷' },
  { id: '2', title: '供应商评级标准', status: 'published', version: 'v2.1', updated: '1天前', views: 189, author: '王磊' },
  { id: '3', title: '合同审批流程', status: 'review', version: 'v1.0-draft', updated: '3小时前', views: 0, author: '张敏' },
  { id: '4', title: '采购订单规范', status: 'review', version: 'v1.0-draft', updated: '5小时前', views: 0, author: '李婷' },
  { id: '5', title: '付款条款汇总', status: 'compiling', version: 'v2.0', updated: '刚刚', views: 56, author: '王磊' },
  { id: '6', title: '保密协议模板', status: 'compiling', version: 'v1.5', updated: '刚刚', views: 78, author: '张敏' },
];

export default function WikiHubPage({ onNavigate }: WikiHubPageProps) {
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
                <BookOpen size={20} className="text-violet-400/70" /> Wiki Hub
              </h1>
              <span className="neon-badge-indexing text-[10px]">
                <RefreshCw size={10} className="animate-spin" /> 2 编译中
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">LLM Wiki 知识库管理 · 12/42 页面已发布</p>
          </div>
          <button onClick={() => alert('新建 Wiki 页面（模拟）')} className="neon-button-primary flex items-center gap-2">
            <Plus size={16} /> 新建页面
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 0 && <BrowserTab />}
        {activeTab === 1 && <CompileQueueTab />}
        {activeTab === 2 && <CompileSettingsTab />}
        {activeTab === 3 && <StatsTab />}
      </div>
    </div>
  );
}

function BrowserTab() {
  const [search, setSearch] = useState('');

  const filtered = mockPages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-white/25" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 Wiki 页面..."
          className="glass-input pl-9"
        />
      </div>

      {/* Page List */}
      <div className="space-y-2">
        {filtered.map((page) => (
          <div key={page.id} className="glass-card p-4 !rounded-xl cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-white/20 group-hover:text-violet-400/50 transition-colors" />
                <div>
                  <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{page.title}</h3>
                  <p className="text-xs text-white/30">{page.version} · {page.author} · {page.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/20 flex items-center gap-1">
                  <Eye size={12} /> {page.views}
                </span>
                <span className={
                  page.status === 'published' ? 'neon-badge-active text-[10px]' :
                  page.status === 'review' ? 'neon-badge-indexing text-[10px]' :
                  'neon-badge-draft text-[10px]'
                }>
                  {page.status === 'published' ? '已发布' : page.status === 'review' ? '待审核' : '编译中'}
                </span>
                <ChevronRight size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompileQueueTab() {
  const queue = [
    { id: '1', title: '付款条款汇总', status: 'compiling', progress: 65, step: 'Chunking & Embedding', started: '3分钟前' },
    { id: '2', title: '保密协议模板', status: 'compiling', progress: 30, step: 'LLM Extraction', started: '5分钟前' },
    { id: '3', title: '合同审批流程', status: 'queued', progress: 0, step: '等待中', started: '-' },
  ];

  return (
    <div className="space-y-3">
      {queue.map((item) => (
        <div key={item.id} className="glass-card p-5 !rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-white/20" />
              <h3 className="text-sm font-medium text-white/80">{item.title}</h3>
            </div>
            <span className={item.status === 'compiling' ? 'neon-badge-indexing text-[10px]' : 'neon-badge-draft text-[10px]'}>
              {item.status === 'compiling' ? '编译中' : '排队中'}
            </span>
          </div>

          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2 progress-bar-glow">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${item.progress}%`, background: item.status === 'compiling' ? '#f59e0b' : '#4b5563' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white/30">
            <span>{item.step}</span>
            <span>{item.started} · {item.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompileSettingsTab() {
  const [autoPublish, setAutoPublish] = useState(true);
  const [extractionModel, setExtractionModel] = useState('GPT-4o (推荐)');
  const [compileMode, setCompileMode] = useState('增量编译');
  const [reviewRequirement, setReviewRequirement] = useState('需人工审核');
  return (
    <div className="glass-card p-6 max-w-lg !rounded-xl">
      <h3 className="text-sm font-semibold text-white/60 mb-5 flex items-center gap-2">
        <Settings size={16} className="text-neon-cyan/60" /> 编译配置
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">提取模型</label>
          <select className="glass-select" value={extractionModel} onChange={e => setExtractionModel(e.target.value)}>
            <option>GPT-4o (推荐)</option>
            <option>Claude 3.5 Sonnet</option>
            <option>Qwen-Max</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">编译模式</label>
          <select className="glass-select" value={compileMode} onChange={e => setCompileMode(e.target.value)}>
            <option>增量编译</option>
            <option>全量重编译</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">自动发布</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoPublish(!autoPublish)}
              className={`w-10 h-5 rounded-full relative transition-colors ${autoPublish ? 'bg-neon-cyan/30' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${autoPublish ? 'right-0.5 bg-neon-cyan' : 'left-0.5 bg-white/40'}`} />
            </button>
            <span className="text-sm text-white/50">编译完成后自动发布</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">审核要求</label>
          <select className="glass-select" value={reviewRequirement} onChange={e => setReviewRequirement(e.target.value)}>
            <option>需人工审核</option>
            <option>自动审核通过</option>
          </select>
        </div>
        <button onClick={() => alert('配置已保存')} className="neon-button-primary w-full">保存配置</button>
      </div>
    </div>
  );
}

function StatsTab() {
  const stats = [
    { label: '已发布页面', value: '12/42', icon: CheckCircle, color: '#10b981' },
    { label: '待审核', value: '3', icon: Clock, color: '#f59e0b' },
    { label: '编译中', value: '2', icon: RefreshCw, color: '#06b6d4' },
    { label: '总浏览量', value: '4.2K', icon: Eye, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
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

      {/* Weekly compile chart (mock) */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">编译趋势 (近7天)</h3>
        <div className="flex items-end gap-3 h-32">
          {[12, 8, 15, 6, 18, 10, 14].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${(val / 20) * 100}%`,
                  background: `linear-gradient(180deg, rgba(0,240,255,0.4), rgba(0,240,255,0.05))`,
                  minHeight: '4px',
                }}
              />
              <span className="text-[10px] text-white/20">{['一', '二', '三', '四', '五', '六', '日'][idx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
