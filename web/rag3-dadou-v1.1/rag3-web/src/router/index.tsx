import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoginPage } from '@/pages/Login/LoginPage';

// 路由懒加载
const KBListPage = lazy(() => import('@/pages/KnowledgeBase/ListPage'));
const ChatPage = lazy(() => import('@/pages/Chat/ChatPage'));
const EvalDashboard = lazy(() => import('@/pages/Evaluation/DashboardPage'));
const UserManagePage = lazy(() => import('@/pages/System/UserManagePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/kb" replace /> },
      {
        path: 'kb',
        children: [
          { index: true, element: <KBListPage /> },
        ],
      },
      {
        path: 'chat',
        children: [
          { index: true, element: <ChatPage /> },
        ],
      },
      {
        path: 'evaluation',
        children: [
          { index: true, element: <EvalDashboard /> },
        ],
      },
      {
        path: 'system',
        children: [
          { path: 'users', element: <UserManagePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);