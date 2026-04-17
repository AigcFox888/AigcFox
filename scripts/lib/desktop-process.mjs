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

  if (!child || child.exitCode !== null) {
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
