import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Globe, ChevronDown, Zap, X } from 'lucide-react';

export default function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-14 glass-panel flex items-center justify-between px-5 relative z-20 border-b border-white/5">
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
          <Search className={`absolute left-3 top-2.5 transition-colors duration-200 ${searchFocused ? 'text-neon-cyan' : 'text-white/30'}`} size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="全局搜索知识库、文档、对话..."
            className={`w-full pl-9 pr-8 py-2 rounded-lg text-sm transition-all duration-200 ${
              searchFocused
                ? 'bg-white/10 border border-neon-cyan/40 shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                : 'bg-white/5 border border-white/5'
            } text-white/90 placeholder-white/25 outline-none`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-4">
        <button className="p-2 text-white/40 hover:text-neon-cyan hover:bg-white/5 rounded-lg transition-all duration-200 relative group">
          <Bell size={18} />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-orange glow-dot-yellow" />
        </button>
        <button className="p-2 text-white/40 hover:text-neon-cyan hover:bg-white/5 rounded-lg transition-all duration-200">
          <HelpCircle size={18} />
        </button>
        <button className="p-2 text-white/40 hover:text-neon-cyan hover:bg-white/5 rounded-lg transition-all duration-200">
          <Globe size={18} />
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 group">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
               style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            李
          </div>
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">李婷</span>
          <ChevronDown size={14} className="text-white/30" />
        </button>
      </div>
    </div>
  );
}
