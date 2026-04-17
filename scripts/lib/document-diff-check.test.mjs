import { describe, expect, it, vi } from "vitest";

import { runDocumentDiffCheck } from "./document-diff-check.mjs";

describe("runDocumentDiffCheck", () => {
  it("uses git diff --check for tracked files and equivalent checks for untracked files", async () => {
    const runCommandCaptureImpl = vi.fn(async (_file, args) => {
      if (args[0] === "ls-files") {
        return {
          ok: true,
          stderr: "",
          stdout: "docs/new-baseline.md",
        };
      }

      if (args[0] === "diff") {
        return {
          ok: true,
          stderr: "",
          stdout: "",
        };
      }

      throw new Error(`Unexpected command: ${args.join(" ")}`);
    });
    const readFileImpl = vi.fn(async () => "# New baseline\nclean line\n");

    await expect(
      runDocumentDiffCheck(
        ["docs/README.md", "docs/new-baseline.md"],
        "/workspace",
        {
          readFileImpl,
          runCommandCaptureImpl,
        },
      ),
    ).resolves.toEqual({
      trackedFiles: ["docs/README.md"],
      untrackedFiles: ["docs/new-baseline.md"],
    });

    expect(runCommandCaptureImpl).toHaveBeenNthCalledWith(
      1,
      "git",
      ["ls-files", "--others", "--exclude-standard", "--", "docs/README.md", "docs/new-baseline.md"],
      { cwd: "/workspace" },
    );
    expect(runCommandCaptureImpl).toHaveBeenNthCalledWith(
      2,
      "git",
      ["diff", "--check", "--", "docs/README.md"],
      { cwd: "/workspace" },
    );
    expect(readFileImpl).toHaveBeenCalledWith("/workspace/docs/new-baseline.md", "utf8");
  });

  it("fails when git diff --check reports tracked-file formatting errors", async () => {
    const runCommandCaptureImpl = vi.fn(async (_file, args) => {
      if (args[0] === "ls-files") {
        return {
          ok: true,
          stderr: "",
          stdout: "",
        };
      }

      return {
        ok: false,
        stderr: "",
        stdout: "docs/README.md:12: trailing whitespace.",
      };
    });

    await expect(
      runDocumentDiffCheck(["docs/README.md"], "/workspace", {
        runCommandCaptureImpl,
      }),
    ).rejects.toThrow("docs/README.md:12: trailing whitespace.");
  });

  it("fails when an untracked file contains trailing whitespace", async () => {
    const runCommandCaptureImpl = vi.fn(async () => ({
      ok: true,
      stderr: "",
      stdout: "docs/new-baseline.md",
    }));
    const readFileImpl = vi.fn(async () => "# New baseline \n");

    await expect(
      runDocumentDiffCheck(["docs/new-baseline.md"], "/workspace", {
        readFileImpl,
        runCommandCaptureImpl,
      }),
    ).rejects.toThrow("docs/new-baseline.md:1 trailing whitespace");
  });

  it("fails when an untracked file contains merge conflict markers", async () => {
    const runCommandCaptureImpl = vi.fn(async () => ({
      ok: true,
      stderr: "",
      stdout: "docs/new-baseline.md",
    }));
    const readFileImpl = vi.fn(async () => "# New baseline\n<<<<<<< HEAD\n");

    await expect(
      runDocumentDiffCheck(["docs/new-baseline.md"], "/workspace", {
        readFileImpl,
        runCommandCaptureImpl,
      }),
    ).rejects.toThrow("docs/new-baseline.md:2 merge conflict marker");
  });
});
