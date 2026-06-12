import { useState } from 'react';
import { Target, Layers, GitBranch, ExternalLink } from 'lucide-react';
import {
  PAGEINDEX_TREE_V5, getPageIndexTree, findTreeNode, getNodePreviewBbox,
  getPageIndexDocIdForKbDoc, type PageIndexTreeNode,
} from '../../data/pageIndexMock';
import { IndexTreeNode, PdfBboxPreview, NODE_TYPE_LABEL } from '../pageIndex/PageIndexPreviewParts';
import type { Document } from '../../types';
import type { GovernedDocument } from '../../data/kbGovernanceMock';
import { PIPELINE_STAGE_LABELS, CERT_LABELS } from '../../data/kbGovernanceMock';

interface Props {
  doc: Document;
  kbId: string;
  governed?: GovernedDocument;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function DocumentParsePreviewPanel({ doc, kbId, governed, onNavigate }: Props) {
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
              <ExternalLink size={11} /> PageIndex Hub
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
