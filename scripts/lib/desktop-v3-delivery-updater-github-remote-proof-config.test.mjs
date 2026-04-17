import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions,
  resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig,
} from "./desktop-v3-delivery-updater-github-remote-proof-config.mjs";

describe("desktop-v3 delivery/updater GitHub remote proof config", () => {
  it("resolves output paths and defaults the target branch to the current branch", () => {
    const config = resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig({
      currentBranch: "feature/delivery-updater-docs",
      env: {},
      now: new Date("2026-04-16T10:20:30.456Z"),
    });

    expect(config.currentBranch).toBe("feature/delivery-updater-docs");
    expect(config.targetBranch).toBe("feature/delivery-updater-docs");
    expect(config.outputDir).toContain(
      path.join(
        "output",
        "verification",
        "desktop-v3-delivery-updater-github-remote-proof-2026-04-16T10-20-30-456Z",
      ),
    );
    expect(config.latestSummaryPath).toContain(
      path.join(
        "output",
        "verification",
        "latest",
        "desktop-v3-delivery-updater-github-remote-proof-summary.json",
      ),
    );
  });

  it("builds a single frozen workflow definition with explicit path and active-state expectations", () => {
    const definitions = buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions({
      targetBranch: "feature/delivery-updater-docs",
    });

    expect(definitions).toEqual([
      expect.objectContaining({
        expectedBranch: "feature/delivery-updater-docs",
        expectedWorkflowPath: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
        expectedWorkflowState: "active",
        workflowName: "desktop-v3-delivery-updater-docs",
      }),
    ]);
  });
});
