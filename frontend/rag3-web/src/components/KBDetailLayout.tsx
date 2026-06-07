import { ReactNode } from 'react';
import { PAGEINDEX_GLOBAL_FAILED_COUNT } from '../data/pageIndexMock';
import { useKnowledgeBase } from '../hooks/useKbData';
import { KBSubNav } from './KBSubNav';
import type { KnowledgeBase } from '../types';

interface KBDetailLayoutProps {
  kbId: string;
  activeKey: string;
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
  children: ReactNode;
  badges?: { wiki?: number; pageindex?: number };
  kbOverride?: KnowledgeBase;
}

export function KBDetailLayout({ kbId, activeKey, onNavigate, children, badges, kbOverride }: KBDetailLayoutProps) {
  const { data: kbFetched, loading } = useKnowledgeBase(kbId);
  const kb = kbOverride ?? kbFetched;

  return (
    <div className="h-full flex overflow-hidden">
      <KBSubNav
        kbId={kbId}
        activeKey={activeKey}
        badges={badges ?? { wiki: 3, pageindex: PAGEINDEX_GLOBAL_FAILED_COUNT }}
        onNavigate={onNavigate}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-2.5 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('kb-list')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              知识库管理
            </button>
            <span className="text-gray-300">/</span>
            <button
              type="button"
              onClick={() => onNavigate('kb-detail', { selectedKBId: kbId })}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1.5"
            >
              <span>{kb.icon}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {loading && !kbOverride ? '加载中…' : kb.name}
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
