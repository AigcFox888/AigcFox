import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3AppShellGovernanceFailureMessage,
  collectDesktopV3AppShellGovernanceViolations,
  collectTypeScriptCreateHashRouterPathSurface,
  collectTypeScriptInterfaceProperties,
  collectTypeScriptModuleReferenceEntries,
  collectTypeScriptObjectArrayPropertyInitializerTexts,
  collectTypeScriptObjectPropertyStringValues,
  collectTypeScriptRouteRegistryNavigationHrefBindings,
  collectTypeScriptTopLevelDeclarations,
  collectTypeScriptTypeAliasUnionValues,
  createDesktopV3AppShellGovernanceSummary,
  resolveDesktopV3AppShellGovernanceConfig,
  rootDir,
} from "./desktop-v3-app-shell-governance.mjs";
import {
  buildDesktopV3ResponsiveSmokeRoutes,
  collectDesktopV3RoutePathEntriesFromSource,
} from "./desktop-v3-route-truth.mjs";

describe("desktop-v3 app shell governance helpers", () => {
  it("collects route path surface from createHashRouter", () => {
    const sourceText = [
      'const appRouter = createHashRouter([{ path: "/", children: [{ index: true }, { path: "diagnostics" }, { path: "preferences" }] }]);',
    ].join("\n");

    expect(
      collectTypeScriptCreateHashRouterPathSurface(
        sourceText,
        path.join(rootDir, "apps/desktop-v3/src/app/router/routes.tsx"),
      ),
    ).toEqual(["index:/", "path:/", "path:/diagnostics", "path:/preferences"]);
  });

  it("collects route-registry initializer texts, path values, and optional interface properties", () => {
    const routeRegistrySource = [
      "interface DesktopV3NavigationItem {",
      "  href: DesktopV3RoutePath;",
      "  label: string;",
      "}",
      "",
      'const desktopV3RoutePathById = { dashboard: "/", diagnostics: "/diagnostics", preferences: "/preferences" } as const;',
      "const desktopV3RouteDefinitions = [",
      '  { navigation: { group: "primary", href: desktopV3RoutePathById.dashboard } },',
      '  { navigation: { group: "primary", href: desktopV3RoutePathById.diagnostics } },',
      '  { navigation: { group: "secondary", href: desktopV3RoutePathById.preferences } },',
      "];",
      "",
      "const quickLinks = [",
      "  { href: desktopV3RoutePathById.diagnostics },",
      "  { href: desktopV3RoutePathById.preferences },",
      "];",
    ].join("\n");
    const headerSource = [
      "interface PageHeaderProps {",
      "  actions?: ReactNode;",
      "  title: string;",
      "}",
    ].join("\n");

    expect(
      collectTypeScriptObjectArrayPropertyInitializerTexts(
        routeRegistrySource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
        "quickLinks",
        ["href"],
      ),
    ).toEqual(["desktopV3RoutePathById.diagnostics", "desktopV3RoutePathById.preferences"]);
    expect(
      collectTypeScriptObjectPropertyStringValues(
        routeRegistrySource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
        "desktopV3RoutePathById",
      ),
    ).toEqual(["/", "/diagnostics", "/preferences"]);
    expect(
      collectTypeScriptRouteRegistryNavigationHrefBindings(
        routeRegistrySource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
        "primary",
      ),
    ).toEqual(["desktopV3RoutePathById.dashboard", "desktopV3RoutePathById.diagnostics"]);
    expect(
      collectTypeScriptInterfaceProperties(
        headerSource,
        path.join(rootDir, "apps/desktop-v3/src/app/layout/page-header.tsx"),
        "PageHeaderProps",
        { rootDir },
      ),
    ).toEqual([
      {
        filePath: "apps/desktop-v3/src/app/layout/page-header.tsx",
        line: 2,
        name: "actions?",
        typeText: "ReactNode",
      },
      {
        filePath: "apps/desktop-v3/src/app/layout/page-header.tsx",
        line: 3,
        name: "title",
        typeText: "string",
      },
    ]);
    expect(
      collectDesktopV3RoutePathEntriesFromSource(
        routeRegistrySource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
      ),
    ).toEqual([
      { id: "dashboard", path: "/" },
      { id: "diagnostics", path: "/diagnostics" },
      { id: "preferences", path: "/preferences" },
    ]);
    expect(
      buildDesktopV3ResponsiveSmokeRoutes(
        collectDesktopV3RoutePathEntriesFromSource(
          routeRegistrySource,
          path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
        ),
      ),
    ).toEqual([
      {
        hash: "#/",
        href: "/#/",
        key: "dashboard",
        testId: "desktop-v3-dashboard-page",
      },
      {
        hash: "#/diagnostics",
        href: "/#/diagnostics",
        key: "diagnostics",
        testId: "desktop-v3-diagnostics-page",
      },
      {
        hash: "#/preferences",
        href: "/#/preferences",
        key: "preferences",
        testId: "desktop-v3-preferences-page",
      },
    ]);
  });

  it("collects union values and top-level re-exports", () => {
    const initialRouteSource = [
      'export type DesktopV3InitialRoute = "/" | "/diagnostics" | "/preferences";',
      "const allowedInitialRoutes = new Set();",
      "function normalizeInitialRoute() {}",
      "export function resolveDesktopV3InitialRoute() {}",
    ].join("\n");
    const routerIndexSource = 'export { appRouter } from "@/app/router/routes";';

    expect(
      collectTypeScriptTypeAliasUnionValues(
        initialRouteSource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/route-registry.ts"),
        "DesktopV3InitialRoute",
      ),
    ).toEqual(["/", "/diagnostics", "/preferences"]);
    expect(
      collectTypeScriptTopLevelDeclarations(
        routerIndexSource,
        path.join(rootDir, "apps/desktop-v3/src/app/router/index.tsx"),
        { rootDir },
      ),
    ).toEqual([
      {
        filePath: "apps/desktop-v3/src/app/router/index.tsx",
        kind: "re-export",
        line: 1,
        name: "appRouter",
      },
    ]);
  });

  it("resolves ownership edges to the real TSX app shell files", () => {
    const sourceText = [
      'import { App } from "@/app/App";',
      'export { appRouter } from "@/app/router";',
      'import { AppShell } from "@/app/layout/app-shell";',
    ].join("\n");

    expect(
      collectTypeScriptModuleReferenceEntries(
        sourceText,
        path.join(rootDir, "apps/desktop-v3/src/main.tsx"),
        { rootDir },
      ).map((entry) => entry.resolvedFilePath),
    ).toEqual([
      "apps/desktop-v3/src/app/App.tsx",
      "apps/desktop-v3/src/app/router/index.tsx",
      "apps/desktop-v3/src/app/layout/app-shell.tsx",
    ]);
  });
});

