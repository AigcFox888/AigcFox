import path from "node:path";
import process from "node:process";

import { buildDesktopGovernanceDerivedPaths } from "./governance-run-config-desktop-paths.mjs";
import { buildDesktopGovernanceOutputPaths } from "./governance-run-config-desktop-output-paths.mjs";
import { readDesktopGovernanceRequestedState } from "./governance-run-config-desktop-requests.mjs";
import { resolveDesktopGovernanceRunIds } from "./governance-run-config-desktop-resolve-run-ids.mjs";

export function resolveDesktopGovernanceRunConfig(options = {}, settings = {}) {
  const argv = settings.argv ?? process.argv;
  const env = settings.env ?? process.env;
  const rootDir = settings.rootDir;
  const includeGenericGovernanceFallback = settings.includeGenericGovernanceFallback === true;
  const smokeVerifyOutputDefaultsToSeparateRunDir =
    settings.smokeVerifyOutputDefaultsToSeparateRunDir === true;
  const allowSmokeRunFallbackForRunId = settings.allowSmokeRunFallbackForRunId === true;

  if (typeof rootDir !== "string" || rootDir.length === 0) {
    throw new Error("Desktop governance rootDir is required.");
  }

  const {
    inferredRunId,
    inferredSmokeRunId,
    requestedOutputDir,
    requestedSmokeOutputDir,
    requestedSmokeVerifyOutputDir,
    smokeExpectedDpiScale,
    smokeExpectedPhase,
  } = readDesktopGovernanceRequestedState(options, {
    argv,
    env,
    includeGenericGovernanceFallback,
  });
  const { runId, smokeRunId } = resolveDesktopGovernanceRunIds({
    options,
    argv,
    env,
    includeGenericGovernanceFallback,
    inferredRunId,
    inferredSmokeRunId,
    allowSmokeRunFallbackForRunId,
  });
  const {
    outputDir,
    reportPath,
    smokeOutputDir,
    smokeRawSummaryPath,
    smokeVerifyOutputDir,
    smokeVerifyReportPath,
    smokeVerifySummaryPath,
    summaryPath,
  } = buildDesktopGovernanceOutputPaths({
    argv,
    env,
    options,
    requestedOutputDir,
    requestedSmokeOutputDir,
    requestedSmokeVerifyOutputDir,
    rootDir,
    runId,
    smokeRunId,
    smokeVerifyOutputDefaultsToSeparateRunDir,
  });

  return {
    runId,
    smokeRunId,
    outputDir,
    summaryPath,
    reportPath,
    smokeOutputDir,
    smokeVerifyOutputDir,
    smokeRawSummaryPath,
    smokeExpectedPhase,
    smokeExpectedDpiScale,
    smokeVerifySummaryPath,
    smokeVerifyReportPath,
    ...buildDesktopGovernanceDerivedPaths(outputDir),
  };
}
