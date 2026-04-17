import { readCliValue } from "./path-overrides.mjs";
import { readEnvValue } from "./governance-run-config-shared.mjs";

export function readProjectRunId(options, argv, env, includeGenericGovernanceFallback, inferredRunId) {
  return (
    options.runId ||
    readCliValue("run-id", argv) ||
    readEnvValue(env, [
      "AIGCFOX_PROJECT_GOVERNANCE_RUN_ID",
      ...(includeGenericGovernanceFallback ? ["AIGCFOX_GOVERNANCE_RUN_ID"] : []),
    ]) ||
    inferredRunId
  );
}

export function readDesktopGovernanceRunId(
  options,
  argv,
  env,
  runId,
  inferredDesktopGovernanceRunId,
) {
  return (
    options.desktopGovernanceRunId ||
    readCliValue("desktop-governance-run-id", argv) ||
    readEnvValue(env, ["AIGCFOX_DESKTOP_GOVERNANCE_RUN_ID"]) ||
    inferredDesktopGovernanceRunId ||
    runId
  );
}
