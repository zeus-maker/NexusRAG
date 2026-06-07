import { Layout, Input, Space, Dropdown, Avatar, Button, Breadcrumb, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

const { Header } = Layout;

const breadcrumbNameMap: Record<string, string> = {
  kb: '知识库管理',
  chat: '智能对话',
  evaluation: '评测中心',
  system: '系统管理',
  users: '用户管理',
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const title = breadcrumbNameMap[segment] ?? segment;
    return {
      title: isLast ? title : <Link to={path}>{title}</Link>,
    };
  });
}

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { sidebarCollapsed, toggleSidebar, theme: currentTheme, setTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'theme',
      icon: <BulbOutlined />,
      label: currentTheme === 'light' ? '切换暗色主题' : '切换亮色主题',
      onClick: () => setTheme(currentTheme === 'light' ? 'dark' : 'light'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        lineHeight: '64px',
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
        />
        <span style={{ fontSize: 16, fontWeight: 600 }}>RAG 3.0</span>
        <Breadcrumb items={buildBreadcrumbs(location.pathname)} />
      </Space>

      <Space size="middle">
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索知识库、文档..."
          style={{ width: 240 }}
          allowClear
        />
        <Button type="text" icon={<BellOutlined />} />
        <Button type="text" icon={<QuestionCircleOutlined />} />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{user?.full_name ?? user?.username ?? '用户'}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
