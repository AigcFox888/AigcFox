import path from "node:path";

import { readPathValue } from "./governance-run-config-shared.mjs";

export function buildProjectGovernanceReleasePaths({
  argv,
  env,
  options,
  desktopGovernanceOutputDir,
}) {
  return {
    desktopReleaseArtifactDir: readPathValue(
      options.desktopReleaseArtifactDir,
      "desktop-release-artifact-dir",
      ["AIGCFOX_DESKTOP_RELEASE_ARTIFACT_DIR"],
      path.join(desktopGovernanceOutputDir, "release-artifacts"),
      argv,
      env,
    ),
    desktopReleaseVerificationDir: readPathValue(
      options.desktopReleaseVerificationDir,
      "desktop-release-verification-dir",
      ["AIGCFOX_DESKTOP_RELEASE_VERIFICATION_DIR"],
      path.join(desktopGovernanceOutputDir, "release-verification"),
      argv,
      env,
    ),
  };
}
