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
export const desktopV3RuntimeDir = "apps/desktop-v3/src/lib/runtime";
export const desktopV3RuntimeAdapterFileSet = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/contracts.ts",
  "apps/desktop-v3/src/lib/runtime/desktop-runtime.ts",
  "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
  "apps/desktop-v3/src/lib/runtime/mock-fixtures.ts",
  "apps/desktop-v3/src/lib/runtime/runtime-mode.ts",
  "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts",
]);
export const desktopV3AllowedMockRuntimeExports = Object.freeze([
  "class:MockCommandRuntime",
]);
export const desktopV3AllowedMockRuntimeFieldSurface = Object.freeze([
  "private:lastBackendProbeAt",
  "private:themeMode",
]);
export const desktopV3AllowedMockRuntimePublicMethods = Object.freeze([
  "getBackendLiveness",
  "getBackendReadiness",
  "getDiagnosticsSnapshot",
  "getThemePreference",
  "reportRendererBoot",
  "setThemePreference",
]);
export const desktopV3AllowedMockFixtureExports = Object.freeze([
  "fn:buildMockBackendProbe",
  "fn:buildMockDiagnosticsSnapshot",
  "fn:buildMockThemePreference",
]);
export const desktopV3AllowedRuntimeModeExports = Object.freeze([
  "fn:normalizeDesktopRuntimeMode",
  "fn:resolveDesktopRuntimeMode",
  "type:DesktopRuntimeMode",
]);
export const desktopV3AllowedRuntimeModeValues = Object.freeze([
  "mock",
  "tauri",
]);
export const desktopV3AllowedRuntimeRegistryExports = Object.freeze([
  "fn:getDesktopRuntime",
  "fn:resetDesktopRuntimeForTest",
]);
export const desktopV3AllowedTauriBridgeExports = Object.freeze([
  "fn:loadTauriInvoke",
  "fn:waitForTauriInvokeBridge",
]);
export const desktopV3AllowedTauriCommandRuntimeExports = Object.freeze([
  "class:TauriCommandRuntime",
]);
export const desktopV3AllowedTauriCommandRuntimeFieldSurface = Object.freeze([
  "private:invokePromise",
  "private:loadInvoke",
]);
export const desktopV3AllowedTauriCommandRuntimePublicMethods = Object.freeze([
  "getBackendLiveness",
  "getBackendReadiness",
  "getDiagnosticsSnapshot",
  "getThemePreference",
  "reportRendererBoot",
  "setThemePreference",
]);
export const desktopV3AllowedTauriCommandRuntimePrivateMethods = Object.freeze([
  "getInvoke",
  "invokeCommand",
]);
export const desktopV3AllowedTauriInvokeExports = Object.freeze([
  "type:TauriInvoke",
]);
export const desktopV3AllowedTauriInvokeTypeText =
  "<TResult>(command: string, payload?: Record<string, unknown>) => Promise<TResult>";
export const desktopV3AllowedTauriTouchFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
]);
export const desktopV3AllowedBridgeGlobalTouchFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
]);
export const desktopV3AllowedRuntimeRegistryExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/bootstrap/renderer-ready.ts",
  "apps/desktop-v3/src/features/diagnostics/diagnostics-api.ts",
  "apps/desktop-v3/src/features/preferences/preferences-api.ts",
]);
export const desktopV3AllowedRuntimeModeExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/bootstrap/renderer-ready.ts",
  "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
]);
export const desktopV3AllowedTauriBridgeExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
]);
export const desktopV3AllowedTauriCommandRuntimeExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
]);
export const desktopV3AllowedMockCommandRuntimeExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
]);
export const desktopV3AllowedMockFixtureExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
]);
export const desktopV3AllowedTauriInvokeExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
]);

