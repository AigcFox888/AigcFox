import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3UpdaterGovernanceFailureMessage,
  collectDesktopV3UpdaterGovernanceViolations,
  createDesktopV3UpdaterGovernanceSummary,
  desktopV3UpdaterGovernanceRequiredFiles,
  resolveDesktopV3UpdaterGovernanceConfig,
  rootDir,
} from "./desktop-v3-updater-governance.mjs";

describe("desktop-v3 updater governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3UpdaterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_RUN_ID: "updater-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("updater-check");
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-updater-governance-updater-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-updater-governance-summary.json"),
    );
    expect(config.requiredFiles).toEqual(desktopV3UpdaterGovernanceRequiredFiles);
    expect(config.rootDir).toBe(rootDir);
  });
});

describe("desktop-v3 updater governance scan", () => {
  it("flags premature updater dependency, code, and source drift", async () => {
    const config = resolveDesktopV3UpdaterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const cargoFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "Cargo.toml");
    const tauriConfigFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "tauri.conf.json");
    const updaterFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "features", "updater-shell.tsx");
    const runtimeFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "mod.rs",
    );

    const result = await collectDesktopV3UpdaterGovernanceViolations(config, {
      scanFilePaths: [cargoFile, tauriConfigFile, updaterFile, runtimeFile],
      readFileImpl: async (filePath) => {
        if (filePath === cargoFile) {
          return `
[dependencies]
tauri-plugin-updater = "2"
`;
        }

        if (filePath === tauriConfigFile) {
          return JSON.stringify(
            {
              app: {
                security: {
                  csp: null,
                },
              },
              bundle: {
                active: true,
                createUpdaterArtifacts: true,
              },
            },
            null,
            2,
          );
        }

        if (filePath === updaterFile) {
          return `
import { check } from "@tauri-apps/plugin-updater";

export function UpdaterShell() {
  return check;
}
`;
        }

        if (filePath === runtimeFile) {
          return `
pub const POLICY_URL: &str = "https://github.com/aigcfox/aigcfox/releases/download/v0.1.0/latest.json";
pub const MIN_SUPPORTED: &str = "minSupportedVersion";
pub const REQUIRED_MODE: &str = "required_on_startup";
pub const NEXT_LAUNCH: &str = "must_update_on_next_launch";
`;
        }

        return "";
      },
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "updater-artifact-config",
        "updater-file-name-drift",
        "updater-plugin-cargo-dependency",
        "updater-plugin-js-import",
        "update-manifest-endpoint",
        "update-policy-min-supported-version",
        "update-policy-required-on-startup",
        "update-policy-next-launch-flag",
        "github-releases-update-source",
      ]),
    );
    expect(result.scannedFiles).toEqual([
      "apps/desktop-v3/src-tauri/Cargo.toml",
      "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
      "apps/desktop-v3/src-tauri/tauri.conf.json",
      "apps/desktop-v3/src/features/updater-shell.tsx",
    ]);
  });

  it("keeps the current desktop-v3 codebase inside the frozen updater pre-implementation boundary", async () => {
    const config = resolveDesktopV3UpdaterGovernanceConfig();
    const result = await collectDesktopV3UpdaterGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFiles).toEqual(expect.arrayContaining(desktopV3UpdaterGovernanceRequiredFiles));
    expect(result.triggeredContentRuleKinds).toEqual([]);
    expect(result.triggeredFileNameRuleKinds).toEqual([]);
  });
});

describe("desktop-v3 updater governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3UpdaterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3UpdaterGovernanceSummary(config);

    summary.summaryPath = "/tmp/updater-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "Cargo.toml 还不允许引入 tauri updater plugin。",
        filePath: "apps/desktop-v3/src-tauri/Cargo.toml",
        kind: "updater-plugin-cargo-dependency",
        line: 3,
      },
    ];

    expect(buildDesktopV3UpdaterGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/Cargo.toml:3:1 [updater-plugin-cargo-dependency]",
    );
    expect(buildDesktopV3UpdaterGovernanceFailureMessage(summary)).toContain(
      "/tmp/updater-governance/summary.json",
    );
  });
});
