'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Database,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Users,
  ShieldCheck,
  Network,
  FileSearch,
  Activity,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: string
  children?: { key: string; label: string; icon: React.ReactNode; path: string }[]
}

const navConfig: NavItem[] = [
  { key: 'kb', label: '知识库管理', icon: <Database className="size-4" />, path: '/kb' },
  { key: 'chat', label: '智能对话', icon: <MessageSquare className="size-4" />, path: '/chat' },
  {
    key: 'evaluation',
    label: '评测中心',
    icon: <LayoutDashboard className="size-4" />,
    path: '/evaluation',
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <Settings className="size-4" />,
    path: '/system',
    children: [
      { key: 'users', label: '用户管理', icon: <Users className="size-4" />, path: '/system/users' },
      { key: 'roles', label: '角色权限', icon: <ShieldCheck className="size-4" />, path: '/system/roles' },
      { key: 'pipeline', label: '流水线配置', icon: <Network className="size-4" />, path: '/system/pipeline' },
      { key: 'audit', label: '审计日志', icon: <FileSearch className="size-4" />, path: '/system/audit' },
      { key: 'monitor', label: '系统监控', icon: <Activity className="size-4" />, path: '/system/monitor' },
    ],
  },
]

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [openKeys, setOpenKeys] = useState<string[]>(['system'])

  const toggleOpen = (key: string) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Database className="size-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">RAG 3.0</span>
            <span className="text-[11px] text-muted-foreground">企业知识库</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navConfig.map((item) => {
          const active = isActive(item.path)
          if (item.children) {
            const open = openKeys.includes(item.key)
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleOpen(item.key)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'text-sidebar-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn('size-3.5 transition-transform', open && 'rotate-180')}
                      />
                    </>
                  )}
                </button>
                {open && !collapsed && (
                  <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.key}
                        href={c.path}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                          isActive(c.path)
                            ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        {c.icon}
                        <span>{c.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <Link
              key={item.key}
              href={item.path}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-md bg-sidebar-accent p-2.5">
            <p className="text-[11px] text-muted-foreground">存储用量</p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div className="h-full w-[68%] rounded-full bg-primary" />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">2.36 TB / 3.5 TB</p>
          </div>
        </div>
      )}
    </aside>
  )
}
