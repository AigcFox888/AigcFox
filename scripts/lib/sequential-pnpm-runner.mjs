import process from "node:process";

import { formatPnpmCommand, runPnpm, runPnpmDirect } from "./pnpm-command.mjs";

export function formatSequentialPnpmCommands(steps) {
  return steps.map((step) => formatPnpmCommand(step.args)).join(" -> ");
}

export async function runSequentialPnpmSteps(steps, options = {}) {
  const runPnpmImpl =
    typeof options.runPnpmImpl === "function"
      ? options.runPnpmImpl
      : process.platform === "win32"
        ? runPnpmDirect
        : runPnpm;
  const env = options.env ?? process.env;
  const onStepResult =
    typeof options.onStepResult === "function" ? options.onStepResult : null;
  const stdio = options.stdio ?? "inherit";

  for (const step of steps) {
    const result = await runPnpmImpl(step.args, {
      cwd: options.cwd,
      env,
      stdio
    });

    if (onStepResult) {
      await onStepResult(step, result);
    }

    if (!result.ok) {
      throw new Error(result.error ?? `${formatPnpmCommand(step.args)} failed.`);
    }
  }
}
