import { X } from 'lucide-react';
import { renderProgressLogLines } from '../../utils/documentUtil';

interface Props {
  title: string;
  message: string;
  onClose: () => void;
}

export function EnhancementLogModal({ title, message, onClose }: Props) {
  const lines = message ? renderProgressLogLines(message) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">增强索引过程日志</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {lines.length === 0 ? (
            <p className="text-xs text-gray-400">暂无日志</p>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 font-mono text-xs leading-relaxed space-y-0.5 max-h-[400px] overflow-y-auto">
              {lines.map((line, i) => (
                <div key={i} className={line.isError ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}>
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
