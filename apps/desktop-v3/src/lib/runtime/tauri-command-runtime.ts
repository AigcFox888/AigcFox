import type {
  DesktopCommandName,
  DesktopCommandPayloadMap,
  DesktopCommandResultMap,
} from "@/lib/runtime/tauri-command-types";
import { normalizeCommandError } from "@/lib/errors/normalize-command-error";
import type { ThemeMode } from "@/lib/runtime/contracts";
import type { DesktopRuntime } from "@/lib/runtime/desktop-runtime";
import { loadTauriInvoke } from "@/lib/runtime/tauri-bridge";
import type { TauriInvoke } from "@/lib/runtime/tauri-invoke";

interface TauriCommandRuntimeOptions {
  loadInvoke?: () => Promise<TauriInvoke>;
}

export class TauriCommandRuntime implements DesktopRuntime {
  private invokePromise: Promise<TauriInvoke> | null = null;
  private readonly loadInvoke: () => Promise<TauriInvoke>;

  constructor(options: TauriCommandRuntimeOptions = {}) {
    this.loadInvoke = options.loadInvoke ?? loadTauriInvoke;
  }

  getBackendLiveness() {
    return this.invokeCommand("desktop_get_backend_liveness");
  }

  getBackendReadiness() {
    return this.invokeCommand("desktop_get_backend_readiness");
  }

  getDiagnosticsSnapshot() {
    return this.invokeCommand("desktop_get_diagnostics_snapshot");
  }

  getThemePreference() {
    return this.invokeCommand("desktop_get_theme_preference");
  }

  setThemePreference(mode: ThemeMode) {
    return this.invokeCommand("desktop_set_theme_preference", { mode });
  }

  private getInvoke() {
    this.invokePromise ??= this.loadInvoke();
    return this.invokePromise;
  }

  private async invokeCommand<K extends DesktopCommandName>(
    command: K,
    payload?: DesktopCommandPayloadMap[K],
  ): Promise<DesktopCommandResultMap[K]> {
    try {
      const invoke = await this.getInvoke();
      return await invoke<DesktopCommandResultMap[K]>(
        command,
        payload as Record<string, unknown> | undefined,
      );
    } catch (error) {
      throw normalizeCommandError(error);
    }
  }
}
