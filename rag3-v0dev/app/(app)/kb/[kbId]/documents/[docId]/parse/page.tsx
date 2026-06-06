'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  Table2,
  Heading1,
  AlignLeft,
  Layers,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { knowledgeBases, documents } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const parsedBlocks = [
  { type: 'heading', text: '供应商采购合同模板（V5）', page: 1 },
  { type: 'heading2', text: '第一条 定义', page: 1 },
  {
    type: 'text',
    text: '1.1 "供应商"系指根据本合同约定向采购方提供货物及相关服务的法人或其他组织。1.2 "采购方"系指本合同中接受货物及服务的一方。',
    page: 1,
  },
  { type: 'heading2', text: '第五条 违约责任', page: 3 },
  {
    type: 'text',
    text: '5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。5.3 迟延交货超过三十日的，采购方有权单方解除合同。',
    page: 3,
  },
  {
    type: 'table',
    text: '违约金计算表',
    page: 3,
    table: {
      headers: ['违约类型', '计算标准', '上限'],
      rows: [
        ['延迟交货', '日 0.5%', '20%'],
        ['质量不合规', '货款 10%', '30%'],
        ['擅自转包', '合同总额 15%', '50%'],
      ],
    },
  },
]

const blockIcon = {
  heading: Heading1,
  heading2: Heading1,
  text: AlignLeft,
  table: Table2,
}

const parseStats = [
  { label: '总页数', value: '12' },
  { label: '识别块数', value: '48' },
  { label: '表格数', value: '6' },
  { label: '解析质量', value: '96 分' },
]

export default function ParsePreviewPage({
  params,
}: {
  params: Promise<{ kbId: string; docId: string }>
}) {
  const { kbId, docId } = use(params)
  const kb = knowledgeBases.find((k) => k.id === kbId)
  const doc = documents.find((d) => d.id === docId) ?? documents[0]
  const [page, setPage] = useState(1)

  return (
    <div>
      <PageHeader
        title="解析预览"
        crumbs={[
          { label: '知识库管理', href: '/kb' },
          { label: kb?.name ?? '知识库', href: `/kb/${kbId}` },
          { label: '文档管理', href: `/kb/${kbId}/documents` },
          { label: doc.name },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/kb/${kbId}/documents`}>
                <ArrowLeft className="size-4" />
                返回
              </Link>
            </Button>
            <Button variant="outline">
              <RotateCcw className="size-4" />
              重新解析
            </Button>
            <Button asChild>
              <Link href={`/kb/${kbId}/documents/${docId}/chunks`}>
                <Layers className="size-4" />
                分块预览
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {parseStats.map((s) => (
            <Card key={s.label} className="p-3.5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Split view */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Original */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <FileText className="size-4 text-muted-foreground" />
                原文档
              </h3>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'flex size-6 items-center justify-center rounded text-xs transition-colors',
                      page === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex h-[28rem] items-center justify-center bg-muted/40 p-6">
              <div className="flex aspect-[3/4] w-full max-w-xs flex-col gap-2.5 rounded-md border border-border bg-background p-6 shadow-sm">
                <div className="h-3 w-2/3 rounded bg-foreground/80" />
                <div className="mt-2 h-2 w-1/3 rounded bg-foreground/40" />
                <div className="mt-1 space-y-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded bg-muted-foreground/20"
                      style={{ width: `${70 + ((i * 13) % 30)}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 h-16 rounded border border-dashed border-border bg-muted/40" />
                <p className="mt-auto text-center text-[11px] text-muted-foreground">
                  第 {page} 页 · {doc.name}
                </p>
              </div>
            </div>
          </Card>

          {/* Parsed structured content */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="border-b border-border px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <AlignLeft className="size-4 text-muted-foreground" />
                结构化解析结果
              </h3>
            </div>
            <div className="h-[28rem] space-y-3 overflow-y-auto p-4">
              {parsedBlocks.map((b, i) => {
                const Icon = blockIcon[b.type as keyof typeof blockIcon]
                return (
                  <div
                    key={i}
                    className="group rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-accent/40"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon className="size-3" />
                      {b.type === 'table' ? '表格块' : b.type.startsWith('heading') ? '标题块' : '文本块'}
                      <span>· 第 {b.page} 页</span>
                    </div>
                    {b.type === 'heading' && (
                      <p className="text-base font-semibold">{b.text}</p>
                    )}
                    {b.type === 'heading2' && (
                      <p className="text-sm font-semibold text-primary">{b.text}</p>
                    )}
                    {b.type === 'text' && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{b.text}</p>
                    )}
                    {b.type === 'table' && b.table && (
                      <div className="overflow-hidden rounded-md border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/60">
                              {b.table.headers.map((h) => (
                                <th key={h} className="px-2.5 py-1.5 text-left font-medium">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {b.table.rows.map((r, ri) => (
                              <tr key={ri}>
                                {r.map((c, ci) => (
                                  <td key={ci} className="px-2.5 py-1.5 text-muted-foreground">
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
