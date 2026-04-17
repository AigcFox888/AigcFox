import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildPythonCandidates, listProjectPythonCandidates } from "./python-command.mjs";

const tempRoots = [];

async function createTempRoot(label) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `aigcfox-python-command-${label}-`));
  tempRoots.push(tempRoot);
  return tempRoot;
}

afterEach(async () => {
  while (tempRoots.length > 0) {
    const tempRoot = tempRoots.pop();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

describe("python command resolution", () => {
  it("prefers project virtual environments before global Python fallbacks on Windows", async () => {
    const tempRoot = await createTempRoot("windows");
    const rootVenvPython = path.join(tempRoot, ".venv", "Scripts", "python.exe");
    const serverVenvPython = path.join(tempRoot, "server", ".venv", "Scripts", "python.exe");

    await fs.mkdir(path.dirname(rootVenvPython), { recursive: true });
    await fs.mkdir(path.dirname(serverVenvPython), { recursive: true });
    await fs.writeFile(rootVenvPython, "");
    await fs.writeFile(serverVenvPython, "");

    const candidates = buildPythonCandidates({
      env: {},
      platform: "win32",
      rootDir: tempRoot
    });

    expect(candidates.slice(0, 4)).toEqual([
      { command: rootVenvPython, prefixArgs: [] },
      { command: serverVenvPython, prefixArgs: [] },
      { command: "python", prefixArgs: [] },
      { command: "py", prefixArgs: ["-3"] }
    ]);
  });

  it("keeps an explicit PYTHON override ahead of project virtual environments", async () => {
    const tempRoot = await createTempRoot("explicit");
    const rootVenvPython = path.join(tempRoot, ".venv", "Scripts", "python.exe");

    await fs.mkdir(path.dirname(rootVenvPython), { recursive: true });
    await fs.writeFile(rootVenvPython, "");

    const candidates = buildPythonCandidates({
      env: {
        PYTHON: "C:\\custom\\python.exe"
      },
      platform: "win32",
      rootDir: tempRoot
    });

    expect(candidates[0]).toEqual({ command: "C:\\custom\\python.exe", prefixArgs: [] });
    expect(candidates[1]).toEqual({ command: rootVenvPython, prefixArgs: [] });
  });

  it("lists root and server virtualenv interpreters for POSIX layouts", async () => {
    const tempRoot = await createTempRoot("posix");
    const rootVenvPython = path.join(tempRoot, ".venv", "bin", "python");
    const serverVenvPython = path.join(tempRoot, "server", "venv", "bin", "python");

    await fs.mkdir(path.dirname(rootVenvPython), { recursive: true });
    await fs.mkdir(path.dirname(serverVenvPython), { recursive: true });
    await fs.writeFile(rootVenvPython, "");
    await fs.writeFile(serverVenvPython, "");

    expect(
      listProjectPythonCandidates({
        platform: "linux",
        rootDir: tempRoot
      })
    ).toEqual([
      { command: rootVenvPython, prefixArgs: [] },
      { command: serverVenvPython, prefixArgs: [] }
    ]);
  });
});
