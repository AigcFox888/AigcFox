import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3FeatureGovernanceHelpText,
  runDesktopV3FeatureGovernanceCli,
} from "./verify-desktop-v3-feature-governance.mjs";

describe("verify-desktop-v3-feature-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3FeatureGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          diagnosticsApiReferenceFiles: [],
          diagnosticsApiSurface: [],
          diagnosticsFormatterReferenceFiles: [],
          diagnosticsFormatterSurface: [],
          diagnosticsOverviewProperties: [],
          diagnosticsTypesReferenceFiles: [],
          diagnosticsTypesSurface: [],
          featureFiles: [],
          preferencesApiReferenceFiles: [],
          preferencesApiSurface: [],
          preferencesStoreReferenceFiles: [],
          preferencesStoreSurface: [],
          preferencesTypesReferenceFiles: [],
          preferencesTypesSurface: [],
          scannedFileCount: 0,
          scannedFiles: [],
          themePreferenceStateProperties: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3FeatureGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedDiagnosticsApiExternalReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      allowedDiagnosticsApiSurface: ["fn:getDiagnosticsOverview"],
      allowedDiagnosticsFormatterExternalReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      allowedDiagnosticsFormatterSurface: ["fn:formatSecureStoreSummary"],
      allowedDiagnosticsOverviewProperties: ["local: DiagnosticsSnapshot"],
      allowedDiagnosticsTypesExternalReferenceFiles: ["apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts"],
      allowedDiagnosticsTypesSurface: ["interface:DiagnosticsOverview"],
      allowedFeatureFiles: ["apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts"],
      allowedPreferencesApiExternalReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      allowedPreferencesApiSurface: ["fn:getThemePreference"],
      allowedPreferencesStoreExternalReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      allowedPreferencesStoreSurface: ["const:useThemePreferenceStore"],
      allowedPreferencesTypesExternalReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      allowedPreferencesTypesSurface: ["type:ThemeMode"],
      allowedThemePreferenceStateProperties: ["themeMode: ThemeMode"],
      latestSummaryPath: "/tmp/feature-governance/latest.json",
      outputDir: "/tmp/feature-governance",
      summaryPath: "/tmp/feature-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      diagnosticsApiReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      diagnosticsApiSurface: ["fn:getDiagnosticsOverview"],
      diagnosticsFormatterReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      diagnosticsFormatterSurface: ["fn:formatSecureStoreSummary"],
      diagnosticsOverviewProperties: ["local: DiagnosticsSnapshot"],
      diagnosticsTypesReferenceFiles: ["apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts"],
      diagnosticsTypesSurface: ["interface:DiagnosticsOverview"],
      featureFiles: ["apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts"],
      preferencesApiReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      preferencesApiSurface: ["fn:getThemePreference"],
      preferencesStoreReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      preferencesStoreSurface: ["const:useThemePreferenceStore"],
      preferencesTypesReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      preferencesTypesSurface: ["type:ThemeMode"],
      scannedFileCount: 3,
      scannedFiles: [
        "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts",
        "apps/desktop-v3/src/features/preferences/preferences-api.ts",
        "apps/desktop-v3/src/pages/preferences-page.tsx",
      ],
      themePreferenceStateProperties: ["themeMode: ThemeMode"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedDiagnosticsApiExternalReferenceFiles: [...config.allowedDiagnosticsApiExternalReferenceFiles],
      allowedDiagnosticsApiSurface: [...config.allowedDiagnosticsApiSurface],
      allowedDiagnosticsFormatterExternalReferenceFiles: [...config.allowedDiagnosticsFormatterExternalReferenceFiles],
      allowedDiagnosticsFormatterSurface: [...config.allowedDiagnosticsFormatterSurface],
      allowedDiagnosticsOverviewProperties: [...config.allowedDiagnosticsOverviewProperties],
      allowedDiagnosticsTypesExternalReferenceFiles: [...config.allowedDiagnosticsTypesExternalReferenceFiles],
      allowedDiagnosticsTypesSurface: [...config.allowedDiagnosticsTypesSurface],
      allowedFeatureFiles: [...config.allowedFeatureFiles],
      allowedPreferencesApiExternalReferenceFiles: [...config.allowedPreferencesApiExternalReferenceFiles],
      allowedPreferencesApiSurface: [...config.allowedPreferencesApiSurface],
      allowedPreferencesStoreExternalReferenceFiles: [...config.allowedPreferencesStoreExternalReferenceFiles],
      allowedPreferencesStoreSurface: [...config.allowedPreferencesStoreSurface],
      allowedPreferencesTypesExternalReferenceFiles: [...config.allowedPreferencesTypesExternalReferenceFiles],
      allowedPreferencesTypesSurface: [...config.allowedPreferencesTypesSurface],
      allowedThemePreferenceStateProperties: [...config.allowedThemePreferenceStateProperties],
      checkedAt: null,
      diagnosticsApiReferenceFiles: [],
      diagnosticsApiSurface: [],
      diagnosticsFormatterReferenceFiles: [],
      diagnosticsFormatterSurface: [],
      diagnosticsOverviewProperties: [],
      diagnosticsTypesReferenceFiles: [],
      diagnosticsTypesSurface: [],
      error: null,
      featureFiles: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      preferencesApiReferenceFiles: [],
      preferencesApiSurface: [],
      preferencesStoreReferenceFiles: [],
      preferencesStoreSurface: [],
      preferencesTypesReferenceFiles: [],
      preferencesTypesSurface: [],
      runId: "feature-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      themePreferenceStateProperties: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3FeatureGovernanceCli({
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
      scannedFileCount: 3,
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
        scannedFileCount: 3,
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
      "desktop-v3 feature governance passed. Summary: /tmp/feature-governance/summary.json | Latest: /tmp/feature-governance/latest.json",
    );
  });
});
