import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

import { verifyDesktopV3DiagnosticsCards } from "./desktop-v3-smoke-diagnostics.mjs";

function round(value) {
  return Math.round(value * 100) / 100;
}

async function ensureDesktopV3BrowserTempEnv() {
  const isWsl = typeof process.env.WSL_DISTRO_NAME === "string" && process.env.WSL_DISTRO_NAME.length > 0;

  if (!isWsl) {
    return;
  }

  const tempRoot =
    process.env.AIGCFOX_DESKTOP_V3_PLAYWRIGHT_TMPDIR?.trim() || "/tmp/aigcfox-desktop-v3-playwright";

  await fs.mkdir(tempRoot, { recursive: true });

  for (const envName of ["TMPDIR", "TMP", "TEMP"]) {
    const currentValue = process.env[envName]?.trim();

    if (!currentValue || currentValue.startsWith("/mnt/")) {
      process.env[envName] = tempRoot;
    }
  }
}

export async function launchDesktopV3Browser(config, summary) {
  await ensureDesktopV3BrowserTempEnv();

  const browser = await chromium.launch({
    headless: config.browserHeadless,
  });
  const context = await browser.newContext({
    viewport: {
      height: 900,
      width: 1440,
    },
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    summary.consoleMessages.push({
      text: message.text(),
      type: message.type(),
    });
  });
  page.on("pageerror", (error) => {
    summary.pageErrors.push(error.stack || error.message);
  });
  page.on("requestfailed", (request) => {
    summary.requestFailures.push({
      errorText: request.failure()?.errorText ?? "unknown",
      method: request.method(),
      url: request.url(),
    });
  });
  page.on("response", (response) => {
    if (response.status() < 400) {
      return;
    }

    summary.httpErrors.push({
      method: response.request().method(),
      status: response.status(),
      url: response.url(),
    });
  });

  return {
    browser,
    context,
    page,
  };
}

export async function closeDesktopV3Browser(session) {
  if (!session) {
    return;
  }

  await session.context?.close();
  await session.browser?.close();
}

export async function captureDesktopV3Screenshot(session, config, summary, name) {
  const targetPath = path.join(config.outputDir, `${name}.png`);
  await fs.mkdir(config.outputDir, { recursive: true });
  await session.page.screenshot({
    fullPage: true,
    path: targetPath,
  });

  summary.screenshots.push(targetPath);
  return targetPath;
}

export async function captureDesktopV3FailureArtifacts(session, config, summary) {
  if (!session?.page) {
    return;
  }

  await captureDesktopV3Screenshot(session, config, summary, "desktop-v3-responsive-smoke-failure");
  const htmlPath = path.join(config.outputDir, "desktop-v3-responsive-smoke-failure.html");
  const html = await session.page.content();
  await fs.writeFile(htmlPath, html, "utf8");
  summary.failureHtmlPath = htmlPath;
}

async function setDesktopV3Viewport(session, viewport) {
  await session.page.setViewportSize({
    height: viewport.height,
    width: viewport.width,
  });
}

async function waitForDesktopV3RouteReady(session, route) {
  await session.page.waitForFunction(
    (expectedHash) => window.location.hash === expectedHash,
    route.hash,
    { timeout: 30_000 },
  );
  await session.page.waitForSelector(`[data-testid="${route.testId}"]`, {
    timeout: 30_000,
  });
  await session.page.waitForSelector('[data-testid="desktop-v3-shell"]', {
    timeout: 30_000,
  });
}

export async function openDesktopV3Route(session, config, route, viewport) {
  await setDesktopV3Viewport(session, viewport);
  await session.page.goto(`${config.baseUrl}${route.href}`, {
    waitUntil: "networkidle",
  });
  await waitForDesktopV3RouteReady(session, route);
}

export async function switchDesktopV3RouteInSession(session, route, viewport) {
  await setDesktopV3Viewport(session, viewport);
  await session.page.evaluate((nextHash) => {
    window.location.hash = nextHash;
  }, route.hash);
  await waitForDesktopV3RouteReady(session, route);
}

