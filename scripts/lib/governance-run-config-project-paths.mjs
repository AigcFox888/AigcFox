import { buildProjectGovernanceOutputPaths } from "./governance-run-config-project-paths-governance.mjs";
import { buildProjectGovernanceReleasePaths } from "./governance-run-config-project-paths-release.mjs";
import {
  readDesktopGovernanceRunId,
  readProjectRunId,
} from "./governance-run-config-project-paths-run-ids.mjs";

export { readDesktopGovernanceRunId, readProjectRunId } from "./governance-run-config-project-paths-run-ids.mjs";

export function buildProjectGovernancePaths({
  argv,
  env,
  options,
  outputDir,
  desktopGovernanceOutputDir,
  defaultDesktopGovernanceOutputDir,
}) {
  const governancePaths = buildProjectGovernanceOutputPaths({
    argv,
    env,
    options,
    outputDir,
    defaultDesktopGovernanceOutputDir,
  });
  const releasePaths = buildProjectGovernanceReleasePaths({
    argv,
    env,
    options,
    desktopGovernanceOutputDir,
  });

  return {
    ...governancePaths,
    ...releasePaths,
  };
}
