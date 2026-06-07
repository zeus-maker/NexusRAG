'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Pin,
  MessageSquare,
  Send,
  Paperclip,
  Database,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CitationCard } from '@/components/chat/citation-card'
import { ConfidenceGauge } from '@/components/chat/confidence-gauge'
import { RoutingBadges } from '@/components/chat/routing-badges'
import { conversations, sampleMessages, knowledgeBases } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const groups = ['今天', '昨天', '更早'] as const

export default function ChatPage() {
  const [activeConv, setActiveConv] = useState('conv-1')
  const [input, setInput] = useState('')

  return (
    <div className="flex h-[calc(100vh-3.5rem-1.75rem)]">
      {/* Conversation list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="p-3">
          <Button className="w-full justify-start gap-2">
            <Plus className="size-4" />
            新建对话
          </Button>
        </div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索对话..." className="h-8 pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {groups.map((g) => {
            const items = conversations.filter((c) => c.group === g)
            if (!items.length) return null
            return (
              <div key={g} className="mb-2">
                <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{g}</p>
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                      activeConv === c.id
                        ? 'bg-accent font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    )}
                  >
                    <MessageSquare className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate">{c.title}</span>
                    {c.pinned && <Pin className="size-3 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-medium">合同违约条款查询</span>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="kb-legal">
              <SelectTrigger className="h-8 w-44 text-xs">
                <Database className="size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {knowledgeBases.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {sampleMessages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    {m.routing && <RoutingBadges routing={m.routing} />}

                    <div className="space-y-2 text-sm leading-relaxed text-foreground">
                      {m.content.split('\n').map((line, i) =>
                        line.trim() ? (
                          <p key={i} className="whitespace-pre-wrap">
                            {renderWithCitations(line)}
                          </p>
                        ) : (
                          <div key={i} className="h-1" />
                        ),
                      )}
                    </div>

                    {/* Citations */}
                    {m.citations && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          引用来源 ({m.citations.length})
                        </p>
                        {m.citations.map((c) => (
                          <CitationCard key={c.index} citation={c} />
                        ))}
                      </div>
                    )}

                    {/* Footer: confidence + actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {m.confidence && <ConfidenceGauge confidence={m.confidence} />}
                      {m.latency && (
                        <span className="text-xs text-muted-foreground">耗时 {m.latency}</span>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                          <ThumbsUp className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                          <ThumbsDown className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                          <Copy className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                          <RotateCcw className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}

            {/* Suggested follow-ups */}
            <div className="flex flex-wrap gap-2 pl-11">
              {['违约金上限是多少？', '如何解除合同？', '保密期限多久？'].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <Card className="flex-row items-end gap-2 p-2">
              <Button variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground">
                <Paperclip className="size-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入问题，Enter 发送，Shift+Enter 换行..."
                rows={1}
                className="min-h-9 resize-none border-0 px-0 py-2 shadow-none focus-visible:ring-0"
              />
              <Button size="icon" className="size-9 shrink-0" disabled={!input.trim()}>
                <Send className="size-4" />
              </Button>
            </Card>
            <div className="mt-2 flex items-center justify-between px-1">
              <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                混合检索（向量 + 全文 + 知识图谱）
                <ChevronDown className="size-3" />
              </button>
              <span className="text-[11px] text-muted-foreground">回答均附带可溯源引用</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((p, i) => {
    const match = p.match(/^\[(\d+)\]$/)
    if (match) {
      return (
        <sup
          key={i}
          className="mx-0.5 inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded bg-primary/15 px-1 text-[10px] font-medium text-primary"
        >
          {match[1]}
        </sup>
      )
    }
    return <span key={i}>{p}</span>
  })
}
