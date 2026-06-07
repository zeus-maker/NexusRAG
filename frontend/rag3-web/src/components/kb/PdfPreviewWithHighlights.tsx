import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { PdfHighlightRect } from '../../utils/documentUtil';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  url: string;
  highlights?: PdfHighlightRect[];
  className?: string;
}

interface PageLayout {
  width: number;
  height: number;
  refW: number;
  refH: number;
}

export function PdfPreviewWithHighlights({ url, highlights = [], className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const loadGenRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(400);
  const [pageLayouts, setPageLayouts] = useState<Record<number, PageLayout>>({});
  const [renderTick, setRenderTick] = useState(0);

  const setPageRef = useCallback((page: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(page, el);
    else pageRefs.current.delete(page);
  }, []);

  const setCanvasRef = useCallback((page: number, el: HTMLCanvasElement | null) => {
    if (el) canvasRefs.current.set(page, el);
    else canvasRefs.current.delete(page);
  }, []);

  // 容器宽度（对齐 RAGFlow：在固定高度框内按宽自适应缩放）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(Math.max(200, el.clientWidth - 32));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url, loading, numPages]);

  // 加载 PDF
  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError('预览地址无效');
      return;
    }

    const gen = ++loadGenRef.current;
    setLoading(true);
    setError(null);
    setNumPages(0);
    setPageLayouts({});
    pdfRef.current = null;
    renderTasksRef.current.forEach(t => t.cancel());
    renderTasksRef.current.clear();
    pageRefs.current.clear();
    canvasRefs.current.clear();

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`预览加载失败 (${res.status})`);
        const data = await res.arrayBuffer();
        if (gen !== loadGenRef.current) return;

        const pdf = await pdfjs.getDocument({ data }).promise;
        if (gen !== loadGenRef.current) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      } catch (e) {
        if (gen === loadGenRef.current) {
          setError(e instanceof Error ? e.message : 'PDF 加载失败');
        }
      } finally {
        if (gen === loadGenRef.current) setLoading(false);
      }
    })();

    return () => {
      renderTasksRef.current.forEach(t => t.cancel());
      renderTasksRef.current.clear();
    };
  }, [url]);

  // canvas 挂载后再触发绘制（避免 ref 尚未就绪）
  useLayoutEffect(() => {
    if (!loading && numPages > 0) setRenderTick(t => t + 1);
  }, [loading, numPages, url]);

  // 渲染全部页面到纵向滚动区（对齐 RAGFlow PdfHighlighter：页在容器内滚动，不撑破布局）
  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading || numPages === 0) return;

    const gen = loadGenRef.current;
    let cancelled = false;

    (async () => {
      const layouts: Record<number, PageLayout> = {};

      for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
        if (cancelled || gen !== loadGenRef.current) return;

        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) continue;

        renderTasksRef.current.get(pageNum)?.cancel();

        try {
          const page = await pdf.getPage(pageNum);
          if (cancelled || gen !== loadGenRef.current) return;

          const refVp = page.getViewport({ scale: 1 });
          const scale = Math.min(1.5, Math.max(0.45, containerWidth / refVp.width));
          const viewport = page.getViewport({ scale });
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const task = page.render({ canvasContext: ctx, viewport, canvas });
          renderTasksRef.current.set(pageNum, task);
          await task.promise;

          if (cancelled || gen !== loadGenRef.current) return;
          layouts[pageNum] = {
            width: viewport.width,
            height: viewport.height,
            refW: refVp.width,
            refH: refVp.height,
          };
        } catch (e) {
          if (!cancelled && gen === loadGenRef.current && (e as Error)?.name !== 'RenderingCancelledException') {
            setError(e instanceof Error ? e.message : '页面渲染失败');
            return;
          }
        }
      }

      if (!cancelled && gen === loadGenRef.current) {
        setPageLayouts(layouts);
      }
    })();

    return () => {
      cancelled = true;
      renderTasksRef.current.forEach(t => t.cancel());
    };
  }, [url, loading, numPages, containerWidth, renderTick]);

  // 选中分块 → 滚到对应页（对齐 RAGFlow scrollTo(highlight)）
  useEffect(() => {
    const targetPage = highlights[0]?.pageNumber;
    if (!targetPage || targetPage < 1) return;

    const timer = window.setTimeout(() => {
      const pageEl = pageRefs.current.get(targetPage);
      if (!pageEl || !containerRef.current) return;

      const rects = highlights.filter(h => h.pageNumber === targetPage);
      const layout = pageLayouts[targetPage];
      if (rects.length && layout?.refH) {
        const sy = layout.height / layout.refH;
        const top = Math.min(...rects.map(r => r.y1 * sy));
        const container = containerRef.current;
        const pageTop = pageEl.offsetTop;
        container.scrollTo({
          top: Math.max(0, pageTop + top - container.clientHeight * 0.25),
          behavior: 'smooth',
        });
      } else {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [highlights, pageLayouts]);

  const scaleRect = (rect: PdfHighlightRect, layout: PageLayout) => {
    const sx = layout.width / layout.refW;
    const sy = layout.height / layout.refH;
    return {
      left: rect.x1 * sx,
      top: rect.y1 * sy,
      width: (rect.x2 - rect.x1) * sx,
      height: (rect.y2 - rect.y1) * sy,
    };
  };

  const pages = numPages > 0 ? Array.from({ length: numPages }, (_, i) => i + 1) : [];

  return (
    <div className={`flex flex-col flex-1 h-0 min-h-0 overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-gray-100 dark:bg-gray-800"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10 bg-gray-100/80">
            加载 PDF…
          </div>
        )}
        {error && !loading && (
          <div className="p-4 text-xs text-red-600">{error}</div>
        )}
        {!loading && numPages > 0 && (
          <div className="flex flex-col items-center gap-4 p-3">
            {pages.map(pageNum => {
              const layout = pageLayouts[pageNum];
              const pageHighlights = highlights.filter(h => h.pageNumber === pageNum);

              return (
                <div
                  key={pageNum}
                  ref={el => setPageRef(pageNum, el)}
                  className="relative shadow-md bg-white flex-shrink-0"
                  style={{
                    width: layout?.width,
                    minHeight: layout?.height ?? 120,
                  }}
                >
                  <canvas
                    ref={el => setCanvasRef(pageNum, el)}
                    className="block max-w-full"
                  />
                  {layout &&
                    pageHighlights.map((rect, idx) => {
                      const box = scaleRect(rect, layout);
                      if (!box || box.width <= 0 || box.height <= 0) return null;
                      return (
                        <div
                          key={`${pageNum}-${idx}-${rect.x1}-${rect.y1}`}
                          className="absolute pointer-events-none border-2 border-amber-400 bg-amber-300/35 rounded-sm z-10"
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
        )}
      </div>
    </div>
  );
}
