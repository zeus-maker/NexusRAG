'use client'

import {
  CheckCircle2,
  Loader2,
  PauseCircle,
  XCircle,
  ArrowRight,
  Settings2,
  Play,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { pipelineStages, indexChannels } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const stageStatus = {
  completed: { icon: CheckCircle2, cls: 'text-success', ring: 'border-success/40 bg-success/5' },
  running: { icon: Loader2, cls: 'text-primary', ring: 'border-primary/40 bg-primary/5' },
  paused: { icon: PauseCircle, cls: 'text-warning', ring: 'border-warning/40 bg-warning/5' },
  failed: { icon: XCircle, cls: 'text-destructive', ring: 'border-destructive/40 bg-destructive/5' },
}

export default function PipelinePage() {
  return (
    <div>
      <PageHeader
        title="流水线配置"
        crumbs={[{ label: '系统管理' }, { label: '流水线配置' }]}
        actions={
          <>
            <Button variant="outline">
              <Settings2 className="size-4" />
              编辑流水线
            </Button>
            <Button>
              <Play className="size-4" />
              触发执行
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {/* Pipeline stages */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-medium">数据处理流水线</h3>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {pipelineStages.map((s, i) => {
              const st = stageStatus[s.status]
              return (
                <div key={s.id} className="flex flex-1 items-center gap-3 lg:flex-col lg:gap-2">
                  <div
                    className={cn(
                      'flex w-full flex-col gap-2 rounded-lg border p-3.5',
                      st.ring,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <st.icon
                        className={cn('size-4', st.cls, s.status === 'running' && 'animate-spin')}
                      />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{s.desc}</p>
                    {s.status === 'running' && 'progress' in s && (
                      <div className="mt-0.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                          {s.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                  {i < pipelineStages.length - 1 && (
                    <ArrowRight className="size-4 shrink-0 rotate-90 text-muted-foreground lg:rotate-0" />
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Index channels */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-medium">五路索引构建状态</h3>
          <div className="space-y-3">
            {indexChannels.map((c) => {
              const st = stageStatus[c.status]
              return (
                <div key={c.name} className="flex items-center gap-4">
                  <st.icon
                    className={cn(
                      'size-4 shrink-0',
                      st.cls,
                      c.status === 'running' && 'animate-spin',
                    )}
                  />
                  <div className="w-40 shrink-0">
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
                  <span className="w-12 text-right text-xs font-medium tabular-nums">
                    {c.progress}%
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
