import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { desktopV3AllowedTauriCommands } from "./desktop-v3-command-governance.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3CapabilityDir = "apps/desktop-v3/src-tauri/capabilities";
export const desktopV3CapabilityFileName = "main-window.json";
export const desktopV3PermissionsFile = "apps/desktop-v3/src-tauri/permissions/main-window.toml";
export const desktopV3RustLibFile = "apps/desktop-v3/src-tauri/src/lib.rs";
export const desktopV3TauriCommandTypesFile = "apps/desktop-v3/src/lib/runtime/tauri-command-types.ts";
export const desktopV3AllowedCapabilityIdentifiers = Object.freeze(["main-window"]);
export const desktopV3AllowedCapabilityWindows = Object.freeze(["main"]);
export const desktopV3AllowedCapabilityRemoteUrls = Object.freeze([
  "http://127.0.0.1:1420/*",
  "http://localhost:1420/*",
]);
export const desktopV3AllowedCorePermissions = Object.freeze([
  "core:app:default",
  "core:event:default",
  "core:webview:default",
  "core:window:default",
]);
export const desktopV3AllowedAppPermissions = Object.freeze([
  "desktop-preferences-read",
  "desktop-preferences-write",
  "desktop-diagnostics-read",
  "desktop-backend-probe-read",
  "desktop-renderer-boot-write",
]);
export const desktopV3AllowedPermissionEntries = Object.freeze([
  {
    commands: ["desktop_get_theme_preference"],
    identifier: "desktop-preferences-read",
  },
  {
    commands: ["desktop_set_theme_preference"],
    identifier: "desktop-preferences-write",
  },
  {
    commands: ["desktop_get_diagnostics_snapshot"],
    identifier: "desktop-diagnostics-read",
  },
  {
    commands: ["desktop_get_backend_liveness", "desktop_get_backend_readiness"],
    identifier: "desktop-backend-probe-read",
  },
  {
    commands: ["desktop_report_renderer_boot"],
    identifier: "desktop-renderer-boot-write",
  },
]);
export { desktopV3AllowedTauriCommands } from "./desktop-v3-command-governance.mjs";

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_RUN_ID?.trim();

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

function parseQuotedStringArray(sourceText) {
  return Array.from(sourceText.matchAll(/"([^"]+)"/gu), (match) => match[1]);
}

export function parseDesktopV3PermissionEntries(sourceText) {
  const blocks = sourceText
    .split(/^\s*\[\[permission\]\]\s*$/mu)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks.map((block) => {
    const identifierMatch = block.match(/^identifier\s*=\s*"([^"]+)"\s*$/mu);
    const commandsAllowMatch = block.match(/^commands\.allow\s*=\s*\[(.+?)\]\s*$/mu);
    const descriptionMatch = block.match(/^description\s*=\s*"([^"]+)"\s*$/mu);

    return {
      commands: sortStrings(commandsAllowMatch ? parseQuotedStringArray(commandsAllowMatch[1]) : []),
      description: descriptionMatch?.[1] ?? null,
      identifier: identifierMatch?.[1] ?? null,
    };
  });
}

export function extractDesktopV3InvokeHandlerCommands(sourceText) {
  const handlerMatch = sourceText.match(/invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\]\)/u);

  if (!handlerMatch) {
    return [];
  }

  return sortStrings(
    Array.from(
      handlerMatch[1].matchAll(/commands::[A-Za-z_][A-Za-z0-9_]*::([A-Za-z_][A-Za-z0-9_]*)/gu),
      (match) => match[1],
    ),
  );
}

export function extractTypeScriptInterfacePropertyNames(sourceText, interfaceName) {
  const interfaceMatch = sourceText.match(
    new RegExp(`export interface ${interfaceName} \\{([\\s\\S]*?)\\n\\}`, "u"),
  );

  if (!interfaceMatch) {
    return [];
  }

  const names = [];
  let braceDepth = 0;

  for (const line of interfaceMatch[1].split(/\r?\n/u)) {
    if (braceDepth === 0) {
      const propertyMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/u);

      if (propertyMatch) {
        names.push(propertyMatch[1]);
      }
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");
  }

  return sortStrings(names);
}

