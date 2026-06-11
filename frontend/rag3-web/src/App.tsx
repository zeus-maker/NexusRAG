import { useAppState } from './store';
import { Sidebar, TopBar, StatusBar } from './components/Layout';
import { LoginPage } from './pages/Login';
import { KBListPage, KBDetailPage, DocumentPage, ChunkPreviewPage, IndexStatusPage } from './pages/KnowledgeBase';
import { KBRecycleBinPage } from './pages/KBRecycleBin';
import { KBSettingsPage, WikiPage, PageIndexTreePage, WikiManagePage, PageIndexManagePage } from './pages/KBExtra';
import { RetrievalTestPage } from './pages/RetrievalTestPage';
import { ChatPage } from './pages/Chat';
import { SearchPage } from './pages/Search';
import { AgentPage } from './pages/Agent';
import { EvalDashboardPage, EvalTasksPage, ABTestPage } from './pages/Evaluation';
import { EvalDatasetPage } from './pages/EvalDataset';
import { EvalSatisfactionPage } from './pages/EvalSatisfaction';
import { CostCenterPage, ReplayPage } from './pages/EvalExtra';
import { EvalRouteLearningPage } from './pages/EvalRouteLearning';
import { UserManagePage, RoleManagePage, PipelineConfigPage, AuditLogPage, MonitorPage } from './pages/System';
import { ClassifierPage, SecurityPage, ModelsPage } from './pages/SystemExtra';
import { TracesPage } from './pages/TracesPage';
import { FusionConfigPage } from './pages/FusionConfigPage';
import { RetrievalStrategyPage } from './pages/RetrievalStrategyPage';
import { GenerationStrategyPage } from './pages/GenerationStrategyPage';
import { KBPermissionsPage, KBDataSourcesPage, KBExportPage } from './pages/KBP0Pages';
import { KBStaleGovernancePage, KBProcessingLogsPage } from './pages/KBGovernancePages';
import { HomePage } from './pages/Home';
import WikiHubPage from './pages/Hub/WikiHubPage';
import PageIndexHubPage from './pages/Hub/PageIndexHubPage';
import GraphRAGHubPage from './pages/Hub/GraphRAGHubPage';
import { PromptTemplatesPage, GrayReleasePage, BackupPage, VectorDbSwitchPage } from './pages/SystemOpsPages';

export default function App() {
  const { state, navigate, login, logout, toggleSidebar, toggleTheme } = useAppState();

  if (state.page === 'login') {
    return <LoginPage onLogin={login} />;
  }

  const renderContent = () => {
    switch (state.page) {
      case 'home':
        return <HomePage onNavigate={navigate} currentUser={state.currentUser} />;
      case 'kb-list':
        return <KBListPage onNavigate={navigate} />;
      case 'kb-recycle-bin':
        return <KBRecycleBinPage onNavigate={navigate} />;
      case 'kb-detail':
        return <KBDetailPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-documents':
        return <DocumentPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-chunks':
        return (
          <ChunkPreviewPage
            kbId={state.selectedKBId || 'kb-001'}
            docId={state.selectedDocId || 'doc-001'}
            initialChunkId={state.selectedChunkId || undefined}
            onNavigate={navigate}
          />
        );
      case 'kb-index-status':
        return <IndexStatusPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-settings':
        return (
          <KBSettingsPage
            kbId={state.selectedKBId || 'kb-001'}
            onNavigate={navigate}
            initialTab={state.kbSettingsTab || 'parsing'}
          />
        );
      case 'kb-permissions':
        return <KBPermissionsPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-data-sources':
        return <KBDataSourcesPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-export':
        return <KBExportPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-governance-stale':
        return <KBStaleGovernancePage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-logs':
        return <KBProcessingLogsPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-retrieval-test':
        return <RetrievalTestPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-wiki':
        return <WikiPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-pageindex-tree':
        return <PageIndexTreePage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-wiki-manage':
        return <WikiManagePage onNavigate={navigate} />;
      case 'kb-pageindex-manage':
        return <PageIndexManagePage onNavigate={navigate} />;
      case 'wiki-hub':
        return <WikiHubPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'pageindex-hub':
        return <PageIndexHubPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'graphrag-hub':
        return <GraphRAGHubPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'chat':
        return <ChatPage convId={state.selectedConvId} onNavigate={navigate} />;
      case 'search':
        return <SearchPage onNavigate={navigate} />;
      case 'agent':
        return <AgentPage onNavigate={navigate} />;
      case 'eval-dashboard':
        return <EvalDashboardPage onNavigate={navigate} />;
      case 'eval-tasks':
        return <EvalTasksPage onNavigate={navigate} />;
      case 'eval-ab-test':
        return <ABTestPage onNavigate={navigate} />;
      case 'eval-datasets':
        return <EvalDatasetPage onNavigate={navigate} />;
      case 'eval-satisfaction':
        return <EvalSatisfactionPage onNavigate={navigate} />;
      case 'eval-cost':
        return <CostCenterPage onNavigate={navigate} />;
      case 'eval-replay':
        return <ReplayPage onNavigate={navigate} />;
      case 'eval-route-learning':
        return <EvalRouteLearningPage onNavigate={navigate} />;
      case 'sys-users':
        return <UserManagePage />;
      case 'sys-roles':
        return <RoleManagePage />;
      case 'sys-pipeline':
        return <PipelineConfigPage onNavigate={navigate} />;
      case 'sys-classifier':
        return <ClassifierPage onNavigate={navigate} />;
      case 'sys-fusion':
        return <FusionConfigPage onNavigate={navigate} />;
      case 'sys-retrieval-strategy':
        return <RetrievalStrategyPage onNavigate={navigate} />;
      case 'sys-generation-strategy':
        return <GenerationStrategyPage onNavigate={navigate} />;
      case 'sys-security':
        return <SecurityPage />;
      case 'sys-models':
        return <ModelsPage />;
      case 'sys-prompt-templates':
        return <PromptTemplatesPage />;
      case 'sys-gray-release':
        return <GrayReleasePage />;
      case 'sys-backup':
        return <BackupPage />;
      case 'sys-vector-db':
        return <VectorDbSwitchPage />;
      case 'sys-audit':
        return <AuditLogPage />;
      case 'sys-monitor':
        return <MonitorPage onNavigate={navigate} initialTab={state.monitorTab ?? 0} />;
      case 'sys-traces':
        return <TracesPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} currentUser={state.currentUser} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${state.theme === 'dark' ? 'dark' : ''}`}>
      <TopBar
        collapsed={state.sidebarCollapsed}
        onToggle={toggleSidebar}
        onThemeToggle={toggleTheme}
        theme={state.theme}
        currentUser={state.currentUser}
        onLogout={logout}
        currentPage={state.page}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          collapsed={state.sidebarCollapsed}
          currentPage={state.page}
          onNavigate={navigate}
        />
        <main className="flex-1 min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {renderContent()}
        </main>
      </div>
      <StatusBar theme={state.theme} />
    </div>
  );
}
