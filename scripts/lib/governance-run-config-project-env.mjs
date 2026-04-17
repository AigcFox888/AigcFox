import process from "node:process";

export function buildProjectGovernanceRunnerEnv(config, settings = {}) {
  const env = settings.env ?? process.env;
  const phaseName = settings.phaseName ?? "full";
  const skipBuild = settings.skipBuild === true;
  const includeGenericVerificationDir = settings.includeGenericVerificationDir === true;
  const nextEnv = {
    ...env,
    AIGCFOX_GOVERNANCE_RUN_ID: config.runId,
    AIGCFOX_PROJECT_GOVERNANCE_RUN_ID: config.runId,
    AIGCFOX_PROJECT_GOVERNANCE_OUTPUT_DIR: config.outputDir,
    AIGCFOX_PROJECT_GOVERNANCE_SUMMARY_PATH: config.summaryPath,
    AIGCFOX_PROJECT_GOVERNANCE_REPORT_PATH: config.reportPath,
    AIGCFOX_DESKTOP_GOVERNANCE_RUN_ID: config.desktopGovernanceRunId,
    AIGCFOX_DESKTOP_GOVERNANCE_OUTPUT_DIR: config.desktopGovernanceOutputDir,
    AIGCFOX_DESKTOP_GOVERNANCE_SUMMARY_PATH: config.desktopGovernanceSummaryPath,
    AIGCFOX_DESKTOP_RELEASE_ARTIFACT_DIR: config.desktopReleaseArtifactDir,
    AIGCFOX_DESKTOP_RELEASE_VERIFICATION_DIR: config.desktopReleaseVerificationDir,
    AIGCFOX_GOVERNANCE_COMMAND_DOCS_SUMMARY_PATH: config.governanceCommandDocsSummaryPath,
    AIGCFOX_GOVERNANCE_COMMAND_DOCS_REPORT_PATH: config.governanceCommandDocsReportPath,
    AIGCFOX_PROJECT_OVERVIEW_STRICT_READY:
      phaseName === "verify" || phaseName === "overview" ? "0" : "1",
  };

  if (includeGenericVerificationDir) {
    nextEnv.AIGCFOX_GOVERNANCE_VERIFICATION_DIR = config.outputDir;
  }

  if (skipBuild) {
    nextEnv.AIGCFOX_DESKTOP_SKIP_BUILD = "1";
  }

  return nextEnv;
}
