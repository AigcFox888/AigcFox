import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");

export const desktopV3DeliveryUpdaterDocumentFiles = [
  "AGENTS.md",
  "docs/281-desktop-v3-post-reinstall-recovery-entry.md",
  "docs/README.md",
  "docs/248-autonomous-execution-baseline.md",
  "docs/267-desktop-v3-github-actions-baseline.md",
  "docs/269-desktop-v3-tauri-2-governance-baseline.md",
  "docs/274-desktop-v3-delivery-updater-proposal.md",
  "docs/275-desktop-v3-delivery-updater-technical-baseline.md",
  "docs/276-desktop-v3-delivery-updater-detailed-design.md",
  "docs/277-desktop-v3-delivery-updater-execution-baseline.md",
  "docs/278-desktop-v3-delivery-updater-acceptance-matrix.md",
  "docs/279-desktop-v3-delivery-updater-execution-runbook.md",
  "docs/280-desktop-v3-delivery-updater-closeout.md",
];

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_DOCS_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

export function resolveDesktopV3DeliveryUpdaterDocsConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_DOCS_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-delivery-updater-docs-${runId}`);

  return {
    documentFiles: desktopV3DeliveryUpdaterDocumentFiles,
    latestSummaryPath: resolveLatestVerificationSummaryPath(rootDir, "desktop-v3-delivery-updater-docs-summary.json"),
    outputDir,
    rootDir,
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
