import { describe, expect, it, vi } from "vitest";

import {
  buildGithubWorkflowRemoteProofCheck,
  buildGithubWorkflowRunsUrl,
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
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("successful_run_missing");
    expect(check.latestRun?.headSha).toBe("failed-head");
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
      workflowName: "desktop-v3-package",
    });

    expect(check.status).toBe("failed");
    expect(check.failureReason).toBe("workflow_state_mismatch");
    expect(check.expectedWorkflowState).toBe("active");
    expect(check.workflow?.state).toBe("disabled_manually");
  });
});
