import { describe, expect, it } from "vitest";

import { buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary } from "./desktop-v3-delivery-updater-github-remote-proof.mjs";
import {
  buildWorkflowRunsByName,
  createGithubRemoteProofTestConfigBuilder,
} from "./github-actions-remote-proof-test-helpers.mjs";

const buildConfig = createGithubRemoteProofTestConfigBuilder({
  currentBranch: "feature/desktop-v3-delivery-updater",
  latestSummaryPath: "/workspace/output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json",
  outputDir: "/workspace/output/verification/desktop-v3-delivery-updater-github-remote-proof-2026-04-15T01-00-00-000Z",
  runId: "2026-04-15T01-00-00-000Z",
  summaryPath: "/workspace/output/verification/desktop-v3-delivery-updater-github-remote-proof-2026-04-15T01-00-00-000Z/summary.json",
  targetBranch: "feature/desktop-v3-delivery-updater",
});

describe("desktop-v3 delivery/updater GitHub remote proof summary", () => {
  it("fails when the workflow is missing from the remote repo", () => {
    const config = buildConfig();
    const summary = buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary(
      config,
      {
        workflows: [],
      },
      buildWorkflowRunsByName(),
    );

    expect(summary.status).toBe("failed");
    expect(summary.failedChecks).toEqual(["desktop-v3-delivery-updater-docs-remote-proof"]);
    expect(summary.checks[0]?.failureReason).toBe("workflow_missing");
  });

  it("passes when the workflow has a successful run on the target branch", () => {
    const config = buildConfig();
    const summary = buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary(
      config,
      {
        workflows: [
          {
            id: 9,
            name: "desktop-v3-delivery-updater-docs",
            path: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
            state: "active",
          },
        ],
      },
      buildWorkflowRunsByName([
        [
          "desktop-v3-delivery-updater-docs",
          [
            {
              id: 24439032826,
              conclusion: "success",
              created_at: "2026-04-15T02:00:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/delivery-updater-docs",
              name: "desktop-v3-delivery-updater-docs",
              run_number: 3,
              status: "completed",
            },
          ],
        ],
      ]),
    );

    expect(summary.status).toBe("passed");
    expect(summary.failedChecks).toEqual([]);
    expect(summary.checks[0]?.status).toBe("passed");
    expect(summary.latestSuccessfulHeadSha).toBe("75ca51382a1ad006a17b44bd2021714f1a3b94c2");
    expect(summary.latestSuccessfulRunId).toBe(24439032826);
    expect(summary.latestSuccessfulRunUrl).toBe("https://github.com/example/delivery-updater-docs");
  });

  it("fails when the remote workflow exists but is no longer active", () => {
    const config = buildConfig();
    const summary = buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary(
      config,
      {
        workflows: [
          {
            id: 9,
            name: "desktop-v3-delivery-updater-docs",
            path: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
            state: "disabled_manually",
          },
        ],
      },
      buildWorkflowRunsByName([
        [
          "desktop-v3-delivery-updater-docs",
          [
            {
              id: 24439032826,
              conclusion: "success",
              created_at: "2026-04-15T02:00:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/delivery-updater-docs",
              name: "desktop-v3-delivery-updater-docs",
              run_number: 3,
              status: "completed",
            },
          ],
        ],
      ]),
    );

    expect(summary.status).toBe("failed");
    expect(summary.failedChecks).toEqual(["desktop-v3-delivery-updater-docs-remote-proof"]);
    expect(summary.checks[0]?.failureReason).toBe("workflow_state_mismatch");
  });
});
