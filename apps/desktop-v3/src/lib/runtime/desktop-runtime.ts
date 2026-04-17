import type {
  BackendProbe,
  DiagnosticsSnapshot,
  ThemeMode,
  ThemePreference,
} from "@/lib/runtime/contracts";

export type RendererBootStage = "app" | "document";

export interface DesktopRuntime {
  getBackendLiveness(): Promise<BackendProbe>;
  getBackendReadiness(): Promise<BackendProbe>;
  getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot>;
  getThemePreference(): Promise<ThemePreference>;
  reportRendererBoot(
    route: string,
    runtime: string,
    stage: RendererBootStage,
  ): Promise<void>;
  setThemePreference(mode: ThemeMode): Promise<ThemePreference>;
}
