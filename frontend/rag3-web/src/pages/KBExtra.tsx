import { useState, useEffect } from 'react';
import {
  Save, Play, RefreshCw, ChevronRight, ChevronDown,
  GitBranch, Search, BookOpen, TreePine, Settings,
  Plus, Trash2, RotateCcw, FileText, Network, Clock,
  CheckCircle, AlertTriangle, BarChart2, Database, Layers,
  Eye, Edit2, XCircle, Zap, ArrowRight, Loader
} from 'lucide-react';
import { mockKBs } from '../mockData';
import { KBDetailLayout } from '../components/KBDetailLayout';
import { ModelProviderPanel } from '../components/llm/ModelProviderPanel';
import { LlmModelSelect } from '../components/llm/LlmModelSelect';
import { useKnowledgeBase, updateKnowledgeBase } from '../hooks/useKbData';
import { useWikiHubData, useWikiManageData } from '../hooks/useEnhancementHubData';
import type { WikiPageType } from '../data/wikiMock';
import { useLlmModels, useTenantModels } from '../hooks/useLlmData';
import { useRealApi } from '../services/http';
import type { KBSettingsTab } from '../store';

/* ──────────────────────────────────────────────
   KB SETTINGS PAGE
────────────────────────────────────────────── */

const CHUNK_METHODS = [
  'General（通用）', 'QA（问答对）', 'Paper（学术论文）', 'Laws（法律条文）',
  'Book（书籍）', 'Presentation（演示文稿）', 'Manual（手册）', 'Table（表格）',
  'Email（邮件）', 'One（整篇）', 'Tag（标签）', 'Knowledge Graph',
  'Mix（混合）', 'Audio（音频）', 'Medical（医疗）',
];

const METADATA_SCHEMA = [
  { id: '1', name: 'department', type: 'enum', required: true, example: '法务, 财务, 研发' },
  { id: '2', name: 'doc_type', type: 'enum', required: true, example: '合同, 报告, 政策' },
  { id: '3', name: 'effective_date', type: 'date', required: false, example: '2024-01-01' },
];

const INDEX_OPTIONS_INIT = [
  { key: 'vector', label: '向量索引（必选）', desc: '使用嵌入模型构建语义向量索引', enabled: true, locked: true },
  { key: 'fulltext', label: '全文索引', desc: '基于 BM25 的关键词精确匹配', enabled: true, locked: false },
  { key: 'pageindex', label: 'PageIndex 树索引', desc: '层次化文档结构树索引，适合长文档', enabled: true, locked: false },
  { key: 'graph', label: '知识图谱索引', desc: '实体关系图谱，支持多跳推理', enabled: false, locked: false },
  { key: 'wiki', label: 'Wiki 汇总索引', desc: 'LLM 生成实体 Wiki 页面，快速问答', enabled: false, locked: false },
];

interface KBSettingsPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
  initialTab?: KBSettingsTab;
}

