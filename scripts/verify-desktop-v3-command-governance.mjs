import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3CommandGovernanceFailureMessage,
  collectDesktopV3CommandGovernanceViolations,
  createDesktopV3CommandGovernanceSummary,
  resolveDesktopV3CommandGovernanceConfig,
} from "./lib/desktop-v3-command-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3CommandGovernanceHelpText() {
  return [
    "desktop-v3 command governance verifier",
    "",
    "Scans apps/desktop-v3/src-tauri/src/commands and fails closed when commands/* grows past the frozen Wave 1 IPC boundary.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - command module file set stays frozen at backend / diagnostics / preferences / renderer / mod.rs",
    "  - tauri command names stay frozen at the current Wave 1 IPC surface",
    "  - commands/* imports stay on tauri::State, trace_desktop_command, CommandError, DesktopRuntime, and runtime models only",
    "  - helper logic does not accumulate inside commands/*",
  ].join("\n");
}

export async function runDesktopV3CommandGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3CommandGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3CommandGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3CommandGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3CommandGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          commandModules,
          commands,
          missingCommands,
          missingModuleNames,
          moduleDeclarations,
          scannedFileCount,
          scannedFiles,
          supportFunctions,
          traceCalls,
          useStatements,
          violations,
        } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.commandModules = commandModules;
        summary.commands = commands;
        summary.missingCommands = missingCommands;
        summary.missingModuleNames = missingModuleNames;
        summary.moduleDeclarations = moduleDeclarations;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.supportFunctions = supportFunctions;
        summary.traceCalls = traceCalls;
        summary.useStatements = useStatements;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3CommandGovernanceFailureMessage(summary);

        await persistVerificationSummaryImpl(
          summary,
          {
            archiveSummaryPath: config.summaryPath,
            latestSummaryPath: config.latestSummaryPath,
          },
          {
            writeJsonFileImpl,
          },
        );
        summaryPersisted = true;

        if (summary.status !== "passed") {
          throw new Error(summary.error);
        }

        return summary;
      } catch (error) {
        if (summary.status === "running") {
          summary.checkedAt = new Date().toISOString();
          summary.error = error instanceof Error ? error.message : String(error);
          summary.status = "failed";
        }

        if (!summaryPersisted) {
          await persistVerificationSummaryImpl(
            summary,
            {
              archiveSummaryPath: config.summaryPath,
              latestSummaryPath: config.latestSummaryPath,
            },
            {
              writeJsonFileImpl,
            },
          );
        }

        throw error;
      }
    },
    successMessage: (summary) =>
      `desktop-v3 command governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3CommandGovernanceCli({ argv });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
