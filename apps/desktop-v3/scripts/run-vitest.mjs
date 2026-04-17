import { spawn } from "node:child_process";
import process from "node:process";

function resolveVitestEnv(baseEnv = process.env) {
  const env = { ...baseEnv };
  const isLinuxHost = process.platform === "linux";

  if (isLinuxHost) {
    env.TMPDIR = "/tmp";
    env.TMP = "/tmp";
    env.TEMP = "/tmp";
  }

  return env;
}

const child = spawn("pnpm", ["exec", "vitest", "run", "src"], {
  cwd: process.cwd(),
  env: resolveVitestEnv(),
  stdio: "inherit",
});

child.once("close", (code) => {
  process.exit(code ?? 1);
});

child.once("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
