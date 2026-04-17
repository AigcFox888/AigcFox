import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3BackendClientGovernanceHelpText,
  runDesktopV3BackendClientGovernanceCli,
} from "./verify-desktop-v3-backend-client-governance.mjs";

describe("verify-desktop-v3-backend-client-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3BackendClientGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          backendClientMethods: [],
          backendClientReferenceFiles: [],
          clientFiles: [],
          moduleDeclarations: [],
          probeContractFunctions: [],
          probeContractReferenceFiles: [],
          probeContractTypes: [],
          probePaths: [],
          reqwestTouchFiles: [],
          scannedFileCount: 0,
          scannedFiles: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3BackendClientGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedExternalReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      allowedFiles: ["apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs"],
      allowedModuleDeclarations: ["pub mod backend_client;"],
      allowedPrivateMethods: ["get_probe"],
      allowedProbeContractPrivateFunctions: ["build_backend_error"],
      allowedProbeContractPublicFunctions: ["parse_backend_probe_envelope"],
      allowedProbeContractPublicTypes: ["BackendEnvelope"],
      allowedProbeContractReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs"],
      allowedProbePaths: ["/api/v1/healthz", "/readyz"],
      allowedPublicMethods: ["new", "base_url", "get_liveness", "get_readiness"],
      allowedReqwestTouchFiles: ["apps/desktop-v3/src-tauri/src/error.rs"],
      latestSummaryPath: "/tmp/backend-client-governance/latest.json",
      outputDir: "/tmp/backend-client-governance",
      summaryPath: "/tmp/backend-client-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      backendClientMethods: [],
      backendClientReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/mod.rs"],
      clientFiles: ["apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs"],
      moduleDeclarations: [{ filePath: "apps/desktop-v3/src-tauri/src/runtime/client/mod.rs", line: 1, name: "pub mod backend_client;" }],
      probeContractFunctions: [],
      probeContractReferenceFiles: ["apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs"],
      probeContractTypes: [],
      probePaths: [],
      reqwestTouchFiles: ["apps/desktop-v3/src-tauri/src/error.rs"],
      scannedFileCount: 1,
      scannedFiles: ["apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedExternalReferenceFiles: [...config.allowedExternalReferenceFiles],
      allowedFiles: [...config.allowedFiles],
      allowedModuleDeclarations: [...config.allowedModuleDeclarations],
      allowedPrivateMethods: [...config.allowedPrivateMethods],
      allowedProbeContractPrivateFunctions: [...config.allowedProbeContractPrivateFunctions],
      allowedProbeContractPublicFunctions: [...config.allowedProbeContractPublicFunctions],
      allowedProbeContractPublicTypes: [...config.allowedProbeContractPublicTypes],
      allowedProbeContractReferenceFiles: [...config.allowedProbeContractReferenceFiles],
      allowedProbePaths: [...config.allowedProbePaths],
      allowedPublicMethods: [...config.allowedPublicMethods],
      allowedReqwestTouchFiles: [...config.allowedReqwestTouchFiles],
      backendClientMethods: [],
      backendClientReferenceFiles: [],
      checkedAt: null,
      clientFiles: [],
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      moduleDeclarations: [],
      outputDir: config.outputDir,
      probeContractFunctions: [],
      probeContractReferenceFiles: [],
      probeContractTypes: [],
      probePaths: [],
      reqwestTouchFiles: [],
      runId: "backend-client-governance-test",
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

    const result = await runDesktopV3BackendClientGovernanceCli({
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
      "desktop-v3 backend-client governance passed. Summary: /tmp/backend-client-governance/summary.json | Latest: /tmp/backend-client-governance/latest.json",
    );
  });
});
