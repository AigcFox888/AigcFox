import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export {
  detectDesktopV3DevMarkers,
  detectDesktopV3DevStartupFailure,
  stripAnsi,
} from "./desktop-v3-tauri-dev-log-signals.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function detectDesktopV3WslgWindowRegistration(logText, appId = "aigcfox-desktop-v3") {
  return new RegExp(`appId:\\s*${appId}`, "u").test(logText);
}

export function resolveDesktopV3TauriDevSmokeConfig(env = process.env) {
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_TAURI_DEV_SMOKE_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-tauri-dev-smoke-${runStamp}`);

  return {
    appId: env.AIGCFOX_DESKTOP_V3_TAURI_DEV_APP_ID?.trim() || "aigcfox-desktop-v3",
    devServerPort: parseInteger(env.AIGCFOX_DESKTOP_V3_TAURI_DEV_PORT, 31420),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-tauri-dev-smoke-summary.json",
    ),
    outputDir,
    logPath: path.join(outputDir, "tauri-dev.log"),
    postReadyDelayMs: parseInteger(env.AIGCFOX_DESKTOP_V3_TAURI_DEV_POST_READY_DELAY_MS, 0),
    summaryPath: path.join(outputDir, "summary.json"),
    timeoutMs: parseInteger(env.AIGCFOX_DESKTOP_V3_TAURI_DEV_TIMEOUT_MS, 180_000),
    pollIntervalMs: parseInteger(env.AIGCFOX_DESKTOP_V3_TAURI_DEV_POLL_INTERVAL_MS, 500),
    westonLogPath: env.AIGCFOX_DESKTOP_V3_TAURI_DEV_WESTON_LOG?.trim() || "/mnt/wslg/weston.log",
    rootDir,
  };
}

export function resolveDesktopV3TauriDevSmokeEnv(baseEnv = process.env) {
  const nextEnv = { ...baseEnv };
  const appliedEnvOverrides = {};
  const isWsl = typeof baseEnv.WSL_DISTRO_NAME === "string" && baseEnv.WSL_DISTRO_NAME.length > 0;

  if (
    isWsl &&
    (!baseEnv.LIBGL_ALWAYS_SOFTWARE || baseEnv.LIBGL_ALWAYS_SOFTWARE.trim().length === 0)
  ) {
    nextEnv.LIBGL_ALWAYS_SOFTWARE = "1";
    appliedEnvOverrides.LIBGL_ALWAYS_SOFTWARE = "1";
  }

  if (!baseEnv.VITE_DESKTOP_V3_RUNTIME_MODE || baseEnv.VITE_DESKTOP_V3_RUNTIME_MODE.trim().length === 0) {
    nextEnv.VITE_DESKTOP_V3_RUNTIME_MODE = "tauri";
    appliedEnvOverrides.VITE_DESKTOP_V3_RUNTIME_MODE = "tauri";
  }

  if (
    !baseEnv.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE ||
    baseEnv.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE.trim().length === 0
  ) {
    nextEnv.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE = "1";
    appliedEnvOverrides.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE = "1";
  }

  return {
    appliedEnvOverrides,
    env: nextEnv,
  };
}
