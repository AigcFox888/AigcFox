import console from "node:console";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { runPnpmOrThrow } from "./lib/pnpm-command.mjs";
import { resolveDesktopV3Wave1ReadinessConfig } from "./lib/desktop-v3-wave1-readiness-config.mjs";
import { runDesktopV3Wave1Readiness } from "./lib/desktop-v3-wave1-readiness-runner.mjs";
import { buildDesktopV3Wave1ReadinessSteps } from "./lib/desktop-v3-wave1-readiness-steps.mjs";
import { runWave1ReadinessCli } from "./lib/wave1-readiness-cli.mjs";
import { assertDesktopV3Wave1ReadinessSummaryCopies } from "./lib/wave1-readiness-summary-persistence.mjs";

export function buildDesktopV3Wave1ReadinessHelpText() {
  return [
    "desktop-v3 Wave 1 readiness runner",
    "",
    "Runs the current Wave 1 skeleton acceptance chain in order and writes a summary to output/verification.",
    "",
    "Environment overrides:",
    "  AIGCFOX_DESKTOP_V3_WAVE1_RUN_ID=<run-id>",
    "  AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR=<absolute-output-dir>",
    "  AIGCFOX_DESKTOP_V3_WAVE1_PROFILE=default|ci",
    "",
    "Notes:",
    "  The runner starts with a source-of-truth document gate: git diff --check for tracked docs, equivalent format checks for untracked docs, then markdown links + forbidden legacy term scan.",
    "  The runner then enforces renderer runtime, LocalDatabase governance, backend-client governance, runtime skeleton governance, runtime contract governance, runtime adapter governance, feature governance, Rust command governance, capability governance, shared Tauri platform-config governance, and updater governance before lint / test / smoke proof steps.",
    "  On Ubuntu + WSL, the host tauri proof step uses qa:desktop-v3-tauri-dev-smoke.",
    "  On Ubuntu + WSL, packaged renderer proof uses qa:desktop-v3-packaged-app-smoke after qa:desktop-v3-linux-package.",
    "  The top-level readiness summary keeps archive/latest copies and binds the child smoke archive/latest summary paths for responsive, tauri dev, and packaged app.",
    "  On other non-CI hosts, the runner stops at the tauri dev step and records that manual host proof is still required.",
    "  In GitHub Actions, the runner auto-switches to the ci profile and skips the host-window proof step.",
  ].join("\n");
}

export async function runDesktopV3Wave1ReadinessCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const resolveConfigImpl = options.resolveConfigImpl ?? resolveDesktopV3Wave1ReadinessConfig;
  const buildStepsImpl = options.buildStepsImpl ?? buildDesktopV3Wave1ReadinessSteps;
  const runReadinessImpl = options.runReadinessImpl ?? runDesktopV3Wave1Readiness;
  const runPnpmStepImpl = options.runPnpmStepImpl ?? runPnpmOrThrow;
  const assertSummaryCopiesImpl = options.assertSummaryCopiesImpl ?? assertDesktopV3Wave1ReadinessSummaryCopies;

  return runWave1ReadinessCli({
    argv,
    buildHelpText: buildDesktopV3Wave1ReadinessHelpText,
    consoleLogImpl,
    runImpl: async () => {
      const config = resolveConfigImpl();
      const steps = buildStepsImpl(config);
      const summary = await runReadinessImpl(config, steps, {
        runPnpmStepImpl,
      });
      await assertSummaryCopiesImpl(summary, config);
      return summary;
    },
    successMessage: (summary) =>
      `desktop-v3 Wave 1 readiness passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  });
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3Wave1ReadinessCli({ argv });
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
