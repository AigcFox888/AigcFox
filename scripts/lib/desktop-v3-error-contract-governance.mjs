import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { collectTypeScriptInterfaceProperties } from "./desktop-v3-app-shell-governance.mjs";
import { collectRustTopLevelPublicItemsFromSource } from "./desktop-v3-runtime-contract-governance.mjs";
import {
  collectRustEnumVariantsFromSource,
  collectRustImplMethodsFromSource,
  collectRustStructFieldsFromSource,
} from "./desktop-v3-runtime-skeleton-governance.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RustSourceDir = "apps/desktop-v3/src-tauri/src";
export const desktopV3RustErrorFile = "apps/desktop-v3/src-tauri/src/error.rs";
export const desktopV3TsAppErrorFile = "apps/desktop-v3/src/lib/errors/app-error.ts";
export const desktopV3TsNormalizeCommandErrorFile = "apps/desktop-v3/src/lib/errors/normalize-command-error.ts";
export const desktopV3TsTauriCommandRuntimeFile = "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts";
export const desktopV3AllowedErrorContractFiles = Object.freeze([
  desktopV3RustErrorFile,
  desktopV3TsAppErrorFile,
  desktopV3TsNormalizeCommandErrorFile,
  desktopV3TsTauriCommandRuntimeFile,
]);
export const desktopV3AllowedRustErrorPublicItems = Object.freeze([
  "enum:RuntimeError",
  "struct:CommandError",
]);
export const desktopV3AllowedRustCommandErrorFieldSurface = Object.freeze([
  "public:code",
  "public:message",
  "public:request_id",
]);
export const desktopV3AllowedRustCommandErrorPublicMethods = Object.freeze([
  "new",
]);
export const desktopV3AllowedRustCommandErrorMethodSignatures = Object.freeze({
  new: "pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self",
});
export const desktopV3AllowedRustRuntimeErrorVariants = Object.freeze([
  "Backend",
  "Database",
  "Http",
  "Internal",
  "InvalidBackendUrl",
  "InvalidPreferenceValue",
  "Io",
  "Migration",
  "NotReady",
]);
export const desktopV3AllowedRustBackendVariantFieldSurface = Object.freeze([
  "code",
  "message",
  "request_id",
]);
export const desktopV3AllowedRustRuntimeErrorExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs",
  "apps/desktop-v3/src-tauri/src/runtime/client/probe_contract.rs",
  "apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs",
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
  "apps/desktop-v3/src-tauri/src/runtime/models.rs",
]);
export const desktopV3AllowedRustCommandErrorExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/commands/backend.rs",
  "apps/desktop-v3/src-tauri/src/commands/diagnostics.rs",
  "apps/desktop-v3/src-tauri/src/commands/preferences.rs",
  "apps/desktop-v3/src-tauri/src/commands/renderer.rs",
]);
export const desktopV3AllowedTsAppErrorShapeProperties = Object.freeze([
  "code: string",
  "details?: Record<string, unknown>",
  "message: string",
  "requestId?: string",
]);
export const desktopV3AllowedTsCommandErrorPayloadProperties = Object.freeze([
  "code?: string",
  "details?: Record<string, unknown>",
  "message?: string",
  "requestId?: string",
]);
export const desktopV3AllowedRustRuntimeErrorMappingSnippets = Object.freeze([
  'RuntimeError::InvalidPreferenceValue(message) => { CommandError::new("invalid_request", message) }',
  'RuntimeError::Database(error) => CommandError::new("internal_error", error.to_string())',
  'RuntimeError::Migration(error) => { CommandError::new("internal_error", error.to_string()) }',
  'RuntimeError::Http(error) => CommandError::new("internal_error", error.to_string())',
  'RuntimeError::Io(error) => CommandError::new("internal_error", error.to_string())',
  "RuntimeError::Backend { code, message, request_id, } => CommandError { code, message, request_id, }",
  'RuntimeError::InvalidBackendUrl(message) => { CommandError::new("invalid_request", message) }',
  'RuntimeError::NotReady(message) => CommandError::new("not_ready", message)',
  'RuntimeError::Internal(message) => CommandError::new("internal_error", message)',
]);
export const desktopV3AllowedTsNormalizerSnippets = Object.freeze([
  'code: payload.code ?? "internal_error"',
  "details: payload.details",
  'message: payload.message ?? "未知运行时错误。"',
  "requestId: payload.requestId",
]);
export const desktopV3AllowedTauriCommandRuntimeErrorNormalizationSnippet =
  "throw normalizeCommandError(error);";

