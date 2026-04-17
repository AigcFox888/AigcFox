import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LayoutMode = "compact" | "standard" | "centered";

interface ShellScaffoldProps {
  children: ReactNode;
  header: ReactNode;
  layoutMode: LayoutMode;
  sidebar: ReactNode;
}

export function ShellScaffold({
  children,
  header,
  layoutMode,
  sidebar,
}: ShellScaffoldProps) {
  return (
    <div
      className="flex h-screen min-w-[1000px] flex-col overflow-hidden bg-background text-foreground"
      data-layout-mode={layoutMode}
      data-testid="desktop-v3-shell"
    >
      <div
        data-tauri-drag-region
        className="flex h-9 shrink-0 items-center justify-between border-b bg-background px-4"
      >
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          AigcFox Desktop V3
        </div>
        <div className="text-xs text-muted-foreground">
          {layoutMode === "compact" ? "Compact" : layoutMode === "centered" ? "Centered" : "Standard"}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {sidebar}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {header}

          <main
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-[1366px]:px-6 min-[1366px]:py-6 min-[1920px]:px-8",
              layoutMode === "compact" && "px-3 py-3",
            )}
            data-testid="desktop-v3-main-region"
          >
            <div
              className="mx-auto flex min-h-full w-full min-w-0 max-w-[1400px] flex-col gap-6"
              data-testid="desktop-v3-main-container"
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
