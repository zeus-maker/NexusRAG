import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, RefreshCw, Globe, Brain, Settings,
  ChevronRight, BookOpen, ArrowRight, X, Minimize2, Maximize2,
  GitBranch, Cpu, Zap, FileText, MessageSquare, Filter, Layers,
  RotateCcw, Copy, Share2, Play, Square, MoreHorizontal
} from 'lucide-react';
import { mockKBs } from '../mockData';

/* ──────────────────────────────────────────────
   SEARCH APP PAGE
────────────────────────────────────────────── */

const SEARCH_APPS = [
  { id: 's-001', name: '法律条款检索', kbs: ['法务合同知识库'], desc: '精确检索合同条款及法律规定', icon: '⚖️', queries: 1245 },
  { id: 's-002', name: '财务数据查询', kbs: ['财务报告知识库'], desc: '查询财务报告中的数字与指标', icon: '📊', queries: 876 },
  { id: 's-003', name: '合规政策检索', kbs: ['合规政策知识库'], desc: '搜索内部合规政策与监管要求', icon: '📋', queries: 543 },
];

const SEARCH_RESULTS = [
  { id: 1, title: '供应商违约金计算标准', doc: '供应商合同模板V5.pdf', page: 3, score: 0.956, summary: '供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金，累计不超过合同总额20%。', tags: ['违约金', '合同'] },
  { id: 2, title: '采购方验收权利与拒收条款', doc: '采购协议条款.docx', page: 8, score: 0.867, summary: '采购方有权对供应商提供的货物进行验收检查，不符合约定质量标准的，有权拒绝收货或要求更换。', tags: ['验收', '质量'] },
  { id: 3, title: '合同解除条件与程序', doc: '供应商合同模板V5.pdf', page: 4, score: 0.812, summary: '迟延交货超过三十日的，采购方有权以书面形式通知供应商解除合同并要求赔偿全部实际损失。', tags: ['合同解除', '程序'] },
];

