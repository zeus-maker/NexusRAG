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
  return positions.map(pos => {
    let pageNumber = Number(pos[0]);
    if (!Number.isFinite(pageNumber)) pageNumber = 1;
    if (pageNumber <= 0) pageNumber += 1;
    return {
      pageNumber,
      x1: Number(pos[1]),
      x2: Number(pos[2]),
      y1: Number(pos[3]),
      y2: Number(pos[4]),
    };
  }).filter(r => r.x2 > r.x1 && r.y2 > r.y1);
}

export type DocumentPreviewKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'html'
  | 'csv'
  | 'excel'
  | 'office'
  | 'unknown';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tif', 'tiff']);
const TEXT_EXTS = new Set(['txt', 'log', 'json', 'xml']);
const MD_EXTS = new Set(['md', 'mdx']);
const HTML_EXTS = new Set(['html', 'htm']);
const CSV_EXTS = new Set(['csv']);
const EXCEL_EXTS = new Set(['xlsx', 'xls']);
const OFFICE_EXTS = new Set(['doc', 'docx', 'ppt', 'pptx']);

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function isPdfFileName(name: string): boolean {
  return fileExtension(name) === 'pdf';
}

export function getDocumentPreviewKind(name: string, fileType?: string): DocumentPreviewKind {
  const ext = fileExtension(name);
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (CSV_EXTS.has(ext)) return 'csv';
  if (EXCEL_EXTS.has(ext)) return 'excel';
  if (MD_EXTS.has(ext)) return 'markdown';
  if (HTML_EXTS.has(ext)) return 'html';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (OFFICE_EXTS.has(ext)) return 'office';
  const ft = (fileType || '').toLowerCase();
  if (ft.includes('spreadsheet') || ft.includes('excel')) return 'excel';
  if (ft.includes('csv')) return 'csv';
  if (ft.includes('image')) return 'image';
  if (ft.includes('pdf')) return 'pdf';
  return 'unknown';
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

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
