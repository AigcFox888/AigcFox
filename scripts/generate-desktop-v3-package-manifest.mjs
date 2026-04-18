import console from "node:console";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { calculateSha256, writeSha256ChecksumsFile } from "./lib/file-checksum.mjs";
import { writeJsonFile, writeTextFile } from "./lib/script-io.mjs";

export const desktopV3FirstInstallPackageExtensions = Object.freeze({
  windows: Object.freeze([".msi"]),
  macos: Object.freeze([".dmg"]),
});

function normalizeForDisplay(targetPath) {
  return targetPath.split(path.sep).join("/");
}

export function normalizeDesktopV3PackagePlatform(value) {
  const normalizedValue = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalizedValue === "windows" || normalizedValue === "macos") {
    return normalizedValue;
  }

  throw new Error(
    `Unsupported desktop-v3 package platform: ${String(value ?? "")}. Expected one of: windows, macos.`
  );
}

async function listFilesRecursive(targetDir, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const discoveredFiles = [];

  async function walk(currentDir) {
    const entries = await readdirImpl(currentDir, { withFileTypes: true });
    const sortedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of sortedEntries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile()) {
        discoveredFiles.push(fullPath);
      }
    }
  }

  await walk(targetDir);
  return discoveredFiles;
}

export async function collectDesktopV3FirstInstallPackages(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const platform = normalizeDesktopV3PackagePlatform(options.platform);
  const bundleDir = path.resolve(cwd, options.bundleDir ?? "apps/desktop-v3/src-tauri/target/release/bundle");
  const calculateSha256Impl = options.calculateSha256Impl ?? calculateSha256;
  const statImpl = options.statImpl ?? fs.stat;
  const allowedExtensions = new Set(desktopV3FirstInstallPackageExtensions[platform]);
  const discoveredFiles = await listFilesRecursive(bundleDir, {
    readdirImpl: options.readdirImpl,
  });

  const packageFiles = discoveredFiles
    .filter((filePath) => allowedExtensions.has(path.extname(filePath).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));

  if (packageFiles.length === 0) {
    throw new Error(
      `No first-install package files found for ${platform} under ${normalizeForDisplay(path.relative(cwd, bundleDir) || bundleDir)}.`
    );
  }

  const packages = [];

  for (const filePath of packageFiles) {
    const stats = await statImpl(filePath);
    const relativePath = normalizeForDisplay(path.relative(bundleDir, filePath));
    const workspacePath = normalizeForDisplay(path.relative(cwd, filePath));
    const sha256 = await calculateSha256Impl(filePath);

    packages.push({
      distributionRole: "first-install-package",
      fileName: path.basename(filePath),
      filePath,
      relativePath,
      sha256,
      sizeBytes: stats.size,
      workspacePath,
    });
  }

  return packages;
}

