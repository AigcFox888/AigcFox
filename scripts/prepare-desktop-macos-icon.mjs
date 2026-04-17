import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { writeFailureSummaryFallback } from "./lib/failure-summary.mjs";
import { runCommandCapture, runCommandOrThrow } from "./lib/process-command.mjs";
import { pathExists, writeJsonFile } from "./lib/script-io.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..");
export const buildDir = path.join(rootDir, "apps", "desktop", "build");
export const sourcePngPath = path.join(buildDir, "icon.png");
export const iconsetDir = path.join(buildDir, "icon.iconset");
export const icnsPath = path.join(buildDir, "icon.icns");
export const verificationDir = path.join(rootDir, "output", "verification");
export const summaryPath = path.join(verificationDir, "desktop-macos-icon-prepare-summary.json");

export const iconsetVariants = [
  { file: "icon_16x16.png", size: 16 },
  { file: "icon_16x16@2x.png", size: 32 },
  { file: "icon_32x32.png", size: 32 },
  { file: "icon_32x32@2x.png", size: 64 },
  { file: "icon_128x128.png", size: 128 },
  { file: "icon_128x128@2x.png", size: 256 },
  { file: "icon_256x256.png", size: 256 },
  { file: "icon_256x256@2x.png", size: 512 },
  { file: "icon_512x512.png", size: 512 },
  { file: "icon_512x512@2x.png", size: 1024 }
];

let currentSummary = createBaseDesktopMacosIconPrepareSummary();
let wroteSummaryForCurrentRun = false;

function createBlockingIssue(category, detail, remediation = null) {
  return {
    category,
    detail,
    remediation
  };
}

function buildBlockingIssueStrings(issues) {
  return issues.map((issue) => issue.detail);
}

function buildRecommendedActions(issues) {
  return [
    ...new Set(
      issues
        .map((issue) => issue.remediation)
        .filter((value) => typeof value === "string" && value.length > 0)
    )
  ];
}

function collectDesktopMacosIconPrepareFailureReasons(summary) {
  return Array.isArray(summary?.blockingIssues) && summary.blockingIssues.length > 0
    ? summary.blockingIssues
    : [summary?.error ?? "Desktop macOS icon preparation failed."];
}

async function resolveTool(toolName, options = {}) {
  const runCommandCaptureImpl =
    typeof options.runCommandCaptureImpl === "function" ? options.runCommandCaptureImpl : runCommandCapture;
  const cwd = typeof options.cwd === "string" && options.cwd.length > 0 ? options.cwd : rootDir;

  return runCommandCaptureImpl("sh", ["-lc", `command -v ${toolName}`], { cwd });
}

export function createBaseDesktopMacosIconPrepareSummary(overrides = {}) {
  return {
    checkedAt:
      typeof overrides.checkedAt === "string" && overrides.checkedAt.length > 0
        ? overrides.checkedAt
        : new Date().toISOString(),
    summaryPath,
    buildDir,
    sourcePngPath,
    iconsetDir,
    icnsPath,
    ...overrides
  };
}

export async function persistDesktopMacosIconPrepareSummary(summary, options = {}) {
  const writeJsonFileImpl =
    typeof options.writeJsonFileImpl === "function" ? options.writeJsonFileImpl : writeJsonFile;
  const nextSummary = createBaseDesktopMacosIconPrepareSummary(summary);

  await writeJsonFileImpl(nextSummary.summaryPath, nextSummary);
  return nextSummary;
}

export const persistSummary = persistDesktopMacosIconPrepareSummary;

