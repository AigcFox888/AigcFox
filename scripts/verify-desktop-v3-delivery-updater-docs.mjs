import fs from "node:fs/promises";

import { checkMarkdownLinks, scanForbiddenDocumentTerms } from "./lib/desktop-docs-check.mjs";
import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./lib/desktop-v3-delivery-updater-docs-config.mjs";
import { runDocumentDiffCheck } from "./lib/document-diff-check.mjs";
import { writeJsonFile } from "./lib/script-io.mjs";
import { decorateVerificationArtifactRefs } from "./lib/verification-artifact-ref.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";

function createSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      brokenLinks: [],
      checkedAt: null,
      documentFiles: config.documentFiles,
      error: null,
      forbiddenTerms: [],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      status: "running",
      summaryPath: config.summaryPath,
      trackedFiles: [],
      untrackedFiles: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

async function main() {
  const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
  const summary = createSummary(config);

  await fs.mkdir(config.outputDir, { recursive: true });

  try {
    const documentDiffState = await runDocumentDiffCheck(config.documentFiles, config.rootDir);
    const brokenLinks = await checkMarkdownLinks(config.documentFiles, config.rootDir);
    const forbiddenTerms = await scanForbiddenDocumentTerms(config.documentFiles, config.rootDir);

    summary.brokenLinks = brokenLinks;
    summary.checkedAt = new Date().toISOString();
    summary.forbiddenTerms = forbiddenTerms;
    summary.trackedFiles = documentDiffState.trackedFiles;
    summary.untrackedFiles = documentDiffState.untrackedFiles;

    if (brokenLinks.length > 0) {
      throw new Error("desktop-v3 delivery/updater docs link check failed.");
    }

    if (forbiddenTerms.length > 0) {
      throw new Error("Forbidden legacy execution terms remain in desktop-v3 delivery/updater docs.");
    }

    summary.status = "passed";
    await persistVerificationSummary(summary, {
      archiveSummaryPath: config.summaryPath,
      latestSummaryPath: config.latestSummaryPath,
    }, {
      writeJsonFileImpl: writeJsonFile,
    });

    console.log(
      `desktop-v3 delivery/updater docs passed. Summary: ${config.summaryPath} | Latest: ${config.latestSummaryPath}`,
    );
  } catch (error) {
    summary.checkedAt = new Date().toISOString();
    summary.error = error instanceof Error ? error.message : String(error);
    summary.status = "failed";

    await persistVerificationSummary(summary, {
      archiveSummaryPath: config.summaryPath,
      latestSummaryPath: config.latestSummaryPath,
    }, {
      writeJsonFileImpl: writeJsonFile,
    });

    throw error;
  }
}

await main();
