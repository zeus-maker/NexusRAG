'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  FileText,
  Boxes,
  HardDrive,
  Star,
  ArrowLeft,
  FolderOpen,
  Layers,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { knowledgeBases, documents } from '@/lib/mock-data'
import { DocStatusBadge } from '@/components/status-badges'

const tabs = [
  { key: 'overview', label: '概览' },
  { key: 'documents', label: '文档' },
  { key: 'index', label: '索引状态' },
  { key: 'permission', label: '权限' },
  { key: 'settings', label: '设置' },
]

const trend = [42, 55, 38, 61, 70, 52, 66, 80, 58, 74, 88, 69, 92, 78]
const docTypes = [
  { type: 'PDF', count: 85, pct: 100 },
  { type: 'DOCX', count: 42, pct: 49 },
  { type: 'XLSX', count: 18, pct: 21 },
  { type: 'MD', count: 11, pct: 13 },
]
const hotQueries = [
  { q: '供应商违约金条款', n: 143 },
  { q: '知识产权归属模板', n: 98 },
  { q: '保密义务范围', n: 76 },
  { q: '合同解除条件', n: 54 },
]

export default function KBDetailPage({ params }: { params: Promise<{ kbId: string }> }) {
  const { kbId } = use(params)
  const kb = knowledgeBases.find((k) => k.id === kbId)
  const [tab, setTab] = useState('overview')
  if (!kb) notFound()

  const stats = [
    { icon: FileText, label: '文档总数', value: kb.docCount, color: 'text-chart-1' },
    { icon: Boxes, label: 'Chunk 数', value: kb.chunkCount.toLocaleString(), color: 'text-chart-2' },
    { icon: HardDrive, label: '存储大小', value: kb.size, color: 'text-chart-3' },
    { icon: Star, label: '解析质量', value: kb.quality, color: 'text-chart-5' },
  ]

  return (
    <div>
      <PageHeader
        title={kb.name}
        crumbs={[
          { label: '知识库管理', href: '/kb' },
          { label: kb.name },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/kb">
              <ArrowLeft className="size-4" />
              返回
            </Link>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border bg-background px-6">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative px-3 py-3 text-sm transition-colors',
                tab === t.key
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label} className="flex-row items-center gap-3 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                    <s.icon className={cn('size-5', s.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-semibold tabular-nums">{s.value}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Query trend */}
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">近 30 天查询趋势</h3>
                </div>
                <div className="flex h-40 items-end gap-1.5">
                  {trend.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
              </Card>

              {/* Doc type distribution */}
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">文档类型分布</h3>
                </div>
                <div className="space-y-3">
                  {docTypes.map((d) => (
                    <div key={d.type} className="flex items-center gap-3">
                      <span className="w-12 text-xs text-muted-foreground">{d.type}</span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-accent">
                        <div
                          className="h-full rounded bg-chart-1"
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-medium tabular-nums">
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent uploads */}
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FolderOpen className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">最近上传</h3>
                </div>
                <div className="space-y-2">
                  {documents.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{d.name}</span>
                      <DocStatusBadge status={d.status} />
                      <span className="text-[11px] text-muted-foreground">{d.updatedAt}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Hot queries */}
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">高频查询</h3>
                </div>
                <div className="space-y-2.5">
                  {hotQueries.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="flex size-5 items-center justify-center rounded bg-accent text-[11px] font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate">{h.q}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{h.n} 次</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">查看完整文档管理界面</p>
            <Button className="mt-4" asChild>
              <Link href={`/kb/${kb.id}/documents`}>进入文档管理</Link>
            </Button>
          </Card>
        )}

        {tab === 'index' && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">查看五路索引构建状态</p>
            <Button className="mt-4" asChild>
              <Link href={`/kb/${kb.id}/index-status`}>进入索引状态</Link>
            </Button>
          </Card>
        )}

        {(tab === 'permission' || tab === 'settings') && (
          <Card className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'permission' ? '权限与 ACL 配置' : '知识库设置'}（原型占位）
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
