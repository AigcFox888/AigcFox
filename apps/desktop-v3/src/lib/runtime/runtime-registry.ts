import type { DesktopRuntime } from "@/lib/runtime/desktop-runtime";
import { MockCommandRuntime } from "@/lib/runtime/mock-command-runtime";
import { resolveDesktopRuntimeMode } from "@/lib/runtime/runtime-mode";
import { TauriCommandRuntime } from "@/lib/runtime/tauri-command-runtime";

let cachedDesktopRuntime: DesktopRuntime | null = null;

export function getDesktopRuntime() {
  cachedDesktopRuntime ??= resolveDesktopRuntimeMode() === "tauri"
    ? new TauriCommandRuntime()
    : new MockCommandRuntime();

  return cachedDesktopRuntime;
}

export function resetDesktopRuntimeForTest() {
  cachedDesktopRuntime = null;
}
