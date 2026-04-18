import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3PageGovernanceHelpText,
  runDesktopV3PageGovernanceCli,
} from "./verify-desktop-v3-page-governance.mjs";

describe("verify-desktop-v3-page-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3PageGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          dashboardPageReferenceFiles: [],
          dashboardPageSurface: [],
          dashboardQuickLinkBindings: [],
          diagnosticsPageReferenceFiles: [],
          diagnosticsPageSurface: [],
          emptyStateProperties: [],
          emptyStateReferenceFiles: [],
          emptyStateSurface: [],
          errorStateProperties: [],
          errorStateReferenceFiles: [],
          errorStateSurface: [],
          keyboardShortcutNavigationTargets: [],
          keyboardShortcutsReferenceFiles: [],
          keyboardShortcutsSurface: [],
          loadingStateProperties: [],
          loadingStateReferenceFiles: [],
          loadingStateSurface: [],
          navItemProperties: [],
          navItemReferenceFiles: [],
          navItemSurface: [],
          preferencesPageReferenceFiles: [],
          preferencesPageSurface: [],
          preferencesThemeValues: [],
          presentationFiles: [],
          scannedFileCount: 0,
          scannedFiles: [],
          shellLayoutModeValues: [],
          shellLayoutProperties: [],
          shellLayoutReferenceFiles: [],
          shellLayoutSurface: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3PageGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedDashboardPageExternalReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      allowedDashboardPageSurface: ["fn:DashboardPage"],
      allowedDashboardQuickLinkBindings: ["desktopV3RoutePathById.diagnostics"],
      allowedDiagnosticsPageExternalReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      allowedDiagnosticsPageSurface: ["fn:DiagnosticsPage"],
      allowedEmptyStateExternalReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      allowedEmptyStateProperties: ["message: string"],
      allowedEmptyStateSurface: ["fn:EmptyState"],
      allowedErrorStateExternalReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      allowedErrorStateProperties: ["title: string"],
      allowedErrorStateSurface: ["fn:ErrorState"],
      allowedKeyboardShortcutNavigationTargets: ["desktopV3RoutePathById.preferences"],
      allowedKeyboardShortcutsExternalReferenceFiles: ["apps/desktop-v3/src/app/layout/app-shell.tsx"],
      allowedKeyboardShortcutsSurface: ["fn:useKeyboardShortcuts"],
      allowedLoadingStateExternalReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      allowedLoadingStateProperties: ["title: string"],
      allowedLoadingStateSurface: ["fn:LoadingState"],
      allowedNavItemExternalReferenceFiles: ["apps/desktop-v3/src/app/layout/sidebar.tsx"],
      allowedNavItemProperties: ["href: string"],
      allowedNavItemSurface: ["fn:NavItem"],
      allowedPreferencesPageExternalReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      allowedPreferencesPageSurface: ["fn:PreferencesPage"],
      allowedPreferencesThemeValues: ["system"],
      allowedPresentationFiles: ["apps/desktop-v3/src/pages/dashboard-page.tsx"],
      allowedShellLayoutExternalReferenceFiles: ["apps/desktop-v3/src/app/layout/app-shell.tsx"],
      allowedShellLayoutModeValues: ["compact"],
      allowedShellLayoutProperties: ["layoutMode: LayoutMode"],
      allowedShellLayoutSurface: ["fn:useShellLayout"],
      latestSummaryPath: "/tmp/page-governance/latest.json",
      outputDir: "/tmp/page-governance",
      summaryPath: "/tmp/page-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      dashboardPageReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      dashboardPageSurface: ["fn:DashboardPage"],
      dashboardQuickLinkBindings: ["desktopV3RoutePathById.diagnostics"],
      diagnosticsPageReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      diagnosticsPageSurface: ["fn:DiagnosticsPage"],
      emptyStateProperties: ["message: string"],
      emptyStateReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      emptyStateSurface: ["fn:EmptyState"],
      errorStateProperties: ["title: string"],
      errorStateReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      errorStateSurface: ["fn:ErrorState"],
      keyboardShortcutNavigationTargets: ["desktopV3RoutePathById.preferences"],
      keyboardShortcutsReferenceFiles: ["apps/desktop-v3/src/app/layout/app-shell.tsx"],
      keyboardShortcutsSurface: ["fn:useKeyboardShortcuts"],
      loadingStateProperties: ["title: string"],
      loadingStateReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      loadingStateSurface: ["fn:LoadingState"],
      navItemProperties: ["href: string"],
      navItemReferenceFiles: ["apps/desktop-v3/src/app/layout/sidebar.tsx"],
      navItemSurface: ["fn:NavItem"],
      preferencesPageReferenceFiles: ["apps/desktop-v3/src/app/router/routes.tsx"],
      preferencesPageSurface: ["fn:PreferencesPage"],
      preferencesThemeValues: ["system"],
      presentationFiles: ["apps/desktop-v3/src/pages/dashboard-page.tsx"],
      scannedFileCount: 2,
      scannedFiles: [
        "apps/desktop-v3/src/pages/dashboard-page.tsx",
        "apps/desktop-v3/src/pages/preferences-page.tsx",
      ],
      shellLayoutModeValues: ["compact"],
      shellLayoutProperties: ["layoutMode: LayoutMode"],
      shellLayoutReferenceFiles: ["apps/desktop-v3/src/app/layout/app-shell.tsx"],
      shellLayoutSurface: ["fn:useShellLayout"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedDashboardPageExternalReferenceFiles: [...config.allowedDashboardPageExternalReferenceFiles],
      allowedDashboardPageSurface: [...config.allowedDashboardPageSurface],
      allowedDashboardQuickLinkBindings: [...config.allowedDashboardQuickLinkBindings],
      allowedDiagnosticsPageExternalReferenceFiles: [...config.allowedDiagnosticsPageExternalReferenceFiles],
      allowedDiagnosticsPageSurface: [...config.allowedDiagnosticsPageSurface],
      allowedEmptyStateExternalReferenceFiles: [...config.allowedEmptyStateExternalReferenceFiles],
      allowedEmptyStateProperties: [...config.allowedEmptyStateProperties],
      allowedEmptyStateSurface: [...config.allowedEmptyStateSurface],
      allowedErrorStateExternalReferenceFiles: [...config.allowedErrorStateExternalReferenceFiles],
      allowedErrorStateProperties: [...config.allowedErrorStateProperties],
      allowedErrorStateSurface: [...config.allowedErrorStateSurface],
      allowedKeyboardShortcutNavigationTargets: [...config.allowedKeyboardShortcutNavigationTargets],
      allowedKeyboardShortcutsExternalReferenceFiles: [...config.allowedKeyboardShortcutsExternalReferenceFiles],
      allowedKeyboardShortcutsSurface: [...config.allowedKeyboardShortcutsSurface],
      allowedLoadingStateExternalReferenceFiles: [...config.allowedLoadingStateExternalReferenceFiles],
      allowedLoadingStateProperties: [...config.allowedLoadingStateProperties],
      allowedLoadingStateSurface: [...config.allowedLoadingStateSurface],
      allowedNavItemExternalReferenceFiles: [...config.allowedNavItemExternalReferenceFiles],
      allowedNavItemProperties: [...config.allowedNavItemProperties],
      allowedNavItemSurface: [...config.allowedNavItemSurface],
      allowedPreferencesPageExternalReferenceFiles: [...config.allowedPreferencesPageExternalReferenceFiles],
      allowedPreferencesPageSurface: [...config.allowedPreferencesPageSurface],
      allowedPreferencesThemeValues: [...config.allowedPreferencesThemeValues],
      allowedPresentationFiles: [...config.allowedPresentationFiles],
      allowedShellLayoutExternalReferenceFiles: [...config.allowedShellLayoutExternalReferenceFiles],
      allowedShellLayoutModeValues: [...config.allowedShellLayoutModeValues],
      allowedShellLayoutProperties: [...config.allowedShellLayoutProperties],
      allowedShellLayoutSurface: [...config.allowedShellLayoutSurface],
      dashboardPageReferenceFiles: [],
      dashboardPageSurface: [],
      dashboardQuickLinkBindings: [],
      diagnosticsPageReferenceFiles: [],
      diagnosticsPageSurface: [],
      emptyStateProperties: [],
      emptyStateReferenceFiles: [],
      emptyStateSurface: [],
      error: null,
      errorStateProperties: [],
      errorStateReferenceFiles: [],
      errorStateSurface: [],
      keyboardShortcutNavigationTargets: [],
      keyboardShortcutsReferenceFiles: [],
      keyboardShortcutsSurface: [],
      latestSummaryPath: config.latestSummaryPath,
      loadingStateProperties: [],
      loadingStateReferenceFiles: [],
      loadingStateSurface: [],
      navItemProperties: [],
      navItemReferenceFiles: [],
      navItemSurface: [],
      outputDir: config.outputDir,
      preferencesPageReferenceFiles: [],
      preferencesPageSurface: [],
      preferencesThemeValues: [],
      presentationFiles: [],
      runId: "page-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      shellLayoutModeValues: [],
      shellLayoutProperties: [],
      shellLayoutReferenceFiles: [],
      shellLayoutSurface: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3PageGovernanceCli({
      argv: [],
      collectViolationsImpl,
      consoleLogImpl,
      createSummaryImpl,
      mkdirImpl,
      persistVerificationSummaryImpl,
      resolveConfigImpl,
      writeJsonFileImpl: vi.fn(async () => {}),
    });

    expect(result).toMatchObject({
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      scannedFileCount: 2,
      status: "passed",
      summaryPath: config.summaryPath,
      violationCount: 0,
    });
    expect(resolveConfigImpl).toHaveBeenCalledOnce();
    expect(mkdirImpl).toHaveBeenCalledWith(config.outputDir, { recursive: true });
    expect(collectViolationsImpl).toHaveBeenCalledWith(config);
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        latestSummaryPath: config.latestSummaryPath,
        outputDir: config.outputDir,
        scannedFileCount: 2,
        summaryPath: config.summaryPath,
        violationCount: 0,
      }),
      {
        archiveSummaryPath: config.summaryPath,
        latestSummaryPath: config.latestSummaryPath,
      },
      {
        writeJsonFileImpl: expect.any(Function),
      },
    );
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 page governance passed. Summary: /tmp/page-governance/summary.json | Latest: /tmp/page-governance/latest.json",
    );
  });
});
