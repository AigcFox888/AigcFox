import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RustSourceDir = "apps/desktop-v3/src-tauri/src";
export const desktopV3CommandsDir = "apps/desktop-v3/src-tauri/src/commands";
export const desktopV3LocaldbDir = "apps/desktop-v3/src-tauri/src/runtime/localdb";
export const desktopV3LocaldbAllowedPublicMethods = Object.freeze([
  "new",
  "initialize",
  "get_preference",
  "set_preference",
  "probe",
  "get_sync_cache_stats",
]);
export const desktopV3LocaldbAllowedFiles = Object.freeze([
  `${desktopV3LocaldbDir}/migrations.rs`,
  `${desktopV3LocaldbDir}/mod.rs`,
]);
export const desktopV3LocaldbAllowedSqliteTouchFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/error.rs",
  `${desktopV3LocaldbDir}/migrations.rs`,
  `${desktopV3LocaldbDir}/mod.rs`,
]);
export const desktopV3LocaldbAllowedExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_RUN_ID?.trim();

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

function sortMethods(methods) {
  return [...methods].sort((left, right) => {
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

function classifyMethodVisibility(token) {
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

function isWithinDirectory(filePath, directoryPath) {
  return filePath === directoryPath || filePath.startsWith(`${directoryPath}/`);
}

function touchesSqlite(sourceText) {
  return sourceText.includes("rusqlite");
}

export function collectDesktopV3LocaldbMembersFromSource(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const methods = [];
  const violations = [];
  const seenViolations = new Set();
  let braceDepth = 0;
  let implDepth = 0;
  let structDepth = 0;
  let inImpl = false;
  let inStruct = false;
  let pendingImpl = false;
  let pendingStruct = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!inImpl && !pendingImpl && /\bimpl\b.*\bLocalDatabase\b/u.test(trimmedLine)) {
      pendingImpl = true;
    }

    if (!inStruct && !pendingStruct && /\bpub\s+struct\s+LocalDatabase\b/u.test(trimmedLine)) {
      pendingStruct = true;
    }

    if (pendingImpl && line.includes("{")) {
      inImpl = true;
      implDepth = braceDepth + 1;
      pendingImpl = false;
    }

    if (pendingStruct && line.includes("{")) {
      inStruct = true;
      structDepth = braceDepth + 1;
      pendingStruct = false;
    }

    if (inImpl && braceDepth === implDepth) {
      const methodMatch = line.match(
        /^\s*(?:(pub(?:\((?:crate|super|self)\))?)\s+)?(?:(?:async|const|unsafe)\s+)*fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/u,
      );

      if (methodMatch) {
        methods.push({
          filePath,
          line: index + 1,
          name: methodMatch[2],
          visibility: classifyMethodVisibility(methodMatch[1] ?? null),
        });
      }
    }

    if (inStruct && braceDepth === structDepth) {
      const fieldMatch = line.match(/^\s*(pub(?:\((?:crate|super|self)\))?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/u);

      if (fieldMatch) {
        addViolation(violations, seenViolations, {
          column: line.indexOf(fieldMatch[1]) + 1,
          detail:
            "LocalDatabase must keep runtime state private. Do not widen the struct surface; rewrite a dedicated adapter first.",
          filePath,
          kind: "localdb-public-field",
          line: index + 1,
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");

    if (inImpl && braceDepth < implDepth) {
      inImpl = false;
      implDepth = 0;
    }

    if (inStruct && braceDepth < structDepth) {
      inStruct = false;
      structDepth = 0;
    }
  }

  return {
    methods: sortMethods(methods),
    violations: sortViolations(violations),
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

export async function listDesktopV3LocaldbRustFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectRustFiles(config.localdbDir, readdirImpl);
}

async function listDesktopV3RustSourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;

  return collectRustFiles(config.rustSourceDir, readdirImpl);
}

export async function collectDesktopV3LocaldbGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? options.filePaths
    : await listDesktopV3LocaldbRustFiles(config, options);
  const rustSourceFilePaths = Array.isArray(options.rustSourceFilePaths)
    ? options.rustSourceFilePaths
    : await listDesktopV3RustSourceFiles(config, options);
  const allowedMethodSet = new Set(config.allowedPublicMethods);
  const allowedLocaldbFileSet = new Set(config.allowedLocaldbFiles);
  const allowedSqliteTouchFileSet = new Set(config.allowedSqliteTouchFiles);
  const allowedExternalReferenceFileSet = new Set(config.allowedExternalReferenceFiles);
  const methods = [];
  const violations = [];
  const seenViolations = new Set();
  const localdbFiles = absoluteFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const scannedFiles = rustSourceFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const sourceTextByFilePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByFilePath.has(filePath)) {
      sourceTextByFilePath.set(filePath, await readFileImpl(filePath, "utf8"));
    }

    return sourceTextByFilePath.get(filePath);
  }

  for (const filePath of localdbFiles) {
    if (allowedLocaldbFileSet.has(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `LocalDatabase file ${filePath} is outside the frozen Wave 1 localdb file set (${config.allowedLocaldbFiles.join(", ")}). Rewrite the adapter/blocking bridge explicitly before splitting more files into the current localdb shape.`,
      filePath,
      kind: "localdb-file-expansion",
      line: 1,
    });
  }

  for (const expectedFilePath of config.allowedLocaldbFiles) {
    if (localdbFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 localdb file ${expectedFilePath} is missing. Update docs and perform a structural rewrite before changing the file boundary.`,
      filePath: expectedFilePath,
      kind: "localdb-file-missing",
      line: 1,
    });
  }

  for (const absoluteFilePath of absoluteFilePaths) {
    const sourceText = await readSourceText(absoluteFilePath);
    const result = collectDesktopV3LocaldbMembersFromSource(sourceText, absoluteFilePath, {
      rootDir: config.rootDir,
    });

    methods.push(...result.methods);

    for (const violation of result.violations) {
      addViolation(violations, seenViolations, violation);
    }
  }

  const sortedMethods = sortMethods(methods);
  const publicMethods = sortMethods(sortedMethods.filter((method) => method.visibility === "public"));
  const privateMethods = sortMethods(sortedMethods.filter((method) => method.visibility === "private"));
  const restrictedMethods = sortMethods(sortedMethods.filter((method) => method.visibility === "restricted"));
  const publicMethodNames = new Set(publicMethods.map((method) => method.name));
  const sqliteTouchFiles = [];
  const localdbReferenceFiles = [];

  for (const method of publicMethods) {
    if (allowedMethodSet.has(method.name)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `LocalDatabase public method ${method.name} is outside the frozen Wave 1 surface (${config.allowedPublicMethods.join(", ")}). Rewrite a dedicated localdb adapter or blocking bridge before expanding responsibilities.`,
      filePath: method.filePath,
      kind: "localdb-public-method-expansion",
      line: method.line,
    });
  }

  for (const method of restrictedMethods) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `LocalDatabase method ${method.name} uses restricted visibility. Wave 1 keeps LocalDatabase closed except for the frozen public surface; rewrite first if broader access is required.`,
      filePath: method.filePath,
      kind: "localdb-restricted-method-expansion",
      line: method.line,
    });
  }

  const missingPublicMethods = config.allowedPublicMethods.filter((methodName) => !publicMethodNames.has(methodName));

  for (const methodName of missingPublicMethods) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 LocalDatabase public method ${methodName} is missing. Update docs and perform a structural rewrite before changing this surface.`,
      filePath: `${desktopV3LocaldbDir}/mod.rs`,
      kind: "localdb-public-method-missing",
      line: 1,
    });
  }

  for (const absoluteFilePath of rustSourceFilePaths) {
    const sourceText = await readSourceText(absoluteFilePath);
    const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);

    if (touchesSqlite(sourceText)) {
      sqliteTouchFiles.push(filePath);

      if (!allowedSqliteTouchFileSet.has(filePath)) {
        const location = findPatternLocation(sourceText, ["rusqlite_migration", "rusqlite"]);

        addViolation(violations, seenViolations, {
          column: location.column,
          detail: `SQLite dependency usage escaped the frozen Wave 1 boundary. ${filePath} touches rusqlite directly, but only ${config.allowedSqliteTouchFiles.join(", ")} may hold SQLite crate references before the adapter/blocking-bridge rewrite.`,
          filePath,
          kind: "localdb-sqlite-touch-expansion",
          line: location.line,
        });
      }
    }

    if (sourceText.includes("LocalDatabase")) {
      localdbReferenceFiles.push(filePath);

      if (!isWithinDirectory(filePath, desktopV3LocaldbDir) && !allowedExternalReferenceFileSet.has(filePath)) {
        const location = findPatternLocation(sourceText, ["LocalDatabase"]);

        addViolation(violations, seenViolations, {
          column: location.column,
          detail: `LocalDatabase usage escaped the frozen Wave 1 boundary. ${filePath} references LocalDatabase directly, but only ${config.allowedExternalReferenceFiles.join(", ")} may touch it outside ${desktopV3LocaldbDir}.`,
          filePath,
          kind: "localdb-reference-file-expansion",
          line: location.line,
        });
      }
    }

    if (isWithinDirectory(filePath, desktopV3CommandsDir) && sourceText.includes("runtime::localdb")) {
      const location = findPatternLocation(sourceText, ["runtime::localdb"]);

      addViolation(violations, seenViolations, {
        column: location.column,
        detail: "commands/* must not import runtime::localdb directly. Keep SQLite behind DesktopRuntime and rewrite the runtime boundary before widening command access.",
        filePath,
        kind: "localdb-command-import-drift",
        line: location.line,
      });
    }
  }

  const uniqueSqliteTouchFiles = sortStrings([...new Set(sqliteTouchFiles)]);
  const uniqueLocaldbReferenceFiles = sortStrings([...new Set(localdbReferenceFiles)]);
  const externalLocaldbReferenceFiles = uniqueLocaldbReferenceFiles.filter(
    (filePath) => !isWithinDirectory(filePath, desktopV3LocaldbDir),
  );

  for (const expectedFilePath of config.allowedSqliteTouchFiles) {
    if (uniqueSqliteTouchFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 SQLite touchpoint ${expectedFilePath} is missing. Update docs and perform a structural rewrite before changing the SQLite dependency boundary.`,
      filePath: expectedFilePath,
      kind: "localdb-sqlite-touch-missing",
      line: 1,
    });
  }

  for (const expectedFilePath of config.allowedExternalReferenceFiles) {
    if (externalLocaldbReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 LocalDatabase external touchpoint ${expectedFilePath} is missing. Update docs and perform a structural rewrite before changing the runtime ownership boundary.`,
      filePath: expectedFilePath,
      kind: "localdb-reference-file-missing",
      line: 1,
    });
  }

  return {
    externalLocaldbReferenceFiles,
    localdbFiles: sortStrings(localdbFiles),
    localdbReferenceFiles: uniqueLocaldbReferenceFiles,
    methods: sortedMethods,
    missingPublicMethods,
    privateMethods,
    publicMethods,
    restrictedMethods,
    scannedFiles: sortStrings(scannedFiles),
    sqliteTouchFiles: uniqueSqliteTouchFiles,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3LocaldbGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedExternalReferenceFiles: [...config.allowedExternalReferenceFiles],
      allowedLocaldbFiles: [...config.allowedLocaldbFiles],
      allowedPublicMethods: [...config.allowedPublicMethods],
      allowedSqliteTouchFiles: [...config.allowedSqliteTouchFiles],
      checkedAt: null,
      error: null,
      externalLocaldbReferenceFiles: [],
      latestSummaryPath: config.latestSummaryPath,
      localdbDir: desktopV3LocaldbDir,
      localdbFiles: [],
      localdbReferenceFiles: [],
      methodCount: 0,
      methods: [],
      missingPublicMethods: [],
      outputDir: config.outputDir,
      privateMethods: [],
      publicMethods: [],
      restrictedMethods: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      sqliteTouchFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3LocaldbGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 localdb governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 localdb governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3LocaldbGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-localdb-governance-${runId}`);

  return {
    allowedExternalReferenceFiles: [...desktopV3LocaldbAllowedExternalReferenceFiles],
    allowedLocaldbFiles: [...desktopV3LocaldbAllowedFiles],
    allowedPublicMethods: [...desktopV3LocaldbAllowedPublicMethods],
    allowedSqliteTouchFiles: [...desktopV3LocaldbAllowedSqliteTouchFiles],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-localdb-governance-summary.json",
    ),
    localdbDir: path.join(workspaceRoot, desktopV3LocaldbDir),
    outputDir,
    rootDir: workspaceRoot,
    rustSourceDir: path.join(workspaceRoot, desktopV3RustSourceDir),
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
