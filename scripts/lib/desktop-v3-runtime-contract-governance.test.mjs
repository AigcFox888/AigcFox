import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3RuntimeContractGovernanceFailureMessage,
  collectDesktopV3RuntimeContractGovernanceViolations,
  createDesktopV3RuntimeContractGovernanceSummary,
  desktopV3AllowedRuntimeContractFiles,
  desktopV3AllowedRustBackendProbeFieldSurface,
  desktopV3AllowedRustDiagnosticsSnapshotFieldSurface,
  desktopV3AllowedRustRuntimeModelExternalReferenceFiles,
  desktopV3AllowedRustRuntimeModelPublicItems,
  desktopV3AllowedRustThemeModePublicMethods,
  desktopV3AllowedRustThemeModeVariants,
  desktopV3AllowedRustThemePreferenceFieldSurface,
  desktopV3AllowedTsBackendProbeProperties,
  desktopV3AllowedTsDesktopCommandNameTypeText,
  desktopV3AllowedTsDesktopCommandPayloadEntries,
  desktopV3AllowedTsDesktopCommandResultEntries,
  desktopV3AllowedTsDesktopRuntimeExports,
  desktopV3AllowedTsDesktopRuntimeMethods,
  desktopV3AllowedTsDiagnosticsSnapshotProperties,
  desktopV3AllowedTsRendererBootStageValues,
  desktopV3AllowedTsRuntimeContractsExports,
  desktopV3AllowedTsSecureStoreSnapshotProperties,
  desktopV3AllowedTsSecureStoreStatusValues,
  desktopV3AllowedTsTauriCommandTypesExports,
  desktopV3AllowedTsThemeModeValues,
  desktopV3AllowedTsThemePreferenceProperties,
  resolveDesktopV3RuntimeContractGovernanceConfig,
  rootDir,
} from "./desktop-v3-runtime-contract-governance.mjs";

function toRustSurface(entries) {
  return entries.map((entry) => `${entry.visibility}:${entry.name}`).sort();
}

function toTsPropertySurface(entries) {
  return entries
    .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
    .sort();
}

function toTsMethodSurface(entries) {
  return entries.map((entry) => `${entry.name}${entry.signature}`).sort();
}

describe("desktop-v3 runtime contract governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3RuntimeContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_RUN_ID: "runtime-contract-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("runtime-contract-check");
    expect(config.rustSourceDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-runtime-contract-governance-runtime-contract-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-runtime-contract-governance-summary.json"),
    );
    expect(config.allowedRuntimeContractFiles).toEqual(desktopV3AllowedRuntimeContractFiles);
    expect(config.allowedRustRuntimeModelPublicItems).toEqual(desktopV3AllowedRustRuntimeModelPublicItems);
    expect(config.allowedTsRuntimeContractsExports).toEqual(desktopV3AllowedTsRuntimeContractsExports);
    expect(config.allowedTsDesktopRuntimeMethods).toEqual(desktopV3AllowedTsDesktopRuntimeMethods);
  });
});

