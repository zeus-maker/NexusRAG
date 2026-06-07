import { useState, type ReactNode } from 'react';
import {
  Shuffle, Route, Brain, Shield, FileText, Target, Play, RefreshCw, Save,
  Plus,   Zap, Activity, ExternalLink, AlertCircle, CheckCircle,
} from 'lucide-react';
import { HubBadge, HubStatCard, hubCard, hubInput, hubSelect, BtnPrimary, BtnSecondary } from '../components/hubUi';
import { SystemSubNav, SystemSectionTabs, TableCard } from '../components/SystemSubNav';
import { FUSION_STRATEGY_LABEL, type FusionStrategy } from '../data/pipelineMock';
import {
  FOUR_CLASSIFIERS, CLASSIFIER_STATS, TIER_DEFINITIONS, COMPLEXITY_KEYWORD_RULES,
  DOC_TYPE_MAPPINGS, INTENT_MAPPINGS, SECURITY_TIERS, ROUTING_MATRIX,
  DEFAULT_COMPLEXITY_CONFIG, DEFAULT_INTENT_CONFIG, DEFAULT_SECURITY_CONFIG,
  runFullRouteTest, runSingleClassifierTest,
  type ClassifierId, type RoutingMatrixRow, type FullRouteTestResult,
} from '../data/classifierMock';

interface ClassifierPageProps {
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
}

const TABS = ['概览', '四分类器', '路由矩阵', '综合测试', '在线学习'];

const CLASSIFIER_ICONS: Record<ClassifierId, ReactNode> = {
  complexity: <Brain size={16} className="text-blue-600" />,
  document_type: <FileText size={16} className="text-cyan-600" />,
  intent: <Target size={16} className="text-violet-600" />,
  security: <Shield size={16} className="text-red-600" />,
};

export function ClassifierPage({ onNavigate }: ClassifierPageProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedClassifier, setSelectedClassifier] = useState<ClassifierId>('complexity');
  const [matrix, setMatrix] = useState(ROUTING_MATRIX);
  const [complexityCfg, setComplexityCfg] = useState(DEFAULT_COMPLEXITY_CONFIG);
  const [intentCfg, setIntentCfg] = useState(DEFAULT_INTENT_CONFIG);
  const [securityCfg, setSecurityCfg] = useState(DEFAULT_SECURITY_CONFIG);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">系统管理</h1>
        {onNavigate && <SystemSubNav currentPage="sys-classifier" onNavigate={onNavigate} />}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shuffle size={18} className="text-indigo-600" /> 查询路由
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">复杂分类器为路由中枢 · L1 四分类 → L2 决策矩阵 → L3–L5 多通道流水线（架构第五部分）</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {onNavigate && (
            <button type="button" onClick={() => onNavigate('sys-pipeline')} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
              <Route size={14} /> 流水线配置
            </button>
          )}
          <button type="button" onClick={() => showToast('分类器路由配置已保存')} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={14} /> 保存配置
          </button>
        </div>
      </div>

      <SystemSectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 0 && <OverviewTab onNavigate={onNavigate} />}
      {activeTab === 1 && (
        <FourClassifiersTab
          selected={selectedClassifier}
          onSelect={setSelectedClassifier}
          complexityCfg={complexityCfg}
          setComplexityCfg={setComplexityCfg}
          intentCfg={intentCfg}
          setIntentCfg={setIntentCfg}
          securityCfg={securityCfg}
          setSecurityCfg={setSecurityCfg}
          showToast={showToast}
        />
      )}
      {activeTab === 2 && <MatrixTab matrix={matrix} setMatrix={setMatrix} showToast={showToast} />}
      {activeTab === 3 && <FullTestTab showToast={showToast} />}
      {activeTab === 4 && <OnlineLearningTab onNavigate={onNavigate} />}
    </div>
  );
}

