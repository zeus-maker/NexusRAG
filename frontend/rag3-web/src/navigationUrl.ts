export type KBSettingsTab = 'basic' | 'models' | 'parsing' | 'index' | 'datasource' | 'tags';

export type NavPage =
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

export interface NavLocationState {
  page: NavPage;
  selectedKBId?: string | null;
  selectedDocId?: string | null;
  selectedChunkId?: string | null;
  selectedConvId?: string | null;
  kbSettingsTab?: KBSettingsTab | null;
  monitorTab?: number | null;
}

const NAV_QUERY_KEYS = {
  selectedKBId: 'kb',
  selectedDocId: 'doc',
  selectedChunkId: 'chunk',
  selectedConvId: 'conv',
  kbSettingsTab: 'kbTab',
  monitorTab: 'monitorTab',
} as const;

type NavQueryField = keyof typeof NAV_QUERY_KEYS;

const KB_SETTINGS_TABS: KBSettingsTab[] = ['basic', 'models', 'parsing', 'index', 'datasource', 'tags'];

const VALID_PAGES = new Set<string>([
  'home',
  'kb-list',
  'kb-recycle-bin',
  'kb-detail',
  'kb-documents',
  'kb-chunks',
  'kb-index-status',
  'kb-settings',
  'kb-permissions',
  'kb-data-sources',
  'kb-export',
  'kb-governance-stale',
  'kb-logs',
  'kb-retrieval-test',
  'kb-wiki',
  'kb-pageindex-tree',
  'kb-wiki-manage',
  'kb-pageindex-manage',
  'wiki-hub',
  'pageindex-hub',
  'graphrag-hub',
  'chat',
  'search',
  'agent',
  'eval-dashboard',
  'eval-tasks',
  'eval-ab-test',
  'eval-datasets',
  'eval-satisfaction',
  'eval-cost',
  'eval-replay',
  'eval-route-learning',
  'sys-users',
  'sys-roles',
  'sys-pipeline',
  'sys-classifier',
  'sys-fusion',
  'sys-retrieval-strategy',
  'sys-generation-strategy',
  'sys-audit',
  'sys-monitor',
  'sys-security',
  'sys-models',
  'sys-prompt-templates',
  'sys-gray-release',
  'sys-backup',
  'sys-vector-db',
  'sys-api',
  'sys-traces',
  'login',
]);

export function isValidPage(page: string): page is NavPage {
  return VALID_PAGES.has(page);
}

function pickNavFields(state: Partial<NavLocationState>): Partial<NavLocationState> {
  const picked: Partial<NavLocationState> = {};
  if (state.selectedKBId) picked.selectedKBId = state.selectedKBId;
  if (state.selectedDocId) picked.selectedDocId = state.selectedDocId;
  if (state.selectedChunkId) picked.selectedChunkId = state.selectedChunkId;
  if (state.selectedConvId) picked.selectedConvId = state.selectedConvId;
  if (state.kbSettingsTab) picked.kbSettingsTab = state.kbSettingsTab;
  if (state.monitorTab != null) picked.monitorTab = state.monitorTab;
  return picked;
}

/** 将应用导航状态序列化为 hash URL，例如 #/kb-retrieval-test?kb=xxx */
export function appStateToHash(state: NavLocationState): string {
  const page = state.page;
  if (page === 'login') return '#/login';

  const params = new URLSearchParams();
  (Object.entries(NAV_QUERY_KEYS) as [NavQueryField, string][]).forEach(([field, key]) => {
    const value = state[field];
    if (value == null || value === '') return;
    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `#/${page}?${qs}` : `#/${page}`;
}

/** 从 location.hash 解析导航状态；无效时返回 null */
export function hashToAppState(hash: string): Partial<NavLocationState> | null {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw || raw === 'login') return { page: 'login' };

  const qIndex = raw.indexOf('?');
  const pagePart = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).trim();
  if (!isValidPage(pagePart) || pagePart === 'login') return null;

  const partial: Partial<NavLocationState> = { page: pagePart };
  if (qIndex < 0) return partial;

  const params = new URLSearchParams(raw.slice(qIndex + 1));
  const kb = params.get('kb');
  const doc = params.get('doc');
  const chunk = params.get('chunk');
  const conv = params.get('conv');
  const kbTab = params.get('kbTab');
  const monitorTab = params.get('monitorTab');

  if (kb) partial.selectedKBId = kb;
  if (doc) partial.selectedDocId = doc;
  if (chunk) partial.selectedChunkId = chunk;
  if (conv) partial.selectedConvId = conv;
  if (kbTab && KB_SETTINGS_TABS.includes(kbTab as KBSettingsTab)) {
    partial.kbSettingsTab = kbTab as KBSettingsTab;
  }
  if (monitorTab != null && monitorTab !== '') {
    const n = Number(monitorTab);
    if (Number.isFinite(n)) partial.monitorTab = n;
  }

  return partial;
}

export function readHashNavigation(): Partial<NavLocationState> | null {
  if (typeof window === 'undefined') return null;
  return hashToAppState(window.location.hash);
}

let syncingHash = false;

/** 将 hash 与当前导航状态对齐（避免与 hashchange / popstate 互相触发） */
export function syncLocationHash(state: NavLocationState, mode: 'push' | 'replace' = 'push') {
  if (typeof window === 'undefined') return;
  const nextHash = appStateToHash(state);
  if (window.location.hash === nextHash) return;
  syncingHash = true;
  const url = `${window.location.pathname}${window.location.search}${nextHash}`;
  const historyState = { rag3Nav: true, page: state.page };
  if (mode === 'replace') {
    window.history.replaceState(historyState, '', url);
  } else {
    window.history.pushState(historyState, '', url);
  }
  queueMicrotask(() => {
    syncingHash = false;
  });
}

export function shouldIgnoreHashChange() {
  return syncingHash;
}

export function mergeHashIntoState<T extends NavLocationState>(base: T, hashState: Partial<NavLocationState> | null): T {
  if (!hashState?.page || hashState.page === 'login') return base;
  return { ...base, ...pickNavFields(hashState), page: hashState.page };
}
