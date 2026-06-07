import { ReactNode } from 'react';
import { KBDetailLayout } from './KBDetailLayout';

interface Props {
  kbId: string;
  activeKey: 'pageindex-hub' | 'graphrag-hub' | 'wiki-hub';
  onNavigate: (page: string, extra?: Record<string, unknown>) => void;
  children: ReactNode;
}

/** Hub 页外包 KBSubNav，进入 PageIndex/图谱/Wiki 时保留知识库左侧菜单 */
export function HubKBLayout({ kbId, activeKey, onNavigate, children }: Props) {
  return (
    <KBDetailLayout kbId={kbId} activeKey={activeKey} onNavigate={onNavigate}>
      <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">{children}</div>
    </KBDetailLayout>
  );
}
