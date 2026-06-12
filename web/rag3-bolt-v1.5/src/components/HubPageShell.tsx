import { ReactNode } from 'react';
import { HubBadge } from './hubUi';
import { BtnPrimary, BtnSecondary } from './hubUi';

interface HubPageShellProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  badge?: { label: string; variant: 'active' | 'indexing' | 'error' | 'draft' };
  primaryAction?: { label: string; icon?: ReactNode; onClick: () => void };
  secondaryAction?: { label: string; icon?: ReactNode; onClick: () => void };
  onBack: () => void;
  tabs: string[];
  activeTab: number;
  onTabChange: (idx: number) => void;
  children: ReactNode;
}

export function HubPageShell({
  title,
  subtitle,
  icon,
  badge,
  primaryAction,
  secondaryAction,
  onBack,
  tabs,
  activeTab,
  onTabChange,
  children,
}: HubPageShellProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 flex-shrink-0">
            ← 返回
          </button>
          <span className="text-gray-300">/</span>
          <span className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="text-sm font-bold text-gray-900 truncate">{title}</span>
            {badge && <HubBadge variant={badge.variant}>{badge.label}</HubBadge>}
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {secondaryAction && (
            <BtnSecondary onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </BtnSecondary>
          )}
          {primaryAction && (
            <BtnPrimary onClick={primaryAction.onClick}>
              {primaryAction.icon}
              {primaryAction.label}
            </BtnPrimary>
          )}
        </div>
      </div>

      <p className="px-6 py-2 text-xs text-gray-500 bg-gray-50/80 border-b border-gray-100 flex-shrink-0">{subtitle}</p>

      <div className="flex border-b border-gray-200 bg-white px-6 flex-shrink-0 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => onTabChange(idx)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              activeTab === idx
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
