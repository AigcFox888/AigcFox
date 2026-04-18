import { ShieldCheck } from "lucide-react";

import { primaryNavigationItems, secondaryNavigationItems } from "@/app/router/route-registry";
import { NavItem } from "@/components/navigation/nav-item";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  compact: boolean;
  width: number;
}

export function Sidebar({ compact, width }: SidebarProps) {
  return (
    <aside
      className="shrink-0 border-r bg-card/80"
      data-testid="desktop-v3-sidebar"
      style={{ width }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className={cn("space-y-3 border-b px-4 py-4", compact && "px-3 py-3")}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">AigcFox Desktop V3</div>
              <div className="truncate text-xs text-muted-foreground">Wave 1 Skeleton</div>
            </div>
          </div>

          <Badge variant="secondary" className="font-normal">
            React + Tauri + Rust
          </Badge>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 px-3 py-4">
          <nav className="space-y-2">
            {primaryNavigationItems.map((item) => (
              <NavItem
                key={item.href}
                compact={compact}
                description={item.description}
                href={item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          <div className="space-y-2">
            <div className="px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Local Runtime
            </div>
            {secondaryNavigationItems.map((item) => (
              <NavItem
                key={item.href}
                compact={compact}
                description={item.description}
                href={item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 px-3 py-4">
          <Separator />
          <div className="rounded-lg border bg-background px-3 py-3 text-xs text-muted-foreground">
            当前只开放骨架级能力：布局、命令边界、SQLite baseline 与诊断入口。
          </div>
        </div>
      </div>
    </aside>
  );
}
