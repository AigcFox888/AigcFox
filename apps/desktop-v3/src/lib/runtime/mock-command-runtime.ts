import { AppError } from "@/lib/errors/app-error";
import type { ThemeMode } from "@/lib/runtime/contracts";
import type { DesktopRuntime } from "@/lib/runtime/desktop-runtime";
import {
  buildMockBackendProbe,
  buildMockDiagnosticsSnapshot,
  buildMockThemePreference,
} from "@/lib/runtime/mock-fixtures";

export class MockCommandRuntime implements DesktopRuntime {
  private lastBackendProbeAt: string | null = null;
  private themeMode: ThemeMode = "system";

  async getBackendLiveness() {
    const probe = buildMockBackendProbe("mock-liveness");
    this.lastBackendProbeAt = probe.checkedAt;
    return probe;
  }

  async getBackendReadiness() {
    const probe = buildMockBackendProbe("mock-readiness");
    this.lastBackendProbeAt = probe.checkedAt;
    return probe;
  }

  getDiagnosticsSnapshot() {
    return Promise.resolve(
      buildMockDiagnosticsSnapshot(this.lastBackendProbeAt, this.themeMode),
    );
  }

  getThemePreference() {
    return Promise.resolve(buildMockThemePreference(this.themeMode));
  }

  reportRendererBoot() {
    return Promise.resolve();
  }

  setThemePreference(mode: ThemeMode) {
    if (!mode) {
      return Promise.reject(
        new AppError({
          code: "invalid_request",
          message: "mock runtime requires a theme mode payload",
        }),
      );
    }

    this.themeMode = mode;
    return Promise.resolve(buildMockThemePreference(this.themeMode));
  }
}
