import { useMemo, useState } from 'react';
import { Loader, Scissors } from 'lucide-react';
import type { Chunk } from '../../types';

interface ChunkSplitDialogProps {
  chunk: Chunk;
  open: boolean;
  onClose: () => void;
  onConfirm: (splitAt: number) => Promise<void>;
}

const MIN_PART = 8;

export function ChunkSplitDialog({ chunk, open, onClose, onConfirm }: ChunkSplitDialogProps) {
  const content = chunk.content_preview;
  const maxPos = Math.max(MIN_PART, content.length - MIN_PART);
  const [splitAt, setSplitAt] = useState(Math.floor(content.length / 2));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parts = useMemo(() => {
    const pos = Math.min(Math.max(splitAt, MIN_PART), content.length - MIN_PART);
    return {
      pos,
      part1: content.slice(0, pos),
      part2: content.slice(pos),
    };
  }, [content, splitAt]);

  if (!open) return null;

  const handleConfirm = async () => {
    setError(null);
    if (parts.part1.trim().length < MIN_PART || parts.part2.trim().length < MIN_PART) {
      setError(`每段至少 ${MIN_PART} 个字符`);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(parts.pos);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '拆分失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Scissors size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            拆分 Chunk #{chunk.chunk_index}
          </h3>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs text-gray-600 mb-2">
              拆分位置（{parts.pos} / {content.length} 字符）
            </label>
            <input
              type="range"
              min={MIN_PART}
              max={maxPos}
              value={parts.pos}
              onChange={e => setSplitAt(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">前半段（保留原 ID）</p>
              <pre className="text-xs p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">
                {parts.part1}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">后半段（新建分块）</p>
              <pre className="text-xs p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">
                {parts.part2}
              </pre>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
            取消
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
          >
            {submitting ? <><Loader size={12} className="animate-spin" /> 拆分中…</> : '确认拆分'}
          </button>
        </div>
      </div>
    </div>
  );
}
