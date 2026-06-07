import React, { useState } from 'react';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/Home/HomePage';
import KBListPage from './pages/KnowledgeBase/ListPage';
import KBDetailPage from './pages/KnowledgeBase/DetailPage';
import ChatPage from './pages/Chat/ChatPage';
import SearchListPage from './pages/Search/SearchListPage';
import SearchPage from './pages/Search/SearchPage';
import AgentListPage from './pages/Agent/AgentListPage';
import AgentDetailPage from './pages/Agent/AgentDetailPage';
import EvaluationPage from './pages/Evaluation/DashboardPage';
import SystemPage from './pages/System/DashboardPage';
import WikiHubPage from './pages/WikiHub/WikiHubPage';
import PageIndexHubPage from './pages/PageIndexHub/PageIndexHubPage';
import GraphRAGHubPage from './pages/GraphRAGHub/GraphRAGHubPage';

type PageType = 'home' | 'kb-list' | 'kb-detail' | 'chat' | 'search-list' | 'search' | 'agent-list' | 'agent-detail' | 'evaluation' | 'system' | 'wiki-hub' | 'pageindex-hub' | 'graphrag-hub';

interface PageState {
  type: PageType;
  kbId?: string;
  searchId?: string;
  agentId?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageState>({ type: 'home' });

  const handleNavigation = (page: string, id?: string) => {
    switch (page) {
      case 'kb-detail':
        setCurrentPage({ type: 'kb-detail', kbId: id || '' });
        break;
      case 'search':
        setCurrentPage({ type: 'search', searchId: id || '' });
        break;
      case 'agent-detail':
        setCurrentPage({ type: 'agent-detail', agentId: id || '' });
        break;
      default:
        setCurrentPage({ type: page as PageType });
    }
  };

  const renderPage = () => {
    switch (currentPage.type) {
      case 'home':
        return <HomePage onNavigate={handleNavigation} />;
      case 'kb-list':
        return <KBListPage onNavigate={handleNavigation} />;
      case 'kb-detail':
        return <KBDetailPage kbId={currentPage.kbId || ''} onNavigate={handleNavigation} />;
      case 'chat':
        return <ChatPage />;
      case 'search-list':
        return <SearchListPage onNavigate={handleNavigation} />;
      case 'search':
        return <SearchPage searchId={currentPage.searchId || ''} onNavigate={handleNavigation} />;
      case 'agent-list':
        return <AgentListPage onNavigate={handleNavigation} />;
      case 'agent-detail':
        return <AgentDetailPage agentId={currentPage.agentId || ''} onNavigate={handleNavigation} />;
      case 'evaluation':
        return <EvaluationPage />;
      case 'system':
        return <SystemPage onNavigate={handleNavigation} />;
      case 'wiki-hub':
        return <WikiHubPage onNavigate={handleNavigation} />;
      case 'pageindex-hub':
        return <PageIndexHubPage onNavigate={handleNavigation} />;
      case 'graphrag-hub':
        return <GraphRAGHubPage onNavigate={handleNavigation} />;
      default:
        return <HomePage onNavigate={handleNavigation} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage.type} onNavigate={handleNavigation}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
