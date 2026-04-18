import { EventEmitter } from "node:events";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { terminateDesktopV3MockDevServerConflict } from "./desktop-process.mjs";
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
      devServerPort: 31420,
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
      devServerPort: 31420,
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
    const terminateMockDevServerConflictImpl = vi.fn(async () => null);

    const summary = await runDesktopV3TauriDevSmoke(config, {
      closeWritableStreamImpl,
      createWriteStreamImpl: () => logStream,
      detectMarkersImpl: () => ({
        cargoRunning: true,
        commandInvocations: ["desktop_get_backend_liveness"],
        devRequests: [
          {
            method: "GET",
            url: "http://127.0.0.1:31420/",
          },
        ],
        documentBootSeen: true,
        mainWindowNavigations: [
          {
            allowed: true,
            url: "http://127.0.0.1:31420/",
          },
        ],
        mainWindowPageLoadFinished: true,
        mainWindowPageLoadStarted: true,
        pageLoads: [
          {
            event: "finished",
            url: "http://127.0.0.1:31420/",
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
      terminateMockDevServerConflictImpl,
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
    expect(terminateMockDevServerConflictImpl).toHaveBeenCalledWith(
      config.rootDir,
      expect.objectContaining({
        port: 31420,
      }),
    );
    expect(terminateChildProcessImpl).toHaveBeenCalledOnce();
    expect(closeWritableStreamImpl).toHaveBeenCalledWith(logStream);
  });

  it("waits for the renderer app boot marker before passing", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      devServerPort: 31420,
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
    const closeWritableStreamImpl = vi.fn(async () => {});
    const logStream = {
      write: vi.fn(),
    };
    let pollCount = 0;
    const detectMarkersImpl = vi.fn(() => {
      pollCount += 1;

      return {
        cargoRunning: true,
        commandInvocations: pollCount >= 2 ? ["desktop_report_renderer_boot"] : [],
        devRequests: [],
        documentBootSeen: true,
        mainWindowNavigations: [
          {
            allowed: true,
            url: "http://127.0.0.1:31420/",
          },
        ],
        mainWindowPageLoadFinished: true,
        mainWindowPageLoadStarted: true,
        pageLoads: [
          {
            event: "finished",
            url: "http://127.0.0.1:31420/",
          },
        ],
        rendererBootSeen: pollCount >= 2,
        rendererBoots: pollCount >= 2
          ? [
              {
                route: "#/",
                runtime: "tauri",
                stage: "app",
              },
            ]
          : [],
        viteReady: true,
        windowWarnings: [],
      };
    });

    const summary = await runDesktopV3TauriDevSmoke(config, {
      closeWritableStreamImpl,
      createWriteStreamImpl: () => logStream,
      detectMarkersImpl,
      detectWindowRegistrationImpl: () => true,
      mkdirImpl: async () => {},
      readFileImpl: async () => "[weston]",
      sleepImpl: async () => {},
      spawnImpl: () => child,
      statIfExistsImpl: async () => ({ size: 0 }),
      terminateMockDevServerConflictImpl: async () => null,
      terminateChildProcessImpl: async () => {},
      writeJsonFileImpl,
    });

    expect(summary.status).toBe("passed");
    expect(summary.markers.rendererBootSeen).toBe(true);
    expect(summary.observed.commandInvocations).toEqual(["desktop_report_renderer_boot"]);
    expect(detectMarkersImpl).toHaveBeenCalledTimes(2);
    expect(closeWritableStreamImpl).toHaveBeenCalledWith(logStream);
  });

  it("surfaces port conflicts and still tears down the detached dev process group", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      devServerPort: 31420,
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
    child.pid = 4242;
    const writeJsonFileImpl = vi.fn(async () => {});
    const closeWritableStreamImpl = vi.fn(async () => {});
    const logStream = {
      end: (callback) => callback?.(),
      write: vi.fn(),
    };
    const killSpy = vi.spyOn(process, "kill").mockImplementation(() => true);

    setTimeout(() => {
      child.stderr.emit(
        "data",
        Buffer.from(
          [
            "error when starting dev server:",
            "Error: Port 31420 is already in use",
            '   Error The "beforeDevCommand" terminated with a non-zero status code.',
          ].join("\n"),
        ),
      );
      child.exitCode = 1;
      child.emit("close", 1, null);
    }, 0);

    await expect(
      runDesktopV3TauriDevSmoke(config, {
        closeWritableStreamImpl,
        createWriteStreamImpl: () => logStream,
        detectStartupFailureImpl: (output) =>
          output.includes("Port 31420 is already in use")
            ? "desktop-v3 tauri dev could not start because Vite port 31420 is already in use."
            : null,
        mkdirImpl: async () => {},
        readFileImpl: async () => "[weston]",
        sleepImpl: async () => new Promise((resolve) => setTimeout(resolve, 0)),
        spawnImpl: () => child,
        statIfExistsImpl: async () => ({ size: 0 }),
        terminateMockDevServerConflictImpl: async () => null,
        writeJsonFileImpl,
      }),
    ).rejects.toThrow("desktop-v3 tauri dev could not start because Vite port 31420 is already in use.");

    expect(killSpy).toHaveBeenCalledWith(-4242, "SIGTERM");
    expect(writeJsonFileImpl).toHaveBeenCalledWith(
      config.summaryPath,
      expect.objectContaining({
        error: "desktop-v3 tauri dev could not start because Vite port 31420 is already in use.",
        status: "failed",
      }),
    );
    expect(closeWritableStreamImpl).toHaveBeenCalledWith(logStream);

    killSpy.mockRestore();
  });

  it("records a warning when a conflicting mock dev server is terminated before boot", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      devServerPort: 31420,
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
    const closeWritableStreamImpl = vi.fn(async () => {});
    const logStream = {
      write: vi.fn(),
    };

    const summary = await runDesktopV3TauriDevSmoke(config, {
      closeWritableStreamImpl,
      createWriteStreamImpl: () => logStream,
      detectMarkersImpl: () => ({
        cargoRunning: true,
        commandInvocations: [],
        devRequests: [],
        documentBootSeen: true,
        mainWindowNavigations: [],
        mainWindowPageLoadFinished: true,
        mainWindowPageLoadStarted: true,
        pageLoads: [],
        rendererBootSeen: true,
        rendererBoots: [],
        viteReady: true,
        windowWarnings: [],
      }),
      detectWindowRegistrationImpl: () => true,
      mkdirImpl: async () => {},
      readFileImpl: async () => "[weston]",
      sleepImpl: async () => {},
      spawnImpl: () => child,
      statIfExistsImpl: async () => ({ size: 0 }),
      terminateMockDevServerConflictImpl: async () => ({
        listenerPid: 11290,
        ownerPid: 11263,
        pgid: 11263,
        port: 31420,
      }),
      terminateChildProcessImpl: async () => {},
      writeJsonFileImpl,
    });

    expect(summary.status).toBe("passed");
    expect(summary.warnings).toContain(
      "Terminated conflicting desktop-v3 mock dev server process group 11263 before tauri host smoke.",
    );
    expect(closeWritableStreamImpl).toHaveBeenCalledWith(logStream);
  });
});

describe("terminateDesktopV3MockDevServerConflict", () => {
  it("terminates a detected repo-owned mock dev server process group", async () => {
    const killSpy = vi.spyOn(process, "kill").mockImplementation(() => true);
    const findConflictImpl = vi.fn()
      .mockResolvedValueOnce({
        listenerPid: 11290,
        ownerPid: 11263,
        pgid: 11263,
        port: 31420,
      })
      .mockResolvedValueOnce(null);

    await expect(
      terminateDesktopV3MockDevServerConflict("/workspace", {
        findConflictImpl,
        sleepImpl: async () => {},
      }),
    ).resolves.toEqual({
      listenerPid: 11290,
      ownerPid: 11263,
      pgid: 11263,
      port: 31420,
    });

    expect(killSpy).toHaveBeenCalledWith(-11263, "SIGTERM");
    killSpy.mockRestore();
  });
});
