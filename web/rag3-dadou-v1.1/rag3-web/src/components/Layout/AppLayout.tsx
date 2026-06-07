import { Suspense } from 'react';
import { Layout, Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';

const { Sider, Content, Footer } = Layout;

export function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const { sidebarCollapsed } = useUIStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopBar />
      <Layout>
        <Sider
          width={220}
          collapsedWidth={64}
          collapsed={sidebarCollapsed}
          trigger={null}
          style={{ background: '#fff' }}
        >
          <Sidebar />
        </Sider>
        <Layout>
          <Content style={{ padding: 24, overflow: 'auto' }}>
            <Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                  <Spin size="large" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </Content>
          <StatusBar />
          <Footer style={{ textAlign: 'center', padding: '12px 0' }}>
            © 2026 RAG 3.0 Knowledge Base System
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
