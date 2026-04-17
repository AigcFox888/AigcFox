import { spawn } from "node:child_process";
import process from "node:process";

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function runCommandCapture(file, args, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    stdio = ["ignore", "pipe", "pipe"],
    windowsHide = true
  } = options;

  return new Promise((resolve) => {
    const child = spawn(file, args, {
      cwd,
      env,
      stdio,
      windowsHide
    });
    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.once("error", (error) => {
      resolve({
        ok: false,
        code: null,
        stdout: normalizeText(stdout),
        stderr: error instanceof Error ? error.message : String(error)
      });
    });

    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout: normalizeText(stdout),
        stderr: normalizeText(stderr)
      });
    });
  });
}

export function runCommandOrThrow(file, args, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    stdio = "inherit",
    windowsHide = true,
    buildError
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd,
      env,
      stdio,
      windowsHide
    });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      const message =
        typeof buildError === "function"
          ? buildError(code)
          : typeof buildError === "string"
            ? buildError
            : `${file} ${args.join(" ")} failed with exit code ${code ?? "unknown"}.`;

      reject(new Error(message));
    });
  });
}

export function runCommandExitCode(file, args, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    logStream = null,
    stdio = logStream ? ["ignore", "pipe", "pipe"] : "ignore",
    timeoutMs = 0,
    windowsHide = true
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd,
      env,
      stdio,
      windowsHide
    });
    let settled = false;
    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            if (settled) {
              return;
            }

            settled = true;
            child.kill();
            reject(new Error(`${file} timed out after ${timeoutMs} ms.`));
          }, timeoutMs)
        : null;

    child.once("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timer) {
        clearTimeout(timer);
      }

      reject(error);
    });

    child.once("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timer) {
        clearTimeout(timer);
      }

      resolve(code ?? 0);
    });

    if (logStream && child.stdout && child.stderr) {
      child.stdout.pipe(logStream, { end: false });
      child.stderr.pipe(logStream, { end: false });
    }
  });
}
