import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3RuntimeContractGovernanceFailureMessage,
  collectDesktopV3RuntimeContractGovernanceViolations,
  createDesktopV3RuntimeContractGovernanceSummary,
  resolveDesktopV3RuntimeContractGovernanceConfig,
} from "./lib/desktop-v3-runtime-contract-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3RuntimeContractGovernanceHelpText() {
  return [
    "desktop-v3 runtime contract governance verifier",
    "",
    "Scans the Rust runtime model surface and the TypeScript desktop runtime contracts, then fails closed when the frozen Wave 1 cross-boundary contract drifts.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - runtime/models.rs public items, ThemeMode variants/methods, serde rename_all, and snapshot/probe field surfaces stay frozen",
    "  - Rust runtime model usage stays confined to the current commands/runtime/client/runtime owners",
    "  - src/lib/runtime/contracts.ts exported unions/interfaces stay frozen at the current Wave 1 field surface",
    "  - src/lib/runtime/desktop-runtime.ts keeps the current DesktopRuntime interface and RendererBootStage union",
    "  - src/lib/runtime/tauri-command-types.ts keeps the current payload/result maps and DesktopCommandName alias",
  ].join("\n");
}

export async function runDesktopV3RuntimeContractGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3RuntimeContractGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3RuntimeContractGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3RuntimeContractGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3RuntimeContractGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          rustBackendProbeFields,
          rustDiagnosticsSnapshotFields,
          rustModelReferenceFiles,
          rustPublicItems,
          rustThemeModeMethods,
          rustThemeModeVariants,
          rustThemePreferenceFields,
          scannedFileCount,
          scannedFiles,
          tsBackendProbeProperties,
          tsContractExports,
          tsDesktopCommandNameType,
          tsDesktopCommandPayloadEntries,
          tsDesktopCommandResultEntries,
          tsDesktopRuntimeExports,
          tsDesktopRuntimeMethods,
          tsDiagnosticsSnapshotProperties,
          tsRendererBootStageValues,
          tsSecureStoreSnapshotProperties,
          tsSecureStoreStatusValues,
          tsTauriCommandTypesExports,
          tsThemeModeValues,
          tsThemePreferenceProperties,
          violations,
        } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.rustBackendProbeFields = rustBackendProbeFields;
        summary.rustDiagnosticsSnapshotFields = rustDiagnosticsSnapshotFields;
        summary.rustModelReferenceFiles = rustModelReferenceFiles;
        summary.rustPublicItems = rustPublicItems;
        summary.rustThemeModeMethods = rustThemeModeMethods;
        summary.rustThemeModeVariants = rustThemeModeVariants;
        summary.rustThemePreferenceFields = rustThemePreferenceFields;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.tsBackendProbeProperties = tsBackendProbeProperties;
        summary.tsContractExports = tsContractExports;
        summary.tsDesktopCommandNameType = tsDesktopCommandNameType;
        summary.tsDesktopCommandPayloadEntries = tsDesktopCommandPayloadEntries;
        summary.tsDesktopCommandResultEntries = tsDesktopCommandResultEntries;
        summary.tsDesktopRuntimeExports = tsDesktopRuntimeExports;
        summary.tsDesktopRuntimeMethods = tsDesktopRuntimeMethods;
        summary.tsDiagnosticsSnapshotProperties = tsDiagnosticsSnapshotProperties;
        summary.tsRendererBootStageValues = tsRendererBootStageValues;
        summary.tsSecureStoreSnapshotProperties = tsSecureStoreSnapshotProperties;
        summary.tsSecureStoreStatusValues = tsSecureStoreStatusValues;
        summary.tsTauriCommandTypesExports = tsTauriCommandTypesExports;
        summary.tsThemeModeValues = tsThemeModeValues;
        summary.tsThemePreferenceProperties = tsThemePreferenceProperties;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3RuntimeContractGovernanceFailureMessage(summary);

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
      `desktop-v3 runtime contract governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3RuntimeContractGovernanceCli({ argv });
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
