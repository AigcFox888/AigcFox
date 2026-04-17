import fs from "node:fs/promises";
import path from "node:path";

const forbiddenPatterns = [
  {
    description: "历史批次标记残留",
    pattern: /\bP[01]-B\d+\b/u,
  },
  {
    description: "旧阶段主线残留",
    pattern: /\bP0-P10\b/u,
  },
  {
    description: "Phase 1 主线残留",
    pattern: /\bPhase 1\b/u,
  },
  {
    description: "旧桌面执行线残留",
    pattern: /\bdesktop-v2\b/u,
  },
  {
    description: "已移除的仓库级聚合链残留",
    pattern: /\bwave1-skeleton\b/u,
  },
  {
    description: "已移除的本地 backend 执行线残留",
    pattern: /\bbackend-wave1\b/u,
  },
];

export async function checkMarkdownLinks(files, rootDir) {
  const brokenLinks = [];

  for (const relativeFilePath of files) {
    const absoluteFilePath = path.join(rootDir, relativeFilePath);
    const fileText = await fs.readFile(absoluteFilePath, "utf8");
    const regex = /\[[^\]]+\]\(([^)]+)\)/gu;

    for (const match of fileText.matchAll(regex)) {
      const href = match[1];

      if (/^(https?:|mailto:|#|\/)/u.test(href)) {
        continue;
      }

      const targetPath = path.normalize(path.join(path.dirname(absoluteFilePath), href));

      try {
        await fs.access(targetPath);
      } catch {
        brokenLinks.push({
          file: relativeFilePath,
          href,
          targetPath: path.relative(rootDir, targetPath),
        });
      }
    }
  }

  return brokenLinks;
}

export async function scanForbiddenDocumentTerms(files, rootDir) {
  const matches = [];

  for (const relativeFilePath of files) {
    const absoluteFilePath = path.join(rootDir, relativeFilePath);
    const fileText = await fs.readFile(absoluteFilePath, "utf8");

    for (const item of forbiddenPatterns) {
      const result = item.pattern.exec(fileText);

      if (result) {
        matches.push({
          description: item.description,
          file: relativeFilePath,
          match: result[0],
        });
      }
    }
  }

  return matches;
}
