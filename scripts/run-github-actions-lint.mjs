import { spawn } from "node:child_process";

import { resolveGithubActionsLintConfig } from "./lib/github-actions-lint.mjs";

const config = resolveGithubActionsLintConfig();
const child = spawn(config.command, config.args, {
  cwd: config.cwd,
  env: config.env,
  stdio: "inherit",
});

child.once("close", (code) => {
  process.exit(code ?? 1);
});

child.once("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
