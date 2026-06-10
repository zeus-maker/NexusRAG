import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { stripThinkingTags } from '../utils/thinkContent';

interface ChatThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export function ChatThinkingBlock({ content, isStreaming }: ChatThinkingBlockProps) {
  const [open, setOpen] = useState(Boolean(isStreaming));

  useEffect(() => {
    if (isStreaming) setOpen(true);
  }, [isStreaming]);

  const displayContent = stripThinkingTags(content);
  if (!displayContent.trim() && !isStreaming) return null;

  return (
    <div className="mb-3 rounded-lg border border-violet-100 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-violet-700 dark:text-violet-300 hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
      >
        <Sparkles size={13} className={isStreaming ? 'animate-pulse' : ''} />
        <span className="font-medium">思考过程</span>
        {isStreaming && (
          <span className="text-[10px] text-violet-500 animate-pulse">生成中…</span>
        )}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-violet-100/80 dark:border-violet-900/40">
          <pre className="mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words max-h-56 overflow-y-auto font-sans">
            {displayContent || (isStreaming ? '…' : '')}
          </pre>
        </div>
      )}
    </div>
  );
}
