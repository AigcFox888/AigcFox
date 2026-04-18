import type {
  BackendProbe,
  DiagnosticsSnapshot,
  ThemeMode,
  ThemePreference,
} from "@/lib/runtime/contracts";
import type { RendererBootStage } from "@/lib/runtime/desktop-runtime";

export interface DesktopCommandPayloadMap {
  desktop_get_backend_liveness: undefined;
  desktop_get_backend_readiness: undefined;
  desktop_get_diagnostics_snapshot: undefined;
  desktop_get_theme_preference: undefined;
  desktop_report_renderer_boot: {
    route: string;
    runtime: string;
    stage: RendererBootStage;
  };
  desktop_set_theme_preference: {
    mode: ThemeMode;
  };
}

export interface DesktopCommandResultMap {
  desktop_get_backend_liveness: BackendProbe;
  desktop_get_backend_readiness: BackendProbe;
  desktop_get_diagnostics_snapshot: DiagnosticsSnapshot;
  desktop_get_theme_preference: ThemePreference;
  desktop_report_renderer_boot: void;
  desktop_set_theme_preference: ThemePreference;
}

export type DesktopCommandName = keyof DesktopCommandPayloadMap;
