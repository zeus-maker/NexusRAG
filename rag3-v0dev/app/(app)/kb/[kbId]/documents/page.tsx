'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  Upload,
  Link2,
  Search,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowUpCircle,
  MoreVertical,
  CloudUpload,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { DocStatusBadge, ConfidentialityBadge, QualityScore } from '@/components/status-badges'
import { knowledgeBases, documents, uploadQueue } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const queueIcon = {
  done: <CheckCircle2 className="size-4 text-success" />,
  parsing: <Loader2 className="size-4 animate-spin text-primary" />,
  uploading: <ArrowUpCircle className="size-4 text-warning" />,
}

export default function DocumentPage({ params }: { params: Promise<{ kbId: string }> }) {
  const { kbId } = use(params)
  const kb = knowledgeBases.find((k) => k.id === kbId)
  const [selected, setSelected] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allSelected = selected.length === documents.length

  return (
    <div>
      <PageHeader
        title="文档管理"
        crumbs={[
          { label: '知识库管理', href: '/kb' },
          { label: kb?.name ?? '知识库', href: `/kb/${kbId}` },
          { label: '文档管理' },
        ]}
        actions={
          <>
            <Button variant="outline">
              <Link2 className="size-4" />
              URL 导入
            </Button>
            <Button>
              <Upload className="size-4" />
              上传文档
            </Button>
          </>
        }
      />

      <div className="space-y-5 p-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card py-10 text-center transition-colors',
            dragging && 'border-primary bg-primary/5',
          )}
        >
          <CloudUpload className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">拖拽文件至此处，或点击选择文件</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            支持 PDF / DOCX / PPTX / XLSX / CSV / TXT / MD / HTML 等 16+ 格式
          </p>
          <p className="text-xs text-muted-foreground">单文件上限 100MB，批量上传最多 100 个</p>
        </div>

        {/* Upload queue */}
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h3 className="text-sm font-medium">上传队列 (3/5)</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              清空已完成
            </Button>
          </div>
          <div className="divide-y divide-border">
            {uploadQueue.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="w-44 truncate text-sm">{u.name}</span>
                <span className="w-16 text-xs text-muted-foreground">{u.size}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      u.status === 'done' ? 'bg-success' : 'bg-primary',
                    )}
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                <span className="flex w-20 items-center gap-1.5 text-xs">
                  {queueIcon[u.status]}
                  {u.status === 'done' ? '完成' : u.status === 'parsing' ? '解析中' : '上传中'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索文档..." className="h-9 pl-8" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">DOCX</SelectItem>
              <SelectItem value="xlsx">XLSX</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="parsed">已解析</SelectItem>
              <SelectItem value="parsing">解析中</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
            </SelectContent>
          </Select>
          {selected.length > 0 && (
            <Button variant="outline" size="sm" className="ml-auto h-9">
              批量操作 ({selected.length})
            </Button>
          )}
        </div>

        {/* Document table */}
        <Card className="gap-0 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() =>
                      setSelected(allSelected ? [] : documents.map((d) => d.id))
                    }
                  />
                </th>
                <th className="px-2 py-2.5 font-medium">文件名</th>
                <th className="px-2 py-2.5 font-medium">大小</th>
                <th className="px-2 py-2.5 font-medium">类型</th>
                <th className="px-2 py-2.5 font-medium">状态</th>
                <th className="px-2 py-2.5 font-medium">密级</th>
                <th className="px-2 py-2.5 font-medium">质量</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2.5">
                    <Checkbox checked={selected.includes(d.id)} onCheckedChange={() => toggle(d.id)} />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/kb/${kbId}/documents/${d.id}/parse`}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{d.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-muted-foreground">{d.size}</td>
                  <td className="px-2 py-2.5 text-xs text-muted-foreground">{d.type}</td>
                  <td className="px-2 py-2.5">
                    <DocStatusBadge status={d.status} />
                  </td>
                  <td className="px-2 py-2.5">
                    <ConfidentialityBadge level={d.confidentiality} />
                  </td>
                  <td className="px-2 py-2.5">
                    <QualityScore score={d.quality} />
                  </td>
                  <td className="px-2 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/kb/${kbId}/documents/${d.id}/parse`}>解析预览</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/kb/${kbId}/documents/${d.id}/chunks`}>分块预览</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>重新解析</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
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
