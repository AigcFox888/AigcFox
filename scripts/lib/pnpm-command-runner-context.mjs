import process from "node:process";

import { prependNodeBinToEnvPath } from "./pnpm-command-env.mjs";
import {
  isWindowsShellScriptCommand,
  normalizeOptionalText,
  pnpmCommandRuntime,
  resolveDirectPnpmInvocation,
  resolvePathBasedWindowsPnpmCommand,
  resolvePnpmInvocation,
} from "./pnpm-command-resolve.mjs";

function buildNormalizedEnv(options = {}) {
  return prependNodeBinToEnvPath({
    ...process.env,
    ...(options.env ?? {}),
  });
}

function buildNormalizedOptions(options, normalizedEnv) {
  return {
    windowsHide: true,
    ...options,
    env: normalizedEnv,
  };
}

export function buildPnpmRunnerContext(options = {}) {
  const normalizedEnv = buildNormalizedEnv(options);

  return {
    normalizedEnv,
    normalizedOptions: buildNormalizedOptions(options, normalizedEnv),
    invocation: resolvePnpmInvocation(normalizedEnv),
  };
}

export function buildPnpmDirectRunnerContext(options = {}) {
  const normalizedEnv = buildNormalizedEnv(options);
  const directInvocation = resolveDirectPnpmInvocation(normalizedEnv);
  const overrideCommand = normalizeOptionalText(normalizedEnv.AIGCFOX_PNPM_COMMAND);
  const directWindowsCommand =
    process.platform === "win32" && overrideCommand
      ? overrideCommand
      : process.platform === "win32" && pnpmCommandRuntime.shouldUseBundledPnpmScript
        ? process.execPath
        : process.platform === "win32"
          ? resolvePathBasedWindowsPnpmCommand(normalizedEnv) ?? pnpmCommandRuntime.resolvedPnpmCommand
          : directInvocation.command;
  const directWindowsArgsPrefix =
    process.platform === "win32" && overrideCommand
      ? []
      : process.platform === "win32" && pnpmCommandRuntime.shouldUseBundledPnpmScript
        ? [pnpmCommandRuntime.bundledPnpmScript]
        : directInvocation.commandArgsPrefix;

  return {
    normalizedEnv,
    normalizedOptions: buildNormalizedOptions(options, normalizedEnv),
    directCommand: directWindowsCommand,
    directArgsPrefix: directWindowsArgsPrefix,
    useWindowsShellScript:
      process.platform === "win32" && isWindowsShellScriptCommand(directWindowsCommand),
  };
}
