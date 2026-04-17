import path from "node:path";

import { formatPnpmCommand } from "./pnpm-command.mjs";

function buildPnpmStep(key, args, options = {}) {
  return {
    args,
    artifacts: options.artifacts ?? {},
    command: formatPnpmCommand(args),
    env: options.env ?? {},
    kind: "pnpm",
    key,
    label: options.label ?? key,
  };
}

function buildDocumentStep(key, options = {}) {
  return {
    artifacts: options.artifacts ?? {},
    command: "git diff --check / equivalent format check + markdown links + forbidden term scan",
    kind: "document",
    key,
    label: options.label ?? key,
  };
}

function buildCargoStep(key, args, options = {}) {
  return {
    args,
    artifacts: options.artifacts ?? {},
    command: `cargo ${args.join(" ")}`,
    env: options.env ?? {},
    kind: "cargo",
    key,
    label: options.label ?? key,
  };
}

function buildManualStep(key, command, reason, options = {}) {
  return {
    artifacts: options.artifacts ?? {},
    command,
    kind: "manual",
    key,
    label: options.label ?? key,
    reason,
  };
}

function buildDesktopV3PackageStep(config) {
  if (config.hostPlatform === "linux") {
    return buildPnpmStep("desktop-v3-linux-package", ["qa:desktop-v3-linux-package"], {
      label: "desktop-v3-linux-package",
    });
  }

  return buildPnpmStep(
    "desktop-v3-tauri-build",
    ["--filter", "@aigcfox/desktop-v3", "tauri", "build", "--ci", "--no-sign"],
    {
      label: "desktop-v3-tauri-build",
    },
  );
}

export function buildDesktopV3Wave1ReadinessSteps(config) {
  const steps = [
    buildDocumentStep("desktop-v3-document-check"),
    buildPnpmStep("desktop-v3-runtime-boundary", ["qa:desktop-v3-runtime-boundary"], {
      artifacts: {
        latestSummaryPath: config.runtimeBoundaryLatestSummaryPath,
        outputDir: config.runtimeBoundaryOutputDir,
        summaryPath: path.join(config.runtimeBoundaryOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_OUTPUT_DIR: config.runtimeBoundaryOutputDir,
      },
      label: "desktop-v3-runtime-boundary",
    }),
    buildPnpmStep("desktop-v3-localdb-governance", ["qa:desktop-v3-localdb-governance"], {
      artifacts: {
        latestSummaryPath: config.localdbGovernanceLatestSummaryPath,
        outputDir: config.localdbGovernanceOutputDir,
        summaryPath: path.join(config.localdbGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_OUTPUT_DIR: config.localdbGovernanceOutputDir,
      },
      label: "desktop-v3-localdb-governance",
    }),
    buildPnpmStep("desktop-v3-lint", ["--filter", "@aigcfox/desktop-v3", "lint"]),
    buildPnpmStep("desktop-v3-typecheck", ["--filter", "@aigcfox/desktop-v3", "typecheck"]),
    buildPnpmStep("desktop-v3-test", ["--filter", "@aigcfox/desktop-v3", "test"]),
    buildCargoStep("desktop-v3-cargo-test", [
      "test",
      "--manifest-path",
      "apps/desktop-v3/src-tauri/Cargo.toml",
    ]),
    buildPnpmStep("desktop-v3-build", ["--filter", "@aigcfox/desktop-v3", "build"]),
    buildPnpmStep("desktop-v3-responsive-smoke", ["qa:desktop-v3-responsive-smoke"], {
      artifacts: {
        latestSummaryPath: config.responsiveSmokeLatestSummaryPath,
        outputDir: config.responsiveSmokeOutputDir,
        summaryPath: path.join(config.responsiveSmokeOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_SMOKE_OUTPUT_DIR: config.responsiveSmokeOutputDir,
      },
    }),
  ];

  if (config.profile === "ci") {
    // GitHub Actions cannot provide a WSLg host window, so CI runs the non-window subset.
  } else if (config.isWslHost) {
    steps.push(
      buildPnpmStep("desktop-v3-tauri-dev-smoke", ["qa:desktop-v3-tauri-dev-smoke"], {
        artifacts: {
          latestSummaryPath: config.tauriDevSmokeLatestSummaryPath,
          outputDir: config.tauriDevSmokeOutputDir,
          summaryPath: path.join(config.tauriDevSmokeOutputDir, "summary.json"),
        },
        env: {
          AIGCFOX_DESKTOP_V3_TAURI_DEV_SMOKE_OUTPUT_DIR: config.tauriDevSmokeOutputDir,
        },
      }),
    );
    steps.push(
      buildDesktopV3PackageStep(config),
    );
    steps.push(
      buildPnpmStep("desktop-v3-packaged-app-smoke", ["qa:desktop-v3-packaged-app-smoke"], {
        artifacts: {
          latestSummaryPath: config.packagedAppSmokeLatestSummaryPath,
          outputDir: config.packagedAppSmokeOutputDir,
          summaryPath: path.join(config.packagedAppSmokeOutputDir, "summary.json"),
        },
        env: {
          AIGCFOX_DESKTOP_V3_PACKAGED_APP_SMOKE_OUTPUT_DIR: config.packagedAppSmokeOutputDir,
        },
        label: "desktop-v3-packaged-app-smoke",
      }),
    );
    return steps;
  } else {
    steps.push(
      buildManualStep(
        "desktop-v3-tauri-dev-manual",
        "pnpm --filter @aigcfox/desktop-v3 tauri dev",
        "当前宿主不是 Ubuntu + WSL，无法使用 WSLg 自动宿主 smoke；必须手动完成真实窗口启动验证。",
      ),
    );
  }

  steps.push(buildDesktopV3PackageStep(config));

  return steps;
}
