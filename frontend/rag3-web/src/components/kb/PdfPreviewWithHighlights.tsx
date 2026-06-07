import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfHighlightRect } from '../../utils/documentUtil';
import { ChevronLeft, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [refSize, setRefSize] = useState<{ width: number; height: number } | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(() => new Set());
  const [focusPage, setFocusPage] = useState(1);

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

    setPages(prev => {
      const next = [...prev];
      const idx = pageNumber - 1;
      if (next[idx]) {
        next[idx] = { pageNumber, width: viewport.width, height: viewport.height };
      }
      return next;
    });
  }, []);

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
    setPages([]);
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

        const placeholders: PageMeta[] = Array.from({ length: pdf.numPages }, (_, i) => ({
          pageNumber: i + 1,
          width: vp.width,
          height: vp.height,
        }));
        setNumPages(pdf.numPages);
        setPages(placeholders);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'PDF 加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // 懒加载：仅渲染视口内页面（及相邻页）
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !numPages) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          if (pageNum > 0) void renderPage(pageNum);
        });
      },
      { root, rootMargin: '120px 0px', threshold: 0.01 },
    );

    const slots = root.querySelectorAll('[data-page]');
    slots.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, pages.length, renderPage, url]);

  // 选中分块时滚到对应页
  useEffect(() => {
    if (!highlightPage || !numPages) return;
    setFocusPage(highlightPage);
    void renderPage(highlightPage);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`pdf-page-${highlightPage}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [highlights, highlightPage, numPages, renderPage]);

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

  const scrollToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(numPages, page));
    setFocusPage(clamped);
    void renderPage(clamped);
    const el = document.getElementById(`pdf-page-${clamped}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {numPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 px-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-xs text-gray-600">
          <button
            type="button"
            disabled={focusPage <= 1}
            onClick={() => scrollToPage(focusPage - 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="上一页"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="tabular-nums min-w-[4rem] text-center">
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
        className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-800 rounded-b-xl scroll-smooth"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10 bg-gray-100/80">
            加载 PDF…
          </div>
        )}
        {error && (
          <div className="p-4 text-xs text-red-600">{error}</div>
        )}
        <div className="flex flex-col items-center gap-4 p-3">
          {pages.map(page => {
            const pageHighlights = highlights.filter(h => h.pageNumber === page.pageNumber);
            const isRendered = renderedPages.has(page.pageNumber);
            return (
              <div
                key={page.pageNumber}
                id={`pdf-page-${page.pageNumber}`}
                data-page={page.pageNumber}
                className="relative shadow-md bg-white flex-shrink-0"
                style={{ width: page.width, minHeight: page.height }}
              >
                {!isRendered && (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 bg-white"
                    style={{ width: page.width, height: page.height }}
                  >
                    滚动加载…
                  </div>
                )}
                <canvas
                  ref={el => { canvasRefs.current[page.pageNumber] = el; }}
                  className="block max-w-full"
                />
                {pageHighlights.map((rect, idx) => {
                  const box = scaleRect(rect, page.width, page.height);
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
      </div>
    </div>
  );
}