describe("desktop-v3 app shell governance", () => {
  it("resolves config paths and frozen surfaces for the current workspace", () => {
    const config = resolveDesktopV3AppShellGovernanceConfig({
      now: new Date("2026-04-18T10:11:12.131Z"),
    });

    expect(config.outputDir).toContain("desktop-v3-app-shell-governance-2026-04-18T10-11-12-131Z");
    expect(config.appDir).toBe(path.join(rootDir, "apps/desktop-v3/src/app"));
    expect(config.sourceDir).toBe(path.join(rootDir, "apps/desktop-v3/src"));
    expect(config.allowedAppShellFiles).toEqual(
      expect.arrayContaining([
        "apps/desktop-v3/src/app/App.tsx",
        "apps/desktop-v3/src/app/router/routes.tsx",
      ]),
    );
    expect(config.latestSummaryPath).toBe(
      path.join(rootDir, "output", "verification", "latest", "desktop-v3-app-shell-governance-summary.json"),
    );
  });

  it("passes against the frozen workspace app shell boundary", async () => {
    const config = resolveDesktopV3AppShellGovernanceConfig();
    const result = await collectDesktopV3AppShellGovernanceViolations(config);

    expect(result.appFiles).toEqual(config.allowedAppShellFiles);
    expect(result.appSurface).toEqual(config.allowedAppSurface);
    expect(result.rendererReadySurface).toEqual(config.allowedRendererReadySurface);
    expect(result.rendererReadyOptionProperties).toEqual(config.allowedRendererReadyOptionProperties);
    expect(result.appShellSurface).toEqual(config.allowedAppShellSurface);
    expect(result.routeRegistrySurface).toEqual(config.allowedRouteRegistrySurface);
    expect(result.navigationItemProperties).toEqual(config.allowedNavigationItemProperties);
    expect(result.routeRegistryPathValues).toEqual(config.allowedRouteRegistryPathValues);
    expect(result.primaryNavigationHrefBindings).toEqual(config.allowedPrimaryNavigationHrefBindings);
    expect(result.secondaryNavigationHrefBindings).toEqual(config.allowedSecondaryNavigationHrefBindings);
    expect(result.pageHeaderSurface).toEqual(config.allowedPageHeaderSurface);
    expect(result.pageHeaderProperties).toEqual(config.allowedPageHeaderProperties);
    expect(result.shellScaffoldSurface).toEqual(config.allowedShellScaffoldSurface);
    expect(result.shellScaffoldProperties).toEqual(config.allowedShellScaffoldProperties);
    expect(result.layoutModeValues).toEqual(config.allowedLayoutModeValues);
    expect(result.sidebarSurface).toEqual(config.allowedSidebarSurface);
    expect(result.sidebarProperties).toEqual(config.allowedSidebarProperties);
    expect(result.appProvidersSurface).toEqual(config.allowedAppProvidersSurface);
    expect(result.appProvidersProperties).toEqual(config.allowedAppProvidersProperties);
    expect(result.themeProviderSurface).toEqual(config.allowedThemeProviderSurface);
    expect(result.themeProviderProperties).toEqual(config.allowedThemeProviderProperties);
    expect(result.routerIndexSurface).toEqual(config.allowedRouterIndexSurface);
    expect(result.initialRouteValues).toEqual(config.allowedInitialRouteValues);
    expect(result.routeHandleProperties).toEqual(config.allowedRouteHandleProperties);
    expect(result.routesSurface).toEqual(config.allowedRoutesSurface);
    expect(result.appReferenceFiles).toEqual(config.allowedAppExternalReferenceFiles);
    expect(result.rendererReadyReferenceFiles).toEqual(config.allowedRendererReadyExternalReferenceFiles);
    expect(result.appShellReferenceFiles).toEqual(config.allowedAppShellExternalReferenceFiles);
    expect(result.routeRegistryReferenceFiles).toEqual(config.allowedRouteRegistryExternalReferenceFiles);
    expect(result.pageHeaderReferenceFiles).toEqual(config.allowedPageHeaderExternalReferenceFiles);
    expect(result.shellScaffoldReferenceFiles).toEqual(config.allowedShellScaffoldExternalReferenceFiles);
    expect(result.sidebarReferenceFiles).toEqual(config.allowedSidebarExternalReferenceFiles);
    expect(result.appProvidersReferenceFiles).toEqual(config.allowedAppProvidersExternalReferenceFiles);
    expect(result.themeProviderReferenceFiles).toEqual(config.allowedThemeProviderExternalReferenceFiles);
    expect(result.routerIndexReferenceFiles).toEqual(config.allowedRouterIndexExternalReferenceFiles);
    expect(result.routesReferenceFiles).toEqual(config.allowedRoutesExternalReferenceFiles);
    expect(result.violations).toEqual([]);
  }, 15000);

  it("fails closed when a frozen ownership edge drifts", async () => {
    const baseConfig = resolveDesktopV3AppShellGovernanceConfig();
    const config = {
      ...baseConfig,
      allowedPageHeaderExternalReferenceFiles: [],
    };

    const result = await collectDesktopV3AppShellGovernanceViolations(config);

    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/app/layout/app-shell.tsx",
          kind: "page-header-external-reference",
        }),
      ]),
    );
  }, 15000);

  it("creates a summary shell and formats failure previews", () => {
    const config = resolveDesktopV3AppShellGovernanceConfig({
      rootDir: "/repo",
      now: new Date("2026-04-18T10:11:12.131Z"),
    });
    const summary = createDesktopV3AppShellGovernanceSummary(config);

    expect(summary.status).toBe("running");
    expect(summary.allowedAppShellFiles).toEqual(config.allowedAppShellFiles);
    expect(summary.latestSummaryPath).toBe("/repo/output/verification/latest/desktop-v3-app-shell-governance-summary.json");

    summary.status = "failed";
    summary.violationCount = 1;
    summary.summaryPath = "/tmp/app-shell-governance/summary.json";
    summary.violations = [
      {
        column: 7,
        detail: "page-header escaped the frozen Wave 1 header ownership boundary.",
        filePath: "apps/desktop-v3/src/app/layout/app-shell.tsx",
        kind: "page-header-external-reference",
        line: 4,
      },
    ];

    expect(buildDesktopV3AppShellGovernanceFailureMessage(summary)).toBe(
      [
        "desktop-v3 app shell governance check failed with 1 violation(s).",
        "- apps/desktop-v3/src/app/layout/app-shell.tsx:4:7 [page-header-external-reference] page-header escaped the frozen Wave 1 header ownership boundary.",
        "Summary: /tmp/app-shell-governance/summary.json",
      ].join("\n"),
    );
  });
});
