import { buildGithubWorkflowRemoteProofCheck } from "./github-actions-remote-proof.mjs";
import { runGithubWorkflowRemoteProof } from "./github-actions-remote-proof-runner.mjs";
import {
  buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions,
  resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig,
} from "./desktop-v3-delivery-updater-github-remote-proof-config.mjs";

function detectGithubPlatformBlocker(latestRunJobs = []) {
  for (const job of latestRunJobs) {
    for (const annotation of job.annotations ?? []) {
      const message = annotation.message ?? "";

      if (
        message.includes("recent account payments have failed") ||
        message.includes("spending limit needs to be increased")
      ) {
        return {
          detail: message,
          reason: "github_actions_billing_blocked",
        };
      }
    }
  }

  return null;
}

export function buildDesktopV3DeliveryUpdaterGithubRemoteProofSummary(
  config,
  workflowsPayload,
  workflowRunsByName,
  extras = {},
) {
  const workflows = Array.isArray(workflowsPayload?.workflows) ? workflowsPayload.workflows : [];
  const workflowsByName = new Map(workflows.map((workflow) => [workflow.name, workflow]));
  const workflowJobsByRunId = extras.workflowJobsByRunId instanceof Map ? extras.workflowJobsByRunId : new Map();
  const checks = buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions(config).map((definition) => {
    const check = buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, definition);
    const latestRunJobs = check.latestRun?.databaseId
      ? workflowJobsByRunId.get(check.latestRun.databaseId) ?? []
      : [];
    const platformBlocker = detectGithubPlatformBlocker(latestRunJobs);

    if (platformBlocker && check.failureReason === "latest_run_not_successful") {
      return {
        ...check,
        failureDetail: platformBlocker.detail,
        failureReason: platformBlocker.reason,
        latestRunJobs,
      };
    }

    return {
      ...check,
      failureDetail: null,
      latestRunJobs,
    };
  });
  const failedChecks = checks.filter((check) => check.status !== "passed").map((check) => check.id);
  const latestSuccessfulRun = checks[0]?.latestSuccessfulRun ?? null;
  const externalBlockers = checks
    .filter((check) => check.failureReason === "github_actions_billing_blocked")
    .map((check) => ({
      checkId: check.id,
      detail: check.failureDetail,
      reason: check.failureReason,
    }));

  return {
    checkedAt: new Date().toISOString(),
    checks,
    currentBranch: config.currentBranch,
    externalBlockers,
    failedChecks,
    latestSuccessfulHeadSha: latestSuccessfulRun?.headSha ?? null,
    latestSuccessfulRunId: latestSuccessfulRun?.databaseId ?? null,
    latestSuccessfulRunUrl: latestSuccessfulRun?.htmlUrl ?? null,
    latestSummaryPath: config.latestSummaryPath,
    outputDir: config.outputDir,
    owner: config.owner,
    repo: config.repo,
    remoteTrackingHeadSha: config.remoteTrackingHeadSha,
    remoteTrackingRef: config.remoteTrackingRef,
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
