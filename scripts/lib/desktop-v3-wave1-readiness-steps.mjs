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
    buildPnpmStep("desktop-v3-backend-client-governance", ["qa:desktop-v3-backend-client-governance"], {
      artifacts: {
        latestSummaryPath: config.backendClientGovernanceLatestSummaryPath,
        outputDir: config.backendClientGovernanceOutputDir,
        summaryPath: path.join(config.backendClientGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_OUTPUT_DIR: config.backendClientGovernanceOutputDir,
      },
      label: "desktop-v3-backend-client-governance",
    }),
    buildPnpmStep("desktop-v3-app-shell-governance", ["qa:desktop-v3-app-shell-governance"], {
      artifacts: {
        latestSummaryPath: config.appShellGovernanceLatestSummaryPath,
        outputDir: config.appShellGovernanceOutputDir,
        summaryPath: path.join(config.appShellGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_APP_SHELL_GOVERNANCE_OUTPUT_DIR: config.appShellGovernanceOutputDir,
      },
      label: "desktop-v3-app-shell-governance",
    }),
    buildPnpmStep("desktop-v3-page-governance", ["qa:desktop-v3-page-governance"], {
      artifacts: {
        latestSummaryPath: config.pageGovernanceLatestSummaryPath,
        outputDir: config.pageGovernanceOutputDir,
        summaryPath: path.join(config.pageGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_PAGE_GOVERNANCE_OUTPUT_DIR: config.pageGovernanceOutputDir,
      },
      label: "desktop-v3-page-governance",
    }),
    buildPnpmStep("desktop-v3-support-governance", ["qa:desktop-v3-support-governance"], {
      artifacts: {
        latestSummaryPath: config.supportGovernanceLatestSummaryPath,
        outputDir: config.supportGovernanceOutputDir,
        summaryPath: path.join(config.supportGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_SUPPORT_GOVERNANCE_OUTPUT_DIR: config.supportGovernanceOutputDir,
      },
      label: "desktop-v3-support-governance",
    }),
    buildPnpmStep("desktop-v3-runtime-skeleton-governance", ["qa:desktop-v3-runtime-skeleton-governance"], {
      artifacts: {
        latestSummaryPath: config.runtimeSkeletonGovernanceLatestSummaryPath,
        outputDir: config.runtimeSkeletonGovernanceOutputDir,
        summaryPath: path.join(config.runtimeSkeletonGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_OUTPUT_DIR: config.runtimeSkeletonGovernanceOutputDir,
      },
      label: "desktop-v3-runtime-skeleton-governance",
    }),
    buildPnpmStep("desktop-v3-runtime-contract-governance", ["qa:desktop-v3-runtime-contract-governance"], {
      artifacts: {
        latestSummaryPath: config.runtimeContractGovernanceLatestSummaryPath,
        outputDir: config.runtimeContractGovernanceOutputDir,
        summaryPath: path.join(config.runtimeContractGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_OUTPUT_DIR: config.runtimeContractGovernanceOutputDir,
      },
      label: "desktop-v3-runtime-contract-governance",
    }),
    buildPnpmStep("desktop-v3-error-contract-governance", ["qa:desktop-v3-error-contract-governance"], {
      artifacts: {
        latestSummaryPath: config.errorContractGovernanceLatestSummaryPath,
        outputDir: config.errorContractGovernanceOutputDir,
        summaryPath: path.join(config.errorContractGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_OUTPUT_DIR: config.errorContractGovernanceOutputDir,
      },
      label: "desktop-v3-error-contract-governance",
    }),
    buildPnpmStep("desktop-v3-runtime-adapter-governance", ["qa:desktop-v3-runtime-adapter-governance"], {
      artifacts: {
        latestSummaryPath: config.runtimeAdapterGovernanceLatestSummaryPath,
        outputDir: config.runtimeAdapterGovernanceOutputDir,
        summaryPath: path.join(config.runtimeAdapterGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_OUTPUT_DIR: config.runtimeAdapterGovernanceOutputDir,
      },
      label: "desktop-v3-runtime-adapter-governance",
    }),
    buildPnpmStep("desktop-v3-feature-governance", ["qa:desktop-v3-feature-governance"], {
      artifacts: {
        latestSummaryPath: config.featureGovernanceLatestSummaryPath,
        outputDir: config.featureGovernanceOutputDir,
        summaryPath: path.join(config.featureGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_FEATURE_GOVERNANCE_OUTPUT_DIR: config.featureGovernanceOutputDir,
      },
      label: "desktop-v3-feature-governance",
    }),
    buildPnpmStep("desktop-v3-command-governance", ["qa:desktop-v3-command-governance"], {
      artifacts: {
        latestSummaryPath: config.commandGovernanceLatestSummaryPath,
        outputDir: config.commandGovernanceOutputDir,
        summaryPath: path.join(config.commandGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_OUTPUT_DIR: config.commandGovernanceOutputDir,
      },
      label: "desktop-v3-command-governance",
    }),
    buildPnpmStep("desktop-v3-capability-governance", ["qa:desktop-v3-capability-governance"], {
      artifacts: {
        latestSummaryPath: config.capabilityGovernanceLatestSummaryPath,
        outputDir: config.capabilityGovernanceOutputDir,
        summaryPath: path.join(config.capabilityGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_OUTPUT_DIR: config.capabilityGovernanceOutputDir,
      },
      label: "desktop-v3-capability-governance",
    }),
    buildPnpmStep("desktop-v3-platform-config-governance", ["qa:desktop-v3-platform-config-governance"], {
      artifacts: {
        latestSummaryPath: config.platformConfigGovernanceLatestSummaryPath,
        outputDir: config.platformConfigGovernanceOutputDir,
        summaryPath: path.join(config.platformConfigGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_OUTPUT_DIR: config.platformConfigGovernanceOutputDir,
      },
      label: "desktop-v3-platform-config-governance",
    }),
    buildPnpmStep("desktop-v3-host-governance", ["qa:desktop-v3-host-governance"], {
      artifacts: {
        latestSummaryPath: config.hostGovernanceLatestSummaryPath,
        outputDir: config.hostGovernanceOutputDir,
        summaryPath: path.join(config.hostGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_OUTPUT_DIR: config.hostGovernanceOutputDir,
      },
      label: "desktop-v3-host-governance",
    }),
    buildPnpmStep("desktop-v3-updater-governance", ["qa:desktop-v3-updater-governance"], {
      artifacts: {
        latestSummaryPath: config.updaterGovernanceLatestSummaryPath,
        outputDir: config.updaterGovernanceOutputDir,
        summaryPath: path.join(config.updaterGovernanceOutputDir, "summary.json"),
      },
      env: {
        AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_OUTPUT_DIR: config.updaterGovernanceOutputDir,
      },
      label: "desktop-v3-updater-governance",
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
    return steps;
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
    return steps;
  } else {
    steps.push(
      buildManualStep(
        "desktop-v3-tauri-dev-manual",
        "pnpm --filter @aigcfox/desktop-v3 tauri dev",
        "当前宿主不是 Ubuntu + WSL，无法使用 WSLg 自动宿主 smoke；必须手动完成真实窗口启动验证。",
      ),
    );
    return steps;
  }
}
