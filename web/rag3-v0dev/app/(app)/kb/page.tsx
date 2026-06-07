'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, FileText, Boxes, HardDrive } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KBStatusBadge } from '@/components/status-badges'
import { knowledgeBases } from '@/lib/mock-data'
import { CreateKBDialog } from './create-kb-dialog'

export default function KBListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = knowledgeBases.filter((kb) => {
    const matchSearch = kb.name.includes(search) || kb.description.includes(search)
    const matchStatus = status === 'all' || kb.status === status
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        title="知识库管理"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            创建知识库
          </Button>
        }
      />

      <div className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索知识库..."
              className="h-9 pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="indexing">索引中</SelectItem>
              <SelectItem value="error">异常</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="updated">
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">最近更新</SelectItem>
              <SelectItem value="name">名称排序</SelectItem>
              <SelectItem value="docs">文档数量</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            共 {filtered.length} 个知识库
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((kb) => (
            <Card
              key={kb.id}
              className="group relative gap-0 p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-xl">
                  {kb.icon}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/kb/${kb.id}`}>查看详情</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>编辑配置</DropdownMenuItem>
                    <DropdownMenuItem>重建索引</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/kb/${kb.id}`} className="mt-3 block">
                <h3 className="text-pretty font-semibold leading-snug">{kb.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {kb.description}
                </p>
              </Link>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="size-3" /> 文档
                  </span>
                  <span className="font-medium tabular-nums">{kb.docCount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Boxes className="size-3" /> 块
                  </span>
                  <span className="font-medium tabular-nums">
                    {(kb.chunkCount / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="size-3" /> 大小
                  </span>
                  <span className="font-medium">{kb.size}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <KBStatusBadge status={kb.status} />
                <span className="text-[11px] text-muted-foreground">更新 {kb.updatedAt}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <CreateKBDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
