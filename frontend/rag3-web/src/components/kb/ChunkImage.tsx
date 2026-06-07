import { useEffect, useState, type MouseEvent } from 'react';
import { getStoredAuth } from '../../services/http';
import { kbApi } from '../../services/kbApi';

interface Props {
  imageId: string;
  alt?: string;
  className?: string;
  cacheBust?: string | number;
  onClick?: (e: MouseEvent) => void;
  title?: string;
}

export function ChunkImage({ imageId, alt = '分块图片', className = '', cacheBust, onClick, title }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    setFailed(false);
    setUrl(null);

    const auth = getStoredAuth();
    fetch(kbApi.chunkImageUrl(imageId, cacheBust), {
      headers: auth ? { Authorization: auth } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('load failed');
        return res.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => setFailed(true));

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [imageId, cacheBust]);

  if (failed) {
    return <span className="text-[10px] text-gray-400">图片加载失败</span>;
  }
  if (!url) {
    return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      title={title}
      className={`${className}${onClick ? ' cursor-zoom-in' : ''}`}
      onClick={onClick}
    />
  );
}
