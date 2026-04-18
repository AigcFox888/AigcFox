import fsp from "node:fs/promises";
import path from "node:path";

import { desktopV3ActiveDocCoverageTargets } from "./desktop-v3-active-docs-coverage.mjs";

export const desktopV3CommandSurfaceFiles = Array.from(
  new Set([
    "README.md",
    "apps/desktop-v3/README.md",
    ...desktopV3ActiveDocCoverageTargets,
    ".github/workflows/desktop-v3-ci.yml",
    ".github/workflows/desktop-v3-package.yml",
  ]),
).sort((left, right) => left.localeCompare(right));

export const desktopV3AllowedSupportingCommands = [
  "pnpm dev:desktop-v3",
  "pnpm --filter @aigcfox/desktop-v3 build",
  "pnpm --filter @aigcfox/desktop-v3 lint",
  "pnpm --filter @aigcfox/desktop-v3 tauri build",
  "pnpm --filter @aigcfox/desktop-v3 tauri build --ci --no-sign",
  "pnpm --filter @aigcfox/desktop-v3 tauri build --ci --no-sign --bundles msi",
  "pnpm --filter @aigcfox/desktop-v3 tauri dev",
  "pnpm --filter @aigcfox/desktop-v3 test",
  "pnpm --filter @aigcfox/desktop-v3 typecheck",
  "pnpm exec playwright install --with-deps chromium",
  "pnpm install --frozen-lockfile",
].sort((left, right) => left.localeCompare(right));

function normalizeQuotedValue(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function trimCommandPunctuation(value) {
  return value.replace(/[；。，“”、，]+$/gu, "").trim();
}

export function normalizePnpmCommandMention(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = trimCommandPunctuation(normalizeQuotedValue(value.trim())).replace(/\s+/g, " ");

  if (!normalized.startsWith("pnpm ")) {
    return null;
  }

  const secondToken = normalized.split(" ")[1] ?? "";

  if (
    secondToken.length === 0 ||
    secondToken === "=" ||
    /^[<>]=?$/.test(secondToken) ||
    /^[<>]/.test(secondToken)
  ) {
    return null;
  }

  return normalized;
}

function appendCommand(commands, seen, rawValue) {
  const normalized = normalizePnpmCommandMention(rawValue);

  if (!normalized || seen.has(normalized)) {
    return;
  }

  seen.add(normalized);
  commands.push(normalized);
}

export function extractPnpmCommandMentions(text) {
  const commands = [];
  const seen = new Set();

  for (const match of text.matchAll(/`(pnpm [^`\r\n]+)`/g)) {
    appendCommand(commands, seen, match[1]);
  }

  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (trimmed.startsWith("pnpm ")) {
      appendCommand(commands, seen, trimmed);
      continue;
    }

    if (trimmed.startsWith("run:")) {
      appendCommand(commands, seen, trimmed.slice("run:".length).trim());
      continue;
    }

    if (trimmed.startsWith("build_command:")) {
      appendCommand(commands, seen, trimmed.slice("build_command:".length).trim());
    }
  }

  return commands.sort((left, right) => left.localeCompare(right));
}

export function getPnpmRootScriptName(command) {
  const normalized = normalizePnpmCommandMention(command);

  if (!normalized) {
    return null;
  }

  const secondToken = normalized.split(" ")[1] ?? "";
  return /^(qa:|test:)/.test(secondToken) ? secondToken : null;
}

export async function collectDesktopV3CommandMentions(rootDir, options = {}) {
  const readFileImpl =
    typeof options.readFileImpl === "function" ? options.readFileImpl : fsp.readFile;
  const filePaths = Array.isArray(options.filePaths)
    ? options.filePaths
    : desktopV3CommandSurfaceFiles;
  const files = [];
  const commandFiles = new Map();

  for (const relativePath of filePaths) {
    const absolutePath = path.join(rootDir, relativePath);
    const text = await readFileImpl(absolutePath, "utf8");
    const commands = extractPnpmCommandMentions(text);

    files.push({
      relativePath,
      commands,
    });

    for (const command of commands) {
      const fileSet = commandFiles.get(command) ?? new Set();
      fileSet.add(relativePath);
      commandFiles.set(command, fileSet);
    }
  }

  return {
    files: files.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    commands: Array.from(commandFiles.entries())
      .map(([command, filePathsForCommand]) => ({
        command,
        filePaths: Array.from(filePathsForCommand).sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => left.command.localeCompare(right.command)),
  };
}
