import { useState, useEffect, useCallback } from 'react';
import {
  hashToAppState,
  mergeHashIntoState,
  readHashNavigation,
  shouldIgnoreHashChange,
  syncLocationHash,
  type KBSettingsTab,
  type NavPage,
} from './navigationUrl';
import { logout as clearAuth } from './services/auth';
import { getRealApiMode, getStoredAuth, getStoredUser } from './services/http';

export type Page = NavPage;
export type { KBSettingsTab };

interface AppState {
  page: Page;
  selectedKBId: string | null;
  selectedDocId: string | null;
  selectedConvId: string | null;
  kbSettingsTab: KBSettingsTab | null;
  monitorTab: number | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  currentUser: { name: string; role: string; email: string } | null;
}

function buildInitialState(): AppState {
  const theme =
    typeof localStorage !== 'undefined' && localStorage.getItem('rag3-theme') === 'dark'
      ? 'dark'
      : 'light';
  const hashState = readHashNavigation();
  const base: AppState = {
    page: 'login',
    selectedKBId: null,
    selectedDocId: null,
    selectedConvId: null,
    kbSettingsTab: null,
    monitorTab: null,
    sidebarCollapsed: false,
    theme,
    currentUser: null,
  };
  if (getRealApiMode() && getStoredAuth()) {
    const saved = getStoredUser();
    if (saved) {
      const loggedIn: AppState = { ...base, page: 'home', currentUser: saved };
      return mergeHashIntoState(loggedIn, hashState);
    }
  }
  // 未登录时保留 hash，登录后可恢复到目标页
  if (hashState?.page && hashState.page !== 'login') {
    return mergeHashIntoState(base, { ...hashState, page: 'login' });
  }
  return base;
}

const initialState: AppState = buildInitialState();

type Listener = (state: AppState) => void;
let globalState: AppState = { ...initialState };
const listeners = new Set<Listener>();

function setState(partial: Partial<AppState>) {
  globalState = { ...globalState, ...partial };
  listeners.forEach(l => l(globalState));
}

function applyNavigation(page: Page, extra?: Partial<AppState>) {
  const next: AppState = { ...globalState, page, ...extra };
  setState({ page, ...extra });
  if (page === 'login') {
    syncLocationHash({ ...next, page: 'login' }, 'replace');
  } else if (next.currentUser) {
    syncLocationHash(next, 'push');
  }
}

export function useAppState() {
  const [state, setLocalState] = useState(globalState);
  useEffect(() => {
    listeners.add(setLocalState);
    return () => { listeners.delete(setLocalState); };
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      if (shouldIgnoreHashChange()) return;
      const parsed = hashToAppState(window.location.hash);
      if (!parsed?.page) return;
      if (parsed.page === 'login') {
        setState({ page: 'login' });
        return;
      }
      if (!globalState.currentUser) return;
      setState(parsed);
    };
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (globalState.currentUser && globalState.page !== 'login' && !window.location.hash) {
      syncLocationHash(globalState, 'replace');
    }
  }, []);

  const navigate = useCallback((page: Page, extra?: Partial<AppState>) => {
    applyNavigation(page, extra);
  }, []);
  const login = useCallback((user?: AppState['currentUser']) => {
    const hashState = readHashNavigation();
    const target = mergeHashIntoState(
      {
        ...globalState,
        currentUser: user ?? { name: '李婷', role: '平台管理员', email: 'li.ting@corp.com' },
        page: 'home',
      },
      hashState?.page && hashState.page !== 'login' ? hashState : null,
    );
    setState(target);
    syncLocationHash(target, 'replace');
  }, []);
  const logout = useCallback(() => {
    clearAuth();
    const next = { ...buildInitialState(), page: 'login' as const, currentUser: null };
    setState(next);
    syncLocationHash(next, 'replace');
  }, []);
  const toggleSidebar = useCallback(() => setState({ sidebarCollapsed: !globalState.sidebarCollapsed }), []);
  const toggleTheme = useCallback(() => {
    const theme = globalState.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('rag3-theme', theme); } catch { /* ignore */ }
    setState({ theme });
  }, []);
  return { state, navigate, login, logout, toggleSidebar, toggleTheme };
}
