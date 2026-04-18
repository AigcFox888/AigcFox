import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  collectTypeScriptFunctionCallArgumentTexts,
  collectTypeScriptInterfaceProperties,
  collectTypeScriptObjectArrayPropertyInitializerTexts,
  collectTypeScriptModuleReferenceEntries,
  collectTypeScriptObjectArrayPropertyValues,
  collectTypeScriptTopLevelDeclarations,
  collectTypeScriptTypeAliasUnionValues,
  desktopV3SourceDir,
  listDesktopV3SourceFiles,
  rootDir,
} from "./desktop-v3-app-shell-governance.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

export { rootDir };

export const desktopV3PresentationScopePrefixes = Object.freeze([
  "apps/desktop-v3/src/pages/",
  "apps/desktop-v3/src/components/navigation/",
  "apps/desktop-v3/src/components/states/",
  "apps/desktop-v3/src/hooks/",
]);
export const desktopV3PresentationFileSet = Object.freeze([
  "apps/desktop-v3/src/components/navigation/nav-item.tsx",
  "apps/desktop-v3/src/components/states/empty-state.tsx",
  "apps/desktop-v3/src/components/states/error-state.tsx",
  "apps/desktop-v3/src/components/states/loading-state.tsx",
  "apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts",
  "apps/desktop-v3/src/hooks/use-shell-layout.ts",
  "apps/desktop-v3/src/pages/dashboard-page.tsx",
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);

export const desktopV3AllowedDashboardPageSurface = Object.freeze([
  "const:highlights",
  "const:quickLinks",
  "fn:DashboardPage",
]);
export const desktopV3AllowedDashboardQuickLinkBindings = Object.freeze([
  "desktopV3RoutePathById.diagnostics",
  "desktopV3RoutePathById.preferences",
]);
export const desktopV3AllowedDiagnosticsPageSurface = Object.freeze([
  "const:diagnosticsOverviewQueryKey",
  "fn:DiagnosticsCard",
  "fn:DiagnosticsPage",
]);
export const desktopV3AllowedPreferencesPageSurface = Object.freeze([
  "const:themeOptions",
  "fn:PreferencesPage",
]);
export const desktopV3AllowedPreferencesThemeValues = Object.freeze([
  "dark",
  "light",
  "system",
]);
export const desktopV3AllowedNavItemSurface = Object.freeze([
  "fn:NavItem",
  "interface:NavItemProps",
]);
export const desktopV3AllowedNavItemProperties = Object.freeze([
  "compact: boolean",
  "description: string",
  "href: string",
  "icon: LucideIcon",
  "label: string",
]);
export const desktopV3AllowedEmptyStateSurface = Object.freeze([
  "fn:EmptyState",
  "interface:EmptyStateProps",
]);
export const desktopV3AllowedEmptyStateProperties = Object.freeze([
  "action?: { label: string; onClick: () => void; }",
  "description?: string",
  "message: string",
]);
export const desktopV3AllowedErrorStateSurface = Object.freeze([
  "fn:ErrorState",
  "interface:ErrorStateProps",
]);
export const desktopV3AllowedErrorStateProperties = Object.freeze([
  "description: string",
  "onRetry?: () => void",
  "supportDetails?: ErrorSupportDetail[]",
  "title: string",
]);
export const desktopV3AllowedLoadingStateSurface = Object.freeze([
  "fn:LoadingState",
  "interface:LoadingStateProps",
]);
export const desktopV3AllowedLoadingStateProperties = Object.freeze([
  "description: string",
  "title: string",
]);
export const desktopV3AllowedKeyboardShortcutsSurface = Object.freeze([
  "fn:isEditableElement",
  "fn:useKeyboardShortcuts",
]);
export const desktopV3AllowedKeyboardShortcutNavigationTargets = Object.freeze([
  "desktopV3RoutePathById.preferences",
]);
export const desktopV3AllowedShellLayoutSurface = Object.freeze([
  "fn:getLayoutState",
  "fn:useShellLayout",
  "interface:ShellLayoutState",
  "type:LayoutMode",
]);
export const desktopV3AllowedShellLayoutProperties = Object.freeze([
  "isCompact: boolean",
  "layoutMode: LayoutMode",
  "sidebarWidth: number",
]);
export const desktopV3AllowedShellLayoutModeValues = Object.freeze([
  "centered",
  "compact",
  "standard",
]);

export const desktopV3AllowedDashboardPageExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedDiagnosticsPageExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedPreferencesPageExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedNavItemExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/sidebar.tsx",
]);
export const desktopV3AllowedEmptyStateExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedErrorStateExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedLoadingStateExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedKeyboardShortcutsExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
]);
export const desktopV3AllowedShellLayoutExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_PAGE_GOVERNANCE_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

