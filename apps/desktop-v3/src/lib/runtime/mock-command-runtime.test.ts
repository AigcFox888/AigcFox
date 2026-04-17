import { describe, expect, it } from "vitest";

import { MockCommandRuntime } from "@/lib/runtime/mock-command-runtime";

describe("MockCommandRuntime", () => {
  it("keeps theme preference state across runtime calls", async () => {
    const runtime = new MockCommandRuntime();

    const initialPreference = await runtime.getThemePreference();
    expect(initialPreference.mode).toBe("system");

    const updatedPreference = await runtime.setThemePreference("dark");
    expect(updatedPreference.mode).toBe("dark");

    const livenessProbe = await runtime.getBackendLiveness();
    const readinessProbe = await runtime.getBackendReadiness();

    const diagnosticsSnapshot = await runtime.getDiagnosticsSnapshot();
    expect(diagnosticsSnapshot.themeMode).toBe("dark");
    expect(diagnosticsSnapshot.syncCacheEntryCount).toBe(2);
    expect(diagnosticsSnapshot.dirtySyncCacheEntryCount).toBe(1);
    expect(diagnosticsSnapshot.lastBackendProbeAt).toBe(readinessProbe.checkedAt);
    expect(diagnosticsSnapshot.secureStore.status).toBe("reserved");
    expect(diagnosticsSnapshot.secureStore.provider).toBe("mock-keyring");
    expect(diagnosticsSnapshot.secureStore.writesEnabled).toBe(false);
    expect(livenessProbe.service).toBe("mock-control-plane-api");
  });
});
