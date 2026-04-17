import process from "node:process";

import { resolvePnpmInvocation } from "./pnpm-command-resolve.mjs";

export function quoteWindowsShellArg(arg) {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"').replace(/%/g, "%%")}"`;
}

export function formatWindowsCommand(command, args = []) {
  return [command, ...args].map((arg) => quoteWindowsShellArg(arg)).join(" ");
}

export function formatPnpmCommand(args, options = {}) {
  const invocation = resolvePnpmInvocation(options.env);
  const commandArgs = [...invocation.commandArgsPrefix, ...args];

  if (process.platform !== "win32") {
    return [invocation.command, ...commandArgs].join(" ");
  }

  return formatWindowsCommand(invocation.command, commandArgs);
}