export async function runDesktopMacosIconPrepare(options = {}) {
  const pathExistsImpl = typeof options.pathExistsImpl === "function" ? options.pathExistsImpl : pathExists;
  const runCommandCaptureImpl =
    typeof options.runCommandCaptureImpl === "function" ? options.runCommandCaptureImpl : runCommandCapture;
  const resolveToolImpl =
    typeof options.resolveToolImpl === "function"
      ? options.resolveToolImpl
      : (toolName) => resolveTool(toolName, { runCommandCaptureImpl, cwd: rootDir });
  const runCommandOrThrowImpl =
    typeof options.runCommandOrThrowImpl === "function" ? options.runCommandOrThrowImpl : runCommandOrThrow;
  const rmImpl = typeof options.rmImpl === "function" ? options.rmImpl : fs.rm;
  const mkdirImpl = typeof options.mkdirImpl === "function" ? options.mkdirImpl : fs.mkdir;
  const persistSummaryImpl =
    typeof options.persistSummaryImpl === "function"
      ? options.persistSummaryImpl
      : persistDesktopMacosIconPrepareSummary;
  const consoleLogImpl = typeof options.consoleLogImpl === "function" ? options.consoleLogImpl : console.log;
  const hostPlatform = typeof options.platform === "string" ? options.platform : process.platform;

  currentSummary = createBaseDesktopMacosIconPrepareSummary({
    checkedAt:
      typeof options.checkedAt === "string" && options.checkedAt.length > 0
        ? options.checkedAt
        : undefined
  });
  wroteSummaryForCurrentRun = false;

  const sourceIconExists = await pathExistsImpl(sourcePngPath);
  const checks = {
    hostPlatform,
    buildDir,
    sourcePngPath,
    sourcePngExists: sourceIconExists,
    iconsetDir,
    icnsPath,
    tools: {
      sips: null,
      iconutil: null
    },
    variants: iconsetVariants.map((variant) => ({
      ...variant,
      outputPath: path.join(iconsetDir, variant.file),
      generated: false
    }))
  };
  const blockingIssueDetails = [];

  if (hostPlatform !== "darwin") {
    blockingIssueDetails.push(
      createBlockingIssue(
        "host",
        "macOS host is required",
        "Switch to a real macOS host before preparing the desktop macOS icon."
      )
    );
  }

  if (!sourceIconExists) {
    blockingIssueDetails.push(
      createBlockingIssue(
        "icon",
        `desktop icon source png is missing (${sourcePngPath})`,
        `Add or restore icon.png at ${sourcePngPath} before preparing icon.icns.`
      )
    );
  }

  if (hostPlatform === "darwin") {
    checks.tools.sips = await resolveToolImpl("sips");
    checks.tools.iconutil = await resolveToolImpl("iconutil");

    if (checks.tools.sips?.ok !== true) {
      blockingIssueDetails.push(
        createBlockingIssue(
          "toolchain",
          "sips is not available on the macOS host",
          "Verify sips is available before preparing the macOS icon assets."
        )
      );
    }

    if (checks.tools.iconutil?.ok !== true) {
      blockingIssueDetails.push(
        createBlockingIssue(
          "toolchain",
          "iconutil is not available on the macOS host",
          "Verify iconutil is available before generating icon.icns."
        )
      );
    }
  }

  currentSummary = (await persistSummaryImpl(
    createBaseDesktopMacosIconPrepareSummary({
      checkedAt:
        typeof options.checkedAt === "string" && options.checkedAt.length > 0
          ? options.checkedAt
          : undefined,
      passed: false,
      stage: "preflight",
      blockingIssues: buildBlockingIssueStrings(blockingIssueDetails),
      blockingIssueDetails,
      recommendedActions: buildRecommendedActions(blockingIssueDetails),
      checks,
      generatedVariantCount: 0,
      generatedVariantFiles: []
    }),
    options
  )) ?? currentSummary;
  wroteSummaryForCurrentRun = true;

  if (blockingIssueDetails.length > 0) {
    throw new Error(`${collectDesktopMacosIconPrepareFailureReasons(currentSummary).join("; ")}. See ${summaryPath}`);
  }

  currentSummary = createBaseDesktopMacosIconPrepareSummary({
    ...currentSummary,
    stage: "preparing-iconset"
  });

  await rmImpl(iconsetDir, { recursive: true, force: true });
  await mkdirImpl(iconsetDir, { recursive: true });

  const generatedVariantFiles = [];

  for (const variant of checks.variants) {
    currentSummary = createBaseDesktopMacosIconPrepareSummary({
      ...currentSummary,
      stage: "rendering-variants",
      activeVariant: {
        file: variant.file,
        size: variant.size
      },
      generatedVariantCount: generatedVariantFiles.length,
      generatedVariantFiles
    });

    await runCommandOrThrowImpl(
      "sips",
      [
        "-z",
        String(variant.size),
        String(variant.size),
        sourcePngPath,
        "--out",
        variant.outputPath
      ],
      {
        cwd: rootDir,
        buildError: (code) =>
          `sips failed while generating ${variant.file} with exit code ${code ?? "unknown"}.`
      }
    );

    variant.generated = true;
    generatedVariantFiles.push(variant.outputPath);
  }

  currentSummary = createBaseDesktopMacosIconPrepareSummary({
    ...currentSummary,
    stage: "building-icns",
    activeVariant: null,
    generatedVariantCount: generatedVariantFiles.length,
    generatedVariantFiles
  });

  await rmImpl(icnsPath, { force: true });
  await runCommandOrThrowImpl("iconutil", ["-c", "icns", iconsetDir, "-o", icnsPath], {
    cwd: rootDir,
    buildError: (code) =>
      `iconutil failed while generating ${path.basename(icnsPath)} with exit code ${code ?? "unknown"}.`
  });

  currentSummary = (await persistSummaryImpl(
    createBaseDesktopMacosIconPrepareSummary({
      ...currentSummary,
      passed: true,
      stage: "completed",
      blockingIssues: [],
      blockingIssueDetails: [],
      recommendedActions: [],
      checks,
      activeVariant: null,
      generatedVariantCount: generatedVariantFiles.length,
      generatedVariantFiles
    }),
    options
  )) ?? currentSummary;

  consoleLogImpl(
    [
      "Desktop macOS icon preparation completed.",
      `Source: ${sourcePngPath}.`,
      `Generated variants: ${generatedVariantFiles.length}.`,
      `Iconset: ${iconsetDir}.`,
      `ICNS: ${icnsPath}.`,
      `Summary: ${summaryPath}.`
    ].join(" ")
  );

  return currentSummary;
}

