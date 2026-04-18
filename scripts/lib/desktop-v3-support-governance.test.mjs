import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3SupportGovernanceFailureMessage,
  collectDesktopV3SupportGovernanceViolations,
  createDesktopV3SupportGovernanceSummary,
  resolveDesktopV3SupportGovernanceConfig,
  rootDir,
} from "./desktop-v3-support-governance.mjs";

describe("desktop-v3 support governance", () => {
  it("resolves config paths and frozen surfaces for the current workspace", () => {
    const config = resolveDesktopV3SupportGovernanceConfig({
      now: new Date("2026-04-18T12:12:13.141Z"),
    });

    expect(config.outputDir).toContain("desktop-v3-support-governance-2026-04-18T12-12-13-141Z");
    expect(config.sourceDir).toBe(path.join(rootDir, "apps/desktop-v3/src"));
    expect(config.allowedSupportFiles).toEqual(
      expect.arrayContaining([
        "apps/desktop-v3/src/lib/errors/app-error.ts",
        "apps/desktop-v3/src/lib/query/query-client.ts",
        "apps/desktop-v3/src/lib/typography.ts",
      ]),
    );
    expect(config.latestSummaryPath).toBe(
      path.join(rootDir, "output", "verification", "latest", "desktop-v3-support-governance-summary.json"),
    );
  });

  it("passes against the frozen workspace support boundary", async () => {
    const config = resolveDesktopV3SupportGovernanceConfig();
    const result = await collectDesktopV3SupportGovernanceViolations(config);

    expect(result.supportFiles).toEqual(config.allowedSupportFiles);
    expect(result.appErrorSurface).toEqual(config.allowedAppErrorSurface);
    expect(result.appErrorShapeProperties).toEqual(config.allowedAppErrorShapeProperties);
    expect(result.errorSupportDetailsSurface).toEqual(config.allowedErrorSupportDetailsSurface);
    expect(result.errorSupportDetailProperties).toEqual(config.allowedErrorSupportDetailProperties);
    expect(result.normalizeCommandErrorSurface).toEqual(config.allowedNormalizeCommandErrorSurface);
    expect(result.commandErrorPayloadProperties).toEqual(config.allowedCommandErrorPayloadProperties);
    expect(result.queryClientSurface).toEqual(config.allowedQueryClientSurface);
    expect(result.queryRetryPolicySurface).toEqual(config.allowedQueryRetryPolicySurface);
    expect(result.notifySurface).toEqual(config.allowedNotifySurface);
    expect(result.notifyKeys).toEqual(config.allowedNotifyKeys);
    expect(result.typographySurface).toEqual(config.allowedTypographySurface);
    expect(result.typographyKeys).toEqual(config.allowedTypographyKeys);
    expect(result.utilsSurface).toEqual(config.allowedUtilsSurface);
    expect(result.appErrorReferenceFiles).toEqual(config.allowedAppErrorExternalReferenceFiles);
    expect(result.errorSupportDetailsReferenceFiles).toEqual(
      config.allowedErrorSupportDetailsExternalReferenceFiles,
    );
    expect(result.normalizeCommandErrorReferenceFiles).toEqual(
      config.allowedNormalizeCommandErrorExternalReferenceFiles,
    );
    expect(result.queryClientReferenceFiles).toEqual(config.allowedQueryClientExternalReferenceFiles);
    expect(result.queryRetryPolicyReferenceFiles).toEqual(
      config.allowedQueryRetryPolicyExternalReferenceFiles,
    );
    expect(result.notifyReferenceFiles).toEqual(config.allowedNotifyExternalReferenceFiles);
    expect(result.typographyReferenceFiles).toEqual(config.allowedTypographyExternalReferenceFiles);
    expect(result.utilsReferenceFiles).toEqual(config.allowedUtilsExternalReferenceFiles);
    expect(result.violations).toEqual([]);
  }, 15000);

  it("fails closed when a frozen support ownership edge drifts", async () => {
    const baseConfig = resolveDesktopV3SupportGovernanceConfig();
    const config = {
      ...baseConfig,
      allowedNotifyExternalReferenceFiles: [
        "apps/desktop-v3/src/pages/preferences-page.tsx",
      ],
    };

    const result = await collectDesktopV3SupportGovernanceViolations(config);

    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts",
          kind: "notify-external-reference",
        }),
      ]),
    );
  }, 15000);

  it("creates a summary shell and formats failure previews", () => {
    const config = resolveDesktopV3SupportGovernanceConfig({
      rootDir: "/repo",
      now: new Date("2026-04-18T12:12:13.141Z"),
    });
    const summary = createDesktopV3SupportGovernanceSummary(config);

    expect(summary.status).toBe("running");
    expect(summary.allowedSupportFiles).toEqual(config.allowedSupportFiles);
    expect(summary.latestSummaryPath).toBe("/repo/output/verification/latest/desktop-v3-support-governance-summary.json");

    summary.status = "failed";
    summary.violationCount = 1;
    summary.summaryPath = "/tmp/support-governance/summary.json";
    summary.violations = [
      {
        column: 1,
        detail: "notify escaped the frozen Wave 1 support ownership boundary.",
        filePath: "apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts",
        kind: "notify-external-reference",
        line: 4,
      },
    ];

    expect(buildDesktopV3SupportGovernanceFailureMessage(summary)).toBe(
      [
        "desktop-v3 support governance check failed with 1 violation(s).",
        "- apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts:4:1 [notify-external-reference] notify escaped the frozen Wave 1 support ownership boundary.",
        "Summary: /tmp/support-governance/summary.json",
      ].join("\n"),
    );
  });
});