function normalizeWorkspaceRelativePath(workspaceRoot, absolutePath) {
  return path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, "/");
}

function sortStrings(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sortViolations(violations) {
  return [...violations].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    if (left.column !== right.column) {
      return left.column - right.column;
    }

    return left.kind.localeCompare(right.kind);
  });
}

function addViolation(violations, seenViolations, violation) {
  const key = [
    violation.filePath,
    violation.line,
    violation.column,
    violation.kind,
    violation.detail,
  ].join(":");

  if (seenViolations.has(key)) {
    return;
  }

  seenViolations.add(key);
  violations.push(violation);
}

function compareStringSets(actualValues, expectedValues) {
  return JSON.stringify(sortStrings(actualValues)) === JSON.stringify(sortStrings(expectedValues));
}

function addSurfaceDriftViolation({
  actualSurface,
  detail,
  entries,
  expectedSurface,
  filePath,
  kind,
  violations,
  seenViolations,
}) {
  if (compareStringSets(actualSurface, expectedSurface)) {
    return;
  }

  addViolation(violations, seenViolations, {
    column: 1,
    detail,
    filePath,
    kind,
    line: entries[0]?.line ?? 1,
  });
}

function formatDeclarationSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.kind}:${entry.name}`));
}

function formatPropertySurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.name}: ${entry.typeText}`));
}

function collectReferenceEntries({
  config,
  filePaths,
  readSourceText,
  selfFilePath,
}) {
  const references = [];

  return Promise.all(
    filePaths.map(async (absoluteFilePath) => {
      const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);

      if (filePath === selfFilePath) {
        return;
      }

      const sourceText = await readSourceText(absoluteFilePath);
      const moduleReferences = collectTypeScriptModuleReferenceEntries(
        sourceText,
        absoluteFilePath,
        { rootDir: config.rootDir },
      );

      for (const reference of moduleReferences) {
        if (reference.resolvedFilePath === selfFilePath) {
          references.push(reference);
        }
      }
    }),
  ).then(() =>
    references.sort((left, right) => {
      const fileCompare = left.filePath.localeCompare(right.filePath);

      if (fileCompare !== 0) {
        return fileCompare;
      }

      if (left.line !== right.line) {
        return left.line - right.line;
      }

      return left.column - right.column;
    }));
}

