import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3RuntimeSkeletonGovernanceFailureMessage,
  collectDesktopV3RuntimeSkeletonGovernanceViolations,
  createDesktopV3RuntimeSkeletonGovernanceSummary,
  desktopV3AllowedDiagnosticsExternalReferenceFiles,
  desktopV3AllowedDiagnosticsFieldSurface,
  desktopV3AllowedDiagnosticsPublicMethods,
  desktopV3AllowedRuntimeSkeletonFiles,
  desktopV3AllowedSecurityExternalReferenceFiles,
  desktopV3AllowedSecurityPublicMethods,
  desktopV3AllowedSecuritySnapshotFieldSurface,
  desktopV3AllowedSecurityStatusVariants,
  desktopV3AllowedStateExternalReferenceFiles,
  desktopV3AllowedStatePublicMethods,
  desktopV3AllowedStateSessionFieldSurface,
  desktopV3AllowedStateSnapshotFieldSurface,
  desktopV3RuntimeDiagnosticsDir,
  desktopV3RuntimeSecurityDir,
  desktopV3RuntimeStateDir,
  resolveDesktopV3RuntimeSkeletonGovernanceConfig,
  rootDir,
} from "./desktop-v3-runtime-skeleton-governance.mjs";

function toSurface(entries) {
  return entries.map((entry) => `${entry.visibility}:${entry.name}`).sort();
}

describe("desktop-v3 runtime skeleton governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3RuntimeSkeletonGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_RUN_ID: "runtime-skeleton-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("runtime-skeleton-check");
    expect(config.rustSourceDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-runtime-skeleton-governance-runtime-skeleton-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-runtime-skeleton-governance-summary.json"),
    );
    expect(config.allowedRuntimeSkeletonFiles).toEqual(desktopV3AllowedRuntimeSkeletonFiles);
    expect(config.allowedSecurityStatusVariants).toEqual(desktopV3AllowedSecurityStatusVariants);
    expect(config.allowedStatePublicMethods).toEqual(desktopV3AllowedStatePublicMethods);
    expect(config.allowedDiagnosticsPublicMethods).toEqual(desktopV3AllowedDiagnosticsPublicMethods);
  });
});

