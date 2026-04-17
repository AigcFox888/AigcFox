import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3RuntimeBoundaryFailureMessage,
  collectDesktopV3RuntimeBoundaryViolations,
  createDesktopV3RuntimeBoundarySummary,
  resolveDesktopV3RuntimeBoundaryConfig,
} from "./lib/desktop-v3-runtime-boundary.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3RuntimeBoundaryHelpText() {
  return [
    "desktop-v3 runtime boundary verifier",
    "",
    "Scans apps/desktop-v3/src and fails closed when files outside src/lib/runtime/* touch Tauri directly.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - direct @tauri-apps/* imports outside src/lib/runtime/*",
    "  - dynamic Tauri imports outside src/lib/runtime/*",
    "  - direct invoke() calls outside src/lib/runtime/*",
    "  - direct __TAURI__/__TAURI_INTERNALS__ bridge access outside src/lib/runtime/*",
  ].join("\n");
}

export async function runDesktopV3RuntimeBoundaryCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl = options.collectViolationsImpl ?? collectDesktopV3RuntimeBoundaryViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3RuntimeBoundarySummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3RuntimeBoundaryConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3RuntimeBoundaryHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const { scannedFiles, violations } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.scannedFileCount = scannedFiles.length;
        summary.scannedFiles = scannedFiles;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3RuntimeBoundaryFailureMessage(summary);

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
      `desktop-v3 runtime boundary passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3RuntimeBoundaryCli({ argv });
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
