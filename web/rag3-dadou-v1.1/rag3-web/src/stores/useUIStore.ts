import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  locale: 'zh-CN' | 'en-US';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLocale: (locale: 'zh-CN' | 'en-US') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  locale: 'zh-CN',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
}));