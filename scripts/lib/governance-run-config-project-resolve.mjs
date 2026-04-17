import process from "node:process";

import { buildProjectGovernancePaths } from "./governance-run-config-project-paths.mjs";
import { resolveProjectGovernanceDirectories } from "./governance-run-config-project-resolve-directories.mjs";
import {
  readProjectGovernanceRequestedPaths,
  resolveProjectGovernanceRunIdentifiers,
} from "./governance-run-config-project-resolve-inputs.mjs";

export function resolveProjectGovernanceRunConfig(options = {}, settings = {}) {
  const argv = settings.argv ?? process.argv;
  const env = settings.env ?? process.env;
  const rootDir = settings.rootDir;
  const includeGenericGovernanceFallback = settings.includeGenericGovernanceFallback === true;
  const desktopGovernanceDefaultsToSeparateRunDir =
    settings.desktopGovernanceDefaultsToSeparateRunDir === true;

  if (typeof rootDir !== "string" || rootDir.length === 0) {
    throw new Error("Project governance rootDir is required.");
  }

  const {
    requestedOutputDir,
    requestedSummaryPath,
    requestedDesktopGovernanceOutputDir,
    requestedDesktopGovernanceSummaryPath,
  } = readProjectGovernanceRequestedPaths({
    options,
    argv,
    env,
    includeGenericGovernanceFallback,
  });
  const { runId, desktopGovernanceRunId } = resolveProjectGovernanceRunIdentifiers({
    options,
    argv,
    env,
    includeGenericGovernanceFallback,
    requestedOutputDir,
    requestedSummaryPath,
    requestedDesktopGovernanceOutputDir,
    requestedDesktopGovernanceSummaryPath,
    fallbackRunId: `${Date.now()}-${process.pid}`,
  });
  const { defaultDesktopGovernanceOutputDir, outputDir, desktopGovernanceOutputDir } =
    resolveProjectGovernanceDirectories({
      rootDir,
      runId,
      desktopGovernanceRunId,
      requestedOutputDir,
      requestedDesktopGovernanceOutputDir,
      desktopGovernanceDefaultsToSeparateRunDir,
    });
  const paths = buildProjectGovernancePaths({
    argv,
    env,
    options: { ...options, runId, desktopGovernanceOutputDir: requestedDesktopGovernanceOutputDir },
    outputDir,
    desktopGovernanceOutputDir,
    defaultDesktopGovernanceOutputDir,
  });

  return {
    runId,
    outputDir,
    summaryPath: paths.summaryPath,
    reportPath: paths.reportPath,
    desktopGovernanceRunId,
    desktopGovernanceOutputDir,
    desktopGovernanceSummaryPath: paths.desktopGovernanceSummaryPath,
    desktopReleaseArtifactDir: paths.desktopReleaseArtifactDir,
    desktopReleaseVerificationDir: paths.desktopReleaseVerificationDir,
    governanceCommandDocsSummaryPath: paths.governanceCommandDocsSummaryPath,
    governanceCommandDocsReportPath: paths.governanceCommandDocsReportPath,
  };
}
