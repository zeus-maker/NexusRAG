import { cn } from '@/lib/utils'

const tierColor: Record<string, string> = {
  Tier1: 'bg-success/15 text-success border-success/30',
  Tier2: 'bg-primary/15 text-primary border-primary/30',
  Tier3: 'bg-warning/15 text-warning border-warning/30',
  Tier4: 'bg-destructive/15 text-destructive border-destructive/30',
}

const tierDesc: Record<string, string> = {
  Tier1: '简单事实',
  Tier2: '中等推理',
  Tier3: '复杂分析',
  Tier4: '深度研究',
}

export function RoutingBadges({ routing }: { routing: { tier: string; channel: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium',
          tierColor[routing.tier] ?? tierColor.Tier2,
        )}
      >
        {routing.tier}
        <span className="opacity-70">· {tierDesc[routing.tier] ?? '推理'}</span>
      </span>
      <span className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
        {routing.channel}
      </span>
      <span className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
        精确答案
      </span>
      <span className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
        内部
      </span>
    </div>
  )
}
