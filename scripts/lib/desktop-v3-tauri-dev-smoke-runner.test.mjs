import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { runDesktopV3TauriDevSmoke } from "./desktop-v3-tauri-dev-smoke-runner.mjs";

function createMockChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

describe("desktop-v3 tauri dev smoke runner", () => {
  it("fails closed when the WSLg weston log is missing", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      latestSummaryPath: "/tmp/tauri-dev/latest-summary.json",
      logPath: "/tmp/tauri-dev.log",
      outputDir: "/tmp/tauri-dev",
      pollIntervalMs: 10,
      postReadyDelayMs: 0,
      rootDir: "/workspace",
      summaryPath: "/tmp/summary.json",
      timeoutMs: 1000,
      westonLogPath: "/mnt/wslg/weston.log",
    };
    const writeJsonFileImpl = vi.fn(async () => {});

    await expect(
      runDesktopV3TauriDevSmoke(config, {
        mkdirImpl: async () => {},
        statIfExistsImpl: async () => null,
        writeJsonFileImpl,
      }),
    ).rejects.toThrow("WSLg weston log not found: /mnt/wslg/weston.log");

    expect(writeJsonFileImpl).toHaveBeenCalledWith(
      config.summaryPath,
      expect.objectContaining({
        error: "WSLg weston log not found: /mnt/wslg/weston.log",
        latestSummaryPath: config.latestSummaryPath,
        status: "failed",
      }),
    );
    expect(writeJsonFileImpl).toHaveBeenCalledWith(
      config.latestSummaryPath,
      expect.objectContaining({
        error: "WSLg weston log not found: /mnt/wslg/weston.log",
        status: "failed",
      }),
    );
  });

  it("passes when dev markers and WSLg registration are observed", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      latestSummaryPath: "/tmp/tauri-dev/latest-summary.json",
      logPath: "/tmp/tauri-dev.log",
      outputDir: "/tmp/tauri-dev",
      pollIntervalMs: 10,
      postReadyDelayMs: 0,
      rootDir: "/workspace",
      summaryPath: "/tmp/summary.json",
      timeoutMs: 1000,
      westonLogPath: "/mnt/wslg/weston.log",
    };
    const child = createMockChild();
    const writeJsonFileImpl = vi.fn(async () => {});
    const terminateChildProcessImpl = vi.fn(async () => {});
    const closeWritableStreamImpl = vi.fn(async () => {});
    const logStream = {
      write: vi.fn(),
    };

    const summary = await runDesktopV3TauriDevSmoke(config, {
      closeWritableStreamImpl,
      createWriteStreamImpl: () => logStream,
      detectMarkersImpl: () => ({
        cargoRunning: true,
        commandInvocations: ["desktop_get_backend_liveness"],
        devRequests: [
          {
            method: "GET",
            url: "http://127.0.0.1:1420/",
          },
        ],
        documentBootSeen: true,
        mainWindowNavigations: [
          {
            allowed: true,
            url: "http://127.0.0.1:1420/",
          },
        ],
        mainWindowPageLoadFinished: true,
        mainWindowPageLoadStarted: true,
        pageLoads: [
          {
            event: "finished",
            url: "http://127.0.0.1:1420/",
          },
        ],
        rendererBootSeen: true,
        rendererBoots: [
          {
            route: "#/",
            runtime: "tauri",
            stage: "app",
          },
        ],
        viteReady: true,
        windowWarnings: [],
      }),
      detectWindowRegistrationImpl: () => true,
      mkdirImpl: async () => {},
      readFileImpl: async () => "[weston]",
      resolveEnvImpl: () => ({
        appliedEnvOverrides: {
          LIBGL_ALWAYS_SOFTWARE: "1",
        },
        env: { PATH: process.env.PATH ?? "" },
      }),
      sleepImpl: async () => {},
      spawnImpl: () => child,
      statIfExistsImpl: async () => ({ size: 0 }),
      terminateChildProcessImpl,
      writeJsonFileImpl,
    });

    expect(summary).toEqual(
      expect.objectContaining({
        appliedEnvOverrides: {
          LIBGL_ALWAYS_SOFTWARE: "1",
        },
        status: "passed",
      }),
    );
    expect(writeJsonFileImpl).toHaveBeenCalledWith(
      config.summaryPath,
      expect.objectContaining({
        latestSummaryPath: config.latestSummaryPath,
        status: "passed",
      }),
    );
    expect(writeJsonFileImpl).toHaveBeenCalledWith(
      config.latestSummaryPath,
      expect.objectContaining({
        status: "passed",
      }),
    );
    expect(terminateChildProcessImpl).toHaveBeenCalledOnce();
    expect(closeWritableStreamImpl).toHaveBeenCalledWith(logStream);
  });
});
