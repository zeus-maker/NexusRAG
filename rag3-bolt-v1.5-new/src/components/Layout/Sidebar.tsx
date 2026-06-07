import React, { useState } from 'react';
import {
  Database,
  MessageCircle,
  Search,
  Settings,
  BarChart3,
  Home,
  ChevronDown,
  Zap,
  GitBranch,
  BookOpen,
  Network,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, id?: string) => void;
}

const navItems = [
  { id: 'home', label: '工作台', icon: Home },
  { id: 'kb-list', label: '知识库', icon: Database },
  { id: 'chat', label: '智能对话', icon: MessageCircle },
  { id: 'search-list', label: '搜索应用', icon: Search },
  { id: 'agent-list', label: 'Agent', icon: Zap },
  { id: 'evaluation', label: '评测中心', icon: BarChart3 },
  { id: 'system', label: '系统管理', icon: Settings },
];

const hubItems = [
  { id: 'wiki-hub', label: 'Wiki Hub', icon: BookOpen },
  { id: 'pageindex-hub', label: 'PageIndex Hub', icon: GitBranch },
  { id: 'graphrag-hub', label: 'GraphRAG Hub', icon: Network },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [showHubs, setShowHubs] = useState(false);

  return (
    <div className={`${expanded ? 'w-60' : 'w-16'} glass-panel transition-all duration-300 flex flex-col relative z-20`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-center px-4 border-b border-white/5">
        <div className={`flex items-center gap-2.5 ${!expanded && 'justify-center'}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center relative"
               style={{ background: 'linear-gradient(135deg, #00f0ff, #3b82f6)' }}>
            <Zap size={16} className="text-white" />
            <div className="absolute inset-0 rounded-lg animate-pulse-glow"
                 style={{ boxShadow: '0 0 12px rgba(0,240,255,0.4)' }} />
          </div>
          {expanded && (
            <div className="animate-fade-in">
              <span className="font-bold text-base text-white tracking-wide">RAG</span>
              <span className="font-bold text-base text-neon-cyan ml-1">3.0</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-neon-cyan'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''} />
                {expanded && <span className="flex-1 text-left text-sm">{item.label}</span>}
                {isActive && expanded && (
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse-glow"
                       style={{ boxShadow: '0 0 6px rgba(0,240,255,0.6)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Hub Section */}
        {expanded && (
          <div className="mt-4">
            <button
              onClick={() => setShowHubs(!showHubs)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              <span>RAG 3.0 增强层</span>
              <ChevronDown size={12} className={`transition-transform ${showHubs ? 'rotate-180' : ''}`} />
            </button>
            {showHubs && (
              <div className="space-y-0.5 mt-1 animate-slide-up">
                {hubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white/10 text-neon-cyan'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      <div className="w-1 h-1 rounded-full bg-neon-orange animate-pulse-glow" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-white/5 p-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          <ChevronDown size={18} className={`transition-transform duration-300 ${expanded ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </div>
    </div>
  );
}
