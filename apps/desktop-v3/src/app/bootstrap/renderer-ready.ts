import type { TauriInvoke } from "@/lib/runtime/tauri-invoke";
import { loadTauriInvoke } from "@/lib/runtime/tauri-bridge";
import { resolveDesktopRuntimeMode } from "@/lib/runtime/runtime-mode";

interface ReportDesktopV3RendererReadyOptions {
  beaconPath?: string;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
  invokeImpl?: TauriInvoke;
  route?: string;
  runtimeMode?: string;
  schedule?: (callback: () => void) => void;
  stage?: "app" | "document";
}

export function buildDesktopV3RendererBootBeaconUrl(
  route: string,
  runtimeMode: string,
  stage: "app" | "document" = "app",
  beaconPath = "/__desktop_v3_boot",
) {
  const searchParams = new URLSearchParams({
    route,
    runtime: runtimeMode,
    stage,
  });

  return `${beaconPath}?${searchParams.toString()}`;
}

function shouldReportDesktopV3RendererReady(enabled = import.meta.env.DEV) {
  if (typeof enabled === "boolean") {
    return enabled;
  }

  return import.meta.env.DEV && import.meta.env.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE === "1";
}

async function reportDesktopV3RendererReadyWithTauri(
  invokeImpl: TauriInvoke | undefined,
  payload: {
    route: string;
    runtime: string;
    stage: "app" | "document";
  },
) {
  const invoke = invokeImpl ?? (await loadTauriInvoke());
  await invoke("desktop_report_renderer_boot", payload);
}

export function reportDesktopV3RendererReady(
  options: ReportDesktopV3RendererReadyOptions = {},
) {
  if (typeof window === "undefined") {
    return false;
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const runtimeMode =
    options.runtimeMode ??
    resolveDesktopRuntimeMode({
      isTestEnvironment: false,
    });
  const route = (options.route ?? window.location.hash) || "#/";
  const stage = options.stage ?? "app";
  const beaconUrl = buildDesktopV3RendererBootBeaconUrl(
    route,
    runtimeMode,
    stage,
    options.beaconPath,
  );
  const schedule =
    options.schedule ??
    ((callback: () => void) => {
      window.requestAnimationFrame(callback);
    });

  schedule(() => {
    void (async () => {
      if (runtimeMode === "tauri") {
        try {
          await reportDesktopV3RendererReadyWithTauri(options.invokeImpl, {
            route,
            runtime: runtimeMode,
            stage,
          });
          return;
        } catch {
          // Fall through to the dev-only HTTP beacon when Tauri IPC is still unavailable.
        }
      }

      if (
        !shouldReportDesktopV3RendererReady(options.enabled) ||
        typeof fetchImpl !== "function"
      ) {
        return;
      }

      await fetchImpl(beaconUrl, {
        cache: "no-store",
        credentials: "omit",
        method: "GET",
      });
    })();
  });

  return true;
}
