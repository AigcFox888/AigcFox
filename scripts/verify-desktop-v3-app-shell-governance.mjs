import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3AppShellGovernanceFailureMessage,
  collectDesktopV3AppShellGovernanceViolations,
  createDesktopV3AppShellGovernanceSummary,
  resolveDesktopV3AppShellGovernanceConfig,
} from "./lib/desktop-v3-app-shell-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3AppShellGovernanceHelpText() {
  return [
    "desktop-v3 app shell governance verifier",
    "",
    "Scans src/app and fails closed when the frozen Wave 1 app shell / router / provider boundary drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_APP_SHELL_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_APP_SHELL_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - src/app non-test source file set stays frozen at the current Wave 1 app shell boundary",
    "  - App, bootstrap, provider, router, and layout modules keep their current declaration surfaces and prop/type contracts",
    "  - route-registry path truth, navigation bindings, and initial routes stay pinned to the current shell route set",
    "  - main entry, provider stack, router entry, route shell, and layout shell ownership edges stay fixed",
  ].join("\n");
}

export async function runDesktopV3AppShellGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3AppShellGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3AppShellGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3AppShellGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3AppShellGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const result = await collectViolationsImpl(config);

        summary.appFiles = result.appFiles;
        summary.appProvidersProperties = result.appProvidersProperties;
        summary.appProvidersReferenceFiles = result.appProvidersReferenceFiles;
        summary.appProvidersSurface = result.appProvidersSurface;
        summary.appReferenceFiles = result.appReferenceFiles;
        summary.appShellReferenceFiles = result.appShellReferenceFiles;
        summary.appShellSurface = result.appShellSurface;
        summary.appSurface = result.appSurface;
        summary.checkedAt = new Date().toISOString();
        summary.initialRouteValues = result.initialRouteValues;
        summary.layoutModeValues = result.layoutModeValues;
        summary.navigationItemProperties = result.navigationItemProperties;
        summary.pageHeaderProperties = result.pageHeaderProperties;
        summary.pageHeaderReferenceFiles = result.pageHeaderReferenceFiles;
        summary.pageHeaderSurface = result.pageHeaderSurface;
        summary.primaryNavigationHrefBindings = result.primaryNavigationHrefBindings;
        summary.rendererReadyOptionProperties = result.rendererReadyOptionProperties;
        summary.rendererReadyReferenceFiles = result.rendererReadyReferenceFiles;
        summary.rendererReadySurface = result.rendererReadySurface;
        summary.routeHandleProperties = result.routeHandleProperties;
        summary.routeRegistryPathValues = result.routeRegistryPathValues;
        summary.routeRegistryReferenceFiles = result.routeRegistryReferenceFiles;
        summary.routeRegistrySurface = result.routeRegistrySurface;
        summary.routerIndexReferenceFiles = result.routerIndexReferenceFiles;
        summary.routerIndexSurface = result.routerIndexSurface;
        summary.routesReferenceFiles = result.routesReferenceFiles;
        summary.routesSurface = result.routesSurface;
        summary.scannedFileCount = result.scannedFileCount;
        summary.scannedFiles = result.scannedFiles;
        summary.secondaryNavigationHrefBindings = result.secondaryNavigationHrefBindings;
        summary.shellScaffoldProperties = result.shellScaffoldProperties;
        summary.shellScaffoldReferenceFiles = result.shellScaffoldReferenceFiles;
        summary.shellScaffoldSurface = result.shellScaffoldSurface;
        summary.sidebarProperties = result.sidebarProperties;
        summary.sidebarReferenceFiles = result.sidebarReferenceFiles;
        summary.sidebarSurface = result.sidebarSurface;
        summary.themeProviderProperties = result.themeProviderProperties;
        summary.themeProviderReferenceFiles = result.themeProviderReferenceFiles;
        summary.themeProviderSurface = result.themeProviderSurface;
        summary.violationCount = result.violations.length;
        summary.violations = result.violations;
        summary.status = result.violations.length === 0 ? "passed" : "failed";
        summary.error =
          result.violations.length === 0 ? null : buildDesktopV3AppShellGovernanceFailureMessage(summary);

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
      `desktop-v3 app shell governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3AppShellGovernanceCli({ argv });
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
