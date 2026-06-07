import { useState } from 'react';
import { ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import type { PageIndexBbox, PageIndexTreeNode } from '../../data/pageIndexMock';

export const PDF_PAGE_MOCK_LINES: Record<number, string[]> = {
  3: [
    '第五条 违约责任',
    '',
    '5.1 迟延交货',
    '供应商迟延交货的，每迟延一日应按迟延交付货物',
    '价值的千分之五（0.5%）向采购方支付违约金。',
    '',
    '5.1.1 违约金计算',
    '累计违约金不超过合同总金额的 20%。',
    '5.1.2 解除权触发',
    '迟延超过 30 日采购方可解除合同。',
  ],
  8: [
    '第八条 保密义务',
    '',
    '8.1 保密范围',
    '技术信息、经营信息、客户名单等均属保密信息。',
    '',
    '8.2 保密期限',
    '保密义务自合同生效之日起至合同终止后满五年止。',
  ],
};

export const NODE_TYPE_LABEL: Record<string, string> = {
  root: '文档根', part: '部', chapter: '章', section: '节', subsection: '小节', leaf: '叶节点',
};

export function PdfBboxPreview({
  docName, page, bbox, nodeTitle, highlightFromSearch, onOpenFullscreen,
}: {
  docName: string;
  page: number;
  bbox?: PageIndexBbox;
  nodeTitle?: string;
  highlightFromSearch?: boolean;
  onOpenFullscreen?: () => void;
}) {
  const lines = PDF_PAGE_MOCK_LINES[page] ?? [
    docName,
    '',
    '（mock）DeepDoc 解析页预览',
    '点击树节点后联动 bbox 高亮。',
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">解析预览</p>
          <p className="text-[10px] text-gray-400">P{page} · DeepDoc layout</p>
        </div>
        {onOpenFullscreen && (
          <button type="button" onClick={onOpenFullscreen} className="text-[10px] text-cyan-600 hover:underline flex-shrink-0">全屏 →</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 bg-gray-100/80 dark:bg-gray-800/50 min-h-[200px]">
        <div className="relative bg-white dark:bg-gray-900 shadow-md rounded-sm mx-auto w-full max-w-[220px] min-h-[280px] p-3.5">
          <div className="absolute top-2 right-2 text-[8px] text-gray-300">P{page}</div>
          <div className="space-y-1.5 relative">
            {lines.map((line, i) => (
              <p key={i} className={`text-[8px] leading-snug ${line === '' ? 'h-1' : 'text-gray-600 dark:text-gray-400'}`}>
                {line || '\u00A0'}
              </p>
            ))}
            {bbox && (
              <div
                className={`absolute border-2 border-cyan-500 bg-cyan-400/25 rounded-sm pointer-events-none ${
                  highlightFromSearch ? 'ring-2 ring-cyan-300 animate-pulse' : ''
                }`}
                style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.w}%`, height: `${bbox.h}%` }}
              />
            )}
          </div>
        </div>
      </div>
      {bbox && nodeTitle && (
        <div className="px-3 py-2 border-t border-cyan-100 dark:border-cyan-900/40 bg-cyan-50/50 dark:bg-cyan-900/10 text-[10px] text-cyan-800 dark:text-cyan-200 flex-shrink-0">
          bbox 高亮: <strong>{nodeTitle}</strong> · P{page}
        </div>
      )}
    </div>
  );
}

export function IndexTreeNode({
  node, depth, selectedId, onSelect,
}: {
  node: PageIndexTreeNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <button
        type="button"
        onClick={() => { onSelect(node.id); if (hasChildren) setExpanded(p => !p); }}
        className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-left text-xs transition-colors ${
          isSelected ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        ) : <span className="w-3 flex-shrink-0" />}
        {hasChildren ? (
          expanded ? <FolderOpen size={12} className="text-cyan-600 flex-shrink-0" /> : <Folder size={12} className="text-cyan-500 flex-shrink-0" />
        ) : (
          <FileText size={12} className={`flex-shrink-0 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
        )}
        <span className="truncate flex-1">{node.title}</span>
        {node.startPage != null && (
          <span className="text-[9px] text-gray-400 flex-shrink-0">P{node.startPage}</span>
        )}
      </button>
      {expanded && hasChildren && node.children!.map(child => (
        <IndexTreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
