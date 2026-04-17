export type DesktopV3InitialRoute = "/" | "/diagnostics" | "/preferences";

const allowedInitialRoutes = new Set<DesktopV3InitialRoute>([
  "/",
  "/diagnostics",
  "/preferences",
]);

function normalizeInitialRoute(rawValue: string | undefined): string {
  const trimmedValue = rawValue?.trim();

  if (!trimmedValue) {
    return "/";
  }

  return trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`;
}

export function resolveDesktopV3InitialRoute(
  rawValue = import.meta.env.VITE_DESKTOP_V3_INITIAL_ROUTE,
): DesktopV3InitialRoute {
  const normalizedValue = normalizeInitialRoute(rawValue);

  if (allowedInitialRoutes.has(normalizedValue as DesktopV3InitialRoute)) {
    return normalizedValue as DesktopV3InitialRoute;
  }

  return "/";
}
