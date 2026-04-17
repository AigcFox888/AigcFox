import fs from "node:fs/promises";
import path from "node:path";

import { runCommandCapture } from "./process-command.mjs";

function normalizeGitPathList(stdout) {
  if (typeof stdout !== "string" || stdout.length === 0) {
    return [];
  }

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function collectUntrackedDocumentDiffErrors(relativeFilePath, fileText) {
  const errors = [];
  const lines = fileText.split("\n");

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1;
    const line = rawLine.replace(/\r$/u, "");

    if (/[ \t]+$/u.test(line)) {
      errors.push({
        file: relativeFilePath,
        line: lineNumber,
        reason: "trailing whitespace",
      });
    }

    if (/^(?:<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)(?: .*)?$/u.test(line)) {
      errors.push({
        file: relativeFilePath,
        line: lineNumber,
        reason: "merge conflict marker",
      });
    }

    if (/^( +)\t/u.test(line)) {
      errors.push({
        file: relativeFilePath,
        line: lineNumber,
        reason: "space before tab in indent",
      });
    }
  }

  return errors;
}

function formatUntrackedDocumentDiffErrors(errors) {
  return [
    "Document format check failed for untracked source-of-truth files.",
    ...errors.map((error) => `${error.file}:${error.line} ${error.reason}`),
  ].join("\n");
}

export async function runDocumentDiffCheck(files, rootDir, options = {}) {
  const runCommandCaptureImpl = options.runCommandCaptureImpl ?? runCommandCapture;
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const listResult = await runCommandCaptureImpl(
    "git",
    ["ls-files", "--others", "--exclude-standard", "--", ...files],
    { cwd: rootDir },
  );

  if (!listResult.ok) {
    throw new Error(listResult.stderr || listResult.stdout || "git ls-files --others --exclude-standard failed.");
  }

  const untrackedFiles = normalizeGitPathList(listResult.stdout);
  const untrackedFileSet = new Set(untrackedFiles);
  const trackedFiles = files.filter((file) => !untrackedFileSet.has(file));

  if (trackedFiles.length > 0) {
    const diffCheck = await runCommandCaptureImpl("git", ["diff", "--check", "--", ...trackedFiles], {
      cwd: rootDir,
    });

    if (!diffCheck.ok) {
      throw new Error(diffCheck.stderr || diffCheck.stdout || "git diff --check failed.");
    }
  }

  const errors = [];

  for (const relativeFilePath of untrackedFiles) {
    const absoluteFilePath = path.join(rootDir, relativeFilePath);
    const fileText = await readFileImpl(absoluteFilePath, "utf8");
    errors.push(...collectUntrackedDocumentDiffErrors(relativeFilePath, fileText));
  }

  if (errors.length > 0) {
    throw new Error(formatUntrackedDocumentDiffErrors(errors));
  }

  return {
    trackedFiles,
    untrackedFiles,
  };
}
