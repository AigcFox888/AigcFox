import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { readJsonIfExists, sleep, writeJsonFile } from "./script-io.mjs";

const defaultTimeoutMs = 10 * 60 * 1000;
const defaultPollIntervalMs = 250;
const defaultStaleAfterMs = 30 * 60 * 1000;

function sanitizeLockName(lockName) {
  return lockName.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function buildLockEnvVar(lockName) {
  return `AIGCFOX_OUTPUT_LOCK_${sanitizeLockName(lockName).replace(/-/g, "_").toUpperCase()}`;
}

function buildLockPaths(rootDir, lockName) {
  const verificationDir = path.join(rootDir, "output", "verification");
  const lockDir = path.join(verificationDir, "locks", `${sanitizeLockName(lockName)}.lock`);

  return {
    lockDir,
    ownerPath: path.join(lockDir, "owner.json")
  };
}

function isLockStale(owner, staleAfterMs, nowMs) {
  if (!owner || typeof owner !== "object" || typeof owner.acquiredAt !== "string") {
    return false;
  }

  const acquiredAtMs = Date.parse(owner.acquiredAt);
  if (!Number.isFinite(acquiredAtMs)) {
    return false;
  }

  return nowMs - acquiredAtMs >= staleAfterMs;
}

function formatLockOwner(owner) {
  if (!owner || typeof owner !== "object") {
    return "unknown owner";
  }

  const parts = [];

  if (typeof owner.label === "string" && owner.label.length > 0) {
    parts.push(owner.label);
  }

  if (typeof owner.pid === "number") {
    parts.push(`pid ${owner.pid}`);
  }

  if (typeof owner.acquiredAt === "string" && owner.acquiredAt.length > 0) {
    parts.push(`acquired ${owner.acquiredAt}`);
  }

  return parts.length > 0 ? parts.join(", ") : "unknown owner";
}

export async function withOutputLock(lockName, callback, options = {}) {
  if (typeof lockName !== "string" || lockName.trim().length === 0) {
    throw new Error("Output lock name is required.");
  }

  if (typeof callback !== "function") {
    throw new Error("Output lock callback is required.");
  }

  const rootDir =
    typeof options.rootDir === "string" && options.rootDir.length > 0 ? options.rootDir : process.cwd();
  const label =
    typeof options.label === "string" && options.label.length > 0
      ? options.label
      : sanitizeLockName(lockName);
  const timeoutMs =
    typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs
      : defaultTimeoutMs;
  const pollIntervalMs =
    typeof options.pollIntervalMs === "number" &&
    Number.isFinite(options.pollIntervalMs) &&
    options.pollIntervalMs > 0
      ? options.pollIntervalMs
      : defaultPollIntervalMs;
  const staleAfterMs =
    typeof options.staleAfterMs === "number" &&
    Number.isFinite(options.staleAfterMs) &&
    options.staleAfterMs > 0
      ? options.staleAfterMs
      : defaultStaleAfterMs;
  const envVar =
    typeof options.envVar === "string" && options.envVar.length > 0
      ? options.envVar
      : buildLockEnvVar(lockName);
  const { lockDir, ownerPath } = buildLockPaths(rootDir, lockName);

  if (process.env[envVar] === "1") {
    return callback({
      envVar,
      lockDir,
      ownerPath,
      reentrant: true
    });
  }

  const startedAtMs = Date.now();
  let acquired = false;

  await fs.mkdir(path.dirname(lockDir), { recursive: true });

  while (!acquired) {
    try {
      await fs.mkdir(lockDir);
      acquired = true;
      break;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code !== "EEXIST") {
        throw error;
      }

      const nowMs = Date.now();
      const owner = await readJsonIfExists(ownerPath);

      if (isLockStale(owner, staleAfterMs, nowMs)) {
        await fs.rm(lockDir, { recursive: true, force: true });
        continue;
      }

      if (nowMs - startedAtMs >= timeoutMs) {
        throw new Error(
          `Timed out waiting for ${label} lock at ${lockDir}. Current owner: ${formatLockOwner(owner)}.`
        );
      }

      await sleep(pollIntervalMs);
    }
  }

  try {
    await writeJsonFile(ownerPath, {
      lockName: sanitizeLockName(lockName),
      label,
      pid: process.pid,
      cwd: rootDir,
      acquiredAt: new Date().toISOString()
    });
  } catch (error) {
    await fs.rm(lockDir, { recursive: true, force: true });
    throw error;
  }

  const previousEnvValue = process.env[envVar];
  process.env[envVar] = "1";

  try {
    return await callback({
      envVar,
      lockDir,
      ownerPath,
      reentrant: false
    });
  } finally {
    if (typeof previousEnvValue === "string") {
      process.env[envVar] = previousEnvValue;
    } else {
      delete process.env[envVar];
    }

    await fs.rm(lockDir, { recursive: true, force: true });
  }
}
