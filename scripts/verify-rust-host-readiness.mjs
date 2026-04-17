import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { resolveCargoCommand, resolveVsDevCmdPath, spawnCargo } from "./lib/cargo-command.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const readCliValue = (flagName) => {
  const prefix = `--${flagName}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  const rawValue = argument?.slice(prefix.length)?.trim();
  return rawValue && rawValue.length > 0 ? rawValue : null;
};
const readPathOverride = (flagName, envName, defaultPath) =>
  readCliValue(flagName) || process.env[envName]?.trim() || defaultPath;
const verificationDir = readPathOverride(
  "verification-dir",
  "AIGCFOX_GOVERNANCE_VERIFICATION_DIR",
  path.join(rootDir, "output", "verification")
);
const summaryPath = path.join(verificationDir, "rust-host-readiness-summary.json");

const runCommand = async (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.once("error", (error) => {
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
        error: null,
      });
    });
  });

const runCargoCommand = async (args) =>
  new Promise((resolve) => {
    const child = spawnCargo(args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.once("error", (error) => {
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
        error: null,
      });
    });
  });

const resolveFailureDetail = (result, fallbackMessage) => {
  return result.error ?? (result.stderr.trim() || fallbackMessage);
};

const verifyRustHostReadiness = async () => {
  await fs.mkdir(verificationDir, { recursive: true });

  const cargoVersion = await runCargoCommand(["--version"]);
  const vsDevCmdPath = process.platform === "win32" ? resolveVsDevCmdPath() : "";
  const linkerProbe =
    cargoVersion.ok
      ? await runCargoCommand(["build", "-p", "local-agent", "--quiet"])
      : {
          ok: false,
          code: null,
          stdout: "",
          stderr: "",
          error: "cargo unavailable",
        };

  const summary = {
    checkedAt: new Date().toISOString(),
    passed: cargoVersion.ok && linkerProbe.ok,
    cargo: {
      command: resolveCargoCommand(),
      ok: cargoVersion.ok,
      detail: cargoVersion.ok
        ? cargoVersion.stdout.trim()
        : resolveFailureDetail(cargoVersion, "cargo command failed"),
    },
    linker: {
      ok: linkerProbe.ok,
      via:
        process.platform === "win32"
          ? (vsDevCmdPath ? "vsdevcmd" : "path")
          : "system",
      detail: linkerProbe.ok
        ? (
            process.platform === "win32"
              ? (
                  vsDevCmdPath
                    ? `Rust build probe succeeded via VsDevCmd: ${vsDevCmdPath}`
                    : "Rust build probe succeeded with current PATH linker configuration."
                )
              : "Rust build probe succeeded on non-Windows host."
          )
        : resolveFailureDetail(
            linkerProbe,
            process.platform === "win32"
              ? (
                  vsDevCmdPath
                    ? `Rust build probe failed even though VsDevCmd was found at ${vsDevCmdPath}.`
                    : "Rust build probe failed. Install Visual Studio Build Tools with Desktop development with C++."
                )
              : "system linker check failed"
          ),
      probeCommand: `cargo build -p local-agent --quiet`,
    },
  };

  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  if (!summary.passed) {
    console.error(
      [
        "Rust host readiness check failed.",
        `Cargo: ${summary.cargo.ok ? "ok" : "missing"}.`,
        `Linker: ${summary.linker.ok ? "ok" : "missing"}.`,
        `Summary: ${summaryPath}`,
      ].join(" "),
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Rust host readiness check passed. Summary: ${summaryPath}`);
};

await verifyRustHostReadiness();
