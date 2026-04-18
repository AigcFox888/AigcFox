import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3HostGovernanceSourceRoots = Object.freeze([
  "apps/desktop-v3/src",
  "apps/desktop-v3/src-tauri/src",
]);
export const desktopV3AllowedHostEnvBindings = Object.freeze([
  { filePath: "apps/desktop-v3/src/app/bootstrap/renderer-ready.ts", name: "VITE_DESKTOP_V3_RENDERER_BOOT_PROBE" },
  { filePath: "apps/desktop-v3/src/app/router/initial-route.ts", name: "VITE_DESKTOP_V3_INITIAL_ROUTE" },
  { filePath: "apps/desktop-v3/src/lib/runtime/runtime-mode.ts", name: "VITE_DESKTOP_V3_RUNTIME_MODE" },
  { filePath: "apps/desktop-v3/src-tauri/src/commands/mod.rs", name: "AIGCFOX_DESKTOP_V3_TRACE_COMMANDS" },
  { filePath: "apps/desktop-v3/src-tauri/src/lib.rs", name: "AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "AIGCFOX_BACKEND_BASE_URL" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/initial_route.rs", name: "AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/main_window_target.rs", name: "AIGCFOX_DESKTOP_V3_DEV_WINDOW_URL" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/main_window_target.rs", name: "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE" },
]);
export const desktopV3AllowedHostLogSignals = Object.freeze([
  { filePath: "apps/desktop-v3/src-tauri/src/commands/mod.rs", name: "desktop-v3.command.invoke" },
  { filePath: "apps/desktop-v3/src-tauri/src/lib.rs", name: "desktop-v3.startup-backend-probe.scheduled" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.renderer.boot" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.begin" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.end" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.liveness.err" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.liveness.ok" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.readiness.err" },
  { filePath: "apps/desktop-v3/src-tauri/src/runtime/mod.rs", name: "desktop-v3.startup-backend-probe.readiness.ok" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs", name: "desktop-v3.main-window.navigation" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs", name: "desktop-v3.main-window.page-load" },
  { filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs", name: "desktop-v3.main-window.url" },
]);

const hostEnvPattern = /\b(?:AIGCFOX_[A-Z0-9_]+|VITE_DESKTOP_V3_[A-Z0-9_]+)\b/gu;
const hostLogSignalPattern = /\bdesktop-v3\.[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/gu;

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_RUN_ID?.trim();

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

    const nameCompare = left.name.localeCompare(right.name);

    if (nameCompare !== 0) {
      return nameCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    return left.column - right.column;
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

function isHostGovernanceSourceFile(name) {
  if (name.endsWith(".d.ts") || name.includes(".test.")) {
    return false;
  }

  return /\.(?:[cm]?ts|tsx|rs)$/u.test(name);
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

function collectHostMatchesFromSource(sourceText, absoluteFilePath, expression, options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const pattern = new RegExp(expression.source, expression.flags);
  const seenEntries = new Set();
  const entries = [];

  for (const match of sourceText.matchAll(pattern)) {
    const name = match[0];

    if (!name || seenEntries.has(name)) {
      continue;
    }

    const location = findLineColumn(sourceText, match.index ?? 0);
    entries.push({
      column: location.column,
      filePath,
      line: location.line,
      name,
    });
    seenEntries.add(name);
  }

  return sortNamedEntries(entries);
}

export function collectDesktopV3HostGovernanceEntriesFromSource(
  sourceText,
  absoluteFilePath,
  options = {},
) {
  return {
    envBindings: collectHostMatchesFromSource(sourceText, absoluteFilePath, hostEnvPattern, options),
    logSignals: collectHostMatchesFromSource(sourceText, absoluteFilePath, hostLogSignalPattern, options),
  };
}

async function walkSourceFiles(directoryPath, readdirImpl, collected) {
  const entries = await readdirImpl(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await walkSourceFiles(absolutePath, readdirImpl, collected);
      continue;
    }

    if (entry.isFile() && isHostGovernanceSourceFile(entry.name)) {
      collected.push(absolutePath);
    }
  }
}

export async function listDesktopV3HostGovernanceSourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const collected = [];

  for (const sourceRoot of config.sourceRootDirectories) {
    await walkSourceFiles(sourceRoot, readdirImpl, collected);
  }

  return collected.sort((left, right) => left.localeCompare(right));
}

function bindingKey(entry) {
  return `${entry.filePath}:${entry.name}`;
}

function addMissingBindingViolations({
  actualEntries,
  expectedEntries,
  kind,
  prefix,
  seenViolations,
  violations,
}) {
  const actualKeys = new Set(actualEntries.map(bindingKey));

  for (const expectedEntry of expectedEntries) {
    if (actualKeys.has(bindingKey(expectedEntry))) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${prefix} ${expectedEntry.name} is missing from ${expectedEntry.filePath}.`,
      filePath: expectedEntry.filePath,
      kind,
      line: 1,
    });
  }
}

function addUnexpectedBindingViolations({
  actualEntries,
  expectedEntries,
  kind,
  prefix,
  seenViolations,
  violations,
}) {
  const expectedKeys = new Set(expectedEntries.map(bindingKey));

  for (const actualEntry of actualEntries) {
    if (expectedKeys.has(bindingKey(actualEntry))) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: actualEntry.column,
      detail: `${prefix} ${actualEntry.name} drifted into ${actualEntry.filePath}. Rewrite the host boundary before adding new host surface.`,
      filePath: actualEntry.filePath,
      kind,
      line: actualEntry.line,
    });
  }
}

export async function collectDesktopV3HostGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? [...options.filePaths].sort((left, right) => left.localeCompare(right))
    : await listDesktopV3HostGovernanceSourceFiles(config, options);
  const envBindings = [];
  const logSignals = [];
  const scannedFiles = absoluteFilePaths.map((absoluteFilePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath),
  );

  for (const absoluteFilePath of absoluteFilePaths) {
    const sourceText = await readFileImpl(absoluteFilePath, "utf8");
    const entries = collectDesktopV3HostGovernanceEntriesFromSource(sourceText, absoluteFilePath, {
      rootDir: config.rootDir,
    });

    envBindings.push(...entries.envBindings);
    logSignals.push(...entries.logSignals);
  }

  const violations = [];
  const seenViolations = new Set();
  const sortedEnvBindings = sortNamedEntries(envBindings);
  const sortedLogSignals = sortNamedEntries(logSignals);

  addMissingBindingViolations({
    actualEntries: sortedEnvBindings,
    expectedEntries: config.allowedEnvBindings,
    kind: "host-env-binding-missing",
    prefix: "Frozen desktop-v3 host env binding",
    seenViolations,
    violations,
  });
  addUnexpectedBindingViolations({
    actualEntries: sortedEnvBindings,
    expectedEntries: config.allowedEnvBindings,
    kind: "host-env-binding-unexpected",
    prefix: "Unexpected desktop-v3 host env binding",
    seenViolations,
    violations,
  });
  addMissingBindingViolations({
    actualEntries: sortedLogSignals,
    expectedEntries: config.allowedLogSignals,
    kind: "host-log-signal-missing",
    prefix: "Frozen desktop-v3 host log signal",
    seenViolations,
    violations,
  });
  addUnexpectedBindingViolations({
    actualEntries: sortedLogSignals,
    expectedEntries: config.allowedLogSignals,
    kind: "host-log-signal-unexpected",
    prefix: "Unexpected desktop-v3 host log signal",
    seenViolations,
    violations,
  });

  return {
    envBindings: sortedEnvBindings,
    logSignals: sortedLogSignals,
    scannedFileCount: scannedFiles.length,
    scannedFiles: sortStrings(scannedFiles),
    violations: sortViolations(violations),
  };
}

export function createDesktopV3HostGovernanceSummary(config) {
  return decorateVerificationArtifactRefs({
    allowedEnvBindings: [...config.allowedEnvBindings],
    allowedLogSignals: [...config.allowedLogSignals],
    checkedAt: null,
    envBindings: [],
    error: null,
    latestSummaryPath: config.latestSummaryPath,
    logSignals: [],
    outputDir: config.outputDir,
    runId: config.runId,
    scannedFileCount: 0,
    scannedFiles: [],
    sourceRoots: [...config.sourceRootPaths],
    status: "running",
    summaryPath: config.summaryPath,
    violationCount: 0,
    violations: [],
  }, config.rootDir, ["latestSummaryPath", "outputDir", "summaryPath"]);
}

export function buildDesktopV3HostGovernanceFailureMessage(summary) {
  const preview = summary.violations
    .slice(0, 10)
    .map(
      (violation) =>
        `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`,
    )
    .join("\n");

  return [
    `desktop-v3 host governance failed with ${summary.violationCount} violation(s).`,
    `Summary: ${summary.summaryPath}`,
    preview,
  ]
    .filter(Boolean)
    .join("\n");
}

export function resolveDesktopV3HostGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(rootDir, "output", "verification", `desktop-v3-host-governance-${runId}`);

  return {
    allowedEnvBindings: sortNamedEntries(desktopV3AllowedHostEnvBindings),
    allowedLogSignals: sortNamedEntries(desktopV3AllowedHostLogSignals),
    latestSummaryPath: resolveLatestVerificationSummaryPath(rootDir, "desktop-v3-host-governance-summary.json"),
    outputDir,
    rootDir,
    runId,
    sourceRootDirectories: desktopV3HostGovernanceSourceRoots.map((sourceRoot) =>
      path.join(rootDir, sourceRoot),
    ),
    sourceRootPaths: [...desktopV3HostGovernanceSourceRoots],
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
