import { inferRunIdFromPath } from "./path-overrides.mjs";
import { desktopGovernanceRunIdPrefixes } from "./governance-run-config-shared.mjs";

export function inferDesktopGovernanceRequestedRunIds({
  requestedOutputDir,
  requestedSummaryPath,
  requestedSmokeOutputDir,
  requestedSmokeRawSummaryPath,
  requestedSmokeVerifyOutputDir,
  requestedSmokeVerifySummaryPath,
}) {
  return {
    inferredRunId:
      inferRunIdFromPath(requestedOutputDir, desktopGovernanceRunIdPrefixes) ||
      inferRunIdFromPath(requestedSummaryPath, desktopGovernanceRunIdPrefixes) ||
      null,
    inferredSmokeRunId:
      inferRunIdFromPath(requestedSmokeOutputDir, desktopGovernanceRunIdPrefixes) ||
      inferRunIdFromPath(requestedSmokeRawSummaryPath, desktopGovernanceRunIdPrefixes) ||
      inferRunIdFromPath(requestedSmokeVerifyOutputDir, desktopGovernanceRunIdPrefixes) ||
      inferRunIdFromPath(requestedSmokeVerifySummaryPath, desktopGovernanceRunIdPrefixes) ||
      null,
  };
}
