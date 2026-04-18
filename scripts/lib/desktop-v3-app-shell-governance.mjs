import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3SourceDir = "apps/desktop-v3/src";
export const desktopV3AppDir = "apps/desktop-v3/src/app";
export const desktopV3AppShellFileSet = Object.freeze([
  "apps/desktop-v3/src/app/App.tsx",
  "apps/desktop-v3/src/app/bootstrap/renderer-ready.ts",
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
  "apps/desktop-v3/src/app/layout/navigation-items.ts",
  "apps/desktop-v3/src/app/layout/page-header.tsx",
  "apps/desktop-v3/src/app/layout/shell-scaffold.tsx",
  "apps/desktop-v3/src/app/layout/sidebar.tsx",
  "apps/desktop-v3/src/app/providers/app-providers.tsx",
  "apps/desktop-v3/src/app/providers/theme-provider.tsx",
  "apps/desktop-v3/src/app/router/index.tsx",
  "apps/desktop-v3/src/app/router/initial-route.ts",
  "apps/desktop-v3/src/app/router/route-handle.ts",
  "apps/desktop-v3/src/app/router/routes.tsx",
]);

export const desktopV3AllowedAppSurface = Object.freeze([
  "fn:App",
]);
export const desktopV3AllowedRendererReadySurface = Object.freeze([
  "fn:buildDesktopV3RendererBootBeaconUrl",
  "fn:reportDesktopV3RendererReady",
  "fn:reportDesktopV3RendererReadyWithTauri",
  "fn:shouldReportDesktopV3RendererReady",
  "interface:ReportDesktopV3RendererReadyOptions",
]);
export const desktopV3AllowedRendererReadyOptionProperties = Object.freeze([
  "beaconPath?: string",
  'desktopRuntime?: Pick<DesktopRuntime, "reportRendererBoot">',
  "enabled?: boolean",
  "fetchImpl?: typeof fetch",
  "route?: string",
  "runtimeMode?: string",
  "schedule?: (callback: () => void) => void",
  "stage?: RendererBootStage",
]);
export const desktopV3AllowedAppShellSurface = Object.freeze([
  "fn:AppShell",
  "fn:hasRouteHandle",
  "fn:isRouteHandle",
]);
export const desktopV3AllowedNavigationItemsSurface = Object.freeze([
  "const:primaryNavigationItems",
  "const:secondaryNavigationItems",
  "interface:NavigationItem",
]);
export const desktopV3AllowedNavigationItemProperties = Object.freeze([
  "description: string",
  "href: string",
  "icon: LucideIcon",
  "label: string",
]);
export const desktopV3AllowedPrimaryNavigationHrefs = Object.freeze([
  "/",
  "/diagnostics",
]);
export const desktopV3AllowedSecondaryNavigationHrefs = Object.freeze([
  "/preferences",
]);
export const desktopV3AllowedPageHeaderSurface = Object.freeze([
  "fn:PageHeader",
  "interface:PageHeaderProps",
]);
export const desktopV3AllowedPageHeaderProperties = Object.freeze([
  "actions?: ReactNode",
  "breadcrumbs: string[]",
  "subtitle: string",
  "title: string",
]);
export const desktopV3AllowedShellScaffoldSurface = Object.freeze([
  "fn:ShellScaffold",
  "interface:ShellScaffoldProps",
  "type:LayoutMode",
]);
export const desktopV3AllowedShellScaffoldProperties = Object.freeze([
  "children: ReactNode",
  "header: ReactNode",
  "layoutMode: LayoutMode",
  "sidebar: ReactNode",
]);
export const desktopV3AllowedLayoutModeValues = Object.freeze([
  "centered",
  "compact",
  "standard",
]);
export const desktopV3AllowedSidebarSurface = Object.freeze([
  "fn:Sidebar",
  "interface:SidebarProps",
]);
export const desktopV3AllowedSidebarProperties = Object.freeze([
  "compact: boolean",
  "width: number",
]);
export const desktopV3AllowedAppProvidersSurface = Object.freeze([
  "fn:AppProviders",
  "interface:AppProvidersProps",
]);
export const desktopV3AllowedAppProvidersProperties = Object.freeze([
  "children: ReactNode",
]);
export const desktopV3AllowedThemeProviderSurface = Object.freeze([
  "fn:applyThemeMode",
  "fn:ThemeProvider",
  "interface:ThemeProviderProps",
]);
export const desktopV3AllowedThemeProviderProperties = Object.freeze([
  "children: ReactNode",
]);
export const desktopV3AllowedRouterIndexSurface = Object.freeze([
  "re-export:appRouter",
]);
export const desktopV3AllowedInitialRouteSurface = Object.freeze([
  "const:allowedInitialRoutes",
  "fn:normalizeInitialRoute",
  "fn:resolveDesktopV3InitialRoute",
  "type:DesktopV3InitialRoute",
]);
export const desktopV3AllowedInitialRouteValues = Object.freeze([
  "/",
  "/diagnostics",
  "/preferences",
]);
export const desktopV3AllowedRouteHandleSurface = Object.freeze([
  "interface:AppRouteHandle",
]);
export const desktopV3AllowedRouteHandleProperties = Object.freeze([
  "shortLabel?: string",
  "subtitle: string",
  "title: string",
]);
export const desktopV3AllowedRoutesSurface = Object.freeze([
  "const:appRouter",
  "const:dashboardHandle",
  "const:diagnosticsHandle",
  "const:initialRoute",
  "const:initialRouteElement",
  "const:preferencesHandle",
]);
export const desktopV3AllowedRouterPathSurface = Object.freeze([
  "index:/",
  "path:/",
  "path:/diagnostics",
  "path:/preferences",
]);

export const desktopV3AllowedAppExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/main.tsx",
]);
export const desktopV3AllowedRendererReadyExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/main.tsx",
]);
export const desktopV3AllowedAppShellExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedNavigationItemsExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/sidebar.tsx",
]);
export const desktopV3AllowedPageHeaderExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
]);
export const desktopV3AllowedShellScaffoldExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
]);
export const desktopV3AllowedSidebarExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
]);
export const desktopV3AllowedAppProvidersExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/App.tsx",
]);
export const desktopV3AllowedThemeProviderExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/providers/app-providers.tsx",
]);
export const desktopV3AllowedRouterIndexExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/App.tsx",
]);
export const desktopV3AllowedInitialRouteExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedRouteHandleExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/app-shell.tsx",
  "apps/desktop-v3/src/app/router/routes.tsx",
]);
export const desktopV3AllowedRoutesExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/router/index.tsx",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_APP_SHELL_GOVERNANCE_RUN_ID?.trim();

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

