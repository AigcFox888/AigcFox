import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3PlatformConfigGovernanceFailureMessage,
  collectDesktopV3PlatformConfigGovernanceViolations,
  createDesktopV3PlatformConfigGovernanceSummary,
  resolveDesktopV3PlatformConfigGovernanceConfig,
} from "./lib/desktop-v3-platform-config-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3PlatformConfigGovernanceHelpText() {
  return [
    "desktop-v3 platform config governance verifier",
    "",
    "Scans apps/desktop-v3/src-tauri/tauri*.conf.json and fails closed when shared Tauri config drifts past the frozen Wave 1 platform-config boundary.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - tauri config file set stays frozen at tauri.conf.json only",
    "  - tauri.conf.json top-level/build/app/bundle keys stay on the current shared Wave 1 surface",
    "  - shared build, security, window, and bundle values stay aligned with the current cross-platform baseline",
    "  - platform override files remain future planned outputs until the split rewrite lands",
  ].join("\n");
}

export async function runDesktopV3PlatformConfigGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3PlatformConfigGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3PlatformConfigGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3PlatformConfigGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3PlatformConfigGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          appKeys,
          buildConfig,
          buildKeys,
          bundleConfig,
          bundleKeys,
          configFiles,
          scannedFileCount,
          scannedFiles,
          securityConfig,
          securityKeys,
          stringFields,
          topLevelKeys,
          violations,
          windowKeySets,
          windows,
        } = await collectViolationsImpl(config);

        summary.appKeys = appKeys;
        summary.buildConfig = buildConfig;
        summary.buildKeys = buildKeys;
        summary.bundleConfig = bundleConfig;
        summary.bundleKeys = bundleKeys;
        summary.checkedAt = new Date().toISOString();
        summary.configFiles = configFiles;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.securityConfig = securityConfig;
        summary.securityKeys = securityKeys;
        summary.stringFields = stringFields;
        summary.topLevelKeys = topLevelKeys;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.windowKeySets = windowKeySets;
        summary.windows = windows;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3PlatformConfigGovernanceFailureMessage(summary);

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
      `desktop-v3 platform config governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3PlatformConfigGovernanceCli({ argv });
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
