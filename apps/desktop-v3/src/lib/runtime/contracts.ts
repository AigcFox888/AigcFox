export type ThemeMode = "light" | "dark" | "system";
export type SecureStoreStatus = "reserved" | "ready" | "unavailable";

export interface ThemePreference {
  mode: ThemeMode;
  updatedAt: string;
}

export interface SecureStoreSnapshot {
  provider: string;
  status: SecureStoreStatus;
  writesEnabled: boolean;
}

export interface DiagnosticsSnapshot {
  appVersion: string;
  backendBaseUrl: string;
  checkedAt: string;
  databasePath: string;
  databaseStatus: string;
  dirtySyncCacheEntryCount: number;
  lastBackendProbeAt?: string | null;
  platform: string;
  secureStore: SecureStoreSnapshot;
  syncCacheEntryCount: number;
  themeMode: ThemeMode;
}

export interface BackendProbe {
  checkedAt: string;
  requestId?: string;
  service: string;
  status: string;
}
