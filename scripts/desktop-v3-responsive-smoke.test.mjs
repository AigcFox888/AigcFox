import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3ResponsiveSmokeHelpText,
  runDesktopV3ResponsiveSmokeCli,
} from "./desktop-v3-responsive-smoke.mjs";

describe("desktop-v3-responsive-smoke", () => {
  it("prints help without running browser smoke", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3ResponsiveSmokeCli({
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
    expect(logs).toEqual([buildDesktopV3ResponsiveSmokeHelpText()]);
  });

  it("runs responsive smoke and logs the summary path", async () => {
    const config = {
      latestSummaryPath: "/tmp/responsive/latest-summary.json",
      outputDir: "/tmp/responsive",
      summaryPath: "/tmp/responsive/summary.json",
    };
    const summary = {
      latestSummaryPath: "/tmp/responsive/latest-summary.json",
      summaryPath: "/tmp/responsive/summary.json",
    };
    const assertSummaryCopiesImpl = vi.fn(async () => {});
    const consoleLogImpl = vi.fn();
    const resolveConfigImpl = vi.fn(() => config);
    const runSmokeImpl = vi.fn(async (receivedConfig) => {
      expect(receivedConfig).toBe(config);
      return summary;
    });

    const result = await runDesktopV3ResponsiveSmokeCli({
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
      "desktop-v3 responsive smoke passed. Summary: /tmp/responsive/summary.json | Latest: /tmp/responsive/latest-summary.json",
    );
  });
});