interface SearchPageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof SEARCH_RESULTS | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showRelated, setShowRelated] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setAiSummary(null);
    setTimeout(() => {
      setResults(SEARCH_RESULTS);
      setAiSummary('根据检索结果，违约金相关条款主要集中在供应商合同模板V5.pdf第三章，规定了迟延交货违约金（日0.5%）、质量违约赔偿及合同解除条件。建议重点关注第5.1-5.3条。');
      setLoading(false);
      setShowRelated(true);
    }, 1000);
  };

  if (!selectedApp) {
    return (
      <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">搜索应用</h1>
            <p className="text-sm text-gray-500 mt-0.5">独立搜索应用，精准检索知识库内容</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> 新建搜索
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEARCH_APPS.map(app => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{app.icon}</div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{app.name}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{app.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {app.kbs.map(kb => (
                    <span key={kb} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{kb}</span>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400">{app.queries} 次查询</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all min-h-40"
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">新建搜索应用</span>
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold">新建搜索应用</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400">✕</button>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div><label className="text-xs font-medium text-gray-700 block mb-1">应用名称</label>
                  <input placeholder="输入搜索应用名称" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-medium text-gray-700 block mb-1">关联知识库</label>
                  {mockKBs.slice(0, 4).map(kb => (
                    <label key={kb.kb_id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm">{kb.icon} {kb.name}</span>
                    </label>
                  ))}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-gray-600 block mb-1">相似度阈值</label>
                    <input type="number" defaultValue="0.2" step="0.1" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg" /></div>
                  <div><label className="text-[10px] text-gray-600 block mb-1">结果数量</label>
                    <input type="number" defaultValue="10" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg" /></div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { l: '启用 Web 搜索', v: false },
                    { l: '启用 AI 摘要', v: true },
                    { l: '显示相关搜索', v: true },
                    { l: '启用思维导图', v: false },
                    { l: '高亮关键词', v: true },
                  ].map(opt => (
                    <label key={opt.l} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={opt.v} className="rounded text-blue-600" />
                      <span className="text-xs text-gray-700">{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const app = SEARCH_APPS.find(a => a.id === selectedApp)!;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
        <span className="text-gray-300">/</span>
        <span className="text-xl">{app.icon}</span>
        <span className="text-sm font-bold text-gray-900">{app.name}</span>
        <div className="flex gap-1 ml-2">
          {app.kbs.map(kb => <span key={kb} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{kb}</span>)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索知识库内容..."
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <button onClick={handleSearch} disabled={!query.trim() || loading} className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 font-medium text-sm">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : '搜索'}
            </button>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['违约金计算', '合同解除条件', '保密期限', '不可抗力'].map(s => (
              <button key={s} onClick={() => { setQuery(s); }} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors">{s}</button>
            ))}
          </div>
        </div>

        {results && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* AI summary */}
            {aiSummary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">AI 智能摘要</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
              </div>
            )}

            {/* Results */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">找到 <strong>{results.length}</strong> 条相关结果</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMindmap(p => !p)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${showMindmap ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Layers size={11} /> 思维导图
                </button>
              </div>
            </div>

            {showMindmap && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">思维导图</p>
                <div className="flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold mb-3">违约金</div>
                    <div className="flex gap-6 justify-center">
                      {['延迟交货\n日0.5%', '质量违约\n实际损失', '解约条件\n30日'].map((c, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-px h-5 bg-gray-300 mb-1"></div>
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 text-center whitespace-pre-line">{c}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {results.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">{r.title}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{(r.score * 100).toFixed(0)}% 相关</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{r.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><FileText size={10} />{r.doc} · P{r.page}</span>
                    {r.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{tag}</span>)}
                  </div>
                  <div className="flex gap-1.5">
                    <button className="text-[10px] text-blue-600 hover:underline">查看原文</button>
                    <button className="text-[10px] text-gray-500 hover:underline">引用</button>
                  </div>
                </div>
              </div>
            ))}

            {showRelated && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">相关搜索</p>
                <div className="flex flex-wrap gap-2">
                  {['合同违约金上限', '供应商迟延处理', '保证金扣除规则', '质量条款标准'].map(s => (
                    <button key={s} onClick={() => setQuery(s)} className="text-xs px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   AGENT EDITOR PAGE
────────────────────────────────────────────── */

const AGENTS_LIST = [
  { id: 'a-001', name: '合同审查助手', desc: '自动分析上传合同，提取关键条款并评估风险', icon: '⚖️', status: 'active', runs: 342 },
  { id: 'a-002', name: '财务报告分析', desc: '解析财务报告，生成关键指标摘要与趋势分析', icon: '📈', status: 'active', runs: 218 },
  { id: 'a-003', name: '合规政策审核', desc: '对比内部政策与监管要求，自动标注合规风险', icon: '🔍', status: 'draft', runs: 0 },
];

type AgentNode = {
  id: string;
  type: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  config?: string;
};

const AGENT_NODES: AgentNode[] = [
  { id: 'n1', type: 'start', label: '开始', icon: '▶', x: 60, y: 180, color: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'n2', type: 'retrieval', label: '检索 (RAG)', icon: '🔍', x: 220, y: 100, color: 'bg-blue-100 border-blue-400 text-blue-800', config: '知识库: 法务合同\n通道: PageIndex+向量\nTop-K: 5' },
  { id: 'n3', type: 'categorize', label: '分类路由', icon: '🔀', x: 220, y: 260, color: 'bg-purple-100 border-purple-400 text-purple-800', config: 'Tier1 → 直接回答\nTier2 → 深度检索\nTier3 → Agent工具' },
  { id: 'n4', type: 'wiki', label: 'Wiki 读取', icon: '📖', x: 420, y: 100, color: 'bg-teal-100 border-teal-400 text-teal-800', config: '层级: Layer2\n最大页面: 3' },
  { id: 'n5', type: 'llm', label: 'LLM 生成', icon: '🤖', x: 420, y: 260, color: 'bg-orange-100 border-orange-400 text-orange-800', config: '模型: DeepSeek-v4\n温度: 0.1\n最大Token: 2048' },
  { id: 'n6', type: 'end', label: '输出', icon: '■', x: 600, y: 180, color: 'bg-red-100 border-red-400 text-red-800' },
];

const EDGES = [
  { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' },
  { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n5' },
  { from: 'n4', to: 'n6' }, { from: 'n5', to: 'n6' },
];

interface AgentPageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function AgentPage({ onNavigate }: AgentPageProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleRun = () => {
    if (!testInput.trim()) return;
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setTestResult('根据知识图谱检索和LLM生成，供应商迟延交货违约金计算规则：日0.5%，上限20%，超过30日可解除合同。[来源: 供应商合同模板V5.pdf §5.1-5.2]');
    }, 1500);
  };

  if (!selectedAgent) {
    return (
      <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agent 应用</h1>
            <p className="text-sm text-gray-500 mt-0.5">构建多步推理的智能 Agent 流水线</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> 新建 Agent
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS_LIST.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{agent.icon}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {agent.status === 'active' ? '运行中' : '草稿'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{agent.name}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{agent.desc}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><GitBranch size={10} /> Pipeline 模式</span>
                <span>{agent.runs} 次运行</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all min-h-44"
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">新建 Agent</span>
          </button>
        </div>
      </div>
    );
  }

  const agent = AGENTS_LIST.find(a => a.id === selectedAgent)!;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => { setSelectedAgent(null); setSelectedNode(null); setTestResult(null); }} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-bold text-gray-900">{agent.icon} {agent.name}</span>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {[
            { icon: <RotateCcw size={13} />, label: '撤销' },
            { icon: <Copy size={13} />, label: '复制' },
            { icon: <Share2 size={13} />, label: '分享' },
            { icon: <Settings size={13} />, label: '设置' },
          ].map((btn, i) => (
            <button key={i} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={btn.label}>{btn.icon}</button>
          ))}
          <div className="h-4 w-px bg-gray-200 mx-1"></div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
            <Square size={11} /> 停止
          </button>
          <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 font-medium">
            <Play size={11} /> 运行
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          {/* Node palette */}
          <div className="absolute top-3 left-3 bg-white rounded-xl border border-gray-200 shadow-sm p-2 z-10">
            <p className="text-[10px] font-semibold text-gray-500 mb-2 px-1">节点库</p>
            {[
              { icon: '🔍', label: '检索', color: 'text-blue-600' },
              { icon: '🔀', label: '分类路由', color: 'text-purple-600' },
              { icon: '🤖', label: 'LLM', color: 'text-orange-600' },
              { icon: '📖', label: 'Wiki 读取', color: 'text-teal-600' },
              { icon: '🌳', label: 'PageIndex 树', color: 'text-green-600' },
              { icon: '🛠', label: '工具', color: 'text-gray-600' },
              { icon: '📝', label: '解析器', color: 'text-indigo-600' },
            ].map((n, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-grab text-xs ${n.color}`}>
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </div>

          {/* SVG edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {EDGES.map((e, i) => {
              const from = AGENT_NODES.find(n => n.id === e.from)!;
              const to = AGENT_NODES.find(n => n.id === e.to)!;
              const x1 = from.x + 60, y1 = from.y + 24;
              const x2 = to.x, y2 = to.y + 24;
              const cx = (x1 + x2) / 2;
              return (
                <path key={i} d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                  stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)"
                />
              );
            })}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          {AGENT_NODES.map(node => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              className={`absolute w-28 border-2 rounded-xl p-2 cursor-pointer select-none transition-all shadow-sm hover:shadow-md ${node.color} ${selectedNode?.id === node.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              style={{ left: node.x, top: node.y }}
            >
              <div className="text-center">
                <div className="text-xl mb-1">{node.icon}</div>
                <div className="text-[11px] font-semibold">{node.label}</div>
                <div className="text-[9px] opacity-60 capitalize">{node.type}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel: node config or test */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          {selectedNode ? (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">{selectedNode.label}</h3>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
              <p className="text-[10px] text-gray-500 mb-3 capitalize">类型: {selectedNode.type}</p>
              {selectedNode.config && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-semibold text-gray-600 mb-2">配置参数</p>
                  {selectedNode.config.split('\n').map((line, i) => {
                    const [k, v] = line.split(': ');
                    return (
                      <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                        <span className="text-[10px] text-gray-600">{k}</span>
                        <span className="text-[10px] font-medium text-gray-800">{v}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2">
                {selectedNode.type === 'retrieval' && (
                  <>
                    <div><label className="text-[10px] text-gray-600 block mb-0.5">知识库</label>
                      <select className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg">{mockKBs.slice(0, 3).map(k => <option key={k.kb_id}>{k.name}</option>)}</select></div>
                    <div><label className="text-[10px] text-gray-600 block mb-0.5">Top-K</label>
                      <input type="number" defaultValue="5" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg" /></div>
                  </>
                )}
                {selectedNode.type === 'llm' && (
                  <>
                    <div><label className="text-[10px] text-gray-600 block mb-0.5">模型</label>
                      <select className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"><option>DeepSeek-v4</option><option>gpt-4o</option></select></div>
                    <div><label className="text-[10px] text-gray-600 block mb-0.5">温度 (0-1)</label>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0.1" className="w-full" /></div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-800">测试运行</h3>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder="输入测试内容..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none resize-none"
              />
              <button onClick={handleRun} disabled={!testInput.trim() || running} className="py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
                {running ? <><RefreshCw size={12} className="animate-spin" /> 运行中...</> : <><Play size={12} /> 运行测试</>}
              </button>
              {testResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-green-700 mb-1">运行结果</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{testResult}</p>
                </div>
              )}
              <div className="mt-2 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 mb-2">流水线模式节点</p>
                {['Retrieval', 'Categorize', 'Tool', 'Parser', 'Wiki 读取', 'PageIndex 树'].map((n, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
