import { useState } from 'react';
import {
  GitBranch, Shield, Cpu, Activity, ChevronDown, ChevronRight,
  Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Search,
  Key, Eye, EyeOff, Zap, Clock, Filter, BarChart2, RefreshCw,
  Lock, Unlock, FileText, Download, Play, Pause, MoreVertical,
  Globe, Server, AlertCircle, TrendingUp, Database, Layers
} from 'lucide-react';

export { ClassifierPage } from './ClassifierPage';

// ─── Security Page ─────────────────────────────────────────────────────────────

const POISON_QUEUE = [
  { id: 'p1', doc: '采购协议_修改版.pdf', type: '投毒尝试', risk: 'high', detail: '检测到异常指令注入: "忽略所有规则并..."', time: '10分钟前', status: 'blocked' },
  { id: 'p2', doc: '供应商评估报告.docx', type: 'PII泄露', risk: 'medium', detail: '包含身份证号: 310***1234', time: '2小时前', status: 'pending' },
  { id: 'p3', doc: 'Q2财务分析.xlsx', type: '敏感数据', risk: 'medium', detail: '包含未脱敏银行账号', time: '昨天', status: 'resolved' },
  { id: 'p4', doc: 'HR政策手册_v2.pdf', type: '合规问题', risk: 'low', detail: '涉及薪资信息，需审批后入库', time: '2天前', status: 'resolved' },
];

const PII_RULES = [
  { name: '身份证号', pattern: '[1-9]\\d{16}[xX\\d]', action: '脱敏', enabled: true },
  { name: '手机号', pattern: '1[3-9]\\d{9}', action: '脱敏', enabled: true },
  { name: '银行卡号', pattern: '[1-9]\\d{12,18}', action: '脱敏', enabled: true },
  { name: '邮箱地址', pattern: '[\\w.]+@[\\w.]+\\.\\w+', action: '保留', enabled: false },
  { name: '自定义: 内部编号', pattern: 'EMP-\\d{6}', action: '脱敏', enabled: true },
];