export async function listDesktopV3CapabilityFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const entries = await readdirImpl(config.capabilityDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(config.capabilityDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function collectDesktopV3CapabilityGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const capabilityFilePaths = Array.isArray(options.capabilityFilePaths)
    ? [...options.capabilityFilePaths].sort((left, right) => left.localeCompare(right))
    : await listDesktopV3CapabilityFiles(config, options);
  const seenViolations = new Set();
  const violations = [];
  const expectedCommandNames = sortStrings(desktopV3AllowedTauriCommands);
  const capabilityFiles = capabilityFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const capabilityFileNames = capabilityFiles.map((filePath) => path.basename(filePath));
  const expectedCapabilityFile = desktopV3CapabilityFileName;

  for (const capabilityFileName of capabilityFileNames) {
    if (capabilityFileName === expectedCapabilityFile) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability file ${capabilityFileName} is outside the frozen Wave 1 capability set (${expectedCapabilityFile}). Add new windows or capability groups only after rewriting the permission boundary.`,
      filePath: `${desktopV3CapabilityDir}/${capabilityFileName}`,
      kind: "capability-file-expansion",
      line: 1,
    });
  }

  if (!capabilityFileNames.includes(expectedCapabilityFile)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability file ${expectedCapabilityFile} is missing from the frozen Wave 1 capability set.`,
      filePath: `${desktopV3CapabilityDir}/${expectedCapabilityFile}`,
      kind: "capability-file-missing",
      line: 1,
    });
  }

  const capabilityPath = capabilityFilePaths.find((filePath) => path.basename(filePath) === expectedCapabilityFile)
    ?? path.join(config.capabilityDir, expectedCapabilityFile);
  const capabilitySource = await readFileImpl(capabilityPath, "utf8");
  const capabilityJson = JSON.parse(capabilitySource);
  const capabilityRemoteUrls = sortStrings(
    Array.isArray(capabilityJson.remote?.urls)
      ? capabilityJson.remote.urls.filter((value) => typeof value === "string")
      : [],
  );
  const capabilityWindows = sortStrings(
    Array.isArray(capabilityJson.windows)
      ? capabilityJson.windows.filter((value) => typeof value === "string")
      : [],
  );
  const capabilityPermissions = Array.isArray(capabilityJson.permissions)
    ? capabilityJson.permissions.filter((value) => typeof value === "string")
    : [];
  const capabilityCorePermissions = capabilityPermissions.filter((permission) => permission.startsWith("core:"));
  const capabilityAppPermissions = capabilityPermissions.filter((permission) => !permission.startsWith("core:"));

  if (capabilityJson.identifier !== "main-window") {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: 'Capability identifier must stay frozen at "main-window" for the Wave 1 main window boundary.',
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-identifier-drift",
      line: 1,
    });
  }

  if (JSON.stringify(capabilityWindows) !== JSON.stringify(desktopV3AllowedCapabilityWindows)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability windows drifted from the frozen Wave 1 set (${desktopV3AllowedCapabilityWindows.join(", ")}).`,
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-window-drift",
      line: 1,
    });
  }

  if (JSON.stringify(capabilityRemoteUrls) !== JSON.stringify(desktopV3AllowedCapabilityRemoteUrls)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability remote URLs drifted from the frozen Wave 1 allowlist (${desktopV3AllowedCapabilityRemoteUrls.join(", ")}).`,
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-remote-url-drift",
      line: 1,
    });
  }

  if (JSON.stringify(capabilityCorePermissions) !== JSON.stringify(desktopV3AllowedCorePermissions)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability core permission set drifted from the frozen Wave 1 allowlist (${desktopV3AllowedCorePermissions.join(", ")}).`,
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-core-permission-drift",
      line: 1,
    });
  }

  if (JSON.stringify(capabilityAppPermissions) !== JSON.stringify(desktopV3AllowedAppPermissions)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability app permission set drifted from the frozen Wave 1 allowlist (${desktopV3AllowedAppPermissions.join(", ")}).`,
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-app-permission-drift",
      line: 1,
    });
  }

  const permissionsSource = await readFileImpl(config.permissionsPath, "utf8");
  const permissionEntries = parseDesktopV3PermissionEntries(permissionsSource);
  const normalizedPermissionEntries = permissionEntries
    .filter((entry) => entry.identifier !== null)
    .map((entry) => ({
      commands: entry.commands,
      description: entry.description,
      identifier: entry.identifier,
    }))
    .sort((left, right) => left.identifier.localeCompare(right.identifier));
  const expectedPermissionEntries = [...desktopV3AllowedPermissionEntries].sort((left, right) =>
    left.identifier.localeCompare(right.identifier),
  );

  if (JSON.stringify(normalizedPermissionEntries.map((entry) => entry.identifier)) !== JSON.stringify(expectedPermissionEntries.map((entry) => entry.identifier))) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Permission identifiers drifted from the frozen Wave 1 allowlist (${expectedPermissionEntries.map((entry) => entry.identifier).join(", ")}).`,
      filePath: desktopV3PermissionsFile,
      kind: "permission-identifier-drift",
      line: 1,
    });
  }

  for (const expectedEntry of expectedPermissionEntries) {
    const actualEntry = normalizedPermissionEntries.find((entry) => entry.identifier === expectedEntry.identifier);

    if (!actualEntry) {
      addViolation(violations, seenViolations, {
        column: 1,
        detail: `Permission entry ${expectedEntry.identifier} is missing from the frozen Wave 1 permission set.`,
        filePath: desktopV3PermissionsFile,
        kind: "permission-entry-missing",
        line: 1,
      });
      continue;
    }

    if (JSON.stringify(actualEntry.commands) !== JSON.stringify(sortStrings(expectedEntry.commands))) {
      addViolation(violations, seenViolations, {
        column: 1,
        detail: `Permission ${expectedEntry.identifier} commands drifted from the frozen Wave 1 mapping (${expectedEntry.commands.join(", ")}).`,
        filePath: desktopV3PermissionsFile,
        kind: "permission-command-drift",
        line: 1,
      });
    }
  }

  for (const actualEntry of normalizedPermissionEntries) {
    if (expectedPermissionEntries.some((entry) => entry.identifier === actualEntry.identifier)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Permission entry ${actualEntry.identifier} is outside the frozen Wave 1 permission set.`,
      filePath: desktopV3PermissionsFile,
      kind: "permission-entry-expansion",
      line: 1,
    });
  }

  const libSource = await readFileImpl(config.rustLibPath, "utf8");
  const invokeHandlerCommands = extractDesktopV3InvokeHandlerCommands(libSource);

  if (JSON.stringify(invokeHandlerCommands) !== JSON.stringify(expectedCommandNames)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Rust invoke_handler command set drifted from the frozen Wave 1 IPC surface (${expectedCommandNames.join(", ")}).`,
      filePath: desktopV3RustLibFile,
      kind: "invoke-handler-command-drift",
      line: 1,
    });
  }

  const tauriCommandTypesSource = await readFileImpl(config.tauriCommandTypesPath, "utf8");
  const payloadCommands = extractTypeScriptInterfacePropertyNames(
    tauriCommandTypesSource,
    "DesktopCommandPayloadMap",
  );
  const resultCommands = extractTypeScriptInterfacePropertyNames(
    tauriCommandTypesSource,
    "DesktopCommandResultMap",
  );

  if (JSON.stringify(payloadCommands) !== JSON.stringify(expectedCommandNames)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `DesktopCommandPayloadMap drifted from the frozen Wave 1 IPC surface (${expectedCommandNames.join(", ")}).`,
      filePath: desktopV3TauriCommandTypesFile,
      kind: "tauri-command-payload-drift",
      line: 1,
    });
  }

  if (JSON.stringify(resultCommands) !== JSON.stringify(expectedCommandNames)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `DesktopCommandResultMap drifted from the frozen Wave 1 IPC surface (${expectedCommandNames.join(", ")}).`,
      filePath: desktopV3TauriCommandTypesFile,
      kind: "tauri-command-result-drift",
      line: 1,
    });
  }

  const allowedCommandSet = new Set(expectedCommandNames);
  const permissionCommands = sortStrings(normalizedPermissionEntries.flatMap((entry) => entry.commands));
  const uniquePermissionCommands = sortStrings([...new Set(permissionCommands)]);

  if (JSON.stringify(uniquePermissionCommands) !== JSON.stringify(expectedCommandNames)) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Permission command coverage drifted from the frozen Wave 1 IPC surface (${expectedCommandNames.join(", ")}).`,
      filePath: desktopV3PermissionsFile,
      kind: "permission-command-coverage-drift",
      line: 1,
    });
  }

  for (const capabilityPermission of capabilityAppPermissions) {
    if (normalizedPermissionEntries.some((entry) => entry.identifier === capabilityPermission)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Capability permission ${capabilityPermission} is not declared in ${desktopV3PermissionsFile}.`,
      filePath: normalizeWorkspaceRelativePath(config.rootDir, capabilityPath),
      kind: "capability-permission-orphan",
      line: 1,
    });
  }

  for (const commandName of expectedCommandNames) {
    if (
      allowedCommandSet.has(commandName) &&
      invokeHandlerCommands.includes(commandName) &&
      payloadCommands.includes(commandName) &&
      resultCommands.includes(commandName) &&
      uniquePermissionCommands.includes(commandName)
    ) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Command ${commandName} is no longer aligned across permissions, invoke_handler, and tauri-command-types.ts.`,
      filePath: desktopV3RustLibFile,
      kind: "ipc-command-alignment-drift",
      line: 1,
    });
  }

  return {
    appPermissions: capabilityAppPermissions,
    capabilityFiles: sortStrings(capabilityFiles),
    capabilityIdentifier: capabilityJson.identifier ?? null,
    corePermissions: capabilityCorePermissions,
    invokeHandlerCommands,
    payloadCommands,
    permissionEntries: normalizedPermissionEntries,
    remoteUrls: capabilityRemoteUrls,
    resultCommands,
    scannedFileCount: capabilityFiles.length + 3,
    scannedFiles: sortStrings([
      ...capabilityFiles,
      desktopV3PermissionsFile,
      desktopV3RustLibFile,
      desktopV3TauriCommandTypesFile,
    ]),
    violations: sortViolations(violations),
    windows: capabilityWindows,
  };
}

