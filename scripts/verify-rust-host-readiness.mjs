import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveCargoCommand, resolveVsDevCmdPath, spawnCargo } from "./lib/cargo-command.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..");
export const desktopV3ManifestPath = path.join("apps", "desktop-v3", "src-tauri", "Cargo.toml");

export function readCliValue(argv, flagName) {
  const prefix = `--${flagName}=`;
  const argument = (Array.isArray(argv) ? argv : []).find((value) => value.startsWith(prefix));
  const rawValue = argument?.slice(prefix.length)?.trim();
  return rawValue && rawValue.length > 0 ? rawValue : null;
}

function readPathOverride(argv, env, flagName, envName, defaultPath) {
  return readCliValue(argv, flagName) || env[envName]?.trim() || defaultPath;
}

export function resolveRustHostReadinessConfig(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const verificationDir = readPathOverride(
    argv,
    env,
    "verification-dir",
    "AIGCFOX_GOVERNANCE_VERIFICATION_DIR",
    path.join(rootDir, "output", "verification"),
  );

  return {
    manifestPath: options.manifestPath ?? desktopV3ManifestPath,
    rootDir: options.rootDir ?? rootDir,
    summaryPath: path.join(verificationDir, "rust-host-readiness-summary.json"),
    verificationDir,
  };
}

export function resolveFailureDetail(result, fallbackMessage) {
  return result.error ?? (result.stderr.trim() || fallbackMessage);
}

export function buildRustHostReadinessSummary(options) {
  const cargoVersion = options.cargoVersion;
  const linkerProbe = options.linkerProbe;
  const manifestPath = options.manifestPath ?? desktopV3ManifestPath;
  const platform = options.platform ?? process.platform;
  const summaryPath = options.summaryPath;
  const verificationDir = options.verificationDir;
  const vsDevCmdPath = platform === "win32" ? (options.vsDevCmdPath ?? "") : "";

  return {
    checkedAt: options.checkedAt ?? new Date().toISOString(),
    passed: cargoVersion.ok && linkerProbe.ok,
    cargo: {
      command: options.cargoCommand ?? resolveCargoCommand(),
      ok: cargoVersion.ok,
      detail: cargoVersion.ok
        ? cargoVersion.stdout.trim()
        : resolveFailureDetail(cargoVersion, "cargo command failed"),
    },
    linker: {
      ok: linkerProbe.ok,
      via:
        platform === "win32"
          ? (vsDevCmdPath ? "vsdevcmd" : "path")
          : "system",
      detail: linkerProbe.ok
        ? (
            platform === "win32"
              ? (
                  vsDevCmdPath
                    ? `Rust build probe succeeded via VsDevCmd: ${vsDevCmdPath}`
                    : "Rust build probe succeeded with current PATH linker configuration."
                )
              : `Rust build probe succeeded for ${manifestPath} on non-Windows host.`
          )
        : resolveFailureDetail(
            linkerProbe,
            platform === "win32"
              ? (
                  vsDevCmdPath
                    ? `Rust build probe failed even though VsDevCmd was found at ${vsDevCmdPath}.`
                    : `Rust build probe failed for ${manifestPath}. Install Visual Studio Build Tools with Desktop development with C++.`
                )
              : `system linker check failed for ${manifestPath}`,
          ),
      probeCommand: `cargo build --manifest-path ${manifestPath} --quiet`,
    },
    summaryPath,
    verificationDir,
  };
}

function spawnCargoCommand(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawnCargo(args, {
      cwd: options.cwd ?? rootDir,
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
        code: null,
        error: error instanceof Error ? error.message : String(error),
        ok: false,
        stderr,
        stdout,
      });
    });

    child.once("close", (code) => {
      resolve({
        code,
        error: null,
        ok: code === 0,
        stderr,
        stdout,
      });
    });
  });
}

export async function runRustHostReadinessCheck(options = {}) {
  const config = options.config ?? resolveRustHostReadinessConfig(options);
  const consoleErrorImpl = options.consoleErrorImpl ?? console.error;
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const mkdirImpl = options.mkdirImpl ?? fs.mkdir;
  const runCargoCommandImpl = options.runCargoCommandImpl ?? spawnCargoCommand;
  const writeFileImpl = options.writeFileImpl ?? fs.writeFile;
  const platform = options.platform ?? process.platform;
  const vsDevCmdPath = platform === "win32" ? (options.vsDevCmdPath ?? resolveVsDevCmdPath()) : "";

  await mkdirImpl(config.verificationDir, { recursive: true });

  const cargoVersion = await runCargoCommandImpl(["--version"], { cwd: config.rootDir });
  const linkerProbe =
    cargoVersion.ok
      ? await runCargoCommandImpl(
          ["build", "--manifest-path", config.manifestPath, "--quiet"],
          { cwd: config.rootDir },
        )
      : {
          code: null,
          error: "cargo unavailable",
          ok: false,
          stderr: "",
          stdout: "",
        };

  const summary = buildRustHostReadinessSummary({
    cargoCommand: options.cargoCommand ?? resolveCargoCommand(),
    cargoVersion,
    checkedAt: options.checkedAt,
    linkerProbe,
    manifestPath: config.manifestPath,
    platform,
    summaryPath: config.summaryPath,
    verificationDir: config.verificationDir,
    vsDevCmdPath,
  });

  await writeFileImpl(config.summaryPath, JSON.stringify(summary, null, 2), "utf8");

  if (!summary.passed) {
    consoleErrorImpl(
      [
        "Rust host readiness check failed.",
        `Cargo: ${summary.cargo.ok ? "ok" : "missing"}.`,
        `Linker: ${summary.linker.ok ? "ok" : "missing"}.`,
        `Summary: ${config.summaryPath}`,
      ].join(" "),
    );
    return summary;
  }

  consoleLogImpl(`Rust host readiness check passed. Summary: ${config.summaryPath}`);
  return summary;
}

export async function main(argv = process.argv.slice(2)) {
  const summary = await runRustHostReadinessCheck({ argv });
  process.exitCode = summary.passed ? 0 : 1;
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
