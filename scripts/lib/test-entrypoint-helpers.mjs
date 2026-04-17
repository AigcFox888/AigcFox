import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(currentDir, "..", "..");

export async function readPackageJsonScripts(workspaceRoot = rootDir) {
  const packageJsonPath = path.join(workspaceRoot, "package.json");
  const packageJsonText = await fsp.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonText);

  return packageJson.scripts;
}

export function listPrefixedTestFiles(options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const libDir = path.join(workspaceRoot, "scripts", "lib");
  const topLevelDir = path.join(workspaceRoot, "scripts");
  const prefixes = Array.isArray(options.prefixes) ? options.prefixes : [];
  const excludePrefixes = Array.isArray(options.excludePrefixes) ? options.excludePrefixes : [];
  const topLevelNames = new Set(Array.isArray(options.topLevelNames) ? options.topLevelNames : []);
  const prefixedLibTests = fs
    .readdirSync(libDir)
    .filter((name) => name.endsWith(".test.mjs"))
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
    .filter((name) => !excludePrefixes.some((prefix) => name.startsWith(prefix)))
    .map((name) => `scripts/lib/${name}`);
  const topLevelTests = fs
    .readdirSync(topLevelDir)
    .filter((name) => topLevelNames.has(name))
    .map((name) => `scripts/${name}`);

  return [...prefixedLibTests, ...topLevelTests].sort();
}

export function listRecursiveTestFiles(directory, matcher, collected = []) {
  for (const name of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, name);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      listRecursiveTestFiles(fullPath, matcher, collected);
      continue;
    }

    if (!fullPath.endsWith(".test.mjs")) {
      continue;
    }

    const workspaceRelativePath = path.relative(rootDir, fullPath).replaceAll(path.sep, "/");

    if (matcher(workspaceRelativePath)) {
      collected.push(workspaceRelativePath);
    }
  }

  return collected.sort();
}
