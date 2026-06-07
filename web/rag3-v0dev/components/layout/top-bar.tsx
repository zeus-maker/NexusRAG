'use client'

import {
  Search,
  Bell,
  HelpCircle,
  Globe,
  PanelLeft,
  PanelLeftClose,
  Sun,
  Moon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const notifications = [
  { title: '解析完成', desc: '审计报告.pdf 已完成解析（质量 94 分）', time: '5 分钟前' },
  { title: '评测报告生成', desc: '6月Faithfulness回归评测 已完成', time: '1 小时前' },
  { title: 'A/B 测试结果', desc: 'BGE-M3 vs BCE 达到 95% 置信度', time: '3 小时前' },
]

export function TopBar({
  collapsed,
  onToggle,
  isDark,
  onToggleTheme,
}: {
  collapsed: boolean
  onToggle: () => void
  isDark: boolean
  onToggleTheme: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onToggle}>
        {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        <span className="sr-only">切换侧边栏</span>
      </Button>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索知识库、文档、对话历史..."
          className="h-9 pl-8 text-sm"
          aria-label="全局搜索"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={onToggleTheme}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span className="sr-only">切换主题</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
              <span className="sr-only">通知</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-2.5 text-sm font-medium">通知</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className="border-b border-border px-4 py-2.5 last:border-0 hover:bg-accent">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.desc}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="size-8">
          <HelpCircle className="size-4" />
          <span className="sr-only">帮助</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Globe className="size-4" />
              <span className="sr-only">语言</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>简体中文</DropdownMenuItem>
            <DropdownMenuItem>English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">李</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">李婷</span>
                <span className="text-xs font-normal text-muted-foreground">平台管理员</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>个人信息</DropdownMenuItem>
            <DropdownMenuItem>偏好设置</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
