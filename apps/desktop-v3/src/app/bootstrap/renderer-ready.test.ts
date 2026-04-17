import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3RendererBootBeaconUrl,
  reportDesktopV3RendererReady,
} from "@/app/bootstrap/renderer-ready";

describe("renderer ready reporter", () => {
  it("builds the structured dev boot beacon url", () => {
    expect(
      buildDesktopV3RendererBootBeaconUrl("#/diagnostics", "tauri"),
    ).toBe("/__desktop_v3_boot?route=%23%2Fdiagnostics&runtime=tauri&stage=app");
  });

  it("reports the renderer boot marker when enabled", async () => {
    const invokeMock = vi.fn().mockResolvedValue(undefined);

    const reported = reportDesktopV3RendererReady({
      enabled: false,
      invokeImpl: invokeMock,
      route: "#/diagnostics",
      runtimeMode: "tauri",
      schedule(callback) {
        callback();
      },
    });

    expect(reported).toBe(true);
    await Promise.resolve();
    expect(invokeMock).toHaveBeenCalledWith("desktop_report_renderer_boot", {
      route: "#/diagnostics",
      runtime: "tauri",
      stage: "app",
    });
  });

  it("falls back to the dev http beacon when tauri invoke is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const invokeMock = vi.fn().mockRejectedValue(new Error("bridge unavailable"));

    const reported = reportDesktopV3RendererReady({
      enabled: true,
      fetchImpl: fetchMock,
      invokeImpl: invokeMock,
      route: "#/diagnostics",
      runtimeMode: "tauri",
      schedule(callback) {
        callback();
      },
    });

    expect(reported).toBe(true);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/__desktop_v3_boot?route=%23%2Fdiagnostics&runtime=tauri&stage=app",
        {
          cache: "no-store",
          credentials: "omit",
          method: "GET",
        },
      );
    });
  });
});
