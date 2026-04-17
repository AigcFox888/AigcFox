import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { runDesktopV3Wave1Readiness } from "./desktop-v3-wave1-readiness-runner.mjs";
import { buildDesktopV3Wave1ReadinessSteps } from "./desktop-v3-wave1-readiness-steps.mjs";
import { assertDesktopV3Wave1ReadinessSummaryContract } from "./wave1-readiness-summary-contract.mjs";

describe("desktop-v3 wave1 readiness config", () => {
  it("resolves nested output directories for a WSL run", () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        WSL_DISTRO_NAME: "Ubuntu",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });

    expect(config.isWslHost).toBe(true);
    expect(config.hostPlatform).toBe("linux");
    expect(config.profile).toBe("default");
    expect(config.outputDir).toContain("desktop-v3-wave1-readiness-2026-04-13T10-20-30-456Z");
    expect(config.documentFiles).toEqual(
      expect.arrayContaining([
        "docs/281-desktop-v3-post-reinstall-recovery-entry.md",
        "docs/257-desktop-v3-replatform-proposal.md",
        "docs/258-desktop-v3-technical-baseline.md",
        "docs/259-desktop-v3-detailed-design.md",
        "docs/260-desktop-v3-wave1-execution-baseline.md",
        "docs/263-desktop-v3-wave1-acceptance-matrix.md",
        "docs/264-desktop-v3-wave1-execution-runbook.md",
        "docs/267-desktop-v3-github-actions-baseline.md",
        "docs/269-desktop-v3-tauri-2-governance-baseline.md",
        "apps/desktop-v3/README.md",
      ]),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-wave1-readiness-summary.json"),
    );
    expect(config.commandGovernanceOutputDir).toBe(path.join(config.outputDir, "command-governance"));
    expect(config.localdbGovernanceOutputDir).toBe(path.join(config.outputDir, "localdb-governance"));
    expect(config.packagedAppSmokeOutputDir).toBe(path.join(config.outputDir, "packaged-app-smoke"));
    expect(config.responsiveSmokeOutputDir).toBe(path.join(config.outputDir, "responsive-smoke"));
    expect(config.tauriDevSmokeOutputDir).toBe(path.join(config.outputDir, "tauri-dev-smoke"));
  });

  it("switches to ci profile inside GitHub Actions", () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        GITHUB_ACTIONS: "true",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });

    expect(config.profile).toBe("ci");
  });
});

describe("desktop-v3 wave1 readiness steps", () => {
  it("wires nested artifact directories for automated WSL checks", () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
        WSL_DISTRO_NAME: "Ubuntu",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });

    const steps = buildDesktopV3Wave1ReadinessSteps(config);

    expect(steps.at(0)?.key).toBe("desktop-v3-document-check");
    expect(steps.at(1)?.key).toBe("desktop-v3-runtime-boundary");
    expect(steps.at(2)?.key).toBe("desktop-v3-localdb-governance");
    expect(steps.at(3)?.key).toBe("desktop-v3-command-governance");
    expect(steps.map((step) => step.key)).toContain("desktop-v3-tauri-dev-smoke");
    expect(steps.map((step) => step.key)).toContain("desktop-v3-packaged-app-smoke");
    expect(steps.find((step) => step.key === "desktop-v3-runtime-boundary")?.env).toEqual({
      AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_OUTPUT_DIR: "/tmp/wave1-ready/runtime-boundary",
    });
    expect(steps.find((step) => step.key === "desktop-v3-localdb-governance")?.env).toEqual({
      AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_OUTPUT_DIR: "/tmp/wave1-ready/localdb-governance",
    });
    expect(steps.find((step) => step.key === "desktop-v3-command-governance")?.env).toEqual({
      AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_OUTPUT_DIR: "/tmp/wave1-ready/command-governance",
    });
    expect(steps.find((step) => step.key === "desktop-v3-responsive-smoke")?.env).toEqual({
      AIGCFOX_DESKTOP_V3_SMOKE_OUTPUT_DIR: "/tmp/wave1-ready/responsive-smoke",
    });
    expect(steps.find((step) => step.key === "desktop-v3-packaged-app-smoke")?.env).toEqual({
      AIGCFOX_DESKTOP_V3_PACKAGED_APP_SMOKE_OUTPUT_DIR: "/tmp/wave1-ready/packaged-app-smoke",
    });
  });

  it("marks raw tauri dev as manual on non-WSL hosts", () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });

    const steps = buildDesktopV3Wave1ReadinessSteps(config);
    const manualStep = steps.find((step) => step.key === "desktop-v3-tauri-dev-manual");

    expect(manualStep?.kind).toBe("manual");
    expect(manualStep?.command).toBe("pnpm --filter @aigcfox/desktop-v3 tauri dev");
  });

  it("omits host-window smoke steps in ci profile", () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
        AIGCFOX_DESKTOP_V3_WAVE1_PROFILE: "ci",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });

    const steps = buildDesktopV3Wave1ReadinessSteps(config);

    expect(steps.map((step) => step.key)).not.toContain("desktop-v3-tauri-dev-smoke");
    expect(steps.map((step) => step.key)).not.toContain("desktop-v3-tauri-dev-manual");
    expect(steps.at(-1)?.key).toBe("desktop-v3-linux-package");
    expect(steps.map((step) => step.key)).toContain("desktop-v3-command-governance");
    expect(steps.map((step) => step.key)).toContain("desktop-v3-localdb-governance");
    expect(steps.map((step) => step.key)).toContain("desktop-v3-runtime-boundary");
  });
});

