import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { closeWritableStream, terminateChildProcess } from "./desktop-process.mjs";
import { detectDesktopV3HostMarkers } from "./desktop-v3-host-log-signals.mjs";
import { assertDesktopV3PackagedAppSmokeSummaryContract } from "./desktop-v3-smoke-summary-contract.mjs";
import { pathExists, sleep, statIfExists, writeJsonFile } from "./script-io.mjs";
import {
  persistVerificationSummary,
  resolveLatestVerificationSummaryPath,
} from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRequiredCommands(value) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function createSummary(config) {
  return {
    appId: config.appId,
    appliedEnvOverrides: {},
    binaryPath: config.binaryPath,
    checkedAt: new Date().toISOString(),
    error: null,
    initialRoute: config.initialRoute,
    logPath: config.logPath,
    markers: {
      documentBootSeen: false,
      mainWindowPageLoadFinished: false,
      mainWindowPageLoadStarted: false,
      rendererBootSeen: false,
      wslgWindowRegistered: false,
    },
    observed: {
      commandInvocations: [],
      devRequests: [],
      mainWindowNavigations: [],
      pageLoads: [],
      rendererBoots: [],
    },
    outputDir: config.outputDir,
    postReadyDelayMs: config.postReadyDelayMs,
    requiredCommandInvocations: config.requiredCommandInvocations,
    latestSummaryPath: config.latestSummaryPath,
    status: "running",
    summaryPath: config.summaryPath,
    timeoutMs: config.timeoutMs,
    warnings: [],
    westonLogPath: config.westonLogPath,
  };
}

async function readWestonDelta(westonLogPath, initialOffset) {
  if (typeof westonLogPath !== "string" || westonLogPath.length === 0) {
    return "";
  }

  const content = await fsPromises.readFile(westonLogPath, "utf8");
  return content.slice(initialOffset);
}

export function detectDesktopV3WslgWindowRegistration(logText, appId = "aigcfox-desktop-v3") {
  return new RegExp(`appId:\\s*${appId}`, "u").test(logText);
}

