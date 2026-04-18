import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PreferencesPage } from "@/pages/preferences-page";
import { useThemePreferenceStore } from "@/features/preferences/preferences-store";
import { renderWithQueryClient } from "@/test/render-with-query-client";

vi.mock("@/features/preferences/preferences-api", () => ({
  getThemePreference: vi.fn(),
  setThemePreference: vi.fn(),
}));

vi.mock("@/lib/notify", () => ({
  notify: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

describe("PreferencesPage", () => {
  beforeEach(async () => {
    const preferencesApi = await import("@/features/preferences/preferences-api");
    const { notify } = await import("@/lib/notify");

    vi.mocked(preferencesApi.getThemePreference).mockReset();
    vi.mocked(preferencesApi.setThemePreference).mockReset();
    vi.mocked(notify.success).mockReset();
    vi.mocked(notify.error).mockReset();
    useThemePreferenceStore.setState({ themeMode: "system" });
  });

  it("renders the current mode from the query result instead of a stale store value", async () => {
    const preferencesApi = await import("@/features/preferences/preferences-api");

    useThemePreferenceStore.setState({ themeMode: "dark" });
    vi.mocked(preferencesApi.getThemePreference).mockResolvedValue({
      mode: "light",
      updatedAt: "2026-04-18T10:00:00.000Z",
    });

    const view = renderWithQueryClient(<PreferencesPage />);

    expect(await screen.findByTestId("desktop-v3-theme-apply-light")).toBeTruthy();
    expect(screen.getByTestId("desktop-v3-theme-apply-light").textContent).toBe("当前模式");
    expect(screen.getByTestId("desktop-v3-theme-apply-dark").textContent).toBe("应用");

    view.unmount();
    view.queryClient.clear();
  });

  it("updates the query-backed selection without mutating renderer theme state directly", async () => {
    const preferencesApi = await import("@/features/preferences/preferences-api");
    const { notify } = await import("@/lib/notify");

    vi.mocked(preferencesApi.getThemePreference).mockResolvedValue({
      mode: "light",
      updatedAt: "2026-04-18T10:00:00.000Z",
    });
    vi.mocked(preferencesApi.setThemePreference).mockResolvedValue({
      mode: "dark",
      updatedAt: "2026-04-18T10:05:00.000Z",
    });

    const user = userEvent.setup();
    const view = renderWithQueryClient(<PreferencesPage />);

    await screen.findByTestId("desktop-v3-theme-apply-dark");
    await user.click(screen.getByTestId("desktop-v3-theme-apply-dark"));

    await waitFor(() => {
      expect(vi.mocked(preferencesApi.setThemePreference)).toHaveBeenCalledWith(
        "dark",
        expect.any(Object),
      );
      expect(screen.getByTestId("desktop-v3-theme-apply-dark").textContent).toBe("当前模式");
      expect(screen.getByTestId("desktop-v3-theme-apply-dark").getAttribute("data-theme-applied")).toBe("false");
      expect(useThemePreferenceStore.getState().themeMode).toBe("system");
      expect(vi.mocked(notify.success)).toHaveBeenCalledWith("主题偏好已写入本地 SQLite。");
    });

    view.unmount();
    view.queryClient.clear();
  });
});
