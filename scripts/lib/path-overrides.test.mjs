import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterEach, describe, expect, it } from "vitest";

import {
  inferRunIdFromPath,
  readCliValueFromAliases,
  readPathOverride,
  resolveLatestMatchingDirectory
} from "./path-overrides.mjs";

const originalEnv = { ...process.env };
const tempDirs = [];

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(originalEnv)) {
    process.env[key] = value;
  }
}

afterEach(() => {
  restoreEnv();
});

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true }))
  );
});

describe("path override helpers", () => {
  it("reads the first available CLI alias", () => {
    const argv = [
      "node",
      "script.mjs",
      "--summary-path=C:\\temp\\summary.json",
      "--verification-dir=C:\\temp\\project-governance-run-core-phase-actual-5"
    ];

    expect(readCliValueFromAliases(["output-dir", "verification-dir"], argv)).toBe(
      "C:\\temp\\project-governance-run-core-phase-actual-5"
    );
  });

  it("prefers CLI, then env, then default path", () => {
    process.env.AIGCFOX_TEST_OUTPUT_DIR = "C:\\env\\governance";

    expect(
      readPathOverride(
        "verification-dir",
        "AIGCFOX_TEST_OUTPUT_DIR",
        "C:\\default\\governance",
        ["node", "script.mjs", "--verification-dir=C:\\cli\\governance"]
      )
    ).toBe("C:\\cli\\governance");

    expect(
      readPathOverride(
        "verification-dir",
        "AIGCFOX_TEST_OUTPUT_DIR",
        "C:\\default\\governance",
        ["node", "script.mjs"]
      )
    ).toBe("C:\\env\\governance");

    delete process.env.AIGCFOX_TEST_OUTPUT_DIR;

    expect(
      readPathOverride(
        "verification-dir",
        "AIGCFOX_TEST_OUTPUT_DIR",
        "C:\\default\\governance",
        ["node", "script.mjs"]
      )
    ).toBe("C:\\default\\governance");
  });

  it("infers run ids from supported prefixes in nested paths", () => {
    const projectSummaryPath = path.join(
      "C:\\Users\\Leo\\Desktop\\AigcFox",
      "output",
      "verification",
      "project-governance-run-core-phase-actual-5",
      "project-governance-summary.json"
    );
    const legacySummaryPath = path.join(
      "C:\\Users\\Leo\\Desktop\\AigcFox",
      "output",
      "verification",
      "governance-run-legacy-path-7",
      "desktop-governance-summary.json"
    );

    expect(
      inferRunIdFromPath(projectSummaryPath, ["project-governance-run-", "governance-run-"])
    ).toBe("core-phase-actual-5");
    expect(
      inferRunIdFromPath(legacySummaryPath, ["desktop-governance-run-", "governance-run-"])
    ).toBe("legacy-path-7");
  });

  it("returns null for blank or unmatched paths", () => {
    expect(inferRunIdFromPath("", ["project-governance-run-"])).toBeNull();
    expect(
      inferRunIdFromPath("C:\\Users\\Leo\\Desktop\\AigcFox\\output\\verification\\summary.json", [
        "project-governance-run-"
      ])
    ).toBeNull();
  });

  it("resolves the latest matching run directory by modified time", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aigcfox-path-overrides-"));
    tempDirs.push(tempRoot);
    const verificationDir = path.join(tempRoot, "verification");
    const olderDir = path.join(verificationDir, "project-governance-run-older");
    const newerDir = path.join(verificationDir, "project-governance-run-newer");
    const ignoredDir = path.join(verificationDir, "not-a-governance-run");

    await fs.mkdir(olderDir, { recursive: true });
    await fs.mkdir(newerDir, { recursive: true });
    await fs.mkdir(ignoredDir, { recursive: true });
    const olderTimestamp = new Date("2026-01-01T00:00:00.000Z");
    const newerTimestamp = new Date("2026-01-01T00:00:01.000Z");
    await fs.utimes(olderDir, olderTimestamp, olderTimestamp);
    await fs.utimes(newerDir, newerTimestamp, newerTimestamp);

    expect(resolveLatestMatchingDirectory(verificationDir, ["project-governance-run-"])).toBe(
      newerDir
    );
  });

  it("returns null when no matching run directory exists", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aigcfox-path-overrides-"));
    tempDirs.push(tempRoot);
    const verificationDir = path.join(tempRoot, "verification");

    await fs.mkdir(verificationDir, { recursive: true });

    expect(resolveLatestMatchingDirectory(verificationDir, ["project-governance-run-"])).toBeNull();
  });
});
