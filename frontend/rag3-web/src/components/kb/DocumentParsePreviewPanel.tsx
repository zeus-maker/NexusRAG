import { useEffect, useState } from 'react';
import { Target, Layers, GitBranch, FileText, Download, ChevronRight } from 'lucide-react';
import {
  PAGEINDEX_TREE_V5, getPageIndexTree, findTreeNode, getNodePreviewBbox,
  getPageIndexDocIdForKbDoc, type PageIndexTreeNode,
} from '../../data/pageIndexMock';
import { IndexTreeNode, PdfBboxPreview, NODE_TYPE_LABEL } from '../pageIndex/PageIndexPreviewParts';
import type { Document } from '../../types';
import type { Chunk } from '../../types';
import type { GovernedDocument } from '../../data/kbGovernanceMock';
import { PIPELINE_STAGE_LABELS, CERT_LABELS } from '../../data/kbGovernanceMock';
import { useRealApi } from '../../services/http';
import { useChunks, setKbChunkAvailability } from '../../hooks/useKbData';
import { kbApi } from '../../services/kbApi';

interface Props {
  doc: Document;
  kbId: string;
  governed?: GovernedDocument;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

function ApiParsePreview({ doc, kbId, onNavigate }: Props) {
  const { data: chunkResult, loading, refresh: refreshChunks } = useChunks(kbId, doc.doc_id, { page: 1, page_size: 200 });
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const selectedChunk: Chunk | undefined = chunkResult.items.find(c => c.chunk_id === selectedChunkId)
    ?? chunkResult.items[0];

  useEffect(() => {
    if (chunkResult.items.length && !selectedChunkId) {
      setSelectedChunkId(chunkResult.items[0].chunk_id);
    }
  }, [chunkResult.items, selectedChunkId]);

  useEffect(() => {
    let revoked: string | null = null;
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
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
      <div className="w-full lg:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-0">
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">分块列表 ({chunkResult.total})</p>
          <p className="text-[10px] text-gray-400 truncate">{doc.original_name}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-1">
          {loading && <p className="text-xs text-gray-500 p-2">加载中…</p>}
          {!loading && chunkResult.items.length === 0 && (
            <p className="text-xs text-gray-500 p-2">暂无分块</p>
          )}
          {chunkResult.items.map(chunk => (
            <button
              key={chunk.chunk_id}
              type="button"
              onClick={() => setSelectedChunkId(chunk.chunk_id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                selectedChunk?.chunk_id === chunk.chunk_id
                  ? 'bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="font-medium text-gray-800 dark:text-gray-200">#{chunk.chunk_index}</div>
              <div className="text-gray-500 line-clamp-2">{chunk.content_preview.slice(0, 120)}</div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1"
          >
            查看全部分块 <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {selectedChunk && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Target size={14} className="text-cyan-600" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Chunk #{selectedChunk.chunk_index}</h3>
                  <span className="text-[10px] text-gray-500">P{selectedChunk.page_number} · ~{selectedChunk.token_count} 字</span>
                  {selectedChunk.available === false && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">已排除检索</span>
                  )}
                </div>
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
              </div>
              <pre className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                {selectedChunk.content_preview}
              </pre>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-cyan-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{doc.original_name}</h3>
              </div>
              <button
                type="button"
                disabled={downloading}
                onClick={() => void handleDownload()}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-1 disabled:opacity-50"
              >
                <Download size={11} /> {downloading ? '下载中…' : '下载'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span>{doc.chunk_count} chunks</span>
              <span>{doc.file_type}</span>
              <span className="text-green-600">已解析</span>
            </div>
          </div>
          {previewUrl ? (
            <iframe title="文档预览" src={previewUrl} className="w-full h-80 rounded-xl border border-gray-200 bg-white" />
          ) : (
            <p className="text-xs text-gray-500">无法加载原始文件预览</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DocumentParsePreviewPanel({ doc, kbId, governed, onNavigate }: Props) {
  if (useRealApi) {
    return <ApiParsePreview doc={doc} kbId={kbId} governed={governed} onNavigate={onNavigate} />;
  }

  const piDocId = getPageIndexDocIdForKbDoc(doc.doc_id);
  const tree = piDocId ? (getPageIndexTree(piDocId) ?? PAGEINDEX_TREE_V5) : null;
  const [selectedNodeId, setSelectedNodeId] = useState('ch5-1-1');

  if (!tree || !piDocId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Layers size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">该文档暂无 PageIndex 树数据</p>
          <p className="text-xs text-gray-500 mt-1">解析失败或未建树时无法预览 bbox</p>
          {doc.parse_status === 'parsed' && (
            <button
              type="button"
              onClick={() => onNavigate('pageindex-hub', { selectedKBId: kbId })}
              className="mt-3 text-xs text-cyan-600 hover:underline inline-flex items-center gap-1"
            >
              <GitBranch size={12} /> 前往 PageIndex Hub 建树
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedNode: PageIndexTreeNode = findTreeNode(tree, selectedNodeId) ?? tree;
  const { page: previewPage, bbox: previewBbox } = getNodePreviewBbox(selectedNode);
  const stage = governed ? PIPELINE_STAGE_LABELS[governed.pipeline_stage] : null;
  const cert = governed ? CERT_LABELS[governed.certification_status] : null;

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row border-t border-gray-200 dark:border-gray-700">
      <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">PageIndex 树</p>
          <p className="text-[10px] text-gray-400 truncate">{doc.original_name}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-[160px]">
          <IndexTreeNode node={tree} depth={0} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-0">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Target size={14} className="text-cyan-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedNode.title}</h3>
            <span className="text-[10px] px-2 py-0.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
              {NODE_TYPE_LABEL[selectedNode.nodeType] ?? selectedNode.nodeType}
            </span>
          </div>
          {selectedNode.summary && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{selectedNode.summary}</p>
          )}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {stage && <span className={`px-2 py-0.5 rounded-full ${stage.color}`}>{stage.label}</span>}
            {cert && <span className={`px-2 py-0.5 rounded-full ${cert.color}`}>{cert.label}</span>}
            {doc.parse_quality_score > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">解析质量 {doc.parse_quality_score}</span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => onNavigate('kb-chunks', { selectedKBId: kbId, selectedDocId: doc.doc_id })}
              className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              查看分块
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pageindex-hub', { selectedKBId: kbId, pageIndexDocId: piDocId })}
              className="text-xs px-2.5 py-1 text-cyan-600 hover:underline inline-flex items-center gap-1"
            >
              PageIndex Hub
            </button>
          </div>
        </div>

        <div className="xl:hidden">
          <PdfBboxPreview
            docName={doc.original_name}
            page={previewPage}
            bbox={previewBbox}
            nodeTitle={selectedNode.title}
            onOpenFullscreen={() => onNavigate('pageindex-hub', { selectedKBId: kbId, pageIndexDocId: piDocId })}
          />
        </div>
      </div>

      <div className="hidden xl:flex w-64 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-900/50">
        <PdfBboxPreview
          docName={doc.original_name}
          page={previewPage}
          bbox={previewBbox}
          nodeTitle={selectedNode.title}
          onOpenFullscreen={() => onNavigate('pageindex-hub', { selectedKBId: kbId, pageIndexDocId: piDocId })}
        />
      </div>
    </div>
  );
}
