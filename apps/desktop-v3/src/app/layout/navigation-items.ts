import type { LucideIcon } from "lucide-react";
import { Activity, LayoutDashboard, SlidersHorizontal } from "lucide-react";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const primaryNavigationItems: NavigationItem[] = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "总览",
    description: "查看骨架边界与实施顺序",
  },
  {
    href: "/diagnostics",
    icon: Activity,
    label: "诊断",
    description: "查看本地与远端最小诊断链",
  },
];

export const secondaryNavigationItems: NavigationItem[] = [
  {
    href: "/preferences",
    icon: SlidersHorizontal,
    label: "偏好",
    description: "管理本地主题偏好",
  },
];
