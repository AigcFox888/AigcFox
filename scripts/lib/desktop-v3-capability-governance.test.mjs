import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3CapabilityGovernanceFailureMessage,
  collectDesktopV3CapabilityGovernanceViolations,
  createDesktopV3CapabilityGovernanceSummary,
  desktopV3AllowedAppPermissions,
  desktopV3AllowedTauriCommands,
  extractDesktopV3InvokeHandlerCommands,
  extractTypeScriptInterfacePropertyNames,
  parseDesktopV3PermissionEntries,
  resolveDesktopV3CapabilityGovernanceConfig,
  rootDir,
} from "./desktop-v3-capability-governance.mjs";

describe("desktop-v3 capability governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3CapabilityGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_RUN_ID: "capability-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("capability-check");
    expect(config.capabilityDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "capabilities"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-capability-governance-capability-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-capability-governance-summary.json"),
    );
  });
});

describe("desktop-v3 capability governance helpers", () => {
  it("parses permission entries, invoke handlers, and tauri command type maps", () => {
    const permissionsSource = [
      "[[permission]]",
      'identifier = "desktop-preferences-read"',
      'description = "Allows read."',
      'commands.allow = ["desktop_get_theme_preference"]',
      "",
      "[[permission]]",
      'identifier = "desktop-renderer-boot-write"',
      'description = "Allows boot telemetry."',
      'commands.allow = ["desktop_report_renderer_boot"]',
    ].join("\n");
    const libSource = [
      "fn run() {",
      "  builder.invoke_handler(tauri::generate_handler![",
      "      commands::preferences::desktop_get_theme_preference,",
      "      commands::renderer::desktop_report_renderer_boot,",
      "  ]);",
      "}",
    ].join("\n");
    const tauriTypesSource = [
      "export interface DesktopCommandPayloadMap {",
      "  desktop_get_theme_preference: undefined;",
      "  desktop_report_renderer_boot: { route: string; };",
      "}",
      "",
      "export interface DesktopCommandResultMap {",
      "  desktop_get_theme_preference: ThemePreference;",
      "  desktop_report_renderer_boot: void;",
      "}",
    ].join("\n");

    expect(parseDesktopV3PermissionEntries(permissionsSource)).toEqual([
      {
        commands: ["desktop_get_theme_preference"],
        description: "Allows read.",
        identifier: "desktop-preferences-read",
      },
      {
        commands: ["desktop_report_renderer_boot"],
        description: "Allows boot telemetry.",
        identifier: "desktop-renderer-boot-write",
      },
    ]);
    expect(extractDesktopV3InvokeHandlerCommands(libSource)).toEqual([
      "desktop_get_theme_preference",
      "desktop_report_renderer_boot",
    ]);
    expect(extractTypeScriptInterfacePropertyNames(tauriTypesSource, "DesktopCommandPayloadMap")).toEqual([
      "desktop_get_theme_preference",
      "desktop_report_renderer_boot",
    ]);
  });
});

describe("desktop-v3 capability governance scan", () => {
  it("flags capability, permission, handler, and type-surface drift", async () => {
    const config = resolveDesktopV3CapabilityGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const capabilityFile = path.join(config.capabilityDir, "main-window.json");
    const extraCapabilityFile = path.join(config.capabilityDir, "secondary-window.json");
    const capabilityJson = {
      description: "drifted",
      identifier: "secondary-window",
      permissions: [
        "core:app:default",
        "desktop-preferences-read",
      ],
      remote: {
        urls: ["https://example.com/*"],
      },
      windows: ["secondary"],
    };
    const permissionsSource = [
      "[[permission]]",
      'identifier = "desktop-preferences-read"',
      'description = "Allows the main window to read the persisted theme preference."',
      'commands.allow = ["desktop_get_theme_preference", "desktop_report_renderer_boot"]',
    ].join("\n");
    const libSource = [
      "fn run() {",
      "  builder.invoke_handler(tauri::generate_handler![",
      "      commands::preferences::desktop_get_theme_preference,",
      "  ]);",
      "}",
    ].join("\n");
    const tauriTypesSource = [
      "export interface DesktopCommandPayloadMap {",
      "  desktop_get_theme_preference: undefined;",
      "}",
      "",
      "export interface DesktopCommandResultMap {",
      "  desktop_get_theme_preference: ThemePreference;",
      "}",
    ].join("\n");

    const result = await collectDesktopV3CapabilityGovernanceViolations(config, {
      capabilityFilePaths: [capabilityFile, extraCapabilityFile],
      readFileImpl: async (filePath) => {
        if (filePath === capabilityFile || filePath === extraCapabilityFile) {
          return JSON.stringify(capabilityJson);
        }

        if (filePath === config.permissionsPath) {
          return permissionsSource;
        }

        if (filePath === config.rustLibPath) {
          return libSource;
        }

        if (filePath === config.tauriCommandTypesPath) {
          return tauriTypesSource;
        }

        return "";
      },
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "capability-file-expansion",
        "capability-identifier-drift",
        "capability-window-drift",
        "capability-remote-url-drift",
        "capability-core-permission-drift",
        "capability-app-permission-drift",
        "permission-identifier-drift",
        "permission-command-drift",
        "invoke-handler-command-drift",
        "tauri-command-payload-drift",
        "tauri-command-result-drift",
      ]),
    );
  });

  it("keeps the current desktop-v3 capability and permission boundary inside the frozen Wave 1 surface", async () => {
    const config = resolveDesktopV3CapabilityGovernanceConfig();
    const result = await collectDesktopV3CapabilityGovernanceViolations(config);
    const expectedCommands = [...desktopV3AllowedTauriCommands].sort((left, right) => left.localeCompare(right));

    expect(result.violations).toEqual([]);
    expect(result.capabilityFiles).toEqual(["apps/desktop-v3/src-tauri/capabilities/main-window.json"]);
    expect(result.appPermissions).toEqual(desktopV3AllowedAppPermissions);
    expect(result.invokeHandlerCommands).toEqual(expectedCommands);
    expect(result.payloadCommands).toEqual(expectedCommands);
    expect(result.resultCommands).toEqual(expectedCommands);
  });
});

describe("desktop-v3 capability governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3CapabilityGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_CAPABILITY_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3CapabilityGovernanceSummary(config);

    summary.summaryPath = "/tmp/capability-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "Capability app permission set drifted from the frozen Wave 1 allowlist.",
        filePath: "apps/desktop-v3/src-tauri/capabilities/main-window.json",
        kind: "capability-app-permission-drift",
        line: 1,
      },
    ];

    expect(buildDesktopV3CapabilityGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/capabilities/main-window.json:1:1 [capability-app-permission-drift]",
    );
    expect(buildDesktopV3CapabilityGovernanceFailureMessage(summary)).toContain(
      "/tmp/capability-governance/summary.json",
    );
  });
});
