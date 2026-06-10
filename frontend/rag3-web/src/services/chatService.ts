import { apiRequest } from './http';
import { postSseStream, type SseEvent } from './sseClient';
import type { ChatSettings } from '../components/ChatSettingsPanel';

export interface ConversationRecord {
  conversation_id: string;
  title: string;
  kb_ids: string[];
  model?: string;
  strategy?: string;
  pinned?: boolean;
  message_count?: number;
  created_at: string;
  updated_at: string;
  settings?: Partial<ChatSettings>;
}

export interface ConversationMessage {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<Record<string, unknown>>;
  routing_tier?: string;
  retrieval_channels?: string[];
  confidence?: { score: number; level: string };
  token_usage?: { total_tokens: number };
  latency_ms?: number | Record<string, number>;
  trace?: Record<string, unknown>;
  feedback_status?: string;
  created_at: string;
  is_streaming?: boolean;
}

export interface QueryParseResult {
  original: string;
  free_text: string;
  metadata_filters: {
    conditions: Array<{ name: string; comparison_operator: string; value: string }>;
    logical_operator: string;
  };
  page_range?: { start: number; end: number } | null;
  phrases?: string[];
  autocomplete_hints?: Array<{ field: string; value: string }>;
}

/** 后端会话 settings → 前端 ChatSettings 字段 */
export function mapApiSettingsToChat(
  raw: Record<string, unknown>,
  base: ChatSettings,
): ChatSettings {
  return {
    ...base,
    systemPrompt: String(raw.system_prompt ?? base.systemPrompt),
    opener: String(raw.opener ?? base.opener),
    topK: Number(raw.top_k) || base.topK,
    rerankEnabled: Boolean(raw.use_rerank ?? base.rerankEnabled),
    rerankModel: String(raw.rerank_model ?? base.rerankModel),
    temperature: Number(raw.temperature) || base.temperature,
    maxTokens: Number(raw.max_tokens) || base.maxTokens,
    llmModel: String(raw.llm_model ?? base.llmModel),
    similarityThreshold: Number(raw.similarity_threshold) || base.similarityThreshold,
    vectorWeight: Number(raw.vector_weight) || base.vectorWeight,
    channelWiki: Boolean(raw.channel_wiki ?? base.channelWiki),
    channelPageIndex: Boolean(raw.channel_pageindex ?? base.channelPageIndex),
    channelGraph: Boolean(raw.channel_graph ?? base.channelGraph),
    showCitations: Boolean(raw.show_citations ?? base.showCitations),
    showTrace: Boolean(raw.show_trace ?? base.showTrace),
    streaming: Boolean(raw.streaming ?? base.streaming),
  };
}

export function mapSettingsToApi(
  settings: ChatSettings,
  extra?: { metadataFilters?: QueryParseResult['metadata_filters']; userRoles?: string[] },
) {
  const pipeline_ids: string[] = ['vector'];
  if (settings.channelPageIndex) pipeline_ids.push('pageindex');
  if (settings.channelWiki) pipeline_ids.push('wiki');
  if (settings.channelGraph) pipeline_ids.push('graph');
  return {
    system_prompt: settings.systemPrompt,
    opener: settings.opener,
    similarity_threshold: settings.similarityThreshold,
    vector_weight: settings.vectorWeight,
    top_k: settings.topK,
    use_rerank: settings.rerankEnabled,
    rerank_model: settings.rerankModel,
    channel_graph: settings.channelGraph,
    channel_wiki: settings.channelWiki,
    channel_pageindex: settings.channelPageIndex,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    llm_model: settings.llmModel,
    show_citations: settings.showCitations,
    show_trace: settings.showTrace,
    streaming: settings.streaming,
    pipeline_ids,
    metadata_filters: extra?.metadataFilters,
    user_roles: extra?.userRoles,
  };
}

