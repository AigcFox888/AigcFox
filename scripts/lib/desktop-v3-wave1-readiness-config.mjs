import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");
const documentFiles = [
  "docs/281-desktop-v3-post-reinstall-recovery-entry.md",
  "docs/README.md",
  "docs/248-autonomous-execution-baseline.md",
  "docs/257-desktop-v3-replatform-proposal.md",
  "docs/258-desktop-v3-technical-baseline.md",
  "docs/259-desktop-v3-detailed-design.md",
  "docs/260-desktop-v3-wave1-execution-baseline.md",
  "docs/263-desktop-v3-wave1-acceptance-matrix.md",
  "docs/264-desktop-v3-wave1-execution-runbook.md",
  "docs/267-desktop-v3-github-actions-baseline.md",
  "docs/269-desktop-v3-tauri-2-governance-baseline.md",
  "apps/desktop-v3/README.md",
];

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_WAVE1_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

export function isDesktopV3Wave1WslHost(env = process.env) {
  return typeof env.WSL_DISTRO_NAME === "string" && env.WSL_DISTRO_NAME.trim().length > 0;
}

export function resolveDesktopV3Wave1ReadinessConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const profile =
    env.AIGCFOX_DESKTOP_V3_WAVE1_PROFILE?.trim() ||
    (env.GITHUB_ACTIONS === "true" ? "ci" : "default");
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-wave1-readiness-${runId}`);

  return {
    documentFiles,
    hostPlatform: process.platform,
    isWslHost: isDesktopV3Wave1WslHost(env),
    latestSummaryPath: resolveLatestVerificationSummaryPath(rootDir, "desktop-v3-wave1-readiness-summary.json"),
    commandGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-command-governance-summary.json",
    ),
    commandGovernanceOutputDir: path.join(outputDir, "command-governance"),
    backendClientGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-backend-client-governance-summary.json",
    ),
    backendClientGovernanceOutputDir: path.join(outputDir, "backend-client-governance"),
    appShellGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-app-shell-governance-summary.json",
    ),
    appShellGovernanceOutputDir: path.join(outputDir, "app-shell-governance"),
    supportGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-support-governance-summary.json",
    ),
    supportGovernanceOutputDir: path.join(outputDir, "support-governance"),
    pageGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-page-governance-summary.json",
    ),
    pageGovernanceOutputDir: path.join(outputDir, "page-governance"),
    runtimeSkeletonGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-runtime-skeleton-governance-summary.json",
    ),
    runtimeSkeletonGovernanceOutputDir: path.join(outputDir, "runtime-skeleton-governance"),
    runtimeContractGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-runtime-contract-governance-summary.json",
    ),
    runtimeContractGovernanceOutputDir: path.join(outputDir, "runtime-contract-governance"),
    runtimeAdapterGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-runtime-adapter-governance-summary.json",
    ),
    runtimeAdapterGovernanceOutputDir: path.join(outputDir, "runtime-adapter-governance"),
    featureGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-feature-governance-summary.json",
    ),
    featureGovernanceOutputDir: path.join(outputDir, "feature-governance"),
    platformConfigGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-platform-config-governance-summary.json",
    ),
    platformConfigGovernanceOutputDir: path.join(outputDir, "platform-config-governance"),
    updaterGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-updater-governance-summary.json",
    ),
    updaterGovernanceOutputDir: path.join(outputDir, "updater-governance"),
    capabilityGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-capability-governance-summary.json",
    ),
    capabilityGovernanceOutputDir: path.join(outputDir, "capability-governance"),
    localdbGovernanceLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-localdb-governance-summary.json",
    ),
    localdbGovernanceOutputDir: path.join(outputDir, "localdb-governance"),
    outputDir,
    packagedAppSmokeLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-packaged-app-smoke-summary.json",
    ),
    packagedAppSmokeOutputDir: path.join(outputDir, "packaged-app-smoke"),
    profile,
    responsiveSmokeLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-responsive-smoke-summary.json",
    ),
    responsiveSmokeOutputDir: path.join(outputDir, "responsive-smoke"),
    rootDir,
    runtimeBoundaryLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-runtime-boundary-summary.json",
    ),
    runtimeBoundaryOutputDir: path.join(outputDir, "runtime-boundary"),
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
    tauriDevSmokeLatestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-tauri-dev-smoke-summary.json",
    ),
    tauriDevSmokeOutputDir: path.join(outputDir, "tauri-dev-smoke"),
  };
}
