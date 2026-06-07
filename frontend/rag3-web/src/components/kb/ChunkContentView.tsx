import DOMPurify from 'dompurify';
import type { Chunk } from '../../types';
import { ChunkImage } from './ChunkImage';

interface Props {
  chunk: Chunk;
  cacheBust?: string | number;
  maxHeight?: string;
  onImageClick?: (imageId: string) => void;
}

function hasHtmlMarkup(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function ChunkContentView({ chunk, cacheBust, maxHeight = 'max-h-48', onImageClick }: Props) {
  const html = chunk.content_html || '';
  const showHtml = html && hasHtmlMarkup(html);

  return (
    <div className="space-y-2">
      <div className={`flex gap-3 items-start ${chunk.image_id ? 'flex-row' : ''}`}>
        <div className="flex-1 min-w-0">
          {showHtml ? (
            <div
              className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed overflow-y-auto ${maxHeight} prose prose-sm max-w-none`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
            />
          ) : (
            <pre className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto ${maxHeight}`}>
              {chunk.content_preview}
            </pre>
          )}
        </div>
        {chunk.image_id && (
          <button
            type="button"
            onClick={() => onImageClick?.(chunk.image_id!)}
            className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 overflow-hidden hover:ring-2 hover:ring-cyan-300 transition-shadow"
            title="点击放大预览"
          >
            <ChunkImage
              imageId={chunk.image_id}
              cacheBust={cacheBust}
              className="w-full h-full object-contain bg-gray-50"
            />
          </button>
        )}
      </div>
    </div>
  );
}
