import { X } from 'lucide-react';
import type { Document } from '../../types';
import { PARSE_STATUS_UI } from '../../services/kbMappers';
import { renderProgressLogLines } from '../../utils/documentUtil';
import { formatDateTime } from '../../utils/timeFormat';

interface Props {
  doc: Document;
  onClose: () => void;
}

export function ParseProgressLogModal({ doc, onClose }: Props) {
  const statusUi = PARSE_STATUS_UI[doc.parse_status];
  const lines = doc.progress_msg ? renderProgressLogLines(doc.progress_msg) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{doc.original_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">解析过程日志</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-gray-800 text-xs">
          <div>
            <span className="text-gray-500">状态</span>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusUi.color}`}>
                {statusUi.label}
              </span>
            </div>
          </div>
          {typeof doc.progress === 'number' && doc.progress > 0 && (
            <div>
              <span className="text-gray-500">进度</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200 font-medium">
                {Math.round(doc.progress <= 1 ? doc.progress * 100 : doc.progress)}%
              </p>
            </div>
          )}
          {doc.process_begin_at && (
            <div>
              <span className="text-gray-500">开始时间</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">{doc.process_begin_at}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500">上传时间</span>
            <p className="mt-1 text-gray-800 dark:text-gray-200">{formatDateTime(doc.uploaded_at)}</p>
          </div>
          {typeof doc.process_duration === 'number' && doc.process_duration > 0 && (
            <div>
              <span className="text-gray-500">耗时</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">{doc.process_duration}s</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <p className="text-xs text-gray-500 mb-2">过程日志</p>
          {lines.length === 0 ? (
            <p className="text-xs text-gray-400">暂无日志</p>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 font-mono text-xs leading-relaxed space-y-0.5 max-h-[350px] overflow-y-auto">
              {lines.map((line, i) => (
                <div key={i} className={line.isError ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}>
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
