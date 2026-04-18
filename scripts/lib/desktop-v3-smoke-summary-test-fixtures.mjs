import {
  desktopV3ResponsiveSmokeRoutes,
  desktopV3ResponsiveSmokeViewports,
} from "./desktop-v3-smoke-contract.mjs";

function resolveOutputConfig(kind, config = {}) {
  const outputDir = config.outputDir ?? `/tmp/${kind}`;
  const latestSummaryPath =
    config.latestSummaryPath ?? `/workspace/output/verification/latest/${kind}-summary.json`;
  const summaryPath = config.summaryPath ?? `${outputDir}/summary.json`;

  return {
    latestSummaryPath,
    outputDir,
    summaryPath,
  };
}

export function buildDesktopV3ResponsiveSmokeSummary(config = {}) {
  const resolvedConfig = resolveOutputConfig("desktop-v3-responsive-smoke", config);

  return {
    consoleMessages: [
      {
        text: "renderer ready",
        type: "info",
      },
    ],
    error: null,
    failureHtmlPath: null,
    finishedAt: "2026-04-14T10:05:00.000Z",
    httpErrors: [],
    interactions: {
      diagnostics: {
        livenessRequestId: "mock-liveness",
        localDirtyCache: "1",
        localLastProbeAt: "2026-04-14T10:04:00.000Z",
        localSecureStore: "reserved / mock-keyring / disabled",
        localSyncCache: "2",
        localThemeMode: "dark",
        readinessRequestId: "mock-readiness",
      },
      preferences: {
        appliedThemeMode: "dark",
        htmlThemeMode: "dark",
      },
    },
    latestSummaryPath: resolvedConfig.latestSummaryPath,
    outputDir: resolvedConfig.outputDir,
    pageErrors: [],
    preview: {
      logPath: `${resolvedConfig.outputDir}/desktop-v3-preview.log`,
      startedByScript: true,
      url: "http://127.0.0.1:1421",
    },
    requestFailures: [],
    routes: desktopV3ResponsiveSmokeViewports.flatMap((viewport) =>
      desktopV3ResponsiveSmokeRoutes.map((route) => ({
        key: route.key,
        metrics: {
          bodyScrollWidth: viewport.width,
          centeredGapDelta: viewport.expectedLayoutMode === "centered" ? 0 : 1,
          containerWidth: Math.min(1400, viewport.width - viewport.expectedSidebarWidth - 80),
          documentScrollWidth: viewport.width,
          hash: route.hash,
          innerWidth: viewport.width,
          layoutMode: viewport.expectedLayoutMode,
          mainRegionContentWidth: Math.min(1400, viewport.width - viewport.expectedSidebarWidth - 80),
          mainRegionWidth: viewport.width - viewport.expectedSidebarWidth,
          pathname: "/",
          shellScrollWidth: viewport.width,
          shellWidth: viewport.width,
          sidebarWidth: viewport.expectedSidebarWidth,
          viewportOverflowX: false,
        },
        testId: route.testId,
        viewport: viewport.key,
      })),
    ),
    screenshots: [
      `${resolvedConfig.outputDir}/dashboard-w1920.png`,
      `${resolvedConfig.outputDir}/preferences-w1440.png`,
      `${resolvedConfig.outputDir}/diagnostics-w1440.png`,
      `${resolvedConfig.outputDir}/preferences-interaction.png`,
      `${resolvedConfig.outputDir}/diagnostics-interaction.png`,
    ],
    startedAt: "2026-04-14T10:00:00.000Z",
    status: "passed",
    summaryPath: resolvedConfig.summaryPath,
  };
}

export function buildDesktopV3TauriDevSmokeSummary(config = {}) {
  const resolvedConfig = resolveOutputConfig("desktop-v3-tauri-dev-smoke", config);

  return {
    appId: "aigcfox-desktop-v3",
    appliedEnvOverrides: {
      LIBGL_ALWAYS_SOFTWARE: "1",
    },
    checkedAt: "2026-04-14T10:00:00.000Z",
    error: null,
    latestSummaryPath: resolvedConfig.latestSummaryPath,
    logPath: `${resolvedConfig.outputDir}/tauri-dev.log`,
    markers: {
      cargoRunning: true,
      documentBootSeen: true,
      mainWindowPageLoadFinished: true,
      mainWindowPageLoadStarted: true,
      rendererBootSeen: true,
      viteReady: true,
      wslgWindowRegistered: true,
    },
    observed: {
      commandInvocations: ["desktop_get_backend_liveness"],
      devRequests: [
        {
          method: "GET",
          url: "http://127.0.0.1:1420/",
        },
      ],
      mainWindowNavigations: [
        {
          allowed: true,
          url: "http://127.0.0.1:1420/#/",
        },
      ],
      pageLoads: [
        {
          event: "finished",
          url: "http://127.0.0.1:1420/#/",
        },
      ],
      rendererBoots: [
        {
          route: "#/",
          runtime: "tauri",
          stage: "app",
        },
      ],
    },
    outputDir: resolvedConfig.outputDir,
    postReadyDelayMs: 0,
    status: "passed",
    summaryPath: resolvedConfig.summaryPath,
    timeoutMs: 90000,
    warnings: [],
    westonLogPath: "/mnt/wslg/weston.log",
  };
}

export function createDesktopV3SmokeSummaryReadFile(entries) {
  return async (targetPath) => {
    if (!(targetPath in entries)) {
      throw new Error(`Unexpected path: ${targetPath}`);
    }

    return JSON.stringify(entries[targetPath]);
  };
}
