import { useState, useEffect, useCallback } from 'react';

type Page =
  | 'home'
  | 'kb-list'
  | 'kb-detail'
  | 'kb-documents'
  | 'kb-chunks'
  | 'kb-index-status'
  | 'kb-settings'
  | 'kb-retrieval-test'
  | 'kb-wiki'
  | 'kb-pageindex-tree'
  | 'kb-wiki-manage'
  | 'kb-pageindex-manage'
  | 'wiki-hub'
  | 'pageindex-hub'
  | 'graphrag-hub'
  | 'chat'
  | 'search'
  | 'agent'
  | 'eval-dashboard'
  | 'eval-tasks'
  | 'eval-ab-test'
  | 'eval-cost'
  | 'eval-replay'
  | 'sys-users'
  | 'sys-roles'
  | 'sys-pipeline'
  | 'sys-classifier'
  | 'sys-audit'
  | 'sys-monitor'
  | 'sys-security'
  | 'sys-models'
  | 'sys-api'
  | 'sys-traces'
  | 'login';

export type KBSettingsTab = 'basic' | 'parsing' | 'index' | 'datasource' | 'tags';

interface AppState {
  page: Page;
  selectedKBId: string | null;
  selectedDocId: string | null;
  selectedConvId: string | null;
  kbSettingsTab: KBSettingsTab | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  currentUser: { name: string; role: string; email: string } | null;
}

const initialState: AppState = {
  page: 'login',
  selectedKBId: null,
  selectedDocId: null,
  selectedConvId: null,
  kbSettingsTab: null,
  sidebarCollapsed: false,
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('rag3-theme') === 'dark') ? 'dark' : 'light',
  currentUser: null,
};

type Listener = (state: AppState) => void;
let globalState: AppState = { ...initialState };
const listeners = new Set<Listener>();

function setState(partial: Partial<AppState>) {
  globalState = { ...globalState, ...partial };
  listeners.forEach(l => l(globalState));
}

export function useAppState() {
  const [state, setLocalState] = useState(globalState);
  useEffect(() => {
    listeners.add(setLocalState);
    return () => { listeners.delete(setLocalState); };
  }, []);
  const navigate = useCallback((page: Page, extra?: Partial<AppState>) => {
    setState({ page, ...extra });
  }, []);
  const login = useCallback(() => {
    setState({ page: 'home', currentUser: { name: '李婷', role: '平台管理员', email: 'li.ting@corp.com' } });
  }, []);
  const logout = useCallback(() => setState(initialState), []);
  const toggleSidebar = useCallback(() => setState({ sidebarCollapsed: !globalState.sidebarCollapsed }), []);
  const toggleTheme = useCallback(() => {
    const theme = globalState.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('rag3-theme', theme); } catch { /* ignore */ }
    setState({ theme });
  }, []);
  return { state, navigate, login, logout, toggleSidebar, toggleTheme };
}
