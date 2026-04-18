import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3HostGovernanceHelpText,
  runDesktopV3HostGovernanceCli,
} from "./verify-desktop-v3-host-governance.mjs";

describe("verify-desktop-v3-host-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3HostGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          envBindings: [],
          logSignals: [],
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
    expect(logs).toEqual([buildDesktopV3HostGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedEnvBindings: [{ filePath: "apps/desktop-v3/src/app/router/initial-route.ts", name: "VITE_DESKTOP_V3_INITIAL_ROUTE" }],
      allowedLogSignals: [{ filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs", name: "desktop-v3.main-window.navigation" }],
      latestSummaryPath: "/tmp/host-governance/latest.json",
      outputDir: "/tmp/host-governance",
      sourceRootPaths: ["apps/desktop-v3/src", "apps/desktop-v3/src-tauri/src"],
      summaryPath: "/tmp/host-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      envBindings: [{ column: 9, filePath: "apps/desktop-v3/src/app/router/initial-route.ts", line: 20, name: "VITE_DESKTOP_V3_INITIAL_ROUTE" }],
      logSignals: [{ column: 15, filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs", line: 4, name: "desktop-v3.main-window.navigation" }],
      scannedFileCount: 2,
      scannedFiles: [
        "apps/desktop-v3/src/app/router/initial-route.ts",
        "apps/desktop-v3/src-tauri/src/window/telemetry.rs",
      ],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedEnvBindings: [...config.allowedEnvBindings],
      allowedLogSignals: [...config.allowedLogSignals],
      checkedAt: null,
      envBindings: [],
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      logSignals: [],
      outputDir: config.outputDir,
      runId: "host-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      sourceRoots: [...config.sourceRootPaths],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3HostGovernanceCli({
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
    expect(persistVerificationSummaryImpl).toHaveBeenCalledOnce();
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 host governance passed. Summary: /tmp/host-governance/summary.json | Latest: /tmp/host-governance/latest.json",
    );
  });
});
