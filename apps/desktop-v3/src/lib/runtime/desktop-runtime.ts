import type {
  BackendProbe,
  DiagnosticsSnapshot,
  ThemeMode,
  ThemePreference,
} from "@/lib/runtime/contracts";

export interface DesktopRuntime {
  getBackendLiveness(): Promise<BackendProbe>;
  getBackendReadiness(): Promise<BackendProbe>;
  getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot>;
  getThemePreference(): Promise<ThemePreference>;
  setThemePreference(mode: ThemeMode): Promise<ThemePreference>;
}
