import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3ErrorContractGovernanceFailureMessage,
  collectDesktopV3ErrorContractViolations,
  createDesktopV3ErrorContractGovernanceSummary,
  resolveDesktopV3ErrorContractGovernanceConfig,
} from "./lib/desktop-v3-error-contract-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3ErrorContractGovernanceHelpText() {
  return [
    "desktop-v3 error contract governance verifier",
    "",
    "Scans the frozen Wave 1 error truth chain from Rust error.rs through TypeScript normalization and fails closed when cross-layer error handling drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - src-tauri/src/error.rs keeps the frozen CommandError fields, RuntimeError variants, and RuntimeError -> CommandError mapping",
    "  - RuntimeError and CommandError stay confined to the current Rust ownership files outside error.rs",
    "  - src/lib/errors/app-error.ts and normalize-command-error.ts keep the frozen AppErrorShape / CommandErrorPayload surface",
    "  - src/lib/runtime/tauri-command-runtime.ts still rethrows normalized AppError instances",
  ].join("\n");
}

export async function runDesktopV3ErrorContractGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3ErrorContractViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3ErrorContractGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3ErrorContractGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3ErrorContractGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const result = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.rustBackendVariantFields = result.rustBackendVariantFields;
        summary.rustCommandErrorExternalReferenceFiles = result.rustCommandErrorExternalReferenceFiles;
        summary.rustCommandErrorFields = result.rustCommandErrorFields;
        summary.rustCommandErrorMethodSignatures = result.rustCommandErrorMethodSignatures;
        summary.rustPublicItems = result.rustPublicItems;
        summary.rustRuntimeErrorExternalReferenceFiles = result.rustRuntimeErrorExternalReferenceFiles;
        summary.rustRuntimeErrorVariants = result.rustRuntimeErrorVariants;
        summary.scannedFileCount = result.scannedFileCount;
        summary.scannedFiles = result.scannedFiles;
        summary.status = result.violations.length === 0 ? "passed" : "failed";
        summary.tsAppErrorShapeProperties = result.tsAppErrorShapeProperties;
        summary.tsCommandErrorPayloadProperties = result.tsCommandErrorPayloadProperties;
        summary.violationCount = result.violations.length;
        summary.violations = result.violations;
        summary.error =
          result.violations.length === 0
            ? null
            : buildDesktopV3ErrorContractGovernanceFailureMessage(summary);

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
      `desktop-v3 error contract governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3ErrorContractGovernanceCli({ argv });
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