describe("desktop-v3 wave1 readiness runner", () => {
  it("records a passed run summary", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
        WSL_DISTRO_NAME: "Ubuntu",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });
    const steps = [
      {
        args: ["--filter", "@aigcfox/desktop-v3", "lint"],
        artifacts: {},
        command: "pnpm --filter @aigcfox/desktop-v3 lint",
        key: "desktop-v3-lint",
        kind: "pnpm",
        label: "desktop-v3-lint",
      },
      {
        args: ["test", "--manifest-path", "apps/desktop-v3/src-tauri/Cargo.toml"],
        artifacts: {},
        command: "cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml",
        key: "desktop-v3-cargo-test",
        kind: "cargo",
        label: "desktop-v3-cargo-test",
      },
    ];
    const writeJsonFileImpl = vi.fn(async () => {});

    const summary = await runDesktopV3Wave1Readiness(config, steps, {
      mkdirImpl: async () => {},
      runCargoStepImpl: async () => {},
      runPnpmStepImpl: async () => {},
      writeJsonFileImpl,
    });

    expect(summary.steps).toHaveLength(2);
    expect(summary.steps.every((step) => step.status === "passed")).toBe(true);
    expect(() =>
      assertDesktopV3Wave1ReadinessSummaryContract(summary, {
        expectedDocumentFiles: config.documentFiles,
        expectedLatestSummaryPath: config.latestSummaryPath,
        expectedOutputDir: config.outputDir,
        expectedRunId: config.runId,
        expectedStatus: "passed",
        expectedSummaryPath: config.summaryPath,
        rootDir: config.rootDir,
      }),
    ).not.toThrow();
    expect(writeJsonFileImpl).toHaveBeenCalledTimes(2);
    expect(writeJsonFileImpl).toHaveBeenCalledWith(config.summaryPath, summary);
    expect(writeJsonFileImpl).toHaveBeenCalledWith(config.latestSummaryPath, summary);
  });

  it("rebinds child smoke summaries against archive and latest copies", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        WSL_DISTRO_NAME: "Ubuntu",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });
    const childSummary = {
      latestSummaryPath: config.responsiveSmokeLatestSummaryPath,
      outputDir: config.responsiveSmokeOutputDir,
      summaryPath: path.join(config.responsiveSmokeOutputDir, "summary.json"),
    };
    const readFileImpl = vi.fn(async () => JSON.stringify(childSummary));
    const assertResponsiveSummaryCopiesImpl = vi.fn(async () => {});
    const writeJsonFileImpl = vi.fn(async () => {});
    const steps = [
      {
        args: ["qa:desktop-v3-responsive-smoke"],
        artifacts: {
          latestSummaryPath: config.responsiveSmokeLatestSummaryPath,
          outputDir: config.responsiveSmokeOutputDir,
          summaryPath: path.join(config.responsiveSmokeOutputDir, "summary.json"),
        },
        command: "pnpm qa:desktop-v3-responsive-smoke",
        key: "desktop-v3-responsive-smoke",
        kind: "pnpm",
        label: "desktop-v3-responsive-smoke",
      },
    ];

    await runDesktopV3Wave1Readiness(config, steps, {
      assertResponsiveSummaryCopiesImpl,
      mkdirImpl: async () => {},
      readFileImpl,
      runPnpmStepImpl: async () => {},
      writeJsonFileImpl,
    });

    expect(readFileImpl).toHaveBeenCalledWith(path.join(config.responsiveSmokeOutputDir, "summary.json"), "utf8");
    expect(assertResponsiveSummaryCopiesImpl).toHaveBeenCalledWith(
      childSummary,
      expect.objectContaining({
        latestSummaryPath: config.responsiveSmokeLatestSummaryPath,
        outputDir: config.responsiveSmokeOutputDir,
        summaryPath: path.join(config.responsiveSmokeOutputDir, "summary.json"),
      }),
      expect.objectContaining({
        readFileImpl,
      }),
    );
  });

  it("runs the desktop document gate before code steps", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });
    const assertDocumentDiffCheckImpl = vi.fn(async () => ({
      trackedFiles: config.documentFiles,
      untrackedFiles: [],
    }));
    const checkMarkdownLinksImpl = vi.fn(async () => []);
    const scanForbiddenDocumentTermsImpl = vi.fn(async () => []);
    const writeJsonFileImpl = vi.fn(async () => {});
    const steps = [
      {
        artifacts: {},
        command: "git diff --check / equivalent format check + markdown links + forbidden term scan",
        key: "desktop-v3-document-check",
        kind: "document",
        label: "desktop-v3-document-check",
      },
      {
        args: ["--filter", "@aigcfox/desktop-v3", "lint"],
        artifacts: {},
        command: "pnpm --filter @aigcfox/desktop-v3 lint",
        key: "desktop-v3-lint",
        kind: "pnpm",
        label: "desktop-v3-lint",
      },
    ];

    const summary = await runDesktopV3Wave1Readiness(config, steps, {
      assertDocumentDiffCheckImpl,
      checkMarkdownLinksImpl,
      mkdirImpl: async () => {},
      runPnpmStepImpl: async () => {},
      scanForbiddenDocumentTermsImpl,
      writeJsonFileImpl,
    });

    expect(summary.steps[0]?.artifacts).toEqual({
      brokenLinks: [],
      documentFiles: config.documentFiles,
      forbiddenTerms: [],
      trackedFiles: config.documentFiles,
      untrackedFiles: [],
      latestSummaryPathRef: null,
      outputDirRef: null,
      summaryPathRef: null,
    });
    expect(assertDocumentDiffCheckImpl).toHaveBeenCalledWith(
      config.documentFiles,
      config.rootDir,
      expect.objectContaining({
        readFileImpl: undefined,
        runCommandCaptureImpl: expect.any(Function),
      }),
    );
    expect(checkMarkdownLinksImpl).toHaveBeenCalledWith(config.documentFiles, config.rootDir);
    expect(scanForbiddenDocumentTermsImpl).toHaveBeenCalledWith(config.documentFiles, config.rootDir);
  });

  it("fails when the host tauri step cannot be auto-verified", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
      },
      now: new Date("2026-04-13T10:20:30.456Z"),
    });
    const steps = [
      {
        artifacts: {},
        command: "pnpm --filter @aigcfox/desktop-v3 tauri dev",
        key: "desktop-v3-tauri-dev-manual",
        kind: "manual",
        label: "desktop-v3-tauri-dev-manual",
        reason: "manual host proof required",
      },
    ];
    const writeJsonFileImpl = vi.fn(async () => {});

    await expect(
      runDesktopV3Wave1Readiness(config, steps, {
        mkdirImpl: async () => {},
        runPnpmStepImpl: async () => {},
        writeJsonFileImpl,
      }),
    ).rejects.toThrow("manual host proof required");

    const writtenSummary = writeJsonFileImpl.mock.calls.at(-1)?.[1];
    expect(writeJsonFileImpl).toHaveBeenCalledTimes(2);
    expect(writtenSummary?.steps[0]?.status).toBe("manual_required");
    expect(() =>
      assertDesktopV3Wave1ReadinessSummaryContract(writtenSummary, {
        expectedDocumentFiles: config.documentFiles,
        expectedLatestSummaryPath: config.latestSummaryPath,
        expectedOutputDir: config.outputDir,
        expectedRunId: config.runId,
        expectedStatus: "failed",
        expectedSummaryPath: config.summaryPath,
        rootDir: config.rootDir,
      }),
    ).not.toThrow();
  });

  it("persists a failed desktop document gate summary with contract intact", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig({
      env: {
        AIGCFOX_DESKTOP_V3_WAVE1_OUTPUT_DIR: "/tmp/wave1-ready",
      },
      now: new Date("2026-04-13T10:40:30.456Z"),
    });
    const writeJsonFileImpl = vi.fn(async () => {});
    const steps = [
      {
        artifacts: {},
        command: "git diff --check / equivalent format check + markdown links + forbidden term scan",
        key: "desktop-v3-document-check",
        kind: "document",
        label: "desktop-v3-document-check",
      },
    ];

    await expect(
      runDesktopV3Wave1Readiness(config, steps, {
        assertDocumentDiffCheckImpl: async () => {
          throw new Error("desktop document gate boom");
        },
        mkdirImpl: async () => {},
        runPnpmStepImpl: async () => {},
        writeJsonFileImpl,
      }),
    ).rejects.toThrow("desktop document gate boom");

    const writtenSummary = writeJsonFileImpl.mock.calls.at(-1)?.[1];
    expect(() =>
      assertDesktopV3Wave1ReadinessSummaryContract(writtenSummary, {
        expectedDocumentFiles: config.documentFiles,
        expectedLatestSummaryPath: config.latestSummaryPath,
        expectedOutputDir: config.outputDir,
        expectedRunId: config.runId,
        expectedStatus: "failed",
        expectedSummaryPath: config.summaryPath,
        rootDir: config.rootDir,
      }),
    ).not.toThrow();
    expect(writtenSummary?.steps[0]?.artifacts).toEqual({
      brokenLinks: [],
      documentFiles: config.documentFiles,
      forbiddenTerms: [],
      trackedFiles: [],
      untrackedFiles: [],
      latestSummaryPathRef: null,
      outputDirRef: null,
      summaryPathRef: null,
    });
  });
});
