import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const nodeBinDir = path.dirname(process.execPath);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pnpmShimDir = path.resolve(scriptDir, "..", "bin");
const bundledPnpmCommand =
  process.platform === "win32" ? path.join(nodeBinDir, "pnpm.cmd") : path.join(nodeBinDir, "pnpm");
const bundledPnpmScript = path.join(nodeBinDir, "node_modules", "corepack", "dist", "pnpm.js");
const shouldUseBundledPnpmScript =
  process.platform === "win32" && fs.existsSync(bundledPnpmScript);
const resolvedPnpmCommand = shouldUseBundledPnpmScript ? process.execPath : bundledPnpmCommand;
const pnpmCommandArgsPrefix = shouldUseBundledPnpmScript ? [bundledPnpmScript] : [];
const windowsPnpmPathExtensions = [".cmd", ".bat", ".exe", ".com"];

export const windowsShellCommand = process.env.ComSpec || "cmd.exe";

export function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function resolveEnvPathKey(env = {}) {
  return Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
}

export function resolvePathBasedWindowsPnpmCommand(env = process.env) {
  const currentPath = env[resolveEnvPathKey(env)] ?? "";
  const pathEntries = currentPath
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  for (const entry of pathEntries) {
    for (const extension of windowsPnpmPathExtensions) {
      const candidatePath = path.join(entry, `pnpm${extension}`);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }
  }

  return null;
}

export function resolvePnpmInvocation(env = process.env) {
  const overrideCommand = normalizeOptionalText(env.AIGCFOX_PNPM_COMMAND);

  if (overrideCommand) {
    return {
      command: overrideCommand,
      commandArgsPrefix: [],
      spawnDirectlyOnWindows: false,
    };
  }

  const pathBasedWindowsPnpmCommand =
    process.platform === "win32" ? resolvePathBasedWindowsPnpmCommand(env) : null;
  if (pathBasedWindowsPnpmCommand) {
    return {
      command: "pnpm",
      commandArgsPrefix: [],
      spawnDirectlyOnWindows: false,
    };
  }

  return {
    command: process.platform === "win32" ? resolvedPnpmCommand : "pnpm",
    commandArgsPrefix: pnpmCommandArgsPrefix,
    spawnDirectlyOnWindows: shouldUseBundledPnpmScript,
  };
}

export function isWindowsShellScriptCommand(command) {
  const normalizedCommand = normalizeOptionalText(command)?.toLowerCase() ?? "";
  return normalizedCommand.endsWith(".cmd") || normalizedCommand.endsWith(".bat");
}

export function resolveDirectPnpmInvocation(env = process.env) {
  const overrideCommand = normalizeOptionalText(env.AIGCFOX_PNPM_COMMAND);

  if (process.platform !== "win32") {
    return { command: "pnpm", commandArgsPrefix: [] };
  }

  if (overrideCommand) {
    return { command: overrideCommand, commandArgsPrefix: [] };
  }

  if (shouldUseBundledPnpmScript) {
    return { command: process.execPath, commandArgsPrefix: [bundledPnpmScript] };
  }

  return {
    command: resolvePathBasedWindowsPnpmCommand(env) ?? resolvedPnpmCommand,
    commandArgsPrefix: [],
  };
}

export const pnpmCommand = resolvePnpmInvocation().command;
export const pnpmCommandRuntime = {
  bundledPnpmScript,
  nodeBinDir,
  pnpmShimDir,
  resolvedPnpmCommand,
  shouldUseBundledPnpmScript,
};