describe("desktop-v3 runtime contract governance scan", () => {
  it("flags Rust and TypeScript contract drift across the frozen Wave 1 boundary", async () => {
    const config = resolveDesktopV3RuntimeContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const modelsFile = config.rustRuntimeModelsFilePath;
    const contractsFile = config.tsRuntimeContractsFilePath;
    const desktopRuntimeFile = config.tsDesktopRuntimeFilePath;
    const commandTypesFile = config.tsTauriCommandTypesFilePath;
    const allowedReferenceFiles = config.allowedRustRuntimeModelExternalReferenceFiles.map((filePath) =>
      path.join(config.rootDir, filePath),
    );
    const rogueReferenceFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "window.rs",
    );

    const files = new Map([
      [
        modelsFile,
        [
          "use serde::{Deserialize, Serialize};",
          "",
          "use crate::error::RuntimeError;",
          "use crate::runtime::security::SecureStoreSnapshot;",
          "",
          "#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]",
          "#[serde(rename_all = \"snake_case\")]",
          "pub enum ThemeMode {",
          "    Light,",
          "    Dark,",
          "    System,",
          "    Auto,",
          "}",
          "",
          "impl ThemeMode {",
          "    pub fn as_storage_value(self) -> String {",
          "        String::new()",
          "    }",
          "",
          "    pub fn from_storage_value(value: &str) -> Result<Self, RuntimeError> {",
          "        let _ = value;",
          "        unimplemented!()",
          "    }",
          "",
          "    pub(crate) fn leak(&self) {}",
          "}",
          "",
          "#[derive(Debug, Clone, Serialize)]",
          "#[serde(rename_all = \"snake_case\")]",
          "pub struct ThemePreference {",
          "    pub mode: ThemeMode,",
          "    pub updated_at: String,",
          "    pub source: String,",
          "}",
          "",
          "#[derive(Debug, Clone, Serialize)]",
          "#[serde(rename_all = \"camelCase\")]",
          "pub struct DiagnosticsSnapshot {",
          "    pub app_version: String,",
          "    pub backend_base_url: String,",
          "    pub checked_at: String,",
          "    pub database_path: String,",
          "    pub database_status: String,",
          "    pub dirty_sync_cache_entry_count: u32,",
          "    pub last_backend_probe_at: Option<String>,",
          "    pub platform: String,",
          "    pub release_channel: String,",
          "    pub secure_store: SecureStoreSnapshot,",
          "    pub sync_cache_entry_count: u32,",
          "    pub theme_mode: ThemeMode,",
          "}",
          "",
          "#[derive(Debug, Clone, Serialize)]",
          "#[serde(rename_all = \"camelCase\")]",
          "pub struct BackendProbe {",
          "    pub checked_at: String,",
          "    pub request_id: Option<String>,",
          "    pub service: String,",
          "    pub status: String,",
          "    pub latency_ms: u32,",
          "}",
          "",
          "pub struct RogueContract;",
          "",
          "pub fn utc_now() -> String {",
          "    String::new()",
          "}",
        ].join("\n"),
      ],
      [
        contractsFile,
        [
          "export type ThemeMode = \"light\" | \"dark\" | \"system\" | \"auto\";",
          "export type SecureStoreStatus = \"ready\" | \"unavailable\";",
          "",
          "export interface ThemePreference {",
          "  mode: ThemeMode;",
          "  updatedAt: string;",
          "  source: string;",
          "}",
          "",
          "export interface SecureStoreSnapshot {",
          "  provider: string;",
          "  status: SecureStoreStatus;",
          "  writesEnabled: boolean;",
          "  keyring: string;",
          "}",
          "",
          "export interface DiagnosticsSnapshot {",
          "  appVersion: string;",
          "  backendBaseUrl: string;",
          "  checkedAt: string;",
          "  databasePath: string;",
          "  databaseStatus: string;",
          "  dirtySyncCacheEntryCount: number;",
          "  lastBackendProbeAt?: string | null;",
          "  platform: string;",
          "  secureStore: SecureStoreSnapshot;",
          "  syncCacheEntryCount: number;",
          "  themeMode: ThemeMode;",
          "  releaseChannel: string;",
          "}",
          "",
          "export interface BackendProbe {",
          "  checkedAt: string;",
          "  requestId: string;",
          "  service: string;",
          "  status: string;",
          "}",
          "",
          "export interface RogueContract {}",
        ].join("\n"),
      ],
      [
        desktopRuntimeFile,
        [
          "import type { BackendProbe, DiagnosticsSnapshot, ThemeMode, ThemePreference } from \"@/lib/runtime/contracts\";",
          "",
          "export type RendererBootStage = \"app\" | \"document\" | \"shell\";",
          "",
          "export interface DesktopRuntime {",
          "  getBackendLiveness(): Promise<BackendProbe>;",
          "  getBackendReadiness(): Promise<BackendProbe>;",
          "  getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot>;",
          "  getThemePreference(): Promise<ThemeMode>;",
          "  reportRendererBoot(route: string, runtime: string, stage: RendererBootStage): Promise<string>;",
          "  setThemePreference(mode: ThemeMode): Promise<ThemePreference>;",
          "  reset(): Promise<void>;",
          "}",
          "",
          "export interface RuntimeMarker {}",
        ].join("\n"),
      ],
      [
        commandTypesFile,
        [
          "import type { BackendProbe, DiagnosticsSnapshot, ThemeMode, ThemePreference } from \"@/lib/runtime/contracts\";",
          "import type { RendererBootStage } from \"@/lib/runtime/desktop-runtime\";",
          "",
          "export interface DesktopCommandPayloadMap {",
          "  desktop_get_backend_liveness: { force: boolean };",
          "  desktop_get_backend_readiness: undefined;",
          "  desktop_get_diagnostics_snapshot: undefined;",
          "  desktop_get_theme_preference: undefined;",
          "  desktop_report_renderer_boot: {",
          "    route: string;",
          "    runtime: string;",
          "    stage: RendererBootStage;",
          "  };",
          "  desktop_set_theme_preference: {",
          "    mode: ThemeMode;",
          "  };",
          "  desktop_reset_runtime: undefined;",
          "}",
          "",
          "export interface DesktopCommandResultMap {",
          "  desktop_get_backend_liveness: BackendProbe;",
          "  desktop_get_diagnostics_snapshot: DiagnosticsSnapshot;",
          "  desktop_get_theme_preference: ThemePreference;",
          "  desktop_report_renderer_boot: void;",
          "  desktop_set_theme_preference: ThemePreference;",
          "  desktop_reset_runtime: void;",
          "}",
          "",
          "export type DesktopCommandName = \"desktop_reset_runtime\";",
          "export interface RogueCommandContract {}",
        ].join("\n"),
      ],
      ...allowedReferenceFiles.map((filePath) => ([
        filePath,
        "use crate::runtime::models::{BackendProbe, DiagnosticsSnapshot, ThemeMode, ThemePreference, utc_now};",
      ])),
      [
        rogueReferenceFile,
        [
          "use crate::runtime::models::ThemeMode;",
          "",
          "pub fn leak(mode: ThemeMode) {",
          "    let _ = mode;",
          "}",
        ].join("\n"),
      ],
    ]);

    const result = await collectDesktopV3RuntimeContractGovernanceViolations(config, {
      readFileImpl: async (filePath) => files.get(filePath) ?? "",
      rustSourceFilePaths: [modelsFile, ...allowedReferenceFiles, rogueReferenceFile],
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "runtime-contract-rust-public-item-drift",
        "runtime-contract-rust-theme-mode-signature-drift",
        "runtime-contract-rust-theme-mode-restricted-method",
        "runtime-contract-rust-theme-preference-field-drift",
        "runtime-contract-rust-diagnostics-snapshot-field-drift",
        "runtime-contract-rust-backend-probe-field-drift",
        "runtime-contract-rust-serde-rename-drift",
        "runtime-contract-rust-reference-drift",
        "runtime-contract-ts-contract-export-drift",
        "runtime-contract-ts-theme-mode-drift",
        "runtime-contract-ts-secure-store-status-drift",
        "runtime-contract-ts-theme-preference-field-drift",
        "runtime-contract-ts-secure-store-snapshot-field-drift",
        "runtime-contract-ts-diagnostics-snapshot-field-drift",
        "runtime-contract-ts-backend-probe-field-drift",
        "runtime-contract-ts-desktop-runtime-export-drift",
        "runtime-contract-ts-renderer-boot-stage-drift",
        "runtime-contract-ts-desktop-runtime-method-drift",
        "runtime-contract-ts-command-type-export-drift",
        "runtime-contract-ts-command-payload-drift",
        "runtime-contract-ts-command-result-drift",
        "runtime-contract-ts-command-payload-key-drift",
        "runtime-contract-ts-command-result-key-drift",
        "runtime-contract-ts-command-name-drift",
      ]),
    );
    expect(result.rustModelReferenceFiles).toContain("apps/desktop-v3/src-tauri/src/runtime/window.rs");
  });

  it("keeps the current Rust and TypeScript contract surface frozen", async () => {
    const config = resolveDesktopV3RuntimeContractGovernanceConfig();
    const result = await collectDesktopV3RuntimeContractGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFiles).toEqual(expect.arrayContaining(desktopV3AllowedRuntimeContractFiles));
    expect(result.rustPublicItems.map((entry) => `${entry.kind}:${entry.name}`)).toEqual(
      desktopV3AllowedRustRuntimeModelPublicItems,
    );
    expect(result.rustThemeModeVariants.map((entry) => entry.name).sort()).toEqual(
      [...desktopV3AllowedRustThemeModeVariants].sort(),
    );
    expect(result.rustThemeModeMethods.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(desktopV3AllowedRustThemeModePublicMethods),
    );
    expect(toRustSurface(result.rustThemePreferenceFields)).toEqual(
      desktopV3AllowedRustThemePreferenceFieldSurface,
    );
    expect(toRustSurface(result.rustDiagnosticsSnapshotFields)).toEqual(
      desktopV3AllowedRustDiagnosticsSnapshotFieldSurface,
    );
    expect(toRustSurface(result.rustBackendProbeFields)).toEqual(
      desktopV3AllowedRustBackendProbeFieldSurface,
    );
    expect(result.rustModelReferenceFiles).toEqual(
      desktopV3AllowedRustRuntimeModelExternalReferenceFiles,
    );
    expect(result.tsContractExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedTsRuntimeContractsExports].sort(),
    );
    expect(result.tsThemeModeValues).toEqual(desktopV3AllowedTsThemeModeValues);
    expect(result.tsSecureStoreStatusValues).toEqual(desktopV3AllowedTsSecureStoreStatusValues);
    expect(toTsPropertySurface(result.tsThemePreferenceProperties)).toEqual(
      desktopV3AllowedTsThemePreferenceProperties
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(toTsPropertySurface(result.tsSecureStoreSnapshotProperties)).toEqual(
      desktopV3AllowedTsSecureStoreSnapshotProperties
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(toTsPropertySurface(result.tsDiagnosticsSnapshotProperties)).toEqual(
      desktopV3AllowedTsDiagnosticsSnapshotProperties
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(toTsPropertySurface(result.tsBackendProbeProperties)).toEqual(
      desktopV3AllowedTsBackendProbeProperties
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(result.tsDesktopRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedTsDesktopRuntimeExports].sort(),
    );
    expect(result.tsRendererBootStageValues).toEqual(desktopV3AllowedTsRendererBootStageValues);
    expect(toTsMethodSurface(result.tsDesktopRuntimeMethods)).toEqual(
      [...desktopV3AllowedTsDesktopRuntimeMethods].sort(),
    );
    expect(result.tsTauriCommandTypesExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedTsTauriCommandTypesExports].sort(),
    );
    expect(toTsPropertySurface(result.tsDesktopCommandPayloadEntries)).toEqual(
      desktopV3AllowedTsDesktopCommandPayloadEntries
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(toTsPropertySurface(result.tsDesktopCommandResultEntries)).toEqual(
      desktopV3AllowedTsDesktopCommandResultEntries
        .map((entry) => `${entry.optional ? "optional" : "required"}:${entry.name}:${entry.typeText}`)
        .sort(),
    );
    expect(result.tsDesktopCommandNameType?.typeText).toBe(desktopV3AllowedTsDesktopCommandNameTypeText);
  });
});

describe("desktop-v3 runtime contract governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3RuntimeContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_CONTRACT_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3RuntimeContractGovernanceSummary(config);

    summary.summaryPath = "/tmp/runtime-contract-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "DesktopRuntime interface drifted from the frozen Wave 1 method surface.",
        filePath: "apps/desktop-v3/src/lib/runtime/desktop-runtime.ts",
        kind: "runtime-contract-ts-desktop-runtime-method-drift",
        line: 8,
      },
    ];

    expect(buildDesktopV3RuntimeContractGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src/lib/runtime/desktop-runtime.ts:8:1 [runtime-contract-ts-desktop-runtime-method-drift]",
    );
    expect(buildDesktopV3RuntimeContractGovernanceFailureMessage(summary)).toContain(
      "/tmp/runtime-contract-governance/summary.json",
    );
  });
});
