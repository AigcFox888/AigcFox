import {
  desktopV3ResponsiveSmokeRoutes,
  desktopV3ResponsiveSmokeViewports,
} from "./desktop-v3-smoke-contract.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertObject(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
}

function assertArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`);
}

function assertBoolean(value, label) {
  assert(typeof value === "boolean", `${label} must be a boolean.`);
}

function assertNonEmptyString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty string.`);
}

function assertNullableString(value, label) {
  assert(value === null || typeof value === "string", `${label} must be a string or null.`);
}

function assertNonNegativeInteger(value, label) {
  assert(Number.isInteger(value) && value >= 0, `${label} must be a non-negative integer.`);
}

function assertFiniteNumber(value, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number.`);
}

function assertStringArray(value, label) {
  assertArray(value, label);
  value.forEach((entry, index) => {
    assertNonEmptyString(entry, `${label}[${index}]`);
  });
}

function assertStringMap(value, label) {
  assertObject(value, label);
  Object.entries(value).forEach(([key, entry]) => {
    assertNonEmptyString(key, `${label} key`);
    assertNonEmptyString(entry, `${label}.${key}`);
  });
}

function assertExpectedString(actualValue, expectedValue, label) {
  if (expectedValue !== undefined) {
    assert(actualValue === expectedValue, `${label} did not match the expected value.`);
  }
}

function assertFinalStatus(value, label) {
  assert(["passed", "failed"].includes(value), `${label} must be "passed" or "failed".`);
}

function assertResponsiveRouteMetrics(metrics, label) {
  assertObject(metrics, label);

  for (const key of [
    "bodyScrollWidth",
    "centeredGapDelta",
    "containerWidth",
    "documentScrollWidth",
    "innerWidth",
    "mainRegionContentWidth",
    "mainRegionWidth",
    "shellScrollWidth",
    "shellWidth",
    "sidebarWidth",
  ]) {
    assertFiniteNumber(metrics[key], `${label}.${key}`);
  }

  assertNonEmptyString(metrics.hash, `${label}.hash`);
  assertNonEmptyString(metrics.layoutMode, `${label}.layoutMode`);
  assertNonEmptyString(metrics.pathname, `${label}.pathname`);
  assertBoolean(metrics.viewportOverflowX, `${label}.viewportOverflowX`);
}

function assertConsoleMessageEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.text, `${label}.text`);
  assertNonEmptyString(entry.type, `${label}.type`);
}

function assertRequestFailureEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.errorText, `${label}.errorText`);
  assertNonEmptyString(entry.method, `${label}.method`);
  assertNonEmptyString(entry.url, `${label}.url`);
}

function assertHttpErrorEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.method, `${label}.method`);
  assertFiniteNumber(entry.status, `${label}.status`);
  assertNonEmptyString(entry.url, `${label}.url`);
}

function assertHostDevRequestEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.method, `${label}.method`);
  assertNonEmptyString(entry.url, `${label}.url`);
}

function assertHostNavigationEntry(entry, label) {
  assertObject(entry, label);
  assertBoolean(entry.allowed, `${label}.allowed`);
  assertNonEmptyString(entry.url, `${label}.url`);
}

function assertHostPageLoadEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.event, `${label}.event`);
  assertNonEmptyString(entry.url, `${label}.url`);
}

function assertHostRendererBootEntry(entry, label) {
  assertObject(entry, label);
  assertNonEmptyString(entry.route, `${label}.route`);
  assertNonEmptyString(entry.runtime, `${label}.runtime`);
  assertNonEmptyString(entry.stage, `${label}.stage`);
}

function assertObservedHostSignals(observed, label) {
  assertObject(observed, label);
  assertStringArray(observed.commandInvocations, `${label}.commandInvocations`);
  assertArray(observed.devRequests, `${label}.devRequests`);
  observed.devRequests.forEach((entry, index) => {
    assertHostDevRequestEntry(entry, `${label}.devRequests[${index}]`);
  });
  assertArray(observed.mainWindowNavigations, `${label}.mainWindowNavigations`);
  observed.mainWindowNavigations.forEach((entry, index) => {
    assertHostNavigationEntry(entry, `${label}.mainWindowNavigations[${index}]`);
  });
  assertArray(observed.pageLoads, `${label}.pageLoads`);
  observed.pageLoads.forEach((entry, index) => {
    assertHostPageLoadEntry(entry, `${label}.pageLoads[${index}]`);
  });
  assertArray(observed.rendererBoots, `${label}.rendererBoots`);
  observed.rendererBoots.forEach((entry, index) => {
    assertHostRendererBootEntry(entry, `${label}.rendererBoots[${index}]`);
  });
}

function assertHostMarkers(markers, label) {
  assertObject(markers, label);

  for (const key of [
    "documentBootSeen",
    "mainWindowPageLoadFinished",
    "mainWindowPageLoadStarted",
    "rendererBootSeen",
    "wslgWindowRegistered",
  ]) {
    assertBoolean(markers[key], `${label}.${key}`);
  }
}

function assertTauriDevMarkers(markers, label) {
  assertHostMarkers(markers, label);
  assertBoolean(markers.cargoRunning, `${label}.cargoRunning`);
  assertBoolean(markers.viteReady, `${label}.viteReady`);
}

function assertBackendRequestEntry(entry, label) {
  assertObject(entry, label);
  assertNonNegativeInteger(entry.bytes, `${label}.bytes`);
  assertNonNegativeInteger(entry.durationMs, `${label}.durationMs`);
  assertNonEmptyString(entry.method, `${label}.method`);
  assertNonEmptyString(entry.path, `${label}.path`);
  assertNullableString(entry.requestId, `${label}.requestId`);
  assert(entry.statusCode === null || Number.isInteger(entry.statusCode), `${label}.statusCode must be an integer or null.`);
}

export function assertDesktopV3ResponsiveSmokeSummaryContract(summary, options = {}) {
  const label = options.label ?? "desktop-v3 responsive smoke summary";

  assertObject(summary, label);
  assertArray(summary.consoleMessages, `${label}.consoleMessages`);
  summary.consoleMessages.forEach((entry, index) => {
    assertConsoleMessageEntry(entry, `${label}.consoleMessages[${index}]`);
  });
  assertNullableString(summary.error, `${label}.error`);
  assertNullableString(summary.failureHtmlPath, `${label}.failureHtmlPath`);
  assertNonEmptyString(summary.finishedAt, `${label}.finishedAt`);
  assertArray(summary.httpErrors, `${label}.httpErrors`);
  summary.httpErrors.forEach((entry, index) => {
    assertHttpErrorEntry(entry, `${label}.httpErrors[${index}]`);
  });
  assertObject(summary.interactions, `${label}.interactions`);
  assertNonEmptyString(summary.latestSummaryPath, `${label}.latestSummaryPath`);
  assertNonEmptyString(summary.outputDir, `${label}.outputDir`);
  assertStringArray(summary.pageErrors, `${label}.pageErrors`);
  assertObject(summary.preview, `${label}.preview`);
  assertNonEmptyString(summary.preview.logPath, `${label}.preview.logPath`);
  assertBoolean(summary.preview.startedByScript, `${label}.preview.startedByScript`);
  assertNonEmptyString(summary.preview.url, `${label}.preview.url`);
  assertArray(summary.requestFailures, `${label}.requestFailures`);
  summary.requestFailures.forEach((entry, index) => {
    assertRequestFailureEntry(entry, `${label}.requestFailures[${index}]`);
  });
  assertArray(summary.routes, `${label}.routes`);
  summary.routes.forEach((entry, index) => {
    const entryLabel = `${label}.routes[${index}]`;
    assertObject(entry, entryLabel);
    assertNonEmptyString(entry.key, `${entryLabel}.key`);
    assertResponsiveRouteMetrics(entry.metrics, `${entryLabel}.metrics`);
    assertNonEmptyString(entry.testId, `${entryLabel}.testId`);
    assertNonEmptyString(entry.viewport, `${entryLabel}.viewport`);
  });
  assertStringArray(summary.screenshots, `${label}.screenshots`);
  assertNonEmptyString(summary.startedAt, `${label}.startedAt`);
  assertFinalStatus(summary.status, `${label}.status`);
  assertNonEmptyString(summary.summaryPath, `${label}.summaryPath`);
  assertExpectedString(summary.latestSummaryPath, options.expectedLatestSummaryPath, `${label}.latestSummaryPath`);
  assertExpectedString(summary.outputDir, options.expectedOutputDir, `${label}.outputDir`);
  assertExpectedString(summary.summaryPath, options.expectedSummaryPath, `${label}.summaryPath`);

  if (summary.status === "passed") {
    const expectedRouteCount =
      desktopV3ResponsiveSmokeRoutes.length * desktopV3ResponsiveSmokeViewports.length;

    assert(
      summary.routes.length === expectedRouteCount,
      `${label}.routes did not cover the full route/viewport matrix.`,
    );

    assertObject(summary.interactions.preferences, `${label}.interactions.preferences`);
    assertNonEmptyString(
      summary.interactions.preferences.appliedThemeMode,
      `${label}.interactions.preferences.appliedThemeMode`,
    );
    assertNonEmptyString(
      summary.interactions.preferences.htmlThemeMode,
      `${label}.interactions.preferences.htmlThemeMode`,
    );
    assertObject(summary.interactions.diagnostics, `${label}.interactions.diagnostics`);

    for (const key of [
      "livenessRequestId",
      "localDirtyCache",
      "localLastProbeAt",
      "localSecureStore",
      "localSyncCache",
      "localThemeMode",
      "readinessRequestId",
    ]) {
      assertNonEmptyString(summary.interactions.diagnostics[key], `${label}.interactions.diagnostics.${key}`);
    }
  }
}

export function assertDesktopV3TauriDevSmokeSummaryContract(summary, options = {}) {
  const label = options.label ?? "desktop-v3 tauri dev smoke summary";

  assertObject(summary, label);
  assertStringMap(summary.appliedEnvOverrides, `${label}.appliedEnvOverrides`);
  assertNonEmptyString(summary.appId, `${label}.appId`);
  assertNonEmptyString(summary.checkedAt, `${label}.checkedAt`);
  assertNullableString(summary.error, `${label}.error`);
  assertNonEmptyString(summary.latestSummaryPath, `${label}.latestSummaryPath`);
  assertNonEmptyString(summary.logPath, `${label}.logPath`);
  assertTauriDevMarkers(summary.markers, `${label}.markers`);
  assertObservedHostSignals(summary.observed, `${label}.observed`);
  assertNonEmptyString(summary.outputDir, `${label}.outputDir`);
  assertNonNegativeInteger(summary.postReadyDelayMs, `${label}.postReadyDelayMs`);
  assertFinalStatus(summary.status, `${label}.status`);
  assertNonEmptyString(summary.summaryPath, `${label}.summaryPath`);
  assertNonNegativeInteger(summary.timeoutMs, `${label}.timeoutMs`);
  assertArray(summary.warnings, `${label}.warnings`);
  summary.warnings.forEach((entry, index) => {
    assertNonEmptyString(entry, `${label}.warnings[${index}]`);
  });
  assertNonEmptyString(summary.westonLogPath, `${label}.westonLogPath`);
  assertExpectedString(summary.latestSummaryPath, options.expectedLatestSummaryPath, `${label}.latestSummaryPath`);
  assertExpectedString(summary.outputDir, options.expectedOutputDir, `${label}.outputDir`);
  assertExpectedString(summary.summaryPath, options.expectedSummaryPath, `${label}.summaryPath`);

  if (summary.status === "passed") {
    for (const key of ["cargoRunning", "mainWindowPageLoadFinished", "viteReady", "wslgWindowRegistered"]) {
      assert(summary.markers[key] === true, `${label}.markers.${key} must be true for a passed run.`);
    }
  }
}

export function assertDesktopV3PackagedAppSmokeSummaryContract(summary, options = {}) {
  const label = options.label ?? "desktop-v3 packaged app smoke summary";

  assertObject(summary, label);
  assertStringMap(summary.appliedEnvOverrides, `${label}.appliedEnvOverrides`);
  assertNonEmptyString(summary.appId, `${label}.appId`);
  assertNonEmptyString(summary.binaryPath, `${label}.binaryPath`);
  assertNonEmptyString(summary.checkedAt, `${label}.checkedAt`);
  assertNullableString(summary.error, `${label}.error`);
  assertNonEmptyString(summary.initialRoute, `${label}.initialRoute`);
  assertNonEmptyString(summary.latestSummaryPath, `${label}.latestSummaryPath`);
  assertNonEmptyString(summary.logPath, `${label}.logPath`);
  assertHostMarkers(summary.markers, `${label}.markers`);
  assertObservedHostSignals(summary.observed, `${label}.observed`);
  assertNonEmptyString(summary.outputDir, `${label}.outputDir`);
  assertNonNegativeInteger(summary.postReadyDelayMs, `${label}.postReadyDelayMs`);
  assertStringArray(summary.requiredCommandInvocations, `${label}.requiredCommandInvocations`);
  assertFinalStatus(summary.status, `${label}.status`);
  assertNonEmptyString(summary.summaryPath, `${label}.summaryPath`);
  assertNonNegativeInteger(summary.timeoutMs, `${label}.timeoutMs`);
  assertArray(summary.warnings, `${label}.warnings`);
  summary.warnings.forEach((entry, index) => {
    assertNonEmptyString(entry, `${label}.warnings[${index}]`);
  });
  assertNonEmptyString(summary.westonLogPath, `${label}.westonLogPath`);
  assertExpectedString(summary.latestSummaryPath, options.expectedLatestSummaryPath, `${label}.latestSummaryPath`);
  assertExpectedString(summary.outputDir, options.expectedOutputDir, `${label}.outputDir`);
  assertExpectedString(summary.summaryPath, options.expectedSummaryPath, `${label}.summaryPath`);

  if (summary.status === "passed") {
    assert(
      summary.markers.mainWindowPageLoadFinished === true,
      `${label}.markers.mainWindowPageLoadFinished must be true for a passed run.`,
    );
    assert(
      summary.markers.rendererBootSeen === true,
      `${label}.markers.rendererBootSeen must be true for a passed run.`,
    );

    summary.requiredCommandInvocations.forEach((commandName) => {
      assert(
        summary.observed.commandInvocations.includes(commandName),
        `${label}.observed.commandInvocations is missing ${commandName}.`,
      );
    });
  }
}

export function assertDesktopV3RealBackendDiagnosticsSmokeSummaryContract(summary, options = {}) {
  const label = options.label ?? "desktop-v3 diagnostics bridge smoke summary";

  assertObject(summary, label);
  assertObject(summary.backend, `${label}.backend`);
  assertNonEmptyString(summary.backend.baseUrl, `${label}.backend.baseUrl`);
  assertNonEmptyString(summary.backend.logPath, `${label}.backend.logPath`);
  assertNonNegativeInteger(summary.backend.minimumRequestsPerPath, `${label}.backend.minimumRequestsPerPath`);
  assertArray(summary.backend.requests, `${label}.backend.requests`);
  summary.backend.requests.forEach((entry, index) => {
    assertBackendRequestEntry(entry, `${label}.backend.requests[${index}]`);
  });
  assertNonEmptyString(summary.checkedAt, `${label}.checkedAt`);
  assertNullableString(summary.error, `${label}.error`);
  assertNonEmptyString(summary.latestSummaryPath, `${label}.latestSummaryPath`);
  assertNonEmptyString(summary.outputDir, `${label}.outputDir`);
  assertFinalStatus(summary.status, `${label}.status`);
  assertNonEmptyString(summary.summaryPath, `${label}.summaryPath`);
  assertObject(summary.tauri, `${label}.tauri`);
  assertNonEmptyString(summary.tauri.binaryPath, `${label}.tauri.binaryPath`);
  assertNonEmptyString(summary.tauri.initialRoute, `${label}.tauri.initialRoute`);
  assertNonEmptyString(summary.tauri.summaryPath, `${label}.tauri.summaryPath`);
  assertNonEmptyString(summary.tauri.traceCommands, `${label}.tauri.traceCommands`);
  assertExpectedString(summary.latestSummaryPath, options.expectedLatestSummaryPath, `${label}.latestSummaryPath`);
  assertExpectedString(summary.outputDir, options.expectedOutputDir, `${label}.outputDir`);
  assertExpectedString(summary.summaryPath, options.expectedSummaryPath, `${label}.summaryPath`);

  if (summary.tauri.markers !== null) {
    assertHostMarkers(summary.tauri.markers, `${label}.tauri.markers`);
  }

  if (summary.tauri.observed !== null) {
    assertObservedHostSignals(summary.tauri.observed, `${label}.tauri.observed`);
  }

  if (summary.status === "passed") {
    assertObject(summary.tauri.markers, `${label}.tauri.markers`);
    assertObject(summary.tauri.observed, `${label}.tauri.observed`);
    assert(
      summary.tauri.markers.mainWindowPageLoadFinished === true,
      `${label}.tauri.markers.mainWindowPageLoadFinished must be true for a passed run.`,
    );
    assert(
      summary.tauri.markers.rendererBootSeen === true,
      `${label}.tauri.markers.rendererBootSeen must be true for a passed run.`,
    );

    for (const commandName of ["desktop_get_backend_liveness", "desktop_get_backend_readiness"]) {
      assert(
        summary.tauri.observed.commandInvocations.includes(commandName),
        `${label}.tauri.observed.commandInvocations is missing ${commandName}.`,
      );
    }

    for (const pathValue of ["/api/v1/healthz", "/readyz"]) {
      const matchingRequests = summary.backend.requests.filter((entry) => entry.path === pathValue);

      assert(
        matchingRequests.length >= summary.backend.minimumRequestsPerPath,
        `${label}.backend.requests did not contain enough ${pathValue} entries.`,
      );
    }
  }
}
