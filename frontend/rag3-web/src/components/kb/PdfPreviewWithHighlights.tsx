import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { PdfHighlightRect } from '../../utils/documentUtil';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const loadGenRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLayout, setPageLayout] = useState<PageLayout>({ width: 0, height: 0, refW: 0, refH: 0 });

  const highlightPage = highlights[0]?.pageNumber;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(p => {
      const max = numPages || 1;
      return Math.max(1, Math.min(max, page));
    });
  }, [numPages]);

  // 加载 PDF（url 变化时完整重置）
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
    setCurrentPage(1);
    setPageLayout({ width: 0, height: 0, refW: 0, refH: 0 });
    pdfRef.current = null;
    renderTaskRef.current?.cancel();

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
      renderTaskRef.current?.cancel();
    };
  }, [url]);

  // 选中分块 → 在绘制前跳到对应页，避免高亮与页码错帧
  useLayoutEffect(() => {
    if (highlightPage && highlightPage >= 1 && numPages > 0) {
      const next = Math.min(highlightPage, numPages);
      if (next !== currentPage) setCurrentPage(next);
    }
  }, [highlightPage, highlights, numPages, currentPage]);

  // 仅渲染当前页（单页模式，避免全部铺开）
  useEffect(() => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || loading || numPages === 0) return;

    const gen = loadGenRef.current;
    let cancelled = false;

    (async () => {
      renderTaskRef.current?.cancel();

      try {
        const page = await pdf.getPage(currentPage);
        if (cancelled || gen !== loadGenRef.current) return;

        const refVp = page.getViewport({ scale: 1 });
        const containerWidth = Math.max(200, (containerRef.current?.clientWidth ?? 400) - 32);
        const scale = Math.min(1.5, Math.max(0.45, containerWidth / refVp.width));
        const viewport = page.getViewport({ scale });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const task = page.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;

        if (cancelled || gen !== loadGenRef.current) return;
        setPageLayout({
          width: viewport.width,
          height: viewport.height,
          refW: refVp.width,
          refH: refVp.height,
        });
      } catch (e) {
        if (!cancelled && gen === loadGenRef.current && (e as Error)?.name !== 'RenderingCancelledException') {
          setError(e instanceof Error ? e.message : '页面渲染失败');
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [url, loading, numPages, currentPage]);

  // 高亮渲染后滚入视口（单页 PDF 可能高于容器）
  useEffect(() => {
    const container = containerRef.current;
    if (!container || pageLayout.height <= 0) return;

    const rects = highlights.filter(h => h.pageNumber === currentPage);
    if (!rects.length || !pageLayout.refW || !pageLayout.refH) return;

    const sx = pageLayout.width / pageLayout.refW;
    const sy = pageLayout.height / pageLayout.refH;
    const top = Math.min(...rects.map(r => r.y1 * sy));
    const bottom = Math.max(...rects.map(r => r.y2 * sy));
    const pad = 24;
    const target = top + (bottom - top) / 2 - container.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target - pad), behavior: 'smooth' });
  }, [currentPage, highlights, pageLayout]);

  const scaleRect = (rect: PdfHighlightRect) => {
    if (!pageLayout.refW || !pageLayout.refH) return null;
    const sx = pageLayout.width / pageLayout.refW;
    const sy = pageLayout.height / pageLayout.refH;
    return {
      left: rect.x1 * sx,
      top: rect.y1 * sy,
      width: (rect.x2 - rect.x1) * sx,
      height: (rect.y2 - rect.y1) * sy,
    };
  };

  const pageHighlights = highlights.filter(h => h.pageNumber === currentPage);

  return (
    <div className={`flex flex-col h-full min-h-0 max-h-full overflow-hidden ${className}`}>
      {numPages > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 px-2 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-xs text-gray-600">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="上一页"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="tabular-nums min-w-[4.5rem] text-center">
            {currentPage} / {numPages} 页
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => goToPage(currentPage + 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            title="下一页"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-800"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10 bg-gray-100/80">
            加载 PDF…
          </div>
        )}
        {error && !loading && (
          <div className="p-4 text-xs text-red-600">{error}</div>
        )}
        {!loading && pageLayout.width > 0 && (
          <div className="flex justify-center p-3">
            <div
              className="relative shadow-md bg-white flex-shrink-0"
              style={{ width: pageLayout.width, height: pageLayout.height }}
            >
              <canvas ref={canvasRef} className="block max-w-full" />
              {pageHighlights.map((rect, idx) => {
                const box = scaleRect(rect);
                if (!box || box.width <= 0 || box.height <= 0) return null;
                return (
                  <div
                    key={`${currentPage}-${idx}-${rect.x1}-${rect.y1}`}
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
          </div>
        )}
      </div>
    </div>
  );
}
