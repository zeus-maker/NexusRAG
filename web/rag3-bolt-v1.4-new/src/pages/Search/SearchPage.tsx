import React, { useState } from 'react';
import { Search, Sparkles, LinkIcon, FileText, ArrowLeft, Clock, Zap } from 'lucide-react';

interface SearchPageProps {
  searchId: string;
  onNavigate?: (page: string, id?: string) => void;
}

const mockResults = [
  {
    title: '供应商合同模板V5.pdf',
    snippet: '...供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。迟延超过30日的，采购方有权解除合同...',
    relevance: 0.956,
    source: '法务合同库',
    chunks: 186,
  },
  {
    title: '采购协议条款.pdf',
    snippet: '...违约金标准定义为合同金额的0.3%-0.5%，具体以双方协议为准...',
    relevance: 0.867,
    source: '法务合同库',
    chunks: 142,
  },
  {
    title: '供应商管理规范.docx',
    snippet: '...对于连续3次迟延交付的供应商，将触发供应商评级降级机制，评级从A降至B...',
    relevance: 0.723,
    source: '合规政策库',
    chunks: 98,
  },
];

export default function SearchPage({ searchId, onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [results, setResults] = useState(mockResults);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      {onNavigate && (
        <button onClick={() => onNavigate('search-list')} className="flex items-center gap-2 text-white/30 hover:text-white/60 mb-4 transition-colors">
          <ArrowLeft size={16} /> 返回搜索应用
        </button>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">合同条款快速检索</h1>
        <p className="text-white/40 text-sm">查询法务合同知识库 · 混合检索模式</p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-5 !rounded-xl mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-4 top-3.5 text-white/25" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入查询内容..."
            className="glass-input pl-11 py-3 text-base"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch} disabled={isSearching} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${isSearching ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' : 'neon-button-primary'}`}>
            <Search size={16} /> {isSearching ? '搜索中...' : '搜索'}
          </button>
          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
              showAI ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan' : 'neon-button-ghost'
            }`}
          >
            <Sparkles size={16} /> AI 摘要
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {showAI && (
        <div className="glass-card p-5 !rounded-xl mb-6 border-neon-cyan/10 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-neon-cyan" />
            <span className="text-sm font-semibold text-neon-cyan/80">AI 生成摘要</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            根据检索结果，供应商违约金的计算主要依据合同模板V5第五条：按迟延交付货物价值的千分之五每日计收。超过30日迟延，采购方可解除合同。此外，采购协议中将违约金比例设定在合同金额的0.3%-0.5%区间。
          </p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {isSearching ? (
          <div className="glass-card p-8 !rounded-xl text-center">
            <div className="typing-indicator inline-flex items-center gap-0.5 mb-2">
              <span /><span /><span />
            </div>
            <p className="text-xs text-white/30">正在检索...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/30">找到 {results.length} 条结果</span>
              <span className="text-xs text-white/20">耗时 {(Math.random() * 200 + 80).toFixed(0)}ms</span>
            </div>
            {results.map((result, idx) => (
          <div key={idx} className="glass-card p-5 !rounded-xl cursor-pointer animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-neon-cyan/50" />
                <h3 className="text-sm font-semibold text-white/80 hover:text-neon-cyan transition-colors">{result.title}</h3>
              </div>
              <span className="text-xs font-mono text-neon-cyan/60">{(result.relevance * 100).toFixed(1)}%</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-3">{result.snippet}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white/25">
                <span>{result.source}</span>
                <span>·</span>
                <span>{result.chunks} 块</span>
              </div>
              <button className="flex items-center gap-1 text-neon-cyan/50 hover:text-neon-cyan text-xs transition-colors">
                <LinkIcon size={12} /> 查看原文
              </button>
            </div>
          </div>
        ))}
          </>
        ) : !isSearching && query ? (
          <div className="glass-card p-8 !rounded-xl text-center">
            <Search size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">输入查询词后点击搜索</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
