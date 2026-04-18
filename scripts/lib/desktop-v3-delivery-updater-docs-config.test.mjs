import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";

describe("desktop-v3 delivery/updater docs config", () => {
  it("builds a default output directory and keeps the source-of-truth document set frozen", () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig({
      env: {},
      now: new Date("2026-04-15T03:20:30.456Z"),
    });

    expect(config.runId).toBe("2026-04-15T03-20-30-456Z");
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-delivery-updater-docs-2026-04-15T03-20-30-456Z"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-delivery-updater-docs-summary.json"),
    );
    expect(config.documentFiles).toEqual(
      expect.arrayContaining([
        "README.md",
        "AGENTS.md",
        "apps/desktop-v3/README.md",
        "docs/281-desktop-v3-post-reinstall-recovery-entry.md",
        "docs/README.md",
        "docs/248-autonomous-execution-baseline.md",
        "docs/267-desktop-v3-github-actions-baseline.md",
        "docs/269-desktop-v3-tauri-2-governance-baseline.md",
        "docs/274-desktop-v3-delivery-updater-proposal.md",
        "docs/275-desktop-v3-delivery-updater-technical-baseline.md",
        "docs/276-desktop-v3-delivery-updater-detailed-design.md",
        "docs/277-desktop-v3-delivery-updater-execution-baseline.md",
        "docs/278-desktop-v3-delivery-updater-acceptance-matrix.md",
        "docs/279-desktop-v3-delivery-updater-execution-runbook.md",
        "docs/280-desktop-v3-delivery-updater-closeout.md",
      ]),
    );
  });

  it("respects explicit output and run id overrides", () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig({
      env: {
        AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_DOCS_OUTPUT_DIR: "/tmp/delivery-updater-docs",
        AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_DOCS_RUN_ID: "manual-run",
      },
    });

    expect(config.runId).toBe("manual-run");
    expect(config.outputDir).toBe("/tmp/delivery-updater-docs");
  });
});