function OverviewTab({ onNavigate }: { onNavigate?: ClassifierPageProps['onNavigate'] }) {
  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HubStatCard label="今日 L1 调用" value={CLASSIFIER_STATS.todayCalls.toLocaleString()} icon={<Activity size={18} className="text-indigo-600" />} />
        <HubStatCard label="L1 平均延迟" value={`${CLASSIFIER_STATS.avgL1Ms}ms`} icon={<Zap size={18} className="text-amber-500" />} />
        <HubStatCard label="路由矩阵规则" value={String(CLASSIFIER_STATS.matrixRules)} icon={<Route size={18} className="text-blue-500" />} />
        <HubStatCard label="软路由触发率" value={`${CLASSIFIER_STATS.softRoutingRate}%`} icon={<Shuffle size={18} className="text-violet-500" />} />
      </div>

      <div className={`${hubCard} p-4`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">L1 → L5 查询链路（§11.3.2）</h3>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-xs">
          {[
            { l: 'L1 四分类器', d: '~120ms', c: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
            { l: 'L2 路由决策', d: '~45ms', c: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200' },
            { l: 'L3 多通道检索', d: '~1.4s', c: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200' },
            { l: 'L4 融合精排', d: '~360ms', c: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
            { l: 'L5 生成', d: '~1.1s', c: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
          ].map((step, i, arr) => (
            <span key={step.l} className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-medium ${step.c}`}>{step.l} <span className="opacity-70">{step.d}</span></span>
              {i < arr.length - 1 && <span className="text-gray-300 hidden sm:inline">→</span>}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Router-First：入口处想清楚「用什么知识、什么检索、什么生成策略」再行动（架构§1 路由优先原则）
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FOUR_CLASSIFIERS.map(c => (
          <button
            key={c.id}
            type="button"
            className={`${hubCard} p-4 text-left hover:border-indigo-300 transition-colors`}
          >
            <div className="flex items-center gap-2 mb-2">
              {CLASSIFIER_ICONS[c.id]}
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.name}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2">{c.subtitle}</p>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>准确率 {(c.accuracy * 100).toFixed(0)}%</span>
              <span>{c.latencyMs}ms</span>
            </div>
            <HubBadge variant={c.active ? 'active' : 'draft'}>{c.active ? '运行中' : '停用'}</HubBadge>
          </button>
        ))}
      </div>

      <div className={`${hubCard} p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800`}>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Adaptive RAG 成本分布（架构§24.4）：</strong>Tier1 60% / Tier2 25% / Tier3 12% / Tier4 3% —
          按查询复杂度动态选流水线，平均成本可降低 30–40%。在线学习模型 <strong>{CLASSIFIER_STATS.onlineLearningVersion}</strong> 准确率 {(CLASSIFIER_STATS.onlineLearningAccuracy * 100).toFixed(1)}%。
          {onNavigate && (
            <button type="button" onClick={() => onNavigate('eval-route-learning')} className="ml-2 text-indigo-600 hover:underline">
              进入路由在线学习 →
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

function FourClassifiersTab({
  selected, onSelect, complexityCfg, setComplexityCfg, intentCfg, setIntentCfg, securityCfg, setSecurityCfg, showToast,
}: {
  selected: ClassifierId;
  onSelect: (id: ClassifierId) => void;
  complexityCfg: typeof DEFAULT_COMPLEXITY_CONFIG;
  setComplexityCfg: React.Dispatch<React.SetStateAction<typeof DEFAULT_COMPLEXITY_CONFIG>>;
  intentCfg: typeof DEFAULT_INTENT_CONFIG;
  setIntentCfg: React.Dispatch<React.SetStateAction<typeof DEFAULT_INTENT_CONFIG>>;
  securityCfg: typeof DEFAULT_SECURITY_CONFIG;
  setSecurityCfg: React.Dispatch<React.SetStateAction<typeof DEFAULT_SECURITY_CONFIG>>;
  showToast: (m: string) => void;
}) {
  const [testQuery, setTestQuery] = useState('违约金比例是多少？');
  const [singleResult, setSingleResult] = useState<ReturnType<typeof runSingleClassifierTest> | null>(null);
  const [testing, setTesting] = useState(false);
  const meta = FOUR_CLASSIFIERS.find(c => c.id === selected)!;

  const runSingle = () => {
    setTesting(true);
    setTimeout(() => {
      setSingleResult(runSingleClassifierTest(selected, testQuery));
      setTesting(false);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-3 py-2 font-medium">分类器</th>
              <th className="px-3 py-2 font-medium">准确率</th>
            </tr>
          </thead>
          <tbody>
            {FOUR_CLASSIFIERS.map(c => (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  selected === c.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {CLASSIFIER_ICONS[c.id]}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{c.subtitle}</p>
                      <p className="text-[10px] text-gray-400 truncate">{c.desc}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{(c.accuracy * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-4 min-w-0">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{meta.name}</h3>
          <p className="text-xs text-gray-500 mb-4">{meta.desc}</p>

          {selected === 'complexity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIER_DEFINITIONS.map(t => (
                  <div key={t.tier} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.tier} {t.label}</span>
                      <span className="text-[10px] text-gray-400">{t.freqPct}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{t.desc} · 例: {t.example}</p>
                    <p className="text-[10px] text-indigo-600 mt-1">→ {t.recommended}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">LLM 分类模型</label>
                  <select className={hubSelect} value={complexityCfg.model} onChange={e => setComplexityCfg(c => ({ ...c, model: e.target.value }))}>
                    <option>gpt-4o-mini</option>
                    <option>qwen-turbo</option>
                    <option>deepseek-v4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">置信度阈值: {complexityCfg.confidenceThreshold}</label>
                  <input type="range" min={0.5} max={0.99} step={0.01} value={complexityCfg.confidenceThreshold}
                    onChange={e => setComplexityCfg(c => ({ ...c, confidenceThreshold: +e.target.value }))} className="w-full" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">规则覆盖（优先于 LLM）</p>
                {COMPLEXITY_KEYWORD_RULES.map(r => (
                  <div key={r.id} className="text-[10px] font-mono text-gray-600 dark:text-gray-400 py-1">
                    IF query {r.pattern} THEN {r.result}
                  </div>
                ))}
                <BtnSecondary className="mt-2" onClick={() => showToast('添加关键词规则（mock）')}><Plus size={12} /> 添加规则</BtnSecondary>
              </div>
            </div>
          )}

          {selected === 'document_type' && (
            <div>
              <TableCard minWidth={640}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2">类型</th><th className="py-2">识别特征</th><th className="py-2">Parser</th><th className="py-2">默认流水线</th>
                  </tr>
                </thead>
                <tbody>
                  {DOC_TYPE_MAPPINGS.map(d => (
                    <tr key={d.type} className="border-b border-gray-50 dark:border-gray-800/50">
                      <td className="py-2 font-medium">{d.type}</td>
                      <td className="py-2 text-gray-500">{d.features}</td>
                      <td className="py-2"><code className="text-[10px] bg-gray-100 px-1 rounded">{d.parser}</code></td>
                      <td className="py-2 text-indigo-600">{d.defaultPipeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </TableCard>
              <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600" /> 自动检测 parser_id + 文件名
              </label>
              <label className="flex items-center gap-2 mt-1 text-xs cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600" /> LLM 二次确认
              </label>
            </div>
          )}

          {selected === 'intent' && (
            <div className="space-y-2">
              {INTENT_MAPPINGS.map(i => (
                <div key={i.intent} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-gray-50 dark:border-gray-800/50 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{i.intent}</span>
                    <span className="text-gray-400 sm:ml-2 block sm:inline">{i.desc}</span>
                  </div>
                  <span className={`text-[10px] flex-shrink-0 ${i.reject ? 'text-red-600' : 'text-gray-500'}`}>{i.strategy}</span>
                </div>
              ))}
              <div className="mt-3">
                <label className="block text-xs font-semibold mb-1">拒答话术</label>
                <textarea
                  className={`${hubInput} min-h-[60px]`}
                  value={intentCfg.rejectMessage}
                  onChange={e => setIntentCfg(c => ({ ...c, rejectMessage: e.target.value }))}
                />
              </div>
            </div>
          )}

          {selected === 'security' && (
            <div className="space-y-3">
              <TableCard minWidth={640}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">密级</th><th className="py-2">标签</th><th className="py-2">查询要求</th><th className="py-2">附加策略</th>
                  </tr>
                </thead>
                <tbody>
                  {SECURITY_TIERS.map(s => (
                    <tr key={s.tag} className="border-b border-gray-50">
                      <td className="py-2 font-medium">{s.level}</td>
                      <td className="py-2"><code className="text-[10px] bg-gray-100 px-1 rounded">{s.tag}</code></td>
                      <td className="py-2 text-gray-600">{s.requirement}</td>
                      <td className="py-2 text-gray-500">{s.extraPolicy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </TableCard>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={securityCfg.crossCheckAcl} onChange={e => setSecurityCfg(s => ({ ...s, crossCheckAcl: e.target.checked }))} className="rounded text-red-600" />
                与用户 Chunk ACL 交叉校验
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={securityCfg.blockWebSearchOnConfidential} onChange={e => setSecurityCfg(s => ({ ...s, blockWebSearchOnConfidential: e.target.checked }))} className="rounded text-red-600" />
                机密及以上禁止 Web 搜索
              </label>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold mb-3">单分类器测试</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input value={testQuery} onChange={e => setTestQuery(e.target.value)} className={`${hubInput} flex-1 min-w-0`} placeholder="输入测试查询…" />
            <BtnPrimary onClick={runSingle} disabled={testing} className="w-full sm:w-auto justify-center">
              {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} 测试
            </BtnPrimary>
          </div>
          {singleResult && (
            <div className="space-y-2">
              {singleResult.slice(0, 5).map((r, i) => (
                <div key={r.label} className="flex items-center gap-2 text-xs">
                  <span className={`w-28 text-right truncate ${i === 0 ? 'text-indigo-700 font-medium' : 'text-gray-500'}`}>{r.label}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-gray-300'}`} style={{ width: `${r.confidence * 100}%` }} />
                  </div>
                  <span className="w-10 text-right">{(r.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatrixTab({
  matrix, setMatrix, showToast,
}: {
  matrix: RoutingMatrixRow[];
  setMatrix: React.Dispatch<React.SetStateAction<RoutingMatrixRow[]>>;
  showToast: (m: string) => void;
}) {
  const toggle = (id: string) => setMatrix(m => m.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div className="space-y-4 w-full min-w-0">
      <p className="text-xs text-gray-500">
        四分类器输出组合 → 推荐主流水线 + 辅助流水线（架构§3.3）。与流水线配置页路由规则共享语义，此处为 L1 分类器视角。
      </p>
      <TableCard minWidth={920}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50/80 dark:bg-gray-800/50">
              <th className="px-3 py-2">复杂度</th>
              <th className="px-3 py-2">文档类型</th>
              <th className="px-3 py-2">意图</th>
              <th className="px-3 py-2">密级</th>
              <th className="px-3 py-2">主流水线</th>
              <th className="px-3 py-2">辅助</th>
              <th className="px-3 py-2">融合</th>
              <th className="px-3 py-2">ACL</th>
              <th className="px-3 py-2">7日命中</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.id} className={`border-b border-gray-50 ${!row.enabled ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 font-medium">{row.tier}</td>
                <td className="px-3 py-2">{row.docType}</td>
                <td className="px-3 py-2">{row.intent}</td>
                <td className="px-3 py-2">{row.security}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">{row.primary.map(p => <span key={p} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">{p}</span>)}</div>
                </td>
                <td className="px-3 py-2">
                  {row.secondary.length ? row.secondary.map(s => <span key={s} className="text-[10px] text-gray-500">{s}</span>) : '—'}
                </td>
                <td className="px-3 py-2 text-[10px]">{row.fusion === '—' ? '—' : (FUSION_STRATEGY_LABEL[row.fusion as FusionStrategy] ?? row.fusion)}</td>
                <td className="px-3 py-2">{row.acl ? <CheckCircle size={12} className="text-green-500" /> : '—'}</td>
                <td className="px-3 py-2 text-gray-500">{row.hitCount7d || '—'}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => toggle(row.id)} className="text-[10px] text-indigo-600 hover:underline">{row.enabled ? '禁用' : '启用'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <BtnSecondary onClick={() => showToast('添加矩阵规则（mock）')}><Plus size={12} /> 添加规则</BtnSecondary>
    </div>
  );
}

function FullTestTab({ showToast }: { showToast: (m: string) => void }) {
  const [query, setQuery] = useState('违约金比例是多少？');
  const [result, setResult] = useState<FullRouteTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(runFullRouteTest(query));
      setLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <p className="text-xs text-gray-500">综合测试四分类器 + 矩阵匹配 + L1–L5 全链路 Trace（POST /api/v1/admin/classifiers/test mock）</p>
      <div className={`${hubCard} p-4`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={query} onChange={e => setQuery(e.target.value)} className={`${hubInput} flex-1 min-w-[200px]`} onKeyDown={e => e.key === 'Enter' && run()} />
          <BtnPrimary onClick={run} disabled={loading}>
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} 综合路由测试
          </BtnPrimary>
        </div>
        <div className="flex flex-wrap gap-2">
          {['违约金比例是多少？', '对比三款合同并预测违约风险', '今天天气怎么样'].map(q => (
            <button key={q} type="button" onClick={() => setQuery(q)} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-indigo-50">{q}</button>
          ))}
        </div>
      </div>

      {result && (
        <>
          {result.reject ? (
            <div className={`${hubCard} p-4 border-amber-200 bg-amber-50/50`}>
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1"><AlertCircle size={14} /> 闲聊拒答 · 跳过检索</p>
              <p className="text-sm text-gray-700 mt-2">{result.rejectMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.dimensions.map(d => (
                <div key={d.dimension} className={`${hubCard} p-3`}>
                  <p className="text-[10px] text-gray-400">{d.dimension}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{d.label}</p>
                  <p className="text-[10px] text-indigo-600">{(d.confidence * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          )}

          {!result.reject && (
            <div className={`${hubCard} p-4`}>
              <p className="text-xs mb-2"><strong>命中规则 {result.matchedRuleId}</strong> · 主: {result.primary.join(' + ')}{result.secondary.length ? ` · 辅: ${result.secondary.join(' + ')}` : ''}</p>
              {result.softRouting && result.softRoutingNote && (
                <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2">{result.softRoutingNote}</p>
              )}
            </div>
          )}

          <div className={`${hubCard} p-4`}>
            <h3 className="text-sm font-semibold mb-3">查询链路 Trace · 总计 {result.totalMs}ms</h3>
            <div className="space-y-2">
              {result.trace.map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="w-8 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">{t.layer}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.label}</span>
                    <span className="text-gray-500 ml-2">{t.detail}</span>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">{t.ms}ms</span>
                </div>
              ))}
            </div>
          </div>

          <BtnSecondary onClick={() => showToast('已跳转对话 Trace（mock）')}>
            <ExternalLink size={12} /> 在对话页查看 QueryTraceTimeline
          </BtnSecondary>
        </>
      )}
    </div>
  );
}

function OnlineLearningTab({ onNavigate }: { onNavigate?: ClassifierPageProps['onNavigate'] }) {
  return (
    <div className={`${hubCard} p-4 sm:p-5 w-full min-w-0 space-y-4`}>
      <h3 className="text-sm font-semibold flex items-center gap-2"><Brain size={16} className="text-indigo-600" /> 路由在线学习（§11.3.7 / 架构§29）</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        基于线上反馈（👍👎/纠错）自动优化路由矩阵权重。当前生产版本 <strong>{CLASSIFIER_STATS.onlineLearningVersion}</strong>，
        验证集准确率 <strong>{(CLASSIFIER_STATS.onlineLearningAccuracy * 100).toFixed(1)}%</strong>。
        完整训练、A/B 对比与发布回滚在评测中心「路由在线学习」页操作。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { l: '训练样本', v: '8,400' },
          { l: '待人工标注', v: '23' },
          { l: 'Faithfulness Δ', v: '+0.02 vs v11' },
        ].map(s => (
          <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{s.v}</div>
            <div className="text-[10px] text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>
      {onNavigate && (
        <BtnPrimary onClick={() => onNavigate('eval-route-learning')}>
          <ExternalLink size={14} /> 进入评测中心 · 路由在线学习
        </BtnPrimary>
      )}
    </div>
  );
}

export default ClassifierPage;
