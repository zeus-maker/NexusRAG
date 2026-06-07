'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { StatusBar } from './status-bar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <StatusBar />
      </div>
    </div>
  )
}
