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
export const desktopV3FeatureDir = "apps/desktop-v3/src/features";
export const desktopV3FeatureFileSet = Object.freeze([
  "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts",
  "apps/desktop-v3/src/features/diagnostics/diagnostics-formatters.ts",
  "apps/desktop-v3/src/features/diagnostics/diagnostics-types.ts",
  "apps/desktop-v3/src/features/preferences/preferences-api.ts",
  "apps/desktop-v3/src/features/preferences/preferences-store.ts",
  "apps/desktop-v3/src/features/preferences/preferences-types.ts",
]);
export const desktopV3AllowedDiagnosticsApiSurface = Object.freeze([
  "fn:getBackendLiveness",
  "fn:getBackendReadiness",
  "fn:getDiagnosticsOverview",
  "fn:getDiagnosticsSnapshot",
]);
export const desktopV3AllowedDiagnosticsFormatterSurface = Object.freeze([
  "fn:formatSecureStoreSummary",
]);
export const desktopV3AllowedDiagnosticsTypesSurface = Object.freeze([
  "interface:DiagnosticsOverview",
]);
export const desktopV3AllowedDiagnosticsOverviewProperties = Object.freeze([
  "liveness: BackendProbe",
  "local: DiagnosticsSnapshot",
  "readiness: BackendProbe",
]);
export const desktopV3AllowedPreferencesApiSurface = Object.freeze([
  "fn:getThemePreference",
  "fn:setThemePreference",
]);
export const desktopV3AllowedPreferencesStoreSurface = Object.freeze([
  "const:useThemePreferenceStore",
  "interface:ThemePreferenceState",
]);
export const desktopV3AllowedThemePreferenceStateProperties = Object.freeze([
  "setThemeMode: (themeMode: ThemeMode) => void",
  "themeMode: ThemeMode",
]);
export const desktopV3AllowedPreferencesTypesSurface = Object.freeze([
  "type:ThemeMode",
  "type:ThemePreference",
]);
export const desktopV3AllowedDiagnosticsApiExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
]);
export const desktopV3AllowedDiagnosticsFormatterExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
]);
export const desktopV3AllowedDiagnosticsTypesExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts",
]);
export const desktopV3AllowedPreferencesApiExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/providers/theme-provider.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedPreferencesStoreExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/providers/theme-provider.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedPreferencesTypesExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/providers/theme-provider.tsx",
  "apps/desktop-v3/src/features/preferences/preferences-api.ts",
  "apps/desktop-v3/src/features/preferences/preferences-store.ts",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_FEATURE_GOVERNANCE_RUN_ID?.trim();

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

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.cts`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.mts"),
    path.join(basePath, "index.cts"),
  ];

  return candidates.find((candidate) => path.extname(candidate).length > 0) ?? null;
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

      properties.push({
        filePath,
        line: lineOfNode(sourceFile, member),
        name: normalizeTypeScriptPropertyName(member.name, sourceFile),
        typeText: normalizeTypeScriptText(member.type.getText(sourceFile)),
      });
    }
  }

  return sortNamedEntries(properties);
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

export async function listDesktopV3FeatureFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectTypeScriptFiles(config.featureDir, readdirImpl);
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
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; rewrite the feature boundary before changing this ownership edge.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }
}

export async function collectDesktopV3FeatureGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const featureFilePaths = Array.isArray(options.featureFilePaths)
    ? options.featureFilePaths
    : await listDesktopV3FeatureFiles(config, options);
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

  const featureFiles = sortStrings(
    featureFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const scannedFiles = sortStrings(
    new Set(sourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath))),
  );

  addSurfaceDriftViolation({
    actualSurface: featureFiles,
    detail: `src/features file set drifted from the frozen Wave 1 feature boundary (${config.allowedFeatureFiles.join(", ")}). Rewrite diagnostics/preferences feature ownership before splitting or adding files here.`,
    entries: featureFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedFeatureFiles,
    filePath: desktopV3FeatureDir,
    kind: "feature-file-set-drift",
    violations,
    seenViolations,
  });

  const diagnosticsApiSource = await readSourceText(config.diagnosticsApiFilePath);
  const diagnosticsFormatterSource = await readSourceText(config.diagnosticsFormatterFilePath);
  const diagnosticsTypesSource = await readSourceText(config.diagnosticsTypesFilePath);
  const preferencesApiSource = await readSourceText(config.preferencesApiFilePath);
  const preferencesStoreSource = await readSourceText(config.preferencesStoreFilePath);
  const preferencesTypesSource = await readSourceText(config.preferencesTypesFilePath);

  const diagnosticsApiDeclarations = collectTypeScriptTopLevelDeclarations(
    diagnosticsApiSource,
    config.diagnosticsApiFilePath,
    { rootDir: config.rootDir },
  );
  const diagnosticsFormatterDeclarations = collectTypeScriptTopLevelDeclarations(
    diagnosticsFormatterSource,
    config.diagnosticsFormatterFilePath,
    { rootDir: config.rootDir },
  );
  const diagnosticsTypesDeclarations = collectTypeScriptTopLevelDeclarations(
    diagnosticsTypesSource,
    config.diagnosticsTypesFilePath,
    { rootDir: config.rootDir },
  );
  const preferencesApiDeclarations = collectTypeScriptTopLevelDeclarations(
    preferencesApiSource,
    config.preferencesApiFilePath,
    { rootDir: config.rootDir },
  );
  const preferencesStoreDeclarations = collectTypeScriptTopLevelDeclarations(
    preferencesStoreSource,
    config.preferencesStoreFilePath,
    { rootDir: config.rootDir },
  );
  const preferencesTypesDeclarations = collectTypeScriptTopLevelDeclarations(
    preferencesTypesSource,
    config.preferencesTypesFilePath,
    { rootDir: config.rootDir },
  );

  const diagnosticsApiSurface = formatDeclarationSurface(diagnosticsApiDeclarations);
  const diagnosticsFormatterSurface = formatDeclarationSurface(diagnosticsFormatterDeclarations);
  const diagnosticsTypesSurface = formatDeclarationSurface(diagnosticsTypesDeclarations);
  const diagnosticsOverviewProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      diagnosticsTypesSource,
      config.diagnosticsTypesFilePath,
      "DiagnosticsOverview",
      { rootDir: config.rootDir },
    ),
  );
  const preferencesApiSurface = formatDeclarationSurface(preferencesApiDeclarations);
  const preferencesStoreSurface = formatDeclarationSurface(preferencesStoreDeclarations);
  const themePreferenceStateProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      preferencesStoreSource,
      config.preferencesStoreFilePath,
      "ThemePreferenceState",
      { rootDir: config.rootDir },
    ),
  );
  const preferencesTypesSurface = formatDeclarationSurface(preferencesTypesDeclarations);

  addSurfaceDriftViolation({
    actualSurface: diagnosticsApiSurface,
    detail: `diagnostics-api drifted from the frozen Wave 1 feature surface (${config.allowedDiagnosticsApiSurface.join(", ")}). Rewrite diagnostics feature orchestration before adding helpers or new entrypoints here.`,
    entries: diagnosticsApiDeclarations,
    expectedSurface: config.allowedDiagnosticsApiSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsApiFilePath),
    kind: "diagnostics-api-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: diagnosticsFormatterSurface,
    detail: `diagnostics-formatters drifted from the frozen Wave 1 feature surface (${config.allowedDiagnosticsFormatterSurface.join(", ")}). Rewrite diagnostics presentation formatting before widening this module.`,
    entries: diagnosticsFormatterDeclarations,
    expectedSurface: config.allowedDiagnosticsFormatterSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsFormatterFilePath),
    kind: "diagnostics-formatter-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: diagnosticsTypesSurface,
    detail: `diagnostics-types drifted from the frozen Wave 1 feature surface (${config.allowedDiagnosticsTypesSurface.join(", ")}). Rewrite diagnostics feature contracts before changing local view-model types.`,
    entries: diagnosticsTypesDeclarations,
    expectedSurface: config.allowedDiagnosticsTypesSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsTypesFilePath),
    kind: "diagnostics-types-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: diagnosticsOverviewProperties,
    detail: `DiagnosticsOverview drifted from the frozen Wave 1 feature contract (${config.allowedDiagnosticsOverviewProperties.join(", ")}). Rewrite diagnostics aggregation before widening this view-model.`,
    entries: collectTypeScriptInterfaceProperties(
      diagnosticsTypesSource,
      config.diagnosticsTypesFilePath,
      "DiagnosticsOverview",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedDiagnosticsOverviewProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsTypesFilePath),
    kind: "diagnostics-overview-property-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: preferencesApiSurface,
    detail: `preferences-api drifted from the frozen Wave 1 feature surface (${config.allowedPreferencesApiSurface.join(", ")}). Rewrite preferences feature ownership before adding helpers or write paths here.`,
    entries: preferencesApiDeclarations,
    expectedSurface: config.allowedPreferencesApiSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesApiFilePath),
    kind: "preferences-api-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: preferencesStoreSurface,
    detail: `preferences-store drifted from the frozen Wave 1 feature surface (${config.allowedPreferencesStoreSurface.join(", ")}). Rewrite theme state ownership before widening the store module.`,
    entries: preferencesStoreDeclarations,
    expectedSurface: config.allowedPreferencesStoreSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesStoreFilePath),
    kind: "preferences-store-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: themePreferenceStateProperties,
    detail: `ThemePreferenceState drifted from the frozen Wave 1 state surface (${config.allowedThemePreferenceStateProperties.join(", ")}). Rewrite theme state orchestration before changing store shape.`,
    entries: collectTypeScriptInterfaceProperties(
      preferencesStoreSource,
      config.preferencesStoreFilePath,
      "ThemePreferenceState",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedThemePreferenceStateProperties,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesStoreFilePath),
    kind: "theme-preference-state-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: preferencesTypesSurface,
    detail: `preferences-types drifted from the frozen Wave 1 feature surface (${config.allowedPreferencesTypesSurface.join(", ")}). Keep runtime preference contracts re-exported through the feature boundary until the feature layer is rewritten.`,
    entries: preferencesTypesDeclarations,
    expectedSurface: config.allowedPreferencesTypesSurface,
    filePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesTypesFilePath),
    kind: "preferences-types-surface-drift",
    violations,
    seenViolations,
  });

  const diagnosticsApiReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsApiFilePath),
  });
  const diagnosticsFormatterReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsFormatterFilePath),
  });
  const diagnosticsTypesReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.diagnosticsTypesFilePath),
  });
  const preferencesApiReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesApiFilePath),
  });
  const preferencesStoreReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesStoreFilePath),
  });
  const preferencesTypesReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeWorkspaceRelativePath(config.rootDir, config.preferencesTypesFilePath),
  });

  const diagnosticsApiReferenceFiles = sortStrings(
    new Set(diagnosticsApiReferenceEntries.map((entry) => entry.filePath)),
  );
  const diagnosticsFormatterReferenceFiles = sortStrings(
    new Set(diagnosticsFormatterReferenceEntries.map((entry) => entry.filePath)),
  );
  const diagnosticsTypesReferenceFiles = sortStrings(
    new Set(diagnosticsTypesReferenceEntries.map((entry) => entry.filePath)),
  );
  const preferencesApiReferenceFiles = sortStrings(
    new Set(preferencesApiReferenceEntries.map((entry) => entry.filePath)),
  );
  const preferencesStoreReferenceFiles = sortStrings(
    new Set(preferencesStoreReferenceEntries.map((entry) => entry.filePath)),
  );
  const preferencesTypesReferenceFiles = sortStrings(
    new Set(preferencesTypesReferenceEntries.map((entry) => entry.filePath)),
  );

  addExternalReferenceViolations({
    actualReferenceEntries: diagnosticsApiReferenceEntries,
    allowedExternalReferenceFiles: config.allowedDiagnosticsApiExternalReferenceFiles,
    detail: `diagnostics-api escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedDiagnosticsApiExternalReferenceFiles.join(", ")} may hold diagnostics feature APIs directly.`,
    kind: "diagnostics-api-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: diagnosticsFormatterReferenceEntries,
    allowedExternalReferenceFiles: config.allowedDiagnosticsFormatterExternalReferenceFiles,
    detail: `diagnostics-formatters escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedDiagnosticsFormatterExternalReferenceFiles.join(", ")} may hold diagnostics presentation formatters directly.`,
    kind: "diagnostics-formatter-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: diagnosticsTypesReferenceEntries,
    allowedExternalReferenceFiles: config.allowedDiagnosticsTypesExternalReferenceFiles,
    detail: `diagnostics-types escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedDiagnosticsTypesExternalReferenceFiles.join(", ")} may depend on DiagnosticsOverview directly.`,
    kind: "diagnostics-types-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: preferencesApiReferenceEntries,
    allowedExternalReferenceFiles: config.allowedPreferencesApiExternalReferenceFiles,
    detail: `preferences-api escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedPreferencesApiExternalReferenceFiles.join(", ")} may hold preferences feature APIs directly.`,
    kind: "preferences-api-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: preferencesStoreReferenceEntries,
    allowedExternalReferenceFiles: config.allowedPreferencesStoreExternalReferenceFiles,
    detail: `preferences-store escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedPreferencesStoreExternalReferenceFiles.join(", ")} may hold theme preference state directly.`,
    kind: "preferences-store-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: preferencesTypesReferenceEntries,
    allowedExternalReferenceFiles: config.allowedPreferencesTypesExternalReferenceFiles,
    detail: `preferences-types escaped the frozen Wave 1 feature ownership boundary. Only ${config.allowedPreferencesTypesExternalReferenceFiles.join(", ")} may depend on feature preference types directly.`,
    kind: "preferences-types-external-reference",
    seenViolations,
    violations,
  });

  return {
    diagnosticsApiReferenceFiles,
    diagnosticsApiSurface,
    diagnosticsFormatterReferenceFiles,
    diagnosticsFormatterSurface,
    diagnosticsOverviewProperties,
    diagnosticsTypesReferenceFiles,
    diagnosticsTypesSurface,
    featureFiles,
    preferencesApiReferenceFiles,
    preferencesApiSurface,
    preferencesStoreReferenceFiles,
    preferencesStoreSurface,
    preferencesTypesReferenceFiles,
    preferencesTypesSurface,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    themePreferenceStateProperties,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3FeatureGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedDiagnosticsApiExternalReferenceFiles: [...config.allowedDiagnosticsApiExternalReferenceFiles],
      allowedDiagnosticsApiSurface: [...config.allowedDiagnosticsApiSurface],
      allowedDiagnosticsFormatterExternalReferenceFiles: [...config.allowedDiagnosticsFormatterExternalReferenceFiles],
      allowedDiagnosticsFormatterSurface: [...config.allowedDiagnosticsFormatterSurface],
      allowedDiagnosticsOverviewProperties: [...config.allowedDiagnosticsOverviewProperties],
      allowedDiagnosticsTypesExternalReferenceFiles: [...config.allowedDiagnosticsTypesExternalReferenceFiles],
      allowedDiagnosticsTypesSurface: [...config.allowedDiagnosticsTypesSurface],
      allowedFeatureFiles: [...config.allowedFeatureFiles],
      allowedPreferencesApiExternalReferenceFiles: [...config.allowedPreferencesApiExternalReferenceFiles],
      allowedPreferencesApiSurface: [...config.allowedPreferencesApiSurface],
      allowedPreferencesStoreExternalReferenceFiles: [...config.allowedPreferencesStoreExternalReferenceFiles],
      allowedPreferencesStoreSurface: [...config.allowedPreferencesStoreSurface],
      allowedPreferencesTypesExternalReferenceFiles: [...config.allowedPreferencesTypesExternalReferenceFiles],
      allowedPreferencesTypesSurface: [...config.allowedPreferencesTypesSurface],
      allowedThemePreferenceStateProperties: [...config.allowedThemePreferenceStateProperties],
      checkedAt: null,
      diagnosticsApiReferenceFiles: [],
      diagnosticsApiSurface: [],
      diagnosticsFormatterReferenceFiles: [],
      diagnosticsFormatterSurface: [],
      diagnosticsOverviewProperties: [],
      diagnosticsTypesReferenceFiles: [],
      diagnosticsTypesSurface: [],
      error: null,
      featureFiles: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      preferencesApiReferenceFiles: [],
      preferencesApiSurface: [],
      preferencesStoreReferenceFiles: [],
      preferencesStoreSurface: [],
      preferencesTypesReferenceFiles: [],
      preferencesTypesSurface: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      themePreferenceStateProperties: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3FeatureGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 feature governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 feature governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3FeatureGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_FEATURE_GOVERNANCE_OUTPUT_DIR?.trim()
    || path.join(workspaceRoot, "output", "verification", `desktop-v3-feature-governance-${runId}`);

  return {
    allowedDiagnosticsApiExternalReferenceFiles: [...desktopV3AllowedDiagnosticsApiExternalReferenceFiles],
    allowedDiagnosticsApiSurface: [...desktopV3AllowedDiagnosticsApiSurface],
    allowedDiagnosticsFormatterExternalReferenceFiles: [...desktopV3AllowedDiagnosticsFormatterExternalReferenceFiles],
    allowedDiagnosticsFormatterSurface: [...desktopV3AllowedDiagnosticsFormatterSurface],
    allowedDiagnosticsOverviewProperties: [...desktopV3AllowedDiagnosticsOverviewProperties],
    allowedDiagnosticsTypesExternalReferenceFiles: [...desktopV3AllowedDiagnosticsTypesExternalReferenceFiles],
    allowedDiagnosticsTypesSurface: [...desktopV3AllowedDiagnosticsTypesSurface],
    allowedFeatureFiles: [...desktopV3FeatureFileSet],
    allowedPreferencesApiExternalReferenceFiles: [...desktopV3AllowedPreferencesApiExternalReferenceFiles],
    allowedPreferencesApiSurface: [...desktopV3AllowedPreferencesApiSurface],
    allowedPreferencesStoreExternalReferenceFiles: [...desktopV3AllowedPreferencesStoreExternalReferenceFiles],
    allowedPreferencesStoreSurface: [...desktopV3AllowedPreferencesStoreSurface],
    allowedPreferencesTypesExternalReferenceFiles: [...desktopV3AllowedPreferencesTypesExternalReferenceFiles],
    allowedPreferencesTypesSurface: [...desktopV3AllowedPreferencesTypesSurface],
    allowedThemePreferenceStateProperties: [...desktopV3AllowedThemePreferenceStateProperties],
    diagnosticsApiFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts"),
    diagnosticsFormatterFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/diagnostics/diagnostics-formatters.ts"),
    diagnosticsTypesFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/diagnostics/diagnostics-types.ts"),
    featureDir: path.join(workspaceRoot, desktopV3FeatureDir),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-feature-governance-summary.json",
    ),
    outputDir,
    preferencesApiFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/preferences/preferences-api.ts"),
    preferencesStoreFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/preferences/preferences-store.ts"),
    preferencesTypesFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/features/preferences/preferences-types.ts"),
    rootDir: workspaceRoot,
    runId,
    sourceDir: path.join(workspaceRoot, desktopV3SourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
