import React from 'react';
import { Circle, Wifi, Shield, Activity } from 'lucide-react';

export default function StatusBar() {
  return (
    <div className="h-8 glass-panel flex items-center justify-between px-5 text-xs border-t border-white/5 relative z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="glow-dot-green" />
          <span className="text-emerald-400/80">已连接</span>
        </div>
        <span className="text-white/15">|</span>
        <div className="flex items-center gap-1.5 text-white/30">
          <Shield size={10} />
          <span>SSL</span>
        </div>
        <span className="text-white/15">|</span>
        <div className="flex items-center gap-1.5 text-white/30">
          <Activity size={10} />
          <span>PROD</span>
        </div>
        <span className="text-white/15">|</span>
        <span className="text-white/30">v3.0.1-beta</span>
      </div>
      <div className="flex items-center gap-3 text-white/20">
        <span>Latency: 12ms</span>
        <span className="text-white/15">|</span>
        <span>2026 RAG 3.0</span>
      </div>
    </div>
  );
}
