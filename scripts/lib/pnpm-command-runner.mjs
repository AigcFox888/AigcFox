import {
  buildPnpmDirectRunnerContext,
  buildPnpmRunnerContext,
} from "./pnpm-command-runner-context.mjs";
import {
  runChildProcess,
  runChildProcessOrThrow,
  spawnPnpmDirectFromContext,
  spawnPnpmFromContext,
} from "./pnpm-command-runner-process.mjs";

export function spawnPnpm(args, options = {}) {
  return spawnPnpmFromContext(args, buildPnpmRunnerContext(options));
}

export function spawnPnpmDirect(args, options = {}) {
  return spawnPnpmDirectFromContext(args, buildPnpmDirectRunnerContext(options));
}

export function runPnpm(args, options = {}) {
  return runChildProcess(spawnPnpm, args, options);
}

export function runPnpmDirect(args, options = {}) {
  return runChildProcess(spawnPnpmDirect, args, options);
}

export function runPnpmOrThrow(args, options = {}) {
  return runChildProcessOrThrow(spawnPnpm, args, options);
}

export function runPnpmDirectOrThrow(args, options = {}) {
  return runChildProcessOrThrow(spawnPnpmDirect, args, options);
}
