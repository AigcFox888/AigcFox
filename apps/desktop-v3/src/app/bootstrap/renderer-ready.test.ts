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
    const reportRendererBoot = vi.fn().mockResolvedValue(undefined);

    const reported = reportDesktopV3RendererReady({
      enabled: false,
      desktopRuntime: {
        reportRendererBoot,
      },
      route: "#/diagnostics",
      runtimeMode: "tauri",
      schedule(callback) {
        callback();
      },
    });

    expect(reported).toBe(true);
    await Promise.resolve();
    expect(reportRendererBoot).toHaveBeenCalledWith("#/diagnostics", "tauri", "app");
  });

  it("falls back to the dev http beacon when tauri invoke is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const reportRendererBoot = vi
      .fn()
      .mockRejectedValue(new Error("desktop runtime unavailable"));

    const reported = reportDesktopV3RendererReady({
      enabled: true,
      desktopRuntime: {
        reportRendererBoot,
      },
      fetchImpl: fetchMock,
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
