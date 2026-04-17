import path from "node:path";

import { readPathValue } from "./governance-run-config-shared.mjs";

export function buildProjectGovernanceOutputPaths({
  argv,
  env,
  options,
  outputDir,
  defaultDesktopGovernanceOutputDir,
}) {
  return {
    summaryPath: readPathValue(
      options.summaryPath,
      "summary-path",
      ["AIGCFOX_PROJECT_GOVERNANCE_SUMMARY_PATH"],
      path.join(outputDir, "project-governance-summary.json"),
      argv,
      env,
    ),
    reportPath: readPathValue(
      options.reportPath,
      "report-path",
      ["AIGCFOX_PROJECT_GOVERNANCE_REPORT_PATH"],
      path.join(outputDir, "project-governance-report.md"),
      argv,
      env,
    ),
    desktopGovernanceSummaryPath: readPathValue(
      options.desktopGovernanceSummaryPath,
      "desktop-governance-summary-path",
      ["AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH"],
      path.join(
        options.desktopGovernanceOutputDir || defaultDesktopGovernanceOutputDir || outputDir,
        "desktop-governance-summary.json",
      ),
      argv,
      env,
    ),
    governanceCommandDocsSummaryPath: readPathValue(
      options.governanceCommandDocsSummaryPath,
      "governance-command-docs-summary-path",
      ["AIGCFOX_GOVERNANCE_COMMAND_DOCS_SUMMARY_PATH"],
      path.join(outputDir, "governance-command-docs-summary.json"),
      argv,
      env,
    ),
    governanceCommandDocsReportPath: readPathValue(
      options.governanceCommandDocsReportPath,
      "governance-command-docs-report-path",
      ["AIGCFOX_GOVERNANCE_COMMAND_DOCS_REPORT_PATH"],
      path.join(outputDir, "governance-command-docs-report.md"),
      argv,
      env,
    ),
  };
}