describe("desktop-v3 runtime skeleton governance scan", () => {
  it("flags file-set drift, method drift, field drift, and ownership drift", async () => {
    const config = resolveDesktopV3RuntimeSkeletonGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const securityFile = path.join(config.rootDir, desktopV3AllowedRuntimeSkeletonFiles[1]);
    const stateFile = path.join(config.rootDir, desktopV3AllowedRuntimeSkeletonFiles[2]);
    const diagnosticsFile = path.join(config.rootDir, desktopV3AllowedRuntimeSkeletonFiles[0]);
    const extraFile = path.join(config.rootDir, desktopV3RuntimeSecurityDir, "adapter.rs");
    const runtimeFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "runtime", "mod.rs");
    const modelsFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "runtime", "models.rs");
    const rogueSecurityRefFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "commands",
      "backend.rs",
    );
    const rogueStateRefFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "window.rs",
    );
    const rogueDiagnosticsRefFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "commands",
      "diagnostics.rs",
    );

    const securitySourceText = [
      "use serde::Serialize;",
      "",
      "#[derive(Debug, Clone, Serialize, PartialEq, Eq)]",
      "pub enum SecureStoreStatus {",
      "    Reserved,",
      "    Ready,",
      "    Unavailable,",
      "    Pending,",
      "}",
      "",
      "#[derive(Debug, Clone, Serialize, PartialEq, Eq)]",
      "pub struct SecureStoreSnapshot {",
      "    pub provider: String,",
      "    pub status: SecureStoreStatus,",
      "    pub writes_enabled: bool,",
      "    pub secret_path: String,",
      "}",
      "",
      "pub struct SecureStore;",
      "",
      "impl SecureStore {",
      "    pub fn snapshot(&mut self) -> Result<SecureStoreSnapshot, RuntimeError> {",
      "        unimplemented!()",
      "    }",
      "",
      "    pub fn store_secret(&self) {}",
      "",
      "    pub(crate) fn leak(&self) {}",
      "",
      "    fn probe_keyring(&self) {}",
      "}",
    ].join("\n");
    const stateSourceText = [
      "use std::sync::Arc;",
      "",
      "use tokio::sync::RwLock;",
      "",
      "pub struct SessionSnapshot {",
      "    pub last_backend_probe_at: Option<String>,",
      "    pub current_workspace: Option<String>,",
      "}",
      "",
      "pub struct SessionState {",
      "    pub inner: Arc<RwLock<SessionSnapshot>>,",
      "    cache_size: usize,",
      "}",
      "",
      "impl SessionState {",
      "    pub async fn record_backend_probe(&self, checked_at: &str) {",
      "        let _ = checked_at;",
      "    }",
      "",
      "    pub async fn snapshot(&mut self) -> Option<SessionSnapshot> {",
      "        None",
      "    }",
      "",
      "    pub async fn clear(&self) {}",
      "",
      "    pub(crate) fn leak(&self) {}",
      "",
      "    fn reset(&self) {}",
      "}",
    ].join("\n");
    const diagnosticsSourceText = [
      "use crate::runtime::models::{DiagnosticsSnapshot, ThemeMode, utc_now};",
      "use crate::runtime::security::SecureStoreSnapshot;",
      "",
      "pub struct DiagnosticsService {",
      "    pub app_version: String,",
      "    backend_base_url: String,",
      "    database_path: String,",
      "    platform: String,",
      "    release_channel: String,",
      "}",
      "",
      "impl DiagnosticsService {",
      "    pub fn new(",
      "        app_version: String,",
      "        backend_base_url: String,",
      "        database_path: String,",
      "        platform: String,",
      "        release_channel: String,",
      "    ) -> Self {",
      "        let _ = utc_now;",
      "        Self {",
      "            app_version,",
      "            backend_base_url,",
      "            database_path,",
      "            platform,",
      "            release_channel,",
      "        }",
      "    }",
      "",
      "    pub fn snapshot(",
      "        &self,",
      "        database_status: String,",
      "        dirty_sync_cache_entry_count: u32,",
      "        last_backend_probe_at: Option<String>,",
      "        secure_store: SecureStoreSnapshot,",
      "        sync_cache_entry_count: u32,",
      "        theme_mode: ThemeMode,",
      "        release_channel: String,",
      "    ) -> DiagnosticsSnapshot {",
      "        let _ = (database_status, dirty_sync_cache_entry_count, last_backend_probe_at, secure_store, sync_cache_entry_count, theme_mode, release_channel);",
      "        unimplemented!()",
      "    }",
      "",
      "    pub fn reset(&self) {}",
      "",
      "    fn compose(&self) {}",
      "}",
    ].join("\n");
    const runtimeSourceText = [
      "use crate::runtime::diagnostics::DiagnosticsService;",
      "use crate::runtime::security::SecureStore;",
      "use crate::runtime::state::SessionState;",
      "",
      "pub struct DesktopRuntime {",
      "    diagnostics_service: DiagnosticsService,",
      "    secure_store: SecureStore,",
      "    session_state: SessionState,",
      "}",
    ].join("\n");
    const modelsSourceText = [
      "use crate::runtime::security::SecureStoreSnapshot;",
      "",
      "pub struct DiagnosticsSnapshot {",
      "    pub secure_store: SecureStoreSnapshot,",
      "}",
    ].join("\n");
    const rogueSecurityRefSourceText = [
      "use crate::runtime::security::SecureStoreSnapshot;",
      "",
      "pub fn leak(snapshot: SecureStoreSnapshot) {",
      "    let _ = snapshot;",
      "}",
    ].join("\n");
    const rogueStateRefSourceText = [
      "use crate::runtime::state::SessionState;",
      "",
      "pub fn leak(session_state: &SessionState) {",
      "    let _ = session_state;",
      "}",
    ].join("\n");
    const rogueDiagnosticsRefSourceText = [
      "use crate::runtime::diagnostics::DiagnosticsService;",
      "",
      "pub fn leak(service: &DiagnosticsService) {",
      "    let _ = service;",
      "}",
    ].join("\n");

    const result = await collectDesktopV3RuntimeSkeletonGovernanceViolations(config, {
      filePaths: [diagnosticsFile, extraFile, securityFile, stateFile],
      readFileImpl: async (filePath) => {
        if (filePath === securityFile) {
          return securitySourceText;
        }

        if (filePath === stateFile) {
          return stateSourceText;
        }

        if (filePath === diagnosticsFile) {
          return diagnosticsSourceText;
        }

        if (filePath === extraFile) {
          return "pub fn future_adapter() {}";
        }

        if (filePath === runtimeFile) {
          return runtimeSourceText;
        }

        if (filePath === modelsFile) {
          return modelsSourceText;
        }

        if (filePath === rogueSecurityRefFile) {
          return rogueSecurityRefSourceText;
        }

        if (filePath === rogueStateRefFile) {
          return rogueStateRefSourceText;
        }

        if (filePath === rogueDiagnosticsRefFile) {
          return rogueDiagnosticsRefSourceText;
        }

        return "";
      },
      rustSourceFilePaths: [
        diagnosticsFile,
        extraFile,
        modelsFile,
        rogueDiagnosticsRefFile,
        rogueSecurityRefFile,
        rogueStateRefFile,
        runtimeFile,
        securityFile,
        stateFile,
      ],
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "runtime-skeleton-file-expansion",
        "runtime-skeleton-security-status-drift",
        "runtime-skeleton-security-snapshot-field-drift",
        "runtime-skeleton-security-public-method-drift",
        "runtime-skeleton-security-restricted-method",
        "runtime-skeleton-security-private-method-drift",
        "runtime-skeleton-security-signature-drift",
        "runtime-skeleton-state-snapshot-field-drift",
        "runtime-skeleton-state-field-drift",
        "runtime-skeleton-state-public-method-drift",
        "runtime-skeleton-state-restricted-method",
        "runtime-skeleton-state-private-method-drift",
        "runtime-skeleton-state-signature-drift",
        "runtime-skeleton-diagnostics-field-drift",
        "runtime-skeleton-diagnostics-public-method-drift",
        "runtime-skeleton-diagnostics-private-method-drift",
        "runtime-skeleton-diagnostics-signature-drift",
        "runtime-skeleton-security-reference-drift",
        "runtime-skeleton-state-reference-drift",
        "runtime-skeleton-diagnostics-reference-drift",
      ]),
    );
    expect(result.runtimeSkeletonFiles).toContain(`${desktopV3RuntimeSecurityDir}/adapter.rs`);
    expect(result.externalSecurityReferenceFiles).toContain("apps/desktop-v3/src-tauri/src/commands/backend.rs");
    expect(result.externalStateReferenceFiles).toContain("apps/desktop-v3/src-tauri/src/runtime/window.rs");
    expect(result.externalDiagnosticsReferenceFiles).toContain("apps/desktop-v3/src-tauri/src/commands/diagnostics.rs");
  });

  it("keeps the current security/state/diagnostics skeleton inside the frozen Wave 1 boundary", async () => {
    const config = resolveDesktopV3RuntimeSkeletonGovernanceConfig();
    const result = await collectDesktopV3RuntimeSkeletonGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.runtimeSkeletonFiles).toEqual(desktopV3AllowedRuntimeSkeletonFiles);
    expect(result.securityEnumVariants.map((entry) => entry.name)).toEqual(desktopV3AllowedSecurityStatusVariants);
    expect(toSurface(result.securitySnapshotFields)).toEqual(desktopV3AllowedSecuritySnapshotFieldSurface);
    expect(result.securityMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name)).toEqual(
      desktopV3AllowedSecurityPublicMethods,
    );
    expect(toSurface(result.stateSnapshotFields)).toEqual(desktopV3AllowedStateSnapshotFieldSurface);
    expect(toSurface(result.stateSessionFields)).toEqual(desktopV3AllowedStateSessionFieldSurface);
    expect(result.stateMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name)).toEqual(
      desktopV3AllowedStatePublicMethods,
    );
    expect(toSurface(result.diagnosticsFields)).toEqual(desktopV3AllowedDiagnosticsFieldSurface);
    expect(
      result.diagnosticsMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name),
    ).toEqual(desktopV3AllowedDiagnosticsPublicMethods);
    expect(result.externalSecurityReferenceFiles).toEqual([...desktopV3AllowedSecurityExternalReferenceFiles].sort());
    expect(result.externalStateReferenceFiles).toEqual([...desktopV3AllowedStateExternalReferenceFiles].sort());
    expect(result.externalDiagnosticsReferenceFiles).toEqual(
      [...desktopV3AllowedDiagnosticsExternalReferenceFiles].sort(),
    );
  });
});

describe("desktop-v3 runtime skeleton governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3RuntimeSkeletonGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_SKELETON_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3RuntimeSkeletonGovernanceSummary(config);

    summary.summaryPath = "/tmp/runtime-skeleton-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "SecureStore public methods drifted from the frozen Wave 1 surface.",
        filePath: "apps/desktop-v3/src-tauri/src/runtime/security/mod.rs",
        kind: "runtime-skeleton-security-public-method-drift",
        line: 18,
      },
    ];

    expect(buildDesktopV3RuntimeSkeletonGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/src/runtime/security/mod.rs:18:1 [runtime-skeleton-security-public-method-drift]",
    );
    expect(buildDesktopV3RuntimeSkeletonGovernanceFailureMessage(summary)).toContain(
      "/tmp/runtime-skeleton-governance/summary.json",
    );
  });
});
