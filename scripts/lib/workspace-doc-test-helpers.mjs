import fsp from "node:fs/promises";
import path from "node:path";

export async function readWorkspaceFile(rootDir, relativePath) {
  return fsp.readFile(path.join(rootDir, relativePath), "utf8");
}

export async function listWorkspaceFiles(rootDir, relativeDir) {
  const directoryPath = path.join(rootDir, relativeDir);
  const entries = await fsp.readdir(directoryPath, { withFileTypes: true });
  const relativePaths = await Promise.all(
    entries.map(async (entry) => {
      const entryRelativePath = path.posix.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        return listWorkspaceFiles(rootDir, entryRelativePath);
      }

      return [entryRelativePath];
    })
  );

  return relativePaths.flat().sort((left, right) => left.localeCompare(right));
}

export async function readPackageJsonScripts(rootDir) {
  const packageJsonText = await readWorkspaceFile(rootDir, "package.json");
  const packageJson = JSON.parse(packageJsonText);

  return packageJson.scripts;
}
