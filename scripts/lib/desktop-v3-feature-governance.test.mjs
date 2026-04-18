import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3FeatureGovernanceFailureMessage,
  collectDesktopV3FeatureGovernanceViolations,
  collectTypeScriptInterfaceProperties,
  collectTypeScriptTopLevelDeclarations,
  createDesktopV3FeatureGovernanceSummary,
  resolveDesktopV3FeatureGovernanceConfig,
  rootDir,
} from "./desktop-v3-feature-governance.mjs";

describe("desktop-v3 feature governance helpers", () => {
  it("collects top-level declarations from exported consts and type re-exports", () => {
    const sourceText = [
      'export type { ThemeMode, ThemePreference } from "@/lib/runtime/contracts";',
      "",
      "interface ThemePreferenceState {",
      "  themeMode: ThemeMode;",
      "}",
      "",
      "export const useThemePreferenceStore = create<ThemePreferenceState>(() => ({",
      '  themeMode: "system",',
      "}));",
    ].join("\n");
    const declarations = collectTypeScriptTopLevelDeclarations(
      sourceText,
      path.join(rootDir, "apps/desktop-v3/src/features/preferences/preferences-store.ts"),
      { rootDir },
    );

    expect(declarations).toEqual([
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        kind: "type",
        line: 1,
        name: "ThemeMode",
      },
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        kind: "type",
        line: 1,
        name: "ThemePreference",
      },
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        kind: "interface",
        line: 3,
        name: "ThemePreferenceState",
      },
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        kind: "const",
        line: 7,
        name: "useThemePreferenceStore",
      },
    ]);
  });

  it("collects interface property signatures with normalized type text", () => {
    const sourceText = [
      "interface ThemePreferenceState {",
      "  setThemeMode: (themeMode: ThemeMode) => void;",
      "  themeMode: ThemeMode;",
      "}",
    ].join("\n");
    const properties = collectTypeScriptInterfaceProperties(
      sourceText,
      path.join(rootDir, "apps/desktop-v3/src/features/preferences/preferences-store.ts"),
      "ThemePreferenceState",
      { rootDir },
    );

    expect(properties).toEqual([
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        line: 2,
        name: "setThemeMode",
        typeText: "(themeMode: ThemeMode) => void",
      },
      {
        filePath: "apps/desktop-v3/src/features/preferences/preferences-store.ts",
        line: 3,
        name: "themeMode",
        typeText: "ThemeMode",
      },
    ]);
  });
});

describe("desktop-v3 feature governance", () => {
  it("resolves config paths and frozen surfaces for the current workspace", () => {
    const config = resolveDesktopV3FeatureGovernanceConfig({
      now: new Date("2026-04-18T08:09:10.111Z"),
    });

    expect(config.outputDir).toContain("desktop-v3-feature-governance-2026-04-18T08-09-10-111Z");
    expect(config.featureDir).toBe(path.join(rootDir, "apps/desktop-v3/src/features"));
    expect(config.sourceDir).toBe(path.join(rootDir, "apps/desktop-v3/src"));
    expect(config.allowedFeatureFiles).toEqual(
      expect.arrayContaining([
        "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts",
        "apps/desktop-v3/src/features/preferences/preferences-store.ts",
      ]),
    );
    expect(config.latestSummaryPath).toBe(
      path.join(rootDir, "output", "verification", "latest", "desktop-v3-feature-governance-summary.json"),
    );
  });

  it("passes against the frozen workspace feature boundary", async () => {
    const config = resolveDesktopV3FeatureGovernanceConfig();
    const result = await collectDesktopV3FeatureGovernanceViolations(config);

    expect(result.featureFiles).toEqual(config.allowedFeatureFiles);
    expect(result.diagnosticsApiSurface).toEqual(config.allowedDiagnosticsApiSurface);
    expect(result.diagnosticsFormatterSurface).toEqual(config.allowedDiagnosticsFormatterSurface);
    expect(result.diagnosticsTypesSurface).toEqual(config.allowedDiagnosticsTypesSurface);
    expect(result.diagnosticsOverviewProperties).toEqual(config.allowedDiagnosticsOverviewProperties);
    expect(result.preferencesApiSurface).toEqual(config.allowedPreferencesApiSurface);
    expect(result.preferencesStoreSurface).toEqual(config.allowedPreferencesStoreSurface);
    expect(result.themePreferenceStateProperties).toEqual(config.allowedThemePreferenceStateProperties);
    expect(result.preferencesTypesSurface).toEqual(config.allowedPreferencesTypesSurface);
    expect(result.diagnosticsApiReferenceFiles).toEqual(config.allowedDiagnosticsApiExternalReferenceFiles);
    expect(result.preferencesApiReferenceFiles).toEqual(config.allowedPreferencesApiExternalReferenceFiles);
    expect(result.preferencesStoreReferenceFiles).toEqual(config.allowedPreferencesStoreExternalReferenceFiles);
    expect(result.preferencesTypesReferenceFiles).toEqual(config.allowedPreferencesTypesExternalReferenceFiles);
    expect(result.violations).toEqual([]);
  });

  it("fails closed when a frozen external ownership edge drifts", async () => {
    const baseConfig = resolveDesktopV3FeatureGovernanceConfig();
    const config = {
      ...baseConfig,
      allowedPreferencesApiExternalReferenceFiles: [
        "apps/desktop-v3/src/pages/preferences-page.tsx",
      ],
    };

    const result = await collectDesktopV3FeatureGovernanceViolations(config);

    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/app/providers/theme-provider.tsx",
          kind: "preferences-api-external-reference",
        }),
      ]),
    );
  });

  it("creates a summary shell and formats failure previews", () => {
    const config = resolveDesktopV3FeatureGovernanceConfig({
      rootDir: "/repo",
      now: new Date("2026-04-18T08:09:10.111Z"),
    });
    const summary = createDesktopV3FeatureGovernanceSummary(config);

    expect(summary.status).toBe("running");
    expect(summary.allowedFeatureFiles).toEqual(config.allowedFeatureFiles);
    expect(summary.latestSummaryPath).toBe("/repo/output/verification/latest/desktop-v3-feature-governance-summary.json");

    summary.status = "failed";
    summary.violationCount = 1;
    summary.summaryPath = "/tmp/feature-governance/summary.json";
    summary.violations = [
      {
        column: 5,
        detail: "preferences-api escaped the frozen Wave 1 feature ownership boundary.",
        filePath: "apps/desktop-v3/src/app/providers/theme-provider.tsx",
        kind: "preferences-api-external-reference",
        line: 3,
      },
    ];

    expect(buildDesktopV3FeatureGovernanceFailureMessage(summary)).toBe(
      [
        "desktop-v3 feature governance check failed with 1 violation(s).",
        "- apps/desktop-v3/src/app/providers/theme-provider.tsx:3:5 [preferences-api-external-reference] preferences-api escaped the frozen Wave 1 feature ownership boundary.",
        "Summary: /tmp/feature-governance/summary.json",
      ].join("\n"),
    );
  });
});
