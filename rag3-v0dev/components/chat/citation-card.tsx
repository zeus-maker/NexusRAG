'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Copy, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Citation } from '@/lib/types'

function relevanceColor(score: number) {
  if (score >= 90) return 'bg-success'
  if (score >= 70) return 'bg-warning'
  return 'bg-destructive'
}

export function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-medium text-primary">
          {citation.index}
        </span>
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium">{citation.docName}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{citation.page}</span>
        <span className="ml-auto shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
          {citation.relevance}%
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="text-xs leading-relaxed text-muted-foreground">{citation.snippet}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">相关度</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-accent">
              <div
                className={cn('h-full rounded-full', relevanceColor(citation.relevance))}
                style={{ width: `${citation.relevance}%` }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums">{citation.relevance}%</span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                <ExternalLink className="size-3" />
                查看原文
              </Button>
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                <Copy className="size-3" />
                复制
              </Button>
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px] text-muted-foreground">
                <Flag className="size-3" />
                不相关
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
