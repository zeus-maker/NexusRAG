export function StatusBar() {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-sidebar px-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success" />
        SSE 已连接
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <span className="rounded bg-warning/20 px-1.5 py-0.5 font-medium text-warning">PROD</span>
        生产环境
      </span>
      <span className="hidden md:inline">版本 v1.0.0</span>
      <span className="ml-auto flex items-center gap-4">
        <span className="hidden lg:inline">GPU 利用率 78%</span>
        <span>最近请求 120ms</span>
        <span className="hidden sm:inline">© 2026 RAG 3.0 Knowledge Base System</span>
      </span>
    </footer>
  )
}
