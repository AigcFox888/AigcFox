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
      remoteTrackingHeadSha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
      remoteTrackingRef: "origin/feature/delivery-updater-docs",
    });

    expect(config.currentBranch).toBe("feature/delivery-updater-docs");
    expect(config.targetBranch).toBe("feature/delivery-updater-docs");
    expect(config.remoteTrackingRef).toBe("origin/feature/delivery-updater-docs");
    expect(config.remoteTrackingHeadSha).toBe("75ca51382a1ad006a17b44bd2021714f1a3b94c2");
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

  it("builds frozen workflow definitions for docs, ci, and package proof", () => {
    const definitions = buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions({
      remoteTrackingHeadSha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
      remoteTrackingRef: "origin/feature/delivery-updater-docs",
      targetBranch: "feature/delivery-updater-docs",
    });

    expect(definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expectedBranch: "feature/delivery-updater-docs",
          expectedHeadSha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
          expectedRef: "origin/feature/delivery-updater-docs",
          expectedWorkflowPath: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
          expectedWorkflowState: "active",
          requireLatestRunSuccess: true,
          workflowName: "desktop-v3-delivery-updater-docs",
        }),
        expect.objectContaining({
          expectedWorkflowPath: ".github/workflows/desktop-v3-ci.yml",
          workflowName: "desktop-v3-ci",
        }),
        expect.objectContaining({
          expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
          workflowName: "desktop-v3-package",
        }),
      ]),
    );
    expect(definitions[0]).toEqual(
      expect.objectContaining({
        expectedBranch: "feature/delivery-updater-docs",
        expectedHeadSha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
        expectedRef: "origin/feature/delivery-updater-docs",
        expectedWorkflowPath: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
        expectedWorkflowState: "active",
        requireLatestRunSuccess: true,
        workflowName: "desktop-v3-delivery-updater-docs",
      }),
    );
  });
});
