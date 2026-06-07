import { useCallback, useEffect, useState } from 'react';
import {
  flattenLlmOptions,
  llmApi,
  type LlmFactory,
  type LlmModelCollection,
  type LlmModelType,
  type LlmSelectOption,
  type MyLlmCollection,
  type SetApiKeyParams,
  type TenantModels,
  type UpdateTenantModelsParams,
} from '../services/llmApi';
import { useRealApi } from '../services/http';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useAsyncData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(useRealApi);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!useRealApi) {
      setData(fallback);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message || '加载失败');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, useRealApi, ...deps]);

  return { data, loading, error, refresh };
}

const EMPTY_COLLECTION: LlmModelCollection = {};
const EMPTY_MY_LLMS: MyLlmCollection = {};
const EMPTY_FACTORIES: LlmFactory[] = [];
const EMPTY_TENANT: TenantModels = {
  tenant_id: '',
  llm_id: '',
  embd_id: '',
  asr_id: '',
  img2txt_id: '',
  rerank_id: '',
};

export function useLlmFactories() {
  return useAsyncData(() => llmApi.factories(), EMPTY_FACTORIES);
}

export function useMyLlms() {
  return useAsyncData(() => llmApi.myLlms(), EMPTY_MY_LLMS);
}

export function useLlmModels(modelType?: LlmModelType) {
  const state = useAsyncData(
    () => llmApi.list(modelType),
    EMPTY_COLLECTION,
    [modelType],
  );

  const options: LlmSelectOption[] = useRealApi
    ? flattenLlmOptions(state.data, modelType)
    : [];

  return { ...state, options };
}

export function useTenantModels() {
  return useAsyncData(() => llmApi.getTenantModels(), EMPTY_TENANT);
}

export async function saveApiKey(params: SetApiKeyParams) {
  if (!useRealApi) throw new Error('mock 模式下不支持配置 API KEY');
  return llmApi.setApiKey(params);
}

export async function updateTenantModels(params: UpdateTenantModelsParams) {
  if (!useRealApi) throw new Error('mock 模式下不支持保存租户模型');
  return llmApi.updateTenantModels(params);
}
