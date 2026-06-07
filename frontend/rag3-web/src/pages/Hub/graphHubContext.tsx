import { createContext, useContext } from 'react';
import type { useGraphHubData } from '../../hooks/useEnhancementHubData';

export type GraphHubContextValue = ReturnType<typeof useGraphHubData>;

export const GraphHubContext = createContext<GraphHubContextValue | null>(null);

export function useGraphHubContext() {
  const ctx = useContext(GraphHubContext);
  if (!ctx) throw new Error('useGraphHubContext must be used within GraphHubContext');
  return ctx;
}
