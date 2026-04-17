import path from "node:path";

import { writeJsonFile } from "./script-io.mjs";

export function resolveLatestVerificationSummaryPath(rootDir, summaryFileName) {
  return path.join(rootDir, "output", "verification", "latest", summaryFileName);
}

export async function persistVerificationSummary(summary, paths, options = {}) {
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;
  const uniquePaths = Array.from(
    new Set(
      [paths.archiveSummaryPath, paths.latestSummaryPath].filter(
        (targetPath) => typeof targetPath === "string" && targetPath.length > 0,
      ),
    ),
  );

  for (const targetPath of uniquePaths) {
    await writeJsonFileImpl(targetPath, summary);
  }
}
