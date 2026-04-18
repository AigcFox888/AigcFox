import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RouteRegistryFilePath = path.join(
  rootDir,
  "apps/desktop-v3/src/app/router/route-registry.ts",
);

function createTypeScriptSourceFile(sourceText, absoluteFilePath) {
  return ts.createSourceFile(
    absoluteFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function unwrapTypeScriptExpression(expression) {
  let currentExpression = expression;

  while (
    ts.isAsExpression(currentExpression)
    || ts.isSatisfiesExpression(currentExpression)
    || ts.isParenthesizedExpression(currentExpression)
  ) {
    currentExpression = currentExpression.expression;
  }

  return currentExpression;
}

function readTypeScriptPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteralLike(nameNode)) {
    return nameNode.text;
  }

  return null;
}

export function collectDesktopV3RoutePathEntriesFromSource(
  sourceText,
  absoluteFilePath = desktopV3RouteRegistryFilePath,
) {
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name)
        || declaration.name.text !== "desktopV3RoutePathById"
        || declaration.initializer === undefined
      ) {
        continue;
      }

      const initializer = unwrapTypeScriptExpression(declaration.initializer);

      if (!ts.isObjectLiteralExpression(initializer)) {
        continue;
      }

      return initializer.properties.flatMap((property) => {
        if (
          !ts.isPropertyAssignment(property)
          || !ts.isStringLiteralLike(property.initializer)
        ) {
          return [];
        }

        const routeId = readTypeScriptPropertyName(property.name);

        if (!routeId) {
          return [];
        }

        return [
          {
            id: routeId,
            path: property.initializer.text,
          },
        ];
      });
    }
  }

  return [];
}

export function buildDesktopV3ResponsiveSmokeRouteHash(routePath) {
  return routePath === "/" ? "#/" : `#${routePath}`;
}

export function buildDesktopV3ResponsiveSmokeRouteHref(routePath) {
  return `/${buildDesktopV3ResponsiveSmokeRouteHash(routePath)}`;
}

export function buildDesktopV3ResponsiveSmokeRoutes(routeEntries) {
  return Object.freeze(
    routeEntries.map((routeEntry) =>
      Object.freeze({
        hash: buildDesktopV3ResponsiveSmokeRouteHash(routeEntry.path),
        href: buildDesktopV3ResponsiveSmokeRouteHref(routeEntry.path),
        key: routeEntry.id,
        testId: `desktop-v3-${routeEntry.id}-page`,
      })),
  );
}

export function loadDesktopV3ResponsiveSmokeRoutes(options = {}) {
  const routeRegistryFilePath = options.routeRegistryFilePath ?? desktopV3RouteRegistryFilePath;
  const sourceText = options.sourceText ?? fs.readFileSync(routeRegistryFilePath, "utf8");
  const routeEntries = collectDesktopV3RoutePathEntriesFromSource(sourceText, routeRegistryFilePath);

  if (routeEntries.length === 0) {
    throw new Error(
      `Could not resolve desktop-v3 route truth from ${routeRegistryFilePath}.`,
    );
  }

  return buildDesktopV3ResponsiveSmokeRoutes(routeEntries);
}

export function findDesktopV3ResponsiveSmokeRoute(routeKey, routes = desktopV3ResponsiveSmokeRoutes) {
  return routes.find((route) => route.key === routeKey) ?? null;
}

export function buildDesktopV3ResponsiveSmokeRouteHelpLine(
  routes = desktopV3ResponsiveSmokeRoutes,
) {
  return routes.map((route) => route.href).join("  ");
}

export const desktopV3ResponsiveSmokeRoutes = loadDesktopV3ResponsiveSmokeRoutes();