export const chatService = {
  async listConversations(search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const { data } = await apiRequest<{ items: ConversationRecord[]; total: number }>(
      `/conversations${q}`,
    );
    return data.items ?? [];
  },

  async createConversation(kbIds: string[], title = '新对话', strategy = 'auto') {
    const { data } = await apiRequest<ConversationRecord>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ kb_ids: kbIds, title, strategy }),
    });
    return data;
  },

  async deleteConversation(convId: string) {
    await apiRequest(`/conversations/${convId}`, { method: 'DELETE' });
  },

  async patchConversation(convId: string, patch: Partial<ConversationRecord>) {
    const { data } = await apiRequest<ConversationRecord>(`/conversations/${convId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return data;
  },

  async getMessages(convId: string, limit = 50) {
    const { data } = await apiRequest<{ messages: ConversationMessage[] }>(
      `/conversations/${convId}/messages?limit=${limit}`,
    );
    return data.messages ?? [];
  },

  async getSettings(convId: string) {
    const { data } = await apiRequest<Record<string, unknown>>(`/conversations/${convId}/settings`);
    return data;
  },

  async saveSettings(convId: string, settings: ChatSettings) {
    const { data } = await apiRequest<Record<string, unknown>>(`/conversations/${convId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(mapSettingsToApi(settings)),
    });
    return data;
  },

  async sendMessageSync(
    convId: string,
    message: string,
    settings: ChatSettings,
    options?: { pipelineIds?: string[]; metadataFilters?: QueryParseResult['metadata_filters']; userRoles?: string[] },
  ) {
    const { data } = await apiRequest<ConversationMessage>(`/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        stream: false,
        settings: mapSettingsToApi(settings, {
          metadataFilters: options?.metadataFilters,
          userRoles: options?.userRoles,
        }),
        kb_ids: settings.kbIds,
        pipeline_ids: options?.pipelineIds,
        user_roles: options?.userRoles,
      }),
    });
    return data;
  },

  async sendMessageStream(
    convId: string,
    message: string,
    settings: ChatSettings,
    handlers: {
      onEvent: (evt: SseEvent) => void;
      signal?: AbortSignal;
      pipelineIds?: string[];
      metadataFilters?: QueryParseResult['metadata_filters'];
      userRoles?: string[];
    },
  ) {
    await postSseStream({
      path: `/conversations/${convId}/messages`,
      body: {
        message,
        stream: true,
        settings: mapSettingsToApi(settings, {
          metadataFilters: handlers.metadataFilters,
          userRoles: handlers.userRoles,
        }),
        kb_ids: settings.kbIds,
        pipeline_ids: handlers.pipelineIds,
        user_roles: handlers.userRoles,
      },
      signal: handlers.signal,
      onEvent: handlers.onEvent,
    });
  },

  async submitFeedback(convId: string, msgId: string, feedbackType: string, correctionText?: string) {
    const { data } = await apiRequest<Record<string, unknown>>(
      `/conversations/${convId}/messages/${msgId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify({ feedback_type: feedbackType, correction_text: correctionText }),
      },
    );
    return data;
  },

  async compare(convId: string, message: string, strategyA = 'precise', strategyB = 'comprehensive') {
    const { data } = await apiRequest<{
      answer_a: string;
      answer_b: string;
      citations_a?: unknown[];
      citations_b?: unknown[];
    }>(`/conversations/${convId}/compare`, {
      method: 'POST',
      body: JSON.stringify({ message, strategy_a: strategyA, strategy_b: strategyB }),
    });
    return data;
  },

  async parseQuery(query: string) {
    const { data } = await apiRequest<QueryParseResult>('/rag3/query/parse', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return data;
  },

  async rewriteQuery(query: string, kbId?: string) {
    const { data } = await apiRequest<{
      original: string;
      rewritten: string;
      classification: Record<string, unknown>;
    }>('/rag3/query/rewrite', {
      method: 'POST',
      body: JSON.stringify({ query, kb_id: kbId }),
    });
    return data;
  },
};
