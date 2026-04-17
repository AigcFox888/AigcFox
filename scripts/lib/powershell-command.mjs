import process from "node:process";

import { runCommandCapture } from "./process-command.mjs";

export async function runPowerShell(script, options = {}) {
  if (process.platform !== "win32") {
    return null;
  }

  const { cwd = process.cwd(), env = process.env } = options;
  const result = await runCommandCapture(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  if (result.ok) {
    return result.stdout;
  }

  throw new Error(result.stderr || `PowerShell exited with code ${result.code ?? "unknown"}.`);
}