export function createDesktopV3CapabilityGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedAppPermissions: [...desktopV3AllowedAppPermissions],
      allowedCapabilityFiles: [desktopV3CapabilityFileName],
      allowedCommands: [...desktopV3AllowedTauriCommands],
      allowedCorePermissions: [...desktopV3AllowedCorePermissions],
      allowedRemoteUrls: [...desktopV3AllowedCapabilityRemoteUrls],
      appPermissions: [],
      capabilityFiles: [],
      capabilityIdentifier: null,
      checkedAt: null,
      corePermissions: [],
      error: null,
      invokeHandlerCommands: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      payloadCommands: [],
      permissionEntries: [],
      remoteUrls: [],
      resultCommands: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
      windows: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3CapabilityGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 capability governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 capability governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3CapabilityGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-capability-governance-${runId}`);

  return {
    capabilityDir: path.join(workspaceRoot, desktopV3CapabilityDir),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-capability-governance-summary.json",
    ),
    outputDir,
    permissionsPath: path.join(workspaceRoot, desktopV3PermissionsFile),
    rootDir: workspaceRoot,
    runId,
    rustLibPath: path.join(workspaceRoot, desktopV3RustLibFile),
    summaryPath: path.join(outputDir, "summary.json"),
    tauriCommandTypesPath: path.join(workspaceRoot, desktopV3TauriCommandTypesFile),
  };
}
