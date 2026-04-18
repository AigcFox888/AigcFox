import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { spawn } from "node:child_process";

import {
  closeWritableStream,
  terminateChildProcess,
  terminateDesktopV3MockDevServerConflict,
} from "./desktop-process.mjs";
import {
  detectDesktopV3DevMarkers,
  detectDesktopV3DevStartupFailure,
  resolveDesktopV3TauriDevSmokeEnv,
  detectDesktopV3WslgWindowRegistration,
} from "./desktop-v3-tauri-dev-smoke.mjs";
import { assertDesktopV3TauriDevSmokeSummaryContract } from "./desktop-v3-smoke-summary-contract.mjs";
import { sleep, statIfExists, writeJsonFile } from "./script-io.mjs";
import { persistVerificationSummary } from "./verification-summary-output.mjs";

export function createDesktopV3TauriDevSmokeSummary(config) {
  return {
    checkedAt: new Date().toISOString(),
    status: "running",
    appId: config.appId,
    latestSummaryPath: config.latestSummaryPath,
    outputDir: config.outputDir,
    summaryPath: config.summaryPath,
    logPath: config.logPath,
    westonLogPath: config.westonLogPath,
    timeoutMs: config.timeoutMs,
    postReadyDelayMs: config.postReadyDelayMs,
    appliedEnvOverrides: {},
    markers: {
      viteReady: false,
      cargoRunning: false,
      wslgWindowRegistered: false,
      mainWindowPageLoadStarted: false,
      mainWindowPageLoadFinished: false,
      documentBootSeen: false,
      rendererBootSeen: false,
    },
    observed: {
      commandInvocations: [],
      devRequests: [],
      mainWindowNavigations: [],
      pageLoads: [],
      rendererBoots: [],
    },
    warnings: [],
    error: null,
  };
}

async function readWestonDelta(config, initialOffset, options = {}) {
  const readFileImpl = options.readFileImpl ?? fsPromises.readFile;
  const content = await readFileImpl(config.westonLogPath, "utf8");
  return content.slice(initialOffset);
}

async function validateAndWriteDesktopV3TauriDevSummary(config, summary, writeJsonFileImpl) {
  assertDesktopV3TauriDevSmokeSummaryContract(summary, {
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
      writeJsonFileImpl,
    },
  );
}

