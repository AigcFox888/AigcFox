import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3CapabilityGovernanceHelpText,
  runDesktopV3CapabilityGovernanceCli,
} from "./verify-desktop-v3-capability-governance.mjs";

describe("verify-desktop-v3-capability-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3CapabilityGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          appPermissions: [],
          capabilityFiles: [],
          capabilityIdentifier: "main-window",
          corePermissions: [],
          invokeHandlerCommands: [],
          payloadCommands: [],
          permissionEntries: [],
          remoteUrls: [],
          resultCommands: [],
          scannedFileCount: 0,
          scannedFiles: [],
          violations: [],
          windows: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3CapabilityGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      latestSummaryPath: "/tmp/capability-governance/latest.json",
      outputDir: "/tmp/capability-governance",
      summaryPath: "/tmp/capability-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      appPermissions: ["desktop-preferences-read"],
      capabilityFiles: ["apps/desktop-v3/src-tauri/capabilities/main-window.json"],
      capabilityIdentifier: "main-window",
      corePermissions: ["core:app:default"],
      invokeHandlerCommands: ["desktop_get_theme_preference"],
      payloadCommands: ["desktop_get_theme_preference"],
      permissionEntries: [{ commands: ["desktop_get_theme_preference"], identifier: "desktop-preferences-read" }],
      remoteUrls: ["http://127.0.0.1:31420/*"],
      resultCommands: ["desktop_get_theme_preference"],
      scannedFileCount: 4,
      scannedFiles: [
        "apps/desktop-v3/src-tauri/capabilities/main-window.json",
        "apps/desktop-v3/src-tauri/permissions/main-window.toml",
        "apps/desktop-v3/src-tauri/src/lib.rs",
        "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts",
      ],
      violations: [],
      windows: ["main"],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedAppPermissions: [],
      allowedCapabilityFiles: ["main-window.json"],
      allowedCommands: [],
      allowedCorePermissions: [],
      allowedRemoteUrls: [],
      appPermissions: [],
      capabilityFiles: [],
      capabilityIdentifier: null,
      checkedAt: null,
      corePermissions: [],
      error: null,
      invokeHandlerCommands: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      payloadCommands: [],
      permissionEntries: [],
      remoteUrls: [],
      resultCommands: [],
      runId: "capability-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
      windows: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3CapabilityGovernanceCli({
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
      capabilityFiles: ["apps/desktop-v3/src-tauri/capabilities/main-window.json"],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      scannedFileCount: 4,
      status: "passed",
      summaryPath: config.summaryPath,
      violationCount: 0,
    });
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(mkdirImpl).toHaveBeenCalledWith(config.outputDir, { recursive: true });
    expect(collectViolationsImpl).toHaveBeenCalledWith(config);
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilityFiles: ["apps/desktop-v3/src-tauri/capabilities/main-window.json"],
        latestSummaryPath: config.latestSummaryPath,
        outputDir: config.outputDir,
        scannedFileCount: 4,
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
      "desktop-v3 capability governance passed. Summary: /tmp/capability-governance/summary.json | Latest: /tmp/capability-governance/latest.json",
    );
  });
});