export async function collectDesktopV3LayoutMetrics(session) {
  return session.page.evaluate(() => {
    const localRound = (value) => Math.round(value * 100) / 100;
    const doc = document.documentElement;
    const body = document.body;
    const shell = document.querySelector('[data-testid="desktop-v3-shell"]');
    const sidebar = document.querySelector('[data-testid="desktop-v3-sidebar"]');
    const mainRegion = document.querySelector('[data-testid="desktop-v3-main-region"]');
    const mainContainer = document.querySelector('[data-testid="desktop-v3-main-container"]');

    if (!(shell instanceof HTMLElement)) {
      throw new Error("desktop-v3 shell not found");
    }

    if (!(sidebar instanceof HTMLElement)) {
      throw new Error("desktop-v3 sidebar not found");
    }

    if (!(mainRegion instanceof HTMLElement)) {
      throw new Error("desktop-v3 main region not found");
    }

    if (!(mainContainer instanceof HTMLElement)) {
      throw new Error("desktop-v3 main container not found");
    }

    const shellRect = shell.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const mainRegionRect = mainRegion.getBoundingClientRect();
    const mainContainerRect = mainContainer.getBoundingClientRect();
    const mainRegionStyle = window.getComputedStyle(mainRegion);
    const paddingLeft = Number.parseFloat(mainRegionStyle.paddingLeft);
    const paddingRight = Number.parseFloat(mainRegionStyle.paddingRight);
    const mainRegionContentWidth = mainRegion.clientWidth - paddingLeft - paddingRight;
    const contentLeft = mainRegionRect.left + paddingLeft;
    const contentRight = mainRegionRect.right - paddingRight;

    return {
      bodyScrollWidth: body?.scrollWidth ?? 0,
      containerWidth: localRound(mainContainerRect.width),
      documentScrollWidth: doc.scrollWidth,
      hash: window.location.hash,
      innerWidth: window.innerWidth,
      layoutMode: shell.dataset.layoutMode ?? "unknown",
      mainRegionContentWidth: localRound(mainRegionContentWidth),
      mainRegionWidth: localRound(mainRegionRect.width),
      pathname: window.location.pathname,
      sidebarWidth: localRound(Number.parseFloat(window.getComputedStyle(sidebar).width)),
      shellScrollWidth: shell.scrollWidth,
      shellWidth: localRound(shellRect.width),
      viewportOverflowX:
        doc.scrollWidth > window.innerWidth + 1 ||
        (body?.scrollWidth ?? 0) > window.innerWidth + 1 ||
        shell.scrollWidth > shell.clientWidth + 1,
      centeredGapDelta: localRound(
        Math.abs(
          (mainContainerRect.left - contentLeft) - (contentRight - mainContainerRect.right),
        ),
      ),
    };
  });
}

export function assertDesktopV3Layout(metrics, route, viewport) {
  if (metrics.layoutMode !== viewport.expectedLayoutMode) {
    throw new Error(
      `${route.key} ${viewport.key} layout mode mismatch: expected ${viewport.expectedLayoutMode}, got ${metrics.layoutMode}.`,
    );
  }

  if (Math.abs(metrics.sidebarWidth - viewport.expectedSidebarWidth) > 1) {
    throw new Error(
      `${route.key} ${viewport.key} sidebar width mismatch: expected ${viewport.expectedSidebarWidth}, got ${metrics.sidebarWidth}.`,
    );
  }

  if (metrics.viewportOverflowX) {
    throw new Error(
      `${route.key} ${viewport.key} rendered with horizontal overflow: ${JSON.stringify(metrics, null, 2)}`,
    );
  }

  const expectedContainerWidth = Math.min(1400, metrics.mainRegionContentWidth);
  if (Math.abs(metrics.containerWidth - expectedContainerWidth) > 2) {
    throw new Error(
      `${route.key} ${viewport.key} main container width mismatch: expected ${expectedContainerWidth}, got ${metrics.containerWidth}.`,
    );
  }

  if (metrics.containerWidth > 1401) {
    throw new Error(
      `${route.key} ${viewport.key} main container exceeded max width: ${metrics.containerWidth}.`,
    );
  }

  if (viewport.expectedLayoutMode === "centered" && metrics.centeredGapDelta > 2) {
    throw new Error(
      `${route.key} ${viewport.key} centered container is not balanced: delta ${metrics.centeredGapDelta}.`,
    );
  }
}

