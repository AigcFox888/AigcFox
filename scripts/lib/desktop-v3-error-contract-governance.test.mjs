import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3ErrorContractGovernanceFailureMessage,
  collectDesktopV3ErrorContractViolations,
  collectRustEnumVariantFieldsFromSource,
  createDesktopV3ErrorContractGovernanceSummary,
  desktopV3AllowedRustCommandErrorExternalReferenceFiles,
  desktopV3AllowedRustRuntimeErrorExternalReferenceFiles,
  resolveDesktopV3ErrorContractGovernanceConfig,
  rootDir,
} from "./desktop-v3-error-contract-governance.mjs";

describe("desktop-v3 error contract governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3ErrorContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_RUN_ID: "error-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("error-check");
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-error-contract-governance-error-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-error-contract-governance-summary.json"),
    );
    expect(config.allowedRustRuntimeErrorExternalReferenceFiles).toEqual(
      [...desktopV3AllowedRustRuntimeErrorExternalReferenceFiles],
    );
    expect(config.allowedRustCommandErrorExternalReferenceFiles).toEqual(
      [...desktopV3AllowedRustCommandErrorExternalReferenceFiles],
    );
  });
});

describe("desktop-v3 error contract governance helpers", () => {
  it("extracts RuntimeError::Backend field names from Rust source text", () => {
    const filePath = path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src", "error.rs");
    const fields = collectRustEnumVariantFieldsFromSource(
      [
        "pub enum RuntimeError {",
        "    Backend {",
        "        code: String,",
        "        message: String,",
        "        request_id: Option<String>,",
        "    },",
        "}",
      ].join("\n"),
      filePath,
      "RuntimeError",
      "Backend",
      { rootDir },
    );

    expect(fields.map((entry) => entry.name)).toEqual(["code", "message", "request_id"]);
  });
});

describe("desktop-v3 error contract governance scan", () => {
  it("flags field, mapping, and ownership drift", async () => {
    const config = resolveDesktopV3ErrorContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const rustErrorFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "error.rs");
    const rogueRustFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "rogue.rs");
    const rustFiles = [
      rustErrorFile,
      rogueRustFile,
      ...config.allowedRustRuntimeErrorExternalReferenceFiles.map((filePath) => path.join(config.rootDir, filePath)),
      ...config.allowedRustCommandErrorExternalReferenceFiles.map((filePath) => path.join(config.rootDir, filePath)),
    ];
    const fileContents = new Map([
      [
        rustErrorFile,
        [
          "use serde::Serialize;",
          "pub struct CommandError {",
          "    pub code: String,",
          "    pub message: String,",
          "}",
          "",
          "impl CommandError {",
          "    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {",
          '        Self { code: code.into(), message: message.into() }',
          "    }",
          "}",
          "",
          "pub enum RuntimeError {",
          "    InvalidPreferenceValue(String),",
          "    Backend {",
          "        code: String,",
          "        message: String,",
          "    },",
          "    Rogue(String),",
          "}",
          "",
          "impl From<RuntimeError> for CommandError {",
          "    fn from(value: RuntimeError) -> Self {",
          "        match value {",
          '            RuntimeError::InvalidPreferenceValue(message) => CommandError::new("invalid_request", message),',
          '            RuntimeError::Backend { code, message } => CommandError::new(code, message),',
          '            RuntimeError::Rogue(message) => CommandError::new("rogue", message),',
          "        }",
          "    }",
          "}",
        ].join("\n"),
      ],
      [rogueRustFile, "use crate::error::{CommandError, RuntimeError};"],
      [config.tsAppErrorAbsoluteFilePath, "export interface AppErrorShape { code: string; message: string; requestId?: string; }"],
      [
        config.tsNormalizeCommandErrorAbsoluteFilePath,
        [
          "interface CommandErrorPayload {",
          "  code?: string;",
          "  message?: string;",
          "}",
          "function fromPayload(payload: CommandErrorPayload) {",
          "  return payload;",
          "}",
        ].join("\n"),
      ],
      [config.tsTauriCommandRuntimeAbsoluteFilePath, "export class TauriCommandRuntime {}"],
    ]);

    for (const relativePath of config.allowedRustRuntimeErrorExternalReferenceFiles) {
      fileContents.set(path.join(config.rootDir, relativePath), "use crate::error::RuntimeError;");
    }

    for (const relativePath of config.allowedRustCommandErrorExternalReferenceFiles) {
      fileContents.set(path.join(config.rootDir, relativePath), "use crate::error::CommandError;");
    }

    const result = await collectDesktopV3ErrorContractViolations(config, {
      readFileImpl: async (filePath) => fileContents.get(filePath) ?? "",
      rustFilePaths: rustFiles,
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "rust-command-error-field-drift",
        "rust-runtime-error-variant-drift",
        "rust-command-error-reference-unexpected",
        "rust-runtime-error-reference-unexpected",
        "ts-app-error-shape-drift",
        "ts-command-error-payload-drift",
        "rust-error-mapping-drift",
        "ts-error-normalizer-drift",
        "ts-tauri-runtime-error-normalization-drift",
      ]),
    );
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src-tauri/src/rogue.rs",
          kind: "rust-command-error-reference-unexpected",
        }),
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/lib/errors/normalize-command-error.ts",
          kind: "ts-command-error-payload-drift",
        }),
      ]),
    );
  });

  it("keeps the current desktop-v3 error truth chain inside the frozen boundary", async () => {
    const config = resolveDesktopV3ErrorContractGovernanceConfig();
    const result = await collectDesktopV3ErrorContractViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFileCount).toBeGreaterThan(0);
    expect(result.rustCommandErrorFields).toEqual(
      expect.arrayContaining(["public:code", "public:message", "public:request_id"]),
    );
    expect(result.tsCommandErrorPayloadProperties).toEqual(
      expect.arrayContaining([
        "code?: string",
        "details?: Record<string, unknown>",
        "message?: string",
        "requestId?: string",
      ]),
    );
  });
});

describe("desktop-v3 error contract governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3ErrorContractGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_ERROR_CONTRACT_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3ErrorContractGovernanceSummary(config);

    summary.summaryPath = "/tmp/error-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "desktop-v3 RuntimeError -> CommandError mapping drifted away from the frozen Wave 1 snippet",
        filePath: "apps/desktop-v3/src-tauri/src/error.rs",
        kind: "rust-error-mapping-drift",
        line: 1,
      },
    ];

    expect(buildDesktopV3ErrorContractGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src-tauri/src/error.rs:1:1 [rust-error-mapping-drift]",
    );
    expect(buildDesktopV3ErrorContractGovernanceFailureMessage(summary)).toContain(
      "/tmp/error-governance/summary.json",
    );
  });
});
