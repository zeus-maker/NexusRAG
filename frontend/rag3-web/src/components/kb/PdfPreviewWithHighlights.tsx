import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfHighlightRect } from '../../utils/documentUtil';
import { ChevronLeft, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const VISIBLE_BUFFER = 1; // 视口上下各多渲染 1 页

interface Props {
  url: string;
  highlights?: PdfHighlightRect[];
  className?: string;
}

interface PageMeta {
  pageNumber: number;
  width: number;
  height: number;
}

export function PdfPreviewWithHighlights({ url, highlights = [], className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const renderedRef = useRef<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageSize, setPageSize] = useState<PageMeta | null>(null);
  const [refSize, setRefSize] = useState<{ width: number; height: number } | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(() => new Set());
  const [focusPage, setFocusPage] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 2 });

  const highlightPage = highlights[0]?.pageNumber ?? 1;

  const renderPage = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current;
    if (!pdf || renderedRef.current.has(pageNumber)) return;

    const canvas = canvasRefs.current[pageNumber];
    if (!canvas) return;

    const containerWidth = containerRef.current?.clientWidth || 400;
    const page1 = await pdf.getPage(1);
    const vp1 = page1.getViewport({ scale: 1 });
    const s = Math.min(1.5, Math.max(0.55, (containerWidth - 24) / vp1.width));

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: s });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    renderedRef.current.add(pageNumber);
    setRenderedPages(prev => new Set(prev).add(pageNumber));

    if (pageNumber === 1) {
      setPageSize({ pageNumber: 1, width: viewport.width, height: viewport.height });
    }
  }, []);

  const updateVisibleRange = useCallback(() => {
    const el = containerRef.current;
    if (!el || !pageSize || !numPages) return;

    const pageH = pageSize.height + 16; // gap-4
    const scrollTop = el.scrollTop;
    const viewH = el.clientHeight;
    const first = Math.floor(scrollTop / pageH) + 1;
    const last = Math.ceil((scrollTop + viewH) / pageH);
    const start = Math.max(1, first - VISIBLE_BUFFER);
    const end = Math.min(numPages, last + VISIBLE_BUFFER);
    setVisibleRange({ start, end });
    setFocusPage(Math.max(1, Math.min(numPages, first)));

    for (let p = start; p <= end; p++) {
      void renderPage(p);
    }
  }, [numPages, pageSize, renderPage]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError('预览地址无效');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNumPages(0);
    setPageSize(null);
    setRefSize(null);
    setRenderedPages(new Set());
    renderedRef.current.clear();
    pdfRef.current = null;

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`预览加载失败 (${res.status})`);
        const data = await res.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;

        const page1 = await pdf.getPage(1);
        const vp1 = page1.getViewport({ scale: 1 });
        setRefSize({ width: vp1.width, height: vp1.height });

        const containerWidth = containerRef.current?.clientWidth || vp1.width;
        const s = Math.min(1.5, Math.max(0.55, (containerWidth - 24) / vp1.width));
        const vp = page1.getViewport({ scale: s });

        setPageSize({ pageNumber: 1, width: vp.width, height: vp.height });
        setNumPages(pdf.numPages);
        setVisibleRange({ start: 1, end: Math.min(pdf.numPages, 2) });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'PDF 加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (!loading && pageSize) {
      void renderPage(1);
      updateVisibleRange();
    }
  }, [loading, pageSize, updateVisibleRange, renderPage]);

  // 虚拟列表卸载页后允许重新渲染 canvas
  useEffect(() => {
    for (const p of [...renderedRef.current]) {
      if (p < visibleRange.start || p > visibleRange.end) {
        renderedRef.current.delete(p);
        setRenderedPages(prev => {
          const next = new Set(prev);
          next.delete(p);
          return next;
        });
      }
    }
    for (let p = visibleRange.start; p <= visibleRange.end; p++) {
      void renderPage(p);
    }
  }, [visibleRange, renderPage]);

  const scrollToPage = useCallback((page: number) => {
    const el = containerRef.current;
    if (!el || !pageSize || !numPages) return;
    const clamped = Math.max(1, Math.min(numPages, page));
    const pageH = pageSize.height + 16;
    el.scrollTo({ top: (clamped - 1) * pageH, behavior: 'smooth' });
    setFocusPage(clamped);
    void renderPage(clamped);
  }, [numPages, pageSize, renderPage]);

  useEffect(() => {
    if (!highlightPage || !numPages || !pageSize) return;
    const timer = window.setTimeout(() => scrollToPage(highlightPage), 60);
    return () => window.clearTimeout(timer);
  }, [highlights, highlightPage, numPages, pageSize, scrollToPage]);

  const scaleRect = (rect: PdfHighlightRect, pageW: number, pageH: number) => {
    if (!refSize) return null;
    const sx = pageW / refSize.width;
    const sy = pageH / refSize.height;
    return {
      left: rect.x1 * sx,
      top: rect.y1 * sy,
      width: (rect.x2 - rect.x1) * sx,
      height: (rect.y2 - rect.y1) * sy,
    };
  };

  const pageH = pageSize ? pageSize.height + 16 : 0;
  const pageW = pageSize?.width ?? 0;
  const totalScrollHeight = numPages * pageH;
  const topSpacer = (visibleRange.start - 1) * pageH;
  const bottomSpacer = (numPages - visibleRange.end) * pageH;

  const visiblePages = pageSize
    ? Array.from(
        { length: visibleRange.end - visibleRange.start + 1 },
        (_, i) => visibleRange.start + i,
      )
    : [];

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {numPages > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 px-2 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-xs text-gray-600">
          <button
            type="button"
            disabled={focusPage <= 1}
            onClick={() => scrollToPage(focusPage - 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="上一页"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="tabular-nums min-w-[4.5rem] text-center">
            {focusPage} / {numPages} 页
          </span>
          <button
            type="button"
            disabled={focusPage >= numPages}
            onClick={() => scrollToPage(focusPage + 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="下一页"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={updateVisibleRange}
        className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-800 scroll-smooth"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10 bg-gray-100/80">
            加载 PDF…
          </div>
        )}
        {error && (
          <div className="p-4 text-xs text-red-600">{error}</div>
        )}
        {pageSize && (
          <div className="relative w-full" style={{ height: totalScrollHeight }}>
            <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: topSpacer }}>
              {visiblePages.map(pageNumber => {
                const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);
                const isRendered = renderedPages.has(pageNumber);
                return (
                  <div
                    key={pageNumber}
                    id={`pdf-page-${pageNumber}`}
                    data-page={pageNumber}
                    className="relative shadow-md bg-white flex-shrink-0 mb-4 last:mb-0"
                    style={{ width: pageW, minHeight: pageSize.height }}
                  >
                    {!isRendered && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 bg-white z-0"
                        style={{ height: pageSize.height }}
                      >
                        加载中…
                      </div>
                    )}
                    <canvas
                      ref={el => { canvasRefs.current[pageNumber] = el; }}
                      className="block max-w-full relative z-[1]"
                    />
                    {pageHighlights.map((rect, idx) => {
                      const box = scaleRect(rect, pageW, pageSize.height);
                      if (!box || box.width <= 0 || box.height <= 0) return null;
                      return (
                        <div
                          key={idx}
                          className="absolute pointer-events-none border-2 border-amber-400 bg-amber-300/30 rounded-sm z-10"
                          style={{
                            left: box.left,
                            top: box.top,
                            width: box.width,
                            height: box.height,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {bottomSpacer > 0 && (
              <div aria-hidden style={{ position: 'absolute', bottom: 0, height: bottomSpacer, width: 1 }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
