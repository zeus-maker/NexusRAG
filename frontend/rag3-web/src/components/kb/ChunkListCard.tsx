import { ImageIcon } from 'lucide-react';
import type { Chunk } from '../../types';
import { ChunkImage } from './ChunkImage';
import type { ChunkWorkspaceActions } from './KnowledgeChunkWorkspace';

const DOC_TYPE_STYLE: Record<string, string> = {
  text: 'bg-gray-100 text-gray-600',
  table: 'bg-emerald-100 text-emerald-700',
  image: 'bg-orange-100 text-orange-700',
};

interface Props {
  chunk: Chunk;
  index: number;
  selected: boolean;
  showActions?: boolean;
  actions?: ChunkWorkspaceActions;
  totalInPage: number;
  onSelect: () => void;
  onImageZoom: (imageId: string, title: string) => void;
}

export function ChunkListCard({
  chunk,
  index,
  selected,
  showActions,
  actions,
  totalInPage,
  onSelect,
  onImageZoom,
}: Props) {
  const typeKey = (chunk.doc_type_kwd || chunk.content_type || 'text').toLowerCase();
  const typeStyle = DOC_TYPE_STYLE[typeKey] ?? DOC_TYPE_STYLE.text;
  const isExcluded = chunk.available === false;
  const hasImage = Boolean(chunk.image_id);
  const acting = actions?.chunkActionId === chunk.chunk_id;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={`group rounded-xl border transition-all cursor-pointer overflow-hidden ${
        selected
          ? 'border-cyan-400 bg-cyan-50/80 dark:bg-cyan-950/30 shadow-sm ring-1 ring-cyan-200/80'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 hover:shadow-sm'
      } ${isExcluded ? 'opacity-70' : ''}`}
    >
      {/* 顶栏：序号 / 页码 / 类型 */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${
        selected ? 'border-cyan-200/60 bg-cyan-50/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold tabular-nums ${selected ? 'text-cyan-700' : 'text-gray-700'}`}>
            #{chunk.chunk_index}
          </span>
          {chunk.page_number > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 text-gray-500">
              P{chunk.page_number}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeStyle}`}>
            {chunk.doc_type_kwd || chunk.content_type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasImage && <ImageIcon size={12} className="text-orange-500" />}
          {isExcluded && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">已排除</span>
          )}
        </div>
      </div>

      {/* 主体：图 + 文本 */}
      <div className="px-3 py-2.5 space-y-2">
        {chunk.section_title && chunk.section_title !== `Chunk ${chunk.chunk_index}` && (
          <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 line-clamp-1" title={chunk.section_title}>
            {chunk.section_title}
          </p>
        )}

        {hasImage && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onImageZoom(chunk.image_id!, `Chunk #${chunk.chunk_index}`);
            }}
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-hidden hover:ring-2 hover:ring-cyan-300 transition-shadow"
            title="点击放大预览"
          >
            <ChunkImage
              imageId={chunk.image_id!}
              className="w-full max-h-28 object-contain mx-auto"
            />
            <span className="block text-center text-[10px] text-gray-400 py-1 bg-white/80 dark:bg-gray-900/80">
              点击放大
            </span>
          </button>
        )}

        <p className={`text-xs leading-relaxed text-gray-600 dark:text-gray-400 ${hasImage ? 'line-clamp-3' : 'line-clamp-4'}`}>
          {chunk.content_preview || '（无文本内容）'}
        </p>

        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>约 {chunk.token_count} 字</span>
          {chunk.chunk_strategy && chunk.chunk_strategy !== '通用分块' && (
            <span className="truncate max-w-[50%]">{chunk.chunk_strategy}</span>
          )}
        </div>
      </div>

      {showActions && actions && (
        <div
          className="flex gap-1.5 px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={acting || chunk.content_preview.length < 16}
            onClick={() => actions.onSplit?.(chunk)}
            className="flex-1 text-[10px] px-2 py-1 border border-gray-200 rounded-md hover:bg-white disabled:opacity-40 text-gray-600"
          >
            拆分
          </button>
          <button
            type="button"
            disabled={acting || index >= totalInPage - 1}
            onClick={() => actions.onMergeNext?.(chunk, index)}
            className="flex-1 text-[10px] px-2 py-1 border border-gray-200 rounded-md hover:bg-white disabled:opacity-40 text-gray-600"
          >
            合并↓
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => actions.onToggleExclude?.(chunk)}
            className={`flex-1 text-[10px] px-2 py-1 border rounded-md disabled:opacity-40 ${
              isExcluded
                ? 'border-green-200 text-green-700 hover:bg-green-50'
                : 'border-red-100 text-red-600 hover:bg-red-50'
            }`}
          >
            {isExcluded ? '恢复' : '排除'}
          </button>
        </div>
      )}
    </article>
  );
}
