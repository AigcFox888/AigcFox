import { describe, expect, it, vi } from "vitest";

import { buildGithubRemoteProofCliHelpText, runGithubRemoteProofCli } from "./github-actions-remote-proof-cli.mjs";

describe("github-actions remote proof cli", () => {
  it("builds help text with the shared environment override footer", () => {
    const helpText = buildGithubRemoteProofCliHelpText({
      description: "Checks a remote workflow and writes a verification summary.",
      environmentOverrides: ["FIRST_OVERRIDE=value", "SECOND_OVERRIDE=value"],
      title: "shared remote proof checker",
    });

    expect(helpText).toContain("shared remote proof checker");
    expect(helpText).toContain("Checks a remote workflow and writes a verification summary.");
    expect(helpText).toContain("  FIRST_OVERRIDE=value");
    expect(helpText).toContain("  SECOND_OVERRIDE=value");
    expect(helpText).toContain("git credential fill");
  });

  it("prints help and skips remote proof execution when asked", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const runProof = vi.fn();

    const result = await runGithubRemoteProofCli(
      {
        description: "Checks a remote workflow and writes a verification summary.",
        environmentOverrides: ["FIRST_OVERRIDE=value"],
        failureLabel: "shared remote proof",
        runProof,
        successLabel: "shared remote proof",
        title: "shared remote proof checker",
      },
      ["--help"],
    );

    expect(result).toBeNull();
    expect(runProof).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleLogSpy.mock.calls[0]?.[0]).toContain("shared remote proof checker");
    consoleLogSpy.mockRestore();
  });

  it("prints a success line when the remote proof passes", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const summary = await runGithubRemoteProofCli(
      {
        description: "Checks a remote workflow and writes a verification summary.",
        environmentOverrides: ["FIRST_OVERRIDE=value"],
        failureLabel: "shared remote proof",
        runProof: vi.fn(async () => ({
          failedChecks: [],
          latestSummaryPath: "/workspace/output/verification/latest/summary.json",
          status: "passed",
          summaryPath: "/workspace/output/verification/archive/summary.json",
        })),
        successLabel: "shared remote proof",
        title: "shared remote proof checker",
      },
      [],
    );

    expect(summary?.status).toBe("passed");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "shared remote proof passed. Summary: /workspace/output/verification/archive/summary.json | Latest: /workspace/output/verification/latest/summary.json",
    );
    consoleLogSpy.mockRestore();
  });

  it("throws a stable error message when the remote proof fails", async () => {
    await expect(
      runGithubRemoteProofCli(
        {
          description: "Checks a remote workflow and writes a verification summary.",
          environmentOverrides: ["FIRST_OVERRIDE=value"],
          failureLabel: "shared remote proof",
          runProof: vi.fn(async () => ({
            failedChecks: ["workflow_missing", "successful_run_missing"],
            latestSummaryPath: "/workspace/output/verification/latest/summary.json",
            status: "failed",
            summaryPath: "/workspace/output/verification/archive/summary.json",
          })),
          successLabel: "shared remote proof",
          title: "shared remote proof checker",
        },
        [],
      ),
    ).rejects.toThrow(
      "shared remote proof is incomplete. Failed checks: workflow_missing, successful_run_missing. Summary: /workspace/output/verification/archive/summary.json | Latest: /workspace/output/verification/latest/summary.json",
    );
  });
});
