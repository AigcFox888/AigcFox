import process from "node:process";

import { runPnpmOrThrow } from "./pnpm-command.mjs";

export function runDesktopPnpm(args, options = {}) {
  const { desktopDir, extraEnv = {} } = options;

  return runPnpmOrThrow(args, {
    cwd: desktopDir,
    env: {
      ...process.env,
      ...extraEnv
    },
    stdio: "inherit"
  });
}
