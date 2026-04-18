import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readSha256ChecksumsFile } from "./lib/file-checksum.mjs";
import { readJsonFile } from "./lib/script-io.mjs";
import {
  buildDesktopV3PackageManifestHelpText,
  collectDesktopV3FirstInstallPackages,
  generateDesktopV3PackageManifest,
  runDesktopV3PackageManifestCli,
} from "./generate-desktop-v3-package-manifest.mjs";

const tempDirs = [];

async function createTempDir() {
  const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "desktop-v3-package-manifest-"));
  tempDirs.push(targetDir);
  return targetDir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((targetDir) =>
      fs.rm(targetDir, {
        force: true,
        recursive: true,
      })
    )
  );
});

describe("generate-desktop-v3-package-manifest", () => {
  it("prints help without generating files", async () => {
    const consoleLogImpl = vi.fn();
    const generateManifestImpl = vi.fn();

    const result = await runDesktopV3PackageManifestCli({
      argv: ["--help"],
      consoleLogImpl,
      generateManifestImpl,
    });

    expect(result).toEqual({ help: true });
    expect(generateManifestImpl).not.toHaveBeenCalled();
    expect(consoleLogImpl).toHaveBeenCalledWith(buildDesktopV3PackageManifestHelpText());
  });

  it("collects only windows first-install packages", async () => {
    const tempDir = await createTempDir();
    const bundleDir = path.join(tempDir, "bundle");
    const msiFile = path.join(bundleDir, "msi", "AigcFox.msi");
    const ignoredFile = path.join(bundleDir, "msi", "notes.txt");

    await fs.mkdir(path.dirname(msiFile), { recursive: true });
    await fs.writeFile(msiFile, "windows package", "utf8");
    await fs.writeFile(ignoredFile, "ignore me", "utf8");

    const packages = await collectDesktopV3FirstInstallPackages({
      bundleDir,
      cwd: tempDir,
      platform: "windows",
    });

    expect(packages).toHaveLength(1);
    expect(packages[0]).toMatchObject({
      distributionRole: "first-install-package",
      fileName: "AigcFox.msi",
      relativePath: "msi/AigcFox.msi",
      workspacePath: "bundle/msi/AigcFox.msi",
    });
  });

  it("writes a manifest, checksums, and artifact path list for maintainer redistribution", async () => {
    const tempDir = await createTempDir();
    const bundleDir = path.join(tempDir, "apps", "desktop-v3", "src-tauri", "target", "release", "bundle");
    const outputDir = path.join(tempDir, "output", "package-manifest", "macos");
    const artifactPathsFile = path.join(outputDir, "artifact-paths.txt");
    const dmgFile = path.join(bundleDir, "dmg", "AigcFox.dmg");
    const appFile = path.join(bundleDir, "macos", "AigcFox.app", "Contents", "Info.plist");

    await fs.mkdir(path.dirname(dmgFile), { recursive: true });
    await fs.mkdir(path.dirname(appFile), { recursive: true });
    await fs.writeFile(dmgFile, "macos package", "utf8");
    await fs.writeFile(appFile, "bundle app", "utf8");

    const result = await generateDesktopV3PackageManifest({
      artifactPathsFile,
      bundleDir,
      cwd: tempDir,
      generatedAt: "2026-04-19T00:00:00.000Z",
      outputDir,
      platform: "macos",
    });

    const manifest = await readJsonFile(result.manifestPath);
    const checksums = await readSha256ChecksumsFile(result.checksumsPath, { sortEntries: true });
    const artifactPaths = (await fs.readFile(artifactPathsFile, "utf8"))
      .trim()
      .split("\n")
      .filter((entry) => entry.length > 0);

    expect(manifest).toMatchObject({
      bundleDir: "apps/desktop-v3/src-tauri/target/release/bundle",
      distributionMode: "maintainer-download-then-upload",
      firstInstallOnly: true,
      generatedAt: "2026-04-19T00:00:00.000Z",
      outputDir: "output/package-manifest/macos",
      packageCount: 1,
      platform: "macos",
      schemaVersion: 1,
    });
    expect(manifest.packages).toHaveLength(1);
    expect(manifest.packages[0]).toMatchObject({
      distributionRole: "first-install-package",
      fileName: "AigcFox.dmg",
      relativePath: "dmg/AigcFox.dmg",
      workspacePath: "apps/desktop-v3/src-tauri/target/release/bundle/dmg/AigcFox.dmg",
    });
    expect(checksums).toEqual([
      {
        path: "dmg/AigcFox.dmg",
        sha256: manifest.packages[0].sha256,
      },
    ]);
    expect(artifactPaths).toEqual([
      "apps/desktop-v3/src-tauri/target/release/bundle/dmg/AigcFox.dmg",
      "output/package-manifest/macos/release-manifest.json",
      "output/package-manifest/macos/SHA256SUMS.txt",
    ]);
  });

  it("fails when the expected first-install package is missing", async () => {
    const tempDir = await createTempDir();
    const bundleDir = path.join(tempDir, "bundle");

    await fs.mkdir(path.join(bundleDir, "macos"), { recursive: true });
    await fs.writeFile(path.join(bundleDir, "macos", "README.txt"), "no package", "utf8");

    await expect(
      generateDesktopV3PackageManifest({
        bundleDir,
        cwd: tempDir,
        outputDir: path.join(tempDir, "manifest"),
        platform: "macos",
      })
    ).rejects.toThrow("No first-install package files found for macos");
  });
});
