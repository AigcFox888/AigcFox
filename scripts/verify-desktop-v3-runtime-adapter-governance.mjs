import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3RuntimeAdapterGovernanceFailureMessage,
  collectDesktopV3RuntimeAdapterGovernanceViolations,
  createDesktopV3RuntimeAdapterGovernanceSummary,
  resolveDesktopV3RuntimeAdapterGovernanceConfig,
} from "./lib/desktop-v3-runtime-adapter-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3RuntimeAdapterGovernanceHelpText() {
  return [
    "desktop-v3 runtime adapter governance verifier",
    "",
    "Scans src/lib/runtime and fails closed when the frozen Wave 1 renderer runtime adapter skeleton drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - src/lib/runtime non-test source file set stays frozen at the current Wave 1 adapter boundary",
    "  - MockCommandRuntime, mock-fixtures, runtime-mode, runtime-registry, tauri-bridge, tauri-command-runtime, and tauri-invoke keep the current export and member surfaces",
    "  - @tauri-apps imports and Tauri bridge globals stay isolated to tauri-bridge.ts",
    "  - runtime-registry, runtime-mode, tauri-bridge, tauri runtime adapter, mock runtime adapter, mock fixtures, and TauriInvoke keep their current source-level ownership edges",
  ].join("\n");
}

export async function runDesktopV3RuntimeAdapterGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3RuntimeAdapterGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl =
    options.createSummaryImpl ?? createDesktopV3RuntimeAdapterGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl =
    options.resolveConfigImpl ?? resolveDesktopV3RuntimeAdapterGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3RuntimeAdapterGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          bridgeGlobalTouchFiles,
          mockCommandRuntimeReferenceFiles,
          mockFixtureExports,
          mockFixtureReferenceFiles,
          mockRuntimeExports,
          mockRuntimeFields,
          mockRuntimeMethods,
          runtimeFiles,
          runtimeModeExports,
          runtimeModeReferenceFiles,
          runtimeModeValues,
          runtimeRegistryExports,
          runtimeRegistryReferenceFiles,
          scannedFileCount,
          scannedFiles,
          tauriBridgeExports,
          tauriBridgeReferenceFiles,
          tauriCommandRuntimeExports,
          tauriCommandRuntimeFields,
          tauriCommandRuntimeMethods,
          tauriCommandRuntimeReferenceFiles,
          tauriInvokeExports,
          tauriInvokeReferenceFiles,
          tauriInvokeType,
          tauriTouchFiles,
          violations,
        } = await collectViolationsImpl(config);

        summary.bridgeGlobalTouchFiles = bridgeGlobalTouchFiles;
        summary.checkedAt = new Date().toISOString();
        summary.mockCommandRuntimeReferenceFiles = mockCommandRuntimeReferenceFiles;
        summary.mockFixtureExports = mockFixtureExports;
        summary.mockFixtureReferenceFiles = mockFixtureReferenceFiles;
        summary.mockRuntimeExports = mockRuntimeExports;
        summary.mockRuntimeFields = mockRuntimeFields;
        summary.mockRuntimeMethods = mockRuntimeMethods;
        summary.runtimeFiles = runtimeFiles;
        summary.runtimeModeExports = runtimeModeExports;
        summary.runtimeModeReferenceFiles = runtimeModeReferenceFiles;
        summary.runtimeModeValues = runtimeModeValues;
        summary.runtimeRegistryExports = runtimeRegistryExports;
        summary.runtimeRegistryReferenceFiles = runtimeRegistryReferenceFiles;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.tauriBridgeExports = tauriBridgeExports;
        summary.tauriBridgeReferenceFiles = tauriBridgeReferenceFiles;
        summary.tauriCommandRuntimeExports = tauriCommandRuntimeExports;
        summary.tauriCommandRuntimeFields = tauriCommandRuntimeFields;
        summary.tauriCommandRuntimeMethods = tauriCommandRuntimeMethods;
        summary.tauriCommandRuntimeReferenceFiles = tauriCommandRuntimeReferenceFiles;
        summary.tauriInvokeExports = tauriInvokeExports;
        summary.tauriInvokeReferenceFiles = tauriInvokeReferenceFiles;
        summary.tauriInvokeType = tauriInvokeType;
        summary.tauriTouchFiles = tauriTouchFiles;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3RuntimeAdapterGovernanceFailureMessage(summary);

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
      `desktop-v3 runtime adapter governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3RuntimeAdapterGovernanceCli({ argv });
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
