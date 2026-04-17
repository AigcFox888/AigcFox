import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  collectDesktopV3DeliveryUpdaterActiveDocCoverage,
  desktopV3DeliveryUpdaterActiveDocCoverageTargets,
} from "./desktop-v3-delivery-updater-active-docs-coverage.mjs";
import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";

const currentFilePath = fileURLToPath(import.meta.url);
const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
const sharedCoverage = collectDesktopV3DeliveryUpdaterActiveDocCoverage(config.rootDir, {
  excludeFiles: [currentFilePath],
});

describe("desktop-v3 delivery/updater active docs explicit coverage", () => {
  it("keeps every delivery/updater source-of-truth doc guarded by at least three explicit test references", () => {
    const insufficient = sharedCoverage.filter((item) => item.count < 3);

    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain(
      "docs/281-desktop-v3-post-reinstall-recovery-entry.md",
    );
    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain("docs/274-desktop-v3-delivery-updater-proposal.md");
    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain(
      "docs/275-desktop-v3-delivery-updater-technical-baseline.md",
    );
    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain(
      "docs/276-desktop-v3-delivery-updater-detailed-design.md",
    );
    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain(
      "docs/279-desktop-v3-delivery-updater-execution-runbook.md",
    );
    expect(desktopV3DeliveryUpdaterActiveDocCoverageTargets).toContain(
      "docs/280-desktop-v3-delivery-updater-closeout.md",
    );
    expect(insufficient).toEqual([]);
  });

  it("records explicit references with workspace-relative test paths", () => {
    const technicalBaselineCoverage = sharedCoverage.find(
      (item) => item.docPath === "docs/275-desktop-v3-delivery-updater-technical-baseline.md",
    );

    expect(technicalBaselineCoverage?.count).toBeGreaterThanOrEqual(3);
    expect(technicalBaselineCoverage?.refs).toEqual(
      expect.arrayContaining([
        "scripts/lib/desktop-v3-delivery-updater-docs-config.test.mjs",
        "scripts/lib/desktop-v3-delivery-updater-governance-docs.test.mjs",
        "scripts/lib/desktop-v3-delivery-updater-runbook-docs.test.mjs",
      ]),
    );
    expect(technicalBaselineCoverage?.refs.every((ref) => !path.isAbsolute(ref))).toBe(true);
  });
});