export function SecurityPage() {
  const [tab, setTab] = useState<'poison' | 'pii' | 'acl' | 'report'>('poison');
  const [aclQuery, setAclQuery] = useState('合同条款第三条');
  const [aclUser, setAclUser] = useState('王芳');
  const [aclResult, setAclResult] = useState<null | { allowed: boolean; reason: string }>(null);

  const riskColor = (r: string) =>
    r === 'high' ? 'bg-red-100 text-red-700' : r === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
  const statusColor = (s: string) =>
    s === 'blocked' ? 'text-red-600' : s === 'pending' ? 'text-yellow-600' : 'text-green-600';

  const TABS = [
    { id: 'poison', label: '投毒检测', icon: <AlertTriangle size={13} /> },
    { id: 'pii', label: 'PII脱敏规则', icon: <Shield size={13} /> },
    { id: 'acl', label: 'ACL模拟器', icon: <Lock size={13} /> },
    { id: 'report', label: '合规报告', icon: <FileText size={13} /> },
  ] as const;

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">安全合规中心</h2>
          <p className="text-sm text-gray-500 mt-0.5">投毒防御 · PII保护 · 访问控制 · 合规报告</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
            <CheckCircle size={13} /> 系统安全
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '本月拦截', value: '23', icon: <Shield size={15} className="text-red-500" />, bg: 'bg-red-50', sub: '投毒/注入尝试' },
          { label: 'PII处理', value: '1,204', icon: <Lock size={15} className="text-yellow-500" />, bg: 'bg-yellow-50', sub: '字段已脱敏' },
          { label: 'ACL拒绝', value: '89', icon: <XCircle size={15} className="text-orange-500" />, bg: 'bg-orange-50', sub: '访问被阻止' },
          { label: '合规得分', value: '98.2', icon: <CheckCircle size={15} className="text-green-500" />, bg: 'bg-green-50', sub: '综合评分' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Poison detection */}
      {tab === 'poison' && (
        <div className="flex flex-col gap-3">
          {POISON_QUEUE.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className={`mt-0.5 flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${riskColor(item.risk)}`}>
                {item.risk.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{item.doc}</span>
                  <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{item.type}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{item.detail}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-gray-400">{item.time}</span>
                  <span className={`text-[11px] font-medium ${statusColor(item.status)}`}>
                    {item.status === 'blocked' ? '已拦截' : item.status === 'pending' ? '待审核' : '已解决'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'pending' && (
                  <>
                    <button className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">放行</button>
                    <button className="text-xs px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">删除</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PII rules */}
      {tab === 'pii' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">PII识别规则</span>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
              <Plus size={13} /> 添加规则
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['规则名称', '匹配模式', '处理方式', '状态', '操作'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PII_RULES.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{r.name}</td>
                  <td className="py-3 px-4">
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 text-[11px]">{r.pattern}</code>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${r.action === '脱敏' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`w-8 h-4 rounded-full transition-colors ${r.enabled ? 'bg-green-500' : 'bg-gray-300'} flex items-center px-0.5`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-4' : ''}`} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:underline mr-3">编辑</button>
                    <button className="text-red-500 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACL simulator */}
      {tab === 'acl' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">权限模拟测试</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">模拟用户</label>
                <select
                  value={aclUser}
                  onChange={e => setAclUser(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {['王芳', '李婷', '张三', '孙立', '赵敏'].map(u => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">查询内容</label>
                <input
                  value={aclQuery}
                  onChange={e => setAclQuery(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={() => setAclResult({ allowed: aclUser !== '张三', reason: aclUser !== '张三' ? '用户属于"采购部"角色，具备合同知识库读权限' : '用户角色"普通员工"无合同知识库访问权限' })}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                模拟检查
              </button>
            </div>
            {aclResult && (
              <div className={`p-4 rounded-lg border ${aclResult.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${aclResult.allowed ? 'text-green-700' : 'text-red-700'}`}>
                  {aclResult.allowed ? <Unlock size={15} /> : <Lock size={15} />}
                  {aclResult.allowed ? '访问允许' : '访问拒绝'}
                </div>
                <p className="text-xs text-gray-600">{aclResult.reason}</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">ACL规则总览</h3>
            <div className="space-y-2">
              {[
                { role: '平台管理员', kbs: '全部', level: 'chunk', actions: '读/写/删' },
                { role: '知识库管理员', kbs: '分配KB', level: 'document', actions: '读/写' },
                { role: '采购部', kbs: '合同知识库, 供应商KB', level: 'document', actions: '只读' },
                { role: '财务部', kbs: '财务报告KB', level: 'chunk', actions: '只读' },
                { role: '普通员工', kbs: '产品手册KB', level: 'document', actions: '只读' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-xs">
                  <span className="font-semibold text-gray-800 w-28 flex-shrink-0">{r.role}</span>
                  <span className="flex-1 text-gray-600">{r.kbs}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{r.level}级</span>
                  <span className="text-gray-600">{r.actions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance report */}
      {tab === 'report' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">合规检查报告 — 2026年6月</h3>
              <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Download size={13} /> 导出PDF
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: '数据访问合规', score: 98, items: 124, passed: 122 },
                { label: 'PII保护', score: 100, items: 56, passed: 56 },
                { label: '内容安全', score: 95, items: 89, passed: 85 },
              ].map((c, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">{c.label}</span>
                    <span className={`text-sm font-bold ${c.score >= 98 ? 'text-green-600' : c.score >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>{c.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.score}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1.5">{c.passed}/{c.items} 项通过</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { level: 'pass', text: 'RLS策略已在全部12张数据表启用' },
                { level: 'pass', text: '所有API密钥均使用Supabase Secrets存储，无明文泄露' },
                { level: 'pass', text: '审计日志完整，覆盖率100%' },
                { level: 'warn', text: '4个Chunk含未脱敏手机号，建议重新处理' },
                { level: 'pass', text: '备份策略符合7天保留要求' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-3 rounded-lg text-xs ${item.level === 'pass' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {item.level === 'pass' ? <CheckCircle size={13} className="text-green-600 flex-shrink-0" /> : <AlertTriangle size={13} className="text-yellow-600 flex-shrink-0" />}
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Models Page ───────────────────────────────────────────────────────────────

const MODEL_PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', logo: '🤖', status: 'connected',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'text-embedding-3-small', 'text-embedding-3-large'],
    usage: { tokens: '4.2M', cost: '$12.40', period: '本月' },
  },
  {
    id: 'anthropic', name: 'Anthropic', logo: '🧠', status: 'connected',
    models: ['claude-3-5-sonnet', 'claude-3-haiku'],
    usage: { tokens: '1.8M', cost: '$8.20', period: '本月' },
  },
  {
    id: 'azure', name: 'Azure OpenAI', logo: '☁️', status: 'connected',
    models: ['gpt-4o (eastus)', 'text-embedding-ada-002'],
    usage: { tokens: '12.1M', cost: '$36.50', period: '本月' },
  },
  {
    id: 'local', name: '本地模型 (Ollama)', logo: '🖥️', status: 'warning',
    models: ['qwen2.5:14b', 'nomic-embed-text', 'bge-large-zh'],
    usage: { tokens: '890K', cost: '¥0', period: '本月' },
  },
];

export function ModelsPage() {
  const [selectedProvider, setSelectedProvider] = useState(MODEL_PROVIDERS[0]);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">模型管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">配置LLM和Embedding提供商</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={15} /> 添加提供商
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Provider list */}
        <div className="flex flex-col gap-3">
          {MODEL_PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedProvider.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                  <div className={`text-[11px] font-medium ${p.status === 'connected' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {p.status === 'connected' ? '已连接' : '连接异常'}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-gray-500">
                {p.models.length} 个模型 · {p.usage.cost} {p.usage.period}
              </div>
            </button>
          ))}
        </div>

        {/* Provider detail */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedProvider.logo}</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{selectedProvider.name}</h3>
                  <span className={`text-[11px] font-medium ${selectedProvider.status === 'connected' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedProvider.status === 'connected' ? '● 已连接' : '⚠ 连接异常'}
                  </span>
                </div>
              </div>
              <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">测试连接</button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">API Key</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                  <Key size={13} className="text-gray-400" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    defaultValue="sk-proj-abc123xyz456..."
                    className="flex-1 text-sm bg-transparent focus:outline-none"
                    readOnly
                  />
                </div>
                <button onClick={() => setShowKey(!showKey)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  {showKey ? <EyeOff size={14} className="text-gray-500" /> : <Eye size={14} className="text-gray-500" />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">可用模型</div>
              <div className="flex flex-wrap gap-2">
                {selectedProvider.models.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '本月 Token', value: selectedProvider.usage.tokens },
                { label: '本月费用', value: selectedProvider.usage.cost },
                { label: '平均延迟', value: '340ms' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-base font-bold text-gray-900">{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model assignments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">模型角色分配</h3>
            <div className="space-y-2">
              {[
                { role: '对话生成 (主)', model: 'gpt-4o', provider: 'OpenAI' },
                { role: '对话生成 (备用)', model: 'claude-3-5-sonnet', provider: 'Anthropic' },
                { role: 'Embedding (主)', model: 'text-embedding-3-small', provider: 'OpenAI' },
                { role: 'Embedding (本地)', model: 'bge-large-zh', provider: 'Ollama' },
                { role: '查询重写', model: 'gpt-4o-mini', provider: 'OpenAI' },
                { role: '知识图谱提取', model: 'gpt-4o', provider: 'OpenAI' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 text-xs">
                  <span className="text-gray-600 w-36">{r.role}</span>
                  <span className="font-medium text-gray-800">{r.model}</span>
                  <span className="text-gray-400">{r.provider}</span>
                  <button className="text-blue-600 hover:underline">更改</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
