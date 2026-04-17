import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3PlatformConfigGovernanceHelpText,
  runDesktopV3PlatformConfigGovernanceCli,
} from "./verify-desktop-v3-platform-config-governance.mjs";

describe("verify-desktop-v3-platform-config-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3PlatformConfigGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          appKeys: [],
          buildConfig: null,
          buildKeys: [],
          bundleConfig: null,
          bundleKeys: [],
          configFiles: [],
          scannedFileCount: 0,
          scannedFiles: [],
          securityConfig: null,
          securityKeys: [],
          stringFields: {},
          topLevelKeys: [],
          violations: [],
          windowKeySets: [],
          windows: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3PlatformConfigGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedConfigFiles: ["apps/desktop-v3/src-tauri/tauri.conf.json"],
      latestSummaryPath: "/tmp/platform-config-governance/latest.json",
      outputDir: "/tmp/platform-config-governance",
      summaryPath: "/tmp/platform-config-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      appKeys: ["security", "windows"],
      buildConfig: {
        beforeBuildCommand: "pnpm build",
        beforeDevCommand: "pnpm dev",
        devUrl: "http://127.0.0.1:1420/",
        frontendDist: "../dist",
      },
      buildKeys: ["beforeBuildCommand", "beforeDevCommand", "devUrl", "frontendDist"],
      bundleConfig: {
        active: true,
        icon: ["icons/icon.png"],
      },
      bundleKeys: ["active", "icon"],
      configFiles: ["apps/desktop-v3/src-tauri/tauri.conf.json"],
      scannedFileCount: 1,
      scannedFiles: ["apps/desktop-v3/src-tauri/tauri.conf.json"],
      securityConfig: { csp: null },
      securityKeys: ["csp"],
      stringFields: {
        $schema: "../node_modules/@tauri-apps/cli/config.schema.json",
        identifier: "com.aigcfox.desktopv3",
        productName: "AigcFox Desktop V3",
        version: "0.1.0",
      },
      topLevelKeys: ["$schema", "app", "build", "bundle", "identifier", "productName", "version"],
      violations: [],
      windowKeySets: [["create", "label"]],
      windows: [{ create: false, label: "main" }],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedConfigFiles: [...config.allowedConfigFiles],
      allowedPlannedPlatformConfigFiles: [],
      allowedTopLevelKeys: [],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: "platform-config-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3PlatformConfigGovernanceCli({
      argv: [],
      collectViolationsImpl,
      consoleLogImpl,
      createSummaryImpl,
      mkdirImpl,
      persistVerificationSummaryImpl,
      resolveConfigImpl,
      writeJsonFileImpl: vi.fn(async () => {}),
    });

    expect(result).toMatchObject({
      configFiles: ["apps/desktop-v3/src-tauri/tauri.conf.json"],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      scannedFileCount: 1,
      status: "passed",
      summaryPath: config.summaryPath,
      violationCount: 0,
    });
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(mkdirImpl).toHaveBeenCalledWith(config.outputDir, { recursive: true });
    expect(collectViolationsImpl).toHaveBeenCalledWith(config);
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        configFiles: ["apps/desktop-v3/src-tauri/tauri.conf.json"],
        latestSummaryPath: config.latestSummaryPath,
        outputDir: config.outputDir,
        scannedFileCount: 1,
        summaryPath: config.summaryPath,
        violationCount: 0,
      }),
      {
        archiveSummaryPath: config.summaryPath,
        latestSummaryPath: config.latestSummaryPath,
      },
      {
        writeJsonFileImpl: expect.any(Function),
      },
    );
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 platform config governance passed. Summary: /tmp/platform-config-governance/summary.json | Latest: /tmp/platform-config-governance/latest.json",
    );
  });
});
