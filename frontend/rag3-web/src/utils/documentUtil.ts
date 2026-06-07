import type { Chunk } from '../types';

export interface PdfHighlightRect {
  pageNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 对齐 RAGFlow buildChunkHighlights：positions = [[page, left, right, top, bottom], ...] */
export function buildChunkHighlightRects(
  chunk: Pick<Chunk, 'positions' | 'content_preview'> | null | undefined,
): PdfHighlightRect[] {
  const positions = chunk?.positions;
  if (!positions?.length || !positions.every(p => Array.isArray(p) && p.length >= 5)) {
    return [];
  }
  return positions.map(pos => ({
    pageNumber: Number(pos[0]) || 1,
    x1: Number(pos[1]),
    x2: Number(pos[2]),
    y1: Number(pos[3]),
    y2: Number(pos[4]),
  })).filter(r => r.x2 > r.x1 && r.y2 > r.y1);
}

export function isPdfFileName(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'pdf';
}

/** 解析日志行高亮（对齐 RAGFlow ProcessLogModal.replaceText） */
export function renderProgressLogLines(text: string): { text: string; isError: boolean }[] {
  const normalized = text.replace(/(\n)\1+/g, '$1').trim();
  if (!normalized) return [];
  return normalized.split('\n').map(line => ({
    text: line,
    isError: /\[ERROR\]/i.test(line),
  }));
}

export function parseProgressPercent(progress?: number, status?: string): number {
  if (typeof progress === 'number' && progress > 0) {
    return Math.min(100, Math.round(progress <= 1 ? progress * 100 : progress));
  }
  if (status === 'parsed') return 100;
  if (status === 'parsing') return 50;
  if (status === 'failed') return 100;
  return 0;
}
