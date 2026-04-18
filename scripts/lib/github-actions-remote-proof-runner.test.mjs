import { describe, expect, it, vi } from "vitest";

import { runGithubWorkflowRemoteProof } from "./github-actions-remote-proof-runner.mjs";
import { createGithubRemoteProofTestConfigBuilder } from "./github-actions-remote-proof-test-helpers.mjs";

const buildConfig = createGithubRemoteProofTestConfigBuilder({
  latestSummaryPath: "/workspace/output/verification/latest/shared-remote-proof-summary.json",
  summaryPath: "/workspace/output/verification/shared-remote-proof-2026-04-16T01-00-00-000Z/summary.json",
});

describe("github-actions remote proof runner", () => {
  it("resolves credentials, fetches workflows and persists the built summary", async () => {
    const config = buildConfig();
    const definitions = [{ workflowName: "desktop-v3-ci" }];
    const credentials = { password: "test-token", protocol: "https", username: "x-access-token" };
    const summary = { latestSummaryPath: config.latestSummaryPath, status: "passed", summaryPath: config.summaryPath };
    const resolveGithubCredentialFromGitImpl = vi.fn(() => credentials);
    const buildGithubApiAuthorizationHeaderImpl = vi.fn(() => "Basic test");
    const requestGithubApiJsonImpl = vi.fn(async () => ({
      workflows: [{ id: 1, name: "desktop-v3-ci", path: ".github/workflows/desktop-v3-ci.yml", state: "active" }],
    }));
    const fetchGithubWorkflowRunsByDefinitionImpl = vi.fn(async () => new Map([["desktop-v3-ci", []]]));
    const fetchGithubLatestRunJobsByDefinitionImpl = vi.fn(async () => new Map());
    const buildSummary = vi.fn(async () => summary);
    const persistVerificationSummaryImpl = vi.fn(async () => {});

    const result = await runGithubWorkflowRemoteProof({
      buildGithubApiAuthorizationHeaderImpl,
      buildSummary,
      config,
      definitions,
      fetchGithubLatestRunJobsByDefinitionImpl,
      fetchGithubWorkflowRunsByDefinitionImpl,
      persistVerificationSummaryImpl,
      requestGithubApiJsonImpl,
      resolveGithubCredentialFromGitImpl,
    });

    expect(result).toBe(summary);
    expect(resolveGithubCredentialFromGitImpl).toHaveBeenCalledWith({
      cwd: config.rootDir,
      rawCredentialOutput: undefined,
    });
    expect(buildGithubApiAuthorizationHeaderImpl).toHaveBeenCalledWith(credentials);
    expect(requestGithubApiJsonImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/AigcFox888/AigcFox/actions/workflows",
      {
        authorizationHeader: "Basic test",
        fetchImpl: undefined,
      },
    );
    expect(fetchGithubWorkflowRunsByDefinitionImpl).toHaveBeenCalledWith({
      authorizationHeader: "Basic test",
      baseUrl: "https://api.github.com/repos/AigcFox888/AigcFox",
      definitions,
      fetchImpl: undefined,
      maxPages: undefined,
      perPage: undefined,
      requestGithubApiJsonImpl,
      workflowsByName: new Map([
        ["desktop-v3-ci", { id: 1, name: "desktop-v3-ci", path: ".github/workflows/desktop-v3-ci.yml", state: "active" }],
      ]),
    });
    expect(fetchGithubLatestRunJobsByDefinitionImpl).toHaveBeenCalledWith({
      authorizationHeader: "Basic test",
      baseUrl: "https://api.github.com/repos/AigcFox888/AigcFox",
      definitions,
      fetchImpl: undefined,
      maxPages: undefined,
      perPage: undefined,
      requestGithubApiJsonImpl,
      workflowRunsByName: new Map([["desktop-v3-ci", []]]),
    });
    expect(buildSummary).toHaveBeenCalledWith(
      config,
      {
        workflows: [{ id: 1, name: "desktop-v3-ci", path: ".github/workflows/desktop-v3-ci.yml", state: "active" }],
      },
      new Map([["desktop-v3-ci", []]]),
      {
        workflowJobsByRunId: new Map(),
      },
    );
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(summary, {
      archiveSummaryPath: config.summaryPath,
      latestSummaryPath: config.latestSummaryPath,
    });
  });

  it("honors explicit authorization headers and skips git credential resolution", async () => {
    const config = buildConfig();
    const requestGithubApiJsonImpl = vi.fn(async () => ({ workflows: [] }));
    const fetchGithubWorkflowRunsByDefinitionImpl = vi.fn(async () => new Map());
    const fetchGithubLatestRunJobsByDefinitionImpl = vi.fn(async () => new Map());
    const buildSummary = vi.fn(async () => ({ latestSummaryPath: config.latestSummaryPath, status: "passed", summaryPath: config.summaryPath }));
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveGithubCredentialFromGitImpl = vi.fn();
    const buildGithubApiAuthorizationHeaderImpl = vi.fn();

    await runGithubWorkflowRemoteProof({
      authorizationHeader: "Bearer explicit",
      buildGithubApiAuthorizationHeaderImpl,
      buildSummary,
      config,
      definitions: [],
      fetchGithubLatestRunJobsByDefinitionImpl,
      fetchGithubWorkflowRunsByDefinitionImpl,
      persistVerificationSummaryImpl,
      requestGithubApiJsonImpl,
      resolveGithubCredentialFromGitImpl,
    });

    expect(resolveGithubCredentialFromGitImpl).not.toHaveBeenCalled();
    expect(buildGithubApiAuthorizationHeaderImpl).not.toHaveBeenCalled();
    expect(requestGithubApiJsonImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/AigcFox888/AigcFox/actions/workflows",
      {
        authorizationHeader: "Bearer explicit",
        fetchImpl: undefined,
      },
    );
  });
});
