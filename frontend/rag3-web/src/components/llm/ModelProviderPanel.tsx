import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Key, Loader, RefreshCw } from 'lucide-react';
import {
  saveApiKey,
  updateTenantModels,
  useLlmFactories,
  useLlmModels,
  useMyLlms,
  useTenantModels,
} from '../../hooks/useLlmData';
import { LlmModelSelect } from './LlmModelSelect';

interface ModelProviderPanelProps {
  /** 保存成功回调（用于刷新 KB 列表等） */
  onSaved?: () => void;
  /** 紧凑模式：隐藏已配置厂商列表 */
  compact?: boolean;
}

export function ModelProviderPanel({ onSaved, compact }: ModelProviderPanelProps) {
  const { data: factories, loading: factoriesLoading } = useLlmFactories();
  const { data: myLlms, loading: myLlmsLoading, refresh: refreshMyLlms } = useMyLlms();
  const { data: tenant, loading: tenantLoading, refresh: refreshTenant } = useTenantModels();
  const { options: embeddingOptions, loading: embLoading, refresh: refreshEmb } = useLlmModels('embedding');
  const { options: chatOptions, loading: chatLoading, refresh: refreshChat } = useLlmModels('chat');
  const { options: rerankOptions, loading: rerankLoading, refresh: refreshRerank } = useLlmModels('rerank');

  const [factory, setFactory] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState(false);

  const [embdId, setEmbdId] = useState('');
  const [llmId, setLlmId] = useState('');
  const [rerankId, setRerankId] = useState('');
  const [asrId, setAsrId] = useState('');
  const [img2txtId, setImg2txtId] = useState('');
  const [modelSaving, setModelSaving] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelSuccess, setModelSuccess] = useState(false);

  useEffect(() => {
    if (!tenant.tenant_id) return;
    setEmbdId(tenant.embd_id || '');
    setLlmId(tenant.llm_id || '');
    setRerankId(tenant.rerank_id || '');
    setAsrId(tenant.asr_id || '');
    setImg2txtId(tenant.img2txt_id || '');
  }, [tenant]);

  useEffect(() => {
    if (!factory && factories.length > 0) {
      const preferred = factories.find(f =>
        ['OpenAI', 'DeepSeek', 'ZHIPU-AI', 'Tongyi-Qianwen', 'Ollama'].includes(f.name),
      );
      setFactory(preferred?.name || factories[0].name);
    }
  }, [factories, factory]);

  const refreshAll = () => {
    refreshMyLlms();
    refreshTenant();
    refreshEmb();
    refreshChat();
    refreshRerank();
  };

  const handleSaveApiKey = async () => {
    if (!factory || !apiKey.trim()) {
      setKeyError('请选择厂商并填写 API KEY');
      return;
    }
    setKeySaving(true);
    setKeyError(null);
    setKeySuccess(false);
    try {
      await saveApiKey({
        llm_factory: factory,
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || undefined,
      });
      setKeySuccess(true);
      setApiKey('');
      refreshAll();
      setTimeout(() => setKeySuccess(false), 2500);
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : '保存 API KEY 失败');
    } finally {
      setKeySaving(false);
    }
  };

  const handleSaveTenantModels = async () => {
    if (!tenant.tenant_id) {
      setModelError('租户信息未加载');
      return;
    }
    if (!embdId) {
      setModelError('请至少选择默认嵌入模型（文档解析必需）');
      return;
    }
    setModelSaving(true);
    setModelError(null);
    setModelSuccess(false);
    try {
      await updateTenantModels({
        tenant_id: tenant.tenant_id,
        embd_id: embdId,
        llm_id: llmId || embdId,
        asr_id: asrId || embdId,
        img2txt_id: img2txtId || llmId || embdId,
        rerank_id: rerankId || undefined,
      });
      setModelSuccess(true);
      refreshTenant();
      onSaved?.();
      setTimeout(() => setModelSuccess(false), 2500);
    } catch (e) {
      setModelError(e instanceof Error ? e.message : '保存默认模型失败');
    } finally {
      setModelSaving(false);
    }
  };

  const configuredFactories = Object.keys(myLlms);
  const missingEmbd = !tenantLoading && !tenant.embd_id;

  return (
    <div className="space-y-6 max-w-2xl">
      {missingEmbd && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">未配置默认嵌入模型</p>
            <p className="mt-0.5 text-amber-800">文档解析会失败（task_executor: No default embedding model is set）。请先添加平台 API KEY 并设置默认嵌入模型。</p>
          </div>
        </div>
      )}

      {/* API KEY */}
      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">平台 API KEY</h4>
        </div>
        <p className="text-[11px] text-gray-500">对接 RAGFlow 厂商配置：保存 KEY 后自动拉取该厂商下的嵌入、对话、重排等模型。</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">模型厂商</label>
            <select
              value={factory}
              onChange={e => setFactory(e.target.value)}
              disabled={factoriesLoading}
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              {factoriesLoading && <option>加载中…</option>}
              {factories.map(f => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Base URL（可选）</label>
            <input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">API KEY</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-…"
            className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        {keyError && <p className="text-xs text-red-600">{keyError}</p>}
        {keySuccess && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle size={12} /> API KEY 已保存并验证
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSaveApiKey()}
          disabled={keySaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {keySaving ? <><Loader size={12} className="animate-spin" /> 验证并保存…</> : '保存 API KEY'}
        </button>
      </section>

      {!compact && configuredFactories.length > 0 && (
        <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">已配置厂商</h4>
            <button
              type="button"
              onClick={refreshAll}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RefreshCw size={12} /> 刷新
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {configuredFactories.map(name => (
              <span
                key={name}
                className="text-[11px] px-2 py-1 bg-green-50 text-green-800 border border-green-200 rounded-full"
              >
                {name} · {myLlms[name]?.llm?.length ?? 0} 模型
              </span>
            ))}
          </div>
          {myLlmsLoading && <p className="text-[10px] text-gray-400 mt-2">加载中…</p>}
        </section>
      )}

      {/* 租户默认模型 */}
      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">租户默认模型</h4>
        <p className="text-[11px] text-gray-500">新建知识库与文档解析将使用默认嵌入模型；格式为 <code className="text-[10px]">模型名@厂商</code>。</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">嵌入模型 <span className="text-red-500">*</span></label>
            <LlmModelSelect
              value={embdId}
              onChange={setEmbdId}
              options={embeddingOptions}
              loading={embLoading || tenantLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">对话模型</label>
            <LlmModelSelect
              value={llmId}
              onChange={setLlmId}
              options={chatOptions}
              loading={chatLoading || tenantLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">重排序模型</label>
            <LlmModelSelect
              value={rerankId}
              onChange={setRerankId}
              options={rerankOptions}
              loading={rerankLoading || tenantLoading}
              emptyHint="可选：配置 KEY 后选择重排模型"
            />
          </div>
        </div>

        {modelError && <p className="text-xs text-red-600">{modelError}</p>}
        {modelSuccess && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle size={12} /> 默认模型已保存
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSaveTenantModels()}
          disabled={modelSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {modelSaving ? <><Loader size={12} className="animate-spin" /> 保存中…</> : '保存默认模型'}
        </button>
      </section>
    </div>
  );
}
