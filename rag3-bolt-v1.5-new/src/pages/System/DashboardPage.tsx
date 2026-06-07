import React, { useState } from 'react';
import { Settings, Users, Lock, Database, Code, Bell, ChevronRight, Shield, Activity, Key, GitBranch, Server, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface SystemPageProps {
  onNavigate?: (page: string, id?: string) => void;
}

const subPages = [
  { id: 'users', label: '用户管理', description: '管理系统用户、角色和权限', icon: Users, color: '#06b6d4', count: '24 用户' },
  { id: 'security', label: '安全与合规', description: '安全策略、PII脱敏、合规规则', icon: Lock, color: '#10b981', count: '12 规则' },
  { id: 'datasources', label: '数据源', description: '管理知识库数据源和连接', icon: Database, color: '#8b5cf6', count: '6 数据源' },
  { id: 'api', label: 'API 设置', description: 'API 密钥、Webhook和集成配置', icon: Code, color: '#f59e0b', count: '8 密钥' },
  { id: 'pipeline', label: '流水线配置', description: '配置处理流水线和调度规则', icon: GitBranch, color: '#ec4899', count: '4 流水线' },
  { id: 'monitoring', label: '监控告警', description: '系统监控、日志和告警规则', icon: Bell, color: '#ef4444', count: '5 告警' },
];

export default function SystemPage({ onNavigate }: SystemPageProps) {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  const renderSubPage = () => {
    switch (activeSubPage) {
      case 'users': return <UsersPage />;
      case 'security': return <SecurityPage />;
      case 'datasources': return <DataSourcesPage />;
      case 'api': return <APIPage />;
      case 'pipeline': return <PipelineConfigPage />;
      case 'monitoring': return <MonitoringPage />;
      default: return null;
    }
  };

  if (activeSubPage) {
    return (
      <div className="p-6 animate-fade-in">
        <button
          onClick={() => setActiveSubPage(null)}
          className="flex items-center gap-2 text-white/30 hover:text-white/60 mb-4 transition-colors text-sm"
        >
          ← 返回系统管理
        </button>
        {renderSubPage()}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">系统管理</h1>
        <p className="text-white/40 text-sm mt-1">配置和管理 RAG 3.0 系统基础设施</p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '系统状态', value: '正常', icon: CheckCircle, color: '#10b981' },
          { label: '在线用户', value: '12', icon: Users, color: '#06b6d4' },
          { label: 'CPU 使用', value: '34%', icon: Server, color: '#8b5cf6' },
          { label: '内存使用', value: '62%', icon: Activity, color: '#f59e0b' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color: stat.color, opacity: 0.6 }} />
                <div>
                  <div className="text-base font-bold text-white/80">{stat.value}</div>
                  <div className="text-[10px] text-white/30">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-pages Grid */}
      <div className="grid grid-cols-2 gap-4">
        {subPages.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSubPage(section.id)}
              className="glass-card p-5 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg border" style={{ background: `${section.color}10`, borderColor: `${section.color}20` }}>
                  <Icon size={22} style={{ color: section.color, opacity: 0.7 }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{section.label}</h3>
                    <ChevronRight size={16} className="text-white/10 group-hover:text-neon-cyan transition-colors" />
                  </div>
                  <p className="text-xs text-white/30 mt-1">{section.description}</p>
                  <p className="text-[10px] text-white/20 mt-2">{section.count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UsersPage() {
  const users = [
    { name: '李婷', role: '管理员', email: 'liting@company.com', status: 'active', lastLogin: '10分钟前' },
    { name: '王磊', role: '编辑者', email: 'wanglei@company.com', status: 'active', lastLogin: '2小时前' },
    { name: '张敏', role: '编辑者', email: 'zhangmin@company.com', status: 'active', lastLogin: '1天前' },
    { name: '赵鹏', role: '查看者', email: 'zhaopeng@company.com', status: 'inactive', lastLogin: '1周前' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">用户管理</h2>
        <button onClick={() => alert('添加用户（模拟）')} className="neon-button-primary flex items-center gap-2 text-sm">
          <Users size={16} /> 添加用户
        </button>
      </div>

      <div className="glass-card overflow-hidden !rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">用户</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">角色</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">邮箱</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">状态</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-white/40">最后登录</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center text-xs text-white/80 font-bold">
                      {user.name[0]}
                    </div>
                    <span className="text-sm text-white/80">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-white/50">{user.role}</td>
                <td className="px-5 py-3 text-sm text-white/40">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={user.status === 'active' ? 'neon-badge-active text-[10px]' : 'neon-badge-draft text-[10px]'}>
                    {user.status === 'active' ? '活跃' : '离线'}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-white/30">{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SecurityPage() {
  const [rules, setRules] = useState([
    { name: '手机号脱敏', enabled: true },
    { name: '身份证号脱敏', enabled: true },
    { name: '银行卡号脱敏', enabled: true },
    { name: '邮箱地址脱敏', enabled: false },
  ]);

  const toggleRule = (idx: number) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">安全与合规</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 !rounded-xl">
          <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400/60" /> PII 脱敏规则
          </h3>
          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div key={rule.name} className="flex items-center justify-between p-2 rounded hover:bg-white/[0.03] transition-colors">
                <span className="text-sm text-white/50">{rule.name}</span>
                <button
                  onClick={() => toggleRule(idx)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${rule.enabled ? 'bg-neon-cyan/30' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${rule.enabled ? 'right-0.5 bg-neon-cyan' : 'left-0.5 bg-white/40'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 !rounded-xl">
          <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400/60" /> 投毒检测
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">已拦截文档</span>
              <span className="text-white/70">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">检测模型</span>
              <span className="text-white/70">PoisonDetect-v2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">误报率</span>
              <span className="text-white/70">0.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourcesPage() {
  const sources = [
    { name: '法务合同库 (MinIO)', type: '对象存储', status: 'connected', lastSync: '5分钟前' },
    { name: '财务数据库 (PostgreSQL)', type: '数据库', status: 'connected', lastSync: '10分钟前' },
    { name: '外部API (天眼查)', type: 'API', status: 'connected', lastSync: '1小时前' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">数据源</h2>
        <button onClick={() => alert('添加数据源（模拟）')} className="neon-button-primary flex items-center gap-2 text-sm">
          <Database size={16} /> 添加数据源
        </button>
      </div>
      <div className="space-y-2">
        {sources.map((src) => (
          <div key={src.name} className="glass-card p-4 !rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-white/20" />
                <div>
                  <h3 className="text-sm font-medium text-white/70">{src.name}</h3>
                  <p className="text-xs text-white/30">{src.type} · 上次同步: {src.lastSync}</p>
                </div>
              </div>
              <span className="neon-badge-active text-[10px]">
                <div className="glow-dot-green" style={{ width: 5, height: 5 }} /> 已连接
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function APIPage() {
  const keys = [
    { name: '生产环境密钥', prefix: 'sk-prod-****', created: '6/1', lastUsed: '刚刚', status: 'active' },
    { name: '测试环境密钥', prefix: 'sk-test-****', created: '5/15', lastUsed: '3小时前', status: 'active' },
    { name: '旧版密钥', prefix: 'sk-old-****', created: '3/1', lastUsed: '1周前', status: 'expired' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">API 设置</h2>
        <button onClick={() => alert('新建密钥（模拟）')} className="neon-button-primary flex items-center gap-2 text-sm">
          <Key size={16} /> 新建密钥
        </button>
      </div>
      <div className="space-y-2">
        {keys.map((key) => (
          <div key={key.name} className="glass-card p-4 !rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key size={18} className="text-white/20" />
                <div>
                  <h3 className="text-sm font-medium text-white/70">{key.name}</h3>
                  <p className="text-xs text-white/30 font-mono">{key.prefix} · 创建: {key.created} · 上次使用: {key.lastUsed}</p>
                </div>
              </div>
              <span className={key.status === 'active' ? 'neon-badge-active text-[10px]' : 'neon-badge-draft text-[10px]'}>
                {key.status === 'active' ? '活跃' : '已过期'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineConfigPage() {
  const [config, setConfig] = useState({
    chunkStrategy: '通用分块',
    embeddingModel: 'BGE-M3',
    llmModel: 'GPT-4o',
    concurrency: 4,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">流水线配置</h2>
      <div className="glass-card p-5 !rounded-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-2">默认分块策略</label>
            <select className="glass-select" value={config.chunkStrategy} onChange={e => setConfig(c => ({ ...c, chunkStrategy: e.target.value }))}><option>通用分块</option><option>法律分块</option><option>论文分块</option></select>
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">默认嵌入模型</label>
            <select className="glass-select" value={config.embeddingModel} onChange={e => setConfig(c => ({ ...c, embeddingModel: e.target.value }))}><option>BGE-M3</option><option>text-embedding-3-large</option></select>
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">默认 LLM 模型</label>
            <select className="glass-select" value={config.llmModel} onChange={e => setConfig(c => ({ ...c, llmModel: e.target.value }))}><option>GPT-4o</option><option>Claude 3.5 Sonnet</option><option>Qwen-Max</option></select>
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">并发处理数</label>
            <input type="number" value={config.concurrency} onChange={e => setConfig(c => ({ ...c, concurrency: parseInt(e.target.value) || 1 }))} className="glass-input max-w-32" />
          </div>
          <button onClick={() => alert('流水线配置已保存')} className="neon-button-primary w-full">保存配置</button>
        </div>
      </div>
    </div>
  );
}

function MonitoringPage() {
  const [alerts, setAlerts] = useState([
    { label: 'CPU 告警', value: '> 80%', enabled: true },
    { label: '内存告警', value: '> 90%', enabled: true },
    { label: '错误率告警', value: '> 5%', enabled: true },
    { label: '延迟告警', value: '> 500ms', enabled: true },
    { label: '队列积压', value: '> 100', enabled: false },
  ]);

  const toggleAlert = (idx: number) => {
    setAlerts(prev => prev.map((a, i) => i === idx ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">监控告警</h2>

      <div className="grid grid-cols-3 gap-3">
        {alerts.map((alert, idx) => (
          <div key={alert.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">{alert.label}</span>
              <button
                onClick={() => toggleAlert(idx)}
                className={`w-8 h-4 rounded-full relative transition-colors ${alert.enabled ? 'bg-neon-cyan/30' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${alert.enabled ? 'right-0.5 bg-neon-cyan' : 'left-0.5 bg-white/40'}`} />
              </button>
            </div>
            <p className="text-xs text-white/30">阈值: {alert.value}</p>
          </div>
        ))}
      </div>

      {/* Recent alerts */}
      <div className="glass-card p-5 !rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-3">最近告警</h3>
        <div className="space-y-2">
          {[
            { time: '6/6 09:15', type: '警告', msg: '内存使用率 85%', level: 'warning' },
            { time: '6/5 22:30', type: '信息', msg: '索引任务完成', level: 'info' },
            { time: '6/5 18:00', type: '警告', msg: 'API 延迟升高至 520ms', level: 'warning' },
            { time: '6/4 14:20', type: '信息', msg: '系统备份完成', level: 'info' },
          ].map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-white/[0.03] transition-colors">
              <div className={`w-2 h-2 rounded-full ${alert.level === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'}`}
                   style={{ boxShadow: `0 0 8px ${alert.level === 'warning' ? 'rgba(245,158,11,0.4)' : 'rgba(0,240,255,0.4)'}` }} />
              <span className="text-xs text-white/30 w-16">{alert.time}</span>
              <span className="text-xs text-white/50 flex-1">{alert.msg}</span>
              <span className={`text-xs ${alert.level === 'warning' ? 'text-amber-400/60' : 'text-cyan-400/60'}`}>{alert.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
