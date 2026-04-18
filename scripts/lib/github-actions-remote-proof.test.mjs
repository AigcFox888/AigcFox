import { describe, expect, it, vi } from "vitest";

import {
  buildGithubRunJobsUrl,
  buildGithubWorkflowRemoteProofCheck,
  buildGithubWorkflowRunsUrl,
  fetchGithubJobsForRunForRemoteProof,
  fetchGithubLatestRunJobsByDefinition,
  fetchGithubWorkflowRunsForRemoteProof,
} from "./github-actions-remote-proof.mjs";

describe("github-actions remote proof helpers", () => {
  it("builds workflow runs URLs with branch and paging parameters", () => {
    const url = new URL(
      buildGithubWorkflowRunsUrl("https://api.github.com/repos/AigcFox888/AigcFox", 12345, {
        expectedBranch: "feature/desktop-v3-wave1-clean",
        page: 2,
      }),
    );

    expect(url.pathname).toBe("/repos/AigcFox888/AigcFox/actions/workflows/12345/runs");
    expect(url.searchParams.get("branch")).toBe("feature/desktop-v3-wave1-clean");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("100");
  });

  it("paginates workflow-specific runs until a successful run is found", async () => {
    const requestGithubApiJsonImpl = vi
      .fn()
      .mockResolvedValueOnce({
        workflow_runs: new Array(100).fill(null).map((_, index) => ({
          id: index + 1,
          conclusion: index === 0 ? "failure" : null,
          created_at: `2026-04-15T00:${String(index).padStart(2, "0")}:00Z`,
          event: "push",
          head_branch: "feature/desktop-v3-wave1-clean",
          head_sha: `page-one-${index}`,
          html_url: `https://example.com/runs/${index + 1}`,
          name: "desktop-v3-package",
          run_number: index + 1,
          status: "completed",
        })),
      })
      .mockResolvedValueOnce({
        workflow_runs: [
          {
            id: 201,
            conclusion: "success",
            created_at: "2026-04-14T23:59:00Z",
            event: "push",
            head_branch: "feature/desktop-v3-wave1-clean",
            head_sha: "page-two-success",
            html_url: "https://example.com/runs/201",
            name: "desktop-v3-package",
            run_number: 201,
            status: "completed",
          },
        ],
      });

    const runs = await fetchGithubWorkflowRunsForRemoteProof({
      authorizationHeader: "Basic test",
      baseUrl: "https://api.github.com/repos/AigcFox888/AigcFox",
      expectedBranch: "feature/desktop-v3-wave1-clean",
      requestGithubApiJsonImpl,
      workflowId: 12345,
    });

    expect(runs).toHaveLength(101);
    expect(runs.at(-1)?.head_sha).toBe("page-two-success");
    expect(requestGithubApiJsonImpl).toHaveBeenCalledTimes(2);
    expect(requestGithubApiJsonImpl.mock.calls[0]?.[0]).toContain("page=1");
    expect(requestGithubApiJsonImpl.mock.calls[1]?.[0]).toContain("page=2");
    expect(requestGithubApiJsonImpl.mock.calls[0]?.[0]).toContain("branch=feature%2Fdesktop-v3-wave1-clean");
  });

  it("builds run jobs URLs with paging parameters", () => {
    const url = new URL(
      buildGithubRunJobsUrl("https://api.github.com/repos/AigcFox888/AigcFox", 12345, {
        page: 2,
      }),
    );

    expect(url.pathname).toBe("/repos/AigcFox888/AigcFox/actions/runs/12345/jobs");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("100");
  });

  it("fetches failure job annotations for the latest run", async () => {
    const requestGithubApiJsonImpl = vi
      .fn()
      .mockResolvedValueOnce({
        jobs: [
          {
            id: 21,
            check_run_url: "https://api.github.com/repos/AigcFox888/AigcFox/check-runs/21",
            conclusion: "failure",
            html_url: "https://example.com/jobs/21",
            labels: ["ubuntu-24.04"],
            name: "desktop-v3 verify (ubuntu)",
            started_at: "2026-04-15T01:00:00Z",
            status: "completed",
            steps: [],
          },
        ],
      })
      .mockResolvedValueOnce([
        {
          annotation_level: "failure",
          message: "billing blocked",
          path: ".github",
          raw_details: "",
          title: "",
        },
      ]);

    const jobs = await fetchGithubJobsForRunForRemoteProof({
      authorizationHeader: "Basic test",
      baseUrl: "https://api.github.com/repos/AigcFox888/AigcFox",
      requestGithubApiJsonImpl,
      runId: 12345,
    });

    expect(jobs).toEqual([
      expect.objectContaining({
        annotations: [
          expect.objectContaining({
            annotationLevel: "failure",
            message: "billing blocked",
          }),
        ],
        checkRunId: 21,
        databaseId: 21,
      }),
    ]);
  });

  it("resolves latest run jobs by definition against the filtered branch", async () => {
    const fetchGithubJobsForRunForRemoteProofImpl = vi.fn(async ({ runId }) => [{ databaseId: runId }]);

    const jobsByRunId = await fetchGithubLatestRunJobsByDefinition({
      authorizationHeader: "Basic test",
      baseUrl: "https://api.github.com/repos/AigcFox888/AigcFox",
      definitions: [
        {
          expectedBranch: "feature/desktop-v3-wave1-clean",
          workflowName: "desktop-v3-package",
        },
      ],
      fetchGithubJobsForRunForRemoteProofImpl,
      requestGithubApiJsonImpl: vi.fn(),
      workflowRunsByName: new Map([
        [
          "desktop-v3-package",
          [
            {
              id: 300,
              head_branch: "feature/desktop-v3-wave1-clean",
            },
            {
              id: 200,
              head_branch: "feature/desktop-v3-wave1-clean",
            },
          ],
        ],
      ]),
    });

    expect(fetchGithubJobsForRunForRemoteProofImpl).toHaveBeenCalledTimes(1);
    expect(fetchGithubJobsForRunForRemoteProofImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 300,
      }),
    );
    expect(jobsByRunId.get(300)).toEqual([{ databaseId: 300 }]);
  });

  it("builds a failed check when workflow runs do not include a successful result", () => {
    const workflowsByName = new Map([
      ["desktop-v3-package", { id: 12345, name: "desktop-v3-package", path: ".github/workflows/desktop-v3-package.yml", state: "active" }],
    ]);
    const workflowRunsByName = new Map([
      [
        "desktop-v3-package",
        [
          {
            id: 1,
            conclusion: "failure",
            created_at: "2026-04-15T00:00:00Z",
            event: "push",
            head_branch: "feature/desktop-v3-wave1-clean",
            head_sha: "failed-head",
            html_url: "https://example.com/runs/1",
            name: "desktop-v3-package",
            run_number: 1,
            status: "completed",
          },
        ],
      ],
    ]);

    const check = buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, {
      expectedBranch: "feature/desktop-v3-wave1-clean",
      expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-package-clean-branch",
      name: "desktop-v3 clean branch package",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("latest_run_not_successful");
    expect(check.latestRun?.headSha).toBe("failed-head");
  });

  it("fails when the latest run does not cover the current remote-tracking head", () => {
    const workflowsByName = new Map([
      ["desktop-v3-package", { id: 12345, name: "desktop-v3-package", path: ".github/workflows/desktop-v3-package.yml", state: "active" }],
    ]);
    const workflowRunsByName = new Map([
      [
        "desktop-v3-package",
        [
          {
            id: 2,
            conclusion: "success",
            created_at: "2026-04-15T01:00:00Z",
            event: "push",
            head_branch: "feature/desktop-v3-wave1-clean",
            head_sha: "old-success-head",
            html_url: "https://example.com/runs/2",
            name: "desktop-v3-package",
            run_number: 2,
            status: "completed",
          },
        ],
      ],
    ]);

    const check = buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, {
      expectedBranch: "feature/desktop-v3-wave1-clean",
      expectedHeadSha: "new-remote-tracking-head",
      expectedRef: "origin/feature/desktop-v3-wave1-clean",
      expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-package-clean-branch",
      name: "desktop-v3 clean branch package",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("latest_run_head_mismatch");
    expect(check.expectedHeadSha).toBe("new-remote-tracking-head");
    expect(check.expectedRef).toBe("origin/feature/desktop-v3-wave1-clean");
  });

  it("fails when the workflow path drifts from the frozen remote-proof expectation", () => {
    const workflowsByName = new Map([
      ["desktop-v3-package", { id: 12345, name: "desktop-v3-package", path: ".github/workflows/moved.yml", state: "active" }],
    ]);

    const check = buildGithubWorkflowRemoteProofCheck(workflowsByName, new Map(), {
      expectedBranch: "feature/desktop-v3-wave1-clean",
      expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-package-clean-branch",
      name: "desktop-v3 clean branch package",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("workflow_path_mismatch");
    expect(check.expectedWorkflowPath).toBe(".github/workflows/desktop-v3-package.yml");
    expect(check.workflow?.path).toBe(".github/workflows/moved.yml");
  });

  it("fails when the workflow state drifts from active", () => {
    const workflowsByName = new Map([
      ["desktop-v3-package", { id: 12345, name: "desktop-v3-package", path: ".github/workflows/desktop-v3-package.yml", state: "disabled_manually" }],
    ]);

    const check = buildGithubWorkflowRemoteProofCheck(workflowsByName, new Map(), {
      expectedBranch: "feature/desktop-v3-wave1-clean",
      expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-package-clean-branch",
      name: "desktop-v3 clean branch package",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("workflow_state_mismatch");
    expect(check.expectedWorkflowState).toBe("active");
    expect(check.workflow?.state).toBe("disabled_manually");
  });
});
