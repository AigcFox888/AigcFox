import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3PageGovernanceFailureMessage,
  collectDesktopV3PageGovernanceViolations,
  createDesktopV3PageGovernanceSummary,
  resolveDesktopV3PageGovernanceConfig,
  rootDir,
} from "./desktop-v3-page-governance.mjs";

describe("desktop-v3 page governance", () => {
  it("resolves config paths and frozen surfaces for the current workspace", () => {
    const config = resolveDesktopV3PageGovernanceConfig({
      now: new Date("2026-04-18T11:12:13.141Z"),
    });

    expect(config.outputDir).toContain("desktop-v3-page-governance-2026-04-18T11-12-13-141Z");
    expect(config.sourceDir).toBe(path.join(rootDir, "apps/desktop-v3/src"));
    expect(config.allowedPresentationFiles).toEqual(
      expect.arrayContaining([
        "apps/desktop-v3/src/pages/dashboard-page.tsx",
        "apps/desktop-v3/src/hooks/use-shell-layout.ts",
      ]),
    );
    expect(config.latestSummaryPath).toBe(
      path.join(rootDir, "output", "verification", "latest", "desktop-v3-page-governance-summary.json"),
    );
  });

  it("passes against the frozen workspace page/presentation boundary", async () => {
    const config = resolveDesktopV3PageGovernanceConfig();
    const result = await collectDesktopV3PageGovernanceViolations(config);

    expect(result.presentationFiles).toEqual(config.allowedPresentationFiles);
    expect(result.dashboardPageSurface).toEqual(config.allowedDashboardPageSurface);
    expect(result.dashboardQuickLinkBindings).toEqual(config.allowedDashboardQuickLinkBindings);
    expect(result.diagnosticsPageSurface).toEqual(config.allowedDiagnosticsPageSurface);
    expect(result.preferencesPageSurface).toEqual(config.allowedPreferencesPageSurface);
    expect(result.preferencesThemeValues).toEqual(config.allowedPreferencesThemeValues);
    expect(result.navItemSurface).toEqual(config.allowedNavItemSurface);
    expect(result.navItemProperties).toEqual(config.allowedNavItemProperties);
    expect(result.emptyStateSurface).toEqual(config.allowedEmptyStateSurface);
    expect(result.emptyStateProperties).toEqual(config.allowedEmptyStateProperties);
    expect(result.errorStateSurface).toEqual(config.allowedErrorStateSurface);
    expect(result.errorStateProperties).toEqual(config.allowedErrorStateProperties);
    expect(result.loadingStateSurface).toEqual(config.allowedLoadingStateSurface);
    expect(result.loadingStateProperties).toEqual(config.allowedLoadingStateProperties);
    expect(result.keyboardShortcutNavigationTargets).toEqual(
      config.allowedKeyboardShortcutNavigationTargets,
    );
    expect(result.keyboardShortcutsSurface).toEqual(config.allowedKeyboardShortcutsSurface);
    expect(result.shellLayoutSurface).toEqual(config.allowedShellLayoutSurface);
    expect(result.shellLayoutProperties).toEqual(config.allowedShellLayoutProperties);
    expect(result.shellLayoutModeValues).toEqual(config.allowedShellLayoutModeValues);
    expect(result.dashboardPageReferenceFiles).toEqual(config.allowedDashboardPageExternalReferenceFiles);
    expect(result.diagnosticsPageReferenceFiles).toEqual(config.allowedDiagnosticsPageExternalReferenceFiles);
    expect(result.preferencesPageReferenceFiles).toEqual(config.allowedPreferencesPageExternalReferenceFiles);
    expect(result.navItemReferenceFiles).toEqual(config.allowedNavItemExternalReferenceFiles);
    expect(result.emptyStateReferenceFiles).toEqual(config.allowedEmptyStateExternalReferenceFiles);
    expect(result.errorStateReferenceFiles).toEqual(config.allowedErrorStateExternalReferenceFiles);
    expect(result.loadingStateReferenceFiles).toEqual(config.allowedLoadingStateExternalReferenceFiles);
    expect(result.keyboardShortcutsReferenceFiles).toEqual(config.allowedKeyboardShortcutsExternalReferenceFiles);
    expect(result.shellLayoutReferenceFiles).toEqual(config.allowedShellLayoutExternalReferenceFiles);
    expect(result.violations).toEqual([]);
  }, 15000);

  it("fails closed when a frozen page ownership edge drifts", async () => {
    const baseConfig = resolveDesktopV3PageGovernanceConfig();
    const config = {
      ...baseConfig,
      allowedLoadingStateExternalReferenceFiles: [
        "apps/desktop-v3/src/pages/diagnostics-page.tsx",
      ],
    };

    const result = await collectDesktopV3PageGovernanceViolations(config);

    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/pages/preferences-page.tsx",
          kind: "loading-state-external-reference",
        }),
      ]),
    );
  }, 15000);

  it("creates a summary shell and formats failure previews", () => {
    const config = resolveDesktopV3PageGovernanceConfig({
      rootDir: "/repo",
      now: new Date("2026-04-18T11:12:13.141Z"),
    });
    const summary = createDesktopV3PageGovernanceSummary(config);

    expect(summary.status).toBe("running");
    expect(summary.allowedPresentationFiles).toEqual(config.allowedPresentationFiles);
    expect(summary.latestSummaryPath).toBe("/repo/output/verification/latest/desktop-v3-page-governance-summary.json");

    summary.status = "failed";
    summary.violationCount = 1;
    summary.summaryPath = "/tmp/page-governance/summary.json";
    summary.violations = [
      {
        column: 5,
        detail: "loading-state escaped the frozen Wave 1 state component ownership boundary.",
        filePath: "apps/desktop-v3/src/pages/preferences-page.tsx",
        kind: "loading-state-external-reference",
        line: 4,
      },
    ];

    expect(buildDesktopV3PageGovernanceFailureMessage(summary)).toBe(
      [
        "desktop-v3 page governance check failed with 1 violation(s).",
        "- apps/desktop-v3/src/pages/preferences-page.tsx:4:5 [loading-state-external-reference] loading-state escaped the frozen Wave 1 state component ownership boundary.",
        "Summary: /tmp/page-governance/summary.json",
      ].join("\n"),
    );
  });
});
