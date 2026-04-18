import fsPromises from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

export async function closeWritableStream(stream) {
  if (!stream) {
    return;
  }

  await new Promise((resolve) => stream.end(resolve));
}

export async function terminateChildProcess(child, options = {}) {
  const {
    useWindowsTaskkillTree = true,
    useUnixProcessGroup = false,
    waitForCloseTimeoutMs = process.platform === "win32" ? 0 : 5000,
    forceKillOnTimeout = false,
    signal = "SIGTERM"
  } = options;

  const canTargetDescendants =
    Boolean(child?.pid) &&
    ((process.platform === "win32" && useWindowsTaskkillTree) || useUnixProcessGroup);

  // Dev commands can exit their immediate parent before the spawned server tree is gone.
  if (!child || (child.exitCode !== null && !canTargetDescendants)) {
    return;
  }

  if (process.platform === "win32" && useWindowsTaskkillTree && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true
      });

      killer.once("error", () => resolve(undefined));
      killer.once("close", () => resolve(undefined));
    });
  } else {
    if (useUnixProcessGroup && child.pid) {
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    } else {
      child.kill(signal);
    }
  }

  if (waitForCloseTimeoutMs <= 0 || child.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (forceKillOnTimeout && child.exitCode === null) {
        if (useUnixProcessGroup && child.pid) {
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
        } else {
          child.kill("SIGKILL");
        }
      }
      resolve(undefined);
    }, waitForCloseTimeoutMs);

    child.once("close", () => {
      clearTimeout(timer);
      resolve(undefined);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function captureCommandOutput(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
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
        error,
        stderr,
        stdout,
      });
    });
    child.once("close", (code) => {
      resolve({
        code,
        stderr,
        stdout,
      });
    });
  });
}

function parseListeningProcessIds(output) {
  return [...new Set(
    output
      .split(/\s+/u)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 1),
  )];
}

async function readProcCommand(pid, readFileImpl) {
  const procPath = `/proc/${pid}/cmdline`;

  try {
    const content = await readFileImpl(procPath, "utf8");
    return content.replaceAll("\u0000", " ").trim();
  } catch {
    return "";
  }
}

async function readProcStat(pid, readFileImpl) {
  const procPath = `/proc/${pid}/stat`;

  try {
    const content = await readFileImpl(procPath, "utf8");
    const closingParenIndex = content.lastIndexOf(")");

    if (closingParenIndex < 0) {
      return null;
    }

    const fields = content.slice(closingParenIndex + 2).trim().split(/\s+/u);
    const ppid = Number.parseInt(fields[1] ?? "", 10);
    const pgid = Number.parseInt(fields[2] ?? "", 10);

    if (!Number.isInteger(ppid) || !Number.isInteger(pgid)) {
      return null;
    }

    return { pgid, ppid };
  } catch {
    return null;
  }
}

export async function findDesktopV3MockDevServerConflict(rootDir, options = {}) {
  const captureCommandOutputImpl = options.captureCommandOutputImpl ?? captureCommandOutput;
  const readFileImpl = options.readFileImpl ?? fsPromises.readFile;
  const port = options.port ?? 31420;
  const expectedViteEntrypoint = path
    .join(rootDir, "apps", "desktop-v3", "node_modules", ".bin", "..", "vite", "bin", "vite.js")
    .replaceAll(path.sep, "/");
  const listenerResult = await captureCommandOutputImpl("lsof", [
    `-tiTCP:${port}`,
    "-sTCP:LISTEN",
  ]);

  for (const listenerPid of parseListeningProcessIds(listenerResult.stdout ?? "")) {
    const listenerCommand = await readProcCommand(listenerPid, readFileImpl);

    if (
      !listenerCommand.includes(expectedViteEntrypoint)
      || !listenerCommand.includes(`--host 127.0.0.1 --port ${port}`)
    ) {
      continue;
    }

    let currentPid = listenerPid;

    while (currentPid > 1) {
      const currentCommand = await readProcCommand(currentPid, readFileImpl);
      const currentStat = await readProcStat(currentPid, readFileImpl);

      if (!currentStat) {
        break;
      }

      if (currentCommand.includes("pnpm dev:desktop-v3")) {
        return {
          listenerPid,
          ownerPid: currentPid,
          pgid: currentStat.pgid,
          port,
        };
      }

      if (currentStat.ppid <= 1 || currentStat.ppid === currentPid) {
        break;
      }

      currentPid = currentStat.ppid;
    }
  }

  return null;
}

export async function terminateDesktopV3MockDevServerConflict(rootDir, options = {}) {
  const findConflictImpl = options.findConflictImpl ?? findDesktopV3MockDevServerConflict;
  const sleepImpl = options.sleepImpl ?? sleep;
  const waitForExitTimeoutMs = options.waitForExitTimeoutMs ?? 5_000;
  const signal = options.signal ?? "SIGTERM";
  const conflict = await findConflictImpl(rootDir, options);

  if (!conflict) {
    return null;
  }

  try {
    process.kill(-conflict.pgid, signal);
  } catch {
    return conflict;
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < waitForExitTimeoutMs) {
    const remainingConflict = await findConflictImpl(rootDir, options);

    if (!remainingConflict) {
      return conflict;
    }

    await sleepImpl(100);
  }

  try {
    process.kill(-conflict.pgid, "SIGKILL");
  } catch {
    return conflict;
  }

  return conflict;
}
