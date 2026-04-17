import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function readCliValue(flagName, argv = process.argv) {
  const prefix = `--${flagName}=`;
  const argument = argv.find((value) => value.startsWith(prefix));
  const rawValue = argument?.slice(prefix.length)?.trim();
  return rawValue && rawValue.length > 0 ? rawValue : null;
}

export function readCliValueFromAliases(flagNames, argv = process.argv) {
  for (const flagName of flagNames) {
    const value = readCliValue(flagName, argv);

    if (value) {
      return value;
    }
  }

  return null;
}

export function readPathOverride(flagName, envName, defaultPath, argv = process.argv) {
  return readCliValue(flagName, argv) || process.env[envName]?.trim() || defaultPath;
}

export function inferRunIdFromPath(value, prefixes = []) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const normalizedPath = path.normalize(value.trim());
  const segments = normalizedPath.split(path.sep).filter((segment) => segment.length > 0);

  for (const segment of segments.reverse()) {
    for (const prefix of prefixes) {
      if (segment.startsWith(prefix)) {
        return segment.slice(prefix.length) || null;
      }
    }
  }

  return null;
}

export function resolveLatestMatchingDirectory(baseDir, prefixes = []) {
  if (typeof baseDir !== "string" || baseDir.trim().length === 0 || !Array.isArray(prefixes)) {
    return null;
  }

  let directoryEntries;
  try {
    directoryEntries = fs.readdirSync(baseDir.trim(), { withFileTypes: true });
  } catch {
    return null;
  }

  const matchingDirectories = directoryEntries
    .filter(
      (entry) =>
        entry.isDirectory() && prefixes.some((prefix) => typeof prefix === "string" && entry.name.startsWith(prefix))
    )
    .map((entry) => {
      const targetPath = path.join(baseDir.trim(), entry.name);
      let mtimeMs = Number.NEGATIVE_INFINITY;

      try {
        mtimeMs = fs.statSync(targetPath).mtimeMs;
      } catch {
        mtimeMs = Number.NEGATIVE_INFINITY;
      }

      return {
        name: entry.name,
        targetPath,
        mtimeMs
      };
    })
    .sort((left, right) => {
      if (right.mtimeMs !== left.mtimeMs) {
        return right.mtimeMs - left.mtimeMs;
      }

      return right.name.localeCompare(left.name);
    });

  return matchingDirectories[0]?.targetPath ?? null;
}
