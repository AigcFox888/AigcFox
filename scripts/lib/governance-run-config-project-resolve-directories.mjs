import path from "node:path";

export function resolveProjectGovernanceDirectories({
  rootDir,
  runId,
  desktopGovernanceRunId,
  requestedOutputDir,
  requestedDesktopGovernanceOutputDir,
  desktopGovernanceDefaultsToSeparateRunDir,
}) {
  const defaultDesktopGovernanceOutputDir = desktopGovernanceDefaultsToSeparateRunDir
    ? path.join(rootDir, "output", "verification", `desktop-governance-run-${desktopGovernanceRunId}`)
    : null;
  const outputDir =
    requestedOutputDir ||
    path.join(rootDir, "output", "verification", `project-governance-run-${runId}`);

  return {
    defaultDesktopGovernanceOutputDir,
    outputDir,
    desktopGovernanceOutputDir:
      requestedDesktopGovernanceOutputDir || defaultDesktopGovernanceOutputDir || outputDir,
  };
}
