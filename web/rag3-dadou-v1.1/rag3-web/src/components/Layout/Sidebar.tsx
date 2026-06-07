import type { ReactNode } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DatabaseOutlined,
  MessageOutlined,
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  permission?: string;
  children?: NavItem[];
}

const navConfig: NavItem[] = [
  {
    key: 'kb',
    label: '知识库管理',
    icon: <DatabaseOutlined />,
    path: '/kb',
  },
  {
    key: 'chat',
    label: '智能对话',
    icon: <MessageOutlined />,
    path: '/chat',
  },
  {
    key: 'evaluation',
    label: '评测中心',
    icon: <DashboardOutlined />,
    path: '/evaluation',
    permission: 'eval:read',
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <SettingOutlined />,
    path: '/system',
    permission: 'system:read',
    children: [
      {
        key: 'system-users',
        label: '用户管理',
        icon: <TeamOutlined />,
        path: '/system/users',
      },
    ],
  },
];

function filterNavByPermission(items: NavItem[], permissions: string[]): NavItem[] {
  return items
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavByPermission(item.children, permissions) : undefined,
    }));
}

function toMenuItems(items: NavItem[]): MenuProps['items'] {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? toMenuItems(item.children) : undefined,
  }));
}

function findSelectedKeys(pathname: string, items: NavItem[]): string[] {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.path)) {
          return [child.key];
        }
      }
      if (pathname.startsWith(item.path)) {
        return [item.key];
      }
    } else if (pathname.startsWith(item.path)) {
      return [item.key];
    }
  }
  return [];
}

function findOpenKeys(pathname: string, items: NavItem[]): string[] {
  for (const item of items) {
    if (item.children?.some((child) => pathname.startsWith(child.path))) {
      return [item.key];
    }
  }
  return [];
}

function findPathByKey(key: string, items: NavItem[]): string | undefined {
  for (const item of items) {
    if (item.key === key) return item.path;
    if (item.children) {
      const childPath = findPathByKey(key, item.children);
      if (childPath) return childPath;
    }
  }
  return undefined;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useUIStore();
  const user = useAuthStore((s) => s.user);

  const permissions = user?.permissions ?? [];
  const filteredNav = filterNavByPermission(navConfig, permissions);
  const menuItems = toMenuItems(filteredNav);
  const selectedKeys = findSelectedKeys(location.pathname, filteredNav);
  const openKeys = findOpenKeys(location.pathname, filteredNav);

  const handleMenuClick = ({ key }: { key: string }) => {
    const path = findPathByKey(key, filteredNav);
    if (path) navigate(path);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      defaultOpenKeys={openKeys}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
      inlineCollapsed={sidebarCollapsed}
    />
  );
}
