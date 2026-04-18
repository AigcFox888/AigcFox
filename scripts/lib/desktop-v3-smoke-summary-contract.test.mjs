import { describe, expect, it } from "vitest";

import {
  assertDesktopV3ResponsiveSmokeSummaryContract,
  assertDesktopV3TauriDevSmokeSummaryContract,
} from "./desktop-v3-smoke-summary-contract.mjs";
import {
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

  it("rejects a passed tauri dev smoke summary when required markers are missing", () => {
    const summary = buildDesktopV3TauriDevSmokeSummary();
    summary.markers.cargoRunning = false;

    expect(() =>
      assertDesktopV3TauriDevSmokeSummaryContract(summary, {
        expectedLatestSummaryPath: summary.latestSummaryPath,
        expectedOutputDir: summary.outputDir,
        expectedSummaryPath: summary.summaryPath,
      }),
    ).toThrow("desktop-v3 tauri dev smoke summary.markers.cargoRunning must be true for a passed run.");
  });
});
