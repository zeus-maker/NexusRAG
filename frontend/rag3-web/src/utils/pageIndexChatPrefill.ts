const STORAGE_KEY = 'rag3-chat-prefill';

export interface PageIndexChatPrefill {
  kbId: string;
  query: string;
  docId?: string;
  docName?: string;
  pipeline?: 'pageindex';
  pipelineIds?: string[];
  autoSend?: boolean;
}

export function stashPageIndexChatPrefill(payload: PageIndexChatPrefill) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...payload,
      pipeline: 'pageindex',
      pipelineIds: payload.pipelineIds ?? ['pageindex'],
    }));
  } catch {
    /* ignore */
  }
}

export function consumePageIndexChatPrefill(): PageIndexChatPrefill | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const data = JSON.parse(raw) as PageIndexChatPrefill;
    return data?.kbId && data?.query ? data : null;
  } catch {
    return null;
  }
}

export function openPageIndexChatTest(
  onNavigate: (page: string, extra?: Record<string, unknown>) => void,
  payload: PageIndexChatPrefill,
) {
  stashPageIndexChatPrefill(payload);
  onNavigate('chat', {
    selectedKBId: payload.kbId,
    selectedConvId: null,
  });
}
