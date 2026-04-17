import console from "node:console";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { assertDesktopV3ResponsiveSmokeSummaryCopies } from "./lib/desktop-v3-smoke-summary-persistence.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";
import {
  resolveDesktopV3ResponsiveSmokeConfig,
} from "./lib/desktop-v3-smoke-contract.mjs";
import { runDesktopV3ResponsiveSmoke } from "./lib/desktop-v3-responsive-smoke-runner.mjs";

export function buildDesktopV3ResponsiveSmokeHelpText() {
  return [
    "desktop-v3 responsive smoke",
    "",
    "Starts the preview app, runs browser-level responsive checks across the Wave 1 skeleton routes, and writes a summary to the configured output directory.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_SMOKE_OUTPUT_DIR=<absolute-output-dir>",
    "  AIGCFOX_DESKTOP_V3_SMOKE_BASE_URL=<preview-base-url>",
    "",
    "Covered routes:",
    "  /#/  /#/preferences  /#/diagnostics",
  ].join("\n");
}

export async function runDesktopV3ResponsiveSmokeCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const assertSummaryCopiesImpl =
    options.assertSummaryCopiesImpl ?? assertDesktopV3ResponsiveSmokeSummaryCopies;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3ResponsiveSmokeConfig;
  const runSmokeImpl = options.runSmokeImpl ?? runDesktopV3ResponsiveSmoke;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3ResponsiveSmokeHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl(process.env);
      const summary = await runSmokeImpl(config);
      await assertSummaryCopiesImpl(summary, config);
      return summary;
    },
    successMessage: (summary) =>
      `desktop-v3 responsive smoke passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3ResponsiveSmokeCli({ argv });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