const tauriPackagePattern = /@tauri-apps\//u;
const bridgeGlobalPatterns = Object.freeze([
  /\b__TAURI_INTERNALS__\b/u,
  /\b__TAURI__\b/u,
]);
const runtimeRegistryReferencePatterns = Object.freeze([
  /\bgetDesktopRuntime\b/u,
  /\bresetDesktopRuntimeForTest\b/u,
]);
const runtimeModeReferencePatterns = Object.freeze([
  /\bnormalizeDesktopRuntimeMode\b/u,
  /\bresolveDesktopRuntimeMode\b/u,
  /\bDesktopRuntimeMode\b/u,
]);
const tauriBridgeReferencePatterns = Object.freeze([
  /\bwaitForTauriInvokeBridge\b/u,
  /\bloadTauriInvoke\b/u,
]);
const tauriCommandRuntimeReferencePatterns = Object.freeze([
  /\bTauriCommandRuntime\b/u,
]);
const mockCommandRuntimeReferencePatterns = Object.freeze([
  /\bMockCommandRuntime\b/u,
]);
const mockFixtureReferencePatterns = Object.freeze([
  /\bbuildMockThemePreference\b/u,
  /\bbuildMockDiagnosticsSnapshot\b/u,
  /\bbuildMockBackendProbe\b/u,
]);
const tauriInvokeReferencePatterns = Object.freeze([
  /\bTauriInvoke\b/u,
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_RUN_ID?.trim();

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

function hasExportModifier(node) {
  return Array.isArray(node.modifiers)
    && node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function classifyTypeScriptVisibility(node) {
  if (!Array.isArray(node.modifiers)) {
    return "public";
  }

  if (node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)) {
    return "private";
  }

  if (node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword)) {
    return "protected";
  }

  return "public";
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

function normalizeTypeScriptPropertyName(nameNode, sourceFile) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteralLike(nameNode)) {
    return nameNode.text;
  }

  return nameNode.getText(sourceFile);
}

function lineOfNode(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function findPatternLocation(sourceText, patterns) {
  const lines = sourceText.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    for (const pattern of patterns) {
      if (pattern instanceof RegExp) {
        const match = lines[index].match(pattern);

        if (match?.index !== undefined) {
          return {
            column: match.index + 1,
            line: index + 1,
          };
        }

        continue;
      }

      const column = lines[index].indexOf(pattern);

      if (column !== -1) {
        return {
          column: column + 1,
          line: index + 1,
        };
      }
    }
  }

  return {
    column: 1,
    line: 1,
  };
}

export function collectTypeScriptExportedTopLevelMembers(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const members = [];

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      members.push({
        filePath,
        kind: "class",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      members.push({
        filePath,
        kind: "fn",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      members.push({
        filePath,
        kind: "type",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      members.push({
        filePath,
        kind: "interface",
        line: lineOfNode(sourceFile, statement),
        name: statement.name.text,
      });
    }
  }

  return sortNamedEntries(members);
}

export function collectTypeScriptClassFields(sourceText, absoluteFilePath, className, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const fields = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || statement.name?.text !== className) {
      continue;
    }

    for (const member of statement.members) {
      if (!ts.isPropertyDeclaration(member) || member.name === undefined) {
        continue;
      }

      fields.push({
        filePath,
        line: lineOfNode(sourceFile, member),
        name: normalizeTypeScriptPropertyName(member.name, sourceFile),
        visibility: classifyTypeScriptVisibility(member),
      });
    }
  }

  return sortNamedEntries(fields);
}

export function collectTypeScriptClassMethods(sourceText, absoluteFilePath, className, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const methods = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || statement.name?.text !== className) {
      continue;
    }

    for (const member of statement.members) {
      if (!ts.isMethodDeclaration(member) || member.name === undefined) {
        continue;
      }

      methods.push({
        filePath,
        line: lineOfNode(sourceFile, member),
        name: normalizeTypeScriptPropertyName(member.name, sourceFile),
        visibility: classifyTypeScriptVisibility(member),
      });
    }
  }

  return sortNamedEntries(methods);
}

export function collectTypeScriptExportedTypeAliasUnionValues(
  sourceText,
  absoluteFilePath,
  aliasName,
) {
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);

  for (const statement of sourceFile.statements) {
    if (
      ts.isTypeAliasDeclaration(statement)
      && hasExportModifier(statement)
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

export function collectTypeScriptExportedTypeAliasText(
  sourceText,
  absoluteFilePath,
  aliasName,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);

  for (const statement of sourceFile.statements) {
    if (
      ts.isTypeAliasDeclaration(statement)
      && hasExportModifier(statement)
      && statement.name.text === aliasName
    ) {
      return {
        filePath,
        line: lineOfNode(sourceFile, statement),
        name: aliasName,
        typeText: normalizeTypeScriptText(statement.type.getText(sourceFile)),
      };
    }
  }

  return null;
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

async function listDesktopV3RuntimeFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectTypeScriptFiles(config.runtimeDir, readdirImpl);
}

async function listDesktopV3SourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectTypeScriptFiles(config.sourceDir, readdirImpl);
}

function formatFieldSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.visibility}:${entry.name}`));
}

function collectReferenceFiles({
  config,
  filePaths,
  patterns,
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

      if (patterns.some((pattern) => pattern.test(sourceText))) {
        references.push(filePath);
      }
    }),
  ).then(() => sortStrings(new Set(references)));
}

function addExternalReferenceViolations({
  actualReferenceFiles,
  allowedExternalReferenceFiles,
  config,
  detail,
  kind,
  patterns,
  readSourceTextByRelativePath,
  seenViolations,
  violations,
}) {
  for (const filePath of actualReferenceFiles) {
    if (allowedExternalReferenceFiles.includes(filePath)) {
      continue;
    }

    const sourceText = readSourceTextByRelativePath(filePath);
    const location = findPatternLocation(sourceText, patterns);

    addViolation(violations, seenViolations, {
      column: location.column,
      detail,
      filePath,
      kind,
      line: location.line,
    });
  }

  for (const expectedFilePath of allowedExternalReferenceFiles) {
    if (actualReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; rewrite the adapter boundary before changing this ownership edge.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }
}

export async function collectDesktopV3RuntimeAdapterGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const runtimeFilePaths = Array.isArray(options.runtimeFilePaths)
    ? options.runtimeFilePaths
    : await listDesktopV3RuntimeFiles(config, options);
  const sourceFilePaths = Array.isArray(options.sourceFilePaths)
    ? options.sourceFilePaths
    : await listDesktopV3SourceFiles(config, options);
  const violations = [];
  const seenViolations = new Set();
  const sourceTextByAbsolutePath = new Map();
  const sourceTextByRelativePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByAbsolutePath.has(filePath)) {
      const sourceText = await readFileImpl(filePath, "utf8");
      sourceTextByAbsolutePath.set(filePath, sourceText);
      sourceTextByRelativePath.set(
        normalizeWorkspaceRelativePath(config.rootDir, filePath),
        sourceText,
      );
    }

    return sourceTextByAbsolutePath.get(filePath);
  }

  function readSourceTextByRelativePath(filePath) {
    return sourceTextByRelativePath.get(filePath) ?? "";
  }

  const runtimeFiles = sortStrings(
    runtimeFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const scannedFiles = sortStrings(
    new Set(sourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath))),
  );

  addSurfaceDriftViolation({
    actualSurface: runtimeFiles,
    detail: `src/lib/runtime file set drifted from the frozen Wave 1 adapter boundary (${config.allowedRuntimeAdapterFiles.join(", ")}). Rewrite the renderer runtime adapter layer before splitting or adding helper files here.`,
    entries: runtimeFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedRuntimeAdapterFiles,
    filePath: desktopV3RuntimeDir,
    kind: "runtime-adapter-file-set-drift",
    violations,
    seenViolations,
  });

  const mockRuntimeSourceText = await readSourceText(config.mockRuntimeFilePath);
  const mockFixtureSourceText = await readSourceText(config.mockFixtureFilePath);
  const runtimeModeSourceText = await readSourceText(config.runtimeModeFilePath);
  const runtimeRegistrySourceText = await readSourceText(config.runtimeRegistryFilePath);
  const tauriBridgeSourceText = await readSourceText(config.tauriBridgeFilePath);
  const tauriCommandRuntimeSourceText = await readSourceText(config.tauriCommandRuntimeFilePath);
  const tauriInvokeSourceText = await readSourceText(config.tauriInvokeFilePath);

  const mockRuntimeExports = collectTypeScriptExportedTopLevelMembers(
    mockRuntimeSourceText,
    config.mockRuntimeFilePath,
    { rootDir: config.rootDir },
  );
  const mockRuntimeFields = collectTypeScriptClassFields(
    mockRuntimeSourceText,
    config.mockRuntimeFilePath,
    "MockCommandRuntime",
    { rootDir: config.rootDir },
  );
  const mockRuntimeMethods = collectTypeScriptClassMethods(
    mockRuntimeSourceText,
    config.mockRuntimeFilePath,
    "MockCommandRuntime",
    { rootDir: config.rootDir },
  );
  const mockFixtureExports = collectTypeScriptExportedTopLevelMembers(
    mockFixtureSourceText,
    config.mockFixtureFilePath,
    { rootDir: config.rootDir },
  );
  const runtimeModeExports = collectTypeScriptExportedTopLevelMembers(
    runtimeModeSourceText,
    config.runtimeModeFilePath,
    { rootDir: config.rootDir },
  );
  const runtimeModeValues = collectTypeScriptExportedTypeAliasUnionValues(
    runtimeModeSourceText,
    config.runtimeModeFilePath,
    "DesktopRuntimeMode",
  );
  const runtimeRegistryExports = collectTypeScriptExportedTopLevelMembers(
    runtimeRegistrySourceText,
    config.runtimeRegistryFilePath,
    { rootDir: config.rootDir },
  );
  const tauriBridgeExports = collectTypeScriptExportedTopLevelMembers(
    tauriBridgeSourceText,
    config.tauriBridgeFilePath,
    { rootDir: config.rootDir },
  );
  const tauriCommandRuntimeExports = collectTypeScriptExportedTopLevelMembers(
    tauriCommandRuntimeSourceText,
    config.tauriCommandRuntimeFilePath,
    { rootDir: config.rootDir },
  );
  const tauriCommandRuntimeFields = collectTypeScriptClassFields(
    tauriCommandRuntimeSourceText,
    config.tauriCommandRuntimeFilePath,
    "TauriCommandRuntime",
    { rootDir: config.rootDir },
  );
  const tauriCommandRuntimeMethods = collectTypeScriptClassMethods(
    tauriCommandRuntimeSourceText,
    config.tauriCommandRuntimeFilePath,
    "TauriCommandRuntime",
    { rootDir: config.rootDir },
  );
  const tauriInvokeExports = collectTypeScriptExportedTopLevelMembers(
    tauriInvokeSourceText,
    config.tauriInvokeFilePath,
    { rootDir: config.rootDir },
  );
  const tauriInvokeType = collectTypeScriptExportedTypeAliasText(
    tauriInvokeSourceText,
    config.tauriInvokeFilePath,
    "TauriInvoke",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: mockRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `MockCommandRuntime exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedMockRuntimeExports.join(", ")}).`,
    entries: mockRuntimeExports,
    expectedSurface: config.allowedMockRuntimeExports,
    filePath: "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
    kind: "runtime-adapter-mock-runtime-export-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: formatFieldSurface(mockRuntimeFields),
    detail: `MockCommandRuntime field surface drifted from the frozen Wave 1 adapter boundary (${config.allowedMockRuntimeFieldSurface.join(", ")}).`,
    entries: mockRuntimeFields,
    expectedSurface: config.allowedMockRuntimeFieldSurface,
    filePath: "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
    kind: "runtime-adapter-mock-runtime-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: mockRuntimeMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `MockCommandRuntime public methods drifted from the frozen Wave 1 adapter surface (${config.allowedMockRuntimePublicMethods.join(", ")}).`,
    entries: mockRuntimeMethods,
    expectedSurface: config.allowedMockRuntimePublicMethods,
    filePath: "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
    kind: "runtime-adapter-mock-runtime-public-method-drift",
    violations,
    seenViolations,
  });
  for (const method of mockRuntimeMethods.filter((entry) => entry.visibility !== "public")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "MockCommandRuntime must stay as the simple public Wave 1 preview adapter. Do not hide helper methods inside it; rewrite the mock adapter first.",
      filePath: method.filePath,
      kind: `runtime-adapter-mock-runtime-${method.visibility}-method`,
      line: method.line,
    });
  }

  addSurfaceDriftViolation({
    actualSurface: mockFixtureExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `mock-fixtures exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedMockFixtureExports.join(", ")}).`,
    entries: mockFixtureExports,
    expectedSurface: config.allowedMockFixtureExports,
    filePath: "apps/desktop-v3/src/lib/runtime/mock-fixtures.ts",
    kind: "runtime-adapter-mock-fixture-export-drift",
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: runtimeModeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `runtime-mode exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedRuntimeModeExports.join(", ")}).`,
    entries: runtimeModeExports,
    expectedSurface: config.allowedRuntimeModeExports,
    filePath: "apps/desktop-v3/src/lib/runtime/runtime-mode.ts",
    kind: "runtime-adapter-runtime-mode-export-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: runtimeModeValues,
    detail: `DesktopRuntimeMode values drifted from the frozen Wave 1 adapter set (${config.allowedRuntimeModeValues.join(", ")}).`,
    entries: runtimeModeExports.filter((entry) => entry.name === "DesktopRuntimeMode"),
    expectedSurface: config.allowedRuntimeModeValues,
    filePath: "apps/desktop-v3/src/lib/runtime/runtime-mode.ts",
    kind: "runtime-adapter-runtime-mode-value-drift",
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: runtimeRegistryExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `runtime-registry exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedRuntimeRegistryExports.join(", ")}).`,
    entries: runtimeRegistryExports,
    expectedSurface: config.allowedRuntimeRegistryExports,
    filePath: "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
    kind: "runtime-adapter-runtime-registry-export-drift",
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: tauriBridgeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `tauri-bridge exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriBridgeExports.join(", ")}).`,
    entries: tauriBridgeExports,
    expectedSurface: config.allowedTauriBridgeExports,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
    kind: "runtime-adapter-tauri-bridge-export-drift",
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: tauriCommandRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `TauriCommandRuntime exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriCommandRuntimeExports.join(", ")}).`,
    entries: tauriCommandRuntimeExports,
    expectedSurface: config.allowedTauriCommandRuntimeExports,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
    kind: "runtime-adapter-tauri-command-runtime-export-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: formatFieldSurface(tauriCommandRuntimeFields),
    detail: `TauriCommandRuntime field surface drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriCommandRuntimeFieldSurface.join(", ")}).`,
    entries: tauriCommandRuntimeFields,
    expectedSurface: config.allowedTauriCommandRuntimeFieldSurface,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
    kind: "runtime-adapter-tauri-command-runtime-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: tauriCommandRuntimeMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `TauriCommandRuntime public methods drifted from the frozen Wave 1 adapter surface (${config.allowedTauriCommandRuntimePublicMethods.join(", ")}).`,
    entries: tauriCommandRuntimeMethods,
    expectedSurface: config.allowedTauriCommandRuntimePublicMethods,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
    kind: "runtime-adapter-tauri-command-runtime-public-method-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: tauriCommandRuntimeMethods.filter((entry) => entry.visibility === "private").map((entry) => entry.name),
    detail: `TauriCommandRuntime private helper set drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriCommandRuntimePrivateMethods.join(", ")}).`,
    entries: tauriCommandRuntimeMethods,
    expectedSurface: config.allowedTauriCommandRuntimePrivateMethods,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
    kind: "runtime-adapter-tauri-command-runtime-private-method-drift",
    violations,
    seenViolations,
  });
  for (const method of tauriCommandRuntimeMethods.filter((entry) => entry.visibility === "protected")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "TauriCommandRuntime must stay closed over a single concrete adapter implementation. Protected helper hooks are not allowed in the frozen Wave 1 boundary.",
      filePath: method.filePath,
      kind: "runtime-adapter-tauri-command-runtime-protected-method",
      line: method.line,
    });
  }

  addSurfaceDriftViolation({
    actualSurface: tauriInvokeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `tauri-invoke exported surface drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriInvokeExports.join(", ")}).`,
    entries: tauriInvokeExports,
    expectedSurface: config.allowedTauriInvokeExports,
    filePath: "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts",
    kind: "runtime-adapter-tauri-invoke-export-drift",
    violations,
    seenViolations,
  });
  if (tauriInvokeType?.typeText !== config.allowedTauriInvokeTypeText) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `TauriInvoke type drifted from the frozen Wave 1 adapter boundary. Expected ${config.allowedTauriInvokeTypeText}, but found ${tauriInvokeType?.typeText ?? "missing"}.`,
      filePath: "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts",
      kind: "runtime-adapter-tauri-invoke-type-drift",
      line: tauriInvokeType?.line ?? 1,
    });
  }

  const tauriTouchFiles = [];
  const bridgeGlobalTouchFiles = [];

  for (const absoluteFilePath of runtimeFilePaths) {
    const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);
    const sourceText = await readSourceText(absoluteFilePath);

    if (tauriPackagePattern.test(sourceText)) {
      tauriTouchFiles.push(filePath);
    }

    if (bridgeGlobalPatterns.some((pattern) => pattern.test(sourceText))) {
      bridgeGlobalTouchFiles.push(filePath);
    }
  }

  addSurfaceDriftViolation({
    actualSurface: tauriTouchFiles,
    detail: `Runtime-side @tauri-apps touch files drifted from the frozen Wave 1 adapter boundary (${config.allowedTauriTouchFiles.join(", ")}). Keep all Tauri package imports inside the current bridge file until the adapter layer is structurally rewritten.`,
    entries: tauriTouchFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedTauriTouchFiles,
    filePath: desktopV3RuntimeDir,
    kind: "runtime-adapter-tauri-touch-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: bridgeGlobalTouchFiles,
    detail: `Runtime-side Tauri bridge global touch files drifted from the frozen Wave 1 adapter boundary (${config.allowedBridgeGlobalTouchFiles.join(", ")}). Keep global bridge probing isolated to tauri-bridge.ts.`,
    entries: bridgeGlobalTouchFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedBridgeGlobalTouchFiles,
    filePath: desktopV3RuntimeDir,
    kind: "runtime-adapter-bridge-global-drift",
    violations,
    seenViolations,
  });

  const mockFixtureReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: mockFixtureReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/mock-fixtures.ts",
  });
  const runtimeModeReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: runtimeModeReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/runtime-mode.ts",
  });
  const runtimeRegistryReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: runtimeRegistryReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/runtime-registry.ts",
  });
  const tauriBridgeReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: tauriBridgeReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts",
  });
  const tauriCommandRuntimeReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: tauriCommandRuntimeReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
  });
  const mockCommandRuntimeReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: mockCommandRuntimeReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
  });
  const tauriInvokeReferenceFiles = await collectReferenceFiles({
    config,
    filePaths: sourceFilePaths,
    patterns: tauriInvokeReferencePatterns,
    readSourceText,
    selfFilePath: "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts",
  });

  addExternalReferenceViolations({
    actualReferenceFiles: mockFixtureReferenceFiles,
    allowedExternalReferenceFiles: config.allowedMockFixtureExternalReferenceFiles,
    config,
    detail: `mock-fixtures escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedMockFixtureExternalReferenceFiles.join(", ")} may depend on these helpers.`,
    kind: "runtime-adapter-mock-fixture-reference-drift",
    patterns: mockFixtureReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: runtimeModeReferenceFiles,
    allowedExternalReferenceFiles: config.allowedRuntimeModeExternalReferenceFiles,
    config,
    detail: `runtime-mode escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedRuntimeModeExternalReferenceFiles.join(", ")} may resolve or normalize runtime mode directly.`,
    kind: "runtime-adapter-runtime-mode-reference-drift",
    patterns: runtimeModeReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: runtimeRegistryReferenceFiles,
    allowedExternalReferenceFiles: config.allowedRuntimeRegistryExternalReferenceFiles,
    config,
    detail: `runtime-registry escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedRuntimeRegistryExternalReferenceFiles.join(", ")} may acquire the renderer runtime directly.`,
    kind: "runtime-adapter-runtime-registry-reference-drift",
    patterns: runtimeRegistryReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: tauriBridgeReferenceFiles,
    allowedExternalReferenceFiles: config.allowedTauriBridgeExternalReferenceFiles,
    config,
    detail: `tauri-bridge escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedTauriBridgeExternalReferenceFiles.join(", ")} may load the invoke bridge directly.`,
    kind: "runtime-adapter-tauri-bridge-reference-drift",
    patterns: tauriBridgeReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: tauriCommandRuntimeReferenceFiles,
    allowedExternalReferenceFiles: config.allowedTauriCommandRuntimeExternalReferenceFiles,
    config,
    detail: `TauriCommandRuntime escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedTauriCommandRuntimeExternalReferenceFiles.join(", ")} may instantiate or reference it directly.`,
    kind: "runtime-adapter-tauri-command-runtime-reference-drift",
    patterns: tauriCommandRuntimeReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: mockCommandRuntimeReferenceFiles,
    allowedExternalReferenceFiles: config.allowedMockCommandRuntimeExternalReferenceFiles,
    config,
    detail: `MockCommandRuntime escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedMockCommandRuntimeExternalReferenceFiles.join(", ")} may instantiate or reference it directly.`,
    kind: "runtime-adapter-mock-command-runtime-reference-drift",
    patterns: mockCommandRuntimeReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceFiles: tauriInvokeReferenceFiles,
    allowedExternalReferenceFiles: config.allowedTauriInvokeExternalReferenceFiles,
    config,
    detail: `TauriInvoke escaped the frozen Wave 1 adapter ownership boundary. Only ${config.allowedTauriInvokeExternalReferenceFiles.join(", ")} may depend on this bridge type directly.`,
    kind: "runtime-adapter-tauri-invoke-reference-drift",
    patterns: tauriInvokeReferencePatterns,
    readSourceTextByRelativePath,
    seenViolations,
    violations,
  });

  return {
    bridgeGlobalTouchFiles: sortStrings(bridgeGlobalTouchFiles),
    mockCommandRuntimeReferenceFiles,
    mockFixtureExports,
    mockFixtureReferenceFiles,
    mockRuntimeExports,
    mockRuntimeFields,
    mockRuntimeMethods,
    runtimeFiles,
    runtimeModeExports,
    runtimeModeReferenceFiles,
    runtimeModeValues,
    runtimeRegistryExports,
    runtimeRegistryReferenceFiles,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    tauriBridgeExports,
    tauriBridgeReferenceFiles,
    tauriCommandRuntimeExports,
    tauriCommandRuntimeFields,
    tauriCommandRuntimeMethods,
    tauriCommandRuntimeReferenceFiles,
    tauriInvokeExports,
    tauriInvokeReferenceFiles,
    tauriInvokeType,
    tauriTouchFiles: sortStrings(tauriTouchFiles),
    violations: sortViolations(violations),
  };
}

export function createDesktopV3RuntimeAdapterGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedBridgeGlobalTouchFiles: [...config.allowedBridgeGlobalTouchFiles],
      allowedMockCommandRuntimeExternalReferenceFiles: [...config.allowedMockCommandRuntimeExternalReferenceFiles],
      allowedMockFixtureExports: [...config.allowedMockFixtureExports],
      allowedMockFixtureExternalReferenceFiles: [...config.allowedMockFixtureExternalReferenceFiles],
      allowedMockRuntimeExports: [...config.allowedMockRuntimeExports],
      allowedMockRuntimeFieldSurface: [...config.allowedMockRuntimeFieldSurface],
      allowedMockRuntimePublicMethods: [...config.allowedMockRuntimePublicMethods],
      allowedRuntimeAdapterFiles: [...config.allowedRuntimeAdapterFiles],
      allowedRuntimeModeExports: [...config.allowedRuntimeModeExports],
      allowedRuntimeModeExternalReferenceFiles: [...config.allowedRuntimeModeExternalReferenceFiles],
      allowedRuntimeModeValues: [...config.allowedRuntimeModeValues],
      allowedRuntimeRegistryExports: [...config.allowedRuntimeRegistryExports],
      allowedRuntimeRegistryExternalReferenceFiles: [...config.allowedRuntimeRegistryExternalReferenceFiles],
      allowedTauriBridgeExports: [...config.allowedTauriBridgeExports],
      allowedTauriBridgeExternalReferenceFiles: [...config.allowedTauriBridgeExternalReferenceFiles],
      allowedTauriCommandRuntimeExports: [...config.allowedTauriCommandRuntimeExports],
      allowedTauriCommandRuntimeExternalReferenceFiles: [...config.allowedTauriCommandRuntimeExternalReferenceFiles],
      allowedTauriCommandRuntimeFieldSurface: [...config.allowedTauriCommandRuntimeFieldSurface],
      allowedTauriCommandRuntimePrivateMethods: [...config.allowedTauriCommandRuntimePrivateMethods],
      allowedTauriCommandRuntimePublicMethods: [...config.allowedTauriCommandRuntimePublicMethods],
      allowedTauriInvokeExports: [...config.allowedTauriInvokeExports],
      allowedTauriInvokeExternalReferenceFiles: [...config.allowedTauriInvokeExternalReferenceFiles],
      allowedTauriInvokeTypeText: config.allowedTauriInvokeTypeText,
      allowedTauriTouchFiles: [...config.allowedTauriTouchFiles],
      bridgeGlobalTouchFiles: [],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      mockCommandRuntimeReferenceFiles: [],
      mockFixtureExports: [],
      mockFixtureReferenceFiles: [],
      mockRuntimeExports: [],
      mockRuntimeFields: [],
      mockRuntimeMethods: [],
      outputDir: config.outputDir,
      runId: config.runId,
      runtimeFiles: [],
      runtimeModeExports: [],
      runtimeModeReferenceFiles: [],
      runtimeModeValues: [],
      runtimeRegistryExports: [],
      runtimeRegistryReferenceFiles: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tauriBridgeExports: [],
      tauriBridgeReferenceFiles: [],
      tauriCommandRuntimeExports: [],
      tauriCommandRuntimeFields: [],
      tauriCommandRuntimeMethods: [],
      tauriCommandRuntimeReferenceFiles: [],
      tauriInvokeExports: [],
      tauriInvokeReferenceFiles: [],
      tauriInvokeType: null,
      tauriTouchFiles: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3RuntimeAdapterGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 runtime adapter governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 runtime adapter governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3RuntimeAdapterGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_OUTPUT_DIR?.trim()
    || path.join(workspaceRoot, "output", "verification", `desktop-v3-runtime-adapter-governance-${runId}`);

  return {
    allowedBridgeGlobalTouchFiles: [...desktopV3AllowedBridgeGlobalTouchFiles],
    allowedMockCommandRuntimeExternalReferenceFiles: [...desktopV3AllowedMockCommandRuntimeExternalReferenceFiles],
    allowedMockFixtureExports: [...desktopV3AllowedMockFixtureExports],
    allowedMockFixtureExternalReferenceFiles: [...desktopV3AllowedMockFixtureExternalReferenceFiles],
    allowedMockRuntimeExports: [...desktopV3AllowedMockRuntimeExports],
    allowedMockRuntimeFieldSurface: [...desktopV3AllowedMockRuntimeFieldSurface],
    allowedMockRuntimePublicMethods: [...desktopV3AllowedMockRuntimePublicMethods],
    allowedRuntimeAdapterFiles: [...desktopV3RuntimeAdapterFileSet],
    allowedRuntimeModeExports: [...desktopV3AllowedRuntimeModeExports],
    allowedRuntimeModeExternalReferenceFiles: [...desktopV3AllowedRuntimeModeExternalReferenceFiles],
    allowedRuntimeModeValues: [...desktopV3AllowedRuntimeModeValues],
    allowedRuntimeRegistryExports: [...desktopV3AllowedRuntimeRegistryExports],
    allowedRuntimeRegistryExternalReferenceFiles: [...desktopV3AllowedRuntimeRegistryExternalReferenceFiles],
    allowedTauriBridgeExports: [...desktopV3AllowedTauriBridgeExports],
    allowedTauriBridgeExternalReferenceFiles: [...desktopV3AllowedTauriBridgeExternalReferenceFiles],
    allowedTauriCommandRuntimeExports: [...desktopV3AllowedTauriCommandRuntimeExports],
    allowedTauriCommandRuntimeExternalReferenceFiles: [...desktopV3AllowedTauriCommandRuntimeExternalReferenceFiles],
    allowedTauriCommandRuntimeFieldSurface: [...desktopV3AllowedTauriCommandRuntimeFieldSurface],
    allowedTauriCommandRuntimePrivateMethods: [...desktopV3AllowedTauriCommandRuntimePrivateMethods],
    allowedTauriCommandRuntimePublicMethods: [...desktopV3AllowedTauriCommandRuntimePublicMethods],
    allowedTauriInvokeExports: [...desktopV3AllowedTauriInvokeExports],
    allowedTauriInvokeExternalReferenceFiles: [...desktopV3AllowedTauriInvokeExternalReferenceFiles],
    allowedTauriInvokeTypeText: desktopV3AllowedTauriInvokeTypeText,
    allowedTauriTouchFiles: [...desktopV3AllowedTauriTouchFiles],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-runtime-adapter-governance-summary.json",
    ),
    mockFixtureFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/mock-fixtures.ts"),
    mockRuntimeFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts"),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    runtimeDir: path.join(workspaceRoot, desktopV3RuntimeDir),
    runtimeModeFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/runtime-mode.ts"),
    runtimeRegistryFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/runtime-registry.ts"),
    sourceDir: path.join(workspaceRoot, desktopV3SourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
    tauriBridgeFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/tauri-bridge.ts"),
    tauriCommandRuntimeFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts"),
    tauriInvokeFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/runtime/tauri-invoke.ts"),
  };
}
