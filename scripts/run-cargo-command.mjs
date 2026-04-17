import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { resolveCargoCommand, spawnCargo } from "./lib/cargo-command.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Cargo command arguments are required.");
  process.exitCode = 1;
} else {
  const child = spawnCargo(args, {
    cwd: rootDir,
    stdio: "inherit"
  });

  child.once("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start ${resolveCargoCommand()}: ${message}`);
    process.exitCode = 1;
  });

  child.once("close", (code) => {
    process.exitCode = code ?? 1;
  });
}
