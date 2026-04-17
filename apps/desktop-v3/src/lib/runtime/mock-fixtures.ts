import type {
  BackendProbe,
  DiagnosticsSnapshot,
  ThemeMode,
  ThemePreference,
} from "@/lib/runtime/contracts";

function nowIsoString() {
  return new Date().toISOString();
}

export function buildMockThemePreference(mode: ThemeMode): ThemePreference {
  return {
    mode,
    updatedAt: nowIsoString(),
  };
}

export function buildMockDiagnosticsSnapshot(
  lastBackendProbeAt: string | null,
  themeMode: ThemeMode,
): DiagnosticsSnapshot {
  return {
    appVersion: "0.1.0-mock",
    backendBaseUrl: "mock://control-plane",
    checkedAt: nowIsoString(),
    databasePath: "mock://sqlite/desktop-v3",
    databaseStatus: "mock-ready",
    dirtySyncCacheEntryCount: 1,
    lastBackendProbeAt,
    platform: "browser-preview",
    secureStore: {
      provider: "mock-keyring",
      status: "reserved",
      writesEnabled: false,
    },
    syncCacheEntryCount: 2,
    themeMode,
  };
}

export function buildMockBackendProbe(requestId: string): BackendProbe {
  return {
    checkedAt: nowIsoString(),
    requestId,
    service: "mock-control-plane-api",
    status: "pass",
  };
}