function addExternalReferenceViolations({
  actualReferenceEntries,
  allowedExternalReferenceFiles,
  detail,
  kind,
  seenViolations,
  violations,
}) {
  const actualReferenceFiles = sortStrings(new Set(actualReferenceEntries.map((entry) => entry.filePath)));

  for (const reference of actualReferenceEntries) {
    if (allowedExternalReferenceFiles.includes(reference.filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: reference.column,
      detail,
      filePath: reference.filePath,
      kind,
      line: reference.line,
    });
  }

  for (const expectedFilePath of allowedExternalReferenceFiles) {
    if (actualReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; rewrite the page boundary before changing this ownership edge.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }
}

export async function collectDesktopV3PageGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const sourceFilePaths = Array.isArray(options.sourceFilePaths)
    ? options.sourceFilePaths
    : await listDesktopV3SourceFiles(config, options);
  const violations = [];
  const seenViolations = new Set();
  const sourceTextByAbsolutePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByAbsolutePath.has(filePath)) {
      const sourceText = await readFileImpl(filePath, "utf8");
      sourceTextByAbsolutePath.set(filePath, sourceText);
    }

    return sourceTextByAbsolutePath.get(filePath);
  }

  const scannedFiles = sortStrings(
    new Set(sourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath))),
  );
  const presentationFiles = scannedFiles.filter((filePath) =>
    config.presentationScopePrefixes.some((prefix) => filePath.startsWith(prefix)));

  addSurfaceDriftViolation({
    actualSurface: presentationFiles,
    detail: `renderer page/presentation file set drifted from the frozen Wave 1 boundary (${config.allowedPresentationFiles.join(", ")}). Rewrite the page shell boundary before splitting or adding files here.`,
    entries: presentationFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedPresentationFiles,
    filePath: "apps/desktop-v3/src/pages",
    kind: "page-file-set-drift",
    violations,
    seenViolations,
  });

  const dashboardPageSource = await readSourceText(config.dashboardPageFilePath);
  const diagnosticsPageSource = await readSourceText(config.diagnosticsPageFilePath);
  const preferencesPageSource = await readSourceText(config.preferencesPageFilePath);
  const navItemSource = await readSourceText(config.navItemFilePath);
  const emptyStateSource = await readSourceText(config.emptyStateFilePath);
  const errorStateSource = await readSourceText(config.errorStateFilePath);
  const loadingStateSource = await readSourceText(config.loadingStateFilePath);
  const keyboardShortcutsSource = await readSourceText(config.keyboardShortcutsFilePath);
  const shellLayoutSource = await readSourceText(config.shellLayoutFilePath);
  const dashboardPageFile = normalizeWorkspaceRelativePath(config.rootDir, config.dashboardPageFilePath);
  const diagnosticsPageFile = normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsPageFilePath);
  const preferencesPageFile = normalizeWorkspaceRelativePath(config.rootDir, config.preferencesPageFilePath);
  const navItemFile = normalizeWorkspaceRelativePath(config.rootDir, config.navItemFilePath);
  const emptyStateFile = normalizeWorkspaceRelativePath(config.rootDir, config.emptyStateFilePath);
  const errorStateFile = normalizeWorkspaceRelativePath(config.rootDir, config.errorStateFilePath);
  const loadingStateFile = normalizeWorkspaceRelativePath(config.rootDir, config.loadingStateFilePath);
  const keyboardShortcutsFile = normalizeWorkspaceRelativePath(config.rootDir, config.keyboardShortcutsFilePath);
  const shellLayoutFile = normalizeWorkspaceRelativePath(config.rootDir, config.shellLayoutFilePath);

  const dashboardPageDeclarations = collectTypeScriptTopLevelDeclarations(
    dashboardPageSource,
    config.dashboardPageFilePath,
    { rootDir: config.rootDir },
  );
  const dashboardPageSurface = formatDeclarationSurface(dashboardPageDeclarations);
  const dashboardQuickLinkBindings = collectTypeScriptObjectArrayPropertyInitializerTexts(
    dashboardPageSource,
    config.dashboardPageFilePath,
    "quickLinks",
    ["href"],
  );

  const diagnosticsPageDeclarations = collectTypeScriptTopLevelDeclarations(
    diagnosticsPageSource,
    config.diagnosticsPageFilePath,
    { rootDir: config.rootDir },
  );
  const diagnosticsPageSurface = formatDeclarationSurface(diagnosticsPageDeclarations);

  const preferencesPageDeclarations = collectTypeScriptTopLevelDeclarations(
    preferencesPageSource,
    config.preferencesPageFilePath,
    { rootDir: config.rootDir },
  );
  const preferencesPageSurface = formatDeclarationSurface(preferencesPageDeclarations);
  const preferencesThemeValues = collectTypeScriptObjectArrayPropertyValues(
    preferencesPageSource,
    config.preferencesPageFilePath,
    "themeOptions",
    "value",
  );

  const navItemDeclarations = collectTypeScriptTopLevelDeclarations(
    navItemSource,
    config.navItemFilePath,
    { rootDir: config.rootDir },
  );
  const navItemSurface = formatDeclarationSurface(navItemDeclarations);
  const navItemProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      navItemSource,
      config.navItemFilePath,
      "NavItemProps",
      { rootDir: config.rootDir },
    ),
  );

  const emptyStateDeclarations = collectTypeScriptTopLevelDeclarations(
    emptyStateSource,
    config.emptyStateFilePath,
    { rootDir: config.rootDir },
  );
  const emptyStateSurface = formatDeclarationSurface(emptyStateDeclarations);
  const emptyStateProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      emptyStateSource,
      config.emptyStateFilePath,
      "EmptyStateProps",
      { rootDir: config.rootDir },
    ),
  );

  const errorStateDeclarations = collectTypeScriptTopLevelDeclarations(
    errorStateSource,
    config.errorStateFilePath,
    { rootDir: config.rootDir },
  );
  const errorStateSurface = formatDeclarationSurface(errorStateDeclarations);
  const errorStateProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      errorStateSource,
      config.errorStateFilePath,
      "ErrorStateProps",
      { rootDir: config.rootDir },
    ),
  );

  const loadingStateDeclarations = collectTypeScriptTopLevelDeclarations(
    loadingStateSource,
    config.loadingStateFilePath,
    { rootDir: config.rootDir },
  );
  const loadingStateSurface = formatDeclarationSurface(loadingStateDeclarations);
  const loadingStateProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      loadingStateSource,
      config.loadingStateFilePath,
      "LoadingStateProps",
      { rootDir: config.rootDir },
    ),
  );

  const keyboardShortcutsDeclarations = collectTypeScriptTopLevelDeclarations(
    keyboardShortcutsSource,
    config.keyboardShortcutsFilePath,
    { rootDir: config.rootDir },
  );
  const keyboardShortcutsSurface = formatDeclarationSurface(keyboardShortcutsDeclarations);
  const keyboardShortcutNavigationTargets = collectTypeScriptFunctionCallArgumentTexts(
    keyboardShortcutsSource,
    config.keyboardShortcutsFilePath,
    "navigate",
  );

  const shellLayoutDeclarations = collectTypeScriptTopLevelDeclarations(
    shellLayoutSource,
    config.shellLayoutFilePath,
    { rootDir: config.rootDir },
  );
  const shellLayoutSurface = formatDeclarationSurface(shellLayoutDeclarations);
  const shellLayoutProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      shellLayoutSource,
      config.shellLayoutFilePath,
      "ShellLayoutState",
      { rootDir: config.rootDir },
    ),
  );
  const shellLayoutModeValues = collectTypeScriptTypeAliasUnionValues(
    shellLayoutSource,
    config.shellLayoutFilePath,
    "LayoutMode",
  );

  addSurfaceDriftViolation({
    actualSurface: dashboardPageSurface,
    detail: `dashboard-page drifted from the frozen Wave 1 page surface (${config.allowedDashboardPageSurface.join(", ")}). Rewrite dashboard composition before widening it.`,
    entries: dashboardPageDeclarations,
    expectedSurface: config.allowedDashboardPageSurface,
    filePath: dashboardPageFile,
    kind: "dashboard-page-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: dashboardQuickLinkBindings,
    detail: `dashboard quick-link bindings drifted from the frozen Wave 1 route registry contract (${config.allowedDashboardQuickLinkBindings.join(", ")}). Rewrite dashboard navigation before changing this page topology.`,
    entries: dashboardPageDeclarations,
    expectedSurface: config.allowedDashboardQuickLinkBindings,
    filePath: dashboardPageFile,
    kind: "dashboard-quick-link-binding-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: diagnosticsPageSurface,
    detail: `diagnostics-page drifted from the frozen Wave 1 page surface (${config.allowedDiagnosticsPageSurface.join(", ")}). Rewrite diagnostics page composition before widening it.`,
    entries: diagnosticsPageDeclarations,
    expectedSurface: config.allowedDiagnosticsPageSurface,
    filePath: diagnosticsPageFile,
    kind: "diagnostics-page-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: preferencesPageSurface,
    detail: `preferences-page drifted from the frozen Wave 1 page surface (${config.allowedPreferencesPageSurface.join(", ")}). Rewrite preferences page composition before widening it.`,
    entries: preferencesPageDeclarations,
    expectedSurface: config.allowedPreferencesPageSurface,
    filePath: preferencesPageFile,
    kind: "preferences-page-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: preferencesThemeValues,
    detail: `preferences theme option set drifted from the frozen Wave 1 theme page contract (${config.allowedPreferencesThemeValues.join(", ")}). Rewrite theme preference presentation before changing the available page modes.`,
    entries: preferencesPageDeclarations,
    expectedSurface: config.allowedPreferencesThemeValues,
    filePath: preferencesPageFile,
    kind: "preferences-theme-value-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: navItemSurface,
    detail: `nav-item drifted from the frozen Wave 1 navigation component surface (${config.allowedNavItemSurface.join(", ")}). Rewrite navigation presentation before widening it.`,
    entries: navItemDeclarations,
    expectedSurface: config.allowedNavItemSurface,
    filePath: navItemFile,
    kind: "nav-item-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: navItemProperties,
    detail: `NavItemProps drifted from the frozen Wave 1 navigation component contract (${config.allowedNavItemProperties.join(", ")}). Rewrite navigation presentation before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      navItemSource,
      config.navItemFilePath,
      "NavItemProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedNavItemProperties,
    filePath: navItemFile,
    kind: "nav-item-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: emptyStateSurface,
    detail: `empty-state drifted from the frozen Wave 1 state component surface (${config.allowedEmptyStateSurface.join(", ")}). Rewrite empty-state presentation before widening it.`,
    entries: emptyStateDeclarations,
    expectedSurface: config.allowedEmptyStateSurface,
    filePath: emptyStateFile,
    kind: "empty-state-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: emptyStateProperties,
    detail: `EmptyStateProps drifted from the frozen Wave 1 state component contract (${config.allowedEmptyStateProperties.join(", ")}). Rewrite empty-state presentation before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      emptyStateSource,
      config.emptyStateFilePath,
      "EmptyStateProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedEmptyStateProperties,
    filePath: emptyStateFile,
    kind: "empty-state-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: errorStateSurface,
    detail: `error-state drifted from the frozen Wave 1 state component surface (${config.allowedErrorStateSurface.join(", ")}). Rewrite error-state presentation before widening it.`,
    entries: errorStateDeclarations,
    expectedSurface: config.allowedErrorStateSurface,
    filePath: errorStateFile,
    kind: "error-state-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: errorStateProperties,
    detail: `ErrorStateProps drifted from the frozen Wave 1 state component contract (${config.allowedErrorStateProperties.join(", ")}). Rewrite error-state presentation before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      errorStateSource,
      config.errorStateFilePath,
      "ErrorStateProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedErrorStateProperties,
    filePath: errorStateFile,
    kind: "error-state-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: loadingStateSurface,
    detail: `loading-state drifted from the frozen Wave 1 state component surface (${config.allowedLoadingStateSurface.join(", ")}). Rewrite loading-state presentation before widening it.`,
    entries: loadingStateDeclarations,
    expectedSurface: config.allowedLoadingStateSurface,
    filePath: loadingStateFile,
    kind: "loading-state-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: loadingStateProperties,
    detail: `LoadingStateProps drifted from the frozen Wave 1 state component contract (${config.allowedLoadingStateProperties.join(", ")}). Rewrite loading-state presentation before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      loadingStateSource,
      config.loadingStateFilePath,
      "LoadingStateProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedLoadingStateProperties,
    filePath: loadingStateFile,
    kind: "loading-state-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: keyboardShortcutsSurface,
    detail: `use-keyboard-shortcuts drifted from the frozen Wave 1 shell hook surface (${config.allowedKeyboardShortcutsSurface.join(", ")}). Rewrite shell shortcut composition before widening it.`,
    entries: keyboardShortcutsDeclarations,
    expectedSurface: config.allowedKeyboardShortcutsSurface,
    filePath: keyboardShortcutsFile,
    kind: "keyboard-shortcuts-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: keyboardShortcutNavigationTargets,
    detail: `use-keyboard-shortcuts navigate targets drifted from the frozen Wave 1 route registry contract (${config.allowedKeyboardShortcutNavigationTargets.join(", ")}). Rewrite shell shortcut routing before changing shortcut navigation.`,
    entries: keyboardShortcutsDeclarations,
    expectedSurface: config.allowedKeyboardShortcutNavigationTargets,
    filePath: keyboardShortcutsFile,
    kind: "keyboard-shortcuts-navigation-target-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: shellLayoutSurface,
    detail: `use-shell-layout drifted from the frozen Wave 1 shell layout hook surface (${config.allowedShellLayoutSurface.join(", ")}). Rewrite layout state composition before widening it.`,
    entries: shellLayoutDeclarations,
    expectedSurface: config.allowedShellLayoutSurface,
    filePath: shellLayoutFile,
    kind: "shell-layout-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: shellLayoutProperties,
    detail: `ShellLayoutState drifted from the frozen Wave 1 shell layout contract (${config.allowedShellLayoutProperties.join(", ")}). Rewrite shell layout state before changing this hook contract.`,
    entries: collectTypeScriptInterfaceProperties(
      shellLayoutSource,
      config.shellLayoutFilePath,
      "ShellLayoutState",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedShellLayoutProperties,
    filePath: shellLayoutFile,
    kind: "shell-layout-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: shellLayoutModeValues,
    detail: `shell layout mode set drifted from the frozen Wave 1 layout mode contract (${config.allowedShellLayoutModeValues.join(", ")}). Rewrite shell layout behavior before changing these modes.`,
    entries: shellLayoutDeclarations,
    expectedSurface: config.allowedShellLayoutModeValues,
    filePath: shellLayoutFile,
    kind: "shell-layout-mode-drift",
    violations,
    seenViolations,
  });

  const dashboardPageReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: dashboardPageFile,
  });
  const diagnosticsPageReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: diagnosticsPageFile,
  });
  const preferencesPageReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: preferencesPageFile,
  });
  const navItemReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: navItemFile,
  });
  const emptyStateReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: emptyStateFile,
  });
  const errorStateReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: errorStateFile,
  });
  const loadingStateReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: loadingStateFile,
  });
  const keyboardShortcutsReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: keyboardShortcutsFile,
  });
  const shellLayoutReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: shellLayoutFile,
  });

  const dashboardPageReferenceFiles = sortStrings(new Set(dashboardPageReferenceEntries.map((entry) => entry.filePath)));
  const diagnosticsPageReferenceFiles = sortStrings(new Set(diagnosticsPageReferenceEntries.map((entry) => entry.filePath)));
  const preferencesPageReferenceFiles = sortStrings(new Set(preferencesPageReferenceEntries.map((entry) => entry.filePath)));
  const navItemReferenceFiles = sortStrings(new Set(navItemReferenceEntries.map((entry) => entry.filePath)));
  const emptyStateReferenceFiles = sortStrings(new Set(emptyStateReferenceEntries.map((entry) => entry.filePath)));
  const errorStateReferenceFiles = sortStrings(new Set(errorStateReferenceEntries.map((entry) => entry.filePath)));
  const loadingStateReferenceFiles = sortStrings(new Set(loadingStateReferenceEntries.map((entry) => entry.filePath)));
  const keyboardShortcutsReferenceFiles = sortStrings(new Set(keyboardShortcutsReferenceEntries.map((entry) => entry.filePath)));
  const shellLayoutReferenceFiles = sortStrings(new Set(shellLayoutReferenceEntries.map((entry) => entry.filePath)));

  addExternalReferenceViolations({
    actualReferenceEntries: dashboardPageReferenceEntries,
    allowedExternalReferenceFiles: config.allowedDashboardPageExternalReferenceFiles,
    detail: `dashboard-page escaped the frozen Wave 1 page ownership boundary. Only ${config.allowedDashboardPageExternalReferenceFiles.join(", ")} may hold DashboardPage directly.`,
    kind: "dashboard-page-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: diagnosticsPageReferenceEntries,
    allowedExternalReferenceFiles: config.allowedDiagnosticsPageExternalReferenceFiles,
    detail: `diagnostics-page escaped the frozen Wave 1 page ownership boundary. Only ${config.allowedDiagnosticsPageExternalReferenceFiles.join(", ")} may hold DiagnosticsPage directly.`,
    kind: "diagnostics-page-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: preferencesPageReferenceEntries,
    allowedExternalReferenceFiles: config.allowedPreferencesPageExternalReferenceFiles,
    detail: `preferences-page escaped the frozen Wave 1 page ownership boundary. Only ${config.allowedPreferencesPageExternalReferenceFiles.join(", ")} may hold PreferencesPage directly.`,
    kind: "preferences-page-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: navItemReferenceEntries,
    allowedExternalReferenceFiles: config.allowedNavItemExternalReferenceFiles,
    detail: `nav-item escaped the frozen Wave 1 navigation ownership boundary. Only ${config.allowedNavItemExternalReferenceFiles.join(", ")} may hold NavItem directly.`,
    kind: "nav-item-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: emptyStateReferenceEntries,
    allowedExternalReferenceFiles: config.allowedEmptyStateExternalReferenceFiles,
    detail: `empty-state escaped the frozen Wave 1 state component ownership boundary. Only ${config.allowedEmptyStateExternalReferenceFiles.join(", ")} may hold EmptyState directly.`,
    kind: "empty-state-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: errorStateReferenceEntries,
    allowedExternalReferenceFiles: config.allowedErrorStateExternalReferenceFiles,
    detail: `error-state escaped the frozen Wave 1 state component ownership boundary. Only ${config.allowedErrorStateExternalReferenceFiles.join(", ")} may hold ErrorState directly.`,
    kind: "error-state-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: loadingStateReferenceEntries,
    allowedExternalReferenceFiles: config.allowedLoadingStateExternalReferenceFiles,
    detail: `loading-state escaped the frozen Wave 1 state component ownership boundary. Only ${config.allowedLoadingStateExternalReferenceFiles.join(", ")} may hold LoadingState directly.`,
    kind: "loading-state-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: keyboardShortcutsReferenceEntries,
    allowedExternalReferenceFiles: config.allowedKeyboardShortcutsExternalReferenceFiles,
    detail: `use-keyboard-shortcuts escaped the frozen Wave 1 shell hook ownership boundary. Only ${config.allowedKeyboardShortcutsExternalReferenceFiles.join(", ")} may hold this hook directly.`,
    kind: "keyboard-shortcuts-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: shellLayoutReferenceEntries,
    allowedExternalReferenceFiles: config.allowedShellLayoutExternalReferenceFiles,
    detail: `use-shell-layout escaped the frozen Wave 1 shell hook ownership boundary. Only ${config.allowedShellLayoutExternalReferenceFiles.join(", ")} may hold this hook directly.`,
    kind: "shell-layout-external-reference",
    seenViolations,
    violations,
  });

  return {
    dashboardPageReferenceFiles,
    dashboardPageSurface,
    dashboardQuickLinkBindings,
    diagnosticsPageReferenceFiles,
    diagnosticsPageSurface,
    emptyStateProperties,
    emptyStateReferenceFiles,
    emptyStateSurface,
    errorStateProperties,
    errorStateReferenceFiles,
    errorStateSurface,
    keyboardShortcutNavigationTargets,
    keyboardShortcutsReferenceFiles,
    keyboardShortcutsSurface,
    loadingStateProperties,
    loadingStateReferenceFiles,
    loadingStateSurface,
    navItemProperties,
    navItemReferenceFiles,
    navItemSurface,
    preferencesPageReferenceFiles,
    preferencesPageSurface,
    preferencesThemeValues,
    presentationFiles,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    shellLayoutModeValues,
    shellLayoutProperties,
    shellLayoutReferenceFiles,
    shellLayoutSurface,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3PageGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedDashboardPageExternalReferenceFiles: [...config.allowedDashboardPageExternalReferenceFiles],
      allowedDashboardPageSurface: [...config.allowedDashboardPageSurface],
      allowedDashboardQuickLinkBindings: [...config.allowedDashboardQuickLinkBindings],
      allowedDiagnosticsPageExternalReferenceFiles: [...config.allowedDiagnosticsPageExternalReferenceFiles],
      allowedDiagnosticsPageSurface: [...config.allowedDiagnosticsPageSurface],
      allowedEmptyStateExternalReferenceFiles: [...config.allowedEmptyStateExternalReferenceFiles],
      allowedEmptyStateProperties: [...config.allowedEmptyStateProperties],
      allowedEmptyStateSurface: [...config.allowedEmptyStateSurface],
      allowedErrorStateExternalReferenceFiles: [...config.allowedErrorStateExternalReferenceFiles],
      allowedErrorStateProperties: [...config.allowedErrorStateProperties],
      allowedErrorStateSurface: [...config.allowedErrorStateSurface],
      allowedKeyboardShortcutNavigationTargets: [...config.allowedKeyboardShortcutNavigationTargets],
      allowedKeyboardShortcutsExternalReferenceFiles: [...config.allowedKeyboardShortcutsExternalReferenceFiles],
      allowedKeyboardShortcutsSurface: [...config.allowedKeyboardShortcutsSurface],
      allowedLoadingStateExternalReferenceFiles: [...config.allowedLoadingStateExternalReferenceFiles],
      allowedLoadingStateProperties: [...config.allowedLoadingStateProperties],
      allowedLoadingStateSurface: [...config.allowedLoadingStateSurface],
      allowedNavItemExternalReferenceFiles: [...config.allowedNavItemExternalReferenceFiles],
      allowedNavItemProperties: [...config.allowedNavItemProperties],
      allowedNavItemSurface: [...config.allowedNavItemSurface],
      allowedPreferencesPageExternalReferenceFiles: [...config.allowedPreferencesPageExternalReferenceFiles],
      allowedPreferencesPageSurface: [...config.allowedPreferencesPageSurface],
      allowedPreferencesThemeValues: [...config.allowedPreferencesThemeValues],
      allowedPresentationFiles: [...config.allowedPresentationFiles],
      allowedShellLayoutExternalReferenceFiles: [...config.allowedShellLayoutExternalReferenceFiles],
      allowedShellLayoutModeValues: [...config.allowedShellLayoutModeValues],
      allowedShellLayoutProperties: [...config.allowedShellLayoutProperties],
      allowedShellLayoutSurface: [...config.allowedShellLayoutSurface],
      dashboardPageReferenceFiles: [],
      dashboardPageSurface: [],
      dashboardQuickLinkBindings: [],
      diagnosticsPageReferenceFiles: [],
      diagnosticsPageSurface: [],
      emptyStateProperties: [],
      emptyStateReferenceFiles: [],
      emptyStateSurface: [],
      error: null,
      errorStateProperties: [],
      errorStateReferenceFiles: [],
      errorStateSurface: [],
      keyboardShortcutNavigationTargets: [],
      keyboardShortcutsReferenceFiles: [],
      keyboardShortcutsSurface: [],
      latestSummaryPath: config.latestSummaryPath,
      loadingStateProperties: [],
      loadingStateReferenceFiles: [],
      loadingStateSurface: [],
      navItemProperties: [],
      navItemReferenceFiles: [],
      navItemSurface: [],
      outputDir: config.outputDir,
      preferencesPageReferenceFiles: [],
      preferencesPageSurface: [],
      preferencesThemeValues: [],
      presentationFiles: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      shellLayoutModeValues: [],
      shellLayoutProperties: [],
      shellLayoutReferenceFiles: [],
      shellLayoutSurface: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3PageGovernanceFailureMessage(summary) {
  return [
    `desktop-v3 page governance check failed with ${summary.violationCount} violation(s).`,
    ...summary.violations.map((violation) =>
      `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`),
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3PageGovernanceConfig(options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_PAGE_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-page-governance-${runId}`);

  return {
    allowedDashboardPageExternalReferenceFiles: desktopV3AllowedDashboardPageExternalReferenceFiles,
    allowedDashboardPageSurface: desktopV3AllowedDashboardPageSurface,
    allowedDashboardQuickLinkBindings: desktopV3AllowedDashboardQuickLinkBindings,
    allowedDiagnosticsPageExternalReferenceFiles: desktopV3AllowedDiagnosticsPageExternalReferenceFiles,
    allowedDiagnosticsPageSurface: desktopV3AllowedDiagnosticsPageSurface,
    allowedEmptyStateExternalReferenceFiles: desktopV3AllowedEmptyStateExternalReferenceFiles,
    allowedEmptyStateProperties: desktopV3AllowedEmptyStateProperties,
    allowedEmptyStateSurface: desktopV3AllowedEmptyStateSurface,
    allowedErrorStateExternalReferenceFiles: desktopV3AllowedErrorStateExternalReferenceFiles,
    allowedErrorStateProperties: desktopV3AllowedErrorStateProperties,
    allowedErrorStateSurface: desktopV3AllowedErrorStateSurface,
    allowedKeyboardShortcutNavigationTargets: desktopV3AllowedKeyboardShortcutNavigationTargets,
    allowedKeyboardShortcutsExternalReferenceFiles: desktopV3AllowedKeyboardShortcutsExternalReferenceFiles,
    allowedKeyboardShortcutsSurface: desktopV3AllowedKeyboardShortcutsSurface,
    allowedLoadingStateExternalReferenceFiles: desktopV3AllowedLoadingStateExternalReferenceFiles,
    allowedLoadingStateProperties: desktopV3AllowedLoadingStateProperties,
    allowedLoadingStateSurface: desktopV3AllowedLoadingStateSurface,
    allowedNavItemExternalReferenceFiles: desktopV3AllowedNavItemExternalReferenceFiles,
    allowedNavItemProperties: desktopV3AllowedNavItemProperties,
    allowedNavItemSurface: desktopV3AllowedNavItemSurface,
    allowedPreferencesPageExternalReferenceFiles: desktopV3AllowedPreferencesPageExternalReferenceFiles,
    allowedPreferencesPageSurface: desktopV3AllowedPreferencesPageSurface,
    allowedPreferencesThemeValues: desktopV3AllowedPreferencesThemeValues,
    allowedPresentationFiles: desktopV3PresentationFileSet,
    allowedShellLayoutExternalReferenceFiles: desktopV3AllowedShellLayoutExternalReferenceFiles,
    allowedShellLayoutModeValues: desktopV3AllowedShellLayoutModeValues,
    allowedShellLayoutProperties: desktopV3AllowedShellLayoutProperties,
    allowedShellLayoutSurface: desktopV3AllowedShellLayoutSurface,
    dashboardPageFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/pages/dashboard-page.tsx"),
    diagnosticsPageFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/pages/diagnostics-page.tsx"),
    emptyStateFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/components/states/empty-state.tsx"),
    errorStateFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/components/states/error-state.tsx"),
    keyboardShortcutsFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts"),
    latestSummaryPath: resolveLatestVerificationSummaryPath(workspaceRoot, "desktop-v3-page-governance-summary.json"),
    loadingStateFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/components/states/loading-state.tsx"),
    navItemFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/components/navigation/nav-item.tsx"),
    outputDir,
    preferencesPageFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/pages/preferences-page.tsx"),
    presentationScopePrefixes: desktopV3PresentationScopePrefixes,
    rootDir: workspaceRoot,
    runId,
    shellLayoutFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/hooks/use-shell-layout.ts"),
    sourceDir: path.join(workspaceRoot, desktopV3SourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