const rustCommandErrorPattern = /\bCommandError\b/u;
const rustRuntimeErrorPattern = /\bRuntimeError\b/u;

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_RUN_ID?.trim();

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

    const leftColumn = left.column ?? 0;
    const rightColumn = right.column ?? 0;

    if (leftColumn !== rightColumn) {
      return leftColumn - rightColumn;
    }

    if ("name" in left && "name" in right) {
      return String(left.name).localeCompare(String(right.name));
    }

    return 0;
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
  seenViolations,
  violations,
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

function formatFieldSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.visibility}:${entry.name}`));
}

function formatPropertySurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.name}: ${entry.typeText}`));
}

function normalizeSourceText(sourceText) {
  return sourceText.replace(/\s+/gu, " ").trim();
}

function findLineColumn(sourceText, index) {
  const lines = sourceText.slice(0, index).split(/\r?\n/u);
  const line = lines.length;
  const column = lines.at(-1)?.length ?? 0;

  return {
    column: column + 1,
    line,
  };
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

export async function listDesktopV3ErrorContractRustFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  return collectRustFiles(config.rustSourceDirectory, readdirImpl);
}

export function collectRustEnumVariantFieldsFromSource(
  sourceText,
  absoluteFilePath,
  enumName,
  variantName,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const fields = [];
  let braceDepth = 0;
  let enumDepth = 0;
  let inEnum = false;
  let inVariant = false;
  let pendingEnum = false;
  let pendingVariant = false;
  let variantDepth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!inEnum && !pendingEnum && new RegExp(`\\benum\\s+${enumName}\\b`, "u").test(trimmedLine)) {
      pendingEnum = true;
    }

    if (pendingEnum && line.includes("{")) {
      inEnum = true;
      enumDepth = braceDepth + 1;
      pendingEnum = false;
    }

    if (
      inEnum
      && !inVariant
      && !pendingVariant
      && braceDepth === enumDepth
      && new RegExp(`^\\s*${variantName}\\s*\\{`, "u").test(line)
    ) {
      pendingVariant = true;
    }

    if (pendingVariant && line.includes("{")) {
      inVariant = true;
      variantDepth = braceDepth + 1;
      pendingVariant = false;
    }

    if (inVariant && braceDepth === variantDepth) {
      const fieldMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/u);

      if (fieldMatch) {
        fields.push({
          filePath,
          line: index + 1,
          name: fieldMatch[1],
        });
      }
    }

    braceDepth += [...line].filter((character) => character === "{").length;
    braceDepth -= [...line].filter((character) => character === "}").length;

    if (inVariant && braceDepth < variantDepth) {
      inVariant = false;
      variantDepth = 0;
    }

    if (inEnum && braceDepth < enumDepth) {
      inEnum = false;
      enumDepth = 0;
      pendingVariant = false;
      inVariant = false;
      variantDepth = 0;
    }
  }

  return sortNamedEntries(fields);
}

function collectRustReferenceEntries(sourceByFilePath, filePaths, expression, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const entries = [];

  for (const absoluteFilePath of filePaths) {
    const sourceText = sourceByFilePath.get(absoluteFilePath) ?? "";
    const index = sourceText.search(expression);

    if (index < 0) {
      continue;
    }

    const location = findLineColumn(sourceText, index);
    entries.push({
      column: location.column,
      filePath: normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath),
      line: location.line,
    });
  }

  return sortNamedEntries(entries);
}

function addReferenceDriftViolations({
  actualEntries,
  allowedExternalReferenceFiles,
  detailPrefix,
  expectedKind,
  sourceFilePath,
  unexpectedKind,
  seenViolations,
  violations,
}) {
  const actualReferenceFiles = sortStrings(new Set(actualEntries.map((entry) => entry.filePath)));
  const allowedExternalReferenceFileSet = new Set(allowedExternalReferenceFiles);

  for (const actualEntry of actualEntries) {
    if (actualEntry.filePath === sourceFilePath || allowedExternalReferenceFileSet.has(actualEntry.filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: actualEntry.column,
      detail: `${detailPrefix} ${actualEntry.filePath} escaped the frozen Wave 1 ownership boundary. Rewrite the error contract before adding new cross-layer consumers.`,
      filePath: actualEntry.filePath,
      kind: unexpectedKind,
      line: actualEntry.line,
    });
  }

  for (const expectedFilePath of allowedExternalReferenceFiles) {
    if (actualReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detailPrefix} ${expectedFilePath} is missing from the frozen Wave 1 ownership boundary.`,
      filePath: expectedFilePath,
      kind: expectedKind,
      line: 1,
    });
  }

  return actualReferenceFiles.filter((filePath) => filePath !== sourceFilePath);
}

function addSnippetDriftViolations({
  allowedSnippets,
  filePath,
  kind,
  label,
  normalizedSource,
  seenViolations,
  violations,
}) {
  for (const snippet of allowedSnippets) {
    if (normalizedSource.includes(snippet)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${label} drifted away from the frozen Wave 1 snippet: ${snippet}`,
      filePath,
      kind,
      line: 1,
    });
  }
}

