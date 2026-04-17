import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const cargoExecutable = process.platform === "win32" ? "cargo.exe" : "cargo";
const powershellExecutable = process.platform === "win32" ? "powershell.exe" : "sh";

function resolveCargoHomeBinDir() {
  const explicitCargoHome = process.env.CARGO_HOME?.trim();
  if (explicitCargoHome) {
    return path.join(explicitCargoHome, "bin");
  }

  const homeDir =
    process.env.USERPROFILE?.trim() ||
    process.env.HOME?.trim() ||
    "";

  return homeDir ? path.join(homeDir, ".cargo", "bin") : "";
}

export function resolveCargoCommand() {
  const cargoHomeBinDir = resolveCargoHomeBinDir();
  const preferredCommand = cargoHomeBinDir
    ? path.join(cargoHomeBinDir, cargoExecutable)
    : cargoExecutable;

  return existsSync(preferredCommand) ? preferredCommand : cargoExecutable;
}

export function resolveVsDevCmdPath() {
  if (process.platform !== "win32") {
    return "";
  }

  const programFilesX86 = process.env["ProgramFiles(x86)"]?.trim();
  if (!programFilesX86) {
    return "";
  }

  const candidate = path.join(
    programFilesX86,
    "Microsoft Visual Studio",
    "2022",
    "BuildTools",
    "Common7",
    "Tools",
    "VsDevCmd.bat"
  );

  return existsSync(candidate) ? candidate : "";
}

export function buildCargoEnv(baseEnv = process.env) {
  const env = { ...baseEnv };
  const cargoHomeBinDir = resolveCargoHomeBinDir();

  if (!cargoHomeBinDir) {
    return env;
  }

  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const existingPath = env[pathKey] ?? env.PATH ?? "";
  env[pathKey] = existingPath
    ? `${cargoHomeBinDir}${path.delimiter}${existingPath}`
    : cargoHomeBinDir;
  env.PATH = env[pathKey];

  return env;
}

export function spawnCargo(args, options = {}) {
  const {
    cwd = process.cwd(),
    stdio = "inherit",
    env = process.env,
    windowsHide = true
  } = options;

  const cargoCommand = resolveCargoCommand();
  const nextEnv = buildCargoEnv(env);
  const vsDevCmdPath = resolveVsDevCmdPath();

  if (process.platform === "win32" && vsDevCmdPath) {
    const quoteCmdArg = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const commandLine = `cmd.exe /d /c 'call "${vsDevCmdPath}" -arch=x64 -host_arch=x64 >nul && "${cargoCommand}" ${args
      .map(quoteCmdArg)
      .join(" ")}'`;

    return spawn(
      powershellExecutable,
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", commandLine],
      {
        cwd,
        env: nextEnv,
        stdio,
        windowsHide
      }
    );
  }

  return spawn(cargoCommand, args, {
    cwd,
    env: nextEnv,
    stdio,
    windowsHide
  });
}
