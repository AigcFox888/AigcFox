import fs from "node:fs/promises";
import process from "node:process";

import { checkMarkdownLinks, scanForbiddenDocumentTerms } from "./desktop-docs-check.mjs";
import { runDocumentDiffCheck } from "./document-diff-check.mjs";
import { spawnCargo } from "./cargo-command.mjs";
import {
  assertDesktopV3PackagedAppSmokeSummaryCopies,
  assertDesktopV3ResponsiveSmokeSummaryCopies,
  assertDesktopV3TauriDevSmokeSummaryCopies,
} from "./desktop-v3-smoke-summary-persistence.mjs";
import { runCommandCapture } from "./process-command.mjs";
import { writeJsonFile } from "./script-io.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { assertDesktopV3Wave1ReadinessSummaryContract } from "./wave1-readiness-summary-contract.mjs";
import { persistVerificationSummary } from "./verification-summary-output.mjs";

function createSummary(config, steps) {
  const artifacts = decorateVerificationArtifactRefs(
    {
      latestPackagedAppSmokeSummary: steps.find((step) => step.key === "desktop-v3-packaged-app-smoke")?.artifacts
        ?.latestSummaryPath ?? null,
      latestReadinessSummary: config.latestSummaryPath,
      latestResponsiveSmokeSummary: steps.find((step) => step.key === "desktop-v3-responsive-smoke")?.artifacts
        ?.latestSummaryPath ?? null,
      latestTauriDevSmokeSummary: steps.find((step) => step.key === "desktop-v3-tauri-dev-smoke")?.artifacts
        ?.latestSummaryPath ?? null,
      packagedAppSmokeSummary: steps.find((step) => step.key === "desktop-v3-packaged-app-smoke")?.artifacts
        ?.summaryPath ?? null,
      readinessSummary: config.summaryPath,
      responsiveSmokeSummary: steps.find((step) => step.key === "desktop-v3-responsive-smoke")?.artifacts
        ?.summaryPath ?? null,
      tauriDevSmokeSummary: steps.find((step) => step.key === "desktop-v3-tauri-dev-smoke")?.artifacts
        ?.summaryPath ?? null,
    },
    config.rootDir,
    [
      "latestPackagedAppSmokeSummary",
      "latestReadinessSummary",
      "latestResponsiveSmokeSummary",
      "latestTauriDevSmokeSummary",
      "packagedAppSmokeSummary",
      "readinessSummary",
      "responsiveSmokeSummary",
      "tauriDevSmokeSummary",
    ],
  );

  return decorateVerificationArtifactRefs({
    artifacts,
    error: null,
    finishedAt: null,
    host: {
      isWsl: config.isWslHost,
      platform: config.hostPlatform,
    },
    latestSummaryPath: config.latestSummaryPath,
    outputDir: config.outputDir,
    profile: config.profile,
    runId: config.runId,
    summaryPath: config.summaryPath,
    startedAt: new Date().toISOString(),
    status: "running",
    steps: [],
  }, config.rootDir, ["latestSummaryPath", "outputDir", "summaryPath"]);
}

function decorateDesktopV3Wave1StepArtifacts(config, entry) {
  decorateVerificationArtifactRefs(entry.artifacts, config.rootDir, ["latestSummaryPath", "outputDir", "summaryPath"]);
}

function createDesktopDocumentGateArtifacts(config) {
  return {
    brokenLinks: [],
    documentFiles: config.documentFiles,
    forbiddenTerms: [],
    trackedFiles: [],
    untrackedFiles: [],
  };
}

async function readDesktopV3Wave1ChildSummary(step, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const summaryText = await readFileImpl(step.artifacts.summaryPath, "utf8");
  return JSON.parse(summaryText);
}

async function assertDesktopV3Wave1ChildSmokeSummaryCopies(step, options = {}) {
  const artifacts = step.artifacts ?? {};

  if (
    typeof artifacts.latestSummaryPath !== "string" ||
    artifacts.latestSummaryPath.length === 0 ||
    typeof artifacts.outputDir !== "string" ||
    artifacts.outputDir.length === 0 ||
    typeof artifacts.summaryPath !== "string" ||
    artifacts.summaryPath.length === 0
  ) {
    return;
  }

  const childSummary = await readDesktopV3Wave1ChildSummary(step, options);
  const assertResponsiveSummaryCopiesImpl =
    options.assertResponsiveSummaryCopiesImpl ?? assertDesktopV3ResponsiveSmokeSummaryCopies;
  const assertTauriDevSummaryCopiesImpl =
    options.assertTauriDevSummaryCopiesImpl ?? assertDesktopV3TauriDevSmokeSummaryCopies;
  const assertPackagedSummaryCopiesImpl =
    options.assertPackagedSummaryCopiesImpl ?? assertDesktopV3PackagedAppSmokeSummaryCopies;

  if (step.key === "desktop-v3-responsive-smoke") {
    await assertResponsiveSummaryCopiesImpl(childSummary, artifacts, options);
    return;
  }

  if (step.key === "desktop-v3-tauri-dev-smoke") {
    await assertTauriDevSummaryCopiesImpl(childSummary, artifacts, options);
    return;
  }

  if (step.key === "desktop-v3-packaged-app-smoke") {
    await assertPackagedSummaryCopiesImpl(childSummary, artifacts, options);
  }
}

