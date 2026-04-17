import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3RuntimeBoundaryHelpText,
  runDesktopV3RuntimeBoundaryCli,
} from "./verify-desktop-v3-runtime-boundary.mjs";

describe("verify-desktop-v3-runtime-boundary", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3RuntimeBoundaryCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return { scannedFiles: [], violations: [] };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3RuntimeBoundaryHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      latestSummaryPath: "/tmp/runtime-boundary/latest.json",
      outputDir: "/tmp/runtime-boundary",
      summaryPath: "/tmp/runtime-boundary/summary.json",
    };
    const summary = {
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      summaryPath: config.summaryPath,
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      scannedFiles: ["apps/desktop-v3/src/app/app-shell.tsx"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      ...summary,
      checkedAt: null,
      error: null,
      runId: "runtime-boundary-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3RuntimeBoundaryCli({
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
      "desktop-v3 runtime boundary passed. Summary: /tmp/runtime-boundary/summary.json | Latest: /tmp/runtime-boundary/latest.json",
    );
  });
});
