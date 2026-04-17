import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3UpdaterGovernanceFailureMessage,
  collectDesktopV3UpdaterGovernanceViolations,
  createDesktopV3UpdaterGovernanceSummary,
  resolveDesktopV3UpdaterGovernanceConfig,
} from "./lib/desktop-v3-updater-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3UpdaterGovernanceHelpText() {
  return [
    "desktop-v3 updater governance verifier",
    "",
    "Scans desktop-v3 code/config surfaces and fails closed while updater remains outside the frozen Wave 1 implementation boundary.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - Cargo.toml does not add tauri-plugin-updater yet",
    "  - renderer / Rust / capability / permission sources stay free of updater implementation markers",
    "  - shared tauri.conf.json does not pre-enable updater plugin or updater artifacts",
    "  - code does not hardcode latest.json / policy.json / minSupportedVersion / required_on_startup updater policy markers",
    "  - client code does not point updater traffic at GitHub Releases URLs",
  ].join("\n");
}

export async function runDesktopV3UpdaterGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3UpdaterGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3UpdaterGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3UpdaterGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3UpdaterGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          scannedFileCount,
          scannedFiles,
          triggeredContentRuleKinds,
          triggeredFileNameRuleKinds,
          violationCount,
          violations,
        } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.triggeredContentRuleKinds = triggeredContentRuleKinds;
        summary.triggeredFileNameRuleKinds = triggeredFileNameRuleKinds;
        summary.violationCount = violationCount;
        summary.violations = violations;
        summary.status = violationCount === 0 ? "passed" : "failed";
        summary.error =
          violationCount === 0 ? null : buildDesktopV3UpdaterGovernanceFailureMessage(summary);

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
      `desktop-v3 updater governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3UpdaterGovernanceCli({ argv });
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
