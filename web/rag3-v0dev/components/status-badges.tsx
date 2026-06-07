import { cn } from '@/lib/utils'
import type { KBStatus, DocStatus, Confidentiality } from '@/lib/types'

const kbStatusMap: Record<KBStatus, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-success' },
  indexing: { label: '索引中', color: 'bg-primary' },
  error: { label: '异常', color: 'bg-destructive' },
  archived: { label: '已归档', color: 'bg-muted-foreground' },
}

export function KBStatusBadge({ status }: { status: KBStatus }) {
  const s = kbStatusMap[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('size-1.5 rounded-full', s.color, status === 'indexing' && 'animate-pulse')} />
      {s.label}
    </span>
  )
}

const docStatusMap: Record<DocStatus, { label: string; cls: string }> = {
  parsed: { label: '已解析', cls: 'bg-success/15 text-success' },
  parsing: { label: '解析中', cls: 'bg-primary/15 text-primary' },
  failed: { label: '失败', cls: 'bg-destructive/15 text-destructive' },
  uploading: { label: '上传中', cls: 'bg-warning/15 text-warning' },
  queued: { label: '排队中', cls: 'bg-muted text-muted-foreground' },
}

export function DocStatusBadge({ status }: { status: DocStatus }) {
  const s = docStatusMap[status]
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', s.cls)}>
      {s.label}
    </span>
  )
}

const confMap: Record<Confidentiality, { label: string; cls: string }> = {
  public: { label: '公开', cls: 'bg-muted text-muted-foreground' },
  internal: { label: '内部', cls: 'bg-primary/15 text-primary' },
  confidential: { label: '机密', cls: 'bg-warning/15 text-warning' },
  restricted: { label: '受限', cls: 'bg-destructive/15 text-destructive' },
}

export function ConfidentialityBadge({ level }: { level: Confidentiality }) {
  const s = confMap[level]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', s.cls)}>
      {s.label}
    </span>
  )
}

export function QualityScore({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">--</span>
  const color =
    score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive'
  return <span className={cn('text-xs font-medium tabular-nums', color)}>{score} 分</span>
}
