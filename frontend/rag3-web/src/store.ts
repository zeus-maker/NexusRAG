import { useState, useEffect, useCallback } from 'react';
import { logout as clearAuth } from './services/auth';
import { getStoredAuth, getStoredUser, useRealApi } from './services/http';

type Page =
  | 'home'
  | 'kb-list'
  | 'kb-recycle-bin'
  | 'kb-detail'
  | 'kb-documents'
  | 'kb-chunks'
  | 'kb-index-status'
  | 'kb-settings'
  | 'kb-permissions'
  | 'kb-data-sources'
  | 'kb-export'
  | 'kb-governance-stale'
  | 'kb-logs'
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
  | 'eval-datasets'
  | 'eval-satisfaction'
  | 'eval-cost'
  | 'eval-replay'
  | 'eval-route-learning'
  | 'sys-users'
  | 'sys-roles'
  | 'sys-pipeline'
  | 'sys-classifier'
  | 'sys-fusion'
  | 'sys-retrieval-strategy'
  | 'sys-generation-strategy'
  | 'sys-audit'
  | 'sys-monitor'
  | 'sys-security'
  | 'sys-models'
  | 'sys-prompt-templates'
  | 'sys-gray-release'
  | 'sys-backup'
  | 'sys-vector-db'
  | 'sys-api'
  | 'sys-traces'
  | 'login';

export type KBSettingsTab = 'basic' | 'models' | 'parsing' | 'index' | 'datasource' | 'tags';

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
  if (useRealApi && getStoredAuth()) {
    const saved = getStoredUser();
    if (saved) return { ...base, page: 'home', currentUser: saved };
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

export function useAppState() {
  const [state, setLocalState] = useState(globalState);
  useEffect(() => {
    listeners.add(setLocalState);
    return () => { listeners.delete(setLocalState); };
  }, []);
  const navigate = useCallback((page: Page, extra?: Partial<AppState>) => {
    setState({ page, ...extra });
  }, []);
  const login = useCallback((user?: AppState['currentUser']) => {
    setState({
      page: 'home',
      currentUser: user ?? { name: '李婷', role: '平台管理员', email: 'li.ting@corp.com' },
    });
  }, []);
  const logout = useCallback(() => {
    clearAuth();
    setState({ ...buildInitialState(), page: 'login', currentUser: null });
  }, []);
  const toggleSidebar = useCallback(() => setState({ sidebarCollapsed: !globalState.sidebarCollapsed }), []);
  const toggleTheme = useCallback(() => {
    const theme = globalState.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('rag3-theme', theme); } catch { /* ignore */ }
    setState({ theme });
  }, []);
  return { state, navigate, login, logout, toggleSidebar, toggleTheme };
}
