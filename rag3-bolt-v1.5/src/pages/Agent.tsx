import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Play, Square, Save, History, Upload, RefreshCw, Search, ChevronDown,
  X, RotateCcw, Copy, Share2, LayoutTemplate, Edit3,
  CheckCircle2, Circle, AlertCircle, Download, Redo2
} from 'lucide-react';
import { AgentNodePropertyPanel } from '../components/AgentNodePropertyPanel';
import {
  AGENTS_LIST, AGENT_TEMPLATES, NODE_PALETTE, DEFAULT_AGENT_NODES, DEFAULT_AGENT_EDGES,
  AGENT_VERSIONS, RUN_SEQUENCE, MOCK_RUN_LOG, DATAFLOW_STEPS,
  type AgentItem, type AgentFlowNode, type AgentFlowEdge, type DataflowStep,
} from '../data/agentMock';

type RunStatus = 'idle' | 'saving' | 'running' | 'success' | 'failed';
type ListSort = 'updated' | 'name' | 'runs';

const STATUS_MAP = {
  active: { label: '运行中', dot: '🟢', cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30' },
  idle: { label: '空闲', dot: '⚪', cls: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800' },
  draft: { label: '草稿', dot: '🟡', cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
};

interface AgentPageProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function AgentPage({ onNavigate }: AgentPageProps) {
  const [agents, setAgents] = useState(AGENTS_LIST);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const [listQuery, setListQuery] = useState('');
  const [listSort, setListSort] = useState<ListSort>('updated');
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<'Agent' | 'Pipeline'>('Pipeline');
  const [toast, setToast] = useState<string | null>(null);

  const [nodes, setNodes] = useState<AgentFlowNode[]>(DEFAULT_AGENT_NODES);
  const [edges] = useState<AgentFlowEdge[]>(DEFAULT_AGENT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [activeRunNode, setActiveRunNode] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<typeof MOCK_RUN_LOG>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showDataflow, setShowDataflow] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>('s3');
  const [testInput, setTestInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const runTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredAgents = agents
    .filter(a => !listQuery.trim() || a.name.includes(listQuery) || a.desc.includes(listQuery))
    .sort((a, b) => {
      if (listSort === 'name') return a.name.localeCompare(b.name, 'zh');
      if (listSort === 'runs') return b.runs - a.runs;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const selectedStep = DATAFLOW_STEPS.find(s => s.id === selectedStepId);

  const clearRunTimers = () => {
    runTimerRef.current.forEach(t => clearTimeout(t));
    runTimerRef.current = [];
  };

  useEffect(() => () => clearRunTimers(), []);

  const openEditor = (agentId: string) => {
    setSelectedAgentId(agentId);
    setNodes([...DEFAULT_AGENT_NODES]);
    setSelectedNodeId(null);
    setRunStatus('idle');
    setRunLogs([]);
    setActiveRunNode(null);
    setDirty(false);
    setShowDataflow(false);
  };

  const handleSave = async () => {
    if (runStatus === 'running') return;
    setRunStatus('saving');
    await new Promise(r => setTimeout(r, 600));
    setRunStatus('idle');
    setDirty(false);
    showToast('画布已保存');
  };

  const simulateRun = useCallback((input?: string, agentId?: string) => {
    if (runStatus === 'running' || runStatus === 'saving') return;
    const aid = agentId ?? selectedAgentId;
    clearRunTimers();
    setRunStatus('running');
    setRunLogs([]);
    setActiveRunNode(null);
    setShowDataflow(false);

    RUN_SEQUENCE.forEach((nodeId, i) => {
      const t = setTimeout(() => {
        setActiveRunNode(nodeId);
        if (MOCK_RUN_LOG[i]) setRunLogs(prev => [...prev, MOCK_RUN_LOG[i]]);
      }, (i + 1) * 700);
      runTimerRef.current.push(t);
    });

    const done = setTimeout(() => {
      setRunStatus('success');
      setActiveRunNode(null);
      setShowDataflow(true);
      setSelectedStepId('s3');
      if (aid) {
        setAgents(prev => prev.map(a =>
          a.id === aid ? { ...a, runs: a.runs + 1, lastRun: '刚刚', status: 'active' as const } : a
        ));
      }
    }, RUN_SEQUENCE.length * 700 + 400);
    runTimerRef.current.push(done);
  }, [runStatus, selectedAgentId]);

  const handleStop = () => {
    clearRunTimers();
    setRunStatus('idle');
    setActiveRunNode(null);
    setRunLogs(prev => [...prev, { ts: '—', message: '运行已停止', level: 'error' }]);
  };

  const handleCreate = () => {
    if (!createName.trim()) { showToast('请输入 Agent 名称'); return; }
    const newAgent: AgentItem = {
      id: `a-${Date.now()}`,
      name: createName.trim(),
      desc: '自定义 Agent 流水线',
      icon: '🤖',
      type: createType,
      status: 'draft',
      runs: 0,
      lastRun: '—',
      version: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setAgents(prev => [newAgent, ...prev]);
    setShowCreate(false);
    setCreateName('');
    showToast('Agent 已创建');
    openEditor(newAgent.id);
  };

  const updateNode = (node: AgentFlowNode) => {
    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
    setDirty(true);
  };

  /* ── 列表页 ── */
  if (!selectedAgentId) {
    return (
      <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {toast && <Toast msg={toast} />}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Agent 编排</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">构建多步推理 Pipeline，支持 RAG 3.0 扩展节点</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              <LayoutTemplate size={16} /> 模板库
            </button>
            <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus size={16} /> 新建
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={listQuery} onChange={e => setListQuery(e.target.value)} placeholder="搜索 Agent…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <select value={listSort} onChange={e => setListSort(e.target.value as ListSort)} className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
              <option value="updated">最近更新</option>
              <option value="name">名称</option>
              <option value="runs">运行次数</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">最近运行</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(agent => {
                const st = STATUS_MAP[agent.status];
                return (
                  <tr key={agent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</p>
                          <p className="text-[10px] text-gray-400">v{agent.version} · {agent.runs} 次运行</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{agent.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{agent.lastRun}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.dot} {st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEditor(agent.id)} className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                          <Edit3 size={11} className="inline mr-1" />编辑
                        </button>
                        {agent.status !== 'draft' && (
                          <button type="button" onClick={() => { openEditor(agent.id); setTimeout(() => simulateRun(undefined, agent.id), 300); }} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <Play size={11} className="inline mr-1" />运行
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showCreate && <CreateModal name={createName} setName={setCreateName} type={createType} setType={setCreateType} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} onUse={() => { setShowTemplates(false); setShowCreate(true); showToast('已选择模板，请填写名称'); }} />}
      </div>
    );
  }

  const agent = selectedAgent!;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {toast && <Toast msg={toast} />}

      {/* 顶栏 */}
      <header className="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
        <button type="button" onClick={() => { setSelectedAgentId(null); clearRunTimers(); }} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">← 返回</button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{agent.icon} {agent.name}</span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">v{agent.version}</span>
        {dirty && <span className="text-[10px] text-amber-600">未保存</span>}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <IconBtn icon={<RotateCcw size={13} />} label="撤销" onClick={() => showToast('撤销（占位）')} />
          <IconBtn icon={<Copy size={13} />} label="复制" onClick={() => showToast('已复制画布')} />
          <IconBtn icon={<Share2 size={13} />} label="分享" onClick={() => showToast('分享链接已复制')} />
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
          <button type="button" onClick={() => setShowVersions(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
            <History size={12} /> 版本历史
          </button>
          <button type="button" onClick={handleSave} disabled={runStatus === 'running' || runStatus === 'saving'} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
            {runStatus === 'saving' ? <><RefreshCw size={12} className="animate-spin" /> 保存中</> : <><Save size={12} /> 保存</>}
          </button>
          <button type="button" onClick={() => showToast('已提交发布审核')} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Upload size={12} /> 发布
          </button>
          {runStatus === 'running' ? (
            <button type="button" onClick={handleStop} className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50">
              <Square size={11} /> 停止
            </button>
          ) : (
            <button type="button" onClick={() => simulateRun(testInput)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 font-medium">
              <Play size={11} /> 运行
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 节点库 */}
        <aside className="w-44 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto p-2">
          {NODE_PALETTE.map(group => (
            <div key={group.group} className="mb-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 mb-1.5">{group.group}</p>
              {group.items.map(item => (
                <div
                  key={item.type}
                  draggable
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab text-xs ${item.color}`}
                  onClick={() => showToast(`拖拽添加 ${item.label} 节点（占位）`)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* 画布 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 relative overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((e, i) => {
                const from = nodes.find(n => n.id === e.from)!;
                const to = nodes.find(n => n.id === e.to)!;
                const x1 = from.x + 112, y1 = from.y + 28;
                const x2 = to.x, y2 = to.y + 28;
                const cx = (x1 + x2) / 2;
                const active = activeRunNode === e.from || activeRunNode === e.to;
                return (
                  <path
                    key={i}
                    d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                    stroke={active ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={active ? 2.5 : 1.5}
                    fill="none"
                    markerEnd="url(#agent-arrow)"
                  />
                );
              })}
              <defs>
                <marker id="agent-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>

            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isRunning = activeRunNode === node.id;
              const isFailed = runStatus === 'failed' && node.id === 'n3';
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                  className={`absolute w-28 border-2 rounded-xl p-2 select-none transition-all shadow-sm hover:shadow-md text-left ${node.color} ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-950' : ''
                  } ${isRunning ? 'ring-2 ring-green-500 animate-pulse' : ''} ${isFailed ? 'ring-2 ring-red-500' : ''}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="text-center pointer-events-none">
                    <div className="text-xl mb-1">{node.icon}</div>
                    <div className="text-[11px] font-semibold">{node.label}</div>
                    <div className="text-[9px] opacity-60">{node.type}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 运行日志 */}
          <div className="h-24 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden flex flex-col">
            <div className="px-3 py-1 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">运行日志</span>
              {runStatus === 'success' && (
                <button type="button" onClick={() => setShowDataflow(true)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                  <CheckCircle2 size={10} /> 查看 Dataflow 结果
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1.5 font-mono text-[10px] space-y-0.5">
              {runLogs.length === 0 ? (
                <span className="text-gray-400">点击「运行」开始 Pipeline 执行…</span>
              ) : (
                runLogs.map((log, i) => (
                  <div key={i} className={log.level === 'success' ? 'text-green-600' : log.level === 'error' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}>
                    [{log.ts}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <aside className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col overflow-hidden">
          {selectedNode ? (
            <AgentNodePropertyPanel
              node={selectedNode}
              onChange={updateNode}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : (
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">测试运行</h3>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder='输入测试 query，如："违约金如何计算"'
                rows={4}
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => simulateRun(testInput)}
                disabled={runStatus === 'running'}
                className="py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {runStatus === 'running' ? <><RefreshCw size={12} className="animate-spin" /> 运行中…</> : <><Play size={12} /> 运行测试</>}
              </button>
              {runStatus === 'success' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 mb-1">✅ 运行成功 · 4.2s</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    违约金日 0.5%，上限 20%，超 30 日可解除合同。[来源: 供应商合同模板V5.pdf §5.1]
                  </p>
                </div>
              )}
              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-500 mb-2">画布信息</p>
                <div className="text-[10px] text-gray-500 space-y-1">
                  <p>节点: {nodes.length} · 连线: {edges.length}</p>
                  <p>类型: {agent.type} · 状态: {STATUS_MAP[agent.status].label}</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 版本历史抽屉 */}
      {showVersions && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowVersions(false)} />
          <div className="relative w-96 bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">版本历史</h2>
              <button type="button" onClick={() => setShowVersions(false)} className="text-gray-400"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(AGENT_VERSIONS[agent.id] ?? [{ version: 1, date: '—', author: '系统', change: '初始版本', current: true }]).map(v => (
                <div key={v.version} className={`p-3 rounded-xl border ${v.current ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">v{v.version}</span>
                    {v.current ? (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded-full">当前</span>
                    ) : (
                      <button type="button" onClick={() => showToast(`已回滚至 v${v.version}`)} className="text-[10px] text-blue-600 hover:underline">回滚</button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{v.date} · {v.author}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">变更: {v.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dataflow 结果 */}
      {showDataflow && (
        <DataflowResultModal
          steps={DATAFLOW_STEPS}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
          selectedStep={selectedStep}
          agentVersion={agent.version}
          onClose={() => setShowDataflow(false)}
          onRerun={() => { setShowDataflow(false); simulateRun(testInput); }}
        />
      )}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed top-4 right-4 z-[60] px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">
      {msg}
    </div>
  );
}

function IconBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
      {icon}
    </button>
  );
}

function CreateModal({ name, setName, type, setType, onClose, onCreate }: {
  name: string; setName: (v: string) => void;
  type: 'Agent' | 'Pipeline'; setType: (v: 'Agent' | 'Pipeline') => void;
  onClose: () => void; onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between">
          <h2 className="text-base font-bold">新建 Agent</h2>
          <button type="button" onClick={onClose} className="text-gray-400"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">名称</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="合同审查 Agent" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">类型</label>
            <div className="flex gap-3">
              {(['Pipeline', 'Agent'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={type === t} onChange={() => setType(t)} className="text-blue-600" />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">取消</button>
          <button type="button" onClick={onCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建</button>
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ onClose, onUse }: { onClose: () => void; onUse: (id: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between">
          <h2 className="text-base font-bold">模板库</h2>
          <button type="button" onClick={onClose} className="text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {AGENT_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onUse(tpl.id)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="text-2xl mb-2">{tpl.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{tpl.desc}</p>
              <p className="text-[10px] text-gray-400 mt-2">{tpl.nodes} 个节点</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataflowResultModal({ steps, selectedStepId, onSelectStep, selectedStep, agentVersion, onClose, onRerun }: {
  steps: DataflowStep[];
  selectedStepId: string;
  onSelectStep: (id: string) => void;
  selectedStep?: DataflowStep;
  agentVersion: number;
  onClose: () => void;
  onRerun: () => void;
}) {
  const totalMs = steps.reduce((s, st) => s + st.durationMs, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Pipeline 运行结果</h2>
            <p className="text-xs text-gray-500 mt-0.5">run_20260606_100001 · Agent v{agentVersion}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onRerun} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <Redo2 size={12} /> 重跑
            </button>
            <button type="button" onClick={() => {}} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <Download size={12} /> 导出
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>

        <div className="px-5 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex gap-4 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
          <span>✅ 成功</span>
          <span>总耗时: {(totalMs / 1000).toFixed(1)}s</span>
          <span>触发: 手动</span>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Timeline */}
          <div className="w-56 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-3">DataflowTimeline</p>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  className={`w-full text-left flex gap-2 py-2 ${selectedStepId === step.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className="flex flex-col items-center flex-shrink-0">
                    {step.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : step.status === 'error' ? (
                      <AlertCircle size={14} className="text-red-500" />
                    ) : (
                      <Circle size={14} className="text-gray-400" />
                    )}
                    {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-0.5 min-h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${selectedStepId === step.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{step.label}</p>
                    <p className="text-[10px] text-gray-400">{step.durationMs}ms</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 节点详情 */}
          <div className="flex-1 overflow-y-auto p-5">
            {selectedStep ? (
              <>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">节点详情 — {selectedStep.label}</h3>
                {selectedStep.input && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-500 mb-1">输入</p>
                    <p className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-700 dark:text-gray-300">{selectedStep.input}</p>
                  </div>
                )}
                {selectedStep.output && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-500 mb-1">输出</p>
                    <p className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-700 dark:text-gray-300">{selectedStep.output}</p>
                  </div>
                )}
                {selectedStep.chunks && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 mb-2">召回 Chunk</p>
                    <div className="space-y-2">
                      {selectedStep.chunks.map(c => (
                        <div key={c.rank} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                          <span className="text-gray-700 dark:text-gray-300">#{c.rank} {c.doc} P{c.page}</span>
                          <span className="text-gray-500">{(c.score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">选择左侧节点查看详情</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
