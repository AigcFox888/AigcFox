import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { typography } from "@/lib/typography";

interface PageHeaderProps {
  actions?: ReactNode;
  breadcrumbs: string[];
  subtitle: string;
  title: string;
}

export function PageHeader({ actions, breadcrumbs, subtitle, title }: PageHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-4 py-4 min-[1366px]:px-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3" /> : null}
              <span>{breadcrumb}</span>
            </div>
          ))}
        </div>

        <h1 className={typography.pageTitle}>{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
