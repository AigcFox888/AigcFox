import { describe, expect, it } from "vitest";

import {
  detectDesktopV3DevMarkers,
  detectDesktopV3DevStartupFailure,
  resolveDesktopV3TauriDevSmokeEnv,
  resolveDesktopV3TauriDevSmokeConfig,
  detectDesktopV3WslgWindowRegistration,
  stripAnsi,
} from "./desktop-v3-tauri-dev-smoke.mjs";

describe("desktop-v3 tauri dev smoke helpers", () => {
  it("strips ansi sequences from tauri output", () => {
    expect(stripAnsi("\u001B[1mRunning\u001B[0m target/debug/aigcfox-desktop-v3")).toBe(
      "Running target/debug/aigcfox-desktop-v3",
    );
  });

  it("detects vite, cargo, and warning markers from tauri dev output", () => {
    const markers = detectDesktopV3DevMarkers(`
      VITE v7.3.1 ready in 3000 ms
      Local:   http://127.0.0.1:31420/
      \u001B[1mRunning\u001B[0m target/debug/aigcfox-desktop-v3
      desktop-v3.main-window.navigation allowed=true url=http://127.0.0.1:31420/
      desktop-v3.main-window.page-load event=started url=http://127.0.0.1:31420/
      desktop-v3.main-window.page-load event=finished url=http://127.0.0.1:31420/
      desktop-v3.renderer.boot stage=document route=#/ runtime=document
      desktop-v3.renderer.boot stage=app route=#/diagnostics runtime=tauri
      desktop-v3.command.invoke name=desktop_get_backend_liveness
      libEGL warning: failed to get driver name for fd -1
      GLib-CRITICAL **: g_uri_get_scheme: assertion 'uri != NULL' failed
    `);

    expect(markers.viteReady).toBe(true);
    expect(markers.cargoRunning).toBe(true);
    expect(markers.mainWindowPageLoadStarted).toBe(true);
    expect(markers.mainWindowPageLoadFinished).toBe(true);
    expect(markers.documentBootSeen).toBe(true);
    expect(markers.rendererBootSeen).toBe(true);
    expect(markers.commandInvocations).toEqual(["desktop_get_backend_liveness"]);
    expect(markers.windowWarnings).toEqual([
      "libEGL warning: failed to get driver name for fd -1",
      "GLib-CRITICAL **: g_uri_get_scheme: assertion 'uri != NULL' failed",
    ]);
  });

  it("detects WSLg window registration entries", () => {
    expect(
      detectDesktopV3WslgWindowRegistration(
        `
          [02:53:26.340]     appId: aigcfox-desktop-v3
          [02:53:26.340] Client: ClientGetAppidReq: pid:2501462 appId:aigcfox-desktop-v3 WindowId:0x54
        `,
      ),
    ).toBe(true);
  });

  it("extracts a concrete startup failure when the Vite port is occupied", () => {
    expect(
      detectDesktopV3DevStartupFailure(`
        error when starting dev server:
        Error: Port 31420 is already in use
           Error The "beforeDevCommand" terminated with a non-zero status code.
      `),
    ).toBe("desktop-v3 tauri dev could not start because Vite port 31420 is already in use.");
  });

  it("ignores beforeDevCommand teardown after the Vite server and Rust host have already started", () => {
    expect(
      detectDesktopV3DevStartupFailure(`
        Running BeforeDevCommand (\`pnpm dev\`)
        VITE v7.3.1 ready in 1887 ms
        Local:   http://127.0.0.1:31420/
        Running DevCommand (\`cargo  run --no-default-features --color always --\`)
        Error The "beforeDevCommand" terminated with a non-zero status code.
      `),
    ).toBeNull();
  });

  it("applies software rendering override by default on WSL", () => {
    const runtimeEnv = resolveDesktopV3TauriDevSmokeEnv({
      WSL_DISTRO_NAME: "Ubuntu",
    });

    expect(runtimeEnv.appliedEnvOverrides).toEqual({
      LIBGL_ALWAYS_SOFTWARE: "1",
      VITE_DESKTOP_V3_RENDERER_BOOT_PROBE: "1",
      VITE_DESKTOP_V3_RUNTIME_MODE: "tauri",
    });
    expect(runtimeEnv.env.LIBGL_ALWAYS_SOFTWARE).toBe("1");
  });

  it("does not overwrite explicit host GL settings", () => {
    const runtimeEnv = resolveDesktopV3TauriDevSmokeEnv({
      LIBGL_ALWAYS_SOFTWARE: "0",
      WSL_DISTRO_NAME: "Ubuntu",
    });

    expect(runtimeEnv.appliedEnvOverrides).toEqual({
      VITE_DESKTOP_V3_RENDERER_BOOT_PROBE: "1",
      VITE_DESKTOP_V3_RUNTIME_MODE: "tauri",
    });
    expect(runtimeEnv.env.LIBGL_ALWAYS_SOFTWARE).toBe("0");
  });

  it("resolves a stable latest summary path", () => {
    const config = resolveDesktopV3TauriDevSmokeConfig({});

    expect(config.latestSummaryPath).toContain(
      "/output/verification/latest/desktop-v3-tauri-dev-smoke-summary.json",
    );
  });
});
