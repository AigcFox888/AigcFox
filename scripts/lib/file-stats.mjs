import fs from "node:fs/promises";
import path from "node:path";

export function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export async function getFileSize(targetPath) {
  const stat = await fs.stat(targetPath);
  return stat.size;
}

export async function walkDirectory(rootPath) {
  const stack = [rootPath];
  const files = [];

  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (!currentPath) {
      continue;
    }

    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile()) {
        const stat = await fs.stat(entryPath);
        files.push({
          path: entryPath,
          size: stat.size
        });
      }
    }
  }

  return files;
}

export async function walkDirectoryTree(rootPath) {
  const stack = [rootPath];
  const directories = [];
  const files = [];

  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (!currentPath) {
      continue;
    }

    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        directories.push(entryPath);
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile()) {
        const stat = await fs.stat(entryPath);
        files.push({
          path: entryPath,
          size: stat.size
        });
      }
    }
  }

  return {
    directories,
    files
  };
}
