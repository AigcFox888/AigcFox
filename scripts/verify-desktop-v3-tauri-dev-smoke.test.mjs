import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3TauriDevSmokeHelpText,
  runDesktopV3TauriDevSmokeCli,
} from "./verify-desktop-v3-tauri-dev-smoke.mjs";

describe("verify-desktop-v3-tauri-dev-smoke", () => {
  it("prints help without running tauri dev", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3TauriDevSmokeCli({
      argv: ["--help"],
      consoleLogImpl: (message) => {
        logs.push(message);
      },
      runSmokeImpl: async () => {
        invoked = true;
        throw new Error("should not run");
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3TauriDevSmokeHelpText()]);
  });

  it("runs tauri dev smoke and logs the summary path", async () => {
    const config = {
      appId: "aigcfox-desktop-v3",
      latestSummaryPath: "/tmp/tauri-dev/latest-summary.json",
      outputDir: "/tmp/tauri-dev",
      summaryPath: "/tmp/tauri-dev/summary.json",
    };
    const summary = {
      latestSummaryPath: "/tmp/tauri-dev/latest-summary.json",
      summaryPath: "/tmp/tauri-dev/summary.json",
    };
    const assertSummaryCopiesImpl = vi.fn(async () => {});
    const consoleLogImpl = vi.fn();
    const resolveConfigImpl = vi.fn(() => config);
    const runSmokeImpl = vi.fn(async (receivedConfig) => {
      expect(receivedConfig).toBe(config);
      return summary;
    });

    const result = await runDesktopV3TauriDevSmokeCli({
      argv: [],
      assertSummaryCopiesImpl,
      consoleLogImpl,
      resolveConfigImpl,
      runSmokeImpl,
    });

    expect(result).toBe(summary);
    expect(assertSummaryCopiesImpl).toHaveBeenCalledWith(summary, config);
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(runSmokeImpl).toHaveBeenCalledWith(config);
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 tauri dev smoke passed. Summary: /tmp/tauri-dev/summary.json | Latest: /tmp/tauri-dev/latest-summary.json",
    );
  });
});
