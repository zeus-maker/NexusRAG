'use client'

import { Activity, Server, Cpu, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { monitorMetrics, services } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const iconMap = { qps: Activity, latency: Gauge, gpu: Cpu, uptime: Server }

const healthMap = {
  healthy: { label: '正常', cls: 'bg-success', text: 'text-success' },
  degraded: { label: '降级', cls: 'bg-warning', text: 'text-warning' },
  down: { label: '中断', cls: 'bg-destructive', text: 'text-destructive' },
}

const qpsTrend = [55, 62, 48, 70, 82, 76, 90, 68, 84, 95, 88, 102, 94, 110, 124]
const latencyTrend = [1.2, 1.4, 1.1, 1.6, 1.8, 1.5, 1.9, 1.7, 1.6, 2.0, 1.8, 1.7]

export default function MonitorPage() {
  return (
    <div>
      <PageHeader title="系统监控" crumbs={[{ label: '系统管理' }, { label: '系统监控' }]} />

      <div className="space-y-6 p-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {monitorMetrics.map((m) => {
            const Icon = iconMap[m.key as keyof typeof iconMap]
            return (
              <Card key={m.key} className="flex-row items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className={cn('size-5', m.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-semibold tabular-nums">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground">{m.sub}</p>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* QPS trend */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-medium">QPS 实时趋势</h3>
            <div className="flex h-40 items-end gap-1.5">
              {qpsTrend.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-chart-1/70 transition-colors hover:bg-chart-1"
                  style={{ height: `${(v / 124) * 100}%` }}
                />
              ))}
            </div>
          </Card>

          {/* Latency trend */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-medium">P95 延迟趋势 (秒)</h3>
            <div className="flex h-40 items-end gap-2">
              {latencyTrend.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-chart-2/70 transition-colors hover:bg-chart-2"
                  style={{ height: `${(v / 2) * 100}%` }}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Service health */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-medium">服务健康状态</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const h = healthMap[s.status]
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('size-2 rounded-full', h.cls, s.status !== 'healthy' && 'animate-pulse')} />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs font-medium', h.text)}>{h.label}</p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">{s.latency}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
