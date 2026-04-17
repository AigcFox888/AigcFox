import { inferRunIdFromPath } from "./path-overrides.mjs";
import { projectGovernanceRunIdPrefixes, readPathValue } from "./governance-run-config-shared.mjs";
import {
  readDesktopGovernanceRunId,
  readProjectRunId,
} from "./governance-run-config-project-paths.mjs";

export function readProjectGovernanceRequestedPaths({
  options,
  argv,
  env,
  includeGenericGovernanceFallback,
}) {
  return {
    requestedOutputDir: readPathValue(
      options.outputDir,
      ["output-dir", "verification-dir"],
      [
        "AIGCFOX_PROJECT_GOVERNANCE_OUTPUT_DIR",
        ...(includeGenericGovernanceFallback ? ["AIGCFOX_GOVERNANCE_VERIFICATION_DIR"] : []),
      ],
      null,
      argv,
      env,
    ),
    requestedSummaryPath: readPathValue(
      options.summaryPath,
      "summary-path",
      ["AIGCFOX_PROJECT_GOVERNANCE_SUMMARY_PATH"],
      null,
      argv,
      env,
    ),
    requestedDesktopGovernanceOutputDir: readPathValue(
      options.desktopGovernanceOutputDir,
      "desktop-governance-output-dir",
      ["AIGCFOX_DESKTOP_GOVERNANCE_OUTPUT_DIR"],
      null,
      argv,
      env,
    ),
    requestedDesktopGovernanceSummaryPath: readPathValue(
      options.desktopGovernanceSummaryPath,
      "desktop-governance-summary-path",
      ["AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH"],
      null,
      argv,
      env,
    ),
  };
}

export function resolveProjectGovernanceRunIdentifiers({
  options,
  argv,
  env,
  includeGenericGovernanceFallback,
  requestedOutputDir,
  requestedSummaryPath,
  requestedDesktopGovernanceOutputDir,
  requestedDesktopGovernanceSummaryPath,
  fallbackRunId,
}) {
  const inferredRunId =
    inferRunIdFromPath(requestedOutputDir, projectGovernanceRunIdPrefixes) ||
    inferRunIdFromPath(requestedSummaryPath, projectGovernanceRunIdPrefixes) ||
    null;
  const runId =
    readProjectRunId(options, argv, env, includeGenericGovernanceFallback, inferredRunId) ||
    fallbackRunId;
  const inferredDesktopGovernanceRunId =
    inferRunIdFromPath(requestedDesktopGovernanceOutputDir, [
      "desktop-governance-run-",
      "governance-run-",
    ]) ||
    inferRunIdFromPath(requestedDesktopGovernanceSummaryPath, [
      "desktop-governance-run-",
      "governance-run-",
    ]) ||
    null;

  return {
    runId,
    desktopGovernanceRunId: readDesktopGovernanceRunId(
      options,
      argv,
      env,
      runId,
      inferredDesktopGovernanceRunId,
    ),
  };
}
