import { getStoredAuth } from './http';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const API_VERSION = 'v1';

export interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

export interface SseStreamOptions {
  path: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
  onEvent: (evt: SseEvent) => void;
}

function parseSseChunk(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  for (const block of parts) {
    let event = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) continue;
    try {
      events.push({ event, data: JSON.parse(dataStr) as Record<string, unknown> });
    } catch {
      events.push({ event, data: { content: dataStr } });
    }
  }
  return { events, rest };
}

export async function postSseStream({ path, body, signal, onEvent }: SseStreamOptions): Promise<void> {
  const res = await fetch(`${API_BASE}/${API_VERSION}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(getStoredAuth() ? { Authorization: getStoredAuth() } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('SSE 流不可用');

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;
    for (const evt of parsed.events) onEvent(evt);
  }
  if (buffer.trim()) {
    const parsed = parseSseChunk(buffer + '\n\n');
    for (const evt of parsed.events) onEvent(evt);
  }
}
