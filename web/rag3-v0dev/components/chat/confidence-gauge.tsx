'use client'

import { cn } from '@/lib/utils'

const levelMap = {
  high: { label: '高', color: 'text-success', track: 'text-success', dot: 'bg-success' },
  medium: { label: '中', color: 'text-warning', track: 'text-warning', dot: 'bg-warning' },
  low: { label: '低', color: 'text-destructive', track: 'text-destructive', dot: 'bg-destructive' },
}

const factors = [
  { key: 'retrieval', label: '检索质量', value: 0.95 },
  { key: 'consistency', label: '生成一致性', value: 0.93 },
  { key: 'authority', label: '来源权威性', value: 0.9 },
  { key: 'rerank', label: '精排评分', value: 0.91 },
]

export function ConfidenceGauge({
  confidence,
}: {
  confidence: { score: number; level: 'high' | 'medium' | 'low' }
}) {
  const lv = levelMap[confidence.level]
  const pct = Math.round(confidence.score * 100)
  // semicircle gauge
  const r = 28
  const circumference = Math.PI * r
  const offset = circumference * (1 - confidence.score)

  return (
    <div className="group relative inline-flex items-center gap-2">
      <div className="relative flex items-center">
        <svg width="64" height="38" viewBox="0 0 64 38" className="overflow-visible">
          <path
            d="M 4 34 A 28 28 0 0 1 60 34"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-accent"
          />
          <path
            d="M 4 34 A 28 28 0 0 1 60 34"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(lv.track, 'transition-all')}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className={cn('text-sm font-semibold tabular-nums', lv.color)}>
            {confidence.score.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', lv.dot)} />
        <span className="text-xs text-muted-foreground">置信度 {lv.label}</span>
      </div>

      {/* Hover detail */}
      <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-48 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100">
        <p className="mb-2 text-xs font-medium">置信度因子</p>
        <div className="space-y-1.5">
          {factors.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-muted-foreground">{f.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${f.value * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-[11px] tabular-nums">{f.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
