import type {
  BackendProbe,
  DiagnosticsSnapshot,
  ThemeMode,
  ThemePreference,
} from "@/lib/runtime/contracts";

export interface DesktopCommandPayloadMap {
  desktop_get_backend_liveness: undefined;
  desktop_get_backend_readiness: undefined;
  desktop_get_diagnostics_snapshot: undefined;
  desktop_get_theme_preference: undefined;
  desktop_set_theme_preference: {
    mode: ThemeMode;
  };
}

export interface DesktopCommandResultMap {
  desktop_get_backend_liveness: BackendProbe;
  desktop_get_backend_readiness: BackendProbe;
  desktop_get_diagnostics_snapshot: DiagnosticsSnapshot;
  desktop_get_theme_preference: ThemePreference;
  desktop_set_theme_preference: ThemePreference;
}

export type DesktopCommandName = keyof DesktopCommandPayloadMap;