function sortNamedEntries(entries) {
  return [...entries].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    return left.name.localeCompare(right.name);
  });
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

function normalizeTypeScriptText(text) {
  return text
    .replace(/\s+/gu, " ")
    .replace(/\s*<\s*/gu, "<")
    .replace(/\s*>\s*/gu, ">")
    .replace(/\s*\(\s*/gu, "(")
    .replace(/\s*\)\s*/gu, ")")
    .replace(/\s*:\s*/gu, ": ")
    .replace(/\s*;\s*/gu, "; ")
    .replace(/\s*,\s*/gu, ", ")
    .replace(/,\s*\)/gu, ")")
    .replace(/\s*=>\s*/gu, " => ")
    .replace(/\s*\|\s*/gu, " | ")
    .replace(/\s*&\s*/gu, " & ")
    .replace(/\s*\{\s*/gu, "{ ")
    .replace(/\s*\}\s*/gu, " }")
    .replace(/;\s+\}/gu, "; }")
    .trim();
}

function isTypeScriptSourceFile(name) {
  return /\.(?:[cm]?ts|tsx)$/u.test(name)
    && !name.endsWith(".d.ts")
    && !name.includes(".test.");
}

function lineOfNode(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function createTypeScriptSourceFile(sourceText, absoluteFilePath) {
  return ts.createSourceFile(
    absoluteFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    absoluteFilePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function declarationKindFromVariableStatement(statement) {
  if ((statement.declarationList.flags & ts.NodeFlags.Const) !== 0) {
    return "const";
  }

  if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) {
    return "let";
  }

  return "var";
}

function normalizeTypeScriptPropertyName(nameNode, sourceFile) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteralLike(nameNode)) {
    return nameNode.text;
  }

  return nameNode.getText(sourceFile);
}

