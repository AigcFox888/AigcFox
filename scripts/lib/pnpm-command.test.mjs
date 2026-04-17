import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterEach, describe, expect, it } from "vitest";

import { spawnPnpmDirect, runPnpmDirect } from "./pnpm-command.mjs";

const tempDirs = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true }))
  );
});

describe("pnpm command", () => {
  it("passes windows path arguments through pnpm without losing the flag", async () => {
    if (process.platform !== "win32") {
      expect(true).toBe(true);
      return;
    }

    const child = spawnPnpmDirect(
      [
        "exec",
        "node",
        "-p",
        "JSON.stringify(process.argv.slice(1))",
        "--",
        "--archive-path=D:\\runtime\\cloakbrowser-126.0.0-win32-x64.zip",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const result = await new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.once("error", reject);
      child.once("close", (code) => {
        resolve({ code, stdout, stderr });
      });
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout.trim())).toEqual([
      "--archive-path=D:\\runtime\\cloakbrowser-126.0.0-win32-x64.zip",
    ]);
  });

  it("honors a windows pnpm command override for direct runners", async () => {
    if (process.platform !== "win32") {
      expect(true).toBe(true);
      return;
    }

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aigcfox-pnpm-command-"));
    tempDirs.push(tempRoot);
    const binDir = path.join(tempRoot, "bin");
    const logPath = path.join(tempRoot, "pnpm.log");

    await fs.mkdir(binDir, { recursive: true });
    await fs.writeFile(
      path.join(binDir, "pnpm.cmd"),
      [
        "@echo off",
        'if not "%AIGCFOX_FAKE_PNPM_LOG%"=="" >> "%AIGCFOX_FAKE_PNPM_LOG%" echo %*',
        "exit /b 0",
        ""
      ].join("\r\n"),
      "utf8"
    );

    const result = await runPnpmDirect(["qa:project-governance-verify"], {
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
        AIGCFOX_PNPM_COMMAND: "pnpm.cmd",
        AIGCFOX_FAKE_PNPM_LOG: logPath
      },
      stdio: "ignore"
    });

    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
    await expect(fs.readFile(logPath, "utf8")).resolves.toContain("qa:project-governance-verify");
  });
});