export async function generateDesktopV3PackageManifest(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const platform = normalizeDesktopV3PackagePlatform(options.platform);
  const bundleDir = path.resolve(cwd, options.bundleDir ?? "apps/desktop-v3/src-tauri/target/release/bundle");
  const outputDir = path.resolve(
    cwd,
    options.outputDir ?? `apps/desktop-v3/src-tauri/target/release/package-manifest/${platform}`
  );
  const artifactPathsFile = options.artifactPathsFile
    ? path.resolve(cwd, options.artifactPathsFile)
    : path.join(outputDir, "artifact-paths.txt");
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const packages = await collectDesktopV3FirstInstallPackages({
    bundleDir,
    calculateSha256Impl: options.calculateSha256Impl,
    cwd,
    platform,
    readdirImpl: options.readdirImpl,
    statImpl: options.statImpl,
  });
  const manifestPath = path.join(outputDir, "release-manifest.json");
  const checksumsPath = path.join(outputDir, "SHA256SUMS.txt");
  const writeJsonFileImpl = options.writeJsonFileImpl ?? writeJsonFile;
  const writeSha256ChecksumsFileImpl = options.writeSha256ChecksumsFileImpl ?? writeSha256ChecksumsFile;
  const writeTextFileImpl = options.writeTextFileImpl ?? writeTextFile;
  const manifest = {
    schemaVersion: 1,
    platform,
    firstInstallOnly: true,
    distributionMode: "maintainer-download-then-upload",
    bundleDir: normalizeForDisplay(path.relative(cwd, bundleDir)),
    outputDir: normalizeForDisplay(path.relative(cwd, outputDir)),
    generatedAt,
    packageCount: packages.length,
    packages: packages.map((entry) => ({
      distributionRole: entry.distributionRole,
      fileName: entry.fileName,
      relativePath: entry.relativePath,
      workspacePath: entry.workspacePath,
      sizeBytes: entry.sizeBytes,
      sha256: entry.sha256,
    })),
  };
  const artifactPaths = [
    ...packages.map((entry) => entry.workspacePath),
    normalizeForDisplay(path.relative(cwd, manifestPath)),
    normalizeForDisplay(path.relative(cwd, checksumsPath)),
  ];

  await writeJsonFileImpl(manifestPath, manifest);
  await writeSha256ChecksumsFileImpl(
    checksumsPath,
    packages.map((entry) => ({
      path: entry.relativePath,
      sha256: entry.sha256,
    }))
  );
  await writeTextFileImpl(artifactPathsFile, artifactPaths.join("\n"));

  return {
    artifactPaths,
    artifactPathsFile,
    bundleDir,
    checksumsPath,
    manifest,
    manifestPath,
    outputDir,
    packages,
    platform,
  };
}

function readCliValue(argv, flagName) {
  const prefix = `--${flagName}=`;
  const argument = argv.find((entry) => entry.startsWith(prefix));
  const rawValue = argument?.slice(prefix.length)?.trim();

  return rawValue && rawValue.length > 0 ? rawValue : null;
}

export function buildDesktopV3PackageManifestHelpText() {
  return [
    "desktop-v3 first-install package manifest generator",
    "",
    "Generates release-manifest.json and SHA256SUMS.txt for the GitHub Actions first-install artifacts.",
    "",
    "Options:",
    "  --platform=windows|macos        Target packaging platform.",
    "  --bundle-dir=<path>             Bundle directory to scan. Defaults to apps/desktop-v3/src-tauri/target/release/bundle.",
    "  --output-dir=<path>             Output directory for release-manifest.json and SHA256SUMS.txt.",
    "  --artifact-paths-file=<path>    Output file listing the exact artifact paths to upload.",
    "",
    "Notes:",
    "  Windows first-install packages are restricted to .msi outputs.",
    "  macOS first-install packages are restricted to .dmg outputs.",
    "  The generated artifact set is intended for maintainer retrieval and later upload to Qiniu Kodo or a self-hosted HTTPS origin.",
  ].join("\n");
}

export async function runDesktopV3PackageManifestCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const consoleLogImpl = options.consoleLogImpl ?? console.log;
  const generateManifestImpl = options.generateManifestImpl ?? generateDesktopV3PackageManifest;

  if (argv.includes("--help")) {
    consoleLogImpl(buildDesktopV3PackageManifestHelpText());
    return { help: true };
  }

  const platform = readCliValue(argv, "platform");

  if (!platform) {
    throw new Error("Missing required --platform=windows|macos option.");
  }

  const bundleDir = readCliValue(argv, "bundle-dir") ?? "apps/desktop-v3/src-tauri/target/release/bundle";
  const outputDir =
    readCliValue(argv, "output-dir") ?? `apps/desktop-v3/src-tauri/target/release/package-manifest/${platform}`;
  const artifactPathsFile =
    readCliValue(argv, "artifact-paths-file") ?? `${outputDir}/artifact-paths.txt`;
  const result = await generateManifestImpl({
    artifactPathsFile,
    bundleDir,
    outputDir,
    platform,
  });

  consoleLogImpl(
    `desktop-v3 first-install package manifest generated for ${result.platform}. Manifest: ${result.manifestPath} | Checksums: ${result.checksumsPath}`
  );

  return result;
}

export async function main(argv = process.argv.slice(2)) {
  return runDesktopV3PackageManifestCli({ argv });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
