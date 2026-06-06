'use client'

import { useState } from 'react'
import { Search, Download, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { auditLogs } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function AuditPage() {
  const [q, setQ] = useState('')
  const filtered = auditLogs.filter(
    (l) => l.user.includes(q) || l.action.includes(q) || l.target.includes(q),
  )

  return (
    <div>
      <PageHeader
        title="审计日志"
        crumbs={[{ label: '系统管理' }, { label: '审计日志' }]}
        actions={
          <Button variant="outline">
            <Download className="size-4" />
            导出日志
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索用户 / 操作 / 对象..."
              className="h-9 pl-8"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              <SelectItem value="login">登录</SelectItem>
              <SelectItem value="upload">上传</SelectItem>
              <SelectItem value="delete">删除</SelectItem>
              <SelectItem value="perm">权限</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="7d">
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">近 24 小时</SelectItem>
              <SelectItem value="7d">近 7 天</SelectItem>
              <SelectItem value="30d">近 30 天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">时间</th>
                <th className="px-2 py-2.5 font-medium">操作人</th>
                <th className="px-2 py-2.5 font-medium">操作类型</th>
                <th className="px-2 py-2.5 font-medium">操作对象</th>
                <th className="px-2 py-2.5 font-medium">IP 地址</th>
                <th className="px-2 py-2.5 font-medium">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{l.time}</td>
                  <td className="px-2 py-2.5">{l.user}</td>
                  <td className="px-2 py-2.5">
                    <span className="inline-flex items-center rounded bg-accent px-1.5 py-0.5 text-[11px]">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-muted-foreground">{l.target}</td>
                  <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground">{l.ip}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        l.result === 'success' ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {l.result === 'success' ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <XCircle className="size-3.5" />
                      )}
                      {l.result === 'success' ? '成功' : '失败'}
                    </span>
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
