import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3BackendClientGovernanceFailureMessage,
  collectDesktopV3BackendClientGovernanceViolations,
  createDesktopV3BackendClientGovernanceSummary,
  desktopV3AllowedBackendClientFiles,
  desktopV3AllowedBackendClientPublicMethods,
  resolveDesktopV3BackendClientGovernanceConfig,
  rootDir,
} from "./desktop-v3-backend-client-governance.mjs";

describe("desktop-v3 backend-client governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3BackendClientGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_RUN_ID: "backend-client-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("backend-client-check");
    expect(config.rustSourceDir).toBe(
      path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src"),
    );
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-backend-client-governance-backend-client-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-backend-client-governance-summary.json"),
    );
    expect(config.allowedFiles).toEqual(desktopV3AllowedBackendClientFiles);
    expect(config.allowedPublicMethods).toEqual(desktopV3AllowedBackendClientPublicMethods);
  });
});

describe("desktop-v3 backend-client governance scan", () => {
  it("flags client file drift, method drift, contract drift, endpoint drift, and external ref drift", async () => {
    const config = resolveDesktopV3BackendClientGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const files = new Map([
      [
        path.join(config.rustSourceDir, "runtime", "client", "mod.rs"),
        [
          "pub mod backend_client;",
          "pub mod business_client;",
          "pub(crate) mod probe_contract;",
        ].join("\n"),
      ],
      [
        path.join(config.rustSourceDir, "runtime", "client", "backend_client.rs"),
        [
          "use reqwest::Url;",
          "use crate::runtime::client::probe_contract::{BackendEnvelope, BackendProbeData, parse_backend_probe_envelope};",
          "use crate::runtime::models::BackendProbe;",
          "",
          "pub struct BackendClient;",
          "",
          "impl BackendClient {",
          "    pub fn new(base_url: String) -> Result<Self, RuntimeError> { unimplemented!() }",
          "    pub fn base_url(&self) -> String { String::new() }",
          "    pub async fn get_liveness(&self) -> Result<BackendProbe, RuntimeError> {",
          "        self.get_probe(\"/api/v1/healthz\").await",
          "    }",
          "    pub async fn get_readiness(&self) -> Result<BackendProbe, RuntimeError> {",
          "        self.get_probe(\"/readyz\").await",
          "    }",
          "    pub async fn get_catalog(&self) -> Result<BackendProbe, RuntimeError> {",
          "        self.get_probe(\"/api/v1/catalog\").await",
          "    }",
          "    pub(crate) fn leak(&self) {}",
          "    async fn get_probe(&self, path: &str) -> Result<BackendProbe, RuntimeError> { unimplemented!() }",
          "    fn build_request(&self) {}",
          "}",
        ].join("\n"),
      ],
      [
        path.join(config.rustSourceDir, "runtime", "client", "probe_contract.rs"),
        [
          "use reqwest::StatusCode;",
          "",
          "pub struct BackendEnvelope<T> { pub ok: bool, pub data: Option<T> }",
          "pub struct BackendMeta { pub request_id: Option<String> }",
          "pub struct BackendErrorPayload { pub code: String }",
          "pub struct BackendProbeData { pub service: String, pub status: String }",
          "pub struct BackendCatalogData { pub name: String }",
          "",
          "pub fn parse_backend_probe_envelope() {}",
          "pub fn parse_backend_catalog_envelope() {}",
          "pub(crate) fn leak_contract() {}",
          "fn build_backend_error() {}",
          "fn normalize_catalog() {}",
        ].join("\n"),
      ],
      [
        path.join(config.rustSourceDir, "runtime", "mod.rs"),
        "use crate::runtime::client::backend_client::BackendClient;",
      ],
      [
        path.join(config.rustSourceDir, "commands", "backend.rs"),
        [
          "use reqwest::StatusCode;",
          "use crate::runtime::client::backend_client::BackendClient;",
          "use crate::runtime::client::probe_contract::BackendEnvelope;",
        ].join("\n"),
      ],
      [
        path.join(config.rustSourceDir, "error.rs"),
        "pub enum RuntimeError { Http(reqwest::Error) }",
      ],
      [
        path.join(config.rustSourceDir, "runtime", "client", "catalog_client.rs"),
        "pub struct CatalogClient;",
      ],
    ]);

    const result = await collectDesktopV3BackendClientGovernanceViolations(config, {
      filePaths: Array.from(files.keys()),
      readFileImpl: async (filePath) => files.get(filePath) ?? "",
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "backend-client-file-expansion",
        "backend-client-module-drift",
        "backend-client-public-method-drift",
        "backend-client-restricted-method",
        "backend-client-private-method-drift",
        "backend-client-probe-path-drift",
        "backend-client-contract-type-drift",
        "backend-client-contract-function-drift",
        "backend-client-contract-function-restricted",
        "backend-client-contract-private-helper-drift",
        "backend-client-reqwest-touch-drift",
        "backend-client-external-reference-drift",
        "backend-client-contract-reference-drift",
      ]),
    );
    expect(result.clientFiles).toContain("apps/desktop-v3/src-tauri/src/runtime/client/catalog_client.rs");
  });

  it("keeps the current remote client boundary inside the frozen Wave 1 probe-only surface", async () => {
    const config = resolveDesktopV3BackendClientGovernanceConfig();
    const result = await collectDesktopV3BackendClientGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.clientFiles).toEqual(desktopV3AllowedBackendClientFiles);
    expect(result.backendClientMethods.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(["base_url", "get_liveness", "get_probe", "get_readiness", "new"]),
    );
    expect(result.reqwestTouchFiles).toEqual([
      "apps/desktop-v3/src-tauri/src/error.rs",
      "apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs",
      "apps/desktop-v3/src-tauri/src/runtime/client/probe_contract.rs",
    ]);
    expect(result.backendClientReferenceFiles).toEqual([
      "apps/desktop-v3/src-tauri/src/runtime/mod.rs",
    ]);
  });
});

describe("desktop-v3 backend-client governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3BackendClientGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_BACKEND_CLIENT_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3BackendClientGovernanceSummary(config);

    summary.summaryPath = "/tmp/backend-client-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "BackendClient public methods drifted from the frozen Wave 1 set.",
        filePath: "apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs",
        kind: "backend-client-public-method-drift",
        line: 8,
      },
    ];

    expect(buildDesktopV3BackendClientGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/src/runtime/client/backend_client.rs:8:1 [backend-client-public-method-drift]",
    );
    expect(buildDesktopV3BackendClientGovernanceFailureMessage(summary)).toContain(
      "/tmp/backend-client-governance/summary.json",
    );
  });
});
