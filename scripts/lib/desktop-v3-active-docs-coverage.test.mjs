import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  collectDesktopV3ActiveDocCoverage,
  desktopV3ActiveDocCoverageTargets,
} from "./desktop-v3-active-docs-coverage.mjs";
import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";

const currentFilePath = fileURLToPath(import.meta.url);
const config = resolveDesktopV3Wave1ReadinessConfig();
const sharedCoverage = collectDesktopV3ActiveDocCoverage(config.rootDir, {
  excludeFiles: [currentFilePath],
});

describe("desktop-v3 Wave 1 active docs explicit coverage", () => {
  it("keeps every desktop-v3 Wave 1 source-of-truth doc guarded by at least three explicit test references", () => {
    const insufficient = sharedCoverage.filter((item) => item.count < 3);

    expect(desktopV3ActiveDocCoverageTargets).toContain("docs/281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(desktopV3ActiveDocCoverageTargets).toContain("docs/257-desktop-v3-replatform-proposal.md");
    expect(desktopV3ActiveDocCoverageTargets).toContain("docs/258-desktop-v3-technical-baseline.md");
    expect(desktopV3ActiveDocCoverageTargets).toContain("docs/264-desktop-v3-wave1-execution-runbook.md");
    expect(desktopV3ActiveDocCoverageTargets).toContain("docs/267-desktop-v3-github-actions-baseline.md");
    expect(desktopV3ActiveDocCoverageTargets).toContain("apps/desktop-v3/README.md");
    expect(insufficient).toEqual([]);
  });

  it("records explicit references with workspace-relative test paths", () => {
    const technicalBaselineCoverage = sharedCoverage.find(
      (item) => item.docPath === "docs/258-desktop-v3-technical-baseline.md",
    );

    expect(technicalBaselineCoverage?.count).toBeGreaterThanOrEqual(3);
    expect(technicalBaselineCoverage?.refs).toEqual(
      expect.arrayContaining([
        "scripts/lib/desktop-v3-baseline-docs.test.mjs",
        "scripts/lib/desktop-v3-github-actions-baseline.test.mjs",
        "scripts/lib/desktop-v3-wave1-entry-docs.test.mjs",
      ]),
    );
    expect(technicalBaselineCoverage?.refs.every((ref) => !path.isAbsolute(ref))).toBe(true);
  });
});
