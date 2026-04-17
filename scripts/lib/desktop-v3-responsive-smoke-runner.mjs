import fs from "node:fs/promises";

import {
  assertDesktopV3Layout,
  captureDesktopV3FailureArtifacts,
  captureDesktopV3Screenshot,
  closeDesktopV3Browser,
  collectDesktopV3LayoutMetrics,
  launchDesktopV3Browser,
  openDesktopV3Route,
  switchDesktopV3RouteInSession,
  verifyDesktopV3DiagnosticsInteraction,
  verifyDesktopV3PreferenceInteraction,
} from "./desktop-v3-smoke-browser.mjs";
import {
  desktopV3ResponsiveSmokeRoutes,
  desktopV3ResponsiveSmokeViewports,
} from "./desktop-v3-smoke-contract.mjs";
import {
  startDesktopV3PreviewServer,
  stopDesktopV3PreviewServer,
} from "./desktop-v3-smoke-preview.mjs";
import { assertDesktopV3ResponsiveSmokeSummaryContract } from "./desktop-v3-smoke-summary-contract.mjs";
import { writeJsonFile } from "./script-io.mjs";
import { persistVerificationSummary } from "./verification-summary-output.mjs";

export function createDesktopV3ResponsiveSmokeSummary(config) {
  return {
    latestSummaryPath: config.latestSummaryPath,
    outputDir: config.outputDir,
    summaryPath: config.summaryPath,
    startedAt: new Date().toISOString(),
    status: "running",
    preview: {
      startedByScript: false,
      url: config.baseUrl,
      logPath: config.previewLogPath,
    },
    routes: [],
    interactions: {},
    screenshots: [],
    consoleMessages: [],
    pageErrors: [],
    requestFailures: [],
    httpErrors: [],
    failureHtmlPath: null,
    error: null,
  };
}

async function runRouteViewportChecks(session, config, summary, options = {}) {
  const routes = options.routes ?? desktopV3ResponsiveSmokeRoutes;
  const viewports = options.viewports ?? desktopV3ResponsiveSmokeViewports;
  const openRouteImpl = options.openRouteImpl ?? openDesktopV3Route;
  const collectMetricsImpl = options.collectMetricsImpl ?? collectDesktopV3LayoutMetrics;
  const assertLayoutImpl = options.assertLayoutImpl ?? assertDesktopV3Layout;
  const captureScreenshotImpl = options.captureScreenshotImpl ?? captureDesktopV3Screenshot;

  for (const viewport of viewports) {
    for (const route of routes) {
      await openRouteImpl(session, config, route, viewport);
      const metrics = await collectMetricsImpl(session);
      assertLayoutImpl(metrics, route, viewport);

      summary.routes.push({
        key: route.key,
        testId: route.testId,
        viewport: viewport.key,
        metrics,
      });

      if (
        (viewport.key === "w1440" && route.key !== "dashboard") ||
        (viewport.key === "w1920" && route.key === "dashboard")
      ) {
        await captureScreenshotImpl(
          session,
          config,
          summary,
          `desktop-v3-${route.key}-${viewport.key}`,
        );
      }
    }
  }
}

async function runPageInteractions(session, config, summary, options = {}) {
  const routes = options.routes ?? desktopV3ResponsiveSmokeRoutes;
  const viewports = options.viewports ?? desktopV3ResponsiveSmokeViewports;
  const openRouteImpl = options.openRouteImpl ?? openDesktopV3Route;
  const switchRouteImpl = options.switchRouteImpl ?? switchDesktopV3RouteInSession;
  const verifyPreferencesImpl = options.verifyPreferencesImpl ?? verifyDesktopV3PreferenceInteraction;
  const verifyDiagnosticsImpl = options.verifyDiagnosticsImpl ?? verifyDesktopV3DiagnosticsInteraction;
  const captureScreenshotImpl = options.captureScreenshotImpl ?? captureDesktopV3Screenshot;

  const standardViewport = viewports.find((viewport) => viewport.key === "w1440");

  if (!standardViewport) {
    throw new Error("desktop-v3 smoke could not resolve the standard viewport.");
  }

  const preferencesRoute = routes.find((route) => route.key === "preferences");
  const diagnosticsRoute = routes.find((route) => route.key === "diagnostics");

  if (!preferencesRoute || !diagnosticsRoute) {
    throw new Error("desktop-v3 smoke routes are incomplete.");
  }

  await openRouteImpl(session, config, preferencesRoute, standardViewport);
  await verifyPreferencesImpl(session, summary);
  await captureScreenshotImpl(session, config, summary, "desktop-v3-preferences-interaction");

  await switchRouteImpl(session, diagnosticsRoute, standardViewport);
  await verifyDiagnosticsImpl(session, summary);
  await captureScreenshotImpl(session, config, summary, "desktop-v3-diagnostics-interaction");
}

export async function runDesktopV3ResponsiveSmoke(config, options = {}) {
  const summary = createDesktopV3ResponsiveSmokeSummary(config);
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const startPreviewServerImpl = options.startPreviewServerImpl ?? startDesktopV3PreviewServer;
  const stopPreviewServerImpl = options.stopPreviewServerImpl ?? stopDesktopV3PreviewServer;
  const launchBrowserImpl = options.launchBrowserImpl ?? launchDesktopV3Browser;
  const closeBrowserImpl = options.closeBrowserImpl ?? closeDesktopV3Browser;
  const captureFailureArtifactsImpl = options.captureFailureArtifactsImpl ?? captureDesktopV3FailureArtifacts;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;
  let previewServer = null;
  let browserSession = null;

  await mkdirImpl(config.outputDir, { recursive: true });

  try {
    previewServer = await startPreviewServerImpl(config);
    summary.preview.startedByScript = true;

    browserSession = await launchBrowserImpl(config, summary);
    await runRouteViewportChecks(browserSession, config, summary, options);
    await runPageInteractions(browserSession, config, summary, options);

    summary.status = "passed";
  } catch (error) {
    summary.status = "failed";
    summary.error = error instanceof Error ? error.message : String(error);

    if (browserSession) {
      await captureFailureArtifactsImpl(browserSession, config, summary);
    }

    throw error;
  } finally {
    summary.finishedAt = new Date().toISOString();
    assertDesktopV3ResponsiveSmokeSummaryContract(summary, {
      expectedLatestSummaryPath: config.latestSummaryPath,
      expectedOutputDir: config.outputDir,
      expectedSummaryPath: config.summaryPath,
    });
    await persistVerificationSummary(
      summary,
      {
        archiveSummaryPath: config.summaryPath,
        latestSummaryPath: config.latestSummaryPath,
      },
      {
        writeJsonFileImpl,
      },
    );
    await closeBrowserImpl(browserSession);
    await stopPreviewServerImpl(previewServer);
  }

  return summary;
}
