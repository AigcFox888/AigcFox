import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { desktopV3AllowedTauriCommands } from "./desktop-v3-command-governance.mjs";
import {
  collectRustEnumVariantsFromSource,
  collectRustStructFieldsFromSource,
} from "./desktop-v3-runtime-skeleton-governance.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RustSourceDir = "apps/desktop-v3/src-tauri/src";
export const desktopV3RuntimeModelsFile = "apps/desktop-v3/src-tauri/src/runtime/models.rs";
export const desktopV3TsRuntimeContractsFile = "apps/desktop-v3/src/lib/runtime/contracts.ts";
export const desktopV3TsDesktopRuntimeFile = "apps/desktop-v3/src/lib/runtime/desktop-runtime.ts";
export const desktopV3TsTauriCommandTypesFile = "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts";
export const desktopV3AllowedRuntimeContractFiles = Object.freeze([
  desktopV3RuntimeModelsFile,
  desktopV3TsRuntimeContractsFile,
  desktopV3TsDesktopRuntimeFile,
  desktopV3TsTauriCommandTypesFile,
]);
export const desktopV3AllowedRustRuntimeModelPublicItems = Object.freeze([
  "enum:ThemeMode",
  "struct:ThemePreference",
  "struct:DiagnosticsSnapshot",
  "struct:BackendProbe",
  "fn:utc_now",
]);
export const desktopV3AllowedRustThemeModeVariants = Object.freeze([
  "Dark",
  "Light",
  "System",
]);
export const desktopV3AllowedRustThemeModePublicMethods = Object.freeze([
  "as_storage_value",
  "from_storage_value",
]);
export const desktopV3AllowedRustThemeModeMethodSignatures = Object.freeze({
  as_storage_value: "pub fn as_storage_value(&self) -> &'static str",
  from_storage_value: "pub fn from_storage_value(value: &str) -> Result<Self, RuntimeError>",
});
export const desktopV3AllowedRustModelSerdeRenameAll = Object.freeze({
  BackendProbe: "camelCase",
  DiagnosticsSnapshot: "camelCase",
  ThemeMode: "snake_case",
  ThemePreference: "camelCase",
});
export const desktopV3AllowedRustThemePreferenceFieldSurface = Object.freeze([
  "public:mode",
  "public:updated_at",
]);
export const desktopV3AllowedRustDiagnosticsSnapshotFieldSurface = Object.freeze([
  "public:app_version",
  "public:backend_base_url",
  "public:checked_at",
  "public:database_path",
  "public:database_status",
  "public:dirty_sync_cache_entry_count",
  "public:last_backend_probe_at",
  "public:platform",
  "public:secure_store",
  "public:sync_cache_entry_count",
  "public:theme_mode",
]);
export const desktopV3AllowedRustBackendProbeFieldSurface = Object.freeze([
  "public:checked_at",
  "public:request_id",
  "public:service",
  "public:status",
]);
export const desktopV3AllowedRustRuntimeModelExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/commands/backend.rs",
  "apps/desktop-v3/src-tauri/src/commands/diagnostics.rs",
  "apps/desktop-v3/src-tauri/src/commands/preferences.rs",
  "apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs",
  "apps/desktop-v3/src-tauri/src/runtime/client/probe_contract.rs",
  "apps/desktop-v3/src-tauri/src/runtime/diagnostics/mod.rs",
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);
export const desktopV3AllowedTsRuntimeContractsExports = Object.freeze([
  "interface:BackendProbe",
  "interface:DiagnosticsSnapshot",
  "interface:SecureStoreSnapshot",
  "interface:ThemePreference",
  "type:SecureStoreStatus",
  "type:ThemeMode",
]);
export const desktopV3AllowedTsThemeModeValues = Object.freeze([
  "dark",
  "light",
  "system",
]);
export const desktopV3AllowedTsSecureStoreStatusValues = Object.freeze([
  "ready",
  "reserved",
  "unavailable",
]);
export const desktopV3AllowedTsThemePreferenceProperties = Object.freeze([
  { name: "mode", optional: false, typeText: "ThemeMode" },
  { name: "updatedAt", optional: false, typeText: "string" },
]);
export const desktopV3AllowedTsSecureStoreSnapshotProperties = Object.freeze([
  { name: "provider", optional: false, typeText: "string" },
  { name: "status", optional: false, typeText: "SecureStoreStatus" },
  { name: "writesEnabled", optional: false, typeText: "boolean" },
]);
export const desktopV3AllowedTsDiagnosticsSnapshotProperties = Object.freeze([
  { name: "appVersion", optional: false, typeText: "string" },
  { name: "backendBaseUrl", optional: false, typeText: "string" },
  { name: "checkedAt", optional: false, typeText: "string" },
  { name: "databasePath", optional: false, typeText: "string" },
  { name: "databaseStatus", optional: false, typeText: "string" },
  { name: "dirtySyncCacheEntryCount", optional: false, typeText: "number" },
  { name: "lastBackendProbeAt", optional: true, typeText: "string | null" },
  { name: "platform", optional: false, typeText: "string" },
  { name: "secureStore", optional: false, typeText: "SecureStoreSnapshot" },
  { name: "syncCacheEntryCount", optional: false, typeText: "number" },
  { name: "themeMode", optional: false, typeText: "ThemeMode" },
]);
export const desktopV3AllowedTsBackendProbeProperties = Object.freeze([
  { name: "checkedAt", optional: false, typeText: "string" },
  { name: "requestId", optional: true, typeText: "string" },
  { name: "service", optional: false, typeText: "string" },
  { name: "status", optional: false, typeText: "string" },
]);
export const desktopV3AllowedTsDesktopRuntimeExports = Object.freeze([
  "interface:DesktopRuntime",
  "type:RendererBootStage",
]);
export const desktopV3AllowedTsRendererBootStageValues = Object.freeze([
  "app",
  "document",
]);
export const desktopV3AllowedTsDesktopRuntimeMethods = Object.freeze([
  "getBackendLiveness(): Promise<BackendProbe>",
  "getBackendReadiness(): Promise<BackendProbe>",
  "getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot>",
  "getThemePreference(): Promise<ThemePreference>",
  "reportRendererBoot(route: string, runtime: string, stage: RendererBootStage): Promise<void>",
  "setThemePreference(mode: ThemeMode): Promise<ThemePreference>",
]);
export const desktopV3AllowedTsTauriCommandTypesExports = Object.freeze([
  "interface:DesktopCommandPayloadMap",
  "interface:DesktopCommandResultMap",
  "type:DesktopCommandName",
]);
export const desktopV3AllowedTsDesktopCommandPayloadEntries = Object.freeze([
  { name: "desktop_get_backend_liveness", optional: false, typeText: "undefined" },
  { name: "desktop_get_backend_readiness", optional: false, typeText: "undefined" },
  { name: "desktop_get_diagnostics_snapshot", optional: false, typeText: "undefined" },
  { name: "desktop_get_theme_preference", optional: false, typeText: "undefined" },
  {
    name: "desktop_report_renderer_boot",
    optional: false,
    typeText: "{ route: string; runtime: string; stage: RendererBootStage; }",
  },
  { name: "desktop_set_theme_preference", optional: false, typeText: "{ mode: ThemeMode; }" },
]);
export const desktopV3AllowedTsDesktopCommandResultEntries = Object.freeze([
  { name: "desktop_get_backend_liveness", optional: false, typeText: "BackendProbe" },
  { name: "desktop_get_backend_readiness", optional: false, typeText: "BackendProbe" },
  { name: "desktop_get_diagnostics_snapshot", optional: false, typeText: "DiagnosticsSnapshot" },
  { name: "desktop_get_theme_preference", optional: false, typeText: "ThemePreference" },
  { name: "desktop_report_renderer_boot", optional: false, typeText: "void" },
  { name: "desktop_set_theme_preference", optional: false, typeText: "ThemePreference" },
]);
export const desktopV3AllowedTsDesktopCommandNameTypeText = "keyof DesktopCommandPayloadMap";

