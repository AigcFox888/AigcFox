import fs from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";

import {
  assertDesktopV3ResponsiveSmokeSummaryContract,
  assertDesktopV3TauriDevSmokeSummaryContract,
} from "./desktop-v3-smoke-summary-contract.mjs";

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

function getSmokeSummaryContract(kind) {
  if (kind === "responsive") {
    return {
      assertSummaryContract: assertDesktopV3ResponsiveSmokeSummaryContract,
      label: "desktop-v3 responsive smoke summary",
    };
  }

  if (kind === "tauri-dev") {
    return {
      assertSummaryContract: assertDesktopV3TauriDevSmokeSummaryContract,
      label: "desktop-v3 tauri dev smoke summary",
    };
  }

  throw new Error(`Unsupported desktop-v3 smoke summary kind: ${kind}.`);
}

async function assertPersistedSmokeSummary(kind, summary, config, options = {}) {
  const { assertSummaryContract, label } = getSmokeSummaryContract(kind);
  const contractOptions = {
    expectedLatestSummaryPath: config.latestSummaryPath,
    expectedOutputDir: config.outputDir,
    expectedSummaryPath: config.summaryPath,
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

export function assertDesktopV3ResponsiveSmokeSummaryCopies(summary, config, options = {}) {
  return assertPersistedSmokeSummary("responsive", summary, config, options);
}

export function assertDesktopV3TauriDevSmokeSummaryCopies(summary, config, options = {}) {
  return assertPersistedSmokeSummary("tauri-dev", summary, config, options);
}
