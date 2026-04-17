import { buildGithubWorkflowRemoteProofCheck } from "./github-actions-remote-proof.mjs";
import { runGithubWorkflowRemoteProof } from "./github-actions-remote-proof-runner.mjs";
import {
  buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions,
  resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig,
} from "./desktop-v3-delivery-updater-github-remote-proof-config.mjs";

export function buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary(config, workflowsPayload, workflowRunsByName) {
  const workflows = Array.isArray(workflowsPayload?.workflows) ? workflowsPayload.workflows : [];
  const workflowsByName = new Map(workflows.map((workflow) => [workflow.name, workflow]));
  const checks = buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions(config).map((definition) =>
    buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, definition),
  );
  const failedChecks = checks.filter((check) => check.status !== "passed").map((check) => check.id);
  const latestSuccessfulRun = checks[0]?.latestSuccessfulRun ?? null;

  return {
    checkedAt: new Date().toISOString(),
    checks,
    currentBranch: config.currentBranch,
    failedChecks,
    latestSuccessfulHeadSha: latestSuccessfulRun?.headSha ?? null,
    latestSuccessfulRunId: latestSuccessfulRun?.databaseId ?? null,
    latestSuccessfulRunUrl: latestSuccessfulRun?.htmlUrl ?? null,
    latestSummaryPath: config.latestSummaryPath,
    outputDir: config.outputDir,
    owner: config.owner,
    repo: config.repo,
    runId: config.runId,
    status: failedChecks.length === 0 ? "passed" : "failed",
    summaryPath: config.summaryPath,
    targetBranch: config.targetBranch,
  };
}

export async function runDesktopV3DeliveryUpdaterGithubRemoteProof(options = {}) {
  const config = options.config ?? resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig();
  return runGithubWorkflowRemoteProof({
    ...options,
    buildSummary: buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary,
    config,
    definitions: buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions(config),
  });
}
