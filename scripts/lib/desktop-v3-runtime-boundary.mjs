import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3RuntimeBoundarySourceDir = "apps/desktop-v3/src";
export const desktopV3RuntimeBoundaryAllowedDir = "apps/desktop-v3/src/lib/runtime";

const tauriBridgeGlobals = new Set(["__TAURI_INTERNALS__", "__TAURI__"]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

function normalizeWorkspaceRelativePath(workspaceRoot, absolutePath) {
  return path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, "/");
}

function isTypescriptSourceFile(name) {
  return /\.(?:[cm]?ts|tsx)$/u.test(name) && !name.endsWith(".d.ts");
}

function isInsideDirectory(filePath, directoryPath) {
  return filePath === directoryPath || filePath.startsWith(`${directoryPath}${path.sep}`);
}

function sortViolations(violations) {
  return [...violations].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    if (left.column !== right.column) {
      return left.column - right.column;
    }

    return left.kind.localeCompare(right.kind);
  });
}

function addViolation(violations, seen, sourceFile, workspaceRoot, node, kind, detail) {
  const start = node.getStart(sourceFile);
  const { character, line } = sourceFile.getLineAndCharacterOfPosition(start);
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, sourceFile.fileName);
  const key = `${filePath}:${kind}:${line + 1}:${character + 1}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  violations.push({
    column: character + 1,
    detail,
    filePath,
    kind,
    line: line + 1,
  });
}

function getModuleSpecifierText(node) {
  if (
    node &&
    "moduleSpecifier" in node &&
    node.moduleSpecifier &&
    ts.isStringLiteralLike(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }

  return null;
}

function getImportTypeArgumentText(node) {
  if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteralLike(node.argument.literal)
  ) {
    return node.argument.literal.text;
  }

  return null;
}

export function collectDesktopV3RuntimeBoundaryViolationsFromSource(
  sourceText,
  absoluteFilePath,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const scriptKind = absoluteFilePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    absoluteFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const violations = [];
  const seen = new Set();

  function visit(node) {
    const moduleSpecifier = getModuleSpecifierText(node);

    if (typeof moduleSpecifier === "string" && moduleSpecifier.startsWith("@tauri-apps/")) {
      addViolation(
        violations,
        seen,
        sourceFile,
        workspaceRoot,
        node,
        "tauri-package-import",
        `Only ${desktopV3RuntimeBoundaryAllowedDir} may import ${moduleSpecifier}.`,
      );
    }

    const importTypeSpecifier = getImportTypeArgumentText(node);

    if (typeof importTypeSpecifier === "string" && importTypeSpecifier.startsWith("@tauri-apps/")) {
      addViolation(
        violations,
        seen,
        sourceFile,
        workspaceRoot,
        node,
        "tauri-package-import-type",
        `Only ${desktopV3RuntimeBoundaryAllowedDir} may use import type ${importTypeSpecifier}.`,
      );
    }

    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === "invoke") {
        addViolation(
          violations,
          seen,
          sourceFile,
          workspaceRoot,
          node.expression,
          "tauri-direct-invoke",
          `Only ${desktopV3RuntimeBoundaryAllowedDir} may call invoke() directly.`,
        );
      }

      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        node.arguments[0].text.startsWith("@tauri-apps/")
      ) {
        addViolation(
          violations,
          seen,
          sourceFile,
          workspaceRoot,
          node.arguments[0],
          "tauri-dynamic-import",
          `Only ${desktopV3RuntimeBoundaryAllowedDir} may dynamically import ${node.arguments[0].text}.`,
        );
      }
    }

    if (ts.isIdentifier(node) && tauriBridgeGlobals.has(node.text)) {
      addViolation(
        violations,
        seen,
        sourceFile,
        workspaceRoot,
        node,
        "tauri-global-bridge",
        `Only ${desktopV3RuntimeBoundaryAllowedDir} may touch ${node.text}.`,
      );
    }

    if (
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      tauriBridgeGlobals.has(node.argumentExpression.text)
    ) {
      addViolation(
        violations,
        seen,
        sourceFile,
        workspaceRoot,
        node.argumentExpression,
        "tauri-global-bridge",
        `Only ${desktopV3RuntimeBoundaryAllowedDir} may touch ${node.argumentExpression.text}.`,
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return sortViolations(violations);
}

export async function listDesktopV3RuntimeBoundarySourceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const collected = [];

  async function walk(directoryPath) {
    const entries = await readdirImpl(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile() && isTypescriptSourceFile(entry.name)) {
        collected.push(absolutePath);
      }
    }
  }

  await walk(config.sourceDir);

  return collected.sort((left, right) => left.localeCompare(right));
}

export async function collectDesktopV3RuntimeBoundaryViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.filePaths)
    ? options.filePaths
    : await listDesktopV3RuntimeBoundarySourceFiles(config, options);
  const scannedFiles = [];
  const violations = [];

  for (const absoluteFilePath of absoluteFilePaths) {
    if (isInsideDirectory(absoluteFilePath, config.allowedDir)) {
      continue;
    }

    scannedFiles.push(normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath));

    const sourceText = await readFileImpl(absoluteFilePath, "utf8");
    violations.push(
      ...collectDesktopV3RuntimeBoundaryViolationsFromSource(sourceText, absoluteFilePath, {
        rootDir: config.rootDir,
      }),
    );
  }

  return {
    scannedFiles: [...scannedFiles].sort((left, right) => left.localeCompare(right)),
    violations: sortViolations(violations),
  };
}

export function createDesktopV3RuntimeBoundarySummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedDir: desktopV3RuntimeBoundaryAllowedDir,
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      sourceDir: desktopV3RuntimeBoundarySourceDir,
      status: "running",
      summaryPath: config.summaryPath,
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3RuntimeBoundaryFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 runtime boundary check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 runtime boundary check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3RuntimeBoundaryConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-runtime-boundary-${runId}`);

  return {
    allowedDir: path.join(workspaceRoot, desktopV3RuntimeBoundaryAllowedDir),
    latestSummaryPath: resolveLatestVerificationSummaryPath(workspaceRoot, "desktop-v3-runtime-boundary-summary.json"),
    outputDir,
    rootDir: workspaceRoot,
    runId,
    sourceDir: path.join(workspaceRoot, desktopV3RuntimeBoundarySourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
