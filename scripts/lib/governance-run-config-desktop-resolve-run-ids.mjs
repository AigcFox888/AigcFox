import process from "node:process";

import { readCliValue } from "./path-overrides.mjs";
import { readDesktopGovernanceRunId } from "./governance-run-config-desktop-requests.mjs";
import { readEnvValue } from "./governance-run-config-shared.mjs";

export function resolveDesktopGovernanceRunIds({
  options,
  argv,
  env,
  includeGenericGovernanceFallback,
  inferredRunId,
  inferredSmokeRunId,
  allowSmokeRunFallbackForRunId,
}) {
  const runId =
    readDesktopGovernanceRunId(
      options,
      argv,
      env,
      includeGenericGovernanceFallback,
      inferredRunId,
      inferredSmokeRunId,
      allowSmokeRunFallbackForRunId,
    ) || `${Date.now()}-${process.pid}`;
  const smokeRunId =
    options.smokeRunId ||
    readCliValue("smoke-run-id", argv) ||
    readEnvValue(env, ["AIGCFOX_DESKTOP_SMOKE_RUN_ID"]) ||
    inferredSmokeRunId ||
    runId;

  return {
    runId,
    smokeRunId,
  };
}
