import path from "node:path";

import { readPathValue } from "./governance-run-config-shared.mjs";

export function buildDesktopGovernanceOutputPaths({
  argv,
  env,
  options,
  rootDir,
  runId,
  smokeRunId,
  requestedOutputDir,
  requestedSmokeOutputDir,
  requestedSmokeVerifyOutputDir,
  smokeVerifyOutputDefaultsToSeparateRunDir,
}) {
  const outputDir =
    requestedOutputDir ||
    path.join(rootDir, "output", "verification", `desktop-governance-run-${runId}`);
  const summaryPath = readPathValue(
    options.summaryPath,
    "summary-path",
    ["AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH"],
    path.join(outputDir, "desktop-governance-summary.json"),
    argv,
    env,
  );
  const reportPath = readPathValue(
    options.reportPath,
    "report-path",
    ["AIGCFOX_DESKTOP_GOVERNANCE_REPORT_PATH"],
    path.join(outputDir, "desktop-governance-report.md"),
    argv,
    env,
  );
  const smokeOutputDir =
    requestedSmokeOutputDir ||
    path.join(rootDir, "output", "playwright", `desktop-smoke-run-${smokeRunId}`);
  const defaultSmokeVerifyOutputDir = smokeVerifyOutputDefaultsToSeparateRunDir
    ? path.join(rootDir, "output", "verification", `desktop-smoke-run-${smokeRunId}`)
    : outputDir;
  const smokeVerifyOutputDir = requestedSmokeVerifyOutputDir || defaultSmokeVerifyOutputDir;
  const smokeRawSummaryPath = readPathValue(
    options.smokeRawSummaryPath,
    "smoke-raw-summary-path",
    ["AIGCFOX_DESKTOP_SMOKE_RAW_SUMMARY_PATH"],
    path.join(smokeOutputDir, "desktop-smoke-summary.json"),
    argv,
    env,
  );
  const smokeVerifySummaryPath = readPathValue(
    options.smokeVerifySummaryPath,
    "smoke-verify-summary-path",
    ["AIGCFOX_DESKTOP_SMOKE_VERIFY_SUMMARY_PATH"],
    path.join(smokeVerifyOutputDir, "desktop-smoke-verify-summary.json"),
    argv,
    env,
  );
  const smokeVerifyReportPath = readPathValue(
    options.smokeVerifyReportPath,
    "smoke-verify-report-path",
    ["AIGCFOX_DESKTOP_SMOKE_VERIFY_REPORT_PATH"],
    path.join(smokeVerifyOutputDir, "desktop-smoke-verify-report.md"),
    argv,
    env,
  );

  return {
    outputDir,
    reportPath,
    smokeOutputDir,
    smokeRawSummaryPath,
    smokeVerifyOutputDir,
    smokeVerifyReportPath,
    smokeVerifySummaryPath,
    summaryPath,
  };
}
