import fs from "node:fs";
import fsPromises from "node:fs/promises";
import process from "node:process";

import { runPnpmOrThrow, spawnPnpm } from "./pnpm-command.mjs";
import { sleep } from "./script-io.mjs";

async function isPreviewReady(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      headers: {
        accept: "text/html",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitForPreviewReady(baseUrl, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isPreviewReady(baseUrl)) {
      return;
    }

    await sleep(250);
  }

  throw new Error(`Timed out while waiting for desktop-v3 preview at ${baseUrl}.`);
}

function waitForExit(child, signal = "SIGTERM") {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill("SIGKILL");
      resolve();
    }, 5_000);

    child.once("close", () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      resolve();
    });

    child.kill(signal);
  });
}

export async function startDesktopV3PreviewServer(config) {
  await fsPromises.mkdir(config.outputDir, { recursive: true });

  const previewLogStream = fs.createWriteStream(config.previewLogPath, {
    flags: "a",
  });
  const smokeEnv = {
    ...process.env,
    VITE_DESKTOP_V3_RUNTIME_MODE: process.env.VITE_DESKTOP_V3_RUNTIME_MODE ?? "mock",
  };

  await runPnpmOrThrow(["--filter", "@aigcfox/desktop-v3", "build"], {
    cwd: config.rootDir,
    env: smokeEnv,
    stdio: "inherit",
  });

  const child = spawnPnpm(["--filter", "@aigcfox/desktop-v3", "preview"], {
    cwd: config.rootDir,
    env: smokeEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.pipe(previewLogStream);
  child.stderr?.pipe(previewLogStream);

  try {
    await waitForPreviewReady(config.baseUrl, config.previewTimeoutMs);
  } catch (error) {
    await waitForExit(child);
    previewLogStream.end();
    throw error;
  }

  return {
    child,
    previewLogStream,
  };
}

export async function stopDesktopV3PreviewServer(serverHandle) {
  if (!serverHandle) {
    return;
  }

  serverHandle.child.stdout?.unpipe(serverHandle.previewLogStream);
  serverHandle.child.stderr?.unpipe(serverHandle.previewLogStream);
  await waitForExit(serverHandle.child);
  await new Promise((resolve) => {
    serverHandle.previewLogStream.end(resolve);
  });
}
