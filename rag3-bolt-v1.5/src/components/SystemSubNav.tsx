import { GitBranch, Shuffle } from 'lucide-react';

const SYSTEM_ROUTING_TABS = [
  { page: 'sys-pipeline', label: '流水线配置', icon: <GitBranch size={14} /> },
  { page: 'sys-classifier', label: '查询路由', icon: <Shuffle size={14} /> },
];

interface SystemSubNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

/** 系统管理 · 路由配置区顶栏（对齐 EvalSubNav） */
export function SystemSubNav({ currentPage, onNavigate }: SystemSubNavProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-px scrollbar-thin">
      {SYSTEM_ROUTING_TABS.map(tab => (
        <button
          key={tab.page}
          type="button"
          onClick={() => onNavigate(tab.page)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
            currentPage === tab.page
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface SystemSectionTabsProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (idx: number) => void;
}

/** 页内分段 Tab（视觉与 EvalSubNav 一致，状态驱动） */
export function SystemSectionTabs({ tabs, activeTab, onTabChange }: SystemSectionTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-px scrollbar-thin border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab, idx) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(idx)}
          className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 -mb-px whitespace-nowrap transition-colors ${
            activeTab === idx
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** 宽表格容器（评测数据集同款） */
export function TableCard({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
      </div>
    </div>
  );
}
