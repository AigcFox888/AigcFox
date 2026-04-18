import type { LucideIcon } from "lucide-react";
import { Activity, LayoutDashboard, SlidersHorizontal } from "lucide-react";

export type DesktopV3RouteId = "dashboard" | "diagnostics" | "preferences";
export type DesktopV3RoutePath = "/" | "/diagnostics" | "/preferences";
export type DesktopV3InitialRoute = DesktopV3RoutePath;
export type DesktopV3NavigationGroup = "primary" | "secondary";

export interface AppRouteHandle {
  shortLabel?: string;
  subtitle: string;
  title: string;
}

export interface DesktopV3NavigationItem {
  description: string;
  href: DesktopV3RoutePath;
  icon: LucideIcon;
  label: string;
}

export interface DesktopV3RouteDefinition {
  handle: AppRouteHandle;
  href: DesktopV3RoutePath;
  id: DesktopV3RouteId;
  navigation: DesktopV3NavigationItem & {
    group: DesktopV3NavigationGroup;
  };
}

export const desktopV3RoutePathById = {
  dashboard: "/",
  diagnostics: "/diagnostics",
  preferences: "/preferences",
} as const satisfies Record<DesktopV3RouteId, DesktopV3RoutePath>;

export const desktopV3RouteDefinitions: DesktopV3RouteDefinition[] = [
  {
    id: "dashboard",
    href: desktopV3RoutePathById.dashboard,
    handle: {
      title: "桌面骨架总览",
      subtitle: "只保留 Wave 1 skeleton 的布局、命令边界与运行态入口。",
      shortLabel: "总览",
    },
    navigation: {
      group: "primary",
      icon: LayoutDashboard,
      label: "总览",
      description: "查看骨架边界与实施顺序",
      href: desktopV3RoutePathById.dashboard,
    },
  },
  {
    id: "diagnostics",
    href: desktopV3RoutePathById.diagnostics,
    handle: {
      title: "运行诊断",
      subtitle: "观察本地 runtime、SQLite baseline 与远端健康探针的最小链路。",
      shortLabel: "诊断",
    },
    navigation: {
      group: "primary",
      icon: Activity,
      label: "诊断",
      description: "查看本地与远端最小诊断链",
      href: desktopV3RoutePathById.diagnostics,
    },
  },
  {
    id: "preferences",
    href: desktopV3RoutePathById.preferences,
    handle: {
      title: "本地偏好",
      subtitle: "当前只开放受控主题偏好，不把敏感配置留在 renderer。",
      shortLabel: "偏好",
    },
    navigation: {
      group: "secondary",
      icon: SlidersHorizontal,
      label: "偏好",
      description: "管理本地主题偏好",
      href: desktopV3RoutePathById.preferences,
    },
  },
];

export const primaryNavigationItems = desktopV3RouteDefinitions
  .filter((route) => route.navigation.group === "primary")
  .map((route) => route.navigation);

export const secondaryNavigationItems = desktopV3RouteDefinitions
  .filter((route) => route.navigation.group === "secondary")
  .map((route) => route.navigation);

const allowedInitialRoutes = new Set<DesktopV3InitialRoute>(
  desktopV3RouteDefinitions.map((route) => route.href),
);

function normalizeInitialRoute(rawValue: string | undefined): string {
  const trimmedValue = rawValue?.trim();

  if (!trimmedValue) {
    return desktopV3RoutePathById.dashboard;
  }

  return trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`;
}

export function resolveDesktopV3InitialRoute(
  rawValue = import.meta.env.VITE_DESKTOP_V3_INITIAL_ROUTE,
): DesktopV3InitialRoute {
  const normalizedValue = normalizeInitialRoute(rawValue);

  if (allowedInitialRoutes.has(normalizedValue as DesktopV3InitialRoute)) {
    return normalizedValue as DesktopV3InitialRoute;
  }

  return desktopV3RoutePathById.dashboard;
}
