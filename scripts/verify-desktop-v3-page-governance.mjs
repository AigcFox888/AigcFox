import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3PageGovernanceFailureMessage,
  collectDesktopV3PageGovernanceViolations,
  createDesktopV3PageGovernanceSummary,
  resolveDesktopV3PageGovernanceConfig,
} from "./lib/desktop-v3-page-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3PageGovernanceHelpText() {
  return [
    "desktop-v3 page governance verifier",
    "",
    "Scans src/pages, shared state components, navigation presentation, and shell hooks for Wave 1 boundary drift.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_PAGE_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_PAGE_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - src/pages + components/navigation + components/states + hooks file set stays frozen at the current Wave 1 page boundary",
    "  - dashboard/diagnostics/preferences pages, shared state components, and shell hooks keep their current declaration surfaces and prop contracts",
    "  - route ownership, sidebar ownership, page-state ownership, and app-shell hook ownership stay pinned to the current Wave 1 composition",
  ].join("\n");
}

export async function runDesktopV3PageGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3PageGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3PageGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3PageGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3PageGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const result = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.dashboardPageReferenceFiles = result.dashboardPageReferenceFiles;
        summary.dashboardPageSurface = result.dashboardPageSurface;
        summary.dashboardQuickLinkHrefs = result.dashboardQuickLinkHrefs;
        summary.diagnosticsPageReferenceFiles = result.diagnosticsPageReferenceFiles;
        summary.diagnosticsPageSurface = result.diagnosticsPageSurface;
        summary.emptyStateProperties = result.emptyStateProperties;
        summary.emptyStateReferenceFiles = result.emptyStateReferenceFiles;
        summary.emptyStateSurface = result.emptyStateSurface;
        summary.errorStateProperties = result.errorStateProperties;
        summary.errorStateReferenceFiles = result.errorStateReferenceFiles;
        summary.errorStateSurface = result.errorStateSurface;
        summary.keyboardShortcutsReferenceFiles = result.keyboardShortcutsReferenceFiles;
        summary.keyboardShortcutsSurface = result.keyboardShortcutsSurface;
        summary.loadingStateProperties = result.loadingStateProperties;
        summary.loadingStateReferenceFiles = result.loadingStateReferenceFiles;
        summary.loadingStateSurface = result.loadingStateSurface;
        summary.navItemProperties = result.navItemProperties;
        summary.navItemReferenceFiles = result.navItemReferenceFiles;
        summary.navItemSurface = result.navItemSurface;
        summary.preferencesPageReferenceFiles = result.preferencesPageReferenceFiles;
        summary.preferencesPageSurface = result.preferencesPageSurface;
        summary.preferencesThemeValues = result.preferencesThemeValues;
        summary.presentationFiles = result.presentationFiles;
        summary.scannedFileCount = result.scannedFileCount;
        summary.scannedFiles = result.scannedFiles;
        summary.shellLayoutModeValues = result.shellLayoutModeValues;
        summary.shellLayoutProperties = result.shellLayoutProperties;
        summary.shellLayoutReferenceFiles = result.shellLayoutReferenceFiles;
        summary.shellLayoutSurface = result.shellLayoutSurface;
        summary.violationCount = result.violations.length;
        summary.violations = result.violations;
        summary.status = result.violations.length === 0 ? "passed" : "failed";
        summary.error =
          result.violations.length === 0 ? null : buildDesktopV3PageGovernanceFailureMessage(summary);

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
      `desktop-v3 page governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3PageGovernanceCli({ argv });
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
