import { describe, expect, it, vi } from "vitest";

import {
  buildDesktopV3SupportGovernanceHelpText,
  runDesktopV3SupportGovernanceCli,
} from "./verify-desktop-v3-support-governance.mjs";

describe("verify-desktop-v3-support-governance", () => {
  it("prints help without running verification", async () => {
    const logs = [];
    let invoked = false;

    const result = await runDesktopV3SupportGovernanceCli({
      argv: ["--help"],
      collectViolationsImpl: async () => {
        invoked = true;
        return {
          appErrorReferenceFiles: [],
          appErrorShapeProperties: [],
          appErrorSurface: [],
          commandErrorPayloadProperties: [],
          errorSupportDetailProperties: [],
          errorSupportDetailsReferenceFiles: [],
          errorSupportDetailsSurface: [],
          normalizeCommandErrorReferenceFiles: [],
          normalizeCommandErrorSurface: [],
          notifyKeys: [],
          notifyReferenceFiles: [],
          notifySurface: [],
          queryClientReferenceFiles: [],
          queryClientSurface: [],
          queryRetryPolicyReferenceFiles: [],
          queryRetryPolicySurface: [],
          scannedFileCount: 0,
          scannedFiles: [],
          supportFiles: [],
          typographyKeys: [],
          typographyReferenceFiles: [],
          typographySurface: [],
          utilsReferenceFiles: [],
          utilsSurface: [],
          violations: [],
        };
      },
      consoleLogImpl: (message) => {
        logs.push(message);
      },
    });

    expect(result).toEqual({ help: true });
    expect(invoked).toBe(false);
    expect(logs).toEqual([buildDesktopV3SupportGovernanceHelpText()]);
  });

  it("persists a passing summary before logging success", async () => {
    const config = {
      allowedAppErrorExternalReferenceFiles: ["apps/desktop-v3/src/lib/errors/normalize-command-error.ts"],
      allowedAppErrorShapeProperties: ["code: string"],
      allowedAppErrorSurface: ["class:AppError"],
      allowedCommandErrorPayloadProperties: ["code?: string"],
      allowedErrorSupportDetailProperties: ["label: string"],
      allowedErrorSupportDetailsExternalReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      allowedErrorSupportDetailsSurface: ["fn:buildErrorSupportDetails"],
      allowedNormalizeCommandErrorExternalReferenceFiles: ["apps/desktop-v3/src/lib/query/query-retry-policy.ts"],
      allowedNormalizeCommandErrorSurface: ["fn:normalizeCommandError"],
      allowedNotifyExternalReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      allowedNotifyKeys: ["success"],
      allowedNotifySurface: ["const:notify"],
      allowedQueryClientExternalReferenceFiles: ["apps/desktop-v3/src/app/providers/app-providers.tsx"],
      allowedQueryClientSurface: ["const:queryClient"],
      allowedQueryRetryPolicyExternalReferenceFiles: ["apps/desktop-v3/src/lib/query/query-client.ts"],
      allowedQueryRetryPolicySurface: ["fn:shouldRetryDesktopQuery"],
      allowedSupportFiles: ["apps/desktop-v3/src/lib/notify.ts"],
      allowedTypographyExternalReferenceFiles: ["apps/desktop-v3/src/pages/dashboard-page.tsx"],
      allowedTypographyKeys: ["pageTitle"],
      allowedTypographySurface: ["const:typography"],
      allowedUtilsExternalReferenceFiles: ["apps/desktop-v3/src/components/ui/button.tsx"],
      allowedUtilsSurface: ["fn:cn"],
      latestSummaryPath: "/tmp/support-governance/latest.json",
      outputDir: "/tmp/support-governance",
      summaryPath: "/tmp/support-governance/summary.json",
    };
    const consoleLogImpl = vi.fn();
    const collectViolationsImpl = vi.fn(async () => ({
      appErrorReferenceFiles: ["apps/desktop-v3/src/lib/errors/normalize-command-error.ts"],
      appErrorShapeProperties: ["code: string"],
      appErrorSurface: ["class:AppError"],
      commandErrorPayloadProperties: ["code?: string"],
      errorSupportDetailProperties: ["label: string"],
      errorSupportDetailsReferenceFiles: ["apps/desktop-v3/src/pages/diagnostics-page.tsx"],
      errorSupportDetailsSurface: ["fn:buildErrorSupportDetails"],
      normalizeCommandErrorReferenceFiles: ["apps/desktop-v3/src/lib/query/query-retry-policy.ts"],
      normalizeCommandErrorSurface: ["fn:normalizeCommandError"],
      notifyKeys: ["success"],
      notifyReferenceFiles: ["apps/desktop-v3/src/pages/preferences-page.tsx"],
      notifySurface: ["const:notify"],
      queryClientReferenceFiles: ["apps/desktop-v3/src/app/providers/app-providers.tsx"],
      queryClientSurface: ["const:queryClient"],
      queryRetryPolicyReferenceFiles: ["apps/desktop-v3/src/lib/query/query-client.ts"],
      queryRetryPolicySurface: ["fn:shouldRetryDesktopQuery"],
      scannedFileCount: 2,
      scannedFiles: [
        "apps/desktop-v3/src/lib/errors/app-error.ts",
        "apps/desktop-v3/src/lib/query/query-client.ts",
      ],
      supportFiles: ["apps/desktop-v3/src/lib/notify.ts"],
      typographyKeys: ["pageTitle"],
      typographyReferenceFiles: ["apps/desktop-v3/src/pages/dashboard-page.tsx"],
      typographySurface: ["const:typography"],
      utilsReferenceFiles: ["apps/desktop-v3/src/components/ui/button.tsx"],
      utilsSurface: ["fn:cn"],
      violations: [],
    }));
    const createSummaryImpl = vi.fn(() => ({
      allowedAppErrorExternalReferenceFiles: [...config.allowedAppErrorExternalReferenceFiles],
      allowedAppErrorShapeProperties: [...config.allowedAppErrorShapeProperties],
      allowedAppErrorSurface: [...config.allowedAppErrorSurface],
      allowedCommandErrorPayloadProperties: [...config.allowedCommandErrorPayloadProperties],
      allowedErrorSupportDetailProperties: [...config.allowedErrorSupportDetailProperties],
      allowedErrorSupportDetailsExternalReferenceFiles: [
        ...config.allowedErrorSupportDetailsExternalReferenceFiles,
      ],
      allowedErrorSupportDetailsSurface: [...config.allowedErrorSupportDetailsSurface],
      allowedNormalizeCommandErrorExternalReferenceFiles: [
        ...config.allowedNormalizeCommandErrorExternalReferenceFiles,
      ],
      allowedNormalizeCommandErrorSurface: [...config.allowedNormalizeCommandErrorSurface],
      allowedNotifyExternalReferenceFiles: [...config.allowedNotifyExternalReferenceFiles],
      allowedNotifyKeys: [...config.allowedNotifyKeys],
      allowedNotifySurface: [...config.allowedNotifySurface],
      allowedQueryClientExternalReferenceFiles: [...config.allowedQueryClientExternalReferenceFiles],
      allowedQueryClientSurface: [...config.allowedQueryClientSurface],
      allowedQueryRetryPolicyExternalReferenceFiles: [
        ...config.allowedQueryRetryPolicyExternalReferenceFiles,
      ],
      allowedQueryRetryPolicySurface: [...config.allowedQueryRetryPolicySurface],
      allowedSupportFiles: [...config.allowedSupportFiles],
      allowedTypographyExternalReferenceFiles: [...config.allowedTypographyExternalReferenceFiles],
      allowedTypographyKeys: [...config.allowedTypographyKeys],
      allowedTypographySurface: [...config.allowedTypographySurface],
      allowedUtilsExternalReferenceFiles: [...config.allowedUtilsExternalReferenceFiles],
      allowedUtilsSurface: [...config.allowedUtilsSurface],
      appErrorReferenceFiles: [],
      appErrorShapeProperties: [],
      appErrorSurface: [],
      commandErrorPayloadProperties: [],
      error: null,
      errorSupportDetailProperties: [],
      errorSupportDetailsReferenceFiles: [],
      errorSupportDetailsSurface: [],
      latestSummaryPath: config.latestSummaryPath,
      normalizeCommandErrorReferenceFiles: [],
      normalizeCommandErrorSurface: [],
      notifyKeys: [],
      notifyReferenceFiles: [],
      notifySurface: [],
      outputDir: config.outputDir,
      queryClientReferenceFiles: [],
      queryClientSurface: [],
      queryRetryPolicyReferenceFiles: [],
      queryRetryPolicySurface: [],
      runId: "support-governance-test",
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      supportFiles: [],
      typographyKeys: [],
      typographyReferenceFiles: [],
      typographySurface: [],
      utilsReferenceFiles: [],
      utilsSurface: [],
      violationCount: 0,
      violations: [],
    }));
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const resolveConfigImpl = vi.fn(() => config);

    const result = await runDesktopV3SupportGovernanceCli({
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
    expect(persistVerificationSummaryImpl).toHaveBeenCalledOnce();
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "desktop-v3 support governance passed. Summary: /tmp/support-governance/summary.json | Latest: /tmp/support-governance/latest.json",
    );
  });
});
