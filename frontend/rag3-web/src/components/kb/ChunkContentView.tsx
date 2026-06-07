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
      {chunk.image_id && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => onImageClick?.(chunk.image_id!)}
            className="rounded-lg border border-gray-200 overflow-hidden hover:ring-2 hover:ring-cyan-300 transition-shadow"
            title="点击放大预览"
          >
            <ChunkImage
              imageId={chunk.image_id}
              cacheBust={cacheBust}
              className="max-h-32 max-w-[200px] object-contain bg-gray-50"
            />
          </button>
        </div>
      )}
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
  );
}
