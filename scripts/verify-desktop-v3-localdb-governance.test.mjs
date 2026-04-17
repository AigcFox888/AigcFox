import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3LocaldbGovernanceHelpText,
  runDesktopV3LocaldbGovernanceCli,
} from "./verify-desktop-v3-localdb-governance.mjs";

describe("verify-desktop-v3-localdb-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3LocaldbGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          methods: [],
          missingPublicMethods: [],
          privateMethods: [],
          publicMethods: [],
          restrictedMethods: [],
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
    expect(logs).toEqual([buildDesktopV3LocaldbGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedPublicMethods: ["new"],
      latestSummaryPath: "/tmp/localdb-governance/latest.json",
      outputDir: "/tmp/localdb-governance",
      summaryPath: "/tmp/localdb-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      methods: [{ filePath: "apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs", line: 18, name: "new", visibility: "public" }],
      missingPublicMethods: [],
      privateMethods: [],
      publicMethods: [{ filePath: "apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs", line: 18, name: "new", visibility: "public" }],
      restrictedMethods: [],
      scannedFiles: ["apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedPublicMethods: [...config.allowedPublicMethods],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      localdbDir: "apps/desktop-v3/src-tauri/src/runtime/localdb",
      methodCount: 0,
      methods: [],
      missingPublicMethods: [],
      outputDir: config.outputDir,
      privateMethods: [],
      publicMethods: [],
      restrictedMethods: [],
      runId: "localdb-governance-test",
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

    const result = await runDesktopV3LocaldbGovernanceCli({
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
      methodCount: 1,
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
        methodCount: 1,
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
      "desktop-v3 localdb governance passed. Summary: /tmp/localdb-governance/summary.json | Latest: /tmp/localdb-governance/latest.json",
    );
  });
});
