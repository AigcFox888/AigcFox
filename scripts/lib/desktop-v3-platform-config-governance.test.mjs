import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3PlatformConfigGovernanceFailureMessage,
  collectDesktopV3PlatformConfigGovernanceViolations,
  createDesktopV3PlatformConfigGovernanceSummary,
  desktopV3AllowedTauriConfigFiles,
  desktopV3AllowedTauriTopLevelKeys,
  resolveDesktopV3PlatformConfigGovernanceConfig,
  rootDir,
} from "./desktop-v3-platform-config-governance.mjs";

describe("desktop-v3 platform config governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3PlatformConfigGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_RUN_ID: "platform-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("platform-check");
    expect(config.platformConfigDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-platform-config-governance-platform-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-platform-config-governance-summary.json"),
    );
    expect(config.allowedConfigFiles).toEqual(desktopV3AllowedTauriConfigFiles);
  });
});

describe("desktop-v3 platform config governance scan", () => {
  it("flags config-file drift and shared tauri.conf boundary drift", async () => {
    const config = resolveDesktopV3PlatformConfigGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const sharedConfigFile = path.join(config.platformConfigDir, "tauri.conf.json");
    const windowsConfigFile = path.join(config.platformConfigDir, "tauri.windows.conf.json");
    const driftedConfig = {
      $schema: "../node_modules/@tauri-apps/cli/config.schema.json",
      app: {
        security: {
          csp: "default-src 'self'",
          dangerousRemoteDomainIpcAccess: [],
        },
        trayIcon: {
          iconPath: "icons/icon.png",
        },
        windows: [
          {
            create: true,
            height: 900,
            label: "secondary",
          },
          {
            create: false,
            label: "main",
          },
        ],
      },
      build: {
        beforeBuildCommand: "pnpm build",
        beforeDevCommand: "pnpm dev:desktop-v3",
        devUrl: "http://localhost:3000/",
        frontendDist: "../dist",
      },
      bundle: {
        active: true,
        icon: ["icons/icon.png"],
        windows: {
          wix: {
            language: "en-US",
          },
        },
      },
      identifier: "",
      plugins: {
        updater: {},
      },
      productName: "AigcFox Desktop V3",
      version: "0.1.0",
    };

    const result = await collectDesktopV3PlatformConfigGovernanceViolations(config, {
      configFilePaths: [sharedConfigFile, windowsConfigFile],
      readFileImpl: async (filePath) => {
        if (filePath === sharedConfigFile) {
          return JSON.stringify(driftedConfig, null, 2);
        }

        if (filePath === windowsConfigFile) {
          return JSON.stringify({ bundle: { windows: {} } }, null, 2);
        }

        return "";
      },
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "tauri-config-app-key-drift",
        "tauri-config-build-value-drift",
        "tauri-config-bundle-key-drift",
        "tauri-config-file-expansion",
        "tauri-config-required-field-invalid",
        "tauri-config-security-key-drift",
        "tauri-config-security-value-drift",
        "tauri-config-top-level-key-drift",
        "tauri-config-window-count-drift",
        "tauri-config-window-key-drift",
        "tauri-config-window-value-drift",
      ]),
    );
    expect(result.configFiles).toEqual([
      "apps/desktop-v3/src-tauri/tauri.conf.json",
      "apps/desktop-v3/src-tauri/tauri.windows.conf.json",
    ]);
    expect(result.topLevelKeys).not.toEqual(desktopV3AllowedTauriTopLevelKeys);
  });

  it("keeps the current shared tauri.conf boundary inside the frozen Wave 1 surface", async () => {
    const config = resolveDesktopV3PlatformConfigGovernanceConfig();
    const result = await collectDesktopV3PlatformConfigGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.configFiles).toEqual(desktopV3AllowedTauriConfigFiles);
    expect(result.topLevelKeys).toEqual(desktopV3AllowedTauriTopLevelKeys);
    expect(result.windows).toEqual([
      {
        create: false,
        label: "main",
      },
    ]);
  });
});

describe("desktop-v3 platform config governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3PlatformConfigGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3PlatformConfigGovernanceSummary(config);

    summary.summaryPath = "/tmp/platform-config-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 3,
        detail: "Shared tauri.conf.json top-level keys drifted from the frozen Wave 1 set.",
        filePath: "apps/desktop-v3/src-tauri/tauri.conf.json",
        kind: "tauri-config-top-level-key-drift",
        line: 2,
      },
    ];

    expect(buildDesktopV3PlatformConfigGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/tauri.conf.json:2:3 [tauri-config-top-level-key-drift]",
    );
    expect(buildDesktopV3PlatformConfigGovernanceFailureMessage(summary)).toContain(
      "/tmp/platform-config-governance/summary.json",
    );
  });
});
