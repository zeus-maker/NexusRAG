'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Split,
  Merge,
  Ban,
  Pencil,
  FileText,
  Table2,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfidentialityBadge } from '@/components/status-badges'
import { knowledgeBases, documents, chunks } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const chunkStats = [
  { label: '总分块数', value: '48' },
  { label: '平均 Token', value: '486' },
  { label: '表格块', value: '6' },
  { label: '分块策略', value: '模板分块' },
]

export default function ChunksPage({
  params,
}: {
  params: Promise<{ kbId: string; docId: string }>
}) {
  const { kbId, docId } = use(params)
  const kb = knowledgeBases.find((k) => k.id === kbId)
  const doc = documents.find((d) => d.id === docId) ?? documents[0]
  const [active, setActive] = useState(chunks[0].id)

  return (
    <div>
      <PageHeader
        title="分块预览"
        crumbs={[
          { label: '知识库管理', href: '/kb' },
          { label: kb?.name ?? '知识库', href: `/kb/${kbId}` },
          { label: '文档管理', href: `/kb/${kbId}/documents` },
          { label: doc.name },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/kb/${kbId}/documents/${docId}/parse`}>
                <ArrowLeft className="size-4" />
                解析预览
              </Link>
            </Button>
            <Button variant="outline">
              <RotateCcw className="size-4" />
              重新分块
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {chunkStats.map((s) => (
              <Card key={s.label} className="gap-0 p-3">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums">{s.value}</p>
              </Card>
            ))}
          </div>
          <Select defaultValue="template">
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template">模板分块</SelectItem>
              <SelectItem value="semantic">语义分块</SelectItem>
              <SelectItem value="general">通用分块</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chunk list */}
        <div className="space-y-3">
          {chunks.map((c) => (
            <Card
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                'cursor-pointer gap-2.5 p-4 transition-colors',
                active === c.id ? 'border-primary ring-1 ring-primary/30' : 'hover:border-border/80',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 min-w-7 items-center justify-center rounded bg-accent px-1.5 text-[11px] font-medium text-muted-foreground">
                  #{c.index}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {c.type === 'table' ? (
                    <Table2 className="size-3.5 text-chart-2" />
                  ) : (
                    <FileText className="size-3.5 text-muted-foreground" />
                  )}
                  {c.title}
                </span>
                <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded bg-accent px-1.5 py-0.5">{c.strategy}</span>
                  <span className="tabular-nums">{c.tokens} Token</span>
                </div>
              </div>

              {c.type === 'table' && c.tableData ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60">
                        {c.tableData.headers.map((h) => (
                          <th key={h} className="px-2.5 py-1.5 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.tableData.rows.map((r, ri) => (
                        <tr key={ri}>
                          {r.map((cell, ci) => (
                            <td key={ci} className="px-2.5 py-1.5 text-muted-foreground">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">{c.content}</p>
              )}

              <div className="flex items-center gap-3 border-t border-border pt-2.5">
                <span className="text-[11px] text-muted-foreground">页码 {c.page}</span>
                <ConfidentialityBadge level={c.confidentiality} />
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                    <Split className="size-3" />
                    拆分
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                    <Merge className="size-3" />
                    合并
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                    <Pencil className="size-3" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
                  >
                    <Ban className="size-3" />
                    排除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
