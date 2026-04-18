import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3HostGovernanceFailureMessage,
  collectDesktopV3HostGovernanceViolations,
  createDesktopV3HostGovernanceSummary,
  resolveDesktopV3HostGovernanceConfig,
} from "./lib/desktop-v3-host-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3HostGovernanceHelpText() {
  return [
    "desktop-v3 host governance verifier",
    "",
    "Scans the desktop-v3 host env/log surface and fails closed when the frozen Wave 1 host boundary drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - app/runtime/window only consume the current frozen AIGCFOX_*/VITE_DESKTOP_V3_* env bindings",
    "  - desktop-v3.* host log markers stay frozen at the current main-window / startup-probe / renderer-boot / command trace surface",
    "  - any new host env binding or log signal requires a host-boundary rewrite before implementation continues",
  ].join("\n");
}

export async function runDesktopV3HostGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3HostGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3HostGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3HostGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3HostGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const result = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.envBindings = result.envBindings;
        summary.logSignals = result.logSignals;
        summary.scannedFileCount = result.scannedFileCount;
        summary.scannedFiles = result.scannedFiles;
        summary.status = result.violations.length === 0 ? "passed" : "failed";
        summary.violationCount = result.violations.length;
        summary.violations = result.violations;
        summary.error =
          result.violations.length === 0 ? null : buildDesktopV3HostGovernanceFailureMessage(summary);

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
      `desktop-v3 host governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3HostGovernanceCli({ argv });
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