function runCargoOrThrow(args, options = {}) {
  const { buildError, ...spawnOptions } = options;

  return new Promise((resolve, reject) => {
    const child = spawnCargo(args, spawnOptions);

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(
        new Error(
          typeof buildError === "function"
            ? buildError(code)
            : buildError ?? `cargo ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`,
        ),
      );
    });
  });
}

async function runDesktopV3Wave1Step(step, config, entry, options = {}) {
  if (step.kind === "document") {
    const assertDocumentDiffCheckImpl = options.assertDocumentDiffCheckImpl ?? runDocumentDiffCheck;
    const runCommandCaptureImpl = options.runCommandCaptureImpl ?? runCommandCapture;
    const checkMarkdownLinksImpl = options.checkMarkdownLinksImpl ?? checkMarkdownLinks;
    const scanForbiddenDocumentTermsImpl = options.scanForbiddenDocumentTermsImpl ?? scanForbiddenDocumentTerms;
    Object.assign(entry.artifacts, createDesktopDocumentGateArtifacts(config));
    const documentDiffState = await assertDocumentDiffCheckImpl(config.documentFiles, config.rootDir, {
      readFileImpl: options.readFileImpl,
      runCommandCaptureImpl,
    });

    const brokenLinks = await checkMarkdownLinksImpl(config.documentFiles, config.rootDir);
    const forbiddenTerms = await scanForbiddenDocumentTermsImpl(config.documentFiles, config.rootDir);

    entry.artifacts.brokenLinks = brokenLinks;
    entry.artifacts.documentFiles = config.documentFiles;
    entry.artifacts.forbiddenTerms = forbiddenTerms;
    entry.artifacts.trackedFiles = documentDiffState.trackedFiles;
    entry.artifacts.untrackedFiles = documentDiffState.untrackedFiles;

    if (brokenLinks.length > 0) {
      throw new Error("desktop-v3 document link check failed.");
    }

    if (forbiddenTerms.length > 0) {
      throw new Error("Forbidden legacy execution terms remain in desktop-v3 Wave 1 docs.");
    }

    return;
  }

  if (step.kind === "manual") {
    entry.status = "manual_required";
    entry.passed = false;
    entry.reason = step.reason;
    throw new Error(`${step.label} requires manual verification: ${step.reason}`);
  }

  if (step.kind === "cargo") {
    const runCargoStepImpl = options.runCargoStepImpl ?? runCargoOrThrow;

    await runCargoStepImpl(step.args, {
      buildError: (code) => `${step.label} failed: cargo ${step.args.join(" ")} (exit ${code ?? "unknown"})`,
      cwd: config.rootDir,
      env: {
        ...process.env,
        ...step.env,
      },
      stdio: "inherit",
    });
    return;
  }

  const runPnpmStepImpl = options.runPnpmStepImpl;

  if (typeof runPnpmStepImpl !== "function") {
    throw new Error("runPnpmStepImpl is required.");
  }

  await runPnpmStepImpl(step.args, {
    buildError: (code) => `${step.label} failed: ${step.command} (exit ${code ?? "unknown"})`,
    cwd: config.rootDir,
    env: {
      ...process.env,
      ...step.env,
    },
    stdio: "inherit",
  });
}

export async function runDesktopV3Wave1Readiness(config, steps, options = {}) {
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const assertSummaryContractImpl = options.assertSummaryContractImpl ?? assertDesktopV3Wave1ReadinessSummaryContract;
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;
  const summary = createSummary(config, steps);

  await mkdirImpl(config.outputDir, { recursive: true });

  try {
    for (const step of steps) {
      const entry = {
        artifacts: step.artifacts,
        command: step.command,
        key: step.key,
        kind: step.kind,
        label: step.label,
        startedAt: new Date().toISOString(),
        status: "running",
      };

      summary.steps.push(entry);

      try {
        await runDesktopV3Wave1Step(step, config, entry, options);
        await assertDesktopV3Wave1ChildSmokeSummaryCopies(step, options);
        decorateDesktopV3Wave1StepArtifacts(config, entry);
        entry.finishedAt = new Date().toISOString();
        entry.passed = true;
        entry.status = "passed";
      } catch (error) {
        decorateDesktopV3Wave1StepArtifacts(config, entry);
        entry.error = error instanceof Error ? error.message : String(error);
        entry.finishedAt = new Date().toISOString();
        entry.passed = false;
        if (entry.status === "running") {
          entry.status = "failed";
        }
        throw error;
      }
    }

    summary.status = "passed";
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    summary.status = "failed";
    throw error;
  } finally {
    summary.finishedAt = new Date().toISOString();
    assertSummaryContractImpl(summary, {
      expectedDocumentFiles: config.documentFiles,
      rootDir: config.rootDir,
    });
    await persistVerificationSummary(
      summary,
      {
        archiveSummaryPath: config.summaryPath,
        latestSummaryPath: config.latestSummaryPath,
      },
      {
        writeJsonFileImpl,
      },
    );
  }

  return summary;
}
