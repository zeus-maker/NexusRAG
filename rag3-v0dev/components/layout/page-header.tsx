import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

export function PageHeader({
  title,
  crumbs,
  actions,
}: {
  title: string
  crumbs?: Crumb[]
  actions?: React.ReactNode
}) {
  return (
    <div className="border-b border-border bg-background px-6 py-4">
      {crumbs && crumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="size-3" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-pretty text-xl font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