export function KBSettingsPage({ kbId, onNavigate, initialTab = 'parsing' }: KBSettingsPageProps) {
  const { data: apiKb, refresh: refreshKb } = useKnowledgeBase(kbId);
  const kb = useRealApi ? apiKb : (mockKBs.find(k => k.kb_id === kbId) || mockKBs[0]);
  const { options: embeddingOptions, loading: embOptionsLoading } = useLlmModels('embedding');
  const { options: chatOptions, loading: chatOptionsLoading } = useLlmModels('chat');
  const { data: tenantModels } = useTenantModels();
  const [tab, setTab] = useState<KBSettingsTab>(initialTab);
  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState(kb.description);
  const [permission, setPermission] = useState<'me' | 'team'>('team');
  const [embeddingModel, setEmbeddingModel] = useState(kb.embedding_model || '');
  const [llmModel, setLlmModel] = useState(kb.llm_model || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chunkMethod, setChunkMethod] = useState('General（通用）');
  const [graphragEnabled, setGraphragEnabled] = useState(true);
  const [graphragMode, setGraphragMode] = useState('LazyGraphRAG');
  const [raptorEnabled, setRaptorEnabled] = useState(false);
  const [parseType, setParseType] = useState<'builtin' | 'pipeline'>('builtin');
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(128);
  const [saved, setSaved] = useState(false);
  const [indexOptions, setIndexOptions] = useState(INDEX_OPTIONS_INIT);
  const [schemaFields, setSchemaFields] = useState(METADATA_SCHEMA);
  const [tags, setTags] = useState(['合规', '合同', '2024年度', '供应商', '法律', '财务', '保密', '知识产权']);
  const [newTag, setNewTag] = useState('');
  const [fusionWeight, setFusionWeight] = useState(0.7);
  const [rrfK, setRrfK] = useState(60);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setName(kb.name);
    setDescription(kb.description);
    setEmbeddingModel(kb.embedding_model && kb.embedding_model !== '—' ? kb.embedding_model : tenantModels.embd_id || '');
    setLlmModel(kb.llm_model && kb.llm_model !== '—' ? kb.llm_model : tenantModels.llm_id || '');
  }, [kb.name, kb.description, kb.embedding_model, kb.llm_model, tenantModels.embd_id, tenantModels.llm_id]);

  const subNavKey = tab === 'datasource' ? 'kb-data-sources' : 'kb-settings';

  const toggleIndex = (key: string) => {
    setIndexOptions(prev => prev.map(o => (o.key === key && !o.locked ? { ...o, enabled: !o.enabled } : o)));
  };

  const handleSave = async () => {
    if (useRealApi) {
      setSaving(true);
      setSaveError(null);
      try {
        await updateKnowledgeBase(kbId, {
          name,
          description,
          permission,
          embedding_model: embeddingModel.includes('@') ? embeddingModel : undefined,
        });
        refreshKb();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : '保存失败');
      } finally {
        setSaving(false);
      }
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setNewTag('');
  };

  const removeTag = (tag: string) => setTags(p => p.filter(t => t !== tag));

  const addSchemaField = () => {
    setSchemaFields(p => [...p, { id: String(Date.now()), name: 'new_field', type: 'string', required: false, example: '' }]);
  };

  const removeSchemaField = (id: string) => setSchemaFields(p => p.filter(f => f.id !== id));

  return (
    <KBDetailLayout kbId={kbId} activeKey={subNavKey} onNavigate={onNavigate}>
    <div className="p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">配置</span>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-60`}
        >
          {saved ? <><RefreshCw size={14} className="animate-spin" /> 已保存</> : saving ? <><Loader size={14} className="animate-spin" /> 保存中…</> : <><Save size={14} /> 保存配置</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {[
          { k: 'basic', l: '基础信息' },
          ...(useRealApi ? [{ k: 'models', l: '模型与 KEY' }] : []),
          { k: 'parsing', l: '解析分块' },
          { k: 'index', l: '全局索引' },
          { k: 'datasource', l: '数据源' },
          { k: 'tags', l: '标签元数据' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.k ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {saveError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</div>
      )}

      {tab === 'basic' && (
        <div className="space-y-4 max-w-2xl">
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">知识库名称</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600" /></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:border-gray-600" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-600 mb-1">默认语言</label>
              <select className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-800 dark:border-gray-600">
                <option>中文</option><option>English</option>
              </select></div>
            <div><label className="block text-xs text-gray-600 mb-1">可见性权限</label>
              <div className="flex gap-4 pt-1">
                {[{ v: 'me', l: '仅我' }, { v: 'team', l: '团队' }].map(o => (
                  <label key={o.v} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="visibility" checked={permission === o.v} onChange={() => setPermission(o.v as 'me' | 'team')} className="text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{o.l}</span>
                  </label>
                ))}
              </div></div>
            <div><label className="block text-xs text-gray-600 mb-1">嵌入模型</label>
              {useRealApi ? (
                <LlmModelSelect
                  value={embeddingModel}
                  onChange={setEmbeddingModel}
                  options={embeddingOptions}
                  loading={embOptionsLoading}
                />
              ) : (
                <select className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-800 dark:border-gray-600">
                  <option>BAAI/bge-m3</option><option>BCE-Embedding</option>
                </select>
              )}</div>
            <div><label className="block text-xs text-gray-600 mb-1">默认 LLM 模型</label>
              {useRealApi ? (
                <LlmModelSelect
                  value={llmModel}
                  onChange={setLlmModel}
                  options={chatOptions}
                  loading={chatOptionsLoading}
                  emptyHint="租户默认对话模型（在「模型与 KEY」配置）"
                />
              ) : (
                <select className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-800 dark:border-gray-600">
                  <option>DeepSeek-v4</option><option>Qwen3-72B</option><option>Claude-4</option>
                </select>
              )}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-amber-800 mb-1">权限与 ACL</h4>
            <p className="text-[11px] text-amber-700 mb-2">团队可见时，成员默认拥有读取权限；Chunk 级 ACL 在文档解析后自动继承。</p>
            <button
              type="button"
              onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })}
              className="text-xs text-amber-800 hover:underline flex items-center gap-1"
            >
              前往权限管理 <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {tab === 'models' && useRealApi && (
        <ModelProviderPanel onSaved={refreshKb} />
      )}

      {tab === 'parsing' && (
        <div className="space-y-5 max-w-xl">
          {/* Parse type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">解析类型</label>
            <div className="flex gap-3">
              {[{ v: 'builtin', l: 'Built-in（内置引擎）', d: 'DeepDoc / MinerU 本地解析' }, { v: 'pipeline', l: 'Data Pipeline（外部管道）', d: '自定义数据管道处理' }].map(o => (
                <label key={o.v} className={`flex-1 p-3 border-2 rounded-xl cursor-pointer transition-all ${parseType === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="parseType" value={o.v} checked={parseType === o.v} onChange={e => setParseType(e.target.value as any)} className="sr-only" />
                  <div className="text-xs font-semibold text-gray-800 mb-0.5">{o.l}</div>
                  <div className="text-[10px] text-gray-500">{o.d}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Chunk method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">分块方法 <span className="text-gray-400 font-normal">（15种）</span></label>
            <select
              value={chunkMethod}
              onChange={e => setChunkMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CHUNK_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">当前选择：{chunkMethod} — 适合通用场景文本分割，按语义边界拆分</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">布局识别引擎</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                <option>DeepDOC（推荐）</option><option>MinerU</option><option>PyMuPDF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">嵌入模型</label>
              {useRealApi ? (
                <LlmModelSelect
                  value={embeddingModel}
                  onChange={setEmbeddingModel}
                  options={embeddingOptions}
                  loading={embOptionsLoading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-800 dark:border-gray-600"
                />
              ) : (
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  <option>BAAI/bge-m3</option><option>BCE-Embedding</option><option>text-embedding-3-small</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Chunk Token 上限</label>
              <div className="flex items-center gap-2">
                <input type="range" min={128} max={2048} step={128} value={chunkSize} onChange={e => setChunkSize(Number(e.target.value))} className="flex-1" />
                <span className="text-sm font-bold text-gray-800 w-12 text-right">{chunkSize}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">重叠 Token</label>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={512} step={32} value={overlap} onChange={e => setOverlap(Number(e.target.value))} className="flex-1" />
                <span className="text-sm font-bold text-gray-800 w-12 text-right">{overlap}</span>
              </div>
            </div>
          </div>

          {/* GraphRAG */}
          <div className={`border-2 rounded-xl p-4 transition-colors ${graphragEnabled ? 'border-green-300 bg-green-50/40' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">GraphRAG</h4>
                <p className="text-[10px] text-gray-500">知识图谱增强检索，提取实体关系</p>
              </div>
              <button
                onClick={() => setGraphragEnabled(p => !p)}
                className={`w-11 h-6 rounded-full transition-colors relative ${graphragEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${graphragEnabled ? 'left-6' : 'left-1'}`}></span>
              </button>
            </div>
            {graphragEnabled && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] text-gray-600 mb-1">GraphRAG 模式</label>
                    <select value={graphragMode} onChange={e => setGraphragMode(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none">
                      <option>LazyGraphRAG</option><option>GlobalGraphRAG</option><option>LocalGraphRAG</option>
                    </select></div>
                  <div><label className="block text-[10px] text-gray-600 mb-1">实体类型</label>
                    <input defaultValue="ORG, PERSON, LOC, CONTRACT" className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none" /></div>
                  <div><label className="block text-[10px] text-gray-600 mb-1">提取方法</label>
                    <select className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"><option>general</option><option>fast</option></select></div>
                </div>
                <div><label className="block text-[10px] text-gray-600 mb-1">LLM 模型</label>
                  <select className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"><option>DeepSeek-v4</option><option>gpt-4o-mini</option></select></div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5">
                    <Play size={11} /> 生成图谱
                  </button>
                  <button className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">查看日志</button>
                  <button type="button" onClick={() => onNavigate('graphrag-hub', { selectedKBId: kbId })} className="px-3 py-1.5 text-xs border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-1">
                    进入 GraphRAG Hub <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RAPTOR */}
          <div className={`border-2 rounded-xl p-4 transition-colors ${raptorEnabled ? 'border-orange-300 bg-orange-50/40' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">RAPTOR</h4>
                <p className="text-[10px] text-gray-500">递归摘要树索引，提升长文档检索</p>
              </div>
              <button
                onClick={() => setRaptorEnabled(p => !p)}
                className={`w-11 h-6 rounded-full transition-colors relative ${raptorEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${raptorEnabled ? 'left-6' : 'left-1'}`}></span>
              </button>
            </div>
            {raptorEnabled && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'max_token', v: '256' },
                  { l: 'threshold', v: '0.1' },
                  { l: 'max_cluster', v: '64' },
                ].map(f => (
                  <div key={f.l}>
                    <label className="block text-[10px] text-gray-600 mb-1">{f.l}</label>
                    <input defaultValue={f.v} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'index' && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs text-gray-500">配置全局索引选项，影响所有文档的检索行为。</p>
          {indexOptions.map(idx => (
            <div key={idx.key} className={`flex items-center justify-between p-3.5 border rounded-xl ${idx.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{idx.label}</span>
                  {idx.locked && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">必选</span>}
                </div>
                <span className="text-[10px] text-gray-500">{idx.desc}</span>
              </div>
              <button
                type="button"
                disabled={idx.locked}
                onClick={() => toggleIndex(idx.key)}
                className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${idx.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${idx.enabled ? 'left-6' : 'left-1'}`}></span>
              </button>
            </div>
          ))}

          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">融合检索策略</h4>
            <p className="text-[11px] text-gray-500 mb-3">多通道检索结果的加权 RRF 融合，与检索测试台联动预览。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">向量通道权重</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={1} step={0.05} value={fusionWeight} onChange={e => setFusionWeight(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm font-bold text-gray-800 w-10">{fusionWeight.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">RRF 参数 k</label>
                <input type="number" min={1} max={120} value={rrfK} onChange={e => setRrfK(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('kb-retrieval-test', { selectedKBId: kbId })}
              className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              前往检索测试台验证 <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {tab === 'datasource' && (
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">配置自动同步的外部数据源。</p>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus size={12} /> 添加数据源</button>
          </div>
          {[
            { type: 'S3', name: 's3://corp-docs/legal/', status: 'active', last_sync: '2小时前', icon: '☁️' },
            { type: 'SharePoint', name: 'Legal Team Drive', status: 'active', last_sync: '1天前', icon: '📁' },
            { type: 'Web Crawl', name: 'https://laws.example.com', status: 'paused', last_sync: '3天前', icon: '🌐' },
          ].map((ds, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl hover:border-gray-300">
              <span className="text-xl">{ds.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{ds.name}</div>
                <div className="text-[10px] text-gray-500">{ds.type} · 上次同步 {ds.last_sync}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${ds.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {ds.status === 'active' ? '同步中' : '已暂停'}
              </span>
              <button className="p-1 rounded hover:bg-gray-100 text-gray-400"><Settings size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'tags' && (
        <div className="space-y-5 max-w-3xl">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">标签管理</h4>
            <p className="text-xs text-gray-500 mb-3">配置文档级元数据标签，用于精细化过滤与 ACL 控制。</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-0.5">✕</button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="新建标签"
                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="button" onClick={addTag} className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-gray-300 text-gray-500 text-xs rounded-full hover:border-blue-400 hover:text-blue-600">
                  <Plus size={11} /> 新建
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">元数据字段 Schema</h4>
                <p className="text-[11px] text-gray-500">上传时自动提取 / 手动标注</p>
              </div>
              <button type="button" onClick={addSchemaField} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Plus size={12} /> 添加字段
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">字段名</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">类型</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">必填</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">示例值</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {schemaFields.map(field => (
                    <tr key={field.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        <input
                          value={field.name}
                          onChange={e => setSchemaFields(p => p.map(f => f.id === field.id ? { ...f, name: e.target.value } : f))}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={field.type}
                          onChange={e => setSchemaFields(p => p.map(f => f.id === field.id ? { ...f, type: e.target.value } : f))}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none"
                        >
                          <option value="string">string</option>
                          <option value="enum">enum</option>
                          <option value="date">date</option>
                          <option value="number">number</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => setSchemaFields(p => p.map(f => f.id === field.id ? { ...f, required: e.target.checked } : f))}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={field.example}
                          onChange={e => setSchemaFields(p => p.map(f => f.id === field.id ? { ...f, example: e.target.value } : f))}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={() => removeSchemaField(field.id)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </KBDetailLayout>
  );
}

/* ──────────────────────────────────────────────
   WIKI BROWSER PAGE
────────────────────────────────────────────── */

const WIKI_LAYER_TYPES: Record<1 | 2 | 3, WikiPageType[]> = {
  1: ['raw'],
  2: ['entity', 'concept'],
  3: ['synthesis', 'comparison'],
};

interface WikiPageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

export function WikiPage({ kbId, onNavigate }: WikiPageProps) {
  const { data: kbData } = useKnowledgeBase(kbId);
  const kb = kbData ?? mockKBs.find(k => k.kb_id === kbId) ?? mockKBs[0];
  const wiki = useWikiHubData(kbId);
  const pages = wiki.pages;
  const [selectedSlug, setSelectedSlug] = useState('');
  const [layer, setLayer] = useState<1 | 2 | 3>(2);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (pages.length && !pages.some(p => p.slug === selectedSlug)) {
      setSelectedSlug(pages[0].slug);
    }
  }, [pages, selectedSlug]);

  const page = pages.find(p => p.slug === selectedSlug) ?? pages[0];
  const layerPages = pages.filter(p => WIKI_LAYER_TYPES[layer].includes(p.pageType));
  const compiling = wiki.trace?.running ?? false;

  const handleCompile = () => {
    void wiki.runBuild();
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    published: { label: '已发布', color: 'bg-green-100 text-green-700' },
    reviewing: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    compiling: { label: '编译中', color: 'bg-blue-100 text-blue-700' },
    queued: { label: '排队中', color: 'bg-gray-100 text-gray-600' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-4 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('- **')) {
        const parts = line.slice(2).split('**');
        return <li key={i} className="ml-4 list-disc text-sm text-gray-700 mb-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>)}</li>;
      }
      if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-sm text-gray-700 mb-1">{line.slice(2)}</li>;
      if (line === '') return <br key={i} />;
      return <p key={i} className="text-sm text-gray-700 mb-1 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-900">{kb.name} · Wiki</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQueue(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <Clock size={12} /> 编译队列
          </button>
          <button onClick={handleCompile} disabled={compiling || wiki.loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
            {compiling ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {compiling ? '编译中...' : '触发编译'}
          </button>
          {wiki.isApiMode && (
            <span className="text-[10px] text-blue-600 px-2 py-1 bg-blue-50 rounded">RAG3 API</span>
          )}
        </div>
      </div>

      {wiki.loading && (
        <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-2 border-b border-gray-100">
          <Loader size={12} className="animate-spin" /> 加载 Wiki 数据…
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Left tree */}
        <div className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Layer tabs */}
          <div className="flex border-b border-gray-100">
            {([1, 2, 3] as const).map(l => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className={`flex-1 py-2 text-[10px] font-medium transition-colors ${layer === l ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {l === 1 ? 'Layer1 原始' : l === 2 ? 'Layer2 实体' : 'Layer3 综合'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {layerPages.length === 0 ? (
              <div className="text-[10px] text-gray-400 px-2 py-4 italic text-center">
                {pages.length === 0 ? '暂无 Wiki 条目，请先触发 Ingest 编译' : '当前层级暂无页面'}
              </div>
            ) : (
              layerPages.map(p => (
                <button
                  key={p.slug}
                  onClick={() => setSelectedSlug(p.slug)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors ${selectedSlug === p.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={11} className="flex-shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <span className={`text-[9px] ml-4 ${(statusConfig[p.status] ?? statusConfig.draft).color.replace('bg-', 'text-')}`}>
                    {(statusConfig[p.status] ?? statusConfig.draft).label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!page ? (
            <div className="text-sm text-gray-500 text-center py-16">暂无 Wiki 页面可展示</div>
          ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">[[{page.title}]]</h1>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${(statusConfig[page.status] ?? statusConfig.draft).color}`}>
                    {(statusConfig[page.status] ?? statusConfig.draft).label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">更新于 {page.updated}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">编辑</button>
                <button className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">版本历史</button>
                {page.status === 'reviewing' && (
                  <button className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">审核通过</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              {page.content ? renderMarkdown(page.content) : (
                <p className="text-sm text-gray-500 italic">条目内容待编译生成</p>
              )}
            </div>

            {/* Sources */}
            {page.sources.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">📎 引用来源</h3>
              <div className="flex flex-wrap gap-2">
                {page.sources.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors">
                    <FileText size={11} /> {s}
                  </span>
                ))}
              </div>
            </div>
            )}

            {/* Related */}
            {page.related.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">🔗 相关页面</h3>
              <div className="flex flex-wrap gap-2">
                {page.related.map((r, i) => (
                  <button key={i} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs hover:bg-blue-50 transition-colors">
                    [[{r}]]
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Compile queue sidebar */}
      {showQueue && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col" style={{ position: 'fixed', right: 0, top: '48px', bottom: '24px' }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">编译队列</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {wiki.compileQueue.length === 0 ? (
              <div className="text-[10px] text-gray-400 text-center py-6 italic">暂无编译任务</div>
            ) : wiki.compileQueue.map(item => (
              <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <BookOpen size={13} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-400">{item.step}{item.progress > 0 ? ` · ${item.progress}%` : ''}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusConfig[item.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                  {statusConfig[item.status]?.label || item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   PAGEINDEX TREE PAGE
────────────────────────────────────────────── */

interface PageIndexTreePageProps {
  kbId: string;
  onNavigate: (page: string, extra?: any) => void;
}

const TREE_DATA = {
  label: '文档根',
  children: [
    { label: '第一条 定义', children: [{ label: '1.1 供应商定义', children: [] }, { label: '1.2 采购方定义', children: [] }] },
    { label: '第二条 权利义务', children: [{ label: '2.1 采购方权利', children: [] }, { label: '2.2 供应商义务', children: [] }] },
    { label: '第三条 价格与付款', children: [{ label: '3.1 价格条款', children: [] }, { label: '3.2 付款周期', children: [] }] },
    {
      label: '第五条 违约责任',
      children: [
        { label: '5.1 延迟交货', children: [] },
        { label: '5.2 质量违约', children: [] },
        { label: '5.3 提前解约', children: [] },
      ],
    },
    { label: '第七条 不可抗力', children: [{ label: '7.1 免责事项', children: [] }] },
    { label: '第八条 保密义务', children: [{ label: '8.1 保密范围', children: [] }, { label: '8.2 保密期限', children: [] }, { label: '8.3 例外情形', children: [] }] },
  ],
};

function TreeNode({ node, depth = 0, selected, onSelect }: { node: any; depth?: number; selected: string | null; onSelect: (l: string) => void }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => { if (hasChildren) setOpen(p => !p); onSelect(node.label); }}
        className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-lg text-xs transition-colors hover:bg-gray-100 ${selected === node.label ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          open ? <ChevronDown size={11} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={11} className="text-gray-400 flex-shrink-0" />
        ) : <span className="w-3" />}
        <TreePine size={11} className="flex-shrink-0 text-green-500" />
        {node.label}
      </button>
      {open && hasChildren && node.children.map((child: any, i: number) => (
        <TreeNode key={i} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function PageIndexTreePage({ kbId, onNavigate }: PageIndexTreePageProps) {
  const kb = mockKBs.find(k => k.kb_id === kbId) || mockKBs[0];
  const [selectedNode, setSelectedNode] = useState<string | null>('第五条 违约责任');
  const [testQuery, setTestQuery] = useState('违约金如何计算');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult('5.1 延迟交货');
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-bold text-gray-900">{kb.name} · PageIndex 树</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Tree panel */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">供应商合同模板V5.pdf</p>
            <p className="text-[10px] text-gray-400">12 页 · 85 节点</p>
          </div>
          <div className="p-2">
            <TreeNode node={TREE_DATA} selected={selectedNode} onSelect={setSelectedNode} />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Node detail */}
          {selectedNode && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TreePine size={16} className="text-green-500" />
                <h3 className="text-sm font-bold text-gray-900">{selectedNode}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { l: '节点类型', v: '章节' },
                  { l: '页码范围', v: 'P3-4' },
                  { l: 'Token 数', v: '512' },
                  { l: '子节点', v: '3' },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-gray-900">{s.v}</div>
                    <div className="text-[10px] text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                本节规定了供应商违约的各种情形及对应的违约金计算标准，包括：(1) 迟延交货违约金；(2) 质量不合格违约金；(3) 提前解约违约金。
              </p>
            </div>
          )}

          {/* Tree search debug */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Search size={14} className="text-blue-500" /> 树搜索调试
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                value={testQuery}
                onChange={e => setTestQuery(e.target.value)}
                placeholder="输入测试查询..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {testing ? <RefreshCw size={14} className="animate-spin" /> : '测试'}
              </button>
            </div>

            {testResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-800 mb-2">推理路径</p>
                <div className="space-y-1.5">
                  {[
                    { step: 1, desc: '扫描目录层级', result: '命中「第五条 违约责任」', ms: 12 },
                    { step: 2, desc: '定位页面节点', result: 'P3 bbox 高亮', ms: 8 },
                    { step: 3, desc: '返回最优子节点', result: `${testResult}，Token: 512`, ms: 15 },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-2 text-xs">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{s.step}</span>
                      <div className="flex-1">
                        <span className="text-blue-700 font-medium">{s.desc}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="text-gray-800">{s.result}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{s.ms}ms</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200 flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium">定位节点: <strong>{testResult}</strong></span>
                  <button className="text-xs text-blue-600 hover:underline">在树中高亮</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   LLM WIKI MANAGEMENT PAGE
────────────────────────────────────────────── */

interface WikiManagePageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function WikiManagePage({ onNavigate }: WikiManagePageProps) {
  const { entries, jobs, loading, refresh, isApiMode } = useWikiManageData();
  const [tab, setTab] = useState<'pages' | 'jobs' | 'stats'>('pages');
  const [filterKB, setFilterKB] = useState('全部');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [search, setSearch] = useState('');

  const statusCfg = {
    published: { label: '已发布', color: 'bg-green-100 text-green-700' },
    reviewing: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  } as const;

  const jobStatusCfg = {
    running: { label: '运行中', color: 'bg-blue-100 text-blue-700' },
    queued: { label: '排队中', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  } as const;

  const filteredEntries = entries.filter(e => {
    if (filterKB !== '全部' && e.kb !== filterKB) return false;
    if (filterStatus !== '全部' && e.status !== filterStatus) return false;
    if (search && !e.title.includes(search) && !e.kb.includes(search)) return false;
    return true;
  });

  const kbs = ['全部', ...Array.from(new Set(entries.map(e => e.kb)))];
  const statuses = ['全部', 'published', 'reviewing', 'draft'];

  const published = entries.filter(e => e.status === 'published').length;
  const reviewing = entries.filter(e => e.status === 'reviewing').length;
  const totalCites = entries.reduce((s, e) => s + e.cites, 0);

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">LLM Wiki 管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">跨知识库管理所有Wiki页面与编译任务</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          {isApiMode && (
            <span className="text-[10px] text-blue-600 px-2 py-1 bg-blue-50 rounded">跨 KB 聚合 API</span>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={14} /> 新建 Wiki 页
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Loader size={12} className="animate-spin" /> 加载跨知识库 Wiki 数据…
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Wiki 页面总数', value: entries.length, icon: <BookOpen size={15} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: '已发布', value: published, icon: <CheckCircle size={15} className="text-green-500" />, bg: 'bg-green-50' },
          { label: '待审核', value: reviewing, icon: <AlertTriangle size={15} className="text-yellow-500" />, bg: 'bg-yellow-50' },
          { label: '总引用次数', value: totalCites.toLocaleString(), icon: <BarChart2 size={15} className="text-purple-500" />, bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'pages', label: 'Wiki 页面' },
          { id: 'jobs', label: '编译任务' },
          { id: 'stats', label: '统计分析' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pages tab */}
      {tab === 'pages' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索页面标题..."
                className="w-full pl-7 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
            <select value={filterKB} onChange={e => setFilterKB(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              {kbs.map(k => <option key={k}>{k}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              {statuses.map(s => <option key={s}>{s === '全部' ? '全部状态' : statusCfg[s as keyof typeof statusCfg]?.label || s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['页面标题', '所属KB', 'Layer', '状态', '引用次数', '来源文档', '更新时间', '操作'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-xs text-gray-400 italic">暂无 Wiki 条目</td></tr>
                )}
                {filteredEntries.map((e, i) => (
                  <tr key={e.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">[[{e.title}]]</td>
                    <td className="py-3 px-4 text-gray-500">{e.kb}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${e.layer === 3 ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        Layer{e.layer}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg[e.status as keyof typeof statusCfg].color}`}>
                        {statusCfg[e.status as keyof typeof statusCfg].label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{e.cites}</td>
                    <td className="py-3 px-4 text-gray-500">{e.sources} 篇</td>
                    <td className="py-3 px-4 text-gray-400">{e.updated}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onNavigate('kb-wiki', { selectedKBId: e.kbId })} className="text-blue-600 hover:underline flex items-center gap-1"><Eye size={11} /> 查看</button>
                        <button className="text-gray-500 hover:underline flex items-center gap-1"><Edit2 size={11} /> 编辑</button>
                        {e.status === 'reviewing' && (
                          <button className="text-green-600 hover:underline flex items-center gap-1"><CheckCircle size={11} /> 通过</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Jobs tab */}
      {tab === 'jobs' && (
        <div className="flex flex-col gap-3">
          {jobs.length === 0 && (
            <div className="text-xs text-gray-400 italic text-center py-8">暂无编译任务</div>
          )}
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${jobStatusCfg[job.status as keyof typeof jobStatusCfg].color}`}>
                {jobStatusCfg[job.status as keyof typeof jobStatusCfg].label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{job.kb}</span>
                  <span className="text-[11px] text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">{job.trigger}</span>
                  <span className="text-[11px] text-gray-500">{job.pages} 页</span>
                  <span className="text-[11px] text-gray-400">模型: {job.model}</span>
                </div>
                {job.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                    </div>
                    <span className="text-[11px] text-blue-600 font-medium">{job.progress}%</span>
                  </div>
                )}
                {job.status === 'completed' && (
                  <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full w-full" />
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-400 flex-shrink-0">{job.started}</div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {job.status === 'failed' && (
                  <button className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                    <RotateCcw size={11} /> 重试
                  </button>
                )}
                {job.status === 'running' && (
                  <button className="text-xs px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
                    取消
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">按知识库分布</h3>
            <div className="space-y-3">
              {kbs.filter(k => k !== '全部').map(kb => {
                const count = entries.filter(e => e.kb === kb).length;
                const pct = entries.length ? (count / entries.length) * 100 : 0;
                return (
                  <div key={kb} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-32 flex-shrink-0">{kb}</div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs font-semibold text-gray-800 w-8 text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">引用次数排行 Top 5</h3>
            <div className="space-y-2">
              {[...entries].sort((a, b) => b.cites - a.cites).slice(0, 5).map((e, i) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : 'bg-orange-300 text-white'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">[[{e.title}]]</div>
                    <div className="text-[10px] text-gray-400">{e.kb}</div>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{e.cites}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   PAGEINDEX MANAGEMENT PAGE
────────────────────────────────────────────── */

const PAGEINDEX_TASKS = [
  { id: 'pi-001', kb: '合同知识库', doc: '供应商合同模板V5.pdf', nodes: 85, status: 'completed', progress: 100, time: '4分钟', updated: '2026-06-05 14:20' },
  { id: 'pi-002', kb: '合同知识库', doc: '采购协议条款.docx', nodes: 42, status: 'completed', progress: 100, time: '2分钟', updated: '2026-06-05 13:10' },
  { id: 'pi-003', kb: '财务报告KB', doc: 'Q2财务报告_正式版.pdf', nodes: 0, status: 'running', progress: 54, time: '进行中', updated: '2026-06-06 14:30' },
  { id: 'pi-004', kb: '供应商管理KB', doc: '供应商评估手册2025.pdf', nodes: 0, status: 'queued', progress: 0, time: '待执行', updated: '—' },
  { id: 'pi-005', kb: '法规政策KB', doc: 'GB 2024年度汇编.pdf', nodes: 0, status: 'failed', progress: 33, time: '失败', updated: '2026-06-04 09:15' },
];

const PAGEINDEX_STATS = [
  { kb: '合同知识库', docs: 12, indexed: 12, nodes: 1240, coverage: 100 },
  { kb: '供应商管理KB', docs: 8, indexed: 7, nodes: 890, coverage: 87.5 },
  { kb: '财务报告KB', docs: 15, indexed: 14, nodes: 1560, coverage: 93.3 },
  { kb: '法规政策KB', docs: 20, indexed: 18, nodes: 2100, coverage: 90 },
  { kb: '产品手册KB', docs: 25, indexed: 25, nodes: 3200, coverage: 100 },
];

interface PageIndexManagePageProps {
  onNavigate: (page: string, extra?: any) => void;
}

export function PageIndexManagePage({ onNavigate }: PageIndexManagePageProps) {
  const [tab, setTab] = useState<'tasks' | 'coverage' | 'config'>('tasks');
  const [selectedKB, setSelectedKB] = useState('全部');

  const taskStatusCfg = {
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={13} className="text-green-500" /> },
    running: { label: '运行中', color: 'bg-blue-100 text-blue-700', icon: <RefreshCw size={13} className="text-blue-500 animate-spin" /> },
    queued: { label: '排队中', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={13} className="text-yellow-500" /> },
    failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: <XCircle size={13} className="text-red-500" /> },
  } as const;

  const totalNodes = PAGEINDEX_STATS.reduce((s, k) => s + k.nodes, 0);
  const totalDocs = PAGEINDEX_STATS.reduce((s, k) => s + k.docs, 0);
  const avgCoverage = PAGEINDEX_STATS.reduce((s, k) => s + k.coverage, 0) / PAGEINDEX_STATS.length;

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">PageIndex 管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">跨知识库管理PageIndex构建任务与覆盖率</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('kb-pageindex-tree', { selectedKBId: 'kb-001' })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <TreePine size={14} /> 查看树结构
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Zap size={14} /> 全量重建
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '索引节点总数', value: totalNodes.toLocaleString(), icon: <TreePine size={15} className="text-green-500" />, bg: 'bg-green-50' },
          { label: '已索引文档', value: `${PAGEINDEX_STATS.reduce((s, k) => s + k.indexed, 0)}/${totalDocs}`, icon: <FileText size={15} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: '平均覆盖率', value: `${avgCoverage.toFixed(1)}%`, icon: <BarChart2 size={15} className="text-purple-500" />, bg: 'bg-purple-50' },
          { label: '运行中任务', value: PAGEINDEX_TASKS.filter(t => t.status === 'running').length, icon: <RefreshCw size={15} className="text-orange-500" />, bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'tasks', label: '构建任务' },
          { id: 'coverage', label: 'KB 覆盖率' },
          { id: 'config', label: '全局配置' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {tab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <select value={selectedKB} onChange={e => setSelectedKB(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              {['全部', ...PAGEINDEX_STATS.map(k => k.kb)].map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['文档', '知识库', '节点数', '状态', '耗时', '更新时间', '操作'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PAGEINDEX_TASKS
                  .filter(t => selectedKB === '全部' || t.kb === selectedKB)
                  .map((task, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          {taskStatusCfg[task.status as keyof typeof taskStatusCfg].icon}
                          <span className="truncate">{task.doc}</span>
                        </div>
                        {task.status === 'running' && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-blue-600">{task.progress}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{task.kb}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{task.nodes > 0 ? task.nodes : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${taskStatusCfg[task.status as keyof typeof taskStatusCfg].color}`}>
                          {taskStatusCfg[task.status as keyof typeof taskStatusCfg].label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{task.time}</td>
                      <td className="py-3 px-4 text-gray-400">{task.updated}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {task.status === 'completed' && (
                            <button
                              onClick={() => onNavigate('kb-pageindex-tree', { selectedKBId: 'kb-001' })}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye size={11} /> 查看树
                            </button>
                          )}
                          {task.status === 'failed' && (
                            <button className="text-orange-600 hover:underline flex items-center gap-1">
                              <RotateCcw size={11} /> 重试
                            </button>
                          )}
                          {task.status === 'completed' && (
                            <button className="text-gray-500 hover:underline flex items-center gap-1">
                              <RefreshCw size={11} /> 重建
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coverage */}
      {tab === 'coverage' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">各知识库 PageIndex 覆盖率</h3>
          <div className="space-y-4">
            {PAGEINDEX_STATS.map((kb, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{kb.kb}</span>
                    <span className="text-[11px] text-gray-500">{kb.indexed}/{kb.docs} 文档已索引</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800">{kb.nodes.toLocaleString()} 节点</span>
                    <span className={`text-xs font-bold ${kb.coverage === 100 ? 'text-green-600' : kb.coverage >= 90 ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {kb.coverage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${kb.coverage === 100 ? 'bg-green-500' : kb.coverage >= 90 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                    style={{ width: `${kb.coverage}%` }}
                  />
                </div>
                {kb.coverage < 100 && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{kb.docs - kb.indexed} 篇文档未索引</span>
                    <button className="text-[10px] text-blue-600 hover:underline">补充索引</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config */}
      {tab === 'config' && (
        <div className="max-w-xl flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">全局 PageIndex 配置</h3>
            {[
              { label: '最大节点深度', value: '5', desc: '树的最大层级深度' },
              { label: '节点 Token 上限', value: '512', desc: '每节点最大 token 数' },
              { label: '摘要模型', value: 'gpt-4o-mini', type: 'select', options: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku'] },
              { label: '并发构建数', value: '3', desc: '同时运行的构建任务数' },
            ].map((f, i) => (
              <div key={i}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select defaultValue={f.value} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {f.options!.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input defaultValue={f.value} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                )}
                {f.desc && <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>}
              </div>
            ))}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Save size={14} /> 保存配置
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">自动触发规则</h3>
            {[
              { label: '文档上传后自动构建', enabled: true },
              { label: '文档更新后重建', enabled: true },
              { label: '定时全量重建（每周日凌晨2点）', enabled: false },
              { label: '构建失败自动重试（最多3次）', enabled: true },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{r.label}</span>
                <div className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${r.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
