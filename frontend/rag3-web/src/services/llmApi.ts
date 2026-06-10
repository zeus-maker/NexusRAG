/**
 * RAGFlow LLM 厂商与模型配置 API
 * - /v1/llm/*：厂商列表、API KEY、可用模型
 * - /api/v1/users/me/models：租户默认模型
 */
import { apiRequest, legacyApiRequest } from './http';

export type LlmModelType =
  | 'embedding'
  | 'chat'
  | 'rerank'
  | 'image2text'
  | 'speech2text'
  | 'tts'
  | 'ocr';

export interface LlmFactory {
  name: string;
  logo?: string;
  tags?: string;
  status?: string;
  model_types?: string[];
}

export interface LlmModelItem {
  id?: number | null;
  llm_name: string;
  fid: string;
  model_type: string;
  available: boolean;
  status: string;
  max_tokens?: number;
  tags?: string;
}

export type LlmModelCollection = Record<string, LlmModelItem[]>;

export interface MyLlmEntry {
  id?: number;
  type: string;
  name: string;
  used_token?: number;
  status?: string;
}

export type MyLlmCollection = Record<
  string,
  { tags?: string | null; llm: MyLlmEntry[] }
>;

export interface TenantModels {
  tenant_id: string;
  name?: string;
  llm_id: string;
  embd_id: string;
  asr_id: string;
  img2txt_id: string;
  rerank_id?: string;
  tts_id?: string;
}

export interface SetApiKeyParams {
  llm_factory: string;
  api_key: string;
  base_url?: string;
  verify?: boolean;
}

export interface UpdateTenantModelsParams {
  tenant_id: string;
  llm_id: string;
  embd_id: string;
  asr_id: string;
  img2txt_id: string;
  rerank_id?: string;
  tts_id?: string;
  name?: string;
}

export interface LlmSelectOption {
  value: string;
  label: string;
  factory: string;
  disabled?: boolean;
}

export function buildLlmValue(name: string, factory: string) {
  return `${name}@${factory}`;
}

export function flattenLlmOptions(
  collection: LlmModelCollection,
  modelType?: LlmModelType,
): LlmSelectOption[] {
  const options: LlmSelectOption[] = [];
  for (const [factory, models] of Object.entries(collection)) {
    for (const m of models) {
      if (modelType && !m.model_type.includes(modelType)) continue;
      if (m.status !== '1') continue;
      options.push({
        value: buildLlmValue(m.llm_name, m.fid || factory),
        label: `${m.llm_name} · ${m.fid || factory}`,
        factory: m.fid || factory,
        disabled: !m.available,
      });
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
}

/** 将当前值校正为租户已配置模型（name@factory）；无效时回退租户默认或首个可用项 */
export function resolveLlmSelectValue(
  current: string,
  options: LlmSelectOption[],
  tenantDefault?: string,
): string {
  const available = options.filter(o => !o.disabled);
  if (current && available.some(o => o.value === current)) return current;
  if (tenantDefault && available.some(o => o.value === tenantDefault)) return tenantDefault;
  return available[0]?.value ?? '';
}

export const llmApi = {
  factories: async () => {
    const { data } = await legacyApiRequest<LlmFactory[]>('/llm/factories');
    return data;
  },

  list: async (modelType?: LlmModelType) => {
    const qs = modelType ? `?model_type=${modelType}` : '';
    const { data } = await legacyApiRequest<LlmModelCollection>(`/llm/list${qs}`);
    return data;
  },

  myLlms: async () => {
    const { data } = await legacyApiRequest<MyLlmCollection>('/llm/my_llms');
    return data;
  },

  setApiKey: async (params: SetApiKeyParams) => {
    const { data } = await legacyApiRequest<boolean>('/llm/set_api_key', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  },

  getTenantModels: async () => {
    const { data } = await apiRequest<TenantModels>('/users/me/models');
    return data;
  },

  updateTenantModels: async (params: UpdateTenantModelsParams) => {
    const { data } = await apiRequest<boolean>('/users/me/models', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
    return data;
  },
};