const desktopV3RustRuntimeModelReferencePatterns = Object.freeze([
  /\bruntime::models\b/u,
  /\bThemeMode\b/u,
  /\bThemePreference\b/u,
  /\bDiagnosticsSnapshot\b/u,
  /\bBackendProbe\b/u,
  /\butc_now\b/u,
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

function normalizeWorkspaceRelativePath(workspaceRoot, absolutePath) {
  return path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, "/");
}

function countOccurrences(sourceText, targetCharacter) {
  let count = 0;

  for (const character of sourceText) {
    if (character === targetCharacter) {
      count += 1;
    }
  }

  return count;
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

function classifyVisibility(token) {
  if (token === "pub") {
    return "public";
  }

  if (typeof token === "string" && token.startsWith("pub(")) {
    return "restricted";
  }

  return "private";
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

function normalizeRustSignature(signatureText) {
  return signatureText
    .replace(/\{[\s\S]*$/u, "")
    .replace(/\s+/gu, " ")
    .replace(/\(\s+/gu, "(")
    .replace(/,\s*\)/gu, ")")
    .replace(/\s+\)/gu, ")")
    .replace(/\s+,/gu, ",")
    .replace(/,\s*/gu, ", ")
    .replace(/\s+->\s+/gu, " -> ")
    .trim();
}

function formatRustFieldSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.visibility}:${entry.name}`));
}

function formatTsPropertyEntry(entry) {
  return `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`;
}

function formatTsMethodEntry(entry) {
  return `${entry.name}${entry.signature}`;
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
    .replace(/\s*\|\s*/gu, " | ")
    .replace(/\s*&\s*/gu, " & ")
    .replace(/\s*\{\s*/gu, "{ ")
    .replace(/\s*\}\s*/gu, " }")
    .replace(/;\s+\}/gu, "; }")
    .trim();
}

function hasExportModifier(node) {
  return Array.isArray(node.modifiers)
    && node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
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

export function collectRustTopLevelPublicItemsFromSource(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const items = [];
  let braceDepth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (braceDepth === 0) {
      const itemMatch = line.match(/^\s*pub\s+(enum|struct|fn)\s+([A-Za-z_][A-Za-z0-9_]*)\b/u);

      if (itemMatch) {
        items.push({
          filePath,
          kind: itemMatch[1],
          line: index + 1,
          name: itemMatch[2],
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");
  }

  return sortNamedEntries(items);
}

export function findRustSerdeRenameAllValue(sourceText, declarationKind, typeName) {
  const lines = sourceText.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    if (!new RegExp(`^\\s*pub\\s+${declarationKind}\\s+${typeName}\\b`, "u").test(lines[index])) {
      continue;
    }

    for (let lookback = index - 1; lookback >= 0 && lookback >= index - 6; lookback -= 1) {
      const match = lines[lookback].match(/#\s*\[\s*serde\s*\(\s*rename_all\s*=\s*"([^"]+)"\s*\)\s*\]/u);

      if (match) {
        return {
          line: lookback + 1,
          value: match[1],
        };
      }
    }
  }

  return null;
}

export function collectTypeScriptExportedTopLevelDeclarations(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const declarations = [];

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      declarations.push({
        filePath,
        kind: "interface",
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1,
        name: statement.name.text,
      });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      declarations.push({
        filePath,
        kind: "type",
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1,
        name: statement.name.text,
      });
    }
  }

  return sortNamedEntries(declarations);
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
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1,
        name: aliasName,
        typeText: normalizeTypeScriptText(statement.type.getText(sourceFile)),
      };
    }
  }

  return null;
}

export function collectTypeScriptExportedInterfaceProperties(
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
    if (
      !ts.isInterfaceDeclaration(statement)
      || !hasExportModifier(statement)
      || statement.name.text !== interfaceName
    ) {
      continue;
    }

    for (const member of statement.members) {
      if (!ts.isPropertySignature(member) || member.name === undefined) {
        continue;
      }

      properties.push({
        filePath,
        line: sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile)).line + 1,
        name: normalizeTypeScriptPropertyName(member.name, sourceFile),
        optional: Boolean(member.questionToken),
        typeText: normalizeTypeScriptText(member.type?.getText(sourceFile) ?? "unknown"),
      });
    }
  }

  return sortNamedEntries(properties);
}

export function collectTypeScriptExportedInterfaceMethods(
  sourceText,
  absoluteFilePath,
  interfaceName,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const methods = [];

  for (const statement of sourceFile.statements) {
    if (
      !ts.isInterfaceDeclaration(statement)
      || !hasExportModifier(statement)
      || statement.name.text !== interfaceName
    ) {
      continue;
    }

    for (const member of statement.members) {
      if (!ts.isMethodSignature(member) || member.name === undefined) {
        continue;
      }

      const parameters = member.parameters.map((parameter) => {
        const parameterName = normalizeTypeScriptPropertyName(parameter.name, sourceFile);
        const parameterType = normalizeTypeScriptText(parameter.type?.getText(sourceFile) ?? "unknown");
        return `${parameterName}: ${parameterType}`;
      });

      methods.push({
        filePath,
        line: sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile)).line + 1,
        name: normalizeTypeScriptPropertyName(member.name, sourceFile),
        signature: normalizeTypeScriptText(
          `(${parameters.join(", ")}): ${member.type?.getText(sourceFile) ?? "void"}`,
        ),
      });
    }
  }

  return sortNamedEntries(methods);
}

async function collectRustFiles(directoryPath, readdirImpl) {
  const collected = [];

  async function walk(currentPath) {
    const entries = await readdirImpl(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".rs")) {
        collected.push(absolutePath);
      }
    }
  }

  await walk(directoryPath);

  return collected.sort((left, right) => left.localeCompare(right));
}

async function listDesktopV3RustSourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectRustFiles(config.rustSourceDir, readdirImpl);
}

function isDirectRustImplDeclaration(trimmedLine, typeName) {
  return new RegExp(`^impl(?:<[^>]+>)?\\s+${typeName}\\b`, "u").test(trimmedLine);
}

function collectRustInherentImplMethodsFromSource(sourceText, absoluteFilePath, typeName, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const methods = [];
  let braceDepth = 0;
  let implDepth = 0;
  let inImpl = false;
  let pendingImpl = false;
  let pendingMethod = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!inImpl && !pendingImpl && isDirectRustImplDeclaration(trimmedLine, typeName)) {
      pendingImpl = true;
    }

    if (pendingImpl && line.includes("{")) {
      inImpl = true;
      implDepth = braceDepth + 1;
      pendingImpl = false;
    }

    if (inImpl && braceDepth === implDepth) {
      if (pendingMethod !== null) {
        pendingMethod.signatureLines.push(trimmedLine);

        if (line.includes("{")) {
          methods.push({
            filePath,
            line: pendingMethod.line,
            name: pendingMethod.name,
            signature: normalizeRustSignature(pendingMethod.signatureLines.join(" ")),
            visibility: pendingMethod.visibility,
          });
          pendingMethod = null;
        }
      } else {
        const methodMatch = line.match(
          /^\s*(?:(pub(?:\((?:crate|super|self)\))?)\s+)?(?:(?:async|const|unsafe)\s+)*fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/u,
        );

        if (methodMatch) {
          pendingMethod = {
            line: index + 1,
            name: methodMatch[2],
            signatureLines: [trimmedLine],
            visibility: classifyVisibility(methodMatch[1] ?? null),
          };

          if (line.includes("{")) {
            methods.push({
              filePath,
              line: pendingMethod.line,
              name: pendingMethod.name,
              signature: normalizeRustSignature(pendingMethod.signatureLines.join(" ")),
              visibility: pendingMethod.visibility,
            });
            pendingMethod = null;
          }
        }
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");

    if (inImpl && braceDepth < implDepth) {
      inImpl = false;
      implDepth = 0;
      pendingMethod = null;
    }
  }

  return sortNamedEntries(methods);
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

function addTypeScriptPropertyDriftViolation({
  actualEntries,
  detail,
  expectedEntries,
  filePath,
  kind,
  violations,
  seenViolations,
}) {
  addSurfaceDriftViolation({
    actualSurface: actualEntries.map((entry) => formatTsPropertyEntry(entry)),
    detail,
    entries: actualEntries,
    expectedSurface: expectedEntries.map((entry) => formatTsPropertyEntry(entry)),
    filePath,
    kind,
    violations,
    seenViolations,
  });
}

function addTypeScriptMethodDriftViolation({
  actualEntries,
  detail,
  expectedSignatures,
  filePath,
  kind,
  violations,
  seenViolations,
}) {
  addSurfaceDriftViolation({
    actualSurface: actualEntries.map((entry) => formatTsMethodEntry(entry)),
    detail,
    entries: actualEntries,
    expectedSurface: expectedSignatures,
    filePath,
    kind,
    violations,
    seenViolations,
  });
}

export async function collectDesktopV3RuntimeContractGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const rustSourceFilePaths = Array.isArray(options.rustSourceFilePaths)
    ? options.rustSourceFilePaths
    : await listDesktopV3RustSourceFiles(config, options);
  const violations = [];
  const seenViolations = new Set();
  const sourceTextByFilePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByFilePath.has(filePath)) {
      sourceTextByFilePath.set(filePath, await readFileImpl(filePath, "utf8"));
    }

    return sourceTextByFilePath.get(filePath);
  }

  const rustModelsSourceText = await readSourceText(config.rustRuntimeModelsFilePath);
  const tsContractsSourceText = await readSourceText(config.tsRuntimeContractsFilePath);
  const tsDesktopRuntimeSourceText = await readSourceText(config.tsDesktopRuntimeFilePath);
  const tsTauriCommandTypesSourceText = await readSourceText(config.tsTauriCommandTypesFilePath);
  const scannedFiles = sortStrings(new Set([
    ...config.allowedRuntimeContractFiles,
    ...rustSourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  ]));

  const rustPublicItems = collectRustTopLevelPublicItemsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    { rootDir: config.rootDir },
  );
  const rustThemeModeVariants = collectRustEnumVariantsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    "ThemeMode",
    { rootDir: config.rootDir },
  );
  const rustThemeModeMethods = collectRustInherentImplMethodsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    "ThemeMode",
    { rootDir: config.rootDir },
  );
  const rustThemePreferenceFields = collectRustStructFieldsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    "ThemePreference",
    { rootDir: config.rootDir },
  );
  const rustDiagnosticsSnapshotFields = collectRustStructFieldsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    "DiagnosticsSnapshot",
    { rootDir: config.rootDir },
  );
  const rustBackendProbeFields = collectRustStructFieldsFromSource(
    rustModelsSourceText,
    config.rustRuntimeModelsFilePath,
    "BackendProbe",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: rustPublicItems.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `runtime/models.rs public item set drifted from the frozen Wave 1 contract surface (${config.allowedRustRuntimeModelPublicItems.join(", ")}). Rewrite the runtime contract layer before widening exported Rust models.`,
    entries: rustPublicItems,
    expectedSurface: config.allowedRustRuntimeModelPublicItems,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-public-item-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: rustThemeModeVariants.map((entry) => entry.name),
    detail: `ThemeMode variants drifted from the frozen Wave 1 contract set (${config.allowedRustThemeModeVariants.join(", ")}).`,
    entries: rustThemeModeVariants,
    expectedSurface: config.allowedRustThemeModeVariants,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-theme-mode-variant-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: rustThemeModeMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `ThemeMode public methods drifted from the frozen Wave 1 contract surface (${config.allowedRustThemeModePublicMethods.join(", ")}).`,
    entries: rustThemeModeMethods,
    expectedSurface: config.allowedRustThemeModePublicMethods,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-theme-mode-method-drift",
    violations,
    seenViolations,
  });

  for (const method of rustThemeModeMethods.filter((entry) => entry.visibility !== "public")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "ThemeMode helper surface is frozen at the current public contract methods only. Rewrite the runtime contract boundary before adding extra helpers here.",
      filePath: method.filePath,
      kind: `runtime-contract-rust-theme-mode-${method.visibility}-method`,
      line: method.line,
    });
  }

  for (const [methodName, expectedSignature] of Object.entries(config.allowedRustThemeModeMethodSignatures)) {
    const method = rustThemeModeMethods.find((entry) => entry.name === methodName) ?? null;

    if (method?.signature === expectedSignature) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `ThemeMode method ${methodName} signature drifted from the frozen Wave 1 contract. Expected ${expectedSignature}, but found ${method?.signature ?? "missing"}.`,
      filePath: desktopV3RuntimeModelsFile,
      kind: "runtime-contract-rust-theme-mode-signature-drift",
      line: method?.line ?? 1,
    });
  }

  addSurfaceDriftViolation({
    actualSurface: formatRustFieldSurface(rustThemePreferenceFields),
    detail: `ThemePreference fields drifted from the frozen Wave 1 contract surface (${config.allowedRustThemePreferenceFieldSurface.join(", ")}).`,
    entries: rustThemePreferenceFields,
    expectedSurface: config.allowedRustThemePreferenceFieldSurface,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-theme-preference-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: formatRustFieldSurface(rustDiagnosticsSnapshotFields),
    detail: `DiagnosticsSnapshot fields drifted from the frozen Wave 1 contract surface (${config.allowedRustDiagnosticsSnapshotFieldSurface.join(", ")}).`,
    entries: rustDiagnosticsSnapshotFields,
    expectedSurface: config.allowedRustDiagnosticsSnapshotFieldSurface,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-diagnostics-snapshot-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: formatRustFieldSurface(rustBackendProbeFields),
    detail: `BackendProbe fields drifted from the frozen Wave 1 contract surface (${config.allowedRustBackendProbeFieldSurface.join(", ")}).`,
    entries: rustBackendProbeFields,
    expectedSurface: config.allowedRustBackendProbeFieldSurface,
    filePath: desktopV3RuntimeModelsFile,
    kind: "runtime-contract-rust-backend-probe-field-drift",
    violations,
    seenViolations,
  });

  for (const [typeName, expectedRenameAll] of Object.entries(config.allowedRustModelSerdeRenameAll)) {
    const declarationKind = typeName === "ThemeMode" ? "enum" : "struct";
    const renameAll = findRustSerdeRenameAllValue(rustModelsSourceText, declarationKind, typeName);

    if (renameAll?.value === expectedRenameAll) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${typeName} serde rename_all drifted from the frozen Wave 1 contract. Expected ${expectedRenameAll}, but found ${renameAll?.value ?? "missing"}.`,
      filePath: desktopV3RuntimeModelsFile,
      kind: "runtime-contract-rust-serde-rename-drift",
      line: renameAll?.line ?? 1,
    });
  }

  const rustModelReferenceFiles = [];

  for (const absoluteFilePath of rustSourceFilePaths) {
    const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);

    if (filePath === desktopV3RuntimeModelsFile) {
      continue;
    }

    const sourceText = await readSourceText(absoluteFilePath);

    if (desktopV3RustRuntimeModelReferencePatterns.some((pattern) => pattern.test(sourceText))) {
      rustModelReferenceFiles.push(filePath);
    }
  }

  const uniqueRustModelReferenceFiles = sortStrings(new Set(rustModelReferenceFiles));

  for (const filePath of uniqueRustModelReferenceFiles) {
    if (config.allowedRustRuntimeModelExternalReferenceFiles.includes(filePath)) {
      continue;
    }

    const sourceText = await readSourceText(path.join(config.rootDir, filePath));
    const location = findPatternLocation(sourceText, desktopV3RustRuntimeModelReferencePatterns);

    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `runtime/models.rs contract usage escaped the frozen Wave 1 boundary. ${filePath} references Rust runtime models directly, but only ${config.allowedRustRuntimeModelExternalReferenceFiles.join(", ")} may do so.`,
      filePath,
      kind: "runtime-contract-rust-reference-drift",
      line: location.line,
    });
  }

  for (const expectedFilePath of config.allowedRustRuntimeModelExternalReferenceFiles) {
    if (uniqueRustModelReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 runtime/models.rs external reference ${expectedFilePath} is missing. Update docs and rewrite the contract boundary before changing Rust model ownership.`,
      filePath: expectedFilePath,
      kind: "runtime-contract-rust-reference-missing",
      line: 1,
    });
  }

  const tsContractExports = collectTypeScriptExportedTopLevelDeclarations(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    { rootDir: config.rootDir },
  );
  const tsThemeModeValues = collectTypeScriptExportedTypeAliasUnionValues(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "ThemeMode",
  );
  const tsSecureStoreStatusValues = collectTypeScriptExportedTypeAliasUnionValues(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "SecureStoreStatus",
  );
  const tsThemePreferenceProperties = collectTypeScriptExportedInterfaceProperties(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "ThemePreference",
    { rootDir: config.rootDir },
  );
  const tsSecureStoreSnapshotProperties = collectTypeScriptExportedInterfaceProperties(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "SecureStoreSnapshot",
    { rootDir: config.rootDir },
  );
  const tsDiagnosticsSnapshotProperties = collectTypeScriptExportedInterfaceProperties(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "DiagnosticsSnapshot",
    { rootDir: config.rootDir },
  );
  const tsBackendProbeProperties = collectTypeScriptExportedInterfaceProperties(
    tsContractsSourceText,
    config.tsRuntimeContractsFilePath,
    "BackendProbe",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: tsContractExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `src/lib/runtime/contracts.ts exported surface drifted from the frozen Wave 1 contract set (${config.allowedTsRuntimeContractsExports.join(", ")}).`,
    entries: tsContractExports,
    expectedSurface: config.allowedTsRuntimeContractsExports,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-contract-export-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: tsThemeModeValues,
    detail: `ThemeMode TypeScript union drifted from the frozen Wave 1 values (${config.allowedTsThemeModeValues.join(", ")}).`,
    entries: tsContractExports.filter((entry) => entry.name === "ThemeMode"),
    expectedSurface: config.allowedTsThemeModeValues,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-theme-mode-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: tsSecureStoreStatusValues,
    detail: `SecureStoreStatus TypeScript union drifted from the frozen Wave 1 values (${config.allowedTsSecureStoreStatusValues.join(", ")}).`,
    entries: tsContractExports.filter((entry) => entry.name === "SecureStoreStatus"),
    expectedSurface: config.allowedTsSecureStoreStatusValues,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-secure-store-status-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsThemePreferenceProperties,
    detail: `ThemePreference TypeScript fields drifted from the frozen Wave 1 contract surface (${config.allowedTsThemePreferenceProperties.map((entry) => formatTsPropertyEntry(entry)).join(", ")}).`,
    expectedEntries: config.allowedTsThemePreferenceProperties,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-theme-preference-field-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsSecureStoreSnapshotProperties,
    detail: `SecureStoreSnapshot TypeScript fields drifted from the frozen Wave 1 contract surface (${config.allowedTsSecureStoreSnapshotProperties.map((entry) => formatTsPropertyEntry(entry)).join(", ")}).`,
    expectedEntries: config.allowedTsSecureStoreSnapshotProperties,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-secure-store-snapshot-field-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsDiagnosticsSnapshotProperties,
    detail: `DiagnosticsSnapshot TypeScript fields drifted from the frozen Wave 1 contract surface (${config.allowedTsDiagnosticsSnapshotProperties.map((entry) => formatTsPropertyEntry(entry)).join(", ")}).`,
    expectedEntries: config.allowedTsDiagnosticsSnapshotProperties,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-diagnostics-snapshot-field-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsBackendProbeProperties,
    detail: `BackendProbe TypeScript fields drifted from the frozen Wave 1 contract surface (${config.allowedTsBackendProbeProperties.map((entry) => formatTsPropertyEntry(entry)).join(", ")}).`,
    expectedEntries: config.allowedTsBackendProbeProperties,
    filePath: desktopV3TsRuntimeContractsFile,
    kind: "runtime-contract-ts-backend-probe-field-drift",
    violations,
    seenViolations,
  });

  const tsDesktopRuntimeExports = collectTypeScriptExportedTopLevelDeclarations(
    tsDesktopRuntimeSourceText,
    config.tsDesktopRuntimeFilePath,
    { rootDir: config.rootDir },
  );
  const tsRendererBootStageValues = collectTypeScriptExportedTypeAliasUnionValues(
    tsDesktopRuntimeSourceText,
    config.tsDesktopRuntimeFilePath,
    "RendererBootStage",
  );
  const tsDesktopRuntimeMethods = collectTypeScriptExportedInterfaceMethods(
    tsDesktopRuntimeSourceText,
    config.tsDesktopRuntimeFilePath,
    "DesktopRuntime",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: tsDesktopRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `src/lib/runtime/desktop-runtime.ts exported surface drifted from the frozen Wave 1 contract set (${config.allowedTsDesktopRuntimeExports.join(", ")}).`,
    entries: tsDesktopRuntimeExports,
    expectedSurface: config.allowedTsDesktopRuntimeExports,
    filePath: desktopV3TsDesktopRuntimeFile,
    kind: "runtime-contract-ts-desktop-runtime-export-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: tsRendererBootStageValues,
    detail: `RendererBootStage union drifted from the frozen Wave 1 values (${config.allowedTsRendererBootStageValues.join(", ")}).`,
    entries: tsDesktopRuntimeExports.filter((entry) => entry.name === "RendererBootStage"),
    expectedSurface: config.allowedTsRendererBootStageValues,
    filePath: desktopV3TsDesktopRuntimeFile,
    kind: "runtime-contract-ts-renderer-boot-stage-drift",
    violations,
    seenViolations,
  });
  addTypeScriptMethodDriftViolation({
    actualEntries: tsDesktopRuntimeMethods,
    detail: "DesktopRuntime interface drifted from the frozen Wave 1 method surface.",
    expectedSignatures: config.allowedTsDesktopRuntimeMethods,
    filePath: desktopV3TsDesktopRuntimeFile,
    kind: "runtime-contract-ts-desktop-runtime-method-drift",
    violations,
    seenViolations,
  });

  const tsTauriCommandTypesExports = collectTypeScriptExportedTopLevelDeclarations(
    tsTauriCommandTypesSourceText,
    config.tsTauriCommandTypesFilePath,
    { rootDir: config.rootDir },
  );
  const tsDesktopCommandPayloadEntries = collectTypeScriptExportedInterfaceProperties(
    tsTauriCommandTypesSourceText,
    config.tsTauriCommandTypesFilePath,
    "DesktopCommandPayloadMap",
    { rootDir: config.rootDir },
  );
  const tsDesktopCommandResultEntries = collectTypeScriptExportedInterfaceProperties(
    tsTauriCommandTypesSourceText,
    config.tsTauriCommandTypesFilePath,
    "DesktopCommandResultMap",
    { rootDir: config.rootDir },
  );
  const tsDesktopCommandNameType = collectTypeScriptExportedTypeAliasText(
    tsTauriCommandTypesSourceText,
    config.tsTauriCommandTypesFilePath,
    "DesktopCommandName",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: tsTauriCommandTypesExports.map((entry) => `${entry.kind}:${entry.name}`),
    detail: `src/lib/runtime/tauri-command-types.ts exported surface drifted from the frozen Wave 1 contract set (${config.allowedTsTauriCommandTypesExports.join(", ")}).`,
    entries: tsTauriCommandTypesExports,
    expectedSurface: config.allowedTsTauriCommandTypesExports,
    filePath: desktopV3TsTauriCommandTypesFile,
    kind: "runtime-contract-ts-command-type-export-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsDesktopCommandPayloadEntries,
    detail: "DesktopCommandPayloadMap drifted from the frozen Wave 1 payload contract.",
    expectedEntries: config.allowedTsDesktopCommandPayloadEntries,
    filePath: desktopV3TsTauriCommandTypesFile,
    kind: "runtime-contract-ts-command-payload-drift",
    violations,
    seenViolations,
  });
  addTypeScriptPropertyDriftViolation({
    actualEntries: tsDesktopCommandResultEntries,
    detail: "DesktopCommandResultMap drifted from the frozen Wave 1 result contract.",
    expectedEntries: config.allowedTsDesktopCommandResultEntries,
    filePath: desktopV3TsTauriCommandTypesFile,
    kind: "runtime-contract-ts-command-result-drift",
    violations,
    seenViolations,
  });

  const payloadNames = tsDesktopCommandPayloadEntries.map((entry) => entry.name);
  const resultNames = tsDesktopCommandResultEntries.map((entry) => entry.name);

  if (!compareStringSets(payloadNames, desktopV3AllowedTauriCommands)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `DesktopCommandPayloadMap keys drifted from the frozen Tauri command set (${desktopV3AllowedTauriCommands.join(", ")}).`,
      filePath: desktopV3TsTauriCommandTypesFile,
      kind: "runtime-contract-ts-command-payload-key-drift",
      line: tsDesktopCommandPayloadEntries[0]?.line ?? 1,
    });
  }

  if (!compareStringSets(resultNames, desktopV3AllowedTauriCommands)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `DesktopCommandResultMap keys drifted from the frozen Tauri command set (${desktopV3AllowedTauriCommands.join(", ")}).`,
      filePath: desktopV3TsTauriCommandTypesFile,
      kind: "runtime-contract-ts-command-result-key-drift",
      line: tsDesktopCommandResultEntries[0]?.line ?? 1,
    });
  }

  if (tsDesktopCommandNameType?.typeText !== config.allowedTsDesktopCommandNameTypeText) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `DesktopCommandName drifted from the frozen Wave 1 alias. Expected ${config.allowedTsDesktopCommandNameTypeText}, but found ${tsDesktopCommandNameType?.typeText ?? "missing"}.`,
      filePath: desktopV3TsTauriCommandTypesFile,
      kind: "runtime-contract-ts-command-name-drift",
      line: tsDesktopCommandNameType?.line ?? 1,
    });
  }

  return {
    rustBackendProbeFields,
    rustDiagnosticsSnapshotFields,
    rustModelReferenceFiles: uniqueRustModelReferenceFiles,
    rustPublicItems,
    rustThemeModeMethods,
    rustThemeModeVariants,
    rustThemePreferenceFields,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    tsBackendProbeProperties,
    tsContractExports,
    tsDesktopCommandNameType,
    tsDesktopCommandPayloadEntries,
    tsDesktopCommandResultEntries,
    tsDesktopRuntimeExports,
    tsDesktopRuntimeMethods,
    tsDiagnosticsSnapshotProperties,
    tsRendererBootStageValues,
    tsSecureStoreSnapshotProperties,
    tsSecureStoreStatusValues,
    tsTauriCommandTypesExports,
    tsThemeModeValues,
    tsThemePreferenceProperties,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3RuntimeContractGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedRuntimeContractFiles: [...config.allowedRuntimeContractFiles],
      allowedRustBackendProbeFieldSurface: [...config.allowedRustBackendProbeFieldSurface],
      allowedRustDiagnosticsSnapshotFieldSurface: [...config.allowedRustDiagnosticsSnapshotFieldSurface],
      allowedRustModelSerdeRenameAll: { ...config.allowedRustModelSerdeRenameAll },
      allowedRustRuntimeModelExternalReferenceFiles: [...config.allowedRustRuntimeModelExternalReferenceFiles],
      allowedRustRuntimeModelPublicItems: [...config.allowedRustRuntimeModelPublicItems],
      allowedRustThemeModeMethodSignatures: { ...config.allowedRustThemeModeMethodSignatures },
      allowedRustThemeModePublicMethods: [...config.allowedRustThemeModePublicMethods],
      allowedRustThemeModeVariants: [...config.allowedRustThemeModeVariants],
      allowedRustThemePreferenceFieldSurface: [...config.allowedRustThemePreferenceFieldSurface],
      allowedTsBackendProbeProperties: [...config.allowedTsBackendProbeProperties],
      allowedTsDesktopCommandNameTypeText: config.allowedTsDesktopCommandNameTypeText,
      allowedTsDesktopCommandPayloadEntries: [...config.allowedTsDesktopCommandPayloadEntries],
      allowedTsDesktopCommandResultEntries: [...config.allowedTsDesktopCommandResultEntries],
      allowedTsDesktopRuntimeExports: [...config.allowedTsDesktopRuntimeExports],
      allowedTsDesktopRuntimeMethods: [...config.allowedTsDesktopRuntimeMethods],
      allowedTsDiagnosticsSnapshotProperties: [...config.allowedTsDiagnosticsSnapshotProperties],
      allowedTsRendererBootStageValues: [...config.allowedTsRendererBootStageValues],
      allowedTsRuntimeContractsExports: [...config.allowedTsRuntimeContractsExports],
      allowedTsSecureStoreSnapshotProperties: [...config.allowedTsSecureStoreSnapshotProperties],
      allowedTsSecureStoreStatusValues: [...config.allowedTsSecureStoreStatusValues],
      allowedTsTauriCommandTypesExports: [...config.allowedTsTauriCommandTypesExports],
      allowedTsThemeModeValues: [...config.allowedTsThemeModeValues],
      allowedTsThemePreferenceProperties: [...config.allowedTsThemePreferenceProperties],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      rustBackendProbeFields: [],
      rustDiagnosticsSnapshotFields: [],
      rustModelReferenceFiles: [],
      rustPublicItems: [],
      rustThemeModeMethods: [],
      rustThemeModeVariants: [],
      rustThemePreferenceFields: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tsBackendProbeProperties: [],
      tsContractExports: [],
      tsDesktopCommandNameType: null,
      tsDesktopCommandPayloadEntries: [],
      tsDesktopCommandResultEntries: [],
      tsDesktopRuntimeExports: [],
      tsDesktopRuntimeMethods: [],
      tsDiagnosticsSnapshotProperties: [],
      tsRendererBootStageValues: [],
      tsSecureStoreSnapshotProperties: [],
      tsSecureStoreStatusValues: [],
      tsTauriCommandTypesExports: [],
      tsThemeModeValues: [],
      tsThemePreferenceProperties: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3RuntimeContractGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 runtime contract governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 runtime contract governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3RuntimeContractGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_OUTPUT_DIR?.trim()
    || path.join(workspaceRoot, "output", "verification", `desktop-v3-runtime-contract-governance-${runId}`);

  return {
    allowedRuntimeContractFiles: [...desktopV3AllowedRuntimeContractFiles],
    allowedRustBackendProbeFieldSurface: [...desktopV3AllowedRustBackendProbeFieldSurface],
    allowedRustDiagnosticsSnapshotFieldSurface: [...desktopV3AllowedRustDiagnosticsSnapshotFieldSurface],
    allowedRustModelSerdeRenameAll: { ...desktopV3AllowedRustModelSerdeRenameAll },
    allowedRustRuntimeModelExternalReferenceFiles: [...desktopV3AllowedRustRuntimeModelExternalReferenceFiles],
    allowedRustRuntimeModelPublicItems: [...desktopV3AllowedRustRuntimeModelPublicItems],
    allowedRustThemeModeMethodSignatures: { ...desktopV3AllowedRustThemeModeMethodSignatures },
    allowedRustThemeModePublicMethods: [...desktopV3AllowedRustThemeModePublicMethods],
    allowedRustThemeModeVariants: [...desktopV3AllowedRustThemeModeVariants],
    allowedRustThemePreferenceFieldSurface: [...desktopV3AllowedRustThemePreferenceFieldSurface],
    allowedTsBackendProbeProperties: [...desktopV3AllowedTsBackendProbeProperties],
    allowedTsDesktopCommandNameTypeText: desktopV3AllowedTsDesktopCommandNameTypeText,
    allowedTsDesktopCommandPayloadEntries: [...desktopV3AllowedTsDesktopCommandPayloadEntries],
    allowedTsDesktopCommandResultEntries: [...desktopV3AllowedTsDesktopCommandResultEntries],
    allowedTsDesktopRuntimeExports: [...desktopV3AllowedTsDesktopRuntimeExports],
    allowedTsDesktopRuntimeMethods: [...desktopV3AllowedTsDesktopRuntimeMethods],
    allowedTsDiagnosticsSnapshotProperties: [...desktopV3AllowedTsDiagnosticsSnapshotProperties],
    allowedTsRendererBootStageValues: [...desktopV3AllowedTsRendererBootStageValues],
    allowedTsRuntimeContractsExports: [...desktopV3AllowedTsRuntimeContractsExports],
    allowedTsSecureStoreSnapshotProperties: [...desktopV3AllowedTsSecureStoreSnapshotProperties],
    allowedTsSecureStoreStatusValues: [...desktopV3AllowedTsSecureStoreStatusValues],
    allowedTsTauriCommandTypesExports: [...desktopV3AllowedTsTauriCommandTypesExports],
    allowedTsThemeModeValues: [...desktopV3AllowedTsThemeModeValues],
    allowedTsThemePreferenceProperties: [...desktopV3AllowedTsThemePreferenceProperties],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-runtime-contract-governance-summary.json",
    ),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    rustRuntimeModelsFilePath: path.join(workspaceRoot, desktopV3RuntimeModelsFile),
    rustSourceDir: path.join(workspaceRoot, desktopV3RustSourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
    tsDesktopRuntimeFilePath: path.join(workspaceRoot, desktopV3TsDesktopRuntimeFile),
    tsRuntimeContractsFilePath: path.join(workspaceRoot, desktopV3TsRuntimeContractsFile),
    tsTauriCommandTypesFilePath: path.join(workspaceRoot, desktopV3TsTauriCommandTypesFile),
  };
}
