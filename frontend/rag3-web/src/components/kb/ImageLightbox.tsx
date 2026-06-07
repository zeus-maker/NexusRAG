import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { ChunkImage } from './ChunkImage';

interface Props {
  imageId: string;
  title?: string;
  onClose: () => void;
}

export function ImageLightbox({ imageId, title, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="图片预览"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="关闭"
      >
        <X size={20} />
      </button>
      <div
        className="relative max-w-[min(92vw,1200px)] max-h-[88vh] flex flex-col items-center gap-3"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <p className="text-sm text-white/90 text-center max-w-full truncate px-4">{title}</p>
        )}
        <div className="bg-white rounded-xl p-2 shadow-2xl overflow-auto max-h-[80vh]">
          <ChunkImage
            imageId={imageId}
            className="max-w-full max-h-[76vh] w-auto h-auto object-contain block mx-auto"
          />
        </div>
        <p className="text-xs text-white/60 flex items-center gap-1">
          <ZoomIn size={12} /> 点击空白处或按 Esc 关闭
        </p>
      </div>
    </div>
  );
}
