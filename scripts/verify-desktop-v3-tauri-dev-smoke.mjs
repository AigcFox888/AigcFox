import console from "node:console";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { assertDesktopV3TauriDevSmokeSummaryCopies } from "./lib/desktop-v3-smoke-summary-persistence.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";
import { resolveDesktopV3TauriDevSmokeConfig } from "./lib/desktop-v3-tauri-dev-smoke.mjs";
import { runDesktopV3TauriDevSmoke } from "./lib/desktop-v3-tauri-dev-smoke-runner.mjs";

export function buildDesktopV3TauriDevSmokeHelpText() {
  return [
    "desktop-v3 tauri dev smoke",
    "",
    "Starts pnpm --filter @aigcfox/desktop-v3 tauri dev, waits for Vite ready, cargo running, WSLg window registration, main-window page-load finished, and renderer boot stage=app markers, then writes a summary.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_TAURI_DEV_SMOKE_OUTPUT_DIR=<absolute-output-dir>",
    "  AIGCFOX_DESKTOP_V3_TAURI_DEV_APP_ID=<app-id>",
    "  AIGCFOX_DESKTOP_V3_TAURI_DEV_WESTON_LOG=<weston-log-path>",
    "  AIGCFOX_DESKTOP_V3_TAURI_DEV_TIMEOUT_MS=<timeout-ms>",
  ].join("\n");
}

export async function runDesktopV3TauriDevSmokeCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const assertSummaryCopiesImpl =
    options.assertSummaryCopiesImpl ?? assertDesktopV3TauriDevSmokeSummaryCopies;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3TauriDevSmokeConfig;
  const runSmokeImpl = options.runSmokeImpl ?? runDesktopV3TauriDevSmoke;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3TauriDevSmokeHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl(process.env);
      const summary = await runSmokeImpl(config);
      await assertSummaryCopiesImpl(summary, config);
      return summary;
    },
    successMessage: (summary) =>
      `desktop-v3 tauri dev smoke passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3TauriDevSmokeCli({ argv });
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
