import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  desktopV3AllowedCommandModuleNames,
  desktopV3AllowedCommandModules,
  desktopV3AllowedTauriCommands,
} from "./desktop-v3-command-truth.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

export {
  desktopV3AllowedCommandModuleNames,
  desktopV3AllowedCommandModules,
  desktopV3AllowedTauriCommands,
} from "./desktop-v3-command-truth.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3CommandGovernanceDir = "apps/desktop-v3/src-tauri/src/commands";
export const desktopV3AllowedCommandSupportFunctions = Object.freeze([
  "should_trace_desktop_commands",
  "trace_desktop_command",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_RUN_ID?.trim();

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

function sortEntries(entries, nameKey = "name") {
  return [...entries].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    return String(left[nameKey]).localeCompare(String(right[nameKey]));
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

function isAllowedCommandUseStatement(usePath) {
  return (
    usePath === "tauri::State" ||
    usePath === "crate::commands::trace_desktop_command" ||
    usePath === "crate::error::CommandError" ||
    usePath === "crate::runtime::DesktopRuntime" ||
    usePath.startsWith("crate::runtime::models::")
  );
}

export function collectDesktopV3CommandFileDetailsFromSource(
  sourceText,
  absoluteFilePath,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const fileName = path.basename(absoluteFilePath);
  const lines = sourceText.split(/\r?\n/u);
  const functions = [];
  const moduleDeclarations = [];
  const traceCalls = [];
  const useStatements = [];
  let braceDepth = 0;
  let pendingTauriCommand = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (braceDepth === 0) {
      const useMatch = line.match(/^\s*use\s+(.+?)\s*;\s*$/u);

      if (useMatch) {
        useStatements.push({
          filePath,
          line: index + 1,
          path: useMatch[1].trim(),
        });
      }

      const moduleMatch = line.match(/^\s*pub\s+mod\s+([A-Za-z_][A-Za-z0-9_]*)\s*;\s*$/u);

      if (moduleMatch) {
        moduleDeclarations.push({
          filePath,
          line: index + 1,
          name: moduleMatch[1],
        });
      }

      if (trimmedLine === "#[tauri::command]") {
        pendingTauriCommand = true;
      } else {
        const functionMatch = line.match(
          /^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/u,
        );

        if (functionMatch) {
          functions.push({
            filePath,
            fileName,
            line: index + 1,
            name: functionMatch[1],
            tauriCommand: pendingTauriCommand,
          });
          pendingTauriCommand = false;
        }
      }
    }

    const traceMatch = line.match(/trace_desktop_command\("([^"]+)"\)/u);

    if (traceMatch) {
      traceCalls.push({
        column: line.indexOf(traceMatch[1]) + 1,
        filePath,
        line: index + 1,
        name: traceMatch[1],
      });
    }

    braceDepth += countOccurrences(line, "{");
    braceDepth -= countOccurrences(line, "}");
  }

  return {
    fileName,
    filePath,
    functions: sortEntries(functions),
    moduleDeclarations: sortEntries(moduleDeclarations),
    traceCalls: sortEntries(traceCalls),
    useStatements: sortEntries(useStatements, "path"),
  };
}

export async function listDesktopV3CommandRustFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const entries = await readdirImpl(config.commandsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".rs"))
    .map((entry) => path.join(config.commandsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function collectDesktopV3CommandGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? [...options.filePaths].sort((left, right) => left.localeCompare(right))
    : await listDesktopV3CommandRustFiles(config, options);
  const seenViolations = new Set();
  const violations = [];
  const scannedFiles = absoluteFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const moduleFiles = scannedFiles.map((filePath) => path.basename(filePath));
  const allowedModuleSet = new Set(config.allowedCommandModules);
  const allowedModuleNameSet = new Set(config.allowedModuleNames);
  const allowedCommandSet = new Set(config.allowedCommands);
  const allowedSupportFunctionSet = new Set(config.allowedSupportFunctions);
  const allFunctions = [];
  const allModuleDeclarations = [];
  const allTraceCalls = [];
  const allUseStatements = [];

  for (const moduleFile of moduleFiles) {
    if (allowedModuleSet.has(moduleFile)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `commands/* file ${moduleFile} is outside the frozen Wave 1 command module set (${config.allowedCommandModules.join(", ")}). Rewrite runtime structure before expanding the command surface.`,
      filePath: `${desktopV3CommandGovernanceDir}/${moduleFile}`,
      kind: "command-module-expansion",
      line: 1,
    });
  }

  for (const moduleFile of config.allowedCommandModules) {
    if (moduleFiles.includes(moduleFile)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `commands/* file ${moduleFile} is missing from the frozen Wave 1 command module set. Update docs and perform a structural rewrite before changing this boundary.`,
      filePath: `${desktopV3CommandGovernanceDir}/${moduleFile}`,
      kind: "command-module-missing",
      line: 1,
    });
  }

  for (const absoluteFilePath of absoluteFilePaths) {
    const sourceText = await readFileImpl(absoluteFilePath, "utf8");
    const detail = collectDesktopV3CommandFileDetailsFromSource(sourceText, absoluteFilePath, {
      rootDir: config.rootDir,
    });

    allFunctions.push(...detail.functions);
    allModuleDeclarations.push(...detail.moduleDeclarations);
    allTraceCalls.push(...detail.traceCalls);
    allUseStatements.push(...detail.useStatements);

    if (detail.fileName === "mod.rs") {
      for (const moduleDeclaration of detail.moduleDeclarations) {
        if (allowedModuleNameSet.has(moduleDeclaration.name)) {
          continue;
        }

        addViolation(violations, seenViolations, {
          column: 1,
          detail: `commands/mod.rs module ${moduleDeclaration.name} is outside the frozen Wave 1 command module set (${config.allowedModuleNames.join(", ")}).`,
          filePath: moduleDeclaration.filePath,
          kind: "command-module-declaration-expansion",
          line: moduleDeclaration.line,
        });
      }

      for (const supportFunction of detail.functions) {
        if (allowedSupportFunctionSet.has(supportFunction.name)) {
          continue;
        }

        addViolation(violations, seenViolations, {
          column: 1,
          detail: `commands/mod.rs helper ${supportFunction.name} is outside the frozen Wave 1 support surface (${config.allowedSupportFunctions.join(", ")}).`,
          filePath: supportFunction.filePath,
          kind: "command-support-expansion",
          line: supportFunction.line,
        });
      }

      continue;
    }

    for (const useStatement of detail.useStatements) {
      if (isAllowedCommandUseStatement(useStatement.path)) {
        continue;
      }

      addViolation(violations, seenViolations, {
        column: 1,
        detail: `Command module import ${useStatement.path} is outside the frozen thin-command allowlist. commands/* must stay on trace_desktop_command, CommandError, DesktopRuntime, runtime models, and tauri::State only.`,
        filePath: useStatement.filePath,
        kind: "command-forbidden-import",
        line: useStatement.line,
      });
    }

    for (const functionEntry of detail.functions) {
      if (!functionEntry.tauriCommand) {
        addViolation(violations, seenViolations, {
          column: 1,
          detail: `Top-level function ${functionEntry.name} is not a #[tauri::command]. Helper logic must live in runtime/*, not commands/*.`,
          filePath: functionEntry.filePath,
          kind: "command-helper-expansion",
          line: functionEntry.line,
        });
        continue;
      }

      if (!allowedCommandSet.has(functionEntry.name)) {
        addViolation(violations, seenViolations, {
          column: 1,
          detail: `Tauri command ${functionEntry.name} is outside the frozen Wave 1 command surface (${config.allowedCommands.join(", ")}). Rewrite the boundary before adding new command entrypoints.`,
          filePath: functionEntry.filePath,
          kind: "command-surface-expansion",
          line: functionEntry.line,
        });
        continue;
      }

      if (!sourceText.includes(`trace_desktop_command("${functionEntry.name}")`)) {
        addViolation(violations, seenViolations, {
          column: 1,
          detail: `Tauri command ${functionEntry.name} is missing trace_desktop_command("${functionEntry.name}"). Frozen command entrypoints must keep the current proof markers intact.`,
          filePath: functionEntry.filePath,
          kind: "command-trace-missing",
          line: functionEntry.line,
        });
      }
    }
  }

  const declaredModuleNames = new Set(allModuleDeclarations.map((entry) => entry.name));
  const tauriCommands = sortEntries(allFunctions.filter((entry) => entry.tauriCommand));
  const supportFunctions = sortEntries(allFunctions.filter((entry) => !entry.tauriCommand));
  const commandNames = new Set(tauriCommands.map((entry) => entry.name));
  const missingCommands = config.allowedCommands.filter((commandName) => !commandNames.has(commandName));
  const missingModuleNames = config.allowedModuleNames.filter((moduleName) => !declaredModuleNames.has(moduleName));

  for (const moduleName of missingModuleNames) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `commands/mod.rs no longer declares module ${moduleName}. Update docs and restructure explicitly before changing the command layout.`,
      filePath: `${desktopV3CommandGovernanceDir}/mod.rs`,
      kind: "command-module-declaration-missing",
      line: 1,
    });
  }

  for (const supportFunctionName of config.allowedSupportFunctions) {
    if (supportFunctions.some((entry) => entry.name === supportFunctionName)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `commands/mod.rs support function ${supportFunctionName} is missing from the frozen Wave 1 support surface.`,
      filePath: `${desktopV3CommandGovernanceDir}/mod.rs`,
      kind: "command-support-missing",
      line: 1,
    });
  }

  for (const commandName of missingCommands) {
    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 command ${commandName} is missing. Update docs and perform a structural rewrite before changing this IPC surface.`,
      filePath: `${desktopV3CommandGovernanceDir}/mod.rs`,
      kind: "command-surface-missing",
      line: 1,
    });
  }

  return {
    commandModules: [...moduleFiles].sort((left, right) => left.localeCompare(right)),
    commands: tauriCommands,
    missingCommands,
    missingModuleNames,
    moduleDeclarations: sortEntries(allModuleDeclarations),
    scannedFileCount: scannedFiles.length,
    scannedFiles: [...scannedFiles].sort((left, right) => left.localeCompare(right)),
    supportFunctions,
    traceCalls: sortEntries(allTraceCalls),
    useStatements: sortEntries(allUseStatements, "path"),
    violations: sortViolations(violations),
  };
}

export function createDesktopV3CommandGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedCommandModules: [...config.allowedCommandModules],
      allowedCommands: [...config.allowedCommands],
      allowedModuleNames: [...config.allowedModuleNames],
      allowedSupportFunctions: [...config.allowedSupportFunctions],
      checkedAt: null,
      commandModules: [],
      commands: [],
      commandsDir: desktopV3CommandGovernanceDir,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      missingCommands: [],
      missingModuleNames: [],
      moduleDeclarations: [],
      outputDir: config.outputDir,
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      supportFunctions: [],
      traceCalls: [],
      useStatements: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3CommandGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 command governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 command governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3CommandGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-command-governance-${runId}`);

  return {
    allowedCommandModules: [...desktopV3AllowedCommandModules],
    allowedCommands: [...desktopV3AllowedTauriCommands],
    allowedModuleNames: [...desktopV3AllowedCommandModuleNames],
    allowedSupportFunctions: [...desktopV3AllowedCommandSupportFunctions],
    commandsDir: path.join(workspaceRoot, desktopV3CommandGovernanceDir),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-command-governance-summary.json",
    ),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
