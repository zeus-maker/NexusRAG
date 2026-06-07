import { createContext, useContext } from 'react';
import type { useWikiHubData } from '../../hooks/useEnhancementHubData';

export type WikiHubContextValue = ReturnType<typeof useWikiHubData>;

export const WikiHubContext = createContext<WikiHubContextValue | null>(null);

export function useWikiHubContext() {
  const ctx = useContext(WikiHubContext);
  if (!ctx) throw new Error('useWikiHubContext must be used within WikiHubContext');
  return ctx;
}
