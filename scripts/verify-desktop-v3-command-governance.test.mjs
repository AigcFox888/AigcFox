import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3CommandGovernanceHelpText,
  runDesktopV3CommandGovernanceCli,
} from "./verify-desktop-v3-command-governance.mjs";

describe("verify-desktop-v3-command-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3CommandGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          commandModules: [],
          commands: [],
          missingCommands: [],
          missingModuleNames: [],
          moduleDeclarations: [],
          scannedFileCount: 0,
          scannedFiles: [],
          supportFunctions: [],
          traceCalls: [],
          useStatements: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3CommandGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedCommandModules: ["backend.rs"],
      allowedCommands: ["desktop_get_backend_liveness"],
      allowedModuleNames: ["backend"],
      allowedSupportFunctions: ["trace_desktop_command"],
      latestSummaryPath: "/tmp/command-governance/latest.json",
      outputDir: "/tmp/command-governance",
      summaryPath: "/tmp/command-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      commandModules: ["backend.rs"],
      commands: [{ filePath: "apps/desktop-v3/src-tauri/src/commands/backend.rs", line: 8, name: "desktop_get_backend_liveness", tauriCommand: true }],
      missingCommands: [],
      missingModuleNames: [],
      moduleDeclarations: [{ filePath: "apps/desktop-v3/src-tauri/src/commands/mod.rs", line: 1, name: "backend" }],
      scannedFileCount: 1,
      scannedFiles: ["apps/desktop-v3/src-tauri/src/commands/backend.rs"],
      supportFunctions: [{ filePath: "apps/desktop-v3/src-tauri/src/commands/mod.rs", line: 5, name: "trace_desktop_command", tauriCommand: false }],
      traceCalls: [{ filePath: "apps/desktop-v3/src-tauri/src/commands/backend.rs", line: 9, name: "desktop_get_backend_liveness" }],
      useStatements: [{ filePath: "apps/desktop-v3/src-tauri/src/commands/backend.rs", line: 1, path: "tauri::State" }],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedCommandModules: [...config.allowedCommandModules],
      allowedCommands: [...config.allowedCommands],
      allowedModuleNames: [...config.allowedModuleNames],
      allowedSupportFunctions: [...config.allowedSupportFunctions],
      checkedAt: null,
      commandModules: [],
      commands: [],
      commandsDir: "apps/desktop-v3/src-tauri/src/commands",
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      missingCommands: [],
      missingModuleNames: [],
      moduleDeclarations: [],
      outputDir: config.outputDir,
      runId: "command-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      supportFunctions: [],
      traceCalls: [],
      useStatements: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3CommandGovernanceCli({
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
      commandModules: ["backend.rs"],
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
        commandModules: ["backend.rs"],
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
      "desktop-v3 command governance passed. Summary: /tmp/command-governance/summary.json | Latest: /tmp/command-governance/latest.json",
    );
  });
});
