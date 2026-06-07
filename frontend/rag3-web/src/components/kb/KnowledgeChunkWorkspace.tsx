import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, FileText, Target } from 'lucide-react';
import type { Chunk, Document } from '../../types';
import { useChunks, setKbChunkAvailability } from '../../hooks/useKbData';
import { kbApi } from '../../services/kbApi';
import { buildChunkHighlightRects, isPdfFileName } from '../../utils/documentUtil';
import { ChunkContentView } from './ChunkContentView';
import { ChunkImage } from './ChunkImage';
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
  const [togglingAvail, setTogglingAvail] = useState(false);

  const { data: chunkResult, loading, refresh: refreshChunks } = useChunks(kbId, doc.doc_id, {
    page: chunkPage,
    page_size: pageSize,
    keywords: keywords?.trim() || undefined,
  });

  const isPdf = isPdfFileName(doc.original_name);

  useEffect(() => {
    setSelectedChunkId(null);
    setPreviewUrl(null);
    setChunkPage(1);
  }, [doc.doc_id]);

  useEffect(() => {
    if (chunkResult.items.length && !selectedChunkId) {
      setSelectedChunkId(chunkResult.items[0].chunk_id);
    }
  }, [chunkResult.items, selectedChunkId]);

  useEffect(() => {
    let revoked: string | null = null;
    setPreviewUrl(null);
    kbApi.fetchDocumentPreview(doc.doc_id)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        revoked = url;
        setPreviewUrl(url);
      })
      .catch(() => setPreviewUrl(null));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [doc.doc_id]);

  const selectedChunk = chunkResult.items.find(c => c.chunk_id === selectedChunkId)
    ?? chunkResult.items[0];

  const highlights = useMemo(
    () => buildChunkHighlightRects(selectedChunk),
    [selectedChunk],
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

  const totalPages = Math.max(1, Math.ceil(chunkResult.total / pageSize));

  const chunkList = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          分块列表 ({chunkResult.total})
        </p>
        <p className="text-[10px] text-gray-400 truncate">{doc.original_name}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-1">
        {loading && <p className="text-xs text-gray-500 p-2">加载中…</p>}
        {!loading && chunkResult.items.length === 0 && (
          <p className="text-xs text-gray-500 p-2">暂无分块</p>
        )}
        {chunkResult.items.map((chunk, index) => (
          <button
            key={chunk.chunk_id}
            type="button"
            onClick={() => setSelectedChunkId(chunk.chunk_id)}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
              selectedChunk?.chunk_id === chunk.chunk_id
                ? 'bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div className="flex items-start gap-2">
              {chunk.image_id && (
                <ChunkImage
                  imageId={chunk.image_id}
                  className="w-12 h-12 flex-shrink-0 rounded border border-gray-200 object-contain bg-white"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-gray-800 dark:text-gray-200">#{chunk.chunk_index}</span>
                  {chunk.page_number > 0 && (
                    <span className="text-[10px] text-gray-400">P{chunk.page_number}</span>
                  )}
                  {chunk.doc_type_kwd && (
                    <span className="text-[10px] px-1 rounded bg-gray-100 text-gray-500">{chunk.doc_type_kwd}</span>
                  )}
                  {chunk.available === false && (
                    <span className="text-[10px] text-red-500">已排除</span>
                  )}
                </div>
                <div className="text-gray-500 line-clamp-2 mt-0.5">{chunk.content_preview.slice(0, 120)}</div>
              </div>
            </div>
            {showChunkActions && actions && (
              <div className="flex gap-1 mt-1.5 justify-end" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={actions.chunkActionId === chunk.chunk_id || chunk.content_preview.length < 16}
                  onClick={() => actions.onSplit?.(chunk)}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  拆分
                </button>
                <button
                  type="button"
                  disabled={actions.chunkActionId === chunk.chunk_id || index >= chunkResult.items.length - 1}
                  onClick={() => actions.onMergeNext?.(chunk, index)}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  合并↓
                </button>
                <button
                  type="button"
                  disabled={actions.chunkActionId === chunk.chunk_id}
                  onClick={() => actions.onToggleExclude?.(chunk)}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  {chunk.available === false ? '恢复' : '排除'}
                </button>
              </div>
            )}
          </button>
        ))}
      </div>
      {pageSize < chunkResult.total && (
        <div className="p-2 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
          <button type="button" disabled={chunkPage <= 1} onClick={() => setChunkPage(p => p - 1)} className="px-2 py-0.5 border rounded disabled:opacity-40">上一页</button>
          <span>{chunkPage}/{totalPages}</span>
          <button type="button" disabled={chunkPage >= totalPages} onClick={() => setChunkPage(p => p + 1)} className="px-2 py-0.5 border rounded disabled:opacity-40">下一页</button>
        </div>
      )}
      {onNavigate && (
        <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1"
          >
            查看全部分块 <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );

  const previewPane = (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      {selectedChunk && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Target size={14} className="text-cyan-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Chunk #{selectedChunk.chunk_index}</h3>
              <span className="text-[10px] text-gray-500">P{selectedChunk.page_number} · ~{selectedChunk.token_count} 字</span>
              {selectedChunk.available === false && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">已排除检索</span>
              )}
            </div>
            {!showChunkActions && (
              <button
                type="button"
                disabled={togglingAvail}
                onClick={async () => {
                  const excluded = selectedChunk.available === false;
                  setTogglingAvail(true);
                  try {
                    await setKbChunkAvailability(kbId, doc.doc_id, [selectedChunk.chunk_id], excluded);
                    refreshChunks();
                  } finally {
                    setTogglingAvail(false);
                  }
                }}
                className={`text-[10px] px-2 py-1 border rounded disabled:opacity-50 ${
                  selectedChunk.available === false
                    ? 'border-green-200 text-green-700 hover:bg-green-50'
                    : 'border-red-100 text-red-600 hover:bg-red-50'
                }`}
              >
                {selectedChunk.available === false ? '恢复检索' : '排除检索'}
              </button>
            )}
          </div>
          <ChunkContentView chunk={selectedChunk} maxHeight="max-h-32" />
        </div>
      )}
      <div className="flex-1 min-h-0 p-3 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} className="text-cyan-600 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-800 truncate">{doc.original_name}</span>
          </div>
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"
          >
            <Download size={11} /> {downloading ? '下载中…' : '下载'}
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {!previewUrl ? (
            <p className="text-xs text-gray-500 p-4">无法加载原始文件预览</p>
          ) : isPdf && highlights.length > 0 ? (
            <PdfPreviewWithHighlights
              url={previewUrl}
              highlights={highlights}
              className="h-full min-h-[280px]"
            />
          ) : isPdf ? (
            <PdfPreviewWithHighlights url={previewUrl} className="h-full min-h-[280px]" />
          ) : (
            <iframe title="文档预览" src={previewUrl} className="w-full h-full min-h-[280px] rounded-xl border border-gray-200 bg-white" />
          )}
        </div>
      </div>
    </div>
  );

  if (layout === 'stack') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-64 flex-shrink-0 border-b border-gray-200">{previewPane}</div>
        <div className="flex-1 min-h-0">{chunkList}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
      <div className="w-full lg:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-0 max-h-[40vh] lg:max-h-none">
        {chunkList}
      </div>
      {previewPane}
    </div>
  );
}
