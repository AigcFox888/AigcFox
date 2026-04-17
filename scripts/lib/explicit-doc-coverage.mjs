import fs from "node:fs";
import path from "node:path";

function walkTestFiles(directory, collected) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkTestFiles(fullPath, collected);
      continue;
    }

    if (!/\.(test)\.(mjs|ts|tsx|go)$/.test(entry.name)) {
      continue;
    }

    collected.push(fullPath);
  }
}

function resolveDocTokens(docPath) {
  const basename = path.basename(docPath);

  if (basename === "README.md") {
    return [docPath];
  }

  return [docPath, basename];
}

export function collectExplicitDocCoverage(rootDir, docPaths, options = {}) {
  const excludedFiles = new Set((options.excludeFiles ?? []).map((file) => path.resolve(file)));
  const testRoots = options.testRoots ?? ["scripts", "apps/desktop-v3", "backend"];
  const testFiles = [];

  for (const relativeDir of testRoots) {
    const absoluteDir = path.join(rootDir, relativeDir);

    if (fs.existsSync(absoluteDir)) {
      walkTestFiles(absoluteDir, testFiles);
    }
  }

  const loadedTests = testFiles
    .map((testFile) => path.resolve(testFile))
    .filter((resolvedTestFile) => !excludedFiles.has(resolvedTestFile))
    .map((resolvedTestFile) => ({
      text: fs.readFileSync(resolvedTestFile, "utf8"),
      workspaceRelativePath: path.relative(rootDir, resolvedTestFile).replaceAll(path.sep, "/"),
    }));

  return docPaths.map((docPath) => {
    const tokens = resolveDocTokens(docPath);
    const refs = [];

    for (const loadedTest of loadedTests) {
      if (tokens.some((token) => loadedTest.text.includes(token))) {
        refs.push(loadedTest.workspaceRelativePath);
      }
    }

    return {
      count: refs.length,
      docPath,
      refs,
    };
  });
}
