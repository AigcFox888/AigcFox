import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface NavItemProps {
  compact: boolean;
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
}

export function NavItem({ compact, description, href, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      aria-description={description}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors",
          compact ? "px-2.5 py-2" : "px-3 py-2.5",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )
      }
      end={href === "/"}
      to={href}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
