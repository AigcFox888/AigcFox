import { readCliValue } from "./path-overrides.mjs";
import {
  readEnvValue,
} from "./governance-run-config-shared.mjs";
import { readDesktopGovernanceExpectedState } from "./governance-run-config-desktop-requests-expected.mjs";
import { inferDesktopGovernanceRequestedRunIds } from "./governance-run-config-desktop-requests-inferred.mjs";
import { readDesktopGovernanceRequestedPaths } from "./governance-run-config-desktop-requests-paths.mjs";

export function readDesktopGovernanceRunId(
  options,
  argv,
  env,
  includeGenericGovernanceFallback,
  inferredRunId,
  inferredSmokeRunId,
  allowSmokeRunFallbackForRunId,
) {
  return (
    options.runId ||
    readCliValue("run-id", argv) ||
    readEnvValue(env, [
      "AIGCFOX_DESKTOP_GOVERNANCE_RUN_ID",
      ...(includeGenericGovernanceFallback ? ["AIGCFOX_GOVERNANCE_RUN_ID"] : []),
    ]) ||
    inferredRunId ||
    (allowSmokeRunFallbackForRunId ? inferredSmokeRunId : null)
  );
}

export function readDesktopGovernanceRequestedState(options, settings) {
  const requestedPaths = readDesktopGovernanceRequestedPaths(options, settings);
  const expectedState = readDesktopGovernanceExpectedState(options, settings);
  const inferredState = inferDesktopGovernanceRequestedRunIds(requestedPaths);

  return {
    ...inferredState,
    ...requestedPaths,
    ...expectedState,
  };
}
