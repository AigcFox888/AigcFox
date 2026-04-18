import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3LocaldbGovernanceFailureMessage,
  collectDesktopV3LocaldbGovernanceViolations,
  collectDesktopV3LocaldbMembersFromSource,
  desktopV3LocaldbAllowedExternalReferenceFiles,
  desktopV3LocaldbAllowedFiles,
  createDesktopV3LocaldbGovernanceSummary,
  desktopV3LocaldbAllowedPublicMethods,
  desktopV3LocaldbAllowedSqliteTouchFiles,
  desktopV3LocaldbDir,
  resolveDesktopV3LocaldbGovernanceConfig,
  rootDir,
} from "./desktop-v3-localdb-governance.mjs";

describe("desktop-v3 localdb governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_RUN_ID: "localdb-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("localdb-check");
    expect(config.localdbDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src", "runtime", "localdb"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-localdb-governance-localdb-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-localdb-governance-summary.json"),
    );
    expect(config.allowedExternalReferenceFiles).toEqual(desktopV3LocaldbAllowedExternalReferenceFiles);
    expect(config.allowedLocaldbFiles).toEqual(desktopV3LocaldbAllowedFiles);
    expect(config.allowedPublicMethods).toEqual(desktopV3LocaldbAllowedPublicMethods);
    expect(config.allowedSqliteTouchFiles).toEqual(desktopV3LocaldbAllowedSqliteTouchFiles);
  });
});

