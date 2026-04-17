import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { buildMockDiagnosticsSnapshot, buildMockThemePreference } from "@/lib/runtime/mock-fixtures";
import { TauriCommandRuntime } from "@/lib/runtime/tauri-command-runtime";
import type { TauriInvoke } from "@/lib/runtime/tauri-invoke";

describe("TauriCommandRuntime", () => {
  it("passes payloads through to tauri invoke", async () => {
    const invoke = vi.fn(async () => buildMockThemePreference("dark"));
    const loadInvoke = vi.fn().mockResolvedValue(invoke as TauriInvoke);
    const runtime = new TauriCommandRuntime({ loadInvoke });

    const preference = await runtime.setThemePreference("dark");

    expect(preference.mode).toBe("dark");
    expect(loadInvoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("desktop_set_theme_preference", { mode: "dark" });
  });

  it("normalizes tauri invoke failures into app errors", async () => {
    const invoke = vi.fn(async () => {
      throw new Error(
        "{\"code\":\"not_ready\",\"message\":\"backend warming up\",\"requestId\":\"req_runtime_1\"}",
      );
    });
    const runtime = new TauriCommandRuntime({
      loadInvoke: vi.fn().mockResolvedValue(invoke as TauriInvoke),
    });

    const rejection = runtime.getBackendReadiness();

    await expect(rejection).rejects.toBeInstanceOf(AppError);
    await expect(rejection).rejects.toMatchObject({
      code: "not_ready",
      message: "backend warming up",
      requestId: "req_runtime_1",
    });
  });

  it("reuses the loaded invoke function across commands", async () => {
    const invoke = vi.fn(
      async (command: string): Promise<unknown> => {
        if (command === "desktop_get_theme_preference") {
          return buildMockThemePreference("system");
        }

        return buildMockDiagnosticsSnapshot("2026-04-13T00:00:00.000Z", "system");
      },
    );
    const loadInvoke = vi.fn().mockResolvedValue(invoke as TauriInvoke);
    const runtime = new TauriCommandRuntime({ loadInvoke });

    await runtime.getThemePreference();
    await runtime.getDiagnosticsSnapshot();

    expect(loadInvoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenNthCalledWith(1, "desktop_get_theme_preference", undefined);
    expect(invoke).toHaveBeenNthCalledWith(2, "desktop_get_diagnostics_snapshot", undefined);
  });
});
