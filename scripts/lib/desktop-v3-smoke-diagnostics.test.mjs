import { describe, expect, it } from "vitest";

import {
  buildDesktopV3CardRowMap,
  verifyDesktopV3DiagnosticsCards,
} from "./desktop-v3-smoke-diagnostics.mjs";

function buildLocalRows(overrides = {}) {
  return [
    { label: "Database", value: overrides.database ?? "mock-ready" },
    { label: "Theme Mode", value: overrides.themeMode ?? "dark" },
    {
      label: "Secure Store",
      value: overrides.secureStore ?? "reserved / mock-keyring / disabled",
    },
    { label: "Sync Cache", value: overrides.syncCache ?? "2" },
    { label: "Dirty Cache", value: overrides.dirtyCache ?? "1" },
    { label: "Last Probe", value: overrides.lastProbe ?? "2026-04-13T00:00:00.000Z" },
  ];
}

function buildProbeRows(requestId) {
  return [
    { label: "Service", value: "mock-control-plane-api" },
    { label: "Status", value: "pass" },
    { label: "Checked At", value: "2026-04-13T00:00:01.000Z" },
    { label: "Request ID", value: requestId },
  ];
}

describe("desktop-v3-smoke-diagnostics", () => {
  it("builds a label keyed row map", () => {
    expect(
      buildDesktopV3CardRowMap([
        { label: "Theme Mode", value: "dark" },
        { label: "Sync Cache", value: "2" },
      ]),
    ).toEqual({
      "Sync Cache": "2",
      "Theme Mode": "dark",
    });
  });

  it("verifies diagnostics cards using row labels instead of row order", () => {
    const result = verifyDesktopV3DiagnosticsCards({
      livenessRows: buildProbeRows("mock-liveness"),
      localRows: buildLocalRows(),
      readinessRows: buildProbeRows("mock-readiness"),
    });

    expect(result).toEqual({
      livenessRequestId: "mock-liveness",
      localDirtyCache: "1",
      localLastProbeAt: "2026-04-13T00:00:00.000Z",
      localSecureStore: "reserved / mock-keyring / disabled",
      localSyncCache: "2",
      localThemeMode: "dark",
      readinessRequestId: "mock-readiness",
    });
  });

  it("fails closed when the secure store summary drifts", () => {
    expect(() =>
      verifyDesktopV3DiagnosticsCards({
        livenessRows: buildProbeRows("mock-liveness"),
        localRows: buildLocalRows({
          secureStore: "reserved / os-keyring / disabled",
        }),
        readinessRows: buildProbeRows("mock-readiness"),
      }),
    ).toThrowError(/Secure Store/u);
  });
});
