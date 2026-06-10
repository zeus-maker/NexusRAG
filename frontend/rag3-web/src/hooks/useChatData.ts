import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { mockConversations } from '../mockData';
import { CONV_MESSAGES, CONV_PINNED, QUERY_TRACE_STEPS } from '../data/chatMock';
import { DEFAULT_CHAT_SETTINGS, type ChatSettings } from '../components/ChatSettingsPanel';
import { chatService, type ConversationRecord, type QueryParseResult } from '../services/chatService';
import { useRealApi } from '../services/http';
import { useKnowledgeBaseList } from './useKbData';
import type { ChatMessage, Citation, Conversation } from '../types';
import type { SseEvent } from '../services/sseClient';

function mapApiConv(c: ConversationRecord): Conversation {
  return {
    conv_id: c.conversation_id,
    title: c.title,
    kb_ids: c.kb_ids ?? [],
    message_count: c.message_count ?? 0,
    created_at: c.created_at,
    last_message: '',
  };
}

function mapApiMessage(m: {
  message_id: string;
  role: string;
  content: string;
  citations?: Array<Record<string, unknown>>;
  routing_tier?: string;
  retrieval_channels?: string[];
  confidence?: { score: number };
  latency_ms?: number | Record<string, number>;
  trace?: Record<string, unknown>;
  feedback_status?: string;
  created_at: string;
}): ChatMessage {
  const citations: Citation[] = (m.citations ?? []).map((c, i) => ({
    index: Number(c.index) || i + 1,
    doc_name: String(c.doc_name ?? ''),
    page_number: Number(c.page_number) || 0,
    section: String(c.section ?? ''),
    snippet: String(c.snippet ?? ''),
    relevance_score: Number(c.relevance_score) || 0,
    doc_id: c.doc_id ? String(c.doc_id) : undefined,
    chunk_id: c.chunk_id ? String(c.chunk_id) : undefined,
  })) as Citation[] & { doc_id?: string; chunk_id?: string };

  const lat = typeof m.latency_ms === 'number' ? m.latency_ms : (m.latency_ms as Record<string, number> | undefined)?.total;

  return {
    id: m.message_id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    citations,
    confidence: m.confidence?.score,
    confidence_level: (m.confidence?.score ?? 0) >= 0.8 ? 'high' : 'medium',
    routing_tier: m.routing_tier,
    channels: m.retrieval_channels,
    latency_ms: lat,
    created_at: m.created_at,
    trace: m.trace,
    feedback_status: m.feedback_status,
  } as ChatMessage & { trace?: Record<string, unknown>; feedback_status?: string };
}

export interface TraceStep {
  stage: string;
  ms: number;
  detail: string;
}

export function traceFromMetadata(trace?: Record<string, unknown>): TraceStep[] {
  if (!trace) return QUERY_TRACE_STEPS;
  const channels = (trace.channels as Array<{ channel: string; latency_ms: number; hit_count: number }> | undefined) ?? [];
  const steps: TraceStep[] = [
    { stage: '分类', ms: 50, detail: String((trace.classification as Record<string, unknown> | undefined)?.query_tier ?? '—') },
    { stage: '路由', ms: 20, detail: String(trace.routing_reason ?? '') },
  ];
  for (const ch of channels) {
    steps.push({ stage: ch.channel, ms: ch.latency_ms || 0, detail: `${ch.hit_count} hits` });
  }
  steps.push({ stage: '融合', ms: 30, detail: `${trace.fusion_count ?? 0} → ${trace.rerank_count ?? 0}` });
  return steps.length > 2 ? steps : QUERY_TRACE_STEPS;
}

