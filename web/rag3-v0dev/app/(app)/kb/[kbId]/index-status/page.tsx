'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { knowledgeBases, indexChannels } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const channelStatus = {
  completed: { icon: CheckCircle2, cls: 'text-success', label: '已完成' },
  running: { icon: Loader2, cls: 'text-primary', label: '构建中' },
}

const summary = [
  { label: '已索引 Chunk', value: '12,840' },
  { label: '向量维度', value: '1024' },
  { label: '图谱实体', value: '3,256' },
  { label: '索引耗时', value: '8m 42s' },
]

export default function IndexStatusPage({ params }: { params: Promise<{ kbId: string }> }) {
  const { kbId } = use(params)
  const kb = knowledgeBases.find((k) => k.id === kbId)
  const overall = Math.round(
    indexChannels.reduce((a, c) => a + c.progress, 0) / indexChannels.length,
  )

  return (
    <div>
      <PageHeader
        title="索引状态"
        crumbs={[
          { label: '知识库管理', href: '/kb' },
          { label: kb?.name ?? '知识库', href: `/kb/${kbId}` },
          { label: '索引状态' },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/kb/${kbId}`}>
                <ArrowLeft className="size-4" />
                返回
              </Link>
            </Button>
            <Button>
              <RefreshCw className="size-4" />
              重建索引
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {/* Overall progress */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">五路索引总体进度</h3>
            <span className="text-sm font-semibold tabular-nums text-primary">{overall}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overall}%` }}
            />
          </div>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Channels */}
        <Card className="gap-0 overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">索引通道明细</h3>
          </div>
          <div className="divide-y divide-border">
            {indexChannels.map((c) => {
              const st = channelStatus[c.status]
              return (
                <div key={c.name} className="flex items-center gap-4 px-4 py-3.5">
                  <st.icon
                    className={cn(
                      'size-4 shrink-0',
                      st.cls,
                      c.status === 'running' && 'animate-spin',
                    )}
                  />
                  <div className="w-44 shrink-0">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        c.status === 'completed' ? 'bg-success' : 'bg-primary',
                      )}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs">
                    <span className={cn('font-medium', st.cls)}>{st.label}</span>
                    <span className="ml-1.5 tabular-nums text-muted-foreground">{c.progress}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
