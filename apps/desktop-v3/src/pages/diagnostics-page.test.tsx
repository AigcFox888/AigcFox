import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiagnosticsOverview } from "@/features/diagnostics/diagnostics-types";
import { getDiagnosticsOverview } from "@/features/diagnostics/diagnostics-api";
import { DiagnosticsPage } from "@/pages/diagnostics-page";
import { renderWithQueryClient } from "@/test/render-with-query-client";

vi.mock("@/features/diagnostics/diagnostics-api", () => ({
  getDiagnosticsOverview: vi.fn(),
}));

function buildDiagnosticsOverview(): DiagnosticsOverview {
  return {
    liveness: {
      checkedAt: "2026-04-13T00:00:00.000Z",
      requestId: "req_liveness",
      service: "control-plane-api",
      status: "pass",
    },
    local: {
      appVersion: "0.1.0",
      backendBaseUrl: "http://127.0.0.1:3211",
      checkedAt: "2026-04-13T00:00:00.000Z",
      databasePath: "/tmp/desktop-v3.sqlite3",
      databaseStatus: "ready",
      dirtySyncCacheEntryCount: 1,
      lastBackendProbeAt: "2026-04-13T00:00:00.000Z",
      platform: "linux",
      secureStore: {
        provider: "os-keyring",
        status: "reserved",
        writesEnabled: false,
      },
      syncCacheEntryCount: 2,
      themeMode: "dark",
    },
    readiness: {
      checkedAt: "2026-04-13T00:00:01.000Z",
      requestId: "req_readiness",
      service: "control-plane-api",
      status: "pass",
    },
  };
}

describe("DiagnosticsPage", () => {
  beforeEach(() => {
    vi.mocked(getDiagnosticsOverview).mockReset();
  });

  it("renders diagnostics overview values from one query result", async () => {
    vi.mocked(getDiagnosticsOverview).mockResolvedValue(buildDiagnosticsOverview());

    const view = renderWithQueryClient(<DiagnosticsPage />);

    expect(await screen.findByText("本地 Runtime")).toBeTruthy();

    const localCard = screen.getByTestId("desktop-v3-diagnostics-local");
    const livenessCard = screen.getByTestId("desktop-v3-diagnostics-liveness");
    const readinessCard = screen.getByTestId("desktop-v3-diagnostics-readiness");

    expect(within(localCard).getByText("dark")).toBeTruthy();
    expect(within(localCard).getByText("reserved / os-keyring / disabled")).toBeTruthy();
    expect(within(localCard).getByText("2")).toBeTruthy();
    expect(within(localCard).getByText("1")).toBeTruthy();
    expect(within(localCard).getByText("2026-04-13T00:00:00.000Z")).toBeTruthy();
    expect(within(livenessCard).getByText("req_liveness")).toBeTruthy();
    expect(within(readinessCard).getByText("req_readiness")).toBeTruthy();
    expect(screen.getAllByText("control-plane-api").length).toBe(2);

    view.unmount();
    view.queryClient.clear();
  });

  it("refetches diagnostics overview on desktop refresh event", async () => {
    vi.mocked(getDiagnosticsOverview).mockImplementation(async () => buildDiagnosticsOverview());

    const view = renderWithQueryClient(<DiagnosticsPage />);

    await screen.findByText("本地 Runtime");
    expect(vi.mocked(getDiagnosticsOverview).mock.calls.length).toBe(1);

    window.dispatchEvent(new CustomEvent("desktop-v3:refresh-requested"));

    await waitFor(() => {
      expect(vi.mocked(getDiagnosticsOverview).mock.calls.length).toBe(2);
    });

    view.unmount();
    view.queryClient.clear();
  });
});
