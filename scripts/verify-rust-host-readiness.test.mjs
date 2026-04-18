import { describe, expect, it, vi } from "vitest";

import {
  buildRustHostReadinessSummary,
  desktopV3ManifestPath,
  resolveRustHostReadinessConfig,
  runRustHostReadinessCheck,
} from "./verify-rust-host-readiness.mjs";

describe("verify-rust-host-readiness", () => {
  it("resolves archive and latest summary paths from the verification directory", () => {
    const config = resolveRustHostReadinessConfig({
      argv: ["--verification-dir=/tmp/rust-host-check"],
      env: {
        AIGCFOX_GOVERNANCE_VERIFICATION_DIR: "/tmp/ignored-by-cli",
      },
      now: new Date("2026-04-18T10:00:00.000Z"),
      rootDir: "/workspace",
    });

    expect(config.manifestPath).toBe(desktopV3ManifestPath);
    expect(config.rootDir).toBe("/workspace");
    expect(config.runId).toBe("2026-04-18T10-00-00-000Z");
    expect(config.verificationDir).toBe("/tmp/rust-host-check");
    expect(config.outputDir).toBe("/tmp/rust-host-check/rust-host-readiness-2026-04-18T10-00-00-000Z");
    expect(config.summaryPath).toBe("/tmp/rust-host-check/rust-host-readiness-2026-04-18T10-00-00-000Z/summary.json");
    expect(config.latestSummaryPath).toBe("/tmp/rust-host-check/latest/rust-host-readiness-summary.json");
  });

  it("builds a non-Windows success summary against the desktop-v3 Cargo manifest", () => {
    const summary = buildRustHostReadinessSummary({
      cargoCommand: "cargo",
      cargoVersion: {
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "cargo 1.90.0",
      },
      latestSummaryPath: "/tmp/latest/rust-host-readiness-summary.json",
      linkerProbe: {
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "",
      },
      outputDir: "/tmp/rust-host-readiness-run",
      platform: "linux",
      runId: "manual-run",
      summaryPath: "/tmp/rust-host-readiness-run/summary.json",
      verificationDir: "/tmp",
    });

    expect(summary.passed).toBe(true);
    expect(summary.cargo.detail).toBe("cargo 1.90.0");
    expect(summary.linker.detail).toBe(
      `Rust build probe succeeded for ${desktopV3ManifestPath} on non-Windows host.`,
    );
    expect(summary.linker.probeCommand).toBe(
      `cargo build --manifest-path ${desktopV3ManifestPath} --quiet`,
    );
    expect(summary.latestSummaryPath).toBe("/tmp/latest/rust-host-readiness-summary.json");
    expect(summary.outputDir).toBe("/tmp/rust-host-readiness-run");
    expect(summary.runId).toBe("manual-run");
  });

  it("runs the cargo probe against the desktop-v3 manifest and writes archive and latest summaries", async () => {
    const consoleErrorImpl = vi.fn();
    const consoleLogImpl = vi.fn();
    const mkdirImpl = vi.fn(async () => {});
    const persistVerificationSummaryImpl = vi.fn(async () => {});
    const runCargoCommandImpl = vi
      .fn()
      .mockResolvedValueOnce({
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "cargo 1.90.0",
      })
      .mockResolvedValueOnce({
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "",
      });

    const summary = await runRustHostReadinessCheck({
      checkedAt: "2026-04-18T10:00:00.000Z",
      config: {
        latestSummaryPath: "/tmp/rust-host-check/latest/summary.json",
        manifestPath: desktopV3ManifestPath,
        outputDir: "/tmp/rust-host-check/archive",
        rootDir: "/workspace",
        runId: "manual-run",
        summaryPath: "/tmp/rust-host-check/summary.json",
        verificationDir: "/tmp/rust-host-check",
      },
      consoleErrorImpl,
      consoleLogImpl,
      mkdirImpl,
      persistVerificationSummaryImpl,
      platform: "linux",
      runCargoCommandImpl,
    });

    expect(mkdirImpl).toHaveBeenCalledWith("/tmp/rust-host-check/archive", { recursive: true });
    expect(runCargoCommandImpl).toHaveBeenNthCalledWith(1, ["--version"], { cwd: "/workspace" });
    expect(runCargoCommandImpl).toHaveBeenNthCalledWith(
      2,
      ["build", "--manifest-path", desktopV3ManifestPath, "--quiet"],
      { cwd: "/workspace" },
    );
    expect(persistVerificationSummaryImpl).toHaveBeenCalledWith(
      summary,
      {
        archiveSummaryPath: "/tmp/rust-host-check/summary.json",
        latestSummaryPath: "/tmp/rust-host-check/latest/summary.json",
      },
      expect.objectContaining({
        writeJsonFileImpl: expect.any(Function),
      }),
    );
    expect(consoleErrorImpl).not.toHaveBeenCalled();
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "Rust host readiness check passed. Summary: /tmp/rust-host-check/summary.json | Latest: /tmp/rust-host-check/latest/summary.json",
    );
  });

  it("reports the manifest-specific failure detail when the linker probe fails", async () => {
    const consoleErrorImpl = vi.fn();
    const runCargoCommandImpl = vi
      .fn()
      .mockResolvedValueOnce({
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "cargo 1.90.0",
      })
      .mockResolvedValueOnce({
        code: 1,
        error: null,
        ok: false,
        stderr: "",
        stdout: "",
      });

    const summary = await runRustHostReadinessCheck({
      config: {
        latestSummaryPath: "/tmp/rust-host-check/latest/summary.json",
        manifestPath: desktopV3ManifestPath,
        outputDir: "/tmp/rust-host-check/archive",
        rootDir: "/workspace",
        runId: "manual-run",
        summaryPath: "/tmp/rust-host-check/summary.json",
        verificationDir: "/tmp/rust-host-check",
      },
      consoleErrorImpl,
      mkdirImpl: vi.fn(async () => {}),
      persistVerificationSummaryImpl: vi.fn(async () => {}),
      platform: "linux",
      runCargoCommandImpl,
    });

    expect(summary.passed).toBe(false);
    expect(summary.linker.detail).toBe(`system linker check failed for ${desktopV3ManifestPath}`);
    expect(consoleErrorImpl).toHaveBeenCalledWith(
      "Rust host readiness check failed. Cargo: ok. Linker: missing. Summary: /tmp/rust-host-check/summary.json. Latest: /tmp/rust-host-check/latest/summary.json",
    );
  });
});
