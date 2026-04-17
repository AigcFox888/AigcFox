import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

export const desktopV3ResponsiveSmokeRoutes = [
  {
    href: "/#/",
    hash: "#/",
    key: "dashboard",
    testId: "desktop-v3-dashboard-page",
  },
  {
    href: "/#/preferences",
    hash: "#/preferences",
    key: "preferences",
    testId: "desktop-v3-preferences-page",
  },
  {
    href: "/#/diagnostics",
    hash: "#/diagnostics",
    key: "diagnostics",
    testId: "desktop-v3-diagnostics-page",
  },
];

export const desktopV3ResponsiveSmokeViewports = [
  {
    expectedLayoutMode: "compact",
    expectedSidebarWidth: 200,
    height: 900,
    key: "w1000",
    width: 1000,
  },
  {
    expectedLayoutMode: "compact",
    expectedSidebarWidth: 200,
    height: 900,
    key: "w1280",
    width: 1280,
  },
  {
    expectedLayoutMode: "standard",
    expectedSidebarWidth: 240,
    height: 900,
    key: "w1366",
    width: 1366,
  },
  {
    expectedLayoutMode: "standard",
    expectedSidebarWidth: 240,
    height: 900,
    key: "w1440",
    width: 1440,
  },
  {
    expectedLayoutMode: "centered",
    expectedSidebarWidth: 240,
    height: 900,
    key: "w1920",
    width: 1920,
  },
];

function normalizeBaseUrl(value) {
  const trimmed =
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : "http://127.0.0.1:1421";

  return trimmed.replace(/\/+$/u, "");
}

export function resolveDesktopV3ResponsiveSmokeConfig(env = process.env) {
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_SMOKE_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "playwright", `desktop-v3-responsive-smoke-${runStamp}`);

  return {
    baseUrl: normalizeBaseUrl(env.AIGCFOX_DESKTOP_V3_SMOKE_BASE_URL),
    browserHeadless: env.AIGCFOX_DESKTOP_V3_SMOKE_HEADLESS !== "false",
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-responsive-smoke-summary.json",
    ),
    outputDir,
    previewLogPath: path.join(outputDir, "desktop-v3-preview.log"),
    previewTimeoutMs: Number.parseInt(
      env.AIGCFOX_DESKTOP_V3_SMOKE_PREVIEW_TIMEOUT_MS ?? "30000",
      10,
    ),
    rootDir,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
