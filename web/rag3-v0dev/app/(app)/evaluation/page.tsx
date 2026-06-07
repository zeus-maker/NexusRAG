'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Play,
  CheckCircle2,
  Loader2,
  XCircle,
  FileBarChart,
  Plus,
  Target,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadarChart } from '@/components/eval/radar-chart'
import { evalMetrics, evalRuns, ragasRadar } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const statusMap = {
  completed: { label: '已完成', cls: 'bg-success/15 text-success', icon: CheckCircle2 },
  running: { label: '运行中', cls: 'bg-primary/15 text-primary', icon: Loader2 },
  failed: { label: '失败', cls: 'bg-destructive/15 text-destructive', icon: XCircle },
}

const lineData = [78, 82, 80, 85, 84, 88, 87, 90, 89, 91, 90, 92]

export default function EvaluationPage() {
  const [tab, setTab] = useState<'overview' | 'runs'>('overview')

  return (
    <div>
      <PageHeader
        title="评测中心"
        crumbs={[{ label: '评测中心' }]}
        actions={
          <Button>
            <Plus className="size-4" />
            新建评测任务
          </Button>
        }
      />

      <div className="border-b border-border bg-background px-6">
        <div className="flex gap-1">
          {[
            { key: 'overview' as const, label: '评测概览' },
            { key: 'runs' as const, label: '评测记录' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative px-3 py-3 text-sm transition-colors',
                tab === t.key ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
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

      <div className="space-y-6 p-6">
        {tab === 'overview' ? (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {evalMetrics.map((m) => {
                const up = m.delta >= 0
                return (
                  <Card key={m.key} className="p-4">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {(m.value * 100).toFixed(1)}
                      <span className="ml-0.5 text-sm font-normal text-muted-foreground">%</span>
                    </p>
                    <div
                      className={cn(
                        'mt-1.5 flex items-center gap-1 text-xs',
                        up ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      {up ? '+' : ''}
                      {m.delta}% 较上周
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* RAGAS radar */}
              <Card className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">RAGAS 多维评分</h3>
                </div>
                <RadarChart data={ragasRadar} />
              </Card>

              {/* Score trend */}
              <Card className="p-5 lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">综合评分趋势（近 12 次）</h3>
                </div>
                <div className="flex h-48 items-end gap-2">
                  {lineData.map((v, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-colors hover:bg-primary"
                        style={{ height: `${v}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">任务名称</th>
                  <th className="px-2 py-2.5 font-medium">知识库</th>
                  <th className="px-2 py-2.5 font-medium">数据集</th>
                  <th className="px-2 py-2.5 font-medium">用例数</th>
                  <th className="px-2 py-2.5 font-medium">综合评分</th>
                  <th className="px-2 py-2.5 font-medium">状态</th>
                  <th className="px-2 py-2.5 font-medium">时间</th>
                  <th className="w-20 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {evalRuns.map((r) => {
                  const s = statusMap[r.status]
                  return (
                    <tr key={r.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileBarChart className="size-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">{r.kb}</td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">{r.dataset}</td>
                      <td className="px-2 py-3 text-xs tabular-nums">{r.cases}</td>
                      <td className="px-2 py-3">
                        {r.score != null ? (
                          <span className="text-sm font-medium tabular-nums text-success">
                            {(r.score * 100).toFixed(0)} 分
                          </span>
                        ) : r.status === 'running' ? (
                          <span className="text-xs text-muted-foreground">{r.progress}%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
                            s.cls,
                          )}
                        >
                          <s.icon className={cn('size-3', r.status === 'running' && 'animate-spin')} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-[11px] text-muted-foreground">{r.date}</td>
                      <td className="px-2 py-3">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                          {r.status === 'completed' ? '查看报告' : <><Play className="size-3" />运行</>}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}
