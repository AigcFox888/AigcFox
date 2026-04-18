import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3SupportGovernanceFailureMessage,
  collectDesktopV3SupportGovernanceViolations,
  createDesktopV3SupportGovernanceSummary,
  resolveDesktopV3SupportGovernanceConfig,
} from "./lib/desktop-v3-support-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3SupportGovernanceHelpText() {
  return [
    "desktop-v3 support governance verifier",
    "",
    "Scans lib/errors, lib/query, and shared renderer support helpers for Wave 1 boundary drift.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_SUPPORT_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_SUPPORT_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - lib/errors + lib/query + notify/typography/utils file set stays frozen at the current Wave 1 support boundary",
    "  - command-error normalization, query support, toast support, typography tokens, and cn helper keep their current declaration surfaces and key contracts",
    "  - provider ownership, page ownership, runtime adapter ownership, and ui primitive ownership stay pinned to the current Wave 1 composition",
  ].join("\n");
}

export async function runDesktopV3SupportGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3SupportGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3SupportGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3SupportGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3SupportGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const result = await collectViolationsImpl(config);

        summary.appErrorReferenceFiles = result.appErrorReferenceFiles;
        summary.appErrorShapeProperties = result.appErrorShapeProperties;
        summary.appErrorSurface = result.appErrorSurface;
        summary.checkedAt = new Date().toISOString();
        summary.commandErrorPayloadProperties = result.commandErrorPayloadProperties;
        summary.errorSupportDetailProperties = result.errorSupportDetailProperties;
        summary.errorSupportDetailsReferenceFiles = result.errorSupportDetailsReferenceFiles;
        summary.errorSupportDetailsSurface = result.errorSupportDetailsSurface;
        summary.normalizeCommandErrorReferenceFiles = result.normalizeCommandErrorReferenceFiles;
        summary.normalizeCommandErrorSurface = result.normalizeCommandErrorSurface;
        summary.notifyKeys = result.notifyKeys;
        summary.notifyReferenceFiles = result.notifyReferenceFiles;
        summary.notifySurface = result.notifySurface;
        summary.queryClientReferenceFiles = result.queryClientReferenceFiles;
        summary.queryClientSurface = result.queryClientSurface;
        summary.queryRetryPolicyReferenceFiles = result.queryRetryPolicyReferenceFiles;
        summary.queryRetryPolicySurface = result.queryRetryPolicySurface;
        summary.scannedFileCount = result.scannedFileCount;
        summary.scannedFiles = result.scannedFiles;
        summary.status = result.violations.length === 0 ? "passed" : "failed";
        summary.supportFiles = result.supportFiles;
        summary.typographyKeys = result.typographyKeys;
        summary.typographyReferenceFiles = result.typographyReferenceFiles;
        summary.typographySurface = result.typographySurface;
        summary.utilsReferenceFiles = result.utilsReferenceFiles;
        summary.utilsSurface = result.utilsSurface;
        summary.violationCount = result.violations.length;
        summary.violations = result.violations;
        summary.error =
          result.violations.length === 0 ? null : buildDesktopV3SupportGovernanceFailureMessage(summary);

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
      `desktop-v3 support governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3SupportGovernanceCli({ argv });
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
