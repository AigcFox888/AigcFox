import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveGithubRepoContext } from "./github-repo-api.mjs";
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
      expectedWorkflowPath: ".github/workflows/desktop-v3-delivery-updater-docs.yml",
      expectedWorkflowState: "active",
      id: "desktop-v3-delivery-updater-docs-remote-proof",
      name: "desktop-v3 delivery/updater docs remote proof",
      workflowName: "desktop-v3-delivery-updater-docs",
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
    rootDir,
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
    targetBranch: env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_REMOTE_PROOF_BRANCH?.trim() || repoContext.currentBranch,
  };
}
