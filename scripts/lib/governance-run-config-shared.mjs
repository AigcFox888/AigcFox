import process from "node:process";

import { readCliValue, readCliValueFromAliases } from "./path-overrides.mjs";

export const projectGovernanceRunIdPrefixes = ["project-governance-run-", "governance-run-"];
export const desktopGovernanceRunIdPrefixes = [
  "desktop-governance-run-",
  "desktop-smoke-run-",
  "governance-run-"
];

export function readEnvValue(env, names) {
  for (const name of names) {
    const value = env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

export function readPathValue(optionValue, flagNames, envNames, defaultPath, argv, env) {
  if (optionValue) {
    return optionValue;
  }

  const flags = Array.isArray(flagNames) ? flagNames : [flagNames];
  const envKeys = Array.isArray(envNames) ? envNames : [envNames];
  const cliValue =
    flags.length > 1
      ? readCliValueFromAliases(flags, argv)
      : flags.length === 1
        ? readCliValue(flags[0], argv)
        : null;

  return cliValue || readEnvValue(env, envKeys) || defaultPath;
}

export function readRunId(optionRunId, flagName, envNames, inferredRunId, argv, env) {
  return (
    optionRunId ||
    readCliValue(flagName, argv) ||
    readEnvValue(env, Array.isArray(envNames) ? envNames : [envNames]) ||
    inferredRunId ||
    `${Date.now()}-${process.pid}`
  );
}

export function normalizePhase(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().toLowerCase() : null;
}

export function normalizeOptionalValue(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
