import { createContext, useContext } from 'react';
import type { usePageIndexHubData } from '../../hooks/useEnhancementHubData';

export type PageIndexHubContextValue = ReturnType<typeof usePageIndexHubData>;

export const PageIndexHubContext = createContext<PageIndexHubContextValue | null>(null);

export function usePageIndexHubContext() {
  const ctx = useContext(PageIndexHubContext);
  if (!ctx) throw new Error('usePageIndexHubContext must be used within PageIndexHubContext');
  return ctx;
}