export function useChatData(initialConvId: string | null) {
  const { data: kbList } = useKnowledgeBaseList('name', false, '', 1, 100, 'all');
  const kbs = kbList?.items ?? [];

  const [conversations, setConversations] = useState<Conversation[]>(useRealApi ? [] : mockConversations);
  const [pinned, setPinned] = useState<Set<string>>(new Set(CONV_PINNED));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [currentConv, setCurrentConv] = useState<string | null>(initialConvId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastCompareB, setLastCompareB] = useState('');
  const [rewriteInfo, setRewriteInfo] = useState<{ original: string; rewritten: string } | null>(null);
  const [loading, setLoading] = useState(useRealApi);

  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshConversations = useCallback(async (search = '') => {
    if (!useRealApi) {
      setConversations(mockConversations);
      return;
    }
    setLoading(true);
    try {
      const items = await chatService.listConversations(search);
      setConversations(items.map(mapApiConv));
      const pinSet = new Set<string>();
      items.forEach(c => { if (c.pinned) pinSet.add(c.conversation_id); });
      if (pinSet.size) setPinned(pinSet);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshConversations(); }, [refreshConversations]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (currentConv) return currentConv;
    if (!useRealApi) return null;
    const kbIds = chatSettings.kbIds.filter(Boolean);
    if (!kbIds.length) throw new Error('请先选择知识库');
    const conv = await chatService.createConversation(kbIds, chatSettings.convTitle);
    setCurrentConv(conv.conversation_id);
    setConversations(prev => [mapApiConv(conv), ...prev]);
    return conv.conversation_id;
  }, [currentConv, chatSettings.kbIds, chatSettings.convTitle]);

  const loadConversation = useCallback(async (id: string) => {
    setCurrentConv(id);
    const conv = conversations.find(c => c.conv_id === id);
    if (conv) {
      setChatSettings(s => ({
        ...s,
        convTitle: conv.title,
        kbIds: [...conv.kb_ids],
      }));
    }
    if (!useRealApi) {
      setMessages(CONV_MESSAGES[id] ? [...CONV_MESSAGES[id]] : []);
      return;
    }
    setLoading(true);
    try {
      const [msgs, settings] = await Promise.all([
        chatService.getMessages(id),
        chatService.getSettings(id).catch(() => ({})),
      ]);
      setMessages(msgs.map(mapApiMessage));
      if (settings && Object.keys(settings).length) {
        setChatSettings(s => ({
          ...s,
          systemPrompt: String(settings.system_prompt ?? s.systemPrompt),
          opener: String(settings.opener ?? s.opener),
          topK: Number(settings.top_k) || s.topK,
          rerankEnabled: Boolean(settings.use_rerank ?? s.rerankEnabled),
          temperature: Number(settings.temperature) || s.temperature,
          maxTokens: Number(settings.max_tokens) || s.maxTokens,
          llmModel: String(settings.llm_model ?? s.llmModel),
          similarityThreshold: Number(settings.similarity_threshold) || s.similarityThreshold,
          vectorWeight: Number(settings.vector_weight) || s.vectorWeight,
          channelWiki: Boolean(settings.channel_wiki ?? s.channelWiki),
          channelPageIndex: Boolean(settings.channel_pageindex ?? s.channelPageIndex),
          channelGraph: Boolean(settings.channel_graph ?? s.channelGraph),
          streaming: Boolean(settings.streaming ?? s.streaming),
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [conversations]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamRef.current) clearInterval(streamRef.current);
    streamRef.current = null;
    setIsStreaming(false);
    setMessages(prev => prev.map(m => m.is_streaming ? { ...m, is_streaming: false } : m));
  }, []);

  const mockStream = useCallback((aiMsgId: string, fullContent: string, meta: Partial<ChatMessage>) => {
    setIsStreaming(true);
    let charIndex = 0;
    streamRef.current = setInterval(() => {
      charIndex += Math.floor(Math.random() * 6) + 3;
      if (charIndex >= fullContent.length) {
        if (streamRef.current) clearInterval(streamRef.current);
        streamRef.current = null;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent, ...meta, is_streaming: false } : m));
        setIsStreaming(false);
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent.slice(0, charIndex) } : m));
      }
    }, 25);
  }, []);

  const sendMessage = useCallback(async (
    text: string,
    options?: {
      pipelineIds?: string[];
      kbId?: string;
      metadataFilters?: QueryParseResult['metadata_filters'];
      userRoles?: string[];
      attachmentNote?: string;
    },
  ) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    const displayText = options?.attachmentNote
      ? `${trimmed}\n\n${options.attachmentNote}`
      : trimmed;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: displayText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    if (useRealApi && chatSettings.kbIds.length) {
      try {
        const convId = await ensureConversation();
        if (!convId) return;

        if (chatSettings.streaming) {
          const aiMsgId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, {
            id: aiMsgId, role: 'assistant', content: '', citations: [], is_streaming: true, created_at: new Date().toISOString(),
          }]);
          setIsStreaming(true);
          abortRef.current = new AbortController();
          let content = '';
          const citations: Citation[] = [];
          let meta: Partial<ChatMessage> = {};

          await chatService.sendMessageStream(convId, trimmed, chatSettings, {
            pipelineIds: options?.pipelineIds,
            metadataFilters: options?.metadataFilters,
            userRoles: options?.userRoles,
            signal: abortRef.current.signal,
            onEvent: (evt: SseEvent) => {
              if (evt.event === 'token') {
                content += String(evt.data.content ?? '');
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content } : m));
              } else if (evt.event === 'citation') {
                const c = evt.data;
                citations.push({
                  index: Number(c.index) || citations.length + 1,
                  doc_name: String(c.doc_name ?? ''),
                  page_number: Number(c.page) || Number(c.page_number) || 0,
                  section: String(c.snippet ?? '').slice(0, 48),
                  snippet: String(c.snippet ?? '').slice(0, 200),
                  relevance_score: Number(c.relevance_score) || 0,
                  doc_id: c.doc_id ? String(c.doc_id) : undefined,
                } as Citation);
              } else if (evt.event === 'confidence') {
                meta.confidence = Number(evt.data.score) || 0;
                meta.confidence_level = String(evt.data.level) as ChatMessage['confidence_level'];
              } else if (evt.event === 'routing') {
                meta.routing_tier = String(evt.data.tier ?? '');
                meta.channels = (evt.data.channels as string[]) ?? [];
              } else if (evt.event === 'done') {
                meta.latency_ms = Number(evt.data.latency_ms) || 0;
                meta.trace = evt.data.trace as Record<string, unknown>;
              }
            },
          });

          setMessages(prev => prev.map(m => m.id === aiMsgId ? {
            ...m, content, citations, ...meta, is_streaming: false,
          } : m));
          setIsStreaming(false);
          void refreshConversations();
          return;
        }

        const res = await chatService.sendMessageSync(convId, trimmed, chatSettings, {
          pipelineIds: options?.pipelineIds,
          metadataFilters: options?.metadataFilters,
          userRoles: options?.userRoles,
        });
        setMessages(prev => [...prev, mapApiMessage(res)]);
        void refreshConversations();
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `请求失败：${err instanceof Error ? err.message : '未知错误'}`,
          created_at: new Date().toISOString(),
        }]);
        setIsStreaming(false);
        throw err;
      }
    }

    const mockContent = `（Mock）关于「${trimmed}」的示例回答。请开启 VITE_USE_REAL_API 使用真实 RAG3 对话。`;
    const aiMsgId = (Date.now() + 1).toString();
    if (chatSettings.streaming) {
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', is_streaming: true, created_at: new Date().toISOString() }]);
      mockStream(aiMsgId, mockContent, { routing_tier: 'Tier 2', channels: ['vector'], confidence: 0.85 });
    } else {
      setMessages(prev => [...prev, {
        id: aiMsgId, role: 'assistant', content: mockContent,
        routing_tier: 'Tier 2', channels: ['vector'], confidence: 0.85,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [isStreaming, chatSettings, ensureConversation, mockStream, refreshConversations]);

  const saveSettings = useCallback(async () => {
    if (!useRealApi || !currentConv) return;
    await chatService.saveSettings(currentConv, chatSettings);
  }, [currentConv, chatSettings]);

  const deleteConversation = useCallback(async (id: string) => {
    if (useRealApi) await chatService.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.conv_id !== id));
    if (currentConv === id) {
      setCurrentConv(null);
      setMessages([]);
    }
  }, [currentConv]);

  const togglePin = useCallback(async (id: string) => {
    const nextPinned = !pinned.has(id);
    setPinned(prev => {
      const next = new Set(prev);
      if (nextPinned) next.add(id); else next.delete(id);
      return next;
    });
    if (useRealApi) await chatService.patchConversation(id, { pinned: nextPinned } as Partial<ConversationRecord>);
  }, [pinned]);

  const runCompare = useCallback(async (query: string) => {
    if (!useRealApi || !currentConv) {
      setLastCompareB('（Mock）对比策略 B 的备选答案片段…');
      return;
    }
    const res = await chatService.compare(currentConv, query);
    setLastCompareB(res.answer_b || '');
  }, [currentConv]);

  const submitFeedback = useCallback(async (msgId: string, type: 'thumbs_up' | 'thumbs_down' | 'correction', correction?: string) => {
    if (!useRealApi || !currentConv) return;
    await chatService.submitFeedback(currentConv, msgId, type, correction);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback_status: type } as ChatMessage : m));
  }, [currentConv]);

  const fetchRewrite = useCallback(async (query: string) => {
    if (!useRealApi) {
      setRewriteInfo({ original: query, rewritten: query });
      return;
    }
    const kbId = chatSettings.kbIds[0];
    const res = await chatService.rewriteQuery(query, kbId);
    setRewriteInfo({ original: res.original, rewritten: res.rewritten });
  }, [chatSettings.kbIds]);

  const kbOptions = useMemo(() => kbs.map(kb => ({
    kb_id: kb.kb_id,
    name: kb.name,
    icon: kb.icon || '📚',
  })), [kbs]);

  return {
    conversations,
    pinned,
    messages,
    setMessages,
    chatSettings,
    setChatSettings,
    currentConv,
    setCurrentConv,
    isStreaming,
    loading,
    lastCompareB,
    rewriteInfo,
    kbOptions,
    isApiMode: useRealApi,
    refreshConversations,
    loadConversation,
    sendMessage,
    stopStream,
    saveSettings,
    deleteConversation,
    togglePin,
    runCompare,
    submitFeedback,
    fetchRewrite,
    ensureConversation,
  };
}
