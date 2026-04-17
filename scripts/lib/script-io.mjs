import fs from "node:fs/promises";
import path from "node:path";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function statIfExists(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

export async function readJsonFile(targetPath) {
  return JSON.parse(await fs.readFile(targetPath, "utf8"));
}

export async function readJsonIfExists(targetPath, options = {}) {
  if (!(await pathExists(targetPath))) {
    return null;
  }

  try {
    return await readJsonFile(targetPath);
  } catch (error) {
    if (options.throwOnInvalidJson === true) {
      throw error;
    }

    return null;
  }
}

export async function waitForPathState(targetPath, shouldExist, options = {}) {
  const {
    timeoutMs = 10000,
    intervalMs = 250,
    buildTimeoutError
  } = options;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const exists = await pathExists(targetPath);
    if (exists === shouldExist) {
      return exists;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    typeof buildTimeoutError === "function"
      ? buildTimeoutError(targetPath, shouldExist)
      : `${shouldExist ? "Timed out waiting for file creation" : "Timed out waiting for file removal"}: ${targetPath}`
  );
}

function isRetriableRemoveError(error) {
  return (
    error instanceof Error &&
    typeof error.code === "string" &&
    (error.code === "EBUSY" || error.code === "EPERM" || error.code === "ENOTEMPTY")
  );
}

export async function removePathWithRetry(targetPath, options = {}) {
  const {
    attempts = 8,
    delayMs = 400,
    ...rmOptions
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fs.rm(targetPath, rmOptions);
      return;
    } catch (error) {
      lastError = error;

      if (!isRetriableRemoveError(error) || attempt === attempts) {
        throw error;
      }

      await sleep(delayMs);
    }
  }

  if (lastError) {
    throw lastError;
  }
}

export async function resetTempPaths(primaryDirPath, options = {}) {
  const { clearPaths = [] } = options;

  await removePathWithRetry(primaryDirPath, { recursive: true, force: true });
  await fs.mkdir(primaryDirPath, { recursive: true });

  for (const targetPath of clearPaths) {
    await removePathWithRetry(targetPath, { force: true });
  }
}

export async function writeJsonFile(targetPath, value, options = {}) {
  const nextValue = typeof options.transform === "function" ? options.transform(value) : value;
  const trailingNewline = options.trailingNewline !== false;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(
    targetPath,
    `${JSON.stringify(nextValue, null, 2)}${trailingNewline ? "\n" : ""}`,
    "utf8"
  );
}

export async function writeTextFile(targetPath, value, options = {}) {
  const trailingNewline = options.trailingNewline !== false;
  const utf8Bom = options.utf8Bom === true;
  const nextValue = typeof value === "string" ? value : String(value ?? "");
  const normalizedValue = utf8Bom ? `\uFEFF${nextValue.replace(/^\uFEFF/, "")}` : nextValue;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${normalizedValue}${trailingNewline ? "\n" : ""}`, "utf8");
}
