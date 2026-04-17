import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3LocaldbGovernanceFailureMessage,
  collectDesktopV3LocaldbGovernanceViolations,
  collectDesktopV3LocaldbMembersFromSource,
  createDesktopV3LocaldbGovernanceSummary,
  desktopV3LocaldbAllowedPublicMethods,
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
    expect(config.allowedPublicMethods).toEqual(desktopV3LocaldbAllowedPublicMethods);
  });
});

describe("desktop-v3 localdb governance scan", () => {
  it("flags public field widening, extra public methods, and restricted method visibility", async () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_LOCALDB_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const localdbFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "runtime", "localdb", "mod.rs");
    const sourceText = [
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

    const memberScan = collectDesktopV3LocaldbMembersFromSource(sourceText, localdbFile, {
      rootDir: config.rootDir,
    });
    expect(memberScan.methods.map((method) => `${method.visibility}:${method.name}`)).toEqual([
      "public:new",
      "public:list_preferences",
      "restricted:cache_snapshot",
      "private:open_connection",
    ]);

    const result = await collectDesktopV3LocaldbGovernanceViolations(config, {
      filePaths: [localdbFile],
      readFileImpl: async () => sourceText,
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual([
      "localdb-public-method-missing",
      "localdb-public-method-missing",
      "localdb-public-method-missing",
      "localdb-public-method-missing",
      "localdb-public-method-missing",
      "localdb-public-field",
      "localdb-public-method-expansion",
      "localdb-restricted-method-expansion",
    ]);
    expect(result.scannedFiles).toEqual([`${desktopV3LocaldbDir}/mod.rs`]);
  });

  it("keeps the current desktop-v3 localdb surface inside the frozen Wave 1 boundary", async () => {
    const config = resolveDesktopV3LocaldbGovernanceConfig();
    const result = await collectDesktopV3LocaldbGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFiles.length).toBeGreaterThan(0);
    expect(result.publicMethods.map((method) => method.name)).toEqual(desktopV3LocaldbAllowedPublicMethods);
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
