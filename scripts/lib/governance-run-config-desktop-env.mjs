import process from "node:process";

import { normalizeOptionalValue, normalizePhase } from "./governance-run-config-shared.mjs";

export function buildDesktopGovernanceRunnerEnv(config, settings = {}) {
  const env = settings.env ?? process.env;
  const skipBuild = settings.skipBuild === true;
  const includeSmokeExpectedPhase = settings.includeSmokeExpectedPhase === true;
  const normalizedSmokeExpectedPhase = normalizePhase(config.smokeExpectedPhase);
  const nextEnv = {
    ...env,
    AIGCFOX_GOVERNANCE_RUN_ID: config.runId,
    AIGCFOX_DESKTOP_GOVERNANCE_RUN_ID: config.runId,
    AIGCFOX_GOVERNANCE_VERIFICATION_DIR: config.outputDir,
    AIGCFOX_GOVERNANCE_SMOKE_OUTPUT_DIR: config.smokeOutputDir,
    AIGCFOX_DESKTOP_GOVERNANCE_OUTPUT_DIR: config.outputDir,
    AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH: config.summaryPath,
    AIGCFOX_DESKTOP_GOVERNANCE_REPORT_PATH: config.reportPath,
    AIGCFOX_DESKTOP_SMOKE_RUN_ID: config.smokeRunId,
    AIGCFOX_DESKTOP_SMOKE_OUTPUT_DIR: config.smokeOutputDir,
    AIGCFOX_DESKTOP_SMOKE_SUMMARY_PATH: config.smokeRawSummaryPath,
    AIGCFOX_DESKTOP_SMOKE_RAW_SUMMARY_PATH: config.smokeRawSummaryPath,
    AIGCFOX_DESKTOP_SMOKE_VERIFY_OUTPUT_DIR: config.smokeVerifyOutputDir,
    AIGCFOX_DESKTOP_SMOKE_VERIFY_SUMMARY_PATH: config.smokeVerifySummaryPath,
    AIGCFOX_DESKTOP_SMOKE_VERIFY_REPORT_PATH: config.smokeVerifyReportPath,
    AIGCFOX_DESKTOP_MAIN_BUNDLE_ANALYSIS_SUMMARY_PATH: config.mainBundleSummaryPath,
    AIGCFOX_DESKTOP_MAIN_BUNDLE_ANALYSIS_REPORT_PATH: config.mainBundleReportPath,
    AIGCFOX_DESKTOP_RENDERER_BUNDLE_ANALYSIS_RAW_SUMMARY_PATH:
      config.rendererBundleRawSummaryPath,
    AIGCFOX_DESKTOP_RENDERER_BUNDLE_ANALYSIS_SUMMARY_PATH: config.rendererBundleSummaryPath,
    AIGCFOX_DESKTOP_RENDERER_BUNDLE_ANALYSIS_REPORT_PATH: config.rendererBundleReportPath,
    AIGCFOX_DESKTOP_RENDERER_LOCAL_GROUP_WATCH_SUMMARY_PATH:
      config.rendererLocalGroupWatchSummaryPath,
    AIGCFOX_DESKTOP_RENDERER_LOCAL_GROUP_WATCH_REPORT_PATH:
      config.rendererLocalGroupWatchReportPath,
    AIGCFOX_DESKTOP_RENDERER_LOCAL_GROUP_WATCH_VERIFY_SUMMARY_PATH:
      config.rendererLocalGroupWatchVerifySummaryPath,
  };

  delete nextEnv.AIGCFOX_DESKTOP_SMOKE_EXPECTED_PHASE;
  delete nextEnv.AIGCFOX_DESKTOP_SMOKE_STOP_AFTER_PHASE;

  if (includeSmokeExpectedPhase && normalizedSmokeExpectedPhase) {
    nextEnv.AIGCFOX_DESKTOP_SMOKE_EXPECTED_PHASE = normalizedSmokeExpectedPhase;
    nextEnv.AIGCFOX_DESKTOP_SMOKE_STOP_AFTER_PHASE = normalizedSmokeExpectedPhase;
  }

  if (normalizeOptionalValue(config.smokeExpectedDpiScale)) {
    nextEnv.AIGCFOX_DESKTOP_SMOKE_EXPECTED_DPI_SCALE = config.smokeExpectedDpiScale;
  }

  if (skipBuild) {
    nextEnv.AIGCFOX_DESKTOP_SKIP_BUILD = "1";
  }

  return nextEnv;
}
