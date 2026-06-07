import { useAppState } from './store';
import { Sidebar, TopBar, StatusBar } from './components/Layout';
import { LoginPage } from './pages/Login';
import { KBListPage, KBDetailPage, DocumentPage, ChunkPreviewPage, IndexStatusPage } from './pages/KnowledgeBase';
import { KBSettingsPage, RetrievalTestPage, WikiPage, PageIndexTreePage, WikiManagePage, PageIndexManagePage } from './pages/KBExtra';
import { ChatPage } from './pages/Chat';
import { SearchPage, AgentPage } from './pages/SearchAgent';
import { EvalDashboardPage, EvalTasksPage, ABTestPage } from './pages/Evaluation';
import { CostCenterPage, ReplayPage } from './pages/EvalExtra';
import { UserManagePage, RoleManagePage, PipelineConfigPage, AuditLogPage, MonitorPage } from './pages/System';
import { ClassifierPage, SecurityPage, ModelsPage, TracesPage } from './pages/SystemExtra';
import { HomePage } from './pages/Home';
import WikiHubPage from './pages/Hub/WikiHubPage';
import PageIndexHubPage from './pages/Hub/PageIndexHubPage';
import GraphRAGHubPage from './pages/Hub/GraphRAGHubPage';

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
      case 'kb-detail':
        return <KBDetailPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-documents':
        return <DocumentPage kbId={state.selectedKBId || 'kb-001'} onNavigate={navigate} />;
      case 'kb-chunks':
        return <ChunkPreviewPage kbId={state.selectedKBId || 'kb-001'} docId={state.selectedDocId || 'doc-001'} onNavigate={navigate} />;
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
      case 'kb-retrieval-test':
        return <RetrievalTestPage kbId={state.selectedKBId || 'kb-001'} />;
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
      case 'eval-cost':
        return <CostCenterPage />;
      case 'eval-replay':
        return <ReplayPage />;
      case 'sys-users':
        return <UserManagePage />;
      case 'sys-roles':
        return <RoleManagePage />;
      case 'sys-pipeline':
        return <PipelineConfigPage />;
      case 'sys-classifier':
        return <ClassifierPage />;
      case 'sys-security':
        return <SecurityPage />;
      case 'sys-models':
        return <ModelsPage />;
      case 'sys-audit':
        return <AuditLogPage />;
      case 'sys-monitor':
        return <MonitorPage />;
      case 'sys-traces':
        return <TracesPage />;
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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={state.sidebarCollapsed}
          currentPage={state.page}
          onNavigate={navigate}
        />
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {renderContent()}
        </main>
      </div>
      <StatusBar theme={state.theme} />
    </div>
  );
}
