import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3CapabilityGovernanceFailureMessage,
  collectDesktopV3CapabilityGovernanceViolations,
  createDesktopV3CapabilityGovernanceSummary,
  resolveDesktopV3CapabilityGovernanceConfig,
} from "./lib/desktop-v3-capability-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3CapabilityGovernanceHelpText() {
  return [
    "desktop-v3 capability governance verifier",
    "",
    "Scans the Wave 1 capability, permission, invoke-handler, and tauri command type surfaces and fails closed when the IPC authorization boundary drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - capability file set stays frozen at main-window.json",
    "  - main-window capability windows, remote URLs, core permissions, and app permissions stay frozen",
    "  - permissions/main-window.toml command mappings stay aligned with the current IPC surface",
    "  - Rust invoke_handler and tauri-command-types.ts stay aligned with the same command set",
  ].join("\n");
}

export async function runDesktopV3CapabilityGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3CapabilityGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3CapabilityGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3CapabilityGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3CapabilityGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          appPermissions,
          capabilityFiles,
          capabilityIdentifier,
          corePermissions,
          invokeHandlerCommands,
          payloadCommands,
          permissionEntries,
          remoteUrls,
          resultCommands,
          scannedFileCount,
          scannedFiles,
          violations,
          windows,
        } = await collectViolationsImpl(config);

        summary.appPermissions = appPermissions;
        summary.capabilityFiles = capabilityFiles;
        summary.capabilityIdentifier = capabilityIdentifier;
        summary.checkedAt = new Date().toISOString();
        summary.corePermissions = corePermissions;
        summary.invokeHandlerCommands = invokeHandlerCommands;
        summary.payloadCommands = payloadCommands;
        summary.permissionEntries = permissionEntries;
        summary.remoteUrls = remoteUrls;
        summary.resultCommands = resultCommands;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.windows = windows;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3CapabilityGovernanceFailureMessage(summary);

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
      `desktop-v3 capability governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3CapabilityGovernanceCli({ argv });
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
