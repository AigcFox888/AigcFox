import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3RuntimeContractGovernanceHelpText,
  runDesktopV3RuntimeContractGovernanceCli,
} from "./verify-desktop-v3-runtime-contract-governance.mjs";

describe("verify-desktop-v3-runtime-contract-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3RuntimeContractGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          rustBackendProbeFields: [],
          rustDiagnosticsSnapshotFields: [],
          rustModelReferenceFiles: [],
          rustPublicItems: [],
          rustThemeModeMethods: [],
          rustThemeModeVariants: [],
          rustThemePreferenceFields: [],
          scannedFileCount: 0,
          scannedFiles: [],
          tsBackendProbeProperties: [],
          tsContractExports: [],
          tsDesktopCommandNameType: null,
          tsDesktopCommandPayloadEntries: [],
          tsDesktopCommandResultEntries: [],
          tsDesktopRuntimeExports: [],
          tsDesktopRuntimeMethods: [],
          tsDiagnosticsSnapshotProperties: [],
          tsRendererBootStageValues: [],
          tsSecureStoreSnapshotProperties: [],
          tsSecureStoreStatusValues: [],
          tsTauriCommandTypesExports: [],
          tsThemeModeValues: [],
          tsThemePreferenceProperties: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3RuntimeContractGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedRuntimeContractFiles: ["apps/desktop-v3/src-tauri/src/runtime/models.rs"],
      allowedRustBackendProbeFieldSurface: ["public:checked_at"],
      allowedRustDiagnosticsSnapshotFieldSurface: ["public:checked_at"],
      allowedRustModelSerdeRenameAll: { ThemeMode: "snake_case" },
      allowedRustRuntimeModelExternalReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      allowedRustRuntimeModelPublicItems: ["enum:ThemeMode"],
      allowedRustThemeModeMethodSignatures: { as_storage_value: "pub fn as_storage_value(&self) -> &'static str" },
      allowedRustThemeModePublicMethods: ["as_storage_value"],
      allowedRustThemeModeVariants: ["Light", "Dark", "System"],
      allowedRustThemePreferenceFieldSurface: ["public:mode"],
      allowedTsBackendProbeProperties: [{ name: "checkedAt", optional: false, typeText: "string" }],
      allowedTsDesktopCommandNameTypeText: "keyof DesktopCommandPayloadMap",
      allowedTsDesktopCommandPayloadEntries: [{ name: "desktop_get_theme_preference", optional: false, typeText: "undefined" }],
      allowedTsDesktopCommandResultEntries: [{ name: "desktop_get_theme_preference", optional: false, typeText: "ThemePreference" }],
      allowedTsDesktopRuntimeExports: ["interface:DesktopRuntime"],
      allowedTsDesktopRuntimeMethods: ["getThemePreference(): Promise<ThemePreference>"],
      allowedTsDiagnosticsSnapshotProperties: [{ name: "checkedAt", optional: false, typeText: "string" }],
      allowedTsRendererBootStageValues: ["app", "document"],
      allowedTsRuntimeContractsExports: ["interface:ThemePreference", "type:ThemeMode"],
      allowedTsSecureStoreSnapshotProperties: [{ name: "provider", optional: false, typeText: "string" }],
      allowedTsSecureStoreStatusValues: ["reserved", "ready", "unavailable"],
      allowedTsTauriCommandTypesExports: ["interface:DesktopCommandPayloadMap"],
      allowedTsThemeModeValues: ["light", "dark", "system"],
      allowedTsThemePreferenceProperties: [{ name: "mode", optional: false, typeText: "ThemeMode" }],
      latestSummaryPath: "/tmp/runtime-contract-governance/latest.json",
      outputDir: "/tmp/runtime-contract-governance",
      summaryPath: "/tmp/runtime-contract-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      rustBackendProbeFields: [],
      rustDiagnosticsSnapshotFields: [],
      rustModelReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      rustPublicItems: [],
      rustThemeModeMethods: [],
      rustThemeModeVariants: [],
      rustThemePreferenceFields: [],
      scannedFileCount: 4,
      scannedFiles: [
        "apps/desktop-v3/src-tauri/src/runtime/models.rs",
        "apps/desktop-v3/src/lib/runtime/contracts.ts",
        "apps/desktop-v3/src/lib/runtime/desktop-runtime.ts",
        "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts",
      ],
      tsBackendProbeProperties: [],
      tsContractExports: [],
      tsDesktopCommandNameType: { filePath: "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts", line: 1, name: "DesktopCommandName", typeText: "keyof DesktopCommandPayloadMap" },
      tsDesktopCommandPayloadEntries: [],
      tsDesktopCommandResultEntries: [],
      tsDesktopRuntimeExports: [],
      tsDesktopRuntimeMethods: [],
      tsDiagnosticsSnapshotProperties: [],
      tsRendererBootStageValues: [],
      tsSecureStoreSnapshotProperties: [],
      tsSecureStoreStatusValues: [],
      tsTauriCommandTypesExports: [],
      tsThemeModeValues: [],
      tsThemePreferenceProperties: [],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedRuntimeContractFiles: [...config.allowedRuntimeContractFiles],
      allowedRustBackendProbeFieldSurface: [...config.allowedRustBackendProbeFieldSurface],
      allowedRustDiagnosticsSnapshotFieldSurface: [...config.allowedRustDiagnosticsSnapshotFieldSurface],
      allowedRustModelSerdeRenameAll: { ...config.allowedRustModelSerdeRenameAll },
      allowedRustRuntimeModelExternalReferenceFiles: [...config.allowedRustRuntimeModelExternalReferenceFiles],
      allowedRustRuntimeModelPublicItems: [...config.allowedRustRuntimeModelPublicItems],
      allowedRustThemeModeMethodSignatures: { ...config.allowedRustThemeModeMethodSignatures },
      allowedRustThemeModePublicMethods: [...config.allowedRustThemeModePublicMethods],
      allowedRustThemeModeVariants: [...config.allowedRustThemeModeVariants],
      allowedRustThemePreferenceFieldSurface: [...config.allowedRustThemePreferenceFieldSurface],
      allowedTsBackendProbeProperties: [...config.allowedTsBackendProbeProperties],
      allowedTsDesktopCommandNameTypeText: config.allowedTsDesktopCommandNameTypeText,
      allowedTsDesktopCommandPayloadEntries: [...config.allowedTsDesktopCommandPayloadEntries],
      allowedTsDesktopCommandResultEntries: [...config.allowedTsDesktopCommandResultEntries],
      allowedTsDesktopRuntimeExports: [...config.allowedTsDesktopRuntimeExports],
      allowedTsDesktopRuntimeMethods: [...config.allowedTsDesktopRuntimeMethods],
      allowedTsDiagnosticsSnapshotProperties: [...config.allowedTsDiagnosticsSnapshotProperties],
      allowedTsRendererBootStageValues: [...config.allowedTsRendererBootStageValues],
      allowedTsRuntimeContractsExports: [...config.allowedTsRuntimeContractsExports],
      allowedTsSecureStoreSnapshotProperties: [...config.allowedTsSecureStoreSnapshotProperties],
      allowedTsSecureStoreStatusValues: [...config.allowedTsSecureStoreStatusValues],
      allowedTsTauriCommandTypesExports: [...config.allowedTsTauriCommandTypesExports],
      allowedTsThemeModeValues: [...config.allowedTsThemeModeValues],
      allowedTsThemePreferenceProperties: [...config.allowedTsThemePreferenceProperties],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: "runtime-contract-governance-test",
      rustBackendProbeFields: [],
      rustDiagnosticsSnapshotFields: [],
      rustModelReferenceFiles: [],
      rustPublicItems: [],
      rustThemeModeMethods: [],
      rustThemeModeVariants: [],
      rustThemePreferenceFields: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tsBackendProbeProperties: [],
      tsContractExports: [],
      tsDesktopCommandNameType: null,
      tsDesktopCommandPayloadEntries: [],
      tsDesktopCommandResultEntries: [],
      tsDesktopRuntimeExports: [],
      tsDesktopRuntimeMethods: [],
      tsDiagnosticsSnapshotProperties: [],
      tsRendererBootStageValues: [],
      tsSecureStoreSnapshotProperties: [],
      tsSecureStoreStatusValues: [],
      tsTauriCommandTypesExports: [],
      tsThemeModeValues: [],
      tsThemePreferenceProperties: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3RuntimeContractGovernanceCli({
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
      "desktop-v3 runtime contract governance passed. Summary: /tmp/runtime-contract-governance/summary.json | Latest: /tmp/runtime-contract-governance/latest.json",
    );
  });
});
