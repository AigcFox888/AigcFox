import type { UIMatch } from "react-router-dom";
import { Outlet, useMatches } from "react-router-dom";

import { PageHeader } from "@/app/layout/page-header";
import { ShellScaffold } from "@/app/layout/shell-scaffold";
import { Sidebar } from "@/app/layout/sidebar";
import type { AppRouteHandle } from "@/app/router/route-registry";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useShellLayout } from "@/hooks/use-shell-layout";

function isRouteHandle(handle: unknown): handle is AppRouteHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "title" in handle &&
    "subtitle" in handle
  );
}

function hasRouteHandle(match: UIMatch): match is UIMatch<unknown, AppRouteHandle> {
  return isRouteHandle(match.handle);
}

export function AppShell() {
  const matches = useMatches();
  const { isCompact, layoutMode, sidebarWidth } = useShellLayout();

  useKeyboardShortcuts();

  const routeMatches = matches.filter(hasRouteHandle);
  const currentHandle = routeMatches.at(-1)?.handle ?? {
    title: "AigcFox Desktop V3",
    subtitle: "桌面骨架壳层",
  };
  const pageContext = {
    breadcrumbs: routeMatches
      .map((match) => match.handle.shortLabel ?? match.handle.title)
      .filter((label, index, labels) => index === 0 || label !== labels[index - 1]),
    title: currentHandle.title,
    subtitle: currentHandle.subtitle,
  };

  return (
    <ShellScaffold
      header={
        <PageHeader
          breadcrumbs={pageContext.breadcrumbs}
          subtitle={pageContext.subtitle}
          title={pageContext.title}
        />
      }
      layoutMode={layoutMode}
      sidebar={<Sidebar compact={isCompact} width={sidebarWidth} />}
    >
      <Outlet />
    </ShellScaffold>
  );
}
