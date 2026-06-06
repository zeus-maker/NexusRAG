'use client'

import { useState } from 'react'
import { Plus, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { sysRoles, permGroups } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function RolesPage() {
  const [active, setActive] = useState(sysRoles[0].id)

  return (
    <div>
      <PageHeader
        title="角色权限"
        crumbs={[{ label: '系统管理' }, { label: '角色权限' }]}
        actions={
          <Button>
            <Plus className="size-4" />
            新建角色
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[20rem_1fr]">
        {/* Role list */}
        <div className="space-y-2.5">
          {sysRoles.map((r) => (
            <Card
              key={r.id}
              onClick={() => setActive(r.id)}
              className={cn(
                'cursor-pointer gap-2 p-4 transition-colors',
                active === r.id ? 'border-primary ring-1 ring-primary/30' : 'hover:border-border/80',
              )}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={cn(
                    'size-4',
                    active === r.id ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <h3 className="text-sm font-medium">{r.name}</h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {r.users} 人
                </span>
                <span>{r.perms} 项权限</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Permission matrix */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {sysRoles.find((r) => r.id === active)?.name} · 权限配置
            </h3>
            <Button size="sm" className="h-8">
              保存变更
            </Button>
          </div>
          <div className="space-y-5">
            {permGroups.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{g.group}</p>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {g.items.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm">{p.label}</p>
                        <p className="text-[11px] text-muted-foreground">{p.key}</p>
                      </div>
                      <Switch defaultChecked={p.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
