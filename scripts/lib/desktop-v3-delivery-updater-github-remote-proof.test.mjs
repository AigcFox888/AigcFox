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
  remoteTrackingHeadSha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
  remoteTrackingRef: "origin/feature/desktop-v3-delivery-updater",
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
    expect(summary.failedChecks).toEqual([
      "desktop-v3-delivery-updater-docs-remote-proof",
      "desktop-v3-ci-remote-proof",
      "desktop-v3-package-remote-proof",
    ]);
    expect(summary.checks[0]?.failureReason).toBe("workflow_missing");
  });

  it("passes when the latest run is successful on the current remote-tracking head", () => {
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
          {
            id: 10,
            name: "desktop-v3-ci",
            path: ".github/workflows/desktop-v3-ci.yml",
            state: "active",
          },
          {
            id: 11,
            name: "desktop-v3-package",
            path: ".github/workflows/desktop-v3-package.yml",
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
        [
          "desktop-v3-ci",
          [
            {
              id: 24439032825,
              conclusion: "success",
              created_at: "2026-04-15T01:55:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-ci",
              name: "desktop-v3-ci",
              run_number: 7,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-package",
          [
            {
              id: 24439032824,
              conclusion: "success",
              created_at: "2026-04-15T01:50:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-package",
              name: "desktop-v3-package",
              run_number: 9,
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
    expect(summary.remoteTrackingRef).toBe("origin/feature/desktop-v3-delivery-updater");
    expect(summary.remoteTrackingHeadSha).toBe("75ca51382a1ad006a17b44bd2021714f1a3b94c2");
  });

  it("fails when the latest run is not successful for the remote-tracking head", () => {
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
          {
            id: 10,
            name: "desktop-v3-ci",
            path: ".github/workflows/desktop-v3-ci.yml",
            state: "active",
          },
          {
            id: 11,
            name: "desktop-v3-package",
            path: ".github/workflows/desktop-v3-package.yml",
            state: "active",
          },
        ],
      },
      buildWorkflowRunsByName([
        [
          "desktop-v3-delivery-updater-docs",
          [
            {
              id: 24439032827,
              conclusion: "failure",
              created_at: "2026-04-15T02:05:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/delivery-updater-docs-failed",
              name: "desktop-v3-delivery-updater-docs",
              run_number: 4,
              status: "completed",
            },
            {
              id: 24439032826,
              conclusion: "success",
              created_at: "2026-04-15T02:00:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "old-success-head",
              html_url: "https://github.com/example/delivery-updater-docs",
              name: "desktop-v3-delivery-updater-docs",
              run_number: 3,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-ci",
          [
            {
              id: 24439032825,
              conclusion: "success",
              created_at: "2026-04-15T01:55:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-ci",
              name: "desktop-v3-ci",
              run_number: 7,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-package",
          [
            {
              id: 24439032824,
              conclusion: "success",
              created_at: "2026-04-15T01:50:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-package",
              name: "desktop-v3-package",
              run_number: 9,
              status: "completed",
            },
          ],
        ],
      ]),
    );

    expect(summary.status).toBe("failed");
    expect(summary.failedChecks).toEqual(["desktop-v3-delivery-updater-docs-remote-proof"]);
    expect(summary.checks[0]?.failureReason).toBe("latest_run_not_successful");
  });

  it("surfaces GitHub billing blockers from latest run job annotations", () => {
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
          {
            id: 10,
            name: "desktop-v3-ci",
            path: ".github/workflows/desktop-v3-ci.yml",
            state: "active",
          },
          {
            id: 11,
            name: "desktop-v3-package",
            path: ".github/workflows/desktop-v3-package.yml",
            state: "active",
          },
        ],
      },
      buildWorkflowRunsByName([
        [
          "desktop-v3-delivery-updater-docs",
          [
            {
              id: 24439032827,
              conclusion: "failure",
              created_at: "2026-04-15T02:05:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/delivery-updater-docs-failed",
              name: "desktop-v3-delivery-updater-docs",
              run_number: 4,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-ci",
          [
            {
              id: 24439032825,
              conclusion: "success",
              created_at: "2026-04-15T01:55:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-ci",
              name: "desktop-v3-ci",
              run_number: 7,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-package",
          [
            {
              id: 24439032824,
              conclusion: "success",
              created_at: "2026-04-15T01:50:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-package",
              name: "desktop-v3-package",
              run_number: 9,
              status: "completed",
            },
          ],
        ],
      ]),
      {
        workflowJobsByRunId: new Map([
          [
            24439032827,
            [
              {
                annotations: [
                  {
                    annotationLevel: "failure",
                    message:
                      "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings",
                    path: ".github",
                    rawDetails: "",
                    title: "",
                  },
                ],
                checkRunId: 24439032827,
                conclusion: "failure",
                databaseId: 24439032827,
                htmlUrl: "https://github.com/example/delivery-updater-docs-failed/job/1",
                labels: ["ubuntu-24.04"],
                name: "desktop-v3 delivery/updater docs (ubuntu)",
                startedAt: "2026-04-15T02:05:00Z",
                status: "completed",
                steps: [],
              },
            ],
          ],
        ]),
      },
    );

    expect(summary.status).toBe("failed");
    expect(summary.checks[0]?.failureReason).toBe("github_actions_billing_blocked");
    expect(summary.checks[0]?.failureDetail).toContain("spending limit needs to be increased");
    expect(summary.externalBlockers).toEqual([
      expect.objectContaining({
        checkId: "desktop-v3-delivery-updater-docs-remote-proof",
        reason: "github_actions_billing_blocked",
      }),
    ]);
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
          {
            id: 10,
            name: "desktop-v3-ci",
            path: ".github/workflows/desktop-v3-ci.yml",
            state: "active",
          },
          {
            id: 11,
            name: "desktop-v3-package",
            path: ".github/workflows/desktop-v3-package.yml",
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
        [
          "desktop-v3-ci",
          [
            {
              id: 24439032825,
              conclusion: "success",
              created_at: "2026-04-15T01:55:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-ci",
              name: "desktop-v3-ci",
              run_number: 7,
              status: "completed",
            },
          ],
        ],
        [
          "desktop-v3-package",
          [
            {
              id: 24439032824,
              conclusion: "success",
              created_at: "2026-04-15T01:50:00Z",
              event: "push",
              head_branch: "feature/desktop-v3-delivery-updater",
              head_sha: "75ca51382a1ad006a17b44bd2021714f1a3b94c2",
              html_url: "https://github.com/example/desktop-v3-package",
              name: "desktop-v3-package",
              run_number: 9,
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
