import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3PackagedAppSmokeHelpText,
  runDesktopV3PackagedAppSmokeCli,
} from "./verify-desktop-v3-packaged-app-smoke.mjs";

describe("verify-desktop-v3-packaged-app-smoke", () => {
  it("prints help without running the packaged binary", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3PackagedAppSmokeCli({
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
    expect(logs).toEqual([buildDesktopV3PackagedAppSmokeHelpText()]);
  });

  it("runs packaged smoke and logs the success summary", async () => {
    const config = {
      binaryPath: "/tmp/aigcfox-desktop-v3",
      latestSummaryPath: "/tmp/packaged/latest-summary.json",
      outputDir: "/tmp/packaged",
      summaryPath: "/tmp/packaged/summary.json",
    };
    const summary = {
      latestSummaryPath: "/tmp/packaged/latest-summary.json",
      summaryPath: "/tmp/packaged/summary.json",
    };
    const assertSummaryCopiesImpl = vi.fn(async () => {});
    const consoleLogImpl = vi.fn();
    const resolveConfigImpl = vi.fn(() => config);
    const runSmokeImpl = vi.fn(async (receivedConfig) => {
      expect(receivedConfig).toBe(config);
      return summary;
    });

    const result = await runDesktopV3PackagedAppSmokeCli({
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
      "desktop-v3 packaged app smoke passed. Summary: /tmp/packaged/summary.json | Latest: /tmp/packaged/latest-summary.json",
    );
  });
});
