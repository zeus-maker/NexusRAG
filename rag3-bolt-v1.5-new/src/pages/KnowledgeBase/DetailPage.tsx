import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, BarChart3, Settings, Share2, ChevronRight, Upload, Search, Zap, Database, BookOpen, Network, ArrowLeft, Play, RefreshCw } from 'lucide-react';

interface KBDetailPageProps {
  kbId: string;
  onNavigate: (page: string, id?: string) => void;
}

const tabs = ['概览', '文件', '检索测试', '索引状态', '设置'];

export default function KBDetailPage({ kbId, onNavigate }: KBDetailPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="glass-panel border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => onNavigate('kb-list')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">法务合同知识库</h1>
              <span className="neon-badge-active">
                <div className="glow-dot-green" style={{ width: 6, height: 6 }} /> 活跃
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">管理企业合同相关的知识库内容 · 156 文档 · 12,840 块</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => alert('分享链接已复制到剪贴板')} className="neon-button-ghost flex items-center gap-2">
              <Share2 size={16} /> 分享
            </button>
            <button onClick={() => alert('索引重建任务已提交')} className="neon-button flex items-center gap-2">
              <RefreshCw size={16} /> 重建索引
            </button>
          </div>
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
        {activeTab === 0 && <OverviewTab onNavigate={onNavigate} />}
        {activeTab === 1 && <FilesTab />}
        {activeTab === 2 && <RetrievalTab />}
        {activeTab === 3 && <IndexStatusTab />}
        {activeTab === 4 && <SettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '文档数', value: '156', icon: FileText, color: '#06b6d4' },
          { label: '知识块', value: '12,840', icon: BarChart3, color: '#10b981' },
          { label: '存储大小', value: '500MB', icon: Database, color: '#8b5cf6' },
          { label: '解析质量', value: '92.5%', icon: CheckCircle, color: '#f59e0b' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} style={{ color: stat.color, opacity: 0.6 }} />
                <div className="w-2 h-2 rounded-full" style={{ background: stat.color, boxShadow: `0 0 8px ${stat.color}40` }} />
              </div>
              <div className="stat-value mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Hubs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: 'pageindex-hub', label: 'PageIndex 树索引', desc: '85/156 建树率 54.5%', detail: '失败: 12 个文档', icon: Network, color: 'from-cyan-500/15 to-blue-600/15', border: 'border-cyan-500/15 hover:border-cyan-500/30' },
          { id: 'wiki-hub', label: 'LLM Wiki 知识库', desc: '12/42 页面已发布', detail: '待审核: 3 个, 编译中: 2 个', icon: BookOpen, color: 'from-violet-500/15 to-purple-600/15', border: 'border-violet-500/15 hover:border-violet-500/30' },
          { id: 'graphrag-hub', label: 'GraphRAG 图谱', desc: '社区: 24 个, 实体: 1.2K', detail: '实体复核: 86 待确认', icon: Network, color: 'from-amber-500/15 to-orange-600/15', border: 'border-amber-500/15 hover:border-amber-500/30' },
        ].map((hub) => {
          const Icon = hub.icon;
          return (
            <button
              key={hub.id}
              onClick={() => onNavigate(hub.id)}
              className={`p-5 rounded-lg bg-gradient-to-br ${hub.color} border ${hub.border} text-left transition-all duration-300 group hover:shadow-glass`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon size={20} className="text-white/40 group-hover:text-white/70 transition-colors" />
                <h3 className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{hub.label}</h3>
              </div>
              <p className="text-xs text-white/40 mb-1">{hub.desc}</p>
              <p className="text-xs text-white/25 mb-3">{hub.detail}</p>
              <span className="text-xs text-neon-cyan/60 group-hover:text-neon-cyan flex items-center gap-1 transition-colors">
                进入 <ChevronRight size={14} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-neon-cyan/60" /> 最近上传
        </h3>
        <div className="space-y-2">
          {[
            { name: '合同模板V3.pdf', size: '2.3MB', time: '6分钟前', status: 'parsed' },
            { name: '采购协议附件.docx', size: '1.8MB', time: '12分钟前', status: 'parsed' },
            { name: '保密协议合集.pdf', size: '5.1MB', time: '1小时前', status: 'parsing' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors group">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-white/20 group-hover:text-neon-cyan/40 transition-colors" />
                <div>
                  <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{item.name}</p>
                  <p className="text-xs text-white/30">{item.size} · PDF · {item.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'parsed' ? (
                  <span className="neon-badge-active text-[10px]">
                    <CheckCircle size={10} /> 已解析
                  </span>
                ) : (
                  <span className="neon-badge-indexing text-[10px]">
                    <RefreshCw size={10} className="animate-spin" /> 解析中
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilesTab() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
        className={`p-8 rounded-xl border-2 border-dashed text-center transition-all duration-300 ${
          isDragging
            ? 'border-neon-cyan/50 bg-neon-cyan/5'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
      >
        <Upload size={36} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-neon-cyan' : 'text-white/20'}`} />
        <p className="text-white/60 mb-2">拖拽文件至此处，或点击选择文件</p>
        <p className="text-xs text-white/30 mb-4">支持 PDF、DOCX、XLSX、PPTX、MD 等 16+ 格式 · 单文件 ≤100MB</p>
        <button onClick={() => alert('文件选择器已打开（模拟）')} className="neon-button-primary">选择文件</button>
      </div>

      {/* File List */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4">已上传文件</h3>
        <div className="space-y-2">
          {[
            { name: '合同模板V3.pdf', size: '2.3MB', chunks: 186, quality: 95 },
            { name: '采购协议附件.docx', size: '1.8MB', chunks: 142, quality: 91 },
            { name: '保密协议合集.pdf', size: '5.1MB', chunks: 0, quality: 0 },
          ].map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-white/20" />
                <div>
                  <p className="text-sm text-white/70">{file.name}</p>
                  <p className="text-xs text-white/30">{file.size} · {file.chunks > 0 ? `${file.chunks} 块` : '解析中'}</p>
                </div>
              </div>
              {file.quality > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">质量 {file.quality}%</span>
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan/60 rounded-full" style={{ width: `${file.quality}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RetrievalTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ text: string; score: number; source: string }>>([]);
  const [activeMode, setActiveMode] = useState('混合检索');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    setTimeout(() => {
      setResults([
        { text: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。迟延超过30日的，采购方有权解除合同。', score: 0.956, source: '合同模板V5.pdf' },
        { text: '违约金标准定义为合同金额的0.3%-0.5%，具体以双方协议为准。若发生不可抗力事件，双方应协商解决。', score: 0.847, source: '采购协议条款.pdf' },
        { text: '合同解除后的清算条款：双方应在30日内完成财务清算，逾期未清的按每日0.05%计息。', score: 0.732, source: '合同模板V3.pdf' },
      ]);
      setIsSearching(false);
    }, 600);
  };

  const modes = ['向量检索', '全文检索', '混合检索', 'PageIndex'];

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Search size={16} className="text-neon-cyan/60" /> 检索测试台
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入测试查询..."
            className="glass-input flex-1"
          />
          <button onClick={handleSearch} disabled={isSearching} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${isSearching ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' : 'neon-button-primary'}`}>
            <Play size={16} /> {isSearching ? '检索中...' : '执行'}
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeMode === mode
                  ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
                  : 'neon-button-ghost'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {isSearching && (
        <div className="glass-card p-8 !rounded-xl text-center">
          <div className="typing-indicator inline-flex items-center gap-0.5 mb-2">
            <span /><span /><span />
          </div>
          <p className="text-xs text-white/30">正在使用 {activeMode} 检索...</p>
        </div>
      )}

      {results.length > 0 && !isSearching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">检索模式: {activeMode} · 找到 {results.length} 条结果</span>
            <span className="text-xs text-white/20">耗时 {(Math.random() * 200 + 50).toFixed(0)}ms</span>
          </div>
          {results.map((result, idx) => (
            <div key={idx} className="glass-card p-5 !rounded-xl animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="neon-badge-active text-[10px]">
                  Top {idx + 1}
                </span>
                <span className="text-xs text-white/40">
                  相关度 <span className="text-neon-cyan">{(result.score * 100).toFixed(1)}%</span>
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-2">{result.text}</p>
              <p className="text-xs text-white/30 flex items-center gap-1">
                <FileText size={12} /> {result.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IndexStatusTab() {
  const indexTypes = [
    { type: '向量索引', count: '154/156', percent: 98.7, status: 'completed', color: '#10b981' },
    { type: '全文索引', count: '156/156', percent: 100, status: 'completed', color: '#06b6d4' },
    { type: 'PageIndex', count: '85/156', percent: 54.5, status: 'indexing', color: '#f59e0b' },
    { type: 'GraphRAG', count: '0/156', percent: 0, status: 'pending', color: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {indexTypes.map((item) => (
        <div key={item.type} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70">{item.type}</h3>
            <span className={item.status === 'completed' ? 'neon-badge-active' : item.status === 'indexing' ? 'neon-badge-indexing' : 'neon-badge-draft'}>
              {item.status === 'completed' ? '已完成' : item.status === 'indexing' ? '进行中' : '待处理'}
            </span>
          </div>
          <div className="stat-value-green text-2xl mb-3" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}80)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {item.percent}%
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2 progress-bar-glow">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${item.percent}%`, background: item.color, boxShadow: `0 0 12px ${item.color}40` }}
            />
          </div>
          <p className="text-xs text-white/30">{item.count}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({
    name: '法务合同知识库',
    description: '管理企业合同相关的知识库内容',
    embeddingModel: 'BGE-M3',
    chunkStrategy: '法律分块',
  });

  return (
    <div className="glass-card p-6 max-w-lg !rounded-xl">
      <h3 className="text-sm font-semibold text-white/60 mb-5">知识库配置</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">知识库名称</label>
          <input type="text" value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} className="glass-input" />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">描述</label>
          <textarea value={settings.description} onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} rows={3} className="glass-input resize-none" />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">嵌入模型</label>
          <select className="glass-select" value={settings.embeddingModel} onChange={e => setSettings(s => ({ ...s, embeddingModel: e.target.value }))}>
            <option>BGE-M3</option>
            <option>text-embedding-3-large</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">分块策略</label>
          <select className="glass-select" value={settings.chunkStrategy} onChange={e => setSettings(s => ({ ...s, chunkStrategy: e.target.value }))}>
            <option>法律分块</option>
            <option>通用分块</option>
            <option>论文分块</option>
          </select>
        </div>
        <button onClick={() => alert('设置已保存')} className="neon-button-primary w-full">保存设置</button>
      </div>
    </div>
  );
}