function resolveTypeScriptModuleSpecifierToAbsolutePath(moduleSpecifier, absoluteFilePath, workspaceRoot) {
  if (typeof moduleSpecifier !== "string" || moduleSpecifier.length === 0) {
    return null;
  }

  const sourceRoot = path.join(workspaceRoot, desktopV3SourceDir);
  let basePath = null;

  if (moduleSpecifier.startsWith("@/")) {
    basePath = path.join(sourceRoot, moduleSpecifier.slice(2));
  } else if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")) {
    basePath = path.resolve(path.dirname(absoluteFilePath), moduleSpecifier);
  } else {
    return null;
  }

  const candidates = [];

  if (path.extname(basePath).length > 0) {
    candidates.push(basePath);
  } else {
    candidates.push(
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.mts`,
      `${basePath}.cts`,
      path.join(basePath, "index.ts"),
      path.join(basePath, "index.tsx"),
      path.join(basePath, "index.mts"),
      path.join(basePath, "index.cts"),
    );
  }

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function getModuleSpecifierText(node) {
  if (
    node
    && "moduleSpecifier" in node
    && node.moduleSpecifier
    && ts.isStringLiteralLike(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }

  return null;
}

function collectObjectLiteralProperty(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (
      (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property))
      && normalizeTypeScriptPropertyName(property.name, objectLiteral.getSourceFile()) === propertyName
    ) {
      return property;
    }
  }

  return null;
}

function normalizeRoutePath(parentPath, childPath) {
  if (childPath === "/") {
    return "/";
  }

  if (childPath.startsWith("/")) {
    return childPath;
  }

  if (!parentPath || parentPath === "/") {
    return `/${childPath}`;
  }

  return `${parentPath}/${childPath}`;
}

export function collectTypeScriptTopLevelDeclarations(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const declarations = [];

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name) {
      declarations.push({
        filePath,
        kind: "class",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.push({
        filePath,
        kind: "fn",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      declarations.push({
        filePath,
        kind: "interface",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      declarations.push({
        filePath,
        kind: "type",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const declarationKind = declarationKindFromVariableStatement(statement);

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        declarations.push({
          filePath,
          kind: declarationKind,
          line: lineOfNode(sourceFile, declaration),
          name: declaration.name.text,
        });
      }

      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        declarations.push({
          filePath,
          kind: statement.isTypeOnly || element.isTypeOnly ? "type" : "re-export",
          line: lineOfNode(sourceFile, element),
          name: element.name.text,
        });
      }
    }
  }

  return sortNamedEntries(declarations);
}

export function collectTypeScriptInterfaceProperties(
  sourceText,
  absoluteFilePath,
  interfaceName,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const properties = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== interfaceName) {
      continue;
    }

    for (const member of statement.members) {
      if (!ts.isPropertySignature(member) || member.type === undefined || member.name === undefined) {
        continue;
      }

      const propertyName = `${normalizeTypeScriptPropertyName(member.name, sourceFile)}${member.questionToken ? "?" : ""}`;

      properties.push({
        filePath,
        line: lineOfNode(sourceFile, member),
        name: propertyName,
        typeText: normalizeTypeScriptText(member.type.getText(sourceFile)),
      });
    }
  }

  return sortNamedEntries(properties);
}

export function collectTypeScriptTypeAliasUnionValues(
  sourceText,
  absoluteFilePath,
  aliasName,
) {
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);

  for (const statement of sourceFile.statements) {
    if (
      ts.isTypeAliasDeclaration(statement)
      && statement.name.text === aliasName
      && ts.isUnionTypeNode(statement.type)
    ) {
      return sortStrings(
        statement.type.types.flatMap((typeNode) => {
          if (
            ts.isLiteralTypeNode(typeNode)
            && ts.isStringLiteralLike(typeNode.literal)
          ) {
            return [typeNode.literal.text];
          }

          return [];
        }),
      );
    }
  }

  return [];
}

export function collectTypeScriptObjectArrayPropertyValues(
  sourceText,
  absoluteFilePath,
  constName,
  propertyName,
) {
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const values = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name)
        || declaration.name.text !== constName
        || declaration.initializer === undefined
        || !ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        continue;
      }

      for (const element of declaration.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) {
          continue;
        }

        const property = collectObjectLiteralProperty(element, propertyName);

        if (
          property
          && ts.isPropertyAssignment(property)
          && ts.isStringLiteralLike(property.initializer)
        ) {
          values.push(property.initializer.text);
        }
      }
    }
  }

  return sortStrings(values);
}

export function collectTypeScriptCreateHashRouterPathSurface(
  sourceText,
  absoluteFilePath,
  variableName = "appRouter",
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const entries = [];

  function walkRouteArray(arrayLiteral, parentPath = "/") {
    for (const element of arrayLiteral.elements) {
      if (!ts.isObjectLiteralExpression(element)) {
        continue;
      }

      const pathProperty = collectObjectLiteralProperty(element, "path");
      const indexProperty = collectObjectLiteralProperty(element, "index");
      const childrenProperty = collectObjectLiteralProperty(element, "children");

      let currentPath = parentPath;

      if (
        pathProperty
        && ts.isPropertyAssignment(pathProperty)
        && ts.isStringLiteralLike(pathProperty.initializer)
      ) {
        currentPath = normalizeRoutePath(parentPath, pathProperty.initializer.text);
        entries.push({
          filePath,
          kind: "path",
          line: lineOfNode(sourceFile, pathProperty),
          name: currentPath,
        });
      } else if (
        indexProperty
        && ts.isPropertyAssignment(indexProperty)
        && indexProperty.initializer.kind === ts.SyntaxKind.TrueKeyword
      ) {
        entries.push({
          filePath,
          kind: "index",
          line: lineOfNode(sourceFile, indexProperty),
          name: parentPath || "/",
        });
      }

      if (
        childrenProperty
        && ts.isPropertyAssignment(childrenProperty)
        && ts.isArrayLiteralExpression(childrenProperty.initializer)
      ) {
        walkRouteArray(childrenProperty.initializer, currentPath);
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name)
        || declaration.name.text !== variableName
        || declaration.initializer === undefined
        || !ts.isCallExpression(declaration.initializer)
        || !ts.isIdentifier(declaration.initializer.expression)
        || declaration.initializer.expression.text !== "createHashRouter"
      ) {
        continue;
      }

      const [routesArgument] = declaration.initializer.arguments;

      if (routesArgument && ts.isArrayLiteralExpression(routesArgument)) {
        walkRouteArray(routesArgument, "/");
      }
    }
  }

  return sortStrings(entries.map((entry) => `${entry.kind}:${entry.name}`));
}

export function collectTypeScriptModuleReferenceEntries(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const references = [];

  function addReference(moduleSpecifier, node) {
    const resolvedAbsolutePath = resolveTypeScriptModuleSpecifierToAbsolutePath(
      moduleSpecifier,
      absoluteFilePath,
      workspaceRoot,
    );

    if (!resolvedAbsolutePath) {
      return;
    }

    const { character, line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

    references.push({
      column: character + 1,
      filePath,
      line: line + 1,
      moduleSpecifier,
      resolvedFilePath: normalizeWorkspaceRelativePath(workspaceRoot, resolvedAbsolutePath),
    });
  }

  function visit(node) {
    const moduleSpecifier = getModuleSpecifierText(node);

    if (typeof moduleSpecifier === "string") {
      addReference(moduleSpecifier, node.moduleSpecifier);
    }

    if (
      ts.isImportTypeNode(node)
      && ts.isLiteralTypeNode(node.argument)
      && ts.isStringLiteralLike(node.argument.literal)
    ) {
      addReference(node.argument.literal.text, node.argument.literal);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return references.sort((left, right) => {
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

    return left.resolvedFilePath.localeCompare(right.resolvedFilePath);
  });
}

async function collectTypeScriptFiles(directoryPath, readdirImpl) {
  const collected = [];

  async function walk(currentPath) {
    const entries = await readdirImpl(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile() && isTypeScriptSourceFile(entry.name)) {
        collected.push(absolutePath);
      }
    }
  }

  await walk(directoryPath);

  return collected.sort((left, right) => left.localeCompare(right));
}

export async function listDesktopV3AppShellFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectTypeScriptFiles(config.appDir, readdirImpl);
}

export async function listDesktopV3SourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectTypeScriptFiles(config.sourceDir, readdirImpl);
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
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; rewrite the app shell boundary before changing this ownership edge.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }
}

export async function collectDesktopV3AppShellGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const appFilePaths = Array.isArray(options.appFilePaths)
    ? options.appFilePaths
    : await listDesktopV3AppShellFiles(config, options);
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

  const appFiles = sortStrings(
    appFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const scannedFiles = sortStrings(
    new Set(sourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath))),
  );

  addSurfaceDriftViolation({
    actualSurface: appFiles,
    detail: `src/app file set drifted from the frozen Wave 1 app shell boundary (${config.allowedAppShellFiles.join(", ")}). Rewrite app shell ownership before splitting or adding files here.`,
    entries: appFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedAppShellFiles,
    filePath: desktopV3AppDir,
    kind: "app-shell-file-set-drift",
    violations,
    seenViolations,
  });

  const appSource = await readSourceText(config.appFilePath);
  const rendererReadySource = await readSourceText(config.rendererReadyFilePath);
  const appShellSource = await readSourceText(config.appShellFilePath);
  const navigationItemsSource = await readSourceText(config.navigationItemsFilePath);
  const pageHeaderSource = await readSourceText(config.pageHeaderFilePath);
  const shellScaffoldSource = await readSourceText(config.shellScaffoldFilePath);
  const sidebarSource = await readSourceText(config.sidebarFilePath);
  const appProvidersSource = await readSourceText(config.appProvidersFilePath);
  const themeProviderSource = await readSourceText(config.themeProviderFilePath);
  const routerIndexSource = await readSourceText(config.routerIndexFilePath);
  const initialRouteSource = await readSourceText(config.initialRouteFilePath);
  const routeHandleSource = await readSourceText(config.routeHandleFilePath);
  const routesSource = await readSourceText(config.routesFilePath);

  const appSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(appSource, config.appFilePath, { rootDir: config.rootDir }),
  );
  const rendererReadyDeclarations = collectTypeScriptTopLevelDeclarations(
    rendererReadySource,
    config.rendererReadyFilePath,
    { rootDir: config.rootDir },
  );
  const rendererReadySurface = formatDeclarationSurface(rendererReadyDeclarations);
  const rendererReadyOptionProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      rendererReadySource,
      config.rendererReadyFilePath,
      "ReportDesktopV3RendererReadyOptions",
      { rootDir: config.rootDir },
    ),
  );
  const appShellSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(appShellSource, config.appShellFilePath, { rootDir: config.rootDir }),
  );
  const navigationItemsDeclarations = collectTypeScriptTopLevelDeclarations(
    navigationItemsSource,
    config.navigationItemsFilePath,
    { rootDir: config.rootDir },
  );
  const navigationItemsSurface = formatDeclarationSurface(navigationItemsDeclarations);
  const navigationItemProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      navigationItemsSource,
      config.navigationItemsFilePath,
      "NavigationItem",
      { rootDir: config.rootDir },
    ),
  );
  const primaryNavigationHrefs = collectTypeScriptObjectArrayPropertyValues(
    navigationItemsSource,
    config.navigationItemsFilePath,
    "primaryNavigationItems",
    "href",
  );
  const secondaryNavigationHrefs = collectTypeScriptObjectArrayPropertyValues(
    navigationItemsSource,
    config.navigationItemsFilePath,
    "secondaryNavigationItems",
    "href",
  );
  const pageHeaderSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(pageHeaderSource, config.pageHeaderFilePath, { rootDir: config.rootDir }),
  );
  const pageHeaderProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      pageHeaderSource,
      config.pageHeaderFilePath,
      "PageHeaderProps",
      { rootDir: config.rootDir },
    ),
  );
  const shellScaffoldSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(shellScaffoldSource, config.shellScaffoldFilePath, { rootDir: config.rootDir }),
  );
  const shellScaffoldProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      shellScaffoldSource,
      config.shellScaffoldFilePath,
      "ShellScaffoldProps",
      { rootDir: config.rootDir },
    ),
  );
  const layoutModeValues = collectTypeScriptTypeAliasUnionValues(
    shellScaffoldSource,
    config.shellScaffoldFilePath,
    "LayoutMode",
  );
  const sidebarSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(sidebarSource, config.sidebarFilePath, { rootDir: config.rootDir }),
  );
  const sidebarProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      sidebarSource,
      config.sidebarFilePath,
      "SidebarProps",
      { rootDir: config.rootDir },
    ),
  );
  const appProvidersSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(appProvidersSource, config.appProvidersFilePath, { rootDir: config.rootDir }),
  );
  const appProvidersProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      appProvidersSource,
      config.appProvidersFilePath,
      "AppProvidersProps",
      { rootDir: config.rootDir },
    ),
  );
  const themeProviderSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(themeProviderSource, config.themeProviderFilePath, { rootDir: config.rootDir }),
  );
  const themeProviderProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      themeProviderSource,
      config.themeProviderFilePath,
      "ThemeProviderProps",
      { rootDir: config.rootDir },
    ),
  );
  const routerIndexSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(routerIndexSource, config.routerIndexFilePath, { rootDir: config.rootDir }),
  );
  const initialRouteSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(initialRouteSource, config.initialRouteFilePath, { rootDir: config.rootDir }),
  );
  const initialRouteValues = collectTypeScriptTypeAliasUnionValues(
    initialRouteSource,
    config.initialRouteFilePath,
    "DesktopV3InitialRoute",
  );
  const routeHandleSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(routeHandleSource, config.routeHandleFilePath, { rootDir: config.rootDir }),
  );
  const routeHandleProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      routeHandleSource,
      config.routeHandleFilePath,
      "AppRouteHandle",
      { rootDir: config.rootDir },
    ),
  );
  const routesSurface = formatDeclarationSurface(
    collectTypeScriptTopLevelDeclarations(routesSource, config.routesFilePath, { rootDir: config.rootDir }),
  );
  const routerPathSurface = collectTypeScriptCreateHashRouterPathSurface(
    routesSource,
    config.routesFilePath,
    "appRouter",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: appSurface,
    detail: `App.tsx drifted from the frozen Wave 1 app shell surface (${config.allowedAppSurface.join(", ")}). Rewrite the app entry boundary before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(appSource, config.appFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedAppSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.appFilePath),
    kind: "app-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: rendererReadySurface,
    detail: `renderer-ready drifted from the frozen Wave 1 boot surface (${config.allowedRendererReadySurface.join(", ")}). Rewrite the renderer boot boundary before widening it.`,
    entries: rendererReadyDeclarations,
    expectedSurface: config.allowedRendererReadySurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.rendererReadyFilePath),
    kind: "renderer-ready-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: rendererReadyOptionProperties,
    detail: `ReportDesktopV3RendererReadyOptions drifted from the frozen Wave 1 boot options surface (${config.allowedRendererReadyOptionProperties.join(", ")}). Rewrite the boot reporter boundary before changing this option bag.`,
    entries: collectTypeScriptInterfaceProperties(
      rendererReadySource,
      config.rendererReadyFilePath,
      "ReportDesktopV3RendererReadyOptions",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedRendererReadyOptionProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.rendererReadyFilePath),
    kind: "renderer-ready-option-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: appShellSurface,
    detail: `app-shell drifted from the frozen Wave 1 layout shell surface (${config.allowedAppShellSurface.join(", ")}). Rewrite the route shell boundary before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(appShellSource, config.appShellFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedAppShellSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.appShellFilePath),
    kind: "app-shell-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: navigationItemsSurface,
    detail: `navigation-items drifted from the frozen Wave 1 navigation surface (${config.allowedNavigationItemsSurface.join(", ")}). Rewrite the shell navigation boundary before widening it.`,
    entries: navigationItemsDeclarations,
    expectedSurface: config.allowedNavigationItemsSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.navigationItemsFilePath),
    kind: "navigation-items-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: navigationItemProperties,
    detail: `NavigationItem drifted from the frozen Wave 1 navigation contract (${config.allowedNavigationItemProperties.join(", ")}). Rewrite shell navigation modeling before widening it.`,
    entries: collectTypeScriptInterfaceProperties(
      navigationItemsSource,
      config.navigationItemsFilePath,
      "NavigationItem",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedNavigationItemProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.navigationItemsFilePath),
    kind: "navigation-item-property-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: primaryNavigationHrefs,
    detail: `primaryNavigationItems href set drifted from the frozen Wave 1 shell route set (${config.allowedPrimaryNavigationHrefs.join(", ")}). Rewrite the app shell route topology before changing primary navigation.`,
    entries: navigationItemsDeclarations,
    expectedSurface: config.allowedPrimaryNavigationHrefs,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.navigationItemsFilePath),
    kind: "primary-navigation-href-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: secondaryNavigationHrefs,
    detail: `secondaryNavigationItems href set drifted from the frozen Wave 1 shell route set (${config.allowedSecondaryNavigationHrefs.join(", ")}). Rewrite the app shell route topology before changing secondary navigation.`,
    entries: navigationItemsDeclarations,
    expectedSurface: config.allowedSecondaryNavigationHrefs,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.navigationItemsFilePath),
    kind: "secondary-navigation-href-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: pageHeaderSurface,
    detail: `page-header drifted from the frozen Wave 1 shell header surface (${config.allowedPageHeaderSurface.join(", ")}). Rewrite header composition before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(pageHeaderSource, config.pageHeaderFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedPageHeaderSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.pageHeaderFilePath),
    kind: "page-header-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: pageHeaderProperties,
    detail: `PageHeaderProps drifted from the frozen Wave 1 header contract (${config.allowedPageHeaderProperties.join(", ")}). Rewrite the header boundary before changing it.`,
    entries: collectTypeScriptInterfaceProperties(
      pageHeaderSource,
      config.pageHeaderFilePath,
      "PageHeaderProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedPageHeaderProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.pageHeaderFilePath),
    kind: "page-header-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: shellScaffoldSurface,
    detail: `shell-scaffold drifted from the frozen Wave 1 layout scaffold surface (${config.allowedShellScaffoldSurface.join(", ")}). Rewrite scaffold composition before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(shellScaffoldSource, config.shellScaffoldFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedShellScaffoldSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.shellScaffoldFilePath),
    kind: "shell-scaffold-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: shellScaffoldProperties,
    detail: `ShellScaffoldProps drifted from the frozen Wave 1 scaffold contract (${config.allowedShellScaffoldProperties.join(", ")}). Rewrite scaffold composition before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      shellScaffoldSource,
      config.shellScaffoldFilePath,
      "ShellScaffoldProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedShellScaffoldProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.shellScaffoldFilePath),
    kind: "shell-scaffold-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: layoutModeValues,
    detail: `LayoutMode drifted from the frozen Wave 1 layout mode set (${config.allowedLayoutModeValues.join(", ")}). Rewrite shell layout mode semantics before changing them.`,
    entries: collectTypeScriptTopLevelDeclarations(shellScaffoldSource, config.shellScaffoldFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedLayoutModeValues,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.shellScaffoldFilePath),
    kind: "layout-mode-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: sidebarSurface,
    detail: `sidebar drifted from the frozen Wave 1 sidebar surface (${config.allowedSidebarSurface.join(", ")}). Rewrite sidebar composition before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(sidebarSource, config.sidebarFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedSidebarSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.sidebarFilePath),
    kind: "sidebar-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: sidebarProperties,
    detail: `SidebarProps drifted from the frozen Wave 1 sidebar contract (${config.allowedSidebarProperties.join(", ")}). Rewrite sidebar composition before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      sidebarSource,
      config.sidebarFilePath,
      "SidebarProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedSidebarProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.sidebarFilePath),
    kind: "sidebar-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: appProvidersSurface,
    detail: `app-providers drifted from the frozen Wave 1 provider shell surface (${config.allowedAppProvidersSurface.join(", ")}). Rewrite the provider stack boundary before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(appProvidersSource, config.appProvidersFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedAppProvidersSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.appProvidersFilePath),
    kind: "app-providers-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: appProvidersProperties,
    detail: `AppProvidersProps drifted from the frozen Wave 1 provider shell contract (${config.allowedAppProvidersProperties.join(", ")}). Rewrite provider composition before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      appProvidersSource,
      config.appProvidersFilePath,
      "AppProvidersProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedAppProvidersProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.appProvidersFilePath),
    kind: "app-providers-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: themeProviderSurface,
    detail: `theme-provider drifted from the frozen Wave 1 provider surface (${config.allowedThemeProviderSurface.join(", ")}). Rewrite theme orchestration before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(themeProviderSource, config.themeProviderFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedThemeProviderSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.themeProviderFilePath),
    kind: "theme-provider-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: themeProviderProperties,
    detail: `ThemeProviderProps drifted from the frozen Wave 1 provider contract (${config.allowedThemeProviderProperties.join(", ")}). Rewrite theme orchestration before changing this prop bag.`,
    entries: collectTypeScriptInterfaceProperties(
      themeProviderSource,
      config.themeProviderFilePath,
      "ThemeProviderProps",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedThemeProviderProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.themeProviderFilePath),
    kind: "theme-provider-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: routerIndexSurface,
    detail: `router/index drifted from the frozen Wave 1 router entry surface (${config.allowedRouterIndexSurface.join(", ")}). Rewrite router export ownership before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(routerIndexSource, config.routerIndexFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedRouterIndexSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.routerIndexFilePath),
    kind: "router-index-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: initialRouteSurface,
    detail: `initial-route drifted from the frozen Wave 1 initial route surface (${config.allowedInitialRouteSurface.join(", ")}). Rewrite route bootstrapping before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(initialRouteSource, config.initialRouteFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedInitialRouteSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.initialRouteFilePath),
    kind: "initial-route-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: initialRouteValues,
    detail: `DesktopV3InitialRoute drifted from the frozen Wave 1 route set (${config.allowedInitialRouteValues.join(", ")}). Rewrite route bootstrapping before changing the initial route contract.`,
    entries: collectTypeScriptTopLevelDeclarations(initialRouteSource, config.initialRouteFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedInitialRouteValues,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.initialRouteFilePath),
    kind: "initial-route-value-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: routeHandleSurface,
    detail: `route-handle drifted from the frozen Wave 1 route metadata surface (${config.allowedRouteHandleSurface.join(", ")}). Rewrite route metadata ownership before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(routeHandleSource, config.routeHandleFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedRouteHandleSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.routeHandleFilePath),
    kind: "route-handle-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: routeHandleProperties,
    detail: `AppRouteHandle drifted from the frozen Wave 1 route metadata contract (${config.allowedRouteHandleProperties.join(", ")}). Rewrite route metadata ownership before changing it.`,
    entries: collectTypeScriptInterfaceProperties(
      routeHandleSource,
      config.routeHandleFilePath,
      "AppRouteHandle",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedRouteHandleProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.routeHandleFilePath),
    kind: "route-handle-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: routesSurface,
    detail: `routes.tsx drifted from the frozen Wave 1 route shell surface (${config.allowedRoutesSurface.join(", ")}). Rewrite router composition before widening it.`,
    entries: collectTypeScriptTopLevelDeclarations(routesSource, config.routesFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedRoutesSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.routesFilePath),
    kind: "routes-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: routerPathSurface,
    detail: `appRouter route path surface drifted from the frozen Wave 1 shell route set (${config.allowedRouterPathSurface.join(", ")}). Rewrite shell routing before changing route topology.`,
    entries: collectTypeScriptTopLevelDeclarations(routesSource, config.routesFilePath, { rootDir: config.rootDir }),
    expectedSurface: config.allowedRouterPathSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.routesFilePath),
    kind: "router-path-surface-drift",
    violations,
    seenViolations,
  });

  const appReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.appFilePath),
  });
  const rendererReadyReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.rendererReadyFilePath),
  });
  const appShellReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.appShellFilePath),
  });
  const navigationItemsReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.navigationItemsFilePath),
  });
  const pageHeaderReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.pageHeaderFilePath),
  });
  const shellScaffoldReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.shellScaffoldFilePath),
  });
  const sidebarReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.sidebarFilePath),
  });
  const appProvidersReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.appProvidersFilePath),
  });
  const themeProviderReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.themeProviderFilePath),
  });
  const routerIndexReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.routerIndexFilePath),
  });
  const initialRouteReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.initialRouteFilePath),
  });
  const routeHandleReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.routeHandleFilePath),
  });
  const routesReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.routesFilePath),
  });

  const appReferenceFiles = sortStrings(new Set(appReferenceEntries.map((entry) => entry.filePath)));
  const rendererReadyReferenceFiles = sortStrings(new Set(rendererReadyReferenceEntries.map((entry) => entry.filePath)));
  const appShellReferenceFiles = sortStrings(new Set(appShellReferenceEntries.map((entry) => entry.filePath)));
  const navigationItemsReferenceFiles = sortStrings(new Set(navigationItemsReferenceEntries.map((entry) => entry.filePath)));
  const pageHeaderReferenceFiles = sortStrings(new Set(pageHeaderReferenceEntries.map((entry) => entry.filePath)));
  const shellScaffoldReferenceFiles = sortStrings(new Set(shellScaffoldReferenceEntries.map((entry) => entry.filePath)));
  const sidebarReferenceFiles = sortStrings(new Set(sidebarReferenceEntries.map((entry) => entry.filePath)));
  const appProvidersReferenceFiles = sortStrings(new Set(appProvidersReferenceEntries.map((entry) => entry.filePath)));
  const themeProviderReferenceFiles = sortStrings(new Set(themeProviderReferenceEntries.map((entry) => entry.filePath)));
  const routerIndexReferenceFiles = sortStrings(new Set(routerIndexReferenceEntries.map((entry) => entry.filePath)));
  const initialRouteReferenceFiles = sortStrings(new Set(initialRouteReferenceEntries.map((entry) => entry.filePath)));
  const routeHandleReferenceFiles = sortStrings(new Set(routeHandleReferenceEntries.map((entry) => entry.filePath)));
  const routesReferenceFiles = sortStrings(new Set(routesReferenceEntries.map((entry) => entry.filePath)));

  addExternalReferenceViolations({
    actualReferenceEntries: appReferenceEntries,
    allowedExternalReferenceFiles: config.allowedAppExternalReferenceFiles,
    detail: `App.tsx escaped the frozen Wave 1 app entry ownership boundary. Only ${config.allowedAppExternalReferenceFiles.join(", ")} may hold the app root directly.`,
    kind: "app-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: rendererReadyReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRendererReadyExternalReferenceFiles,
    detail: `renderer-ready escaped the frozen Wave 1 boot ownership boundary. Only ${config.allowedRendererReadyExternalReferenceFiles.join(", ")} may trigger renderer boot reporting directly.`,
    kind: "renderer-ready-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: appShellReferenceEntries,
    allowedExternalReferenceFiles: config.allowedAppShellExternalReferenceFiles,
    detail: `app-shell escaped the frozen Wave 1 route shell ownership boundary. Only ${config.allowedAppShellExternalReferenceFiles.join(", ")} may hold AppShell directly.`,
    kind: "app-shell-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: navigationItemsReferenceEntries,
    allowedExternalReferenceFiles: config.allowedNavigationItemsExternalReferenceFiles,
    detail: `navigation-items escaped the frozen Wave 1 navigation ownership boundary. Only ${config.allowedNavigationItemsExternalReferenceFiles.join(", ")} may hold shell navigation items directly.`,
    kind: "navigation-items-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: pageHeaderReferenceEntries,
    allowedExternalReferenceFiles: config.allowedPageHeaderExternalReferenceFiles,
    detail: `page-header escaped the frozen Wave 1 header ownership boundary. Only ${config.allowedPageHeaderExternalReferenceFiles.join(", ")} may hold PageHeader directly.`,
    kind: "page-header-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: shellScaffoldReferenceEntries,
    allowedExternalReferenceFiles: config.allowedShellScaffoldExternalReferenceFiles,
    detail: `shell-scaffold escaped the frozen Wave 1 scaffold ownership boundary. Only ${config.allowedShellScaffoldExternalReferenceFiles.join(", ")} may hold ShellScaffold directly.`,
    kind: "shell-scaffold-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: sidebarReferenceEntries,
    allowedExternalReferenceFiles: config.allowedSidebarExternalReferenceFiles,
    detail: `sidebar escaped the frozen Wave 1 shell ownership boundary. Only ${config.allowedSidebarExternalReferenceFiles.join(", ")} may hold Sidebar directly.`,
    kind: "sidebar-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: appProvidersReferenceEntries,
    allowedExternalReferenceFiles: config.allowedAppProvidersExternalReferenceFiles,
    detail: `app-providers escaped the frozen Wave 1 provider ownership boundary. Only ${config.allowedAppProvidersExternalReferenceFiles.join(", ")} may hold AppProviders directly.`,
    kind: "app-providers-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: themeProviderReferenceEntries,
    allowedExternalReferenceFiles: config.allowedThemeProviderExternalReferenceFiles,
    detail: `theme-provider escaped the frozen Wave 1 provider ownership boundary. Only ${config.allowedThemeProviderExternalReferenceFiles.join(", ")} may hold ThemeProvider directly.`,
    kind: "theme-provider-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: routerIndexReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRouterIndexExternalReferenceFiles,
    detail: `router/index escaped the frozen Wave 1 router entry ownership boundary. Only ${config.allowedRouterIndexExternalReferenceFiles.join(", ")} may hold the router entry directly.`,
    kind: "router-index-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: initialRouteReferenceEntries,
    allowedExternalReferenceFiles: config.allowedInitialRouteExternalReferenceFiles,
    detail: `initial-route escaped the frozen Wave 1 route bootstrap ownership boundary. Only ${config.allowedInitialRouteExternalReferenceFiles.join(", ")} may resolve the initial route directly.`,
    kind: "initial-route-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: routeHandleReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRouteHandleExternalReferenceFiles,
    detail: `route-handle escaped the frozen Wave 1 route metadata ownership boundary. Only ${config.allowedRouteHandleExternalReferenceFiles.join(", ")} may depend on AppRouteHandle directly.`,
    kind: "route-handle-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: routesReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRoutesExternalReferenceFiles,
    detail: `routes.tsx escaped the frozen Wave 1 route shell ownership boundary. Only ${config.allowedRoutesExternalReferenceFiles.join(", ")} may hold appRouter composition directly.`,
    kind: "routes-external-reference",
    seenViolations,
    violations,
  });

  return {
    appFiles,
    appProvidersProperties,
    appProvidersReferenceFiles,
    appProvidersSurface,
    appReferenceFiles,
    appShellReferenceFiles,
    appShellSurface,
    appSurface,
    initialRouteReferenceFiles,
    initialRouteSurface,
    initialRouteValues,
    layoutModeValues,
    navigationItemProperties,
    navigationItemsReferenceFiles,
    navigationItemsSurface,
    pageHeaderProperties,
    pageHeaderReferenceFiles,
    pageHeaderSurface,
    primaryNavigationHrefs,
    rendererReadyOptionProperties,
    rendererReadyReferenceFiles,
    rendererReadySurface,
    routeHandleProperties,
    routeHandleReferenceFiles,
    routeHandleSurface,
    routerIndexReferenceFiles,
    routerIndexSurface,
    routerPathSurface,
    routesReferenceFiles,
    routesSurface,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    secondaryNavigationHrefs,
    shellScaffoldProperties,
    shellScaffoldReferenceFiles,
    shellScaffoldSurface,
    sidebarProperties,
    sidebarReferenceFiles,
    sidebarSurface,
    themeProviderProperties,
    themeProviderReferenceFiles,
    themeProviderSurface,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3AppShellGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedAppExternalReferenceFiles: [...config.allowedAppExternalReferenceFiles],
      allowedAppProvidersExternalReferenceFiles: [...config.allowedAppProvidersExternalReferenceFiles],
      allowedAppProvidersProperties: [...config.allowedAppProvidersProperties],
      allowedAppProvidersSurface: [...config.allowedAppProvidersSurface],
      allowedAppShellExternalReferenceFiles: [...config.allowedAppShellExternalReferenceFiles],
      allowedAppShellFiles: [...config.allowedAppShellFiles],
      allowedAppShellSurface: [...config.allowedAppShellSurface],
      allowedAppSurface: [...config.allowedAppSurface],
      allowedInitialRouteExternalReferenceFiles: [...config.allowedInitialRouteExternalReferenceFiles],
      allowedInitialRouteSurface: [...config.allowedInitialRouteSurface],
      allowedInitialRouteValues: [...config.allowedInitialRouteValues],
      allowedLayoutModeValues: [...config.allowedLayoutModeValues],
      allowedNavigationItemProperties: [...config.allowedNavigationItemProperties],
      allowedNavigationItemsExternalReferenceFiles: [...config.allowedNavigationItemsExternalReferenceFiles],
      allowedNavigationItemsSurface: [...config.allowedNavigationItemsSurface],
      allowedPageHeaderExternalReferenceFiles: [...config.allowedPageHeaderExternalReferenceFiles],
      allowedPageHeaderProperties: [...config.allowedPageHeaderProperties],
      allowedPageHeaderSurface: [...config.allowedPageHeaderSurface],
      allowedPrimaryNavigationHrefs: [...config.allowedPrimaryNavigationHrefs],
      allowedRendererReadyExternalReferenceFiles: [...config.allowedRendererReadyExternalReferenceFiles],
      allowedRendererReadyOptionProperties: [...config.allowedRendererReadyOptionProperties],
      allowedRendererReadySurface: [...config.allowedRendererReadySurface],
      allowedRouteHandleExternalReferenceFiles: [...config.allowedRouteHandleExternalReferenceFiles],
      allowedRouteHandleProperties: [...config.allowedRouteHandleProperties],
      allowedRouteHandleSurface: [...config.allowedRouteHandleSurface],
      allowedRouterIndexExternalReferenceFiles: [...config.allowedRouterIndexExternalReferenceFiles],
      allowedRouterIndexSurface: [...config.allowedRouterIndexSurface],
      allowedRouterPathSurface: [...config.allowedRouterPathSurface],
      allowedRoutesExternalReferenceFiles: [...config.allowedRoutesExternalReferenceFiles],
      allowedRoutesSurface: [...config.allowedRoutesSurface],
      allowedSecondaryNavigationHrefs: [...config.allowedSecondaryNavigationHrefs],
      allowedShellScaffoldExternalReferenceFiles: [...config.allowedShellScaffoldExternalReferenceFiles],
      allowedShellScaffoldProperties: [...config.allowedShellScaffoldProperties],
      allowedShellScaffoldSurface: [...config.allowedShellScaffoldSurface],
      allowedSidebarExternalReferenceFiles: [...config.allowedSidebarExternalReferenceFiles],
      allowedSidebarProperties: [...config.allowedSidebarProperties],
      allowedSidebarSurface: [...config.allowedSidebarSurface],
      allowedThemeProviderExternalReferenceFiles: [...config.allowedThemeProviderExternalReferenceFiles],
      allowedThemeProviderProperties: [...config.allowedThemeProviderProperties],
      allowedThemeProviderSurface: [...config.allowedThemeProviderSurface],
      appFiles: [],
      appProvidersProperties: [],
      appProvidersReferenceFiles: [],
      appProvidersSurface: [],
      appReferenceFiles: [],
      appShellReferenceFiles: [],
      appShellSurface: [],
      appSurface: [],
      checkedAt: null,
      error: null,
      initialRouteReferenceFiles: [],
      initialRouteSurface: [],
      initialRouteValues: [],
      latestSummaryPath: config.latestSummaryPath,
      layoutModeValues: [],
      navigationItemProperties: [],
      navigationItemsReferenceFiles: [],
      navigationItemsSurface: [],
      outputDir: config.outputDir,
      pageHeaderProperties: [],
      pageHeaderReferenceFiles: [],
      pageHeaderSurface: [],
      primaryNavigationHrefs: [],
      rendererReadyOptionProperties: [],
      rendererReadyReferenceFiles: [],
      rendererReadySurface: [],
      routeHandleProperties: [],
      routeHandleReferenceFiles: [],
      routeHandleSurface: [],
      routerIndexReferenceFiles: [],
      routerIndexSurface: [],
      routerPathSurface: [],
      routesReferenceFiles: [],
      routesSurface: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      secondaryNavigationHrefs: [],
      shellScaffoldProperties: [],
      shellScaffoldReferenceFiles: [],
      shellScaffoldSurface: [],
      sidebarProperties: [],
      sidebarReferenceFiles: [],
      sidebarSurface: [],
      status: "running",
      summaryPath: config.summaryPath,
      themeProviderProperties: [],
      themeProviderReferenceFiles: [],
      themeProviderSurface: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3AppShellGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 app shell governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 app shell governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3AppShellGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_APP_SHELL_GOVERNANCE_OUTPUT_DIR?.trim()
    || path.join(workspaceRoot, "output", "verification", `desktop-v3-app-shell-governance-${runId}`);

  return {
    allowedAppExternalReferenceFiles: [...desktopV3AllowedAppExternalReferenceFiles],
    allowedAppProvidersExternalReferenceFiles: [...desktopV3AllowedAppProvidersExternalReferenceFiles],
    allowedAppProvidersProperties: [...desktopV3AllowedAppProvidersProperties],
    allowedAppProvidersSurface: [...desktopV3AllowedAppProvidersSurface],
    allowedAppShellExternalReferenceFiles: [...desktopV3AllowedAppShellExternalReferenceFiles],
    allowedAppShellFiles: [...desktopV3AppShellFileSet],
    allowedAppShellSurface: [...desktopV3AllowedAppShellSurface],
    allowedAppSurface: [...desktopV3AllowedAppSurface],
    allowedInitialRouteExternalReferenceFiles: [...desktopV3AllowedInitialRouteExternalReferenceFiles],
    allowedInitialRouteSurface: [...desktopV3AllowedInitialRouteSurface],
    allowedInitialRouteValues: [...desktopV3AllowedInitialRouteValues],
    allowedLayoutModeValues: [...desktopV3AllowedLayoutModeValues],
    allowedNavigationItemProperties: [...desktopV3AllowedNavigationItemProperties],
    allowedNavigationItemsExternalReferenceFiles: [...desktopV3AllowedNavigationItemsExternalReferenceFiles],
    allowedNavigationItemsSurface: [...desktopV3AllowedNavigationItemsSurface],
    allowedPageHeaderExternalReferenceFiles: [...desktopV3AllowedPageHeaderExternalReferenceFiles],
    allowedPageHeaderProperties: [...desktopV3AllowedPageHeaderProperties],
    allowedPageHeaderSurface: [...desktopV3AllowedPageHeaderSurface],
    allowedPrimaryNavigationHrefs: [...desktopV3AllowedPrimaryNavigationHrefs],
    allowedRendererReadyExternalReferenceFiles: [...desktopV3AllowedRendererReadyExternalReferenceFiles],
    allowedRendererReadyOptionProperties: [...desktopV3AllowedRendererReadyOptionProperties],
    allowedRendererReadySurface: [...desktopV3AllowedRendererReadySurface],
    allowedRouteHandleExternalReferenceFiles: [...desktopV3AllowedRouteHandleExternalReferenceFiles],
    allowedRouteHandleProperties: [...desktopV3AllowedRouteHandleProperties],
    allowedRouteHandleSurface: [...desktopV3AllowedRouteHandleSurface],
    allowedRouterIndexExternalReferenceFiles: [...desktopV3AllowedRouterIndexExternalReferenceFiles],
    allowedRouterIndexSurface: [...desktopV3AllowedRouterIndexSurface],
    allowedRouterPathSurface: [...desktopV3AllowedRouterPathSurface],
    allowedRoutesExternalReferenceFiles: [...desktopV3AllowedRoutesExternalReferenceFiles],
    allowedRoutesSurface: [...desktopV3AllowedRoutesSurface],
    allowedSecondaryNavigationHrefs: [...desktopV3AllowedSecondaryNavigationHrefs],
    allowedShellScaffoldExternalReferenceFiles: [...desktopV3AllowedShellScaffoldExternalReferenceFiles],
    allowedShellScaffoldProperties: [...desktopV3AllowedShellScaffoldProperties],
    allowedShellScaffoldSurface: [...desktopV3AllowedShellScaffoldSurface],
    allowedSidebarExternalReferenceFiles: [...desktopV3AllowedSidebarExternalReferenceFiles],
    allowedSidebarProperties: [...desktopV3AllowedSidebarProperties],
    allowedSidebarSurface: [...desktopV3AllowedSidebarSurface],
    allowedThemeProviderExternalReferenceFiles: [...desktopV3AllowedThemeProviderExternalReferenceFiles],
    allowedThemeProviderProperties: [...desktopV3AllowedThemeProviderProperties],
    allowedThemeProviderSurface: [...desktopV3AllowedThemeProviderSurface],
    appDir: path.join(workspaceRoot, desktopV3AppDir),
    appFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/App.tsx"),
    appProvidersFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/providers/app-providers.tsx"),
    appShellFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/layout/app-shell.tsx"),
    initialRouteFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/router/initial-route.ts"),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-app-shell-governance-summary.json",
    ),
    navigationItemsFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/layout/navigation-items.ts"),
    outputDir,
    pageHeaderFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/layout/page-header.tsx"),
    rendererReadyFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/bootstrap/renderer-ready.ts"),
    rootDir: workspaceRoot,
    routeHandleFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/router/route-handle.ts"),
    routerIndexFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/router/index.tsx"),
    routesFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/router/routes.tsx"),
    runId,
    shellScaffoldFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/layout/shell-scaffold.tsx"),
    sidebarFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/layout/sidebar.tsx"),
    sourceDir: path.join(workspaceRoot, desktopV3SourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
    themeProviderFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/app/providers/theme-provider.tsx"),
  };
}