export async function verifyDesktopV3PreferenceInteraction(session, summary) {
  const applyDarkButton = session.page.getByTestId("desktop-v3-theme-apply-dark");
  await applyDarkButton.click();
  await session.page.waitForFunction(
    () => document.documentElement.dataset.themeMode === "dark",
    undefined,
    { timeout: 30_000 },
  );

  const activeButtonText = await applyDarkButton.textContent();
  if (!activeButtonText?.includes("当前模式")) {
    throw new Error("preferences page did not reflect the applied dark theme state.");
  }

  summary.interactions.preferences = {
    appliedThemeMode: "dark",
    htmlThemeMode: await session.page.evaluate(() => document.documentElement.dataset.themeMode),
  };
}

async function readDiagnosticsCardRows(session, testId) {
  return session.page.locator(`[data-testid="${testId}"] [data-row-label]`).evaluateAll((rows) => {
    return rows.map((row) => {
      const valueNode = row.querySelector(".font-mono");

      return {
        label: row.getAttribute("data-row-label") ?? "",
        value: valueNode?.textContent?.trim() ?? "",
      };
    });
  });
}

async function readDiagnosticsRowValue(session, testId, rowLabel) {
  const selector = `[data-testid="${testId}"] [data-row-label="${rowLabel}"] .font-mono`;
  const value = await session.page.locator(selector).textContent();

  return value?.trim() ?? "";
}

async function waitForDiagnosticsRefresh(session, previousLastProbeAt, expectedThemeMode) {
  await session.page.waitForFunction(
    ({ expectedThemeMode: nextThemeMode, previousLastProbeAt: lastProbeBeforeRefresh }) => {
      const readRowValue = (testId, rowLabel) => {
        const selector = `[data-testid="${testId}"] [data-row-label="${rowLabel}"] .font-mono`;
        return document.querySelector(selector)?.textContent?.trim() ?? "";
      };

      const currentThemeMode = readRowValue("desktop-v3-diagnostics-local", "Theme Mode");
      const currentLastProbeAt = readRowValue("desktop-v3-diagnostics-local", "Last Probe");
      const hasFreshProbe =
        /^\d{4}-\d{2}-\d{2}T/u.test(currentLastProbeAt) &&
        currentLastProbeAt.length > 0 &&
        currentLastProbeAt !== lastProbeBeforeRefresh;

      return currentThemeMode === nextThemeMode && hasFreshProbe;
    },
    {
      expectedThemeMode,
      previousLastProbeAt,
    },
    { timeout: 30_000 },
  );
}

export async function verifyDesktopV3DiagnosticsInteraction(session, summary) {
  const previousLastProbeAt = await readDiagnosticsRowValue(
    session,
    "desktop-v3-diagnostics-local",
    "Last Probe",
  );

  await session.page.getByRole("button", { name: "刷新诊断" }).click();
  await session.page.waitForSelector('[data-testid="desktop-v3-diagnostics-local"]', {
    timeout: 30_000,
  });
  await waitForDiagnosticsRefresh(session, previousLastProbeAt, "dark");

  const localRows = await readDiagnosticsCardRows(session, "desktop-v3-diagnostics-local");
  const livenessRows = await readDiagnosticsCardRows(session, "desktop-v3-diagnostics-liveness");
  const readinessRows = await readDiagnosticsCardRows(session, "desktop-v3-diagnostics-readiness");

  summary.interactions.diagnostics = verifyDesktopV3DiagnosticsCards({
    livenessRows,
    localRows,
    readinessRows,
  });
}