export async function handleDesktopMacosIconPrepareFailure(error, options = {}) {
  const writeFailureSummaryFallbackImpl =
    typeof options.writeFailureSummaryFallbackImpl === "function"
      ? options.writeFailureSummaryFallbackImpl
      : writeFailureSummaryFallback;
  const persistSummaryImpl =
    typeof options.persistSummaryImpl === "function"
      ? options.persistSummaryImpl
      : persistDesktopMacosIconPrepareSummary;
  const currentSummaryOverride =
    options.currentSummary && typeof options.currentSummary === "object"
      ? options.currentSummary
      : currentSummary;
  const baseSummary = createBaseDesktopMacosIconPrepareSummary({
    checkedAt:
      typeof options.checkedAt === "string" && options.checkedAt.length > 0
        ? options.checkedAt
        : undefined
  });

  return writeFailureSummaryFallbackImpl(
    summaryPath,
    async (summary, context) => {
      const nextSummary = createBaseDesktopMacosIconPrepareSummary({
        ...baseSummary,
        ...(currentSummaryOverride && typeof currentSummaryOverride === "object" ? currentSummaryOverride : {}),
        ...(summary && typeof summary === "object" ? summary : {}),
        passed: false,
        error: context?.errorMessage ?? summary?.error
      });

      await persistSummaryImpl(nextSummary, options);
    },
    error,
    {
      currentSummary:
        options.wroteSummaryForCurrentRun === true ||
        (typeof options.wroteSummaryForCurrentRun !== "boolean" && wroteSummaryForCurrentRun === true)
          ? currentSummaryOverride
          : null,
      baseSummary
    }
  );
}

const isDirectExecution =
  typeof process.argv[1] === "string" && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

async function main() {
  return runDesktopMacosIconPrepare();
}

if (isDirectExecution) {
  main().catch(async (error) => {
    const { errorMessage } = await handleDesktopMacosIconPrepareFailure(error, {
      currentSummary,
      wroteSummaryForCurrentRun
    });

    console.error(errorMessage);
    process.exitCode = 1;
  });
}
