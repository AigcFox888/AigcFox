import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  detectDesktopV3WslgWindowRegistration,
  resolveDesktopV3PackagedAppSmokeConfig,
  resolveDesktopV3PackagedAppSmokeEnv,
} from "./desktop-v3-packaged-app-smoke.mjs";

describe("desktop-v3 packaged app smoke", () => {
  it("defaults to the release binary and preferences route", () => {
    const config = resolveDesktopV3PackagedAppSmokeConfig({});

    expect(config.binaryPath).toBe(
      path.join(
        config.rootDir,
        "apps",
        "desktop-v3",
        "src-tauri",
        "target",
        "release",
        "aigcfox-desktop-v3",
      ),
    );
    expect(config.initialRoute).toBe("/preferences");
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-packaged-app-smoke-summary.json"),
    );
    expect(config.requiredCommandInvocations).toEqual([
      "desktop_report_renderer_boot",
      "desktop_get_theme_preference",
    ]);
  });

  it("injects route and command tracing overrides on WSL", () => {
    const config = resolveDesktopV3PackagedAppSmokeConfig({
      AIGCFOX_DESKTOP_V3_PACKAGED_APP_INITIAL_ROUTE: "/diagnostics",
    });
    const runtimeEnv = resolveDesktopV3PackagedAppSmokeEnv(
      {
        WSL_DISTRO_NAME: "Ubuntu",
      },
      config,
    );

    expect(runtimeEnv.appliedEnvOverrides).toEqual({
      AIGCFOX_DESKTOP_V3_TRACE_COMMANDS: "1",
      AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE: "/diagnostics",
      LIBGL_ALWAYS_SOFTWARE: "1",
    });
  });

  it("detects WSLg window registration markers", () => {
    expect(
      detectDesktopV3WslgWindowRegistration(
        `
          [02:53:26.340]     appId: aigcfox-desktop-v3
          [02:53:26.340] Client: ClientGetAppidReq: pid:2501462 appId:aigcfox-desktop-v3 WindowId:0x54
        `,
      ),
    ).toBe(true);
  });
});
