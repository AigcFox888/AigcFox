import fs from "node:fs/promises";
import path from "node:path";

import { walkDirectoryTree } from "./file-stats.mjs";
import { pathExists } from "./script-io.mjs";

function toPosixRelative(baseDir, targetPath) {
  return path.relative(baseDir, targetPath).split(path.sep).join("/");
}

function getPositivePackageEntries(packageFiles) {
  return Array.from(
    new Set(
      (Array.isArray(packageFiles) ? packageFiles : [])
        .filter((entry) => typeof entry === "string" && entry.length > 0 && !entry.startsWith("!"))
        .map((entry) => entry.replaceAll("/", path.sep))
    )
  );
}

export async function collectDesktopPackagedTree(options) {
  const desktopDir = options?.desktopDir;

  if (typeof desktopDir !== "string" || desktopDir.length === 0) {
    throw new Error("collectDesktopPackagedTree requires a desktopDir.");
  }

  const packageFiles = getPositivePackageEntries(options?.packageFiles);
  const pathExistsImpl =
    typeof options?.pathExistsImpl === "function" ? options.pathExistsImpl : pathExists;
  const statImpl = typeof options?.statImpl === "function" ? options.statImpl : fs.stat;
  const walkDirectoryTreeImpl =
    typeof options?.walkDirectoryTreeImpl === "function"
      ? options.walkDirectoryTreeImpl
      : walkDirectoryTree;

  const directories = new Set();
  const files = new Map();

  for (const packageEntry of packageFiles) {
    const absolutePath = path.join(desktopDir, packageEntry);

    if (!(await pathExistsImpl(absolutePath))) {
      continue;
    }

    const stat = await statImpl(absolutePath);

    if (stat.isFile()) {
      const relativePath = toPosixRelative(desktopDir, absolutePath);
      files.set(relativePath, {
        path: relativePath,
        absolutePath,
        size: stat.size
      });
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    directories.add(toPosixRelative(desktopDir, absolutePath));

    const tree = await walkDirectoryTreeImpl(absolutePath);

    for (const directoryPath of tree.directories ?? []) {
      directories.add(toPosixRelative(desktopDir, directoryPath));
    }

    for (const file of tree.files ?? []) {
      const relativePath = toPosixRelative(desktopDir, file.path);
      files.set(relativePath, {
        path: relativePath,
        absolutePath: file.path,
        size: file.size
      });
    }
  }

  return {
    directories: [...directories].sort(),
    files: [...files.values()].sort((left, right) => left.path.localeCompare(right.path))
  };
}
