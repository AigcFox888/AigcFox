import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RustSourceDir = "apps/desktop-v3/src-tauri/src";
export const desktopV3RuntimeClientDir = "apps/desktop-v3/src-tauri/src/runtime/client";
export const desktopV3AllowedBackendClientFiles = Object.freeze([
  `${desktopV3RuntimeClientDir}/backend_client.rs`,
  `${desktopV3RuntimeClientDir}/mod.rs`,
  `${desktopV3RuntimeClientDir}/probe_contract.rs`,
]);
export const desktopV3AllowedBackendClientModuleDeclarations = Object.freeze([
  "pub mod backend_client;",
  "mod probe_contract;",
]);
export const desktopV3AllowedBackendClientPublicMethods = Object.freeze([
  "new",
  "base_url",
  "get_liveness",
  "get_readiness",
]);
export const desktopV3AllowedBackendClientPrivateMethods = Object.freeze([
  "get_probe",
]);
export const desktopV3AllowedBackendClientProbePaths = Object.freeze([
  "/api/v1/healthz",
  "/readyz",
]);
export const desktopV3AllowedProbeContractPublicTypes = Object.freeze([
  "BackendEnvelope",
  "BackendMeta",
  "BackendErrorPayload",
  "BackendProbeData",
]);
export const desktopV3AllowedProbeContractPublicFunctions = Object.freeze([
  "parse_backend_probe_envelope",
]);
export const desktopV3AllowedProbeContractPrivateFunctions = Object.freeze([
  "build_backend_error",
]);
export const desktopV3AllowedReqwestTouchFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/error.rs",
  `${desktopV3RuntimeClientDir}/backend_client.rs`,
  `${desktopV3RuntimeClientDir}/probe_contract.rs`,
]);
export const desktopV3AllowedBackendClientExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
]);
export const desktopV3AllowedProbeContractReferenceFiles = Object.freeze([
  `${desktopV3RuntimeClientDir}/backend_client.rs`,
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_RUN_ID?.trim();

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
      const match = lines[index].match(pattern);

      if (match?.index !== undefined) {
        return {
          column: match.index + 1,
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

function classifyVisibility(token) {
  if (token === "pub") {
    return "public";
  }

  if (typeof token === "string" && token.startsWith("pub(")) {
    return "restricted";
  }

  return "private";
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

export function collectDesktopV3BackendClientModuleDeclarations(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);

  return sourceText
    .split(/\r?\n/u)
    .map((line, index) => {
      const match = line.match(/^\s*((?:pub\s+)?mod\s+[A-Za-z_][A-Za-z0-9_]*\s*;)\s*$/u);

      if (!match) {
        return null;
      }

      return {
        filePath,
        line: index + 1,
        name: match[1].replace(/\s+/gu, " ").trim(),
      };
    })
    .filter((entry) => entry !== null);
}

export function collectDesktopV3BackendClientMethodsFromSource(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const methods = [];
  let braceDepth = 0;
  let implDepth = 0;
  let inImpl = false;
  let pendingImpl = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!inImpl && !pendingImpl && /\bimpl\b.*\bBackendClient\b/u.test(trimmedLine)) {
      pendingImpl = true;
    }

    if (pendingImpl && line.includes("{")) {
      inImpl = true;
      implDepth = braceDepth + 1;
      pendingImpl = false;
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
          visibility: classifyVisibility(methodMatch[1] ?? null),
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");

    if (inImpl && braceDepth < implDepth) {
      inImpl = false;
      implDepth = 0;
    }
  }

  return sortNamedEntries(methods);
}

export function collectDesktopV3ProbeContractSurfaceFromSource(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const functions = [];
  const types = [];
  let braceDepth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (braceDepth === 0) {
      const typeMatch = line.match(
        /^\s*(?:(pub(?:\((?:crate|super|self)\))?)\s+)?struct\s+([A-Za-z_][A-Za-z0-9_]*)\b/u,
      );

      if (typeMatch) {
        types.push({
          filePath,
          line: index + 1,
          name: typeMatch[2],
          visibility: classifyVisibility(typeMatch[1] ?? null),
        });
      }

      const functionMatch = line.match(
        /^\s*(?:(pub(?:\((?:crate|super|self)\))?)\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/u,
      );

      if (functionMatch) {
        functions.push({
          filePath,
          line: index + 1,
          name: functionMatch[2],
          visibility: classifyVisibility(functionMatch[1] ?? null),
        });
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");
  }

  return {
    functions: sortNamedEntries(functions),
    types: sortNamedEntries(types),
  };
}

function extractBackendClientProbePaths(sourceText, absoluteFilePath, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const entries = [];

  for (const match of sourceText.matchAll(/get_probe\("([^"]+)"\)/gu)) {
    const location = findPatternLocation(sourceText, [new RegExp(`get_probe\\("${match[1].replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}"\\)`, "u")]);
    entries.push({
      filePath,
      line: location.line,
      name: match[1],
      visibility: "private",
    });
  }

  return sortNamedEntries(entries);
}

function collectSymbolReferenceFiles(scannedFiles, fileContents, workspaceRoot, matcher) {
  return sortStrings(
    scannedFiles.filter((filePath) => {
      const sourceText = fileContents.get(filePath) ?? "";
      return matcher(sourceText, filePath, workspaceRoot);
    }),
  );
}

function referencesBackendClient(sourceText, filePath) {
  if (filePath === `${desktopV3RuntimeClientDir}/backend_client.rs`) {
    return false;
  }

  return /\bBackendClient\b/u.test(sourceText);
}

function referencesProbeContract(sourceText, filePath) {
  if (filePath === `${desktopV3RuntimeClientDir}/probe_contract.rs`) {
    return false;
  }

  return /\b(?:BackendEnvelope|BackendMeta|BackendErrorPayload|BackendProbeData|parse_backend_probe_envelope)\b/u.test(
    sourceText,
  );
}

function touchesReqwest(sourceText) {
  return /\breqwest\b/u.test(sourceText);
}

export async function collectDesktopV3BackendClientGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? [...options.filePaths].sort((left, right) => left.localeCompare(right))
    : await collectRustFiles(config.rustSourceDir, readdirImpl);
  const seenViolations = new Set();
  const violations = [];
  const scannedFiles = absoluteFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const fileContents = new Map();

  for (const absoluteFilePath of absoluteFilePaths) {
    fileContents.set(
      normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath),
      await readFileImpl(absoluteFilePath, "utf8"),
    );
  }

  const clientFiles = scannedFiles.filter((filePath) => filePath.startsWith(`${desktopV3RuntimeClientDir}/`));
  const clientFileSet = new Set(clientFiles);

  for (const filePath of clientFiles) {
    if (config.allowedFiles.includes(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `runtime/client file ${filePath} is outside the frozen Wave 1 backend-client file set (${config.allowedFiles.join(", ")}). Rewrite the remote client boundary before adding new client modules.`,
      filePath,
      kind: "backend-client-file-expansion",
      line: 1,
    });
  }

  for (const filePath of config.allowedFiles) {
    if (clientFileSet.has(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen backend-client file ${filePath} is missing.`,
      filePath,
      kind: "backend-client-file-missing",
      line: 1,
    });
  }

  const modFilePath = `${desktopV3RuntimeClientDir}/mod.rs`;
  const backendClientFilePath = `${desktopV3RuntimeClientDir}/backend_client.rs`;
  const probeContractFilePath = `${desktopV3RuntimeClientDir}/probe_contract.rs`;
  const modSource = fileContents.get(modFilePath) ?? "";
  const backendClientSource = fileContents.get(backendClientFilePath) ?? "";
  const probeContractSource = fileContents.get(probeContractFilePath) ?? "";
  const moduleDeclarations = collectDesktopV3BackendClientModuleDeclarations(
    modSource,
    path.join(config.rootDir, modFilePath),
    { rootDir: config.rootDir },
  );
  const backendClientMethods = collectDesktopV3BackendClientMethodsFromSource(
    backendClientSource,
    path.join(config.rootDir, backendClientFilePath),
    { rootDir: config.rootDir },
  );
  const probeContractSurface = collectDesktopV3ProbeContractSurfaceFromSource(
    probeContractSource,
    path.join(config.rootDir, probeContractFilePath),
    { rootDir: config.rootDir },
  );
  const probePaths = extractBackendClientProbePaths(
    backendClientSource,
    path.join(config.rootDir, backendClientFilePath),
    { rootDir: config.rootDir },
  );

  const moduleDeclarationNames = moduleDeclarations.map((entry) => entry.name);
  const publicBackendClientMethods = backendClientMethods
    .filter((entry) => entry.visibility === "public")
    .map((entry) => entry.name);
  const restrictedBackendClientMethods = backendClientMethods
    .filter((entry) => entry.visibility === "restricted")
    .map((entry) => entry.name);
  const privateBackendClientMethods = backendClientMethods
    .filter((entry) => entry.visibility === "private")
    .map((entry) => entry.name);
  const publicProbeContractTypes = probeContractSurface.types
    .filter((entry) => entry.visibility === "public")
    .map((entry) => entry.name);
  const restrictedProbeContractTypes = probeContractSurface.types
    .filter((entry) => entry.visibility === "restricted")
    .map((entry) => entry.name);
  const publicProbeContractFunctions = probeContractSurface.functions
    .filter((entry) => entry.visibility === "public")
    .map((entry) => entry.name);
  const restrictedProbeContractFunctions = probeContractSurface.functions
    .filter((entry) => entry.visibility === "restricted")
    .map((entry) => entry.name);
  const privateProbeContractFunctions = probeContractSurface.functions
    .filter((entry) => entry.visibility === "private")
    .map((entry) => entry.name);
  const probePathValues = probePaths.map((entry) => entry.name);
  const reqwestTouchFiles = collectSymbolReferenceFiles(
    scannedFiles,
    fileContents,
    config.rootDir,
    (sourceText) => touchesReqwest(sourceText),
  );
  const backendClientReferenceFiles = collectSymbolReferenceFiles(
    scannedFiles,
    fileContents,
    config.rootDir,
    (sourceText, filePath) => referencesBackendClient(sourceText, filePath),
  );
  const probeContractReferenceFiles = collectSymbolReferenceFiles(
    scannedFiles,
    fileContents,
    config.rootDir,
    (sourceText, filePath) => referencesProbeContract(sourceText, filePath),
  );

  if (JSON.stringify(moduleDeclarationNames) !== JSON.stringify(config.allowedModuleDeclarations)) {
    const location = findPatternLocation(modSource, [/mod\s+backend_client/u, /mod\s+probe_contract/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `runtime/client module declarations drifted from the frozen Wave 1 set (${config.allowedModuleDeclarations.join(", ")}).`,
      filePath: modFilePath,
      kind: "backend-client-module-drift",
      line: location.line,
    });
  }

  if (
    JSON.stringify(publicBackendClientMethods) !== JSON.stringify(config.allowedPublicMethods)
  ) {
    const location = findPatternLocation(backendClientSource, [/fn\s+new/u, /fn\s+get_liveness/u, /fn\s+get_readiness/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `BackendClient public methods drifted from the frozen Wave 1 set (${config.allowedPublicMethods.join(", ")}).`,
      filePath: backendClientFilePath,
      kind: "backend-client-public-method-drift",
      line: location.line,
    });
  }

  if (restrictedBackendClientMethods.length > 0) {
    const location = findPatternLocation(backendClientSource, [/pub\((?:crate|super|self)\)\s+.*fn/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: "BackendClient must not expose crate-visible or super-visible methods. Rewrite a dedicated remote adapter before widening the surface.",
      filePath: backendClientFilePath,
      kind: "backend-client-restricted-method",
      line: location.line,
    });
  }

  if (
    JSON.stringify(privateBackendClientMethods) !== JSON.stringify(config.allowedPrivateMethods)
  ) {
    const location = findPatternLocation(backendClientSource, [/fn\s+get_probe/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `BackendClient private helper methods drifted from the frozen Wave 1 set (${config.allowedPrivateMethods.join(", ")}).`,
      filePath: backendClientFilePath,
      kind: "backend-client-private-method-drift",
      line: location.line,
    });
  }

  if (JSON.stringify(probePathValues) !== JSON.stringify(config.allowedProbePaths)) {
    const location = findPatternLocation(backendClientSource, [/get_probe\("/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `BackendClient probe paths drifted from the frozen Wave 1 probe-only set (${config.allowedProbePaths.join(", ")}).`,
      filePath: backendClientFilePath,
      kind: "backend-client-probe-path-drift",
      line: location.line,
    });
  }

  if (
    JSON.stringify(publicProbeContractTypes) !== JSON.stringify(config.allowedProbeContractPublicTypes)
  ) {
    const location = findPatternLocation(probeContractSource, [/struct\s+BackendEnvelope/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `probe_contract public types drifted from the frozen Wave 1 set (${config.allowedProbeContractPublicTypes.join(", ")}).`,
      filePath: probeContractFilePath,
      kind: "backend-client-contract-type-drift",
      line: location.line,
    });
  }

  if (restrictedProbeContractTypes.length > 0) {
    const location = findPatternLocation(probeContractSource, [/pub\((?:crate|super|self)\)\s+struct/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: "probe_contract must not expose crate-visible or super-visible types.",
      filePath: probeContractFilePath,
      kind: "backend-client-contract-type-restricted",
      line: location.line,
    });
  }

  if (
    JSON.stringify(publicProbeContractFunctions) !== JSON.stringify(config.allowedProbeContractPublicFunctions)
  ) {
    const location = findPatternLocation(probeContractSource, [/fn\s+parse_backend_probe_envelope/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `probe_contract public functions drifted from the frozen Wave 1 set (${config.allowedProbeContractPublicFunctions.join(", ")}).`,
      filePath: probeContractFilePath,
      kind: "backend-client-contract-function-drift",
      line: location.line,
    });
  }

  if (restrictedProbeContractFunctions.length > 0) {
    const location = findPatternLocation(probeContractSource, [/pub\((?:crate|super|self)\)\s+fn/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: "probe_contract must not expose crate-visible or super-visible functions.",
      filePath: probeContractFilePath,
      kind: "backend-client-contract-function-restricted",
      line: location.line,
    });
  }

  if (
    JSON.stringify(privateProbeContractFunctions) !==
    JSON.stringify(config.allowedProbeContractPrivateFunctions)
  ) {
    const location = findPatternLocation(probeContractSource, [/fn\s+build_backend_error/u]);
    addViolation(violations, seenViolations, {
      column: location.column,
      detail: `probe_contract private helpers drifted from the frozen Wave 1 set (${config.allowedProbeContractPrivateFunctions.join(", ")}).`,
      filePath: probeContractFilePath,
      kind: "backend-client-contract-private-helper-drift",
      line: location.line,
    });
  }

  if (JSON.stringify(reqwestTouchFiles) !== JSON.stringify(config.allowedReqwestTouchFiles)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `reqwest touchpoints drifted from the frozen Wave 1 set (${config.allowedReqwestTouchFiles.join(", ")}). Rewrite the remote client boundary before widening HTTP usage.`,
      filePath: desktopV3RustSourceDir,
      kind: "backend-client-reqwest-touch-drift",
      line: 1,
    });
  }

  if (
    JSON.stringify(backendClientReferenceFiles) !==
    JSON.stringify(config.allowedExternalReferenceFiles)
  ) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `BackendClient external references drifted from the frozen Wave 1 ownership file set (${config.allowedExternalReferenceFiles.join(", ")}).`,
      filePath: desktopV3RustSourceDir,
      kind: "backend-client-external-reference-drift",
      line: 1,
    });
  }

  if (
    JSON.stringify(probeContractReferenceFiles) !==
    JSON.stringify(config.allowedProbeContractReferenceFiles)
  ) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `probe_contract references drifted from the frozen Wave 1 set (${config.allowedProbeContractReferenceFiles.join(", ")}). Do not leak transport contract internals across the runtime.`,
      filePath: desktopV3RustSourceDir,
      kind: "backend-client-contract-reference-drift",
      line: 1,
    });
  }

  return {
    backendClientMethods,
    backendClientReferenceFiles,
    clientFiles,
    moduleDeclarations,
    probeContractFunctions: probeContractSurface.functions,
    probeContractReferenceFiles,
    probeContractTypes: probeContractSurface.types,
    probePaths,
    reqwestTouchFiles,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3BackendClientGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedExternalReferenceFiles: [...config.allowedExternalReferenceFiles],
      allowedFiles: [...config.allowedFiles],
      allowedModuleDeclarations: [...config.allowedModuleDeclarations],
      allowedProbeContractPrivateFunctions: [...config.allowedProbeContractPrivateFunctions],
      allowedProbeContractPublicFunctions: [...config.allowedProbeContractPublicFunctions],
      allowedProbeContractPublicTypes: [...config.allowedProbeContractPublicTypes],
      allowedProbeContractReferenceFiles: [...config.allowedProbeContractReferenceFiles],
      allowedPrivateMethods: [...config.allowedPrivateMethods],
      allowedProbePaths: [...config.allowedProbePaths],
      allowedPublicMethods: [...config.allowedPublicMethods],
      allowedReqwestTouchFiles: [...config.allowedReqwestTouchFiles],
      backendClientMethods: [],
      backendClientReferenceFiles: [],
      checkedAt: null,
      clientFiles: [],
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      moduleDeclarations: [],
      outputDir: config.outputDir,
      probeContractFunctions: [],
      probeContractReferenceFiles: [],
      probeContractTypes: [],
      probePaths: [],
      reqwestTouchFiles: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3BackendClientGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 backend-client governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 backend-client governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3BackendClientGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-backend-client-governance-${runId}`);

  return {
    allowedExternalReferenceFiles: [...desktopV3AllowedBackendClientExternalReferenceFiles],
    allowedFiles: [...desktopV3AllowedBackendClientFiles],
    allowedModuleDeclarations: [...desktopV3AllowedBackendClientModuleDeclarations],
    allowedPrivateMethods: [...desktopV3AllowedBackendClientPrivateMethods],
    allowedProbeContractPrivateFunctions: [...desktopV3AllowedProbeContractPrivateFunctions],
    allowedProbeContractPublicFunctions: [...desktopV3AllowedProbeContractPublicFunctions],
    allowedProbeContractPublicTypes: [...desktopV3AllowedProbeContractPublicTypes],
    allowedProbeContractReferenceFiles: [...desktopV3AllowedProbeContractReferenceFiles],
    allowedProbePaths: [...desktopV3AllowedBackendClientProbePaths],
    allowedPublicMethods: [...desktopV3AllowedBackendClientPublicMethods],
    allowedReqwestTouchFiles: [...desktopV3AllowedReqwestTouchFiles],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-backend-client-governance-summary.json",
    ),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    rustSourceDir: path.join(workspaceRoot, desktopV3RustSourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
