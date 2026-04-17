import type { ThemeMode } from "@/features/preferences/preferences-types";
import { getDesktopRuntime } from "@/lib/runtime/runtime-registry";

export function getThemePreference() {
  return getDesktopRuntime().getThemePreference();
}

export function setThemePreference(mode: ThemeMode) {
  return getDesktopRuntime().setThemePreference(mode);
}
