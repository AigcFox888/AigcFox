import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3Wave1ReadinessHelpText,
  runDesktopV3Wave1ReadinessCli,
} from "./verify-desktop-v3-wave1-readiness.mjs";

describe("verify-desktop-v3-wave1-readiness", () => {
  it("prints help without running readiness", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3Wave1ReadinessCli({
      argv: ["--help"],
      consoleLogImpl: (message) => {
        logs.push(message);
      },
      runReadinessImpl: async () => {
        invoked = true;
        throw new Error("should not run");
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3Wave1ReadinessHelpText()]);
  });

  it("documents the source-of-truth gate and child smoke binding in help text", () => {
    const helpText = buildDesktopV3Wave1ReadinessHelpText();

    expect(helpText).toContain("source-of-truth document gate");
    expect(helpText).toContain("app shell governance");
    expect(helpText).toContain("page governance");
    expect(helpText).toContain("LocalDatabase governance");
    expect(helpText).toContain("backend-client governance");
    expect(helpText).toContain("feature governance");
    expect(helpText).toContain("runtime skeleton governance");
    expect(helpText).toContain("runtime adapter governance");
    expect(helpText).toContain("runtime contract governance");
    expect(helpText).toContain("Rust command governance");
    expect(helpText).toContain("capability governance");
    expect(helpText).toContain("platform-config governance");
    expect(helpText).toContain("updater governance");
    expect(helpText).toContain("child smoke archive/latest summary paths");
  });

  it("runs readiness and validates persisted summaries before logging success", async () => {
    const summary = {
      latestSummaryPath: "/tmp/desktop/latest-summary.json",
      summaryPath: "/tmp/desktop/summary.json",
    };
    const config = { profile: "default" };
    const steps = [{ key: "desktop-v3-lint" }];
    const callOrder = [];
    const consoleLogImpl = vi.fn((message) => {
      callOrder.push(["log", message]);
    });
    const resolveConfigImpl = vi.fn(() => config);
    const buildStepsImpl = vi.fn(() => steps);
    const runPnpmStepImpl = vi.fn(async () => {});
    const runReadinessImpl = vi.fn(async (receivedConfig, receivedSteps, receivedOptions) => {
      callOrder.push(["run", receivedConfig, receivedSteps, receivedOptions]);
      return summary;
    });
    const assertSummaryCopiesImpl = vi.fn(async (receivedSummary, receivedConfig) => {
      callOrder.push(["assert", receivedSummary, receivedConfig]);
    });

    const result = await runDesktopV3Wave1ReadinessCli({
      argv: [],
      assertSummaryCopiesImpl,
      buildStepsImpl,
      consoleLogImpl,
      resolveConfigImpl,
      runPnpmStepImpl,
      runReadinessImpl,
    });

    expect(result).toBe(summary);
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(buildStepsImpl).toHaveBeenCalledWith(config);
    expect(runReadinessImpl).toHaveBeenCalledWith(config, steps, {
      runPnpmStepImpl,
    });
    expect(assertSummaryCopiesImpl).toHaveBeenCalledWith(summary, config);
    expect(callOrder).toEqual([
      ["run", config, steps, { runPnpmStepImpl }],
      ["assert", summary, config],
      ["log", "desktop-v3 Wave 1 readiness passed. Summary: /tmp/desktop/summary.json | Latest: /tmp/desktop/latest-summary.json"],
    ]);
  });
});
