'use client'

import { useState } from 'react'
import { Search, UserPlus, MoreVertical, Mail } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sysUsers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const roleCls: Record<string, string> = {
  管理员: 'bg-primary/15 text-primary',
  编辑者: 'bg-chart-2/15 text-chart-2',
  只读: 'bg-muted text-muted-foreground',
}

export default function UsersPage() {
  const [q, setQ] = useState('')
  const filtered = sysUsers.filter(
    (u) => u.name.includes(q) || u.email.includes(q) || u.dept.includes(q),
  )

  return (
    <div>
      <PageHeader
        title="用户管理"
        crumbs={[{ label: '系统管理' }, { label: '用户管理' }]}
        actions={
          <Button>
            <UserPlus className="size-4" />
            新增用户
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索姓名 / 邮箱 / 部门..."
              className="h-9 pl-8"
            />
          </div>
          <span className="ml-auto text-sm text-muted-foreground">
            共 {filtered.length} 位用户
          </span>
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">用户</th>
                <th className="px-2 py-2.5 font-medium">部门</th>
                <th className="px-2 py-2.5 font-medium">角色</th>
                <th className="px-2 py-2.5 font-medium">状态</th>
                <th className="px-2 py-2.5 font-medium">最近登录</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="size-3" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{u.dept}</td>
                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
                        roleCls[u.role] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          u.status === 'active' ? 'bg-success' : 'bg-muted-foreground',
                        )}
                      />
                      {u.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-[11px] text-muted-foreground">{u.lastLogin}</td>
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>编辑用户</DropdownMenuItem>
                        <DropdownMenuItem>重置密码</DropdownMenuItem>
                        <DropdownMenuItem>
                          {u.status === 'active' ? '禁用账户' : '启用账户'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">删除用户</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
