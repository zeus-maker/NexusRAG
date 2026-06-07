interface Props {
  url: string;
  title?: string;
  className?: string;
}

/** 非 PDF 单文档：固定高度 iframe，文档在框内滚动 */
export function DocumentIframePreview({ url, title = '文档预览', className = '' }: Props) {
  return (
    <div className={`flex-1 h-0 min-h-0 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      <iframe
        title={title}
        src={url}
        className="block w-full h-full min-h-0 border-0"
      />
    </div>
  );
}
