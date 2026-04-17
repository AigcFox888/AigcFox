import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function resolveVitestArgs(argv = process.argv.slice(2)) {
  return argv.length > 0 ? argv : ["run"];
}

function resolveVitestEnv(baseEnv = process.env) {
  const env = { ...baseEnv };

  if (process.platform === "linux") {
    env.TMPDIR = "/tmp";
    env.TMP = "/tmp";
    env.TEMP = "/tmp";
  }

  return env;
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const vitestEntrypoint = path.join(rootDir, "node_modules", "vitest", "vitest.mjs");

const child = spawn(process.execPath, [vitestEntrypoint, ...resolveVitestArgs()], {
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
