import type { ReactElement } from "react";
import { Navigate, createHashRouter } from "react-router-dom";

import { AppShell } from "@/app/layout/app-shell";
import {
  desktopV3RouteDefinitions,
  desktopV3RoutePathById,
  resolveDesktopV3InitialRoute,
  type DesktopV3RouteId,
} from "@/app/router/route-registry";
import { DashboardPage } from "@/pages/dashboard-page";
import { DiagnosticsPage } from "@/pages/diagnostics-page";
import { PreferencesPage } from "@/pages/preferences-page";

function getRouteElement(routeId: DesktopV3RouteId) {
  const routeElementById: Record<DesktopV3RouteId, ReactElement> = {
    dashboard: <DashboardPage />,
    diagnostics: <DiagnosticsPage />,
    preferences: <PreferencesPage />,
  };

  return routeElementById[routeId];
}

const dashboardRoute = desktopV3RouteDefinitions.find(
  (route) => route.href === desktopV3RoutePathById.dashboard,
)!;
const initialRoute = resolveDesktopV3InitialRoute();
const initialRouteElement =
  initialRoute === dashboardRoute.href
    ? getRouteElement(dashboardRoute.id)
    : <Navigate replace to={initialRoute} />;

export const appRouter = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    handle: dashboardRoute.handle,
    children: [
      {
        index: true,
        element: initialRouteElement,
        handle: dashboardRoute.handle,
      },
      ...desktopV3RouteDefinitions
        .filter((route) => route.href !== dashboardRoute.href)
        .map((route) => ({
          path: route.href.slice(1),
          element: getRouteElement(route.id),
          handle: route.handle,
        })),
    ],
  },
]);
