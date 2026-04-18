import { describe, expect, it } from "vitest";

import {
  assertDesktopV3ResponsiveSmokeSummaryCopies,
  assertDesktopV3TauriDevSmokeSummaryCopies,
} from "./desktop-v3-smoke-summary-persistence.mjs";
import {
  buildDesktopV3ResponsiveSmokeSummary,
  buildDesktopV3TauriDevSmokeSummary,
  createDesktopV3SmokeSummaryReadFile,
} from "./desktop-v3-smoke-summary-test-fixtures.mjs";

describe("desktop-v3 smoke summary persistence", () => {
  it("accepts matching responsive archive and latest summaries", async () => {
    const config = {
      latestSummaryPath: "/workspace/output/verification/latest/desktop-v3-responsive-smoke-summary.json",
      outputDir: "/workspace/output/playwright/desktop-v3-responsive-smoke-1",
      summaryPath: "/workspace/output/playwright/desktop-v3-responsive-smoke-1/summary.json",
    };
    const summary = buildDesktopV3ResponsiveSmokeSummary(config);

    await expect(
      assertDesktopV3ResponsiveSmokeSummaryCopies(summary, config, {
        readFileImpl: createDesktopV3SmokeSummaryReadFile({
          [config.latestSummaryPath]: summary,
          [config.summaryPath]: summary,
        }),
      }),
    ).resolves.toEqual({
      archiveSummary: summary,
      latestSummary: summary,
    });
  });

  it("accepts matching tauri dev archive and latest summaries", async () => {
    const config = {
      latestSummaryPath: "/workspace/output/verification/latest/desktop-v3-tauri-dev-smoke-summary.json",
      outputDir: "/workspace/output/verification/desktop-v3-tauri-dev-smoke-1",
      summaryPath: "/workspace/output/verification/desktop-v3-tauri-dev-smoke-1/summary.json",
    };
    const summary = buildDesktopV3TauriDevSmokeSummary(config);

    await expect(
      assertDesktopV3TauriDevSmokeSummaryCopies(summary, config, {
        readFileImpl: createDesktopV3SmokeSummaryReadFile({
          [config.latestSummaryPath]: summary,
          [config.summaryPath]: summary,
        }),
      }),
    ).resolves.toEqual({
      archiveSummary: summary,
      latestSummary: summary,
    });
  });

  it("fails when the tauri dev latest summary drifts from the in-memory summary", async () => {
    const config = {
      latestSummaryPath: "/workspace/output/verification/latest/desktop-v3-tauri-dev-smoke-summary.json",
      outputDir: "/workspace/output/verification/desktop-v3-tauri-dev-smoke-1",
      summaryPath: "/workspace/output/verification/desktop-v3-tauri-dev-smoke-1/summary.json",
    };
    const summary = buildDesktopV3TauriDevSmokeSummary(config);
    const latestSummary = {
      ...summary,
      warnings: ["drift"],
    };

    await expect(
      assertDesktopV3TauriDevSmokeSummaryCopies(summary, config, {
        readFileImpl: createDesktopV3SmokeSummaryReadFile({
          [config.latestSummaryPath]: latestSummary,
          [config.summaryPath]: summary,
        }),
      }),
    ).rejects.toThrow("desktop-v3 tauri dev smoke summary latest copy did not match the in-memory run summary.");
  });
});
