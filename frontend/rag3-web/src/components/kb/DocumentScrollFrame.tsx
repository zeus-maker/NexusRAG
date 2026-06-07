import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/** 单文档预览外框：占满父级分配高度，内部子组件自行滚动 */
export function DocumentScrollFrame({ children, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/20 ${className}`}
    >
      {children}
    </div>
  );
}
