export type DesktopRuntimeMode = "mock" | "tauri";

interface ResolveDesktopRuntimeModeOptions {
  isTestEnvironment?: boolean;
  rawMode?: string;
}

function isDesktopRuntimeMode(value: string): value is DesktopRuntimeMode {
  return value === "mock" || value === "tauri";
}

export function normalizeDesktopRuntimeMode(
  rawMode: string | undefined,
): DesktopRuntimeMode | null {
  const normalizedMode = rawMode?.trim().toLowerCase();

  if (!normalizedMode || normalizedMode === "auto") {
    return null;
  }

  return isDesktopRuntimeMode(normalizedMode) ? normalizedMode : null;
}

function detectTestEnvironment() {
  return Boolean(import.meta.env.MODE === "test" || import.meta.env.VITEST);
}

export function resolveDesktopRuntimeMode(
  options: ResolveDesktopRuntimeModeOptions = {},
): DesktopRuntimeMode {
  const explicitMode = normalizeDesktopRuntimeMode(
    options.rawMode ?? import.meta.env.VITE_DESKTOP_V3_RUNTIME_MODE,
  );

  if (explicitMode) {
    return explicitMode;
  }

  return (options.isTestEnvironment ?? detectTestEnvironment()) ? "mock" : "tauri";
}
