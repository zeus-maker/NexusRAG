import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Download, FileText } from 'lucide-react';
import type { Chunk, Document } from '../../types';
import { useChunks, setKbChunkAvailability } from '../../hooks/useKbData';
import { kbApi } from '../../services/kbApi';
import { buildChunkHighlightRects, isPdfFileName } from '../../utils/documentUtil';
import { ChunkContentView } from './ChunkContentView';
import { ChunkListCard } from './ChunkListCard';
import { ImageLightbox } from './ImageLightbox';
import { DocumentIframePreview } from './DocumentIframePreview';
import { DocumentScrollFrame } from './DocumentScrollFrame';
import { PdfPreviewWithHighlights } from './PdfPreviewWithHighlights';

export interface ChunkWorkspaceActions {
  onSplit?: (chunk: Chunk) => void;
  onMergeNext?: (chunk: Chunk, index: number) => void;
  onToggleExclude?: (chunk: Chunk) => void;
  chunkActionId?: string | null;
}

interface Props {
  doc: Document;
  kbId: string;
  onNavigate?: (page: string, extra?: Record<string, unknown>) => void;
  pageSize?: number;
  keywords?: string;
  showChunkActions?: boolean;
  actions?: ChunkWorkspaceActions;
  layout?: 'split' | 'stack';
}

