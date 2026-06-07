import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, RefreshCw, Square, Trash2, Layers } from 'lucide-react';
import type { Document, ParseStatus } from '../../types';

interface DocumentActionMenuProps {
  doc: Document;
  anchorRect: DOMRect;
  onClose: () => void;
  onAction: (action: 'preview' | 'parse' | 'reparse' | 'stop' | 'download' | 'delete' | 'chunks') => void;
}

export function DocumentActionMenu({ doc, anchorRect, onClose, onAction }: DocumentActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  type Action = DocumentActionMenuProps['onAction'] extends (a: infer A) => void ? A : never;

  const items: {
    key: Action;
    label: string;
    icon: React.ReactNode;
    show: boolean;
    danger?: boolean;
  }[] = [
    { key: 'preview', label: '解析预览', icon: <Eye size={12} />, show: doc.parse_status === 'parsed' },
    { key: 'chunks', label: '分块列表', icon: <Layers size={12} />, show: doc.parse_status === 'parsed' },
    { key: 'parse', label: '开始解析', icon: <RefreshCw size={12} />, show: doc.parse_status === 'pending' || doc.parse_status === 'failed' },
    { key: 'reparse', label: '重新解析', icon: <RefreshCw size={12} />, show: doc.parse_status === 'parsed' },
    { key: 'stop', label: '停止解析', icon: <Square size={12} />, show: doc.parse_status === 'parsing' },
    { key: 'download', label: '下载原文件', icon: <Download size={12} />, show: true },
    { key: 'delete', label: '删除', icon: <Trash2 size={12} />, show: true, danger: true },
  ];

  const menuWidth = 148;
  const left = Math.min(anchorRect.right - menuWidth, window.innerWidth - menuWidth - 8);
  const top = anchorRect.bottom + 4;
  const flip = top + 220 > window.innerHeight;
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(8, left),
    top: flip ? anchorRect.top - 4 : top,
    transform: flip ? 'translateY(-100%)' : undefined,
    zIndex: 9999,
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[148px]"
    >
      {items.filter(i => i.show).map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onAction(item.key)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
            item.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

export function parseStatusFilterLabel(status: ParseStatus | 'all') {
  const map: Record<string, string> = {
    all: '全部',
    pending: '待解析',
    parsing: '解析中',
    parsed: '已完成',
    failed: '失败',
  };
  return map[status] ?? status;
}
