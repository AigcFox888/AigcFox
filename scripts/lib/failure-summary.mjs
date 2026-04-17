import { readJsonFile } from "./script-io.mjs";

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function writeFailureSummaryFallback(
  summaryPath,
  writeSummary,
  error,
  options = {}
) {
  const errorMessage = getErrorMessage(error);
  const mergeBaseSummaryIntoExisting = options.mergeBaseSummaryIntoExisting === true;
  const currentSummary =
    options.currentSummary && typeof options.currentSummary === "object"
      ? options.currentSummary
      : null;
  const fallbackSummary = {
    ...(options.baseSummary ?? {}),
    passed: false,
    error: errorMessage
  };
  const callbackContext = {
    errorMessage,
    fallbackSummary
  };

  try {
    const existing = currentSummary ?? (await readJsonFile(summaryPath));
    await writeSummary(
      mergeBaseSummaryIntoExisting
        ? {
            ...existing,
            ...fallbackSummary
          }
        : {
            ...existing,
            passed: false,
            error: errorMessage
          },
      {
        ...callbackContext,
        usedFallbackSummary: false
      }
    );
  } catch {
    try {
      await writeSummary(fallbackSummary, {
        ...callbackContext,
        usedFallbackSummary: true
      });
    } catch {
      // Ignore secondary summary write failures.
    }
  }

  return {
    errorMessage,
    fallbackSummary
  };
}
