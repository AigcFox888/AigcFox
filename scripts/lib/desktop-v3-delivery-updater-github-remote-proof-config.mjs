import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveGithubRepoContext, resolveRemoteTrackingRef } from "./github-repo-api.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_GITHUB_REMOTE_PROOF_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

export function buildDesktopV3DeliveryUpdaterGithubRemoteProofDefinitions(config) {
  return [
    {
      expectedBranch: config.targetBranch,
      expectedHeadSha: config.remoteTrackingHeadSha,
      expectedRef: config.remoteTrackingRef,
      expectedWorkflowPath: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-delivery-updater-docs-remote-proof",
      name: "desktop-v3 delivery/updater docs remote proof",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-delivery-updater-docs",
    },
    {
      expectedBranch: config.targetBranch,
      expectedHeadSha: config.remoteTrackingHeadSha,
      expectedRef: config.remoteTrackingRef,
      expectedWorkflowPath: ".github/workflows/desktop-v3-ci.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-ci-remote-proof",
      name: "desktop-v3 ci remote proof",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-ci",
    },
    {
      expectedBranch: config.targetBranch,
      expectedHeadSha: config.remoteTrackingHeadSha,
      expectedRef: config.remoteTrackingRef,
      expectedWorkflowPath: ".github/workflows/desktop-v3-package.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-package-remote-proof",
      name: "desktop-v3 package remote proof",
      requireLatestRunSuccess: true,
      workflowName: "desktop-v3-package",
    },
  ];
}

export function resolveDesktopV3DeliveryUpdaterGithubRemoteProofConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const repoContext = resolveGithubRepoContext({
    currentBranch: options.currentBranch,
    cwd: options.cwd ?? rootDir,
    originUrl: options.originUrl,
  });
  const targetBranch =
    env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_REMOTE_PROOF_BRANCH?.trim() || repoContext.currentBranch;
  const remoteTracking = resolveRemoteTrackingRef({
    branch: targetBranch,
    cwd: options.cwd ?? rootDir,
    remoteTrackingHeadSha: options.remoteTrackingHeadSha,
    remoteTrackingRef: options.remoteTrackingRef,
  });
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_GITHUB_REMOTE_PROOF_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-delivery-updater-github-remote-proof-${runId}`);

  return {
    currentBranch: repoContext.currentBranch,
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-delivery-updater-github-remote-proof-summary.json",
    ),
    outputDir,
    owner: repoContext.owner,
    repo: repoContext.repo,
    remoteTrackingHeadSha: remoteTracking.headSha,
    remoteTrackingRef: remoteTracking.ref,
    rootDir,
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
    targetBranch,
  };
}
