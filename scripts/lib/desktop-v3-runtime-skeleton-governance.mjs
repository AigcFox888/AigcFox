import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RustSourceDir = "apps/desktop-v3/src-tauri/src";
export const desktopV3RuntimeDiagnosticsDir = "apps/desktop-v3/src-tauri/src/runtime/diagnostics";
export const desktopV3RuntimeSecurityDir = "apps/desktop-v3/src-tauri/src/runtime/security";
export const desktopV3RuntimeStateDir = "apps/desktop-v3/src-tauri/src/runtime/state";
export const desktopV3AllowedRuntimeSkeletonFiles = Object.freeze([
  `${desktopV3RuntimeDiagnosticsDir}/mod.rs`,
  `${desktopV3RuntimeSecurityDir}/mod.rs`,
  `${desktopV3RuntimeStateDir}/mod.rs`,
]);
export const desktopV3AllowedSecurityStatusVariants = Object.freeze([
  "Reserved",
  "Ready",
  "Unavailable",
]);
export const desktopV3AllowedSecuritySnapshotFieldSurface = Object.freeze([
  "public:provider",
  "public:status",
  "public:writes_enabled",
]);
export const desktopV3AllowedSecurityPublicMethods = Object.freeze([
  "snapshot",
]);
export const desktopV3AllowedSecurityExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/diagnostics/mod.rs",
  "apps/desktop-v3/src-tauri/src/runtime/models.rs",
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);
export const desktopV3AllowedStateSnapshotFieldSurface = Object.freeze([
  "public:last_backend_probe_at",
]);
export const desktopV3AllowedStateSessionFieldSurface = Object.freeze([
  "private:inner",
]);
export const desktopV3AllowedStatePublicMethods = Object.freeze([
  "record_backend_probe",
  "snapshot",
]);
export const desktopV3AllowedStateExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);
export const desktopV3AllowedDiagnosticsFieldSurface = Object.freeze([
  "private:app_version",
  "private:backend_base_url",
  "private:database_path",
  "private:platform",
]);
export const desktopV3AllowedDiagnosticsPublicMethods = Object.freeze([
  "new",
  "snapshot",
]);
export const desktopV3AllowedDiagnosticsExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);
export const desktopV3AllowedSecurityMethodSignatures = Object.freeze({
  snapshot: "pub fn snapshot(&self) -> SecureStoreSnapshot",
});
export const desktopV3AllowedStateMethodSignatures = Object.freeze({
  record_backend_probe: "pub async fn record_backend_probe(&self, checked_at: String)",
  snapshot: "pub async fn snapshot(&self) -> SessionSnapshot",
});
export const desktopV3AllowedDiagnosticsMethodSignatures = Object.freeze({
  new: "pub fn new(app_version: String, backend_base_url: String, database_path: String, platform: String) -> Self",
  snapshot:
    "pub fn snapshot(&self, database_status: String, dirty_sync_cache_entry_count: u32, last_backend_probe_at: Option<String>, secure_store: SecureStoreSnapshot, sync_cache_entry_count: u32, theme_mode: ThemeMode) -> DiagnosticsSnapshot",
});

