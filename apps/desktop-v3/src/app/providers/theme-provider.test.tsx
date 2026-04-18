import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { useThemePreferenceStore } from "@/features/preferences/preferences-store";
import type { ThemePreference } from "@/lib/runtime/contracts";
import { renderWithQueryClient } from "@/test/render-with-query-client";

vi.mock("@/features/preferences/preferences-api", () => ({
  getThemePreference: vi.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("ThemeProvider", () => {
  beforeEach(async () => {
    const { getThemePreference } = await import("@/features/preferences/preferences-api");

    vi.mocked(getThemePreference).mockReset();
    useThemePreferenceStore.setState({ themeMode: "system" });
    document.documentElement.className = "";
    delete document.documentElement.dataset.themeMode;
  });

  it("waits for the persisted preference before applying the document theme", async () => {
    const { getThemePreference } = await import("@/features/preferences/preferences-api");
    const deferred = createDeferred<ThemePreference>();

    vi.mocked(getThemePreference).mockReturnValue(deferred.promise);

    const view = renderWithQueryClient(
      <ThemeProvider>
        <div>theme-provider-child</div>
      </ThemeProvider>,
    );

    expect(screen.getByText("theme-provider-child")).toBeTruthy();
    expect(document.documentElement.dataset.themeMode).toBeUndefined();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    deferred.resolve({
      mode: "dark",
      updatedAt: "2026-04-18T10:00:00.000Z",
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.themeMode).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(useThemePreferenceStore.getState().themeMode).toBe("dark");
    });

    view.unmount();
    view.queryClient.clear();
  });

  it("syncs the local theme store from query cache updates", async () => {
    const { getThemePreference } = await import("@/features/preferences/preferences-api");

    vi.mocked(getThemePreference).mockResolvedValue({
      mode: "light",
      updatedAt: "2026-04-18T10:00:00.000Z",
    });

    const view = renderWithQueryClient(
      <ThemeProvider>
        <div>theme-provider-child</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.themeMode).toBe("light");
      expect(useThemePreferenceStore.getState().themeMode).toBe("light");
    });

    act(() => {
      view.queryClient.setQueryData(["preferences", "theme-mode"], {
        mode: "dark",
        updatedAt: "2026-04-18T10:05:00.000Z",
      });
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.themeMode).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(useThemePreferenceStore.getState().themeMode).toBe("dark");
    });

    view.unmount();
    view.queryClient.clear();
  });
});
