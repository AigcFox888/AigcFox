import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getThemePreference } from "@/features/preferences/preferences-api";
import { useThemePreferenceStore } from "@/features/preferences/preferences-store";
import type { ThemeMode } from "@/features/preferences/preferences-types";

interface ThemeProviderProps {
  children: ReactNode;
}

function applyThemeMode(themeMode: ThemeMode) {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const shouldUseDark = themeMode === "dark" || (themeMode === "system" && mediaQuery.matches);

  root.classList.toggle("dark", shouldUseDark);
  root.dataset.themeMode = themeMode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useThemePreferenceStore((state) => state.themeMode);
  const setThemeMode = useThemePreferenceStore((state) => state.setThemeMode);

  const themeQuery = useQuery({
    queryKey: ["preferences", "theme-mode"],
    queryFn: getThemePreference,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const resolvedThemeMode = themeQuery.data?.mode ?? null;

  useEffect(() => {
    if (resolvedThemeMode && themeMode !== resolvedThemeMode) {
      setThemeMode(resolvedThemeMode);
    }
  }, [resolvedThemeMode, setThemeMode, themeMode]);

  useEffect(() => {
    if (!resolvedThemeMode || themeMode !== resolvedThemeMode) {
      return undefined;
    }

    applyThemeMode(themeMode);

    if (themeMode !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemeMode("system");
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [resolvedThemeMode, themeMode]);

  return children;
}