export async function collectDesktopV3ErrorContractViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const rustFilePaths =
    options.rustFilePaths
    ?? (await listDesktopV3ErrorContractRustFiles(config, { readdirImpl: options.readdirImpl }));
  const sourceByFilePath = new Map();
  const scannedAbsoluteFiles = sortStrings(new Set([
    ...rustFilePaths,
    config.rustErrorAbsoluteFilePath,
    config.tsAppErrorAbsoluteFilePath,
    config.tsNormalizeCommandErrorAbsoluteFilePath,
    config.tsTauriCommandRuntimeAbsoluteFilePath,
  ]));

  for (const absoluteFilePath of scannedAbsoluteFiles) {
    sourceByFilePath.set(absoluteFilePath, await readFileImpl(absoluteFilePath, "utf8"));
  }

  const rustErrorSource = sourceByFilePath.get(config.rustErrorAbsoluteFilePath) ?? "";
  const tsAppErrorSource = sourceByFilePath.get(config.tsAppErrorAbsoluteFilePath) ?? "";
  const tsNormalizeCommandErrorSource = sourceByFilePath.get(config.tsNormalizeCommandErrorAbsoluteFilePath) ?? "";
  const tsTauriCommandRuntimeSource = sourceByFilePath.get(config.tsTauriCommandRuntimeAbsoluteFilePath) ?? "";
  const violations = [];
  const seenViolations = new Set();

  const rustPublicItems = formatDeclarationSurface(
    collectRustTopLevelPublicItemsFromSource(rustErrorSource, config.rustErrorAbsoluteFilePath, {
      rootDir: config.rootDir,
    }),
  );
  const rustCommandErrorFieldsEntries = collectRustStructFieldsFromSource(
    rustErrorSource,
    config.rustErrorAbsoluteFilePath,
    "CommandError",
    { rootDir: config.rootDir },
  );
  const rustCommandErrorFields = formatFieldSurface(rustCommandErrorFieldsEntries);
  const rustCommandErrorMethodEntries = collectRustImplMethodsFromSource(
    rustErrorSource,
    config.rustErrorAbsoluteFilePath,
    "CommandError",
    { rootDir: config.rootDir },
  );
  const rustCommandErrorPublicMethods = sortStrings(
    rustCommandErrorMethodEntries
      .filter((entry) => entry.visibility === "public")
      .map((entry) => entry.name),
  );
  const rustCommandErrorMethodSignatures = Object.fromEntries(
    rustCommandErrorMethodEntries
      .filter((entry) => entry.visibility === "public")
      .map((entry) => [entry.name, entry.signature]),
  );
  const rustRuntimeErrorVariantsEntries = collectRustEnumVariantsFromSource(
    rustErrorSource,
    config.rustErrorAbsoluteFilePath,
    "RuntimeError",
    { rootDir: config.rootDir },
  );
  const rustRuntimeErrorVariants = sortStrings(rustRuntimeErrorVariantsEntries.map((entry) => entry.name));
  const rustBackendVariantFieldEntries = collectRustEnumVariantFieldsFromSource(
    rustErrorSource,
    config.rustErrorAbsoluteFilePath,
    "RuntimeError",
    "Backend",
    { rootDir: config.rootDir },
  );
  const rustBackendVariantFields = sortStrings(rustBackendVariantFieldEntries.map((entry) => entry.name));
  const rustRuntimeReferenceEntries = collectRustReferenceEntries(
    sourceByFilePath,
    rustFilePaths,
    rustRuntimeErrorPattern,
    { rootDir: config.rootDir },
  );
  const rustCommandReferenceEntries = collectRustReferenceEntries(
    sourceByFilePath,
    rustFilePaths,
    rustCommandErrorPattern,
    { rootDir: config.rootDir },
  );
  const tsAppErrorShapeEntries = collectTypeScriptInterfaceProperties(
    tsAppErrorSource,
    config.tsAppErrorAbsoluteFilePath,
    "AppErrorShape",
    { rootDir: config.rootDir },
  );
  const tsAppErrorShapeProperties = formatPropertySurface(tsAppErrorShapeEntries);
  const tsCommandErrorPayloadEntries = collectTypeScriptInterfaceProperties(
    tsNormalizeCommandErrorSource,
    config.tsNormalizeCommandErrorAbsoluteFilePath,
    "CommandErrorPayload",
    { rootDir: config.rootDir },
  );
  const tsCommandErrorPayloadProperties = formatPropertySurface(tsCommandErrorPayloadEntries);
  const normalizedRustErrorSource = normalizeSourceText(rustErrorSource);
  const normalizedTsNormalizeSource = normalizeSourceText(tsNormalizeCommandErrorSource);
  const normalizedTsTauriRuntimeSource = normalizeSourceText(tsTauriCommandRuntimeSource);

  addSurfaceDriftViolation({
    actualSurface: rustPublicItems,
    detail: `desktop-v3 Rust error public surface drifted. Only ${config.allowedRustErrorPublicItems.join(", ")} may remain public in ${config.rustErrorFilePath}.`,
    entries: collectRustTopLevelPublicItemsFromSource(rustErrorSource, config.rustErrorAbsoluteFilePath, {
      rootDir: config.rootDir,
    }),
    expectedSurface: config.allowedRustErrorPublicItems,
    filePath: config.rustErrorFilePath,
    kind: "rust-error-public-surface-drift",
    seenViolations,
    violations,
  });
  addSurfaceDriftViolation({
    actualSurface: rustCommandErrorFields,
    detail: `desktop-v3 CommandError field surface drifted. Only ${config.allowedRustCommandErrorFieldSurface.join(", ")} may remain in ${config.rustErrorFilePath}.`,
    entries: rustCommandErrorFieldsEntries,
    expectedSurface: config.allowedRustCommandErrorFieldSurface,
    filePath: config.rustErrorFilePath,
    kind: "rust-command-error-field-drift",
    seenViolations,
    violations,
  });
  addSurfaceDriftViolation({
    actualSurface: rustCommandErrorPublicMethods,
    detail: `desktop-v3 CommandError method surface drifted. Only ${config.allowedRustCommandErrorPublicMethods.join(", ")} may remain public in ${config.rustErrorFilePath}.`,
    entries: rustCommandErrorMethodEntries,
    expectedSurface: config.allowedRustCommandErrorPublicMethods,
    filePath: config.rustErrorFilePath,
    kind: "rust-command-error-method-drift",
    seenViolations,
    violations,
  });

  for (const [methodName, expectedSignature] of Object.entries(config.allowedRustCommandErrorMethodSignatures)) {
    const actualSignature = rustCommandErrorMethodSignatures[methodName];

    if (actualSignature === expectedSignature) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `desktop-v3 CommandError::${methodName} signature drifted. Expected "${expectedSignature}" but received "${actualSignature ?? "<missing>"}".`,
      filePath: config.rustErrorFilePath,
      kind: "rust-command-error-signature-drift",
      line: rustCommandErrorMethodEntries.find((entry) => entry.name === methodName)?.line ?? 1,
    });
  }

  addSurfaceDriftViolation({
    actualSurface: rustRuntimeErrorVariants,
    detail: `desktop-v3 RuntimeError variant surface drifted. Only ${config.allowedRustRuntimeErrorVariants.join(", ")} may remain in ${config.rustErrorFilePath}.`,
    entries: rustRuntimeErrorVariantsEntries,
    expectedSurface: config.allowedRustRuntimeErrorVariants,
    filePath: config.rustErrorFilePath,
    kind: "rust-runtime-error-variant-drift",
    seenViolations,
    violations,
  });
  addSurfaceDriftViolation({
    actualSurface: rustBackendVariantFields,
    detail: `desktop-v3 RuntimeError::Backend field surface drifted. Only ${config.allowedRustBackendVariantFieldSurface.join(", ")} may remain in ${config.rustErrorFilePath}.`,
    entries: rustBackendVariantFieldEntries,
    expectedSurface: config.allowedRustBackendVariantFieldSurface,
    filePath: config.rustErrorFilePath,
    kind: "rust-backend-variant-field-drift",
    seenViolations,
    violations,
  });
  addSurfaceDriftViolation({
    actualSurface: tsAppErrorShapeProperties,
    detail: `desktop-v3 AppErrorShape drifted. Only ${config.allowedTsAppErrorShapeProperties.join(", ")} may remain in ${config.tsAppErrorFilePath}.`,
    entries: tsAppErrorShapeEntries,
    expectedSurface: config.allowedTsAppErrorShapeProperties,
    filePath: config.tsAppErrorFilePath,
    kind: "ts-app-error-shape-drift",
    seenViolations,
    violations,
  });
  addSurfaceDriftViolation({
    actualSurface: tsCommandErrorPayloadProperties,
    detail: `desktop-v3 CommandErrorPayload drifted. Only ${config.allowedTsCommandErrorPayloadProperties.join(", ")} may remain in ${config.tsNormalizeCommandErrorFilePath}.`,
    entries: tsCommandErrorPayloadEntries,
    expectedSurface: config.allowedTsCommandErrorPayloadProperties,
    filePath: config.tsNormalizeCommandErrorFilePath,
    kind: "ts-command-error-payload-drift",
    seenViolations,
    violations,
  });

  const rustRuntimeErrorExternalReferenceFiles = addReferenceDriftViolations({
    actualEntries: rustRuntimeReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRustRuntimeErrorExternalReferenceFiles,
    detailPrefix: "RuntimeError reference",
    expectedKind: "rust-runtime-error-reference-missing",
    sourceFilePath: config.rustErrorFilePath,
    unexpectedKind: "rust-runtime-error-reference-unexpected",
    seenViolations,
    violations,
  });
  const rustCommandErrorExternalReferenceFiles = addReferenceDriftViolations({
    actualEntries: rustCommandReferenceEntries,
    allowedExternalReferenceFiles: config.allowedRustCommandErrorExternalReferenceFiles,
    detailPrefix: "CommandError reference",
    expectedKind: "rust-command-error-reference-missing",
    sourceFilePath: config.rustErrorFilePath,
    unexpectedKind: "rust-command-error-reference-unexpected",
    seenViolations,
    violations,
  });

  addSnippetDriftViolations({
    allowedSnippets: config.allowedRustRuntimeErrorMappingSnippets,
    filePath: config.rustErrorFilePath,
    kind: "rust-error-mapping-drift",
    label: "desktop-v3 RuntimeError -> CommandError mapping",
    normalizedSource: normalizedRustErrorSource,
    seenViolations,
    violations,
  });
  addSnippetDriftViolations({
    allowedSnippets: config.allowedTsNormalizerSnippets,
    filePath: config.tsNormalizeCommandErrorFilePath,
    kind: "ts-error-normalizer-drift",
    label: "desktop-v3 normalizeCommandError payload mapping",
    normalizedSource: normalizedTsNormalizeSource,
    seenViolations,
    violations,
  });

  if (!normalizedTsTauriRuntimeSource.includes(config.allowedTauriCommandRuntimeErrorNormalizationSnippet)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `desktop-v3 tauri runtime adapter drifted. ${config.tsTauriCommandRuntimeFilePath} must rethrow normalized AppError instances via "${config.allowedTauriCommandRuntimeErrorNormalizationSnippet}".`,
      filePath: config.tsTauriCommandRuntimeFilePath,
      kind: "ts-tauri-runtime-error-normalization-drift",
      line: 1,
    });
  }

  return {
    rustBackendVariantFields,
    rustCommandErrorExternalReferenceFiles,
    rustCommandErrorFields,
    rustCommandErrorMethodSignatures,
    rustPublicItems,
    rustRuntimeErrorExternalReferenceFiles,
    rustRuntimeErrorVariants,
    scannedFileCount: scannedAbsoluteFiles.length,
    scannedFiles: scannedAbsoluteFiles.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
    tsAppErrorShapeProperties,
    tsCommandErrorPayloadProperties,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3ErrorContractGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedErrorContractFiles: [...config.allowedErrorContractFiles],
      allowedRustBackendVariantFieldSurface: [...config.allowedRustBackendVariantFieldSurface],
      allowedRustCommandErrorExternalReferenceFiles: [...config.allowedRustCommandErrorExternalReferenceFiles],
      allowedRustCommandErrorFieldSurface: [...config.allowedRustCommandErrorFieldSurface],
      allowedRustCommandErrorMethodSignatures: { ...config.allowedRustCommandErrorMethodSignatures },
      allowedRustCommandErrorPublicMethods: [...config.allowedRustCommandErrorPublicMethods],
      allowedRustErrorPublicItems: [...config.allowedRustErrorPublicItems],
      allowedRustRuntimeErrorExternalReferenceFiles: [...config.allowedRustRuntimeErrorExternalReferenceFiles],
      allowedRustRuntimeErrorMappingSnippets: [...config.allowedRustRuntimeErrorMappingSnippets],
      allowedRustRuntimeErrorVariants: [...config.allowedRustRuntimeErrorVariants],
      allowedTauriCommandRuntimeErrorNormalizationSnippet:
        config.allowedTauriCommandRuntimeErrorNormalizationSnippet,
      allowedTsAppErrorShapeProperties: [...config.allowedTsAppErrorShapeProperties],
      allowedTsCommandErrorPayloadProperties: [...config.allowedTsCommandErrorPayloadProperties],
      allowedTsNormalizerSnippets: [...config.allowedTsNormalizerSnippets],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      rustBackendVariantFields: [],
      rustCommandErrorExternalReferenceFiles: [],
      rustCommandErrorFields: [],
      rustCommandErrorMethodSignatures: {},
      rustPublicItems: [],
      rustRuntimeErrorExternalReferenceFiles: [],
      rustRuntimeErrorVariants: [],
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      tsAppErrorShapeProperties: [],
      tsCommandErrorPayloadProperties: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3ErrorContractGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 error contract governance failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations
    .slice(0, 10)
    .map(
      (violation) =>
        `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`,
    )
    .join("\n");

  return [
    `desktop-v3 error contract governance failed with ${summary.violationCount} violation(s).`,
    `Summary: ${summary.summaryPath}`,
    preview,
  ]
    .filter(Boolean)
    .join("\n");
}