export function resolveDesktopV3PackagedAppSmokeConfig(env = process.env) {
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_SMOKE_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-packaged-app-smoke-${runStamp}`);
  const requiredCommandInvocations = parseRequiredCommands(
    env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_REQUIRED_COMMANDS,
  );

  return {
    appId: env.AIGCFOX_DESKTOP_V3_TAURI_DEV_APP_ID?.trim() || "aigcfox-desktop-v3",
    binaryPath:
      env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_BINARY?.trim() ||
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "target", "release", "aigcfox-desktop-v3"),
    initialRoute: env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_INITIAL_ROUTE?.trim() || "/preferences",
    latestSummaryPath: resolveLatestVerificationSummaryPath(rootDir, "desktop-v3-packaged-app-smoke-summary.json"),
    logPath: path.join(outputDir, "packaged-app.log"),
    outputDir,
    pollIntervalMs: parseInteger(env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_POLL_INTERVAL_MS, 500),
    postReadyDelayMs: parseInteger(env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_POST_READY_DELAY_MS, 750),
    requiredCommandInvocations:
      requiredCommandInvocations.length > 0
        ? requiredCommandInvocations
        : ["desktop_report_renderer_boot", "desktop_get_theme_preference"],
    rootDir,
    summaryPath: path.join(outputDir, "summary.json"),
    timeoutMs: parseInteger(env.AIGCFOX_DESKTOP_V3_PACKAGED_APP_TIMEOUT_MS, 90_000),
    westonLogPath: env.AIGCFOX_DESKTOP_V3_TAURI_DEV_WESTON_LOG?.trim() || "/mnt/wslg/weston.log",
  };
}

export function resolveDesktopV3PackagedAppSmokeEnv(baseEnv = process.env, config) {
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

  if (
    !baseEnv.AIGCFOX_DESKTOP_V3_TRACE_COMMANDS ||
    baseEnv.AIGCFOX_DESKTOP_V3_TRACE_COMMANDS.trim().length === 0
  ) {
    nextEnv.AIGCFOX_DESKTOP_V3_TRACE_COMMANDS = "1";
    appliedEnvOverrides.AIGCFOX_DESKTOP_V3_TRACE_COMMANDS = "1";
  }

  if (
    config?.initialRoute &&
    (!baseEnv.AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE ||
      baseEnv.AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE.trim().length === 0)
  ) {
    nextEnv.AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE = config.initialRoute;
    appliedEnvOverrides.AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE = config.initialRoute;
  }

  return {
    appliedEnvOverrides,
    env: nextEnv,
  };
}

function findMissingRequiredCommands(commandInvocations, requiredCommandInvocations) {
  return requiredCommandInvocations.filter((commandName) => !commandInvocations.includes(commandName));
}

async function validateAndPersistDesktopV3PackagedAppSummary(config, summary) {
  assertDesktopV3PackagedAppSmokeSummaryContract(summary, {
    expectedLatestSummaryPath: config.latestSummaryPath,
    expectedOutputDir: config.outputDir,
    expectedSummaryPath: config.summaryPath,
  });
  await persistVerificationSummary(
    summary,
    {
      archiveSummaryPath: config.summaryPath,
      latestSummaryPath: config.latestSummaryPath,
    },
    {
      writeJsonFileImpl: writeJsonFile,
    },
  );
}

export async function runDesktopV3PackagedAppSmoke(config, options = {}) {
  if (!(await pathExists(config.binaryPath))) {
    throw new Error(
      `desktop-v3 packaged app smoke requires a built release binary: ${config.binaryPath}. Run pnpm qa:desktop-v3-linux-package first.`,
    );
  }

  await fsPromises.mkdir(config.outputDir, { recursive: true });

  const summary = createSummary(config);
  const westonStat = await statIfExists(config.westonLogPath);
  const westonInitialSize = westonStat?.size ?? 0;
  const logStream = fs.createWriteStream(config.logPath, { flags: "w" });
  const runtimeEnv = resolveDesktopV3PackagedAppSmokeEnv(
    {
      ...process.env,
      ...(options.envOverrides ?? {}),
    },
    config,
  );
  summary.appliedEnvOverrides = runtimeEnv.appliedEnvOverrides;

  const child = spawn(config.binaryPath, [], {
    cwd: config.rootDir,
    detached: process.platform !== "win32",
    env: runtimeEnv.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let outputBuffer = "";
  let childExit = null;

  child.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    outputBuffer += text;
    logStream.write(text);
  });

  child.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    outputBuffer += text;
    logStream.write(text);
  });

  child.once("close", (code, signal) => {
    childExit = { code, signal };
  });

  try {
    const startedAt = Date.now();

    while (Date.now() - startedAt < config.timeoutMs) {
      if (childExit && childExit.code !== 0) {
        throw new Error(
          `desktop-v3 packaged app smoke exited early with code ${childExit.code ?? "unknown"}.`,
        );
      }

      const markers = detectDesktopV3HostMarkers(outputBuffer);
      summary.markers.documentBootSeen = markers.documentBootSeen;
      summary.markers.mainWindowPageLoadStarted = markers.mainWindowPageLoadStarted;
      summary.markers.mainWindowPageLoadFinished = markers.mainWindowPageLoadFinished;
      summary.markers.rendererBootSeen = markers.rendererBootSeen;
      summary.observed.commandInvocations = markers.commandInvocations;
      summary.observed.devRequests = markers.devRequests;
      summary.observed.mainWindowNavigations = markers.mainWindowNavigations;
      summary.observed.pageLoads = markers.pageLoads;
      summary.observed.rendererBoots = markers.rendererBoots;
      summary.warnings = markers.windowWarnings;

      if (westonStat) {
        const westonDelta = await readWestonDelta(config.westonLogPath, westonInitialSize);
        summary.markers.wslgWindowRegistered = detectDesktopV3WslgWindowRegistration(
          westonDelta,
          config.appId,
        );
      }

      const missingRequiredCommands = findMissingRequiredCommands(
        summary.observed.commandInvocations,
        config.requiredCommandInvocations,
      );

      if (
        summary.markers.mainWindowPageLoadFinished &&
        summary.markers.rendererBootSeen &&
        missingRequiredCommands.length === 0
      ) {
        if (config.postReadyDelayMs > 0) {
          await sleep(config.postReadyDelayMs);
        }

        summary.status = "passed";
        await validateAndPersistDesktopV3PackagedAppSummary(config, summary);
        return summary;
      }

      await sleep(config.pollIntervalMs);
    }

    const missingRequiredCommands = findMissingRequiredCommands(
      summary.observed.commandInvocations,
      config.requiredCommandInvocations,
    );

    throw new Error(
      `desktop-v3 packaged app smoke timed out before main-window page-load finished, renderer boot, and required commands were observed. Missing commands: ${missingRequiredCommands.join(", ") || "-"}.`,
    );
  } catch (error) {
    summary.status = "failed";
    summary.error = error instanceof Error ? error.message : String(error);
    await validateAndPersistDesktopV3PackagedAppSummary(config, summary);
    throw error;
  } finally {
    await terminateChildProcess(child, {
      forceKillOnTimeout: true,
      useWindowsTaskkillTree: false,
      useUnixProcessGroup: process.platform !== "win32",
      waitForCloseTimeoutMs: 5000,
    });
    await closeWritableStream(logStream);
  }
}