describe("desktop-v3 localdb governance scan", () => {
  it("flags localdb file-set drift, SQLite boundary drift, and LocalDatabase boundary drift", async () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const localdbFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "localdb",
      "mod.rs",
    );
    const migrationsFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "localdb",
      "migrations.rs",
    );
    const extraLocaldbFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "localdb",
      "adapter.rs",
    );
    const errorFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "error.rs");
    const runtimeFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "runtime", "mod.rs");
    const rogueRuntimeFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "runtime",
      "diagnostics.rs",
    );
    const commandFile = path.join(
      config.rootDir,
      "apps",
      "desktop-v3",
      "src-tauri",
      "src",
      "commands",
      "preferences.rs",
    );
    const localdbSourceText = [
      "use rusqlite::Connection;",
      "",
      "pub struct LocalDatabase {",
      "    pub path: PathBuf,",
      "}",
      "",
      "impl LocalDatabase {",
      "    pub fn new(path: PathBuf) -> Self {",
      "        Self { path }",
      "    }",
      "",
      "    pub fn list_preferences(&self) -> Result<(), RuntimeError> {",
      "        Ok(())",
      "    }",
      "",
      "    pub(crate) fn cache_snapshot(&self) -> Result<(), RuntimeError> {",
      "        Ok(())",
      "    }",
      "",
      "    fn open_connection(&self) -> Result<(), RuntimeError> {",
      "        Ok(())",
      "    }",
      "}",
    ].join("\n");
    const migrationsSourceText = [
      "use rusqlite_migration::{M, Migrations};",
      "",
      "pub fn desktop_v3_migrations() -> Migrations<'static> {",
      "    Migrations::new(vec![M::up(\"CREATE TABLE foo (id TEXT PRIMARY KEY);\")])",
      "}",
    ].join("\n");
    const extraLocaldbSourceText = [
      "pub fn future_adapter() {}",
    ].join("\n");
    const errorSourceText = [
      "pub enum RuntimeError {",
      "    Database(#[from] rusqlite::Error),",
      "}",
    ].join("\n");
    const runtimeSourceText = [
      "use crate::runtime::localdb::LocalDatabase;",
      "",
      "pub struct DesktopRuntime {",
      "    local_database: LocalDatabase,",
      "}",
    ].join("\n");
    const rogueRuntimeSourceText = [
      "use crate::runtime::localdb::LocalDatabase;",
      "use rusqlite::Connection;",
      "",
      "pub fn leak_boundary(database: &LocalDatabase) {",
      "    let _ = Connection::open_in_memory();",
      "    let _ = database;",
      "}",
    ].join("\n");
    const commandSourceText = [
      "use crate::runtime::localdb::LocalDatabase;",
      "",
      "pub fn drift(database: &LocalDatabase) {",
      "    let _ = database;",
      "}",
    ].join("\n");

    const memberScan = collectDesktopV3LocaldbMembersFromSource(localdbSourceText, localdbFile, {
      rootDir: config.rootDir,
    });
    expect(memberScan.methods.map((method) => `${method.visibility}:${method.name}`)).toEqual([
      "public:new",
      "public:list_preferences",
      "restricted:cache_snapshot",
      "private:open_connection",
    ]);

    const result = await collectDesktopV3LocaldbGovernanceViolations(config, {
      filePaths: [localdbFile, migrationsFile, extraLocaldbFile],
      readFileImpl: async (filePath) => {
        if (filePath === localdbFile) {
          return localdbSourceText;
        }

        if (filePath === migrationsFile) {
          return migrationsSourceText;
        }

        if (filePath === extraLocaldbFile) {
          return extraLocaldbSourceText;
        }

        if (filePath === errorFile) {
          return errorSourceText;
        }

        if (filePath === runtimeFile) {
          return runtimeSourceText;
        }

        if (filePath === rogueRuntimeFile) {
          return rogueRuntimeSourceText;
        }

        if (filePath === commandFile) {
          return commandSourceText;
        }

        return "";
      },
      rustSourceFilePaths: [
        commandFile,
        errorFile,
        extraLocaldbFile,
        localdbFile,
        migrationsFile,
        rogueRuntimeFile,
        runtimeFile,
      ],
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "localdb-command-import-drift",
        "localdb-file-expansion",
        "localdb-public-field",
        "localdb-public-method-expansion",
        "localdb-public-method-missing",
        "localdb-reference-file-expansion",
        "localdb-restricted-method-expansion",
        "localdb-sqlite-touch-expansion",
      ]),
    );
    expect(result.localdbFiles).toEqual([
      `${desktopV3LocaldbDir}/adapter.rs`,
      `${desktopV3LocaldbDir}/migrations.rs`,
      `${desktopV3LocaldbDir}/mod.rs`,
    ]);
    expect(result.scannedFiles).toEqual([
      "apps/desktop-v3/src-tauri/src/commands/preferences.rs",
      "apps/desktop-v3/src-tauri/src/error.rs",
      "apps/desktop-v3/src-tauri/src/runtime/diagnostics.rs",
      `${desktopV3LocaldbDir}/adapter.rs`,
      `${desktopV3LocaldbDir}/migrations.rs`,
      `${desktopV3LocaldbDir}/mod.rs`,
      "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
    ]);
  });

  it("keeps the current desktop-v3 localdb surface inside the frozen Wave 1 boundary", async () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig();
    const result = await collectDesktopV3LocaldbGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.localdbFiles).toEqual(desktopV3LocaldbAllowedFiles);
    expect(result.scannedFiles.length).toBeGreaterThan(result.localdbFiles.length);
    expect(result.publicMethods.map((method) => method.name)).toEqual(desktopV3LocaldbAllowedPublicMethods);
    expect(result.sqliteTouchFiles).toEqual(desktopV3LocaldbAllowedSqliteTouchFiles);
    expect(result.externalLocaldbReferenceFiles).toEqual(desktopV3LocaldbAllowedExternalReferenceFiles);
    expect(result.restrictedMethods).toEqual([]);
    expect(result.missingPublicMethods).toEqual([]);
  });
});

describe("desktop-v3 localdb governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3LocaldbGovernanceSummary(config);

    summary.summaryPath = "/tmp/localdb-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "LocalDatabase public method list_preferences is outside the frozen Wave 1 surface.",
        filePath: "apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs",
        kind: "localdb-public-method-expansion",
        line: 42,
      },
    ];

    expect(buildDesktopV3LocaldbGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/src/runtime/localdb/mod.rs:42:1 [localdb-public-method-expansion]",
    );
    expect(buildDesktopV3LocaldbGovernanceFailureMessage(summary)).toContain(
      "/tmp/localdb-governance/summary.json",
    );
  });
});
