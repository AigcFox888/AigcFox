import console from "node:console";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { assertDesktopV3PackagedAppSmokeSummaryCopies } from "./lib/desktop-v3-smoke-summary-persistence.mjs";
import {
  resolveDesktopV3PackagedAppSmokeConfig,
  runDesktopV3PackagedAppSmoke,
} from "./lib/desktop-v3-packaged-app-smoke.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";

export function buildDesktopV3PackagedAppSmokeHelpText() {
  return [
    "desktop-v3 packaged app smoke",
    "",
    "Runs the packaged Linux release binary, waits for main-window page-load and renderer boot markers, and verifies the required command invocation chain.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_PACKAGED_APP_SMOKE_OUTPUT_DIR=<absolute-output-dir>",
    "  AIGCFOX_DESKTOP_V3_PACKAGED_APP_BINARY=<absolute-binary-path>",
    "  AIGCFOX_DESKTOP_V3_PACKAGED_APP_INITIAL_ROUTE=/preferences|/diagnostics|/",
    "  AIGCFOX_DESKTOP_V3_PACKAGED_APP_REQUIRED_COMMANDS=cmd1,cmd2",
    "",
    "Prerequisite:",
    "  Run pnpm qa:desktop-v3-linux-package first so the release binary is up to date.",
  ].join("\n");
}

export async function runDesktopV3PackagedAppSmokeCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const assertSummaryCopiesImpl =
    options.assertSummaryCopiesImpl ?? assertDesktopV3PackagedAppSmokeSummaryCopies;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3PackagedAppSmokeConfig;
  const runSmokeImpl = options.runSmokeImpl ?? runDesktopV3PackagedAppSmoke;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3PackagedAppSmokeHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl(process.env);
      const summary = await runSmokeImpl(config);
      await assertSummaryCopiesImpl(summary, config);
      return summary;
    },
    successMessage: (summary) =>
      `desktop-v3 packaged app smoke passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3PackagedAppSmokeCli({ argv });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
