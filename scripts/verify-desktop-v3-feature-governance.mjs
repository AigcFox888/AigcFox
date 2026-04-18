import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3FeatureGovernanceFailureMessage,
  collectDesktopV3FeatureGovernanceViolations,
  createDesktopV3FeatureGovernanceSummary,
  resolveDesktopV3FeatureGovernanceConfig,
} from "./lib/desktop-v3-feature-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3FeatureGovernanceHelpText() {
  return [
    "desktop-v3 feature governance verifier",
    "",
    "Scans src/features and fails closed when the frozen Wave 1 diagnostics/preferences feature boundary drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_FEATURE_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_FEATURE_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - src/features/diagnostics + src/features/preferences file set stays frozen at the current Wave 1 boundary",
    "  - diagnostics/preferences feature modules keep their current top-level declaration surfaces and view-model/store shapes",
    "  - page/provider ownership stays pinned to diagnostics-api, diagnostics-formatters, preferences-api, preferences-store, and preferences-types",
  ].join("\n");
}

export async function runDesktopV3FeatureGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3FeatureGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3FeatureGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3FeatureGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3FeatureGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          diagnosticsApiReferenceFiles,
          diagnosticsApiSurface,
          diagnosticsFormatterReferenceFiles,
          diagnosticsFormatterSurface,
          diagnosticsOverviewProperties,
          diagnosticsTypesReferenceFiles,
          diagnosticsTypesSurface,
          featureFiles,
          preferencesApiReferenceFiles,
          preferencesApiSurface,
          preferencesStoreReferenceFiles,
          preferencesStoreSurface,
          preferencesTypesReferenceFiles,
          preferencesTypesSurface,
          scannedFileCount,
          scannedFiles,
          themePreferenceStateProperties,
          violations,
        } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.diagnosticsApiReferenceFiles = diagnosticsApiReferenceFiles;
        summary.diagnosticsApiSurface = diagnosticsApiSurface;
        summary.diagnosticsFormatterReferenceFiles = diagnosticsFormatterReferenceFiles;
        summary.diagnosticsFormatterSurface = diagnosticsFormatterSurface;
        summary.diagnosticsOverviewProperties = diagnosticsOverviewProperties;
        summary.diagnosticsTypesReferenceFiles = diagnosticsTypesReferenceFiles;
        summary.diagnosticsTypesSurface = diagnosticsTypesSurface;
        summary.featureFiles = featureFiles;
        summary.preferencesApiReferenceFiles = preferencesApiReferenceFiles;
        summary.preferencesApiSurface = preferencesApiSurface;
        summary.preferencesStoreReferenceFiles = preferencesStoreReferenceFiles;
        summary.preferencesStoreSurface = preferencesStoreSurface;
        summary.preferencesTypesReferenceFiles = preferencesTypesReferenceFiles;
        summary.preferencesTypesSurface = preferencesTypesSurface;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.themePreferenceStateProperties = themePreferenceStateProperties;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3FeatureGovernanceFailureMessage(summary);

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
      `desktop-v3 feature governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3FeatureGovernanceCli({ argv });
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
