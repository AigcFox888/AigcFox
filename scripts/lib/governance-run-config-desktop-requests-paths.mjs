import { readPathValue } from "./governance-run-config-shared.mjs";

export function readDesktopGovernanceRequestedPaths(options, settings) {
  const { argv, env, includeGenericGovernanceFallback } = settings;

  return {
    requestedOutputDir: readPathValue(
      options.outputDir,
      ["output-dir", "verification-dir"],
      [
        "AIGCFOX_DESKTOP_GOVERNANCE_OUTPUT_DIR",
        ...(includeGenericGovernanceFallback ? ["AIGCFOX_GOVERNANCE_VERIFICATION_DIR"] : []),
      ],
      null,
      argv,
      env,
    ),
    requestedSummaryPath: readPathValue(
      options.summaryPath,
      "summary-path",
      ["AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH"],
      null,
      argv,
      env,
    ),
    requestedSmokeOutputDir: readPathValue(
      options.smokeOutputDir,
      "smoke-output-dir",
      [
        "AIGCFOX_DESKTOP_SMOKE_OUTPUT_DIR",
        ...(includeGenericGovernanceFallback ? ["AIGCFOX_GOVERNANCE_SMOKE_OUTPUT_DIR"] : []),
      ],
      null,
      argv,
      env,
    ),
    requestedSmokeRawSummaryPath: readPathValue(
      options.smokeRawSummaryPath,
      "smoke-raw-summary-path",
      ["AIGCFOX_DESKTOP_SMOKE_RAW_SUMMARY_PATH"],
      null,
      argv,
      env,
    ),
    requestedSmokeVerifyOutputDir: readPathValue(
      options.smokeVerifyOutputDir,
      "smoke-verify-output-dir",
      ["AIGCFOX_DESKTOP_SMOKE_VERIFY_OUTPUT_DIR"],
      null,
      argv,
      env,
    ),
    requestedSmokeVerifySummaryPath: readPathValue(
      options.smokeVerifySummaryPath,
      "smoke-verify-summary-path",
      ["AIGCFOX_DESKTOP_SMOKE_VERIFY_SUMMARY_PATH"],
      null,
      argv,
      env,
    ),
  };
}
