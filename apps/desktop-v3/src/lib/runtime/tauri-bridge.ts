import { invoke } from "@tauri-apps/api/core";

import type { TauriInvoke } from "@/lib/runtime/tauri-invoke";

interface WaitForTauriInvokeBridgeOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

interface TauriInternalsBridge {
  invoke: TauriInvoke;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: TauriInternalsBridge;
  }
}

function hasTauriInvokeBridge(target: unknown): target is TauriInternalsBridge {
  return (
    typeof target === "object" &&
    target !== null &&
    "invoke" in target &&
    typeof target.invoke === "function"
  );
}

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export async function waitForTauriInvokeBridge(
  options: WaitForTauriInvokeBridgeOptions = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  if (hasTauriInvokeBridge(window.__TAURI_INTERNALS__)) {
    return;
  }

  const pollIntervalMs = options.pollIntervalMs ?? 25;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(pollIntervalMs);

    if (hasTauriInvokeBridge(window.__TAURI_INTERNALS__)) {
      return;
    }
  }

  throw new Error("Tauri invoke bridge is not ready.");
}

export async function loadTauriInvoke(): Promise<TauriInvoke> {
  await waitForTauriInvokeBridge();
  return invoke as TauriInvoke;
}
