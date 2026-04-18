import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3ErrorContractGovernanceHelpText,
  runDesktopV3ErrorContractGovernanceCli,
} from "./verify-desktop-v3-error-contract-governance.mjs";

describe("verify-desktop-v3-error-contract-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3ErrorContractGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          rustBackendVariantFields: [],
          rustCommandErrorExternalReferenceFiles: [],
          rustCommandErrorFields: [],
          rustCommandErrorMethodSignatures: {},
          rustPublicItems: [],
          rustRuntimeErrorExternalReferenceFiles: [],
          rustRuntimeErrorVariants: [],
          scannedFileCount: 0,
          scannedFiles: [],
          tsAppErrorShapeProperties: [],
          tsCommandErrorPayloadProperties: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3ErrorContractGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      latestSummaryPath: "/tmp/error-governance/latest.json",
      outputDir: "/tmp/error-governance",
      summaryPath: "/tmp/error-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      rustBackendVariantFields: ["code", "message", "request_id"],
      rustCommandErrorExternalReferenceFiles: [
        "apps/desktop-v3/src-tauri/src/commands/backend.rs",
      ],
      rustCommandErrorFields: ["public:code", "public:message", "public:request_id"],
      rustCommandErrorMethodSignatures: {
        new: "pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self",
      },
      rustPublicItems: ["enum:RuntimeError", "struct:CommandError"],
      rustRuntimeErrorExternalReferenceFiles: [
        "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
      ],
      rustRuntimeErrorVariants: ["Backend", "Internal", "NotReady"],
      scannedFileCount: 4,
      scannedFiles: [
        "apps/desktop-v3/src-tauri/src/error.rs",
        "apps/desktop-v3/src/lib/errors/app-error.ts",
        "apps/desktop-v3/src/lib/errors/normalize-command-error.ts",
        "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
      ],
      tsAppErrorShapeProperties: ["code: string", "message: string", "requestId?: string"],
      tsCommandErrorPayloadProperties: ["code?: string", "message?: string", "requestId?: string"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: "error-governance-test",
      rustBackendVariantFields: [],
      rustCommandErrorExternalReferenceFiles: [],
      rustCommandErrorFields: [],
      rustCommandErrorMethodSignatures: {},
      rustPublicItems: [],
      rustRuntimeErrorExternalReferenceFiles: [],
      rustRuntimeErrorVariants: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tsAppErrorShapeProperties: [],
      tsCommandErrorPayloadProperties: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3ErrorContractGovernanceCli({
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
    expect(persistVerificationSummaryImpl).toHaveBeenCalledOnce();
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 error contract governance passed. Summary: /tmp/error-governance/summary.json | Latest: /tmp/error-governance/latest.json",
    );
  });
});
