import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3RuntimeAdapterGovernanceHelpText,
  runDesktopV3RuntimeAdapterGovernanceCli,
} from "./verify-desktop-v3-runtime-adapter-governance.mjs";

describe("verify-desktop-v3-runtime-adapter-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3RuntimeAdapterGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          bridgeGlobalTouchFiles: [],
          mockCommandRuntimeReferenceFiles: [],
          mockFixtureExports: [],
          mockFixtureReferenceFiles: [],
          mockRuntimeExports: [],
          mockRuntimeFields: [],
          mockRuntimeMethods: [],
          runtimeFiles: [],
          runtimeModeExports: [],
          runtimeModeReferenceFiles: [],
          runtimeModeValues: [],
          runtimeRegistryExports: [],
          runtimeRegistryReferenceFiles: [],
          scannedFileCount: 0,
          scannedFiles: [],
          tauriBridgeExports: [],
          tauriBridgeReferenceFiles: [],
          tauriCommandRuntimeExports: [],
          tauriCommandRuntimeFields: [],
          tauriCommandRuntimeMethods: [],
          tauriCommandRuntimeReferenceFiles: [],
          tauriInvokeExports: [],
          tauriInvokeReferenceFiles: [],
          tauriInvokeType: null,
          tauriTouchFiles: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3RuntimeAdapterGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedBridgeGlobalTouchFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      allowedMockCommandRuntimeExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      allowedMockFixtureExports: ["fn:buildMockThemePreference"],
      allowedMockFixtureExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts"],
      allowedMockRuntimeExports: ["class:MockCommandRuntime"],
      allowedMockRuntimeFieldSurface: ["private:themeMode"],
      allowedMockRuntimePublicMethods: ["getThemePreference"],
      allowedRuntimeAdapterFiles: ["apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts"],
      allowedRuntimeModeExports: ["type:DesktopRuntimeMode"],
      allowedRuntimeModeExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      allowedRuntimeModeValues: ["mock", "tauri"],
      allowedRuntimeRegistryExports: ["fn:getDesktopRuntime"],
      allowedRuntimeRegistryExternalReferenceFiles: ["apps/desktop-v3/src/features/preferences/preferences-api.ts"],
      allowedTauriBridgeExports: ["fn:loadTauriInvoke"],
      allowedTauriBridgeExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts"],
      allowedTauriCommandRuntimeExports: ["class:TauriCommandRuntime"],
      allowedTauriCommandRuntimeExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      allowedTauriCommandRuntimeFieldSurface: ["private:invokePromise"],
      allowedTauriCommandRuntimePrivateMethods: ["invokeCommand"],
      allowedTauriCommandRuntimePublicMethods: ["getThemePreference"],
      allowedTauriInvokeExports: ["type:TauriInvoke"],
      allowedTauriInvokeExternalReferenceFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      allowedTauriInvokeTypeText: "<TResult>(command: string) => Promise<TResult>",
      allowedTauriTouchFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      latestSummaryPath: "/tmp/runtime-adapter-governance/latest.json",
      outputDir: "/tmp/runtime-adapter-governance",
      summaryPath: "/tmp/runtime-adapter-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      bridgeGlobalTouchFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      mockCommandRuntimeReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      mockFixtureExports: [],
      mockFixtureReferenceFiles: ["apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts"],
      mockRuntimeExports: [],
      mockRuntimeFields: [],
      mockRuntimeMethods: [],
      runtimeFiles: ["apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts"],
      runtimeModeExports: [],
      runtimeModeReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      runtimeModeValues: ["mock", "tauri"],
      runtimeRegistryExports: [],
      runtimeRegistryReferenceFiles: ["apps/desktop-v3/src/features/preferences/preferences-api.ts"],
      scannedFileCount: 3,
      scannedFiles: [
        "apps/desktop-v3/src/features/preferences/preferences-api.ts",
        "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
        "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
      ],
      tauriBridgeExports: [],
      tauriBridgeReferenceFiles: ["apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts"],
      tauriCommandRuntimeExports: [],
      tauriCommandRuntimeFields: [],
      tauriCommandRuntimeMethods: [],
      tauriCommandRuntimeReferenceFiles: ["apps/desktop-v3/src/lib/runtime/runtime-registry.ts"],
      tauriInvokeExports: [],
      tauriInvokeReferenceFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      tauriInvokeType: { filePath: "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts", line: 1, name: "TauriInvoke", typeText: "<TResult>(command: string) => Promise<TResult>" },
      tauriTouchFiles: ["apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedBridgeGlobalTouchFiles: [...config.allowedBridgeGlobalTouchFiles],
      allowedMockCommandRuntimeExternalReferenceFiles: [...config.allowedMockCommandRuntimeExternalReferenceFiles],
      allowedMockFixtureExports: [...config.allowedMockFixtureExports],
      allowedMockFixtureExternalReferenceFiles: [...config.allowedMockFixtureExternalReferenceFiles],
      allowedMockRuntimeExports: [...config.allowedMockRuntimeExports],
      allowedMockRuntimeFieldSurface: [...config.allowedMockRuntimeFieldSurface],
      allowedMockRuntimePublicMethods: [...config.allowedMockRuntimePublicMethods],
      allowedRuntimeAdapterFiles: [...config.allowedRuntimeAdapterFiles],
      allowedRuntimeModeExports: [...config.allowedRuntimeModeExports],
      allowedRuntimeModeExternalReferenceFiles: [...config.allowedRuntimeModeExternalReferenceFiles],
      allowedRuntimeModeValues: [...config.allowedRuntimeModeValues],
      allowedRuntimeRegistryExports: [...config.allowedRuntimeRegistryExports],
      allowedRuntimeRegistryExternalReferenceFiles: [...config.allowedRuntimeRegistryExternalReferenceFiles],
      allowedTauriBridgeExports: [...config.allowedTauriBridgeExports],
      allowedTauriBridgeExternalReferenceFiles: [...config.allowedTauriBridgeExternalReferenceFiles],
      allowedTauriCommandRuntimeExports: [...config.allowedTauriCommandRuntimeExports],
      allowedTauriCommandRuntimeExternalReferenceFiles: [...config.allowedTauriCommandRuntimeExternalReferenceFiles],
      allowedTauriCommandRuntimeFieldSurface: [...config.allowedTauriCommandRuntimeFieldSurface],
      allowedTauriCommandRuntimePrivateMethods: [...config.allowedTauriCommandRuntimePrivateMethods],
      allowedTauriCommandRuntimePublicMethods: [...config.allowedTauriCommandRuntimePublicMethods],
      allowedTauriInvokeExports: [...config.allowedTauriInvokeExports],
      allowedTauriInvokeExternalReferenceFiles: [...config.allowedTauriInvokeExternalReferenceFiles],
      allowedTauriInvokeTypeText: config.allowedTauriInvokeTypeText,
      allowedTauriTouchFiles: [...config.allowedTauriTouchFiles],
      bridgeGlobalTouchFiles: [],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      mockCommandRuntimeReferenceFiles: [],
      mockFixtureExports: [],
      mockFixtureReferenceFiles: [],
      mockRuntimeExports: [],
      mockRuntimeFields: [],
      mockRuntimeMethods: [],
      outputDir: config.outputDir,
      runId: "runtime-adapter-governance-test",
      runtimeFiles: [],
      runtimeModeExports: [],
      runtimeModeReferenceFiles: [],
      runtimeModeValues: [],
      runtimeRegistryExports: [],
      runtimeRegistryReferenceFiles: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tauriBridgeExports: [],
      tauriBridgeReferenceFiles: [],
      tauriCommandRuntimeExports: [],
      tauriCommandRuntimeFields: [],
      tauriCommandRuntimeMethods: [],
      tauriCommandRuntimeReferenceFiles: [],
      tauriInvokeExports: [],
      tauriInvokeReferenceFiles: [],
      tauriInvokeType: null,
      tauriTouchFiles: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3RuntimeAdapterGovernanceCli({
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
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      scannedFileCount: 3,
      status: "passed",
      summaryPath: config.summaryPath,
      violationCount: 0,
    });
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(mkdirImpl).toHaveBeenCalledWith(config.outputDir, { recursive: true });
    expect(collectViolationsImpl).toHaveBeenCalledWith(config);
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        latestSummaryPath: config.latestSummaryPath,
        outputDir: config.outputDir,
        scannedFileCount: 3,
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
      "desktop-v3 runtime adapter governance passed. Summary: /tmp/runtime-adapter-governance/summary.json | Latest: /tmp/runtime-adapter-governance/latest.json",
    );
  });
});
