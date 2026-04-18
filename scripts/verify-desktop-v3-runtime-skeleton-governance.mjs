import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3RuntimeSkeletonGovernanceFailureMessage,
  collectDesktopV3RuntimeSkeletonGovernanceViolations,
  createDesktopV3RuntimeSkeletonGovernanceSummary,
  resolveDesktopV3RuntimeSkeletonGovernanceConfig,
} from "./lib/desktop-v3-runtime-skeleton-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3RuntimeSkeletonGovernanceHelpText() {
  return [
    "desktop-v3 runtime skeleton governance verifier",
    "",
    "Scans runtime/security + runtime/state + runtime/diagnostics and fails closed when the frozen Wave 1 skeleton grows past its current module surface.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - runtime/security + runtime/state + runtime/diagnostics file sets stay frozen at mod.rs only",
    "  - SecureStoreStatus / SecureStoreSnapshot / SecureStore methods stay frozen at the current diagnostics-only surface",
    "  - SessionSnapshot / SessionState fields and methods stay frozen at last_backend_probe_at + record_backend_probe / snapshot",
    "  - DiagnosticsService fields and methods stay frozen at new / snapshot with the current minimal composition surface",
    "  - SecureStore / SessionState / DiagnosticsService ownership stays confined to runtime/mod.rs plus the current typed contracts that already depend on them",
  ].join("\n");
}

export async function runDesktopV3RuntimeSkeletonGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3RuntimeSkeletonGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3RuntimeSkeletonGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3RuntimeSkeletonGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3RuntimeSkeletonGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          diagnosticsFields,
          diagnosticsMethods,
          diagnosticsReferenceFiles,
          externalDiagnosticsReferenceFiles,
          externalSecurityReferenceFiles,
          externalStateReferenceFiles,
          runtimeSkeletonFiles,
          scannedFileCount,
          scannedFiles,
          securityEnumVariants,
          securityMethods,
          securityReferenceFiles,
          securitySnapshotFields,
          stateMethods,
          stateReferenceFiles,
          stateSessionFields,
          stateSnapshotFields,
          violations,
        } = await collectViolationsImpl(config);

        summary.checkedAt = new Date().toISOString();
        summary.diagnosticsFields = diagnosticsFields;
        summary.diagnosticsMethods = diagnosticsMethods;
        summary.diagnosticsReferenceFiles = diagnosticsReferenceFiles;
        summary.externalDiagnosticsReferenceFiles = externalDiagnosticsReferenceFiles;
        summary.externalSecurityReferenceFiles = externalSecurityReferenceFiles;
        summary.externalStateReferenceFiles = externalStateReferenceFiles;
        summary.runtimeSkeletonFiles = runtimeSkeletonFiles;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.securityEnumVariants = securityEnumVariants;
        summary.securityMethods = securityMethods;
        summary.securityReferenceFiles = securityReferenceFiles;
        summary.securitySnapshotFields = securitySnapshotFields;
        summary.stateMethods = stateMethods;
        summary.stateReferenceFiles = stateReferenceFiles;
        summary.stateSessionFields = stateSessionFields;
        summary.stateSnapshotFields = stateSnapshotFields;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3RuntimeSkeletonGovernanceFailureMessage(summary);

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
      `desktop-v3 runtime skeleton governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3RuntimeSkeletonGovernanceCli({ argv });
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
