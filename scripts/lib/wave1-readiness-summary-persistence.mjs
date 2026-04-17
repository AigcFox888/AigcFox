import fs from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";

import {
  assertBackendWave1ReadinessSummaryContract,
  assertDesktopV3Wave1ReadinessSummaryContract,
  assertWave1SkeletonReadinessSummaryContract,
} from "./wave1-readiness-summary-contract.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJsonFile(targetPath, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const text = await readFileImpl(targetPath, "utf8");
  return JSON.parse(text);
}

function assertSummaryCopyMatches(expectedSummary, actualSummary, label) {
  assert(isDeepStrictEqual(actualSummary, expectedSummary), `${label} did not match the in-memory run summary.`);
}

function getSummaryContract(kind) {
  if (kind === "backend") {
    return {
      assertSummaryContract: assertBackendWave1ReadinessSummaryContract,
      label: "backend wave1 readiness summary",
    };
  }

  if (kind === "desktop") {
    return {
      assertSummaryContract: assertDesktopV3Wave1ReadinessSummaryContract,
      label: "desktop-v3 wave1 readiness summary",
    };
  }

  return {
    assertSummaryContract: assertWave1SkeletonReadinessSummaryContract,
    label: "wave1 skeleton readiness summary",
  };
}

async function assertPersistedReadinessSummary(kind, summary, config, options = {}) {
  const { assertSummaryContract, label } = getSummaryContract(kind);
  const contractOptions = {
    expectedDocumentFiles: config.documentFiles,
    expectedLatestSummaryPath: config.latestSummaryPath,
    expectedOutputDir: config.outputDir,
    expectedRunId: config.runId,
    expectedStatus: summary.status,
    expectedSummaryPath: config.summaryPath,
    expectedWorkflowFiles: config.workflowFiles,
    rootDir: config.rootDir,
  };

  assertSummaryContract(summary, contractOptions);

  const archiveSummary = await readJsonFile(config.summaryPath, options);
  const latestSummary = await readJsonFile(config.latestSummaryPath, options);

  assertSummaryContract(archiveSummary, contractOptions);
  assertSummaryContract(latestSummary, contractOptions);
  assertSummaryCopyMatches(summary, archiveSummary, `${label} archive copy`);
  assertSummaryCopyMatches(summary, latestSummary, `${label} latest copy`);

  return {
    archiveSummary,
    latestSummary,
  };
}

export function assertBackendWave1ReadinessSummaryCopies(summary, config, options = {}) {
  return assertPersistedReadinessSummary("backend", summary, config, options);
}

export function assertDesktopV3Wave1ReadinessSummaryCopies(summary, config, options = {}) {
  return assertPersistedReadinessSummary("desktop", summary, config, options);
}

export function assertWave1SkeletonReadinessSummaryCopies(summary, config, options = {}) {
  return assertPersistedReadinessSummary("aggregate", summary, config, options);
}
