import { spawn } from "node:child_process";
import process from "node:process";

import { formatPnpmCommand, formatWindowsCommand } from "./pnpm-command-format.mjs";
import { windowsShellCommand } from "./pnpm-command-resolve.mjs";

function toWindowsSpawnOptions(normalizedOptions) {
  const { shell: _shell, ...spawnOptions } = normalizedOptions;
  return spawnOptions;
}

export function spawnPnpmFromContext(args, context) {
  const { invocation, normalizedEnv, normalizedOptions } = context;
  const commandArgs = [...invocation.commandArgsPrefix, ...args];

  if (process.platform !== "win32") {
    return spawn(invocation.command, commandArgs, normalizedOptions);
  }

  const spawnOptions = toWindowsSpawnOptions(normalizedOptions);

  if (invocation.spawnDirectlyOnWindows) {
    return spawn(invocation.command, commandArgs, spawnOptions);
  }

  return spawn(
    windowsShellCommand,
    ["/d", "/s", "/c", formatPnpmCommand(args, { env: normalizedEnv })],
    spawnOptions,
  );
}

export function spawnPnpmDirectFromContext(args, context) {
  const { directCommand, directArgsPrefix, normalizedOptions, useWindowsShellScript } = context;

  if (useWindowsShellScript) {
    return spawn(
      windowsShellCommand,
      ["/d", "/s", "/c", formatWindowsCommand(directCommand, [...directArgsPrefix, ...args])],
      toWindowsSpawnOptions(normalizedOptions),
    );
  }

  return spawn(directCommand, [...directArgsPrefix, ...args], normalizedOptions);
}

export function runChildProcess(spawnImpl, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawnImpl(args, options);

    child.once("error", (error) => {
      resolve({
        ok: false,
        code: null,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        error: code === 0 ? null : `pnpm ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`,
      });
    });
  });
}

export function runChildProcessOrThrow(spawnImpl, args, options = {}) {
  const { buildError, ...spawnOptions } = options;

  return new Promise((resolve, reject) => {
    const child = spawnImpl(args, spawnOptions);

    child.once("error", reject);

    child.once("close", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      const message =
        typeof buildError === "function"
          ? buildError(code)
          : typeof buildError === "string"
            ? buildError
            : `pnpm ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`;

      reject(new Error(message));
    });
  });
}
