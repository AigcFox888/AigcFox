import console from "node:console";
import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDesktopV3BackendClientGovernanceFailureMessage,
  collectDesktopV3BackendClientGovernanceViolations,
  createDesktopV3BackendClientGovernanceSummary,
  resolveDesktopV3BackendClientGovernanceConfig,
} from "./lib/desktop-v3-backend-client-governance.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3BackendClientGovernanceHelpText() {
  return [
    "desktop-v3 backend-client governance verifier",
    "",
    "Scans the Rust runtime remote-client boundary and fails closed when runtime/client grows past the frozen Wave 1 probe-only surface.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_OUTPUT_DIR=<absolute-output-dir>",
    "",
    "Checks:",
    "  - runtime/client file set stays frozen at backend_client.rs + mod.rs + probe_contract.rs",
    "  - BackendClient public methods stay frozen at new / base_url / get_liveness / get_readiness",
    "  - BackendClient only keeps get_probe as its private helper and remains probe-only on /api/v1/healthz + /readyz",
    "  - probe_contract public types/functions stay frozen to the current probe envelope surface",
    "  - reqwest touchpoints stay confined to error.rs + runtime/client/*",
    "  - BackendClient stays owned by runtime/mod.rs outside the client module",
  ].join("\n");
}

export async function runDesktopV3BackendClientGovernanceCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const collectViolationsImpl =
    options.collectViolationsImpl ?? collectDesktopV3BackendClientGovernanceViolations;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const createSummaryImpl = options.createSummaryImpl ?? createDesktopV3BackendClientGovernanceSummary;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const persistVerificationSummaryImpl =
    options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3BackendClientGovernanceConfig;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3BackendClientGovernanceHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const summary = createSummaryImpl(config);
      let summaryPersisted = false;

      await mkdirImpl(config.outputDir, { recursive: true });

      try {
        const {
          backendClientMethods,
          backendClientReferenceFiles,
          clientFiles,
          moduleDeclarations,
          probeContractFunctions,
          probeContractReferenceFiles,
          probeContractTypes,
          probePaths,
          reqwestTouchFiles,
          scannedFileCount,
          scannedFiles,
          violations,
        } = await collectViolationsImpl(config);

        summary.backendClientMethods = backendClientMethods;
        summary.backendClientReferenceFiles = backendClientReferenceFiles;
        summary.checkedAt = new Date().toISOString();
        summary.clientFiles = clientFiles;
        summary.moduleDeclarations = moduleDeclarations;
        summary.probeContractFunctions = probeContractFunctions;
        summary.probeContractReferenceFiles = probeContractReferenceFiles;
        summary.probeContractTypes = probeContractTypes;
        summary.probePaths = probePaths;
        summary.reqwestTouchFiles = reqwestTouchFiles;
        summary.scannedFileCount = scannedFileCount;
        summary.scannedFiles = scannedFiles;
        summary.violationCount = violations.length;
        summary.violations = violations;
        summary.status = violations.length === 0 ? "passed" : "failed";
        summary.error =
          violations.length === 0 ? null : buildDesktopV3BackendClientGovernanceFailureMessage(summary);

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
      `desktop-v3 backend-client governance passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3BackendClientGovernanceCli({ argv });
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
