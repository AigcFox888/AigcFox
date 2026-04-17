import { Navigate, createHashRouter } from "react-router-dom";

import { AppShell } from "@/app/layout/app-shell";
import { resolveDesktopV3InitialRoute } from "@/app/router/initial-route";
import type { AppRouteHandle } from "@/app/router/route-handle";
import { DashboardPage } from "@/pages/dashboard-page";
import { DiagnosticsPage } from "@/pages/diagnostics-page";
import { PreferencesPage } from "@/pages/preferences-page";

const dashboardHandle: AppRouteHandle = {
  title: "桌面骨架总览",
  subtitle: "只保留 Wave 1 skeleton 的布局、命令边界与运行态入口。",
  shortLabel: "总览",
};

const diagnosticsHandle: AppRouteHandle = {
  title: "运行诊断",
  subtitle: "观察本地 runtime、SQLite baseline 与远端健康探针的最小链路。",
  shortLabel: "诊断",
};

const preferencesHandle: AppRouteHandle = {
  title: "本地偏好",
  subtitle: "当前只开放受控主题偏好，不把敏感配置留在 renderer。",
  shortLabel: "偏好",
};

const initialRoute = resolveDesktopV3InitialRoute();
const initialRouteElement =
  initialRoute === "/" ? <DashboardPage /> : <Navigate replace to={initialRoute} />;

export const appRouter = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    handle: dashboardHandle,
    children: [
      {
        index: true,
        element: initialRouteElement,
        handle: dashboardHandle,
      },
      {
        path: "diagnostics",
        element: <DiagnosticsPage />,
        handle: diagnosticsHandle,
      },
      {
        path: "preferences",
        element: <PreferencesPage />,
        handle: preferencesHandle,
      },
    ],
  },
]);