const desktopV3SecurityReferencePatterns = Object.freeze([
  /\bSecureStoreSnapshot\b/u,
  /\bSecureStoreStatus\b/u,
  /\bSecureStore\b/u,
]);
const desktopV3StateReferencePatterns = Object.freeze([
  /\bSessionSnapshot\b/u,
  /\bSessionState\b/u,
]);
const desktopV3DiagnosticsReferencePatterns = Object.freeze([
  /\bDiagnosticsService\b/u,
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_RUN_ID?.trim();

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

function addViolation(violations, seen, violation) {
  const key = [
    violation.filePath,
    violation.line,
    violation.column,
    violation.kind,
    violation.detail,
  ].join(":");

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
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

export async function listDesktopV3RuntimeSkeletonRustFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const absoluteFiles = [];

  for (const directoryPath of config.runtimeSkeletonDirectories) {
    absoluteFiles.push(...(await collectRustFiles(directoryPath, readdirImpl)));
  }

  return sortStrings(new Set(absoluteFiles));
}

async function listDesktopV3RustSourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectRustFiles(config.rustSourceDir, readdirImpl);
}

export function collectRustImplMethodsFromSource(sourceText, absoluteFilePath, typeName, options = {}) {
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

    if (!inImpl && !pendingImpl && new RegExp(`\\bimpl\\b.*\\b${typeName}\\b`, "u").test(trimmedLine)) {
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

export function collectRustStructFieldsFromSource(sourceText, absoluteFilePath, structName, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const fields = [];
  let braceDepth = 0;
  let structDepth = 0;
  let inStruct = false;
  let pendingStruct = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!inStruct && !pendingStruct && new RegExp(`\\bstruct\\s+${structName}\\b`, "u").test(trimmedLine)) {
      pendingStruct = true;
    }

    if (pendingStruct && line.includes("{")) {
      inStruct = true;
      structDepth = braceDepth + 1;
      pendingStruct = false;
    }

    if (inStruct && braceDepth === structDepth) {
      const fieldMatch = line.match(
        /^\s*(?:(pub(?:\((?:crate|super|self)\))?)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*:/u,
      );

      if (fieldMatch) {
        fields.push({
          filePath,
          line: index + 1,
          name: fieldMatch[2],
          visibility: classifyVisibility(fieldMatch[1] ?? null),
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");

    if (inStruct && braceDepth < structDepth) {
      inStruct = false;
      structDepth = 0;
    }
  }

  return sortNamedEntries(fields);
}

export function collectRustEnumVariantsFromSource(sourceText, absoluteFilePath, enumName, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const variants = [];
  let braceDepth = 0;
  let enumDepth = 0;
  let inEnum = false;
  let pendingEnum = false;

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

    if (inEnum && braceDepth === enumDepth) {
      const variantMatch = line.match(/^\s*([A-Z][A-Za-z0-9_]*)\s*(?:,|=|\(|\{)?/u);

      if (variantMatch) {
        variants.push({
          filePath,
          line: index + 1,
          name: variantMatch[1],
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");

    if (inEnum && braceDepth < enumDepth) {
      inEnum = false;
      enumDepth = 0;
    }
  }

  return sortNamedEntries(variants);
}

function buildSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.visibility}:${entry.name}`));
}

function findNamedEntry(entries, name) {
  return entries.find((entry) => entry.name === name) ?? null;
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

  const line = entries[0]?.line ?? 1;

  addViolation(violations, seenViolations, {
    column: 1,
    detail,
    filePath,
    kind,
    line,
  });
}

function addSignatureDriftViolation({
  detail,
  expectedSignatures,
  filePath,
  kind,
  methods,
  violations,
  seenViolations,
}) {
  for (const [methodName, expectedSignature] of Object.entries(expectedSignatures)) {
    const method = findNamedEntry(methods, methodName);

    if (method === null || method.signature === expectedSignature) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detail} Expected ${expectedSignature}, but found ${method.signature}.`,
      filePath: method.filePath,
      kind,
      line: method.line,
    });
  }
}

function addReferenceDriftViolations({
  allowedExternalReferenceFiles,
  detail,
  kind,
  moduleFilePath,
  referenceFiles,
  violations,
  seenViolations,
}) {
  const allowedExternalReferenceFileSet = new Set(allowedExternalReferenceFiles);

  for (const filePath of referenceFiles) {
    if (filePath === moduleFilePath || allowedExternalReferenceFileSet.has(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail,
      filePath,
      kind,
      line: 1,
    });
  }

  const externalReferenceFiles = referenceFiles.filter((filePath) => filePath !== moduleFilePath);

  for (const expectedFilePath of allowedExternalReferenceFiles) {
    if (externalReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; update docs and rewrite the runtime ownership boundary before changing this touchpoint.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }

  return sortStrings(new Set(externalReferenceFiles));
}

function filePathToModuleLabel(filePath) {
  if (filePath.startsWith(desktopV3RuntimeSecurityDir)) {
    return "security";
  }

  if (filePath.startsWith(desktopV3RuntimeStateDir)) {
    return "state";
  }

  if (filePath.startsWith(desktopV3RuntimeDiagnosticsDir)) {
    return "diagnostics";
  }

  return "runtime-skeleton";
}

export async function collectDesktopV3RuntimeSkeletonGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? options.filePaths
    : await listDesktopV3RuntimeSkeletonRustFiles(config, options);
  const rustSourceFilePaths = Array.isArray(options.rustSourceFilePaths)
    ? options.rustSourceFilePaths
    : await listDesktopV3RustSourceFiles(config, options);
  const allowedFileSet = new Set(config.allowedRuntimeSkeletonFiles);
  const violations = [];
  const seenViolations = new Set();
  const runtimeSkeletonFiles = sortStrings(
    absoluteFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const scannedFiles = sortStrings(
    rustSourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const sourceTextByFilePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByFilePath.has(filePath)) {
      sourceTextByFilePath.set(filePath, await readFileImpl(filePath, "utf8"));
    }

    return sourceTextByFilePath.get(filePath);
  }

  for (const filePath of runtimeSkeletonFiles) {
    if (allowedFileSet.has(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `runtime/${filePathToModuleLabel(filePath)} file ${filePath} escaped the frozen Wave 1 skeleton file set (${config.allowedRuntimeSkeletonFiles.join(", ")}). Rewrite the module boundary before splitting more files into this surface.`,
      filePath,
      kind: "runtime-skeleton-file-expansion",
      line: 1,
    });
  }

  for (const expectedFilePath of config.allowedRuntimeSkeletonFiles) {
    if (runtimeSkeletonFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 runtime skeleton file ${expectedFilePath} is missing. Update docs and perform a structural rewrite before changing this module boundary.`,
      filePath: expectedFilePath,
      kind: "runtime-skeleton-file-missing",
      line: 1,
    });
  }

  const securitySourceText = await readSourceText(config.securityFilePath);
  const stateSourceText = await readSourceText(config.stateFilePath);
  const diagnosticsSourceText = await readSourceText(config.diagnosticsFilePath);

  const securityEnumVariants = collectRustEnumVariantsFromSource(
    securitySourceText,
    config.securityFilePath,
    "SecureStoreStatus",
    { rootDir: config.rootDir },
  );
  const securitySnapshotFields = collectRustStructFieldsFromSource(
    securitySourceText,
    config.securityFilePath,
    "SecureStoreSnapshot",
    { rootDir: config.rootDir },
  );
  const securityMethods = collectRustImplMethodsFromSource(
    securitySourceText,
    config.securityFilePath,
    "SecureStore",
    { rootDir: config.rootDir },
  );
  const stateSnapshotFields = collectRustStructFieldsFromSource(
    stateSourceText,
    config.stateFilePath,
    "SessionSnapshot",
    { rootDir: config.rootDir },
  );
  const stateSessionFields = collectRustStructFieldsFromSource(
    stateSourceText,
    config.stateFilePath,
    "SessionState",
    { rootDir: config.rootDir },
  );
  const stateMethods = collectRustImplMethodsFromSource(
    stateSourceText,
    config.stateFilePath,
    "SessionState",
    { rootDir: config.rootDir },
  );
  const diagnosticsFields = collectRustStructFieldsFromSource(
    diagnosticsSourceText,
    config.diagnosticsFilePath,
    "DiagnosticsService",
    { rootDir: config.rootDir },
  );
  const diagnosticsMethods = collectRustImplMethodsFromSource(
    diagnosticsSourceText,
    config.diagnosticsFilePath,
    "DiagnosticsService",
    { rootDir: config.rootDir },
  );

  addSurfaceDriftViolation({
    actualSurface: securityEnumVariants.map((entry) => entry.name),
    detail: `SecureStoreStatus variants drifted from the frozen Wave 1 set (${config.allowedSecurityStatusVariants.join(", ")}). Wave 1 keeps secure-store state limited to reserved diagnostics; rewrite the module before widening status semantics.`,
    entries: securityEnumVariants,
    expectedSurface: config.allowedSecurityStatusVariants,
    filePath: `${desktopV3RuntimeSecurityDir}/mod.rs`,
    kind: "runtime-skeleton-security-status-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: buildSurface(securitySnapshotFields),
    detail: `SecureStoreSnapshot fields drifted from the frozen Wave 1 surface (${config.allowedSecuritySnapshotFieldSurface.join(", ")}). Do not widen secure-store diagnostics in place; rewrite the security boundary first.`,
    entries: securitySnapshotFields,
    expectedSurface: config.allowedSecuritySnapshotFieldSurface,
    filePath: `${desktopV3RuntimeSecurityDir}/mod.rs`,
    kind: "runtime-skeleton-security-snapshot-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: securityMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `SecureStore public methods drifted from the frozen Wave 1 surface (${config.allowedSecurityPublicMethods.join(", ")}). Wave 1 only allows diagnostics snapshot reads; rewrite before adding write/probe helpers.`,
    entries: securityMethods,
    expectedSurface: config.allowedSecurityPublicMethods,
    filePath: `${desktopV3RuntimeSecurityDir}/mod.rs`,
    kind: "runtime-skeleton-security-public-method-drift",
    violations,
    seenViolations,
  });

  for (const method of securityMethods.filter((entry) => entry.visibility === "restricted")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "SecureStore must stay closed except for snapshot(). Restricted visibility is not allowed in the frozen Wave 1 skeleton.",
      filePath: method.filePath,
      kind: "runtime-skeleton-security-restricted-method",
      line: method.line,
    });
  }

  for (const method of securityMethods.filter((entry) => entry.visibility === "private")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "SecureStore private helpers are not part of the frozen Wave 1 skeleton. Rewrite the security module before adding real secure-store internals.",
      filePath: method.filePath,
      kind: "runtime-skeleton-security-private-method-drift",
      line: method.line,
    });
  }

  addSignatureDriftViolation({
    detail: "SecureStore method signature drifted from the frozen Wave 1 skeleton.",
    expectedSignatures: config.allowedSecurityMethodSignatures,
    filePath: `${desktopV3RuntimeSecurityDir}/mod.rs`,
    kind: "runtime-skeleton-security-signature-drift",
    methods: securityMethods.filter((entry) => entry.visibility === "public"),
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: buildSurface(stateSnapshotFields),
    detail: `SessionSnapshot fields drifted from the frozen Wave 1 surface (${config.allowedStateSnapshotFieldSurface.join(", ")}). Keep runtime session state minimal; rewrite before widening session payload.`,
    entries: stateSnapshotFields,
    expectedSurface: config.allowedStateSnapshotFieldSurface,
    filePath: `${desktopV3RuntimeStateDir}/mod.rs`,
    kind: "runtime-skeleton-state-snapshot-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: buildSurface(stateSessionFields),
    detail: `SessionState fields drifted from the frozen Wave 1 surface (${config.allowedStateSessionFieldSurface.join(", ")}). Keep runtime ownership private and rewrite before widening shared state internals.`,
    entries: stateSessionFields,
    expectedSurface: config.allowedStateSessionFieldSurface,
    filePath: `${desktopV3RuntimeStateDir}/mod.rs`,
    kind: "runtime-skeleton-state-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: stateMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `SessionState public methods drifted from the frozen Wave 1 surface (${config.allowedStatePublicMethods.join(", ")}). Rewrite the runtime state boundary before adding new session APIs.`,
    entries: stateMethods,
    expectedSurface: config.allowedStatePublicMethods,
    filePath: `${desktopV3RuntimeStateDir}/mod.rs`,
    kind: "runtime-skeleton-state-public-method-drift",
    violations,
    seenViolations,
  });

  for (const method of stateMethods.filter((entry) => entry.visibility === "restricted")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "SessionState restricted methods are not allowed in the frozen Wave 1 skeleton. Rewrite before widening access beyond the public surface.",
      filePath: method.filePath,
      kind: "runtime-skeleton-state-restricted-method",
      line: method.line,
    });
  }

  for (const method of stateMethods.filter((entry) => entry.visibility === "private")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "SessionState private helpers are outside the frozen Wave 1 skeleton. Rewrite the state module before adding internal orchestration.",
      filePath: method.filePath,
      kind: "runtime-skeleton-state-private-method-drift",
      line: method.line,
    });
  }

  addSignatureDriftViolation({
    detail: "SessionState method signature drifted from the frozen Wave 1 skeleton.",
    expectedSignatures: config.allowedStateMethodSignatures,
    filePath: `${desktopV3RuntimeStateDir}/mod.rs`,
    kind: "runtime-skeleton-state-signature-drift",
    methods: stateMethods.filter((entry) => entry.visibility === "public"),
    violations,
    seenViolations,
  });

  addSurfaceDriftViolation({
    actualSurface: buildSurface(diagnosticsFields),
    detail: `DiagnosticsService fields drifted from the frozen Wave 1 surface (${config.allowedDiagnosticsFieldSurface.join(", ")}). Rewrite the diagnostics boundary before widening service ownership or cached state.`,
    entries: diagnosticsFields,
    expectedSurface: config.allowedDiagnosticsFieldSurface,
    filePath: `${desktopV3RuntimeDiagnosticsDir}/mod.rs`,
    kind: "runtime-skeleton-diagnostics-field-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: diagnosticsMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    detail: `DiagnosticsService public methods drifted from the frozen Wave 1 surface (${config.allowedDiagnosticsPublicMethods.join(", ")}). Rewrite the diagnostics module before adding more orchestration endpoints.`,
    entries: diagnosticsMethods,
    expectedSurface: config.allowedDiagnosticsPublicMethods,
    filePath: `${desktopV3RuntimeDiagnosticsDir}/mod.rs`,
    kind: "runtime-skeleton-diagnostics-public-method-drift",
    violations,
    seenViolations,
  });

  for (const method of diagnosticsMethods.filter((entry) => entry.visibility === "restricted")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "DiagnosticsService restricted methods are not allowed in the frozen Wave 1 skeleton. Rewrite before widening access beyond the current service surface.",
      filePath: method.filePath,
      kind: "runtime-skeleton-diagnostics-restricted-method",
      line: method.line,
    });
  }

  for (const method of diagnosticsMethods.filter((entry) => entry.visibility === "private")) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: "DiagnosticsService private helpers are outside the frozen Wave 1 skeleton. Rewrite the diagnostics module before adding internal composition layers.",
      filePath: method.filePath,
      kind: "runtime-skeleton-diagnostics-private-method-drift",
      line: method.line,
    });
  }

  addSignatureDriftViolation({
    detail: "DiagnosticsService method signature drifted from the frozen Wave 1 skeleton.",
    expectedSignatures: config.allowedDiagnosticsMethodSignatures,
    filePath: `${desktopV3RuntimeDiagnosticsDir}/mod.rs`,
    kind: "runtime-skeleton-diagnostics-signature-drift",
    methods: diagnosticsMethods.filter((entry) => entry.visibility === "public"),
    violations,
    seenViolations,
  });

  const securityReferenceFiles = [];
  const stateReferenceFiles = [];
  const diagnosticsReferenceFiles = [];

  for (const absoluteFilePath of rustSourceFilePaths) {
    const sourceText = await readSourceText(absoluteFilePath);
    const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);

    if (desktopV3SecurityReferencePatterns.some((pattern) => pattern.test(sourceText))) {
      securityReferenceFiles.push(filePath);
    }

    if (desktopV3StateReferencePatterns.some((pattern) => pattern.test(sourceText))) {
      stateReferenceFiles.push(filePath);
    }

    if (desktopV3DiagnosticsReferencePatterns.some((pattern) => pattern.test(sourceText))) {
      diagnosticsReferenceFiles.push(filePath);
    }
  }

  const uniqueSecurityReferenceFiles = sortStrings(new Set(securityReferenceFiles));
  const uniqueStateReferenceFiles = sortStrings(new Set(stateReferenceFiles));
  const uniqueDiagnosticsReferenceFiles = sortStrings(new Set(diagnosticsReferenceFiles));
  const externalSecurityReferenceFiles = addReferenceDriftViolations({
    allowedExternalReferenceFiles: config.allowedSecurityExternalReferenceFiles,
    detail: `SecureStore usage escaped the frozen Wave 1 ownership boundary. Only ${config.allowedSecurityExternalReferenceFiles.join(", ")} may reference SecureStore types outside ${desktopV3RuntimeSecurityDir}/mod.rs.`,
    kind: "runtime-skeleton-security-reference-drift",
    moduleFilePath: `${desktopV3RuntimeSecurityDir}/mod.rs`,
    referenceFiles: uniqueSecurityReferenceFiles,
    violations,
    seenViolations,
  });
  const externalStateReferenceFiles = addReferenceDriftViolations({
    allowedExternalReferenceFiles: config.allowedStateExternalReferenceFiles,
    detail: `SessionState usage escaped the frozen Wave 1 ownership boundary. Only ${config.allowedStateExternalReferenceFiles.join(", ")} may reference SessionState types outside ${desktopV3RuntimeStateDir}/mod.rs.`,
    kind: "runtime-skeleton-state-reference-drift",
    moduleFilePath: `${desktopV3RuntimeStateDir}/mod.rs`,
    referenceFiles: uniqueStateReferenceFiles,
    violations,
    seenViolations,
  });
  const externalDiagnosticsReferenceFiles = addReferenceDriftViolations({
    allowedExternalReferenceFiles: config.allowedDiagnosticsExternalReferenceFiles,
    detail: `DiagnosticsService usage escaped the frozen Wave 1 ownership boundary. Only ${config.allowedDiagnosticsExternalReferenceFiles.join(", ")} may reference DiagnosticsService outside ${desktopV3RuntimeDiagnosticsDir}/mod.rs.`,
    kind: "runtime-skeleton-diagnostics-reference-drift",
    moduleFilePath: `${desktopV3RuntimeDiagnosticsDir}/mod.rs`,
    referenceFiles: uniqueDiagnosticsReferenceFiles,
    violations,
    seenViolations,
  });

  return {
    diagnosticsFields,
    diagnosticsMethods,
    diagnosticsReferenceFiles: uniqueDiagnosticsReferenceFiles,
    externalDiagnosticsReferenceFiles,
    externalSecurityReferenceFiles,
    externalStateReferenceFiles,
    runtimeSkeletonFiles,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    securityEnumVariants,
    securityMethods,
    securityReferenceFiles: uniqueSecurityReferenceFiles,
    securitySnapshotFields,
    stateMethods,
    stateReferenceFiles: uniqueStateReferenceFiles,
    stateSessionFields,
    stateSnapshotFields,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3RuntimeSkeletonGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedDiagnosticsExternalReferenceFiles: [...config.allowedDiagnosticsExternalReferenceFiles],
      allowedDiagnosticsFieldSurface: [...config.allowedDiagnosticsFieldSurface],
      allowedDiagnosticsMethodSignatures: { ...config.allowedDiagnosticsMethodSignatures },
      allowedDiagnosticsPublicMethods: [...config.allowedDiagnosticsPublicMethods],
      allowedRuntimeSkeletonFiles: [...config.allowedRuntimeSkeletonFiles],
      allowedSecurityExternalReferenceFiles: [...config.allowedSecurityExternalReferenceFiles],
      allowedSecurityMethodSignatures: { ...config.allowedSecurityMethodSignatures },
      allowedSecurityPublicMethods: [...config.allowedSecurityPublicMethods],
      allowedSecuritySnapshotFieldSurface: [...config.allowedSecuritySnapshotFieldSurface],
      allowedSecurityStatusVariants: [...config.allowedSecurityStatusVariants],
      allowedStateExternalReferenceFiles: [...config.allowedStateExternalReferenceFiles],
      allowedStateMethodSignatures: { ...config.allowedStateMethodSignatures },
      allowedStatePublicMethods: [...config.allowedStatePublicMethods],
      allowedStateSessionFieldSurface: [...config.allowedStateSessionFieldSurface],
      allowedStateSnapshotFieldSurface: [...config.allowedStateSnapshotFieldSurface],
      checkedAt: null,
      diagnosticsFields: [],
      diagnosticsMethods: [],
      diagnosticsReferenceFiles: [],
      error: null,
      externalDiagnosticsReferenceFiles: [],
      externalSecurityReferenceFiles: [],
      externalStateReferenceFiles: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      runtimeSkeletonFiles: [],
      scannedFileCount: 0,
      scannedFiles: [],
      securityEnumVariants: [],
      securityMethods: [],
      securityReferenceFiles: [],
      securitySnapshotFields: [],
      stateMethods: [],
      stateReferenceFiles: [],
      stateSessionFields: [],
      stateSnapshotFields: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3RuntimeSkeletonGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 runtime skeleton governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 runtime skeleton governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3RuntimeSkeletonGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-runtime-skeleton-governance-${runId}`);

  return {
    allowedDiagnosticsExternalReferenceFiles: [...desktopV3AllowedDiagnosticsExternalReferenceFiles],
    allowedDiagnosticsFieldSurface: [...desktopV3AllowedDiagnosticsFieldSurface],
    allowedDiagnosticsMethodSignatures: { ...desktopV3AllowedDiagnosticsMethodSignatures },
    allowedDiagnosticsPublicMethods: [...desktopV3AllowedDiagnosticsPublicMethods],
    allowedRuntimeSkeletonFiles: [...desktopV3AllowedRuntimeSkeletonFiles],
    allowedSecurityExternalReferenceFiles: [...desktopV3AllowedSecurityExternalReferenceFiles],
    allowedSecurityMethodSignatures: { ...desktopV3AllowedSecurityMethodSignatures },
    allowedSecurityPublicMethods: [...desktopV3AllowedSecurityPublicMethods],
    allowedSecuritySnapshotFieldSurface: [...desktopV3AllowedSecuritySnapshotFieldSurface],
    allowedSecurityStatusVariants: [...desktopV3AllowedSecurityStatusVariants],
    allowedStateExternalReferenceFiles: [...desktopV3AllowedStateExternalReferenceFiles],
    allowedStateMethodSignatures: { ...desktopV3AllowedStateMethodSignatures },
    allowedStatePublicMethods: [...desktopV3AllowedStatePublicMethods],
    allowedStateSessionFieldSurface: [...desktopV3AllowedStateSessionFieldSurface],
    allowedStateSnapshotFieldSurface: [...desktopV3AllowedStateSnapshotFieldSurface],
    diagnosticsFilePath: path.join(workspaceRoot, `${desktopV3RuntimeDiagnosticsDir}/mod.rs`),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-runtime-skeleton-governance-summary.json",
    ),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    runtimeSkeletonDirectories: [
      path.join(workspaceRoot, desktopV3RuntimeDiagnosticsDir),
      path.join(workspaceRoot, desktopV3RuntimeSecurityDir),
      path.join(workspaceRoot, desktopV3RuntimeStateDir),
    ],
    rustSourceDir: path.join(workspaceRoot, desktopV3RustSourceDir),
    securityFilePath: path.join(workspaceRoot, `${desktopV3RuntimeSecurityDir}/mod.rs`),
    stateFilePath: path.join(workspaceRoot, `${desktopV3RuntimeStateDir}/mod.rs`),
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
