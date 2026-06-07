import {
  LayoutDashboard, FileText, Search, Activity, GitBranch,
  Network, BookOpen, Database, Settings, Shield, ScrollText,
} from 'lucide-react';
import type { KBSettingsTab } from '../store';

export interface KBSubNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  page?: string;
  settingsTab?: KBSettingsTab;
  badgeKey?: 'wiki' | 'pageindex';
  comingSoon?: boolean;
}

export const KB_SUB_NAV_ITEMS: KBSubNavItem[] = [
  { key: 'kb-detail', label: '概览', icon: <LayoutDashboard size={15} /> },
  { key: 'kb-documents', label: '文件', icon: <FileText size={15} /> },
  { key: 'kb-retrieval-test', label: '检索测试', icon: <Search size={15} /> },
  { key: 'kb-index-status', label: '索引状态', icon: <Activity size={15} /> },
  { key: 'pageindex-hub', label: 'PageIndex', icon: <GitBranch size={15} />, badgeKey: 'pageindex' },
  { key: 'graphrag-hub', label: '知识图谱', icon: <Network size={15} /> },
  { key: 'wiki-hub', label: 'Wiki', icon: <BookOpen size={15} />, badgeKey: 'wiki' },
  { key: 'kb-data-sources', label: '数据源', icon: <Database size={15} /> },
  { key: 'kb-settings', label: '配置', icon: <Settings size={15} /> },
  { key: 'kb-permissions', label: '权限', icon: <Shield size={15} /> },
  { key: 'kb-logs', label: '日志', icon: <ScrollText size={15} />, comingSoon: true },
];

interface KBSubNavProps {
  kbId: string;
  activeKey: string;
  badges?: { wiki?: number; pageindex?: number };
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
}

export function KBSubNav({ kbId, activeKey, badges, onNavigate }: KBSubNavProps) {
  const handleClick = (item: KBSubNavItem) => {
    if (item.comingSoon) return;
    const page = item.page || item.key;
    const extra: Record<string, unknown> = { selectedKBId: kbId };
    if (item.settingsTab) extra.kbSettingsTab = item.settingsTab;
    onNavigate(page, extra);
  };

  return (
    <nav className="w-44 flex-shrink-0 border-r border-gray-200 bg-gray-50/80 dark:bg-gray-900/40 dark:border-gray-700 py-3 overflow-y-auto">
      <div className="px-3 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">知识库菜单</span>
      </div>
      <ul className="space-y-0.5 px-2">
        {KB_SUB_NAV_ITEMS.map(item => {
          const highlighted = item.key === activeKey;

          const badgeCount = item.badgeKey ? badges?.[item.badgeKey] : undefined;

          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => handleClick(item)}
                disabled={item.comingSoon}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  highlighted
                    ? 'bg-blue-600 text-white shadow-sm'
                    : item.comingSoon
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span className={highlighted ? 'text-white/90' : 'text-gray-400'}>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    highlighted ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {badgeCount}
                  </span>
                )}
                {item.comingSoon && (
                  <span className="text-[9px] text-gray-400">Soon</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