export function KnowledgeChunkWorkspace({
  doc,
  kbId,
  onNavigate,
  pageSize = 200,
  keywords,
  showChunkActions = false,
  actions,
  layout = 'split',
}: Props) {
  const [chunkPage, setChunkPage] = useState(1);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [chunkActionId, setChunkActionId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ imageId: string; title: string } | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { data: chunkResult, loading, refresh: refreshChunks } = useChunks(kbId, doc.doc_id, {
    page: chunkPage,
    page_size: pageSize,
    keywords: keywords?.trim() || undefined,
  });

  const isPdf = isPdfFileName(doc.original_name);

  useEffect(() => {
    setSelectedChunkId(null);
    setChunkPage(1);
    setPreviewUrl(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, [doc.doc_id]);

  useEffect(() => {
    if (loading) return;
    if (!selectedChunkId && chunkResult.items.length > 0) {
      setSelectedChunkId(chunkResult.items[0].chunk_id);
    }
  }, [chunkResult.items, selectedChunkId, loading, doc.doc_id]);

  useEffect(() => {
    let cancelled = false;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);

    kbApi.fetchDocumentPreview(doc.doc_id)
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [doc.doc_id]);

  const chunkItems = loading ? [] : chunkResult.items;
  const chunkTotal = loading ? 0 : chunkResult.total;

  const selectedChunk =
    !loading && selectedChunkId
      ? chunkResult.items.find(c => c.chunk_id === selectedChunkId)
      : undefined;

  const highlights = useMemo(
    () => (selectedChunk ? buildChunkHighlightRects(selectedChunk) : []),
    [selectedChunk?.chunk_id, selectedChunk?.positions],
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await kbApi.fetchDocumentPreview(doc.doc_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleExclude = async (chunk: Chunk) => {
    if (actions?.onToggleExclude) {
      actions.onToggleExclude(chunk);
      return;
    }
    const excluded = chunk.available === false;
    setChunkActionId(chunk.chunk_id);
    try {
      await setKbChunkAvailability(kbId, doc.doc_id, [chunk.chunk_id], excluded);
      refreshChunks();
    } finally {
      setChunkActionId(null);
    }
  };

  const mergedActions: ChunkWorkspaceActions = {
    ...actions,
    onToggleExclude: handleToggleExclude,
    chunkActionId: actions?.chunkActionId ?? chunkActionId,
  };

  const totalPages = Math.max(1, Math.ceil(chunkTotal / pageSize));

  /** 左侧：文档预览（对齐 RAGFlow w-2/5） */
  const documentPreviewPane = (
    <article className="flex flex-col min-w-0 h-full min-h-0 max-h-full overflow-hidden flex-[2] lg:flex-[2] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
      <header className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-cyan-600 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{doc.original_name}</h2>
              <p className="text-[10px] text-gray-500">{doc.file_type} · {doc.chunk_count} 块</p>
            </div>
          </div>
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
          >
            <Download size={11} /> {downloading ? '下载中…' : '下载'}
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col">
        {!previewUrl ? (
          <p className="text-xs text-gray-500 p-4">无法加载原始文件预览</p>
        ) : (
          <DocumentScrollFrame className="flex-1 min-h-0 h-full">
            {isPdf ? (
              <PdfPreviewWithHighlights
                key={`${doc.doc_id}:${previewUrl}`}
                url={previewUrl}
                highlights={highlights}
                className="h-full min-h-0"
              />
            ) : (
              <DocumentIframePreview url={previewUrl} title={doc.original_name} />
            )}
          </DocumentScrollFrame>
        )}
      </div>
    </article>
  );

  /** 右侧：分块结果列表（对齐 RAGFlow w-3/5） */
  const chunkResultPane = (
    <article className="flex flex-col min-h-0 flex-[3] lg:flex-[3] bg-white dark:bg-gray-900">
      <header className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">分块结果</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">
          共 {chunkTotal} 块 · 点击分块，左侧 PDF 同步高亮定位
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-3 min-h-0 space-y-3">
        {loading && <p className="text-xs text-gray-500 p-2">加载中…</p>}
        {!loading && chunkItems.length === 0 && (
          <p className="text-xs text-gray-500 p-2">暂无分块</p>
        )}
        {chunkItems.map((chunk, index) => (
          <div key={chunk.chunk_id}>
            <ChunkListCard
              chunk={chunk}
              index={index}
              selected={selectedChunk?.chunk_id === chunk.chunk_id}
              showActions={showChunkActions}
              actions={mergedActions}
              totalInPage={chunkItems.length}
              onSelect={() => setSelectedChunkId(chunk.chunk_id)}
              onImageZoom={(imageId, title) => setLightbox({ imageId, title })}
            />
            {selectedChunk?.chunk_id === chunk.chunk_id && (
              <div className="mt-2 ml-1 pl-3 border-l-2 border-cyan-300">
                <ChunkContentView
                  chunk={chunk}
                  maxHeight="max-h-48"
                  onImageClick={imageId => setLightbox({ imageId, title: `Chunk #${chunk.chunk_index}` })}
                />
                {!showChunkActions && (
                  <button
                    type="button"
                    disabled={mergedActions.chunkActionId === chunk.chunk_id}
                    onClick={() => void handleToggleExclude(chunk)}
                    className={`mt-2 text-[10px] px-2 py-1 border rounded disabled:opacity-50 ${
                      chunk.available === false
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-100 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {chunk.available === false ? '恢复检索' : '排除检索'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {pageSize < chunkTotal && (
        <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-xs text-gray-500">
          <button type="button" disabled={chunkPage <= 1} onClick={() => setChunkPage(p => p - 1)} className="px-2 py-0.5 border rounded disabled:opacity-40">上一页</button>
          <span>{chunkPage}/{totalPages}</span>
          <button type="button" disabled={chunkPage >= totalPages} onClick={() => setChunkPage(p => p + 1)} className="px-2 py-0.5 border rounded disabled:opacity-40">下一页</button>
        </div>
      )}

      {onNavigate && !showChunkActions && (
        <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1"
          >
            打开完整分块页 <ChevronRight size={12} />
          </button>
        </div>
      )}
    </article>
  );

  const lightboxModal = lightbox ? (
    <ImageLightbox
      imageId={lightbox.imageId}
      title={lightbox.title}
      onClose={() => setLightbox(null)}
    />
  ) : null;

  if (layout === 'stack') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-[42vh] flex-shrink-0">{documentPreviewPane}</div>
        <div className="flex-1 min-h-0">{chunkResultPane}</div>
        {lightboxModal}
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full max-h-full overflow-hidden flex-col lg:flex-row">
      {documentPreviewPane}
      {chunkResultPane}
      {lightboxModal}
    </div>
  );
}
