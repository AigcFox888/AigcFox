import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3CommandGovernanceFailureMessage,
  collectDesktopV3CommandFileDetailsFromSource,
  collectDesktopV3CommandGovernanceViolations,
  createDesktopV3CommandGovernanceSummary,
  desktopV3AllowedCommandModules,
  desktopV3AllowedTauriCommands,
  desktopV3CommandGovernanceDir,
  resolveDesktopV3CommandGovernanceConfig,
  rootDir,
} from "./desktop-v3-command-governance.mjs";

describe("desktop-v3 command governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3CommandGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_RUN_ID: "command-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("command-check");
    expect(config.commandsDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src", "commands"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-command-governance-command-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-command-governance-summary.json"),
    );
    expect(config.allowedCommandModules).toEqual(desktopV3AllowedCommandModules);
    expect(config.allowedCommands).toEqual(desktopV3AllowedTauriCommands);
  });
});

describe("desktop-v3 command governance scan", () => {
  it("flags extra command files, forbidden imports, helper expansion, and missing traces", async () => {
    const config = resolveDesktopV3CommandGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const commandFiles = new Map([
      [
        path.join(config.commandsDir, "backend.rs"),
        [
          "use tauri::State;",
          "use crate::commands::trace_desktop_command;",
          "use crate::error::CommandError;",
          "use crate::runtime::DesktopRuntime;",
          "use crate::runtime::models::BackendProbe;",
          "",
          "#[tauri::command]",
          "pub async fn desktop_get_backend_liveness(runtime: State<'_, DesktopRuntime>) -> Result<BackendProbe, CommandError> {",
          '    trace_desktop_command("desktop_get_backend_liveness");',
          "    runtime.get_backend_liveness().await.map_err(Into::into)",
          "}",
          "",
          "#[tauri::command]",
          "pub async fn desktop_get_backend_readiness(runtime: State<'_, DesktopRuntime>) -> Result<BackendProbe, CommandError> {",
          '    trace_desktop_command("desktop_get_backend_readiness");',
          "    runtime.get_backend_readiness().await.map_err(Into::into)",
          "}",
        ].join("\n"),
      ],
      [
        path.join(config.commandsDir, "diagnostics.rs"),
        [
          "use tauri::State;",
          "use crate::commands::trace_desktop_command;",
          "use crate::error::CommandError;",
          "use crate::runtime::DesktopRuntime;",
          "use crate::runtime::models::DiagnosticsSnapshot;",
          "",
          "#[tauri::command]",
          "pub async fn desktop_get_diagnostics_snapshot(runtime: State<'_, DesktopRuntime>) -> Result<DiagnosticsSnapshot, CommandError> {",
          '    trace_desktop_command("desktop_get_diagnostics_snapshot");',
          "    runtime.get_diagnostics_snapshot().await.map_err(Into::into)",
          "}",
        ].join("\n"),
      ],
      [
        path.join(config.commandsDir, "preferences.rs"),
        [
          "use tauri::State;",
          "use crate::commands::trace_desktop_command;",
          "use crate::error::CommandError;",
          "use crate::runtime::DesktopRuntime;",
          "use crate::runtime::models::{ThemeMode, ThemePreference};",
          "",
          "#[tauri::command]",
          "pub fn desktop_get_theme_preference(runtime: State<'_, DesktopRuntime>) -> Result<ThemePreference, CommandError> {",
          '    trace_desktop_command("desktop_get_theme_preference");',
          "    runtime.get_theme_preference().map_err(Into::into)",
          "}",
          "",
          "#[tauri::command]",
          "pub fn desktop_set_theme_preference(mode: ThemeMode, runtime: State<'_, DesktopRuntime>) -> Result<ThemePreference, CommandError> {",
          '    trace_desktop_command("desktop_set_theme_preference");',
          "    runtime.set_theme_preference(mode).map_err(Into::into)",
          "}",
        ].join("\n"),
      ],
      [
        path.join(config.commandsDir, "renderer.rs"),
        [
          "use tauri::State;",
          "use crate::commands::trace_desktop_command;",
          "use crate::error::CommandError;",
          "use crate::runtime::DesktopRuntime;",
          "",
          "#[tauri::command]",
          "pub async fn desktop_report_renderer_boot(route: String, runtime: String, stage: String, runtime_state: State<'_, DesktopRuntime>) -> Result<(), CommandError> {",
          "    runtime_state.report_renderer_boot(stage, route, runtime).await.map_err(Into::into)",
          "}",
        ].join("\n"),
      ],
      [
        path.join(config.commandsDir, "mod.rs"),
        [
          "pub mod backend;",
          "pub mod diagnostics;",
          "pub mod preferences;",
          "pub mod renderer;",
          "",
          "fn should_trace_desktop_commands() -> bool {",
          "    crate::env::env_flag(\"AIGCFOX_DESKTOP_V3_TRACE_COMMANDS\")",
          "}",
          "",
          "pub fn trace_desktop_command(command_name: &str) {",
          "    if should_trace_desktop_commands() {",
          "        eprintln!(\"desktop-v3.command.invoke name={command_name}\");",
          "    }",
          "}",
          "",
          "fn leaked_logic() {}",
        ].join("\n"),
      ],
      [
        path.join(config.commandsDir, "danger.rs"),
        [
          "use std::fs;",
          "",
          "#[tauri::command]",
          "pub fn desktop_export_everything() -> Result<(), CommandError> {",
          "    Ok(())",
          "}",
          "",
          "fn helper_logic() {}",
        ].join("\n"),
      ],
    ]);

    const detail = collectDesktopV3CommandFileDetailsFromSource(
      commandFiles.get(path.join(config.commandsDir, "danger.rs")),
      path.join(config.commandsDir, "danger.rs"),
      { rootDir: config.rootDir },
    );
    expect(detail.functions.map((entry) => `${entry.tauriCommand}:${entry.name}`)).toEqual([
      "true:desktop_export_everything",
      "false:helper_logic",
    ]);

    const result = await collectDesktopV3CommandGovernanceViolations(config, {
      filePaths: Array.from(commandFiles.keys()),
      readFileImpl: async (filePath) => commandFiles.get(filePath) ?? "",
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "command-module-expansion",
        "command-forbidden-import",
        "command-surface-expansion",
        "command-helper-expansion",
        "command-support-expansion",
        "command-trace-missing",
      ]),
    );
    expect(result.missingCommands).toEqual([]);
    expect(result.commandModules).toContain("danger.rs");
  });

  it("keeps the current desktop-v3 command surface inside the frozen Wave 1 boundary", async () => {
    const config = resolveDesktopV3CommandGovernanceConfig();
    const result = await collectDesktopV3CommandGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFileCount).toBeGreaterThan(0);
    expect(result.commandModules).toEqual(desktopV3AllowedCommandModules);
    expect(result.commands.map((entry) => entry.name)).toEqual(desktopV3AllowedTauriCommands);
    expect(result.missingCommands).toEqual([]);
    expect(result.missingModuleNames).toEqual([]);
  });
});

describe("desktop-v3 command governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3CommandGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_COMMAND_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3CommandGovernanceSummary(config);

    summary.summaryPath = "/tmp/command-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "Tauri command desktop_export_everything is outside the frozen Wave 1 command surface.",
        filePath: "apps/desktop-v3/src-tauri/src/commands/danger.rs",
        kind: "command-surface-expansion",
        line: 4,
      },
    ];

    expect(buildDesktopV3CommandGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/src/commands/danger.rs:4:1 [command-surface-expansion]",
    );
    expect(buildDesktopV3CommandGovernanceFailureMessage(summary)).toContain(
      "/tmp/command-governance/summary.json",
    );
  });
});
