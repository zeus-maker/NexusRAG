import { ExternalLink, X } from 'lucide-react';
import type { FailureCase } from '../data/evalMock';
import type { Citation } from '../types';
import { ChatMarkdownContent } from './ChatMarkdownContent';
import { openCitationPreview } from '../utils/citationNavigation';

export interface EvalFailureCaseDrawerProps {
  caseItem: FailureCase;
  kbId?: string;
  onClose: () => void;
  onAddToDataset: () => void;
}

function CitationCard({
  cite,
  kbId,
}: {
  cite: Citation;
  kbId?: string;
}) {
  const canOpen = Boolean(kbId && cite.doc_id);
  return (
    <div className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
      <span className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0">
        {cite.index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{cite.doc_name}</span>
          {cite.page_number > 0 && (
            <span className="text-[10px] text-gray-500">P{cite.page_number}</span>
          )}
          {cite.relevance_score > 0 && (
            <span className="text-[10px] text-blue-600 tabular-nums">
              {(cite.relevance_score * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {cite.section && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{cite.section}</p>
        )}
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-3 leading-relaxed">
          {cite.snippet}
        </p>
      </div>
      {canOpen && (
        <button
          type="button"
          onClick={() => openCitationPreview(kbId!, cite)}
          className="flex-shrink-0 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="新窗口打开分块预览"
        >
          <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
}

export function EvalFailureCaseDrawer({
  caseItem,
  kbId,
  onClose,
  onAddToDataset,
}: EvalFailureCaseDrawerProps) {
  const citations = caseItem.citations || [];
  const handleCiteClick = (c: Citation) => {
    if (kbId && c.doc_id) openCitationPreview(kbId, c);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            失败案例 #{caseItem.rank}
          </h3>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">查询</p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{caseItem.query}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">期望答案</p>
            <div className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 px-3 py-2">
              <ChatMarkdownContent text={caseItem.expected} citations={[]} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">实际答案</p>
            <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10 px-3 py-2">
              <ChatMarkdownContent
                text={caseItem.actual}
                citations={citations}
                onCiteClick={handleCiteClick}
              />
            </div>
          </div>
          {citations.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">引用片段（{citations.length}）</p>
              <div className="space-y-2">
                {citations.map(c => (
                  <CitationCard key={c.index} cite={c} kbId={kbId} />
                ))}
              </div>
            </div>
          )}
          {caseItem.metrics && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(caseItem.metrics).map(([k, v]) => (
                <span
                  key={k}
                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 tabular-nums"
                >
                  {k}: {typeof v === 'number' ? v.toFixed(3) : v}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 tabular-nums">
            {caseItem.metric}: {typeof caseItem.score === 'number' ? caseItem.score.toFixed(3) : caseItem.score}
          </p>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onAddToDataset}
            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            加入数据集
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
