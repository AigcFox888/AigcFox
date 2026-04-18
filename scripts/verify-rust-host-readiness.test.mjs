import { describe, expect, it, vi } from "vitest";

import {
  buildRustHostReadinessSummary,
  desktopV3ManifestPath,
  resolveRustHostReadinessConfig,
  runRustHostReadinessCheck,
} from "./verify-rust-host-readiness.mjs";

describe("verify-rust-host-readiness", () => {
  it("resolves the verification output path from CLI and env overrides", () => {
    const config = resolveRustHostReadinessConfig({
      argv: ["--verification-dir=/tmp/rust-host-check"],
      env: {
        AIGCFOX_GOVERNANCE_VERIFICATION_DIR: "/tmp/ignored-by-cli",
      },
      rootDir: "/workspace",
    });

    expect(config.manifestPath).toBe(desktopV3ManifestPath);
    expect(config.rootDir).toBe("/workspace");
    expect(config.verificationDir).toBe("/tmp/rust-host-check");
    expect(config.summaryPath).toBe("/tmp/rust-host-check/rust-host-readiness-summary.json");
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
      linkerProbe: {
        code: 0,
        error: null,
        ok: true,
        stderr: "",
        stdout: "",
      },
      platform: "linux",
      summaryPath: "/tmp/rust-host-readiness-summary.json",
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
  });

  it("runs the cargo probe against the desktop-v3 manifest and writes the summary", async () => {
    const consoleErrorImpl = vi.fn();
    const consoleLogImpl = vi.fn();
    const mkdirImpl = vi.fn(async () => {});
    const writeFileImpl = vi.fn(async () => {});
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
        manifestPath: desktopV3ManifestPath,
        rootDir: "/workspace",
        summaryPath: "/tmp/rust-host-check/summary.json",
        verificationDir: "/tmp/rust-host-check",
      },
      consoleErrorImpl,
      consoleLogImpl,
      mkdirImpl,
      platform: "linux",
      runCargoCommandImpl,
      writeFileImpl,
    });

    expect(mkdirImpl).toHaveBeenCalledWith("/tmp/rust-host-check", { recursive: true });
    expect(runCargoCommandImpl).toHaveBeenNthCalledWith(1, ["--version"], { cwd: "/workspace" });
    expect(runCargoCommandImpl).toHaveBeenNthCalledWith(
      2,
      ["build", "--manifest-path", desktopV3ManifestPath, "--quiet"],
      { cwd: "/workspace" },
    );
    expect(writeFileImpl).toHaveBeenCalledWith(
      "/tmp/rust-host-check/summary.json",
      JSON.stringify(summary, null, 2),
      "utf8",
    );
    expect(consoleErrorImpl).not.toHaveBeenCalled();
    expect(consoleLogImpl).toHaveBeenCalledWith(
      "Rust host readiness check passed. Summary: /tmp/rust-host-check/summary.json",
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
        manifestPath: desktopV3ManifestPath,
        rootDir: "/workspace",
        summaryPath: "/tmp/rust-host-check/summary.json",
        verificationDir: "/tmp/rust-host-check",
      },
      consoleErrorImpl,
      mkdirImpl: vi.fn(async () => {}),
      platform: "linux",
      runCargoCommandImpl,
      writeFileImpl: vi.fn(async () => {}),
    });

    expect(summary.passed).toBe(false);
    expect(summary.linker.detail).toBe(`system linker check failed for ${desktopV3ManifestPath}`);
    expect(consoleErrorImpl).toHaveBeenCalledWith(
      "Rust host readiness check failed. Cargo: ok. Linker: missing. Summary: /tmp/rust-host-check/summary.json",
    );
  });
});
