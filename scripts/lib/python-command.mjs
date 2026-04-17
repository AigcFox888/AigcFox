import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");

function appendCandidate(candidates, command, prefixArgs = []) {
  if (typeof command !== "string" || command.trim().length === 0) {
    return;
  }

  candidates.push({
    command,
    prefixArgs
  });
}

function isRunnablePythonCommand(command, prefixArgs = []) {
  if (typeof command !== "string" || command.trim().length === 0) {
    return false;
  }

  try {
    const result = spawnSync(command, [...prefixArgs, "--version"], {
      stdio: "ignore",
      windowsHide: true
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

function buildVirtualEnvPythonPath(venvRoot, platform = process.platform) {
  if (typeof venvRoot !== "string" || venvRoot.trim().length === 0) {
    return null;
  }

  return platform === "win32"
    ? path.join(venvRoot, "Scripts", "python.exe")
    : path.join(venvRoot, "bin", "python");
}

export function listProjectPythonCandidates(options = {}) {
  const platform = options.platform ?? process.platform;
  const projectRoot = options.rootDir ?? rootDir;
  const existsSyncImpl = options.existsSyncImpl ?? existsSync;
  const candidates = [];

  for (const relativeDir of [".venv", "venv", path.join("server", ".venv"), path.join("server", "venv")]) {
    const candidatePath = buildVirtualEnvPythonPath(path.join(projectRoot, relativeDir), platform);
    if (candidatePath && existsSyncImpl(candidatePath)) {
      appendCandidate(candidates, candidatePath);
    }
  }

  return candidates;
}

export function buildPythonCandidates(options = {}) {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const projectRoot = options.rootDir ?? rootDir;
  const existsSyncImpl = options.existsSyncImpl ?? existsSync;
  const candidates = [];

  appendCandidate(candidates, env.PYTHON);
  candidates.push(...listProjectPythonCandidates({ platform, rootDir: projectRoot, existsSyncImpl }));

  if (platform === "win32") {
    appendCandidate(candidates, "python");
    appendCandidate(candidates, "py", ["-3"]);

    const localAppData = env.LOCALAPPDATA?.trim();
    if (localAppData) {
      for (const versionDir of ["Python312", "Python311", "Python310", "Python39"]) {
        const candidatePath = path.join(localAppData, "Programs", "Python", versionDir, "python.exe");
        if (existsSyncImpl(candidatePath)) {
          appendCandidate(candidates, candidatePath);
        }
      }
    }
  } else {
    appendCandidate(candidates, "python3");
    appendCandidate(candidates, "python");
  }

  return candidates;
}

export function resolvePythonLauncher(options = {}) {
  for (const candidate of buildPythonCandidates(options)) {
    if (isRunnablePythonCommand(candidate.command, candidate.prefixArgs)) {
      return candidate;
    }
  }

  return {
    command: (options.platform ?? process.platform) === "win32" ? "python" : "python3",
    prefixArgs: []
  };
}

const pythonLauncher = resolvePythonLauncher();

export const pythonCommand = pythonLauncher.command;
export const pythonCommandArgs = pythonLauncher.prefixArgs;

export function spawnPython(args, options = {}) {
  const { env, ...spawnOptions } = options;

  return spawn(pythonCommand, [...pythonCommandArgs, ...args], {
    env: {
      ...process.env,
      PYTHONIOENCODING: process.env.PYTHONIOENCODING ?? "utf-8",
      PYTHONUTF8: process.env.PYTHONUTF8 ?? "1",
      ...(env ?? {})
    },
    windowsHide: true,
    ...spawnOptions
  });
}

export function runPython(args, options = {}) {
  const { capture = false, ...spawnOptions } = options;

  return new Promise((resolve) => {
    const child = spawnPython(args, {
      ...spawnOptions,
      stdio: capture ? ["ignore", "pipe", "pipe"] : spawnOptions.stdio ?? "inherit"
    });

    let stdout = "";
    let stderr = "";

    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.once("error", (error) => {
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error)
      });
    });

    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
        error:
          code === 0 ? null : `${pythonCommand} ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`
      });
    });
  });
}
