import { describe, expect, it } from "vitest";

import {
  assertDesktopV3PackagedAppSmokeSummaryContract,
  assertDesktopV3ResponsiveSmokeSummaryContract,
  assertDesktopV3TauriDevSmokeSummaryContract,
} from "./desktop-v3-smoke-summary-contract.mjs";
import {
  buildDesktopV3PackagedAppSmokeSummary,
  buildDesktopV3ResponsiveSmokeSummary,
  buildDesktopV3TauriDevSmokeSummary,
} from "./desktop-v3-smoke-summary-test-fixtures.mjs";

describe("desktop-v3 smoke summary contract", () => {
  it("accepts a passed responsive smoke summary", () => {
    const summary = buildDesktopV3ResponsiveSmokeSummary();

    expect(() =>
      assertDesktopV3ResponsiveSmokeSummaryContract(summary, {
        expectedLatestSummaryPath: summary.latestSummaryPath,
        expectedOutputDir: summary.outputDir,
        expectedSummaryPath: summary.summaryPath,
      }),
    ).not.toThrow();
  });

  it("accepts a passed tauri dev smoke summary", () => {
    const summary = buildDesktopV3TauriDevSmokeSummary();

    expect(() =>
      assertDesktopV3TauriDevSmokeSummaryContract(summary, {
        expectedLatestSummaryPath: summary.latestSummaryPath,
        expectedOutputDir: summary.outputDir,
        expectedSummaryPath: summary.summaryPath,
      }),
    ).not.toThrow();
  });

  it("rejects a packaged smoke summary when a required command is missing", () => {
    const summary = buildDesktopV3PackagedAppSmokeSummary();
    summary.observed.commandInvocations = ["desktop_report_renderer_boot"];

    expect(() =>
      assertDesktopV3PackagedAppSmokeSummaryContract(summary, {
        expectedLatestSummaryPath: summary.latestSummaryPath,
        expectedOutputDir: summary.outputDir,
        expectedSummaryPath: summary.summaryPath,
      }),
    ).toThrow("desktop-v3 packaged app smoke summary.observed.commandInvocations is missing desktop_get_theme_preference.");
  });

});
