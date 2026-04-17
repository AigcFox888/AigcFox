import { afterEach, describe, expect, it, vi } from "vitest";

import { waitForTauriInvokeBridge } from "@/lib/runtime/tauri-bridge";

describe("waitForTauriInvokeBridge", () => {
  afterEach(() => {
    delete window.__TAURI_INTERNALS__;
  });

  it("resolves immediately when the tauri bridge is already available", async () => {
    window.__TAURI_INTERNALS__ = {
      invoke: vi.fn(),
    };

    await expect(waitForTauriInvokeBridge({ timeoutMs: 0 })).resolves.toBeUndefined();
  });

  it("fails closed when the tauri bridge never appears", async () => {
    await expect(
      waitForTauriInvokeBridge({
        pollIntervalMs: 1,
        timeoutMs: 5,
      }),
    ).rejects.toThrow("Tauri invoke bridge is not ready.");
  });
});
