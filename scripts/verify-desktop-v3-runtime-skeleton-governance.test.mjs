import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3RuntimeSkeletonGovernanceHelpText,
  runDesktopV3RuntimeSkeletonGovernanceCli,
} from "./verify-desktop-v3-runtime-skeleton-governance.mjs";

describe("verify-desktop-v3-runtime-skeleton-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3RuntimeSkeletonGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          diagnosticsFields: [],
          diagnosticsMethods: [],
          diagnosticsReferenceFiles: [],
          externalDiagnosticsReferenceFiles: [],
          externalSecurityReferenceFiles: [],
          externalStateReferenceFiles: [],
          runtimeSkeletonFiles: [],
          scannedFileCount: 0,
          scannedFiles: [],
          securityEnumVariants: [],
          securityMethods: [],
          securityReferenceFiles: [],
          securitySnapshotFields: [],
          stateMethods: [],
          stateReferenceFiles: [],
          stateSessionFields: [],
          stateSnapshotFields: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3RuntimeSkeletonGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedDiagnosticsExternalReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      allowedDiagnosticsFieldSurface: ["private:app_version"],
      allowedDiagnosticsMethodSignatures: { new: "pub fn new() -> Self" },
      allowedDiagnosticsPublicMethods: ["new"],
      allowedRuntimeSkeletonFiles: ["apps/desktop-v3/src-tauri/src/runtime/diagnostics/mod.rs"],
      allowedSecurityExternalReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      allowedSecurityMethodSignatures: { snapshot: "pub fn snapshot(&self) -> SecureStoreSnapshot" },
      allowedSecurityPublicMethods: ["snapshot"],
      allowedSecuritySnapshotFieldSurface: ["public:provider"],
      allowedSecurityStatusVariants: ["Reserved"],
      allowedStateExternalReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      allowedStateMethodSignatures: { snapshot: "pub async fn snapshot(&self) -> SessionSnapshot" },
      allowedStatePublicMethods: ["snapshot"],
      allowedStateSessionFieldSurface: ["private:inner"],
      allowedStateSnapshotFieldSurface: ["public:last_backend_probe_at"],
      latestSummaryPath: "/tmp/runtime-skeleton-governance/latest.json",
      outputDir: "/tmp/runtime-skeleton-governance",
      summaryPath: "/tmp/runtime-skeleton-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      diagnosticsFields: [],
      diagnosticsMethods: [],
      diagnosticsReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      externalDiagnosticsReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      externalSecurityReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      externalStateReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      runtimeSkeletonFiles: ["apps/desktop-v3/src-tauri/src/runtime/diagnostics/mod.rs"],
      scannedFileCount: 1,
      scannedFiles: ["apps/desktop-v3/src-tauri/src/runtime/diagnostics/mod.rs"],
      securityEnumVariants: [],
      securityMethods: [],
      securityReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      securitySnapshotFields: [],
      stateMethods: [],
      stateReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      stateSessionFields: [],
      stateSnapshotFields: [],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedDiagnosticsExternalReferenceFiles: [...config.allowedDiagnosticsExternalReferenceFiles],
      allowedDiagnosticsFieldSurface: [...config.allowedDiagnosticsFieldSurface],
      allowedDiagnosticsMethodSignatures: { ...config.allowedDiagnosticsMethodSignatures },
      allowedDiagnosticsPublicMethods: [...config.allowedDiagnosticsPublicMethods],
      allowedRuntimeSkeletonFiles: [...config.allowedRuntimeSkeletonFiles],
      allowedSecurityExternalReferenceFiles: [...config.allowedSecurityExternalReferenceFiles],
      allowedSecurityMethodSignatures: { ...config.allowedSecurityMethodSignatures },
      allowedSecurityPublicMethods: [...config.allowedSecurityPublicMethods],
      allowedSecuritySnapshotFieldSurface: [...config.allowedSecuritySnapshotFieldSurface],
      allowedSecurityStatusVariants: [...config.allowedSecurityStatusVariants],
      allowedStateExternalReferenceFiles: [...config.allowedStateExternalReferenceFiles],
      allowedStateMethodSignatures: { ...config.allowedStateMethodSignatures },
      allowedStatePublicMethods: [...config.allowedStatePublicMethods],
      allowedStateSessionFieldSurface: [...config.allowedStateSessionFieldSurface],
      allowedStateSnapshotFieldSurface: [...config.allowedStateSnapshotFieldSurface],
      checkedAt: null,
      diagnosticsFields: [],
      diagnosticsMethods: [],
      diagnosticsReferenceFiles: [],
      error: null,
      externalDiagnosticsReferenceFiles: [],
      externalSecurityReferenceFiles: [],
      externalStateReferenceFiles: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: "runtime-skeleton-governance-test",
      runtimeSkeletonFiles: [],
      scannedFileCount: 0,
      scannedFiles: [],
      securityEnumVariants: [],
      securityMethods: [],
      securityReferenceFiles: [],
      securitySnapshotFields: [],
      stateMethods: [],
      stateReferenceFiles: [],
      stateSessionFields: [],
      stateSnapshotFields: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3RuntimeSkeletonGovernanceCli({
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
      "desktop-v3 runtime skeleton governance passed. Summary: /tmp/runtime-skeleton-governance/summary.json | Latest: /tmp/runtime-skeleton-governance/latest.json",
    );
  });
});
