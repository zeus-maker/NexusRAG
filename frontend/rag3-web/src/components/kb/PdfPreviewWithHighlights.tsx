import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfHighlightRect } from '../../utils/documentUtil';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  url: string;
  highlights?: PdfHighlightRect[];
  className?: string;
}

interface PageRender {
  pageNumber: number;
  width: number;
  height: number;
}

export function PdfPreviewWithHighlights({ url, highlights = [], className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageRender[]>([]);
  const [refSize, setRefSize] = useState<{ width: number; height: number } | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError('预览地址无效');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);
    setRefSize(null);
    pdfRef.current = null;

    (async () => {
      try {
        // pdfjs-dist v6+ 须传 DocumentInitParameters 对象，不能直接传字符串
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
        const scale = Math.min(1.5, Math.max(0.6, containerWidth / vp1.width));

        const rendered: PageRender[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const viewport = page.getViewport({ scale });
          rendered.push({ pageNumber: i, width: viewport.width, height: viewport.height });
        }
        if (!cancelled) setPages(rendered);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'PDF 加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || !pages.length) return;
    let cancelled = false;

    const renderAll = async () => {
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      const containerWidth = containerRef.current?.clientWidth || pages[0].width;
      const page1 = await pdf.getPage(1);
      const vp1 = page1.getViewport({ scale: 1 });
      const scale = Math.min(1.5, Math.max(0.6, containerWidth / vp1.width));

      for (const meta of pages) {
        if (cancelled) return;
        const canvas = canvasRefs.current[meta.pageNumber];
        if (!canvas) continue;
        const page = await pdf.getPage(meta.pageNumber);
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      }
      if (!cancelled) setRenderTick(t => t + 1);
    };

    void renderAll();
    return () => { cancelled = true; };
  }, [pages, url]);

  useEffect(() => {
    if (!highlights.length) return;
    const first = highlights[0];
    const el = document.getElementById(`pdf-page-${first.pageNumber}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlights, renderTick]);

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

  return (
    <div ref={containerRef} className={`relative overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10">
          加载 PDF…
        </div>
      )}
      {error && (
        <div className="p-4 text-xs text-red-600">{error}</div>
      )}
      <div className="flex flex-col items-center gap-3 p-3">
        {pages.map(page => {
          const pageHighlights = highlights.filter(h => h.pageNumber === page.pageNumber);
          return (
            <div
              key={page.pageNumber}
              id={`pdf-page-${page.pageNumber}`}
              className="relative shadow-md bg-white"
              style={{ width: page.width, height: page.height }}
            >
              <canvas
                ref={el => { canvasRefs.current[page.pageNumber] = el; }}
                className="block"
              />
              {pageHighlights.map((rect, idx) => {
                const box = scaleRect(rect, page.width, page.height);
                if (!box || box.width <= 0 || box.height <= 0) return null;
                return (
                  <div
                    key={idx}
                    className="absolute pointer-events-none border-2 border-amber-400 bg-amber-300/25 rounded-sm"
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
  );
}
