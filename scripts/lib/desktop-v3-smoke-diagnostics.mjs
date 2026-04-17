const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T/u;

function assertNonEmptyValue(rowMap, cardName, label) {
  const value = rowMap[label];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${cardName} card is missing the "${label}" row.`);
  }

  return value;
}

function assertExactValue(rowMap, cardName, label, expectedValue) {
  const actualValue = assertNonEmptyValue(rowMap, cardName, label);

  if (actualValue !== expectedValue) {
    throw new Error(
      `${cardName} card "${label}" mismatch: expected "${expectedValue}", got "${actualValue}".`,
    );
  }

  return actualValue;
}

function assertTimestampValue(rowMap, cardName, label) {
  const actualValue = assertNonEmptyValue(rowMap, cardName, label);

  if (!isoTimestampPattern.test(actualValue)) {
    throw new Error(
      `${cardName} card "${label}" did not contain an ISO timestamp: "${actualValue}".`,
    );
  }

  return actualValue;
}

export function buildDesktopV3CardRowMap(rows) {
  const entries = Array.isArray(rows) ? rows : [];

  return Object.fromEntries(
    entries
      .filter((entry) => {
        return (
          entry &&
          typeof entry === "object" &&
          typeof entry.label === "string" &&
          entry.label.length > 0 &&
          typeof entry.value === "string"
        );
      })
      .map((entry) => [entry.label, entry.value]),
  );
}

export function verifyDesktopV3DiagnosticsCards({
  livenessRows,
  localRows,
  readinessRows,
}) {
  const localRowMap = buildDesktopV3CardRowMap(localRows);
  const livenessRowMap = buildDesktopV3CardRowMap(livenessRows);
  const readinessRowMap = buildDesktopV3CardRowMap(readinessRows);

  const localThemeMode = assertExactValue(localRowMap, "diagnostics local", "Theme Mode", "dark");
  const localSecureStore = assertExactValue(
    localRowMap,
    "diagnostics local",
    "Secure Store",
    "reserved / mock-keyring / disabled",
  );
  const localSyncCache = assertExactValue(localRowMap, "diagnostics local", "Sync Cache", "2");
  const localDirtyCache = assertExactValue(localRowMap, "diagnostics local", "Dirty Cache", "1");

  assertExactValue(localRowMap, "diagnostics local", "Database", "mock-ready");
  const localLastProbeAt = assertTimestampValue(localRowMap, "diagnostics local", "Last Probe");

  assertExactValue(livenessRowMap, "diagnostics liveness", "Service", "mock-control-plane-api");
  assertExactValue(livenessRowMap, "diagnostics liveness", "Status", "pass");
  assertTimestampValue(livenessRowMap, "diagnostics liveness", "Checked At");
  const livenessRequestId = assertExactValue(
    livenessRowMap,
    "diagnostics liveness",
    "Request ID",
    "mock-liveness",
  );

  assertExactValue(readinessRowMap, "diagnostics readiness", "Service", "mock-control-plane-api");
  assertExactValue(readinessRowMap, "diagnostics readiness", "Status", "pass");
  assertTimestampValue(readinessRowMap, "diagnostics readiness", "Checked At");
  const readinessRequestId = assertExactValue(
    readinessRowMap,
    "diagnostics readiness",
    "Request ID",
    "mock-readiness",
  );

  return {
    livenessRequestId,
    localDirtyCache,
    localLastProbeAt,
    localSecureStore,
    localSyncCache,
    localThemeMode,
    readinessRequestId,
  };
}
