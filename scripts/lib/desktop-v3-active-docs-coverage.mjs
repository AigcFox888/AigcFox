import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { collectExplicitDocCoverage } from "./explicit-doc-coverage.mjs";

export const desktopV3ActiveDocCoverageTargets = resolveDesktopV3Wave1ReadinessConfig().documentFiles;

export function collectDesktopV3ActiveDocCoverage(rootDir, options = {}) {
  return collectExplicitDocCoverage(rootDir, desktopV3ActiveDocCoverageTargets, options);
}
