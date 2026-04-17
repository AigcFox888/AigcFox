import process from "node:process";
import path from "node:path";

import { pnpmCommandRuntime, resolveEnvPathKey } from "./pnpm-command-resolve.mjs";

export function prependNodeBinToEnvPath(env = {}) {
  const pathKey = resolveEnvPathKey(env);
  const currentPath = env[pathKey] ?? "";
  const pathEntries = currentPath
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (!pathEntries.includes(pnpmCommandRuntime.nodeBinDir)) {
    pathEntries.push(pnpmCommandRuntime.nodeBinDir);
  }

  if (
    pnpmCommandRuntime.shouldUseBundledPnpmScript &&
    !pathEntries.includes(pnpmCommandRuntime.pnpmShimDir)
  ) {
    pathEntries.push(pnpmCommandRuntime.pnpmShimDir);
  }

  return {
    ...env,
    ...(pnpmCommandRuntime.shouldUseBundledPnpmScript
      ? {
          AIGCFOX_NODE_EXE: process.execPath,
          AIGCFOX_PNPM_SCRIPT: pnpmCommandRuntime.bundledPnpmScript,
        }
      : {}),
    [pathKey]: pathEntries.join(path.delimiter),
  };
}