export async function runDesktopV3TauriDevSmoke(config, options = {}) {
  const summary = createDesktopV3TauriDevSmokeSummary(config);
  const mkdirImpl = options.mkdirImpl ?? fsPromises.mkdir;
  const statIfExistsImpl = options.statIfExistsImpl ?? statIfExists;
  const createWriteStreamImpl = options.createWriteStreamImpl ?? fs.createWriteStream;
  const resolveEnvImpl = options.resolveEnvImpl ?? resolveDesktopV3TauriDevSmokeEnv;
  const spawnImpl = options.spawnImpl ?? spawn;
  const sleepImpl = options.sleepImpl ?? sleep;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;
  const terminateChildProcessImpl = options.terminateChildProcessImpl ?? terminateChildProcess;
  const terminateMockDevServerConflictImpl =
    options.terminateMockDevServerConflictImpl ?? terminateDesktopV3MockDevServerConflict;
  const closeWritableStreamImpl = options.closeWritableStreamImpl ?? closeWritableStream;
  const detectMarkersImpl = options.detectMarkersImpl ?? detectDesktopV3DevMarkers;
  const detectStartupFailureImpl =
    options.detectStartupFailureImpl ?? detectDesktopV3DevStartupFailure;
  const detectWindowRegistrationImpl =
    options.detectWindowRegistrationImpl ?? detectDesktopV3WslgWindowRegistration;
  let childExit = null;

  await mkdirImpl(config.outputDir, { recursive: true });

  const terminatedMockDevServerConflict = await terminateMockDevServerConflictImpl(config.rootDir, {
    port: config.devServerPort,
    sleepImpl,
  });

  if (terminatedMockDevServerConflict) {
    summary.warnings.push(
      `Terminated conflicting desktop-v3 mock dev server process group ${terminatedMockDevServerConflict.pgid} before tauri host smoke.`,
    );
  }

  const westonStat = await statIfExistsImpl(config.westonLogPath);
  if (!westonStat) {
    summary.status = "failed";
    summary.error = `WSLg weston log not found: ${config.westonLogPath}`;
    await validateAndWriteDesktopV3TauriDevSummary(config, summary, writeJsonFileImpl);
    throw new Error(summary.error);
  }

  const westonInitialSize = westonStat.size;
  const logStream = createWriteStreamImpl(config.logPath, { flags: "w" });
  const runtimeEnv = resolveEnvImpl(process.env);
  summary.appliedEnvOverrides = runtimeEnv.appliedEnvOverrides;
  const child = spawnImpl("pnpm", ["--filter", "@aigcfox/desktop-v3", "tauri", "dev"], {
    cwd: config.rootDir,
    detached: process.platform !== "win32",
    env: runtimeEnv.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let outputBuffer = "";

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
      const markers = detectMarkersImpl(outputBuffer);
      const westonDelta = await readWestonDelta(config, westonInitialSize, options);

      summary.markers.viteReady = markers.viteReady;
      summary.markers.cargoRunning = markers.cargoRunning;
      summary.markers.wslgWindowRegistered = detectWindowRegistrationImpl(
        westonDelta,
        config.appId,
      );
      summary.markers.mainWindowPageLoadStarted = markers.mainWindowPageLoadStarted;
      summary.markers.mainWindowPageLoadFinished = markers.mainWindowPageLoadFinished;
      summary.markers.documentBootSeen = markers.documentBootSeen;
      summary.markers.rendererBootSeen = markers.rendererBootSeen;
      summary.observed.commandInvocations = markers.commandInvocations;
      summary.observed.devRequests = markers.devRequests;
      summary.observed.mainWindowNavigations = markers.mainWindowNavigations;
      summary.observed.pageLoads = markers.pageLoads;
      summary.observed.rendererBoots = markers.rendererBoots;
      summary.warnings = Array.from(
        new Set([
          ...summary.warnings,
          ...markers.windowWarnings,
        ]),
      );
      const startupFailure = detectStartupFailureImpl(outputBuffer);

      if (startupFailure) {
        throw new Error(startupFailure);
      }

      if (childExit && childExit.code !== 0) {
        throw new Error(`desktop-v3 tauri dev exited early with code ${childExit.code ?? "unknown"}.`);
      }

      if (
        summary.markers.viteReady &&
        summary.markers.cargoRunning &&
        summary.markers.wslgWindowRegistered &&
        summary.markers.mainWindowPageLoadFinished
      ) {
        if (config.postReadyDelayMs > 0) {
          await sleepImpl(config.postReadyDelayMs);
        }
        summary.status = "passed";
        await validateAndWriteDesktopV3TauriDevSummary(config, summary, writeJsonFileImpl);
        return summary;
      }

      await sleepImpl(config.pollIntervalMs);
    }

    const startupFailure = detectStartupFailureImpl(outputBuffer);

    if (startupFailure) {
      throw new Error(startupFailure);
    }

    throw new Error(
      "desktop-v3 tauri dev smoke timed out before Vite ready, cargo running, WSLg window registration, and main-window page-load finished all became true.",
    );
  } catch (error) {
    summary.status = "failed";
    summary.error = error instanceof Error ? error.message : String(error);
    await validateAndWriteDesktopV3TauriDevSummary(config, summary, writeJsonFileImpl);
    throw error;
  } finally {
    await terminateChildProcessImpl(child, {
      forceKillOnTimeout: true,
      useWindowsTaskkillTree: false,
      useUnixProcessGroup: process.platform !== "win32",
      waitForCloseTimeoutMs: 5000,
    });
    await closeWritableStreamImpl(logStream);
  }
}
