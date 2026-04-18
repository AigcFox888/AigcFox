import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3UpdaterGovernanceHelpText,
  runDesktopV3UpdaterGovernanceCli,
} from "./verify-desktop-v3-updater-governance.mjs";

describe("verify-desktop-v3-updater-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3UpdaterGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          scannedFileCount: 0,
          scannedFiles: [],
          triggeredContentRuleKinds: [],
          triggeredFileNameRuleKinds: [],
          violationCount: 0,
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3UpdaterGovernanceHelpText()]);
    expect(logs[0]).toContain("first-install packages only");
    expect(logs[0]).toContain("Qiniu Kodo / self-hosted HTTPS");
    expect(logs[0]).toContain("must_update_on_next_launch");
    expect(logs[0]).toContain("do not interrupt the running session");
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      latestSummaryPath: "/tmp/updater-governance/latest.json",
      outputDir: "/tmp/updater-governance",
      requiredFiles: [
        "apps/desktop-v3/src-tauri/Cargo.toml",
        "apps/desktop-v3/src-tauri/tauri.conf.json",
      ],
      rootDir: "/tmp/workspace",
      sourceRoots: ["apps/desktop-v3/src", "apps/desktop-v3/src-tauri/src"],
      summaryPath: "/tmp/updater-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      scannedFileCount: 2,
      scannedFiles: [
        "apps/desktop-v3/src-tauri/Cargo.toml",
        "apps/desktop-v3/src-tauri/tauri.conf.json",
      ],
      triggeredContentRuleKinds: [],
      triggeredFileNameRuleKinds: [],
      violationCount: 0,
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      checkedAt: null,
      error: null,
      forbiddenContentRuleIds: [],
      forbiddenFileNameRuleIds: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      requiredFiles: [...config.requiredFiles],
      rootDir: config.rootDir,
      runId: "updater-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      sourceRoots: [...config.sourceRoots],
      status: "running",
      summaryPath: config.summaryPath,
      triggeredContentRuleKinds: [],
      triggeredFileNameRuleKinds: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3UpdaterGovernanceCli({
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
      scannedFileCount: 2,
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
        scannedFileCount: 2,
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
      "desktop-v3 updater governance passed. Summary: /tmp/updater-governance/summary.json | Latest: /tmp/updater-governance/latest.json",
    );
  });
});