export function resolveDesktopV3ErrorContractGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_OUTPUT_DIR?.trim()
    || path.join(rootDir, "output", "verification", `desktop-v3-error-contract-governance-${runId}`);

  return {
    allowedErrorContractFiles: [...desktopV3AllowedErrorContractFiles],
    allowedRustBackendVariantFieldSurface: [...desktopV3AllowedRustBackendVariantFieldSurface],
    allowedRustCommandErrorExternalReferenceFiles: [...desktopV3AllowedRustCommandErrorExternalReferenceFiles],
    allowedRustCommandErrorFieldSurface: [...desktopV3AllowedRustCommandErrorFieldSurface],
    allowedRustCommandErrorMethodSignatures: { ...desktopV3AllowedRustCommandErrorMethodSignatures },
    allowedRustCommandErrorPublicMethods: [...desktopV3AllowedRustCommandErrorPublicMethods],
    allowedRustErrorPublicItems: [...desktopV3AllowedRustErrorPublicItems],
    allowedRustRuntimeErrorExternalReferenceFiles: [...desktopV3AllowedRustRuntimeErrorExternalReferenceFiles],
    allowedRustRuntimeErrorMappingSnippets: [...desktopV3AllowedRustRuntimeErrorMappingSnippets],
    allowedRustRuntimeErrorVariants: [...desktopV3AllowedRustRuntimeErrorVariants],
    allowedTauriCommandRuntimeErrorNormalizationSnippet:
      desktopV3AllowedTauriCommandRuntimeErrorNormalizationSnippet,
    allowedTsAppErrorShapeProperties: [...desktopV3AllowedTsAppErrorShapeProperties],
    allowedTsCommandErrorPayloadProperties: [...desktopV3AllowedTsCommandErrorPayloadProperties],
    allowedTsNormalizerSnippets: [...desktopV3AllowedTsNormalizerSnippets],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      rootDir,
      "desktop-v3-error-contract-governance-summary.json",
    ),
    outputDir,
    rootDir,
    runId,
    rustErrorAbsoluteFilePath: path.join(rootDir, desktopV3RustErrorFile),
    rustErrorFilePath: desktopV3RustErrorFile,
    rustSourceDirectory: path.join(rootDir, desktopV3RustSourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
    tsAppErrorAbsoluteFilePath: path.join(rootDir, desktopV3TsAppErrorFile),
    tsAppErrorFilePath: desktopV3TsAppErrorFile,
    tsNormalizeCommandErrorAbsoluteFilePath: path.join(rootDir, desktopV3TsNormalizeCommandErrorFile),
    tsNormalizeCommandErrorFilePath: desktopV3TsNormalizeCommandErrorFile,
    tsTauriCommandRuntimeAbsoluteFilePath: path.join(rootDir, desktopV3TsTauriCommandRuntimeFile),
    tsTauriCommandRuntimeFilePath: desktopV3TsTauriCommandRuntimeFile,
  };
}
