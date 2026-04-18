import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3RuntimeAdapterGovernanceFailureMessage,
  collectDesktopV3RuntimeAdapterGovernanceViolations,
  createDesktopV3RuntimeAdapterGovernanceSummary,
  desktopV3AllowedBridgeGlobalTouchFiles,
  desktopV3AllowedMockCommandRuntimeExternalReferenceFiles,
  desktopV3AllowedMockFixtureExports,
  desktopV3AllowedMockFixtureExternalReferenceFiles,
  desktopV3AllowedMockRuntimeExports,
  desktopV3AllowedMockRuntimeFieldSurface,
  desktopV3AllowedMockRuntimePublicMethods,
  desktopV3AllowedRuntimeModeExports,
  desktopV3AllowedRuntimeModeExternalReferenceFiles,
  desktopV3AllowedRuntimeModeValues,
  desktopV3AllowedRuntimeRegistryExports,
  desktopV3AllowedRuntimeRegistryExternalReferenceFiles,
  desktopV3AllowedTauriBridgeExports,
  desktopV3AllowedTauriBridgeExternalReferenceFiles,
  desktopV3AllowedTauriCommandRuntimeExports,
  desktopV3AllowedTauriCommandRuntimeExternalReferenceFiles,
  desktopV3AllowedTauriCommandRuntimeFieldSurface,
  desktopV3AllowedTauriCommandRuntimePrivateMethods,
  desktopV3AllowedTauriCommandRuntimePublicMethods,
  desktopV3AllowedTauriInvokeExports,
  desktopV3AllowedTauriInvokeExternalReferenceFiles,
  desktopV3AllowedTauriInvokeTypeText,
  desktopV3AllowedTauriTouchFiles,
  desktopV3RuntimeAdapterFileSet,
  resolveDesktopV3RuntimeAdapterGovernanceConfig,
  rootDir,
} from "./desktop-v3-runtime-adapter-governance.mjs";

function toSurface(entries) {
  return entries.map((entry) => `${entry.visibility}:${entry.name}`).sort();
}

describe("desktop-v3 runtime adapter governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3RuntimeAdapterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_RUN_ID: "runtime-adapter-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("runtime-adapter-check");
    expect(config.sourceDir).toBe(path.join(rootDir, "apps", "desktop-v3", "src"));
    expect(config.runtimeDir).toBe(path.join(rootDir, "apps", "desktop-v3", "src", "lib", "runtime"));
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-runtime-adapter-governance-runtime-adapter-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-runtime-adapter-governance-summary.json"),
    );
    expect(config.allowedRuntimeAdapterFiles).toEqual(desktopV3RuntimeAdapterFileSet);
    expect(config.allowedRuntimeRegistryExports).toEqual(desktopV3AllowedRuntimeRegistryExports);
    expect(config.allowedTauriCommandRuntimePrivateMethods).toEqual(
      desktopV3AllowedTauriCommandRuntimePrivateMethods,
    );
  });
});

describe("desktop-v3 runtime adapter governance scan", () => {
  it("flags file-set drift, adapter surface drift, Tauri touch drift, and ownership drift", async () => {
    const config = resolveDesktopV3RuntimeAdapterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const runtimeFiles = desktopV3RuntimeAdapterFileSet.map((filePath) => path.join(config.rootDir, filePath));
    const rogueRuntimeFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "lib", "runtime", "rogue.ts");
    const rogueAppFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "app", "rogue-runtime.ts");
    const files = new Map([
      [path.join(config.rootDir, "apps", "desktop-v3", "src", "lib", "runtime", "contracts.ts"), "export type ThemeMode = \"light\";"],
      [path.join(config.rootDir, "apps", "desktop-v3", "src", "lib", "runtime", "desktop-runtime.ts"), "export interface DesktopRuntime {}"],
      [path.join(config.rootDir, "apps", "desktop-v3", "src", "lib", "runtime", "tauri-command-types.ts"), "export interface DesktopCommandPayloadMap {}"],
      [
        config.mockRuntimeFilePath,
        [
          "export class MockCommandRuntime {",
          "  private lastBackendProbeAt: string | null = null;",
          "  private themeMode = \"system\";",
          "  getBackendLiveness() { return Promise.resolve(null); }",
          "  getBackendReadiness() { return Promise.resolve(null); }",
          "  getDiagnosticsSnapshot() { return Promise.resolve(null); }",
          "  getThemePreference() { return Promise.resolve(null); }",
          "  reportRendererBoot() { return Promise.resolve(); }",
          "  setThemePreference() { return Promise.resolve(null); }",
          "  reset() { return Promise.resolve(); }",
          "}",
        ].join("\n"),
      ],
      [
        config.mockFixtureFilePath,
        [
          "export function buildMockThemePreference() { return null; }",
          "export function buildMockDiagnosticsSnapshot() { return null; }",
          "export function buildMockBackendProbe() { return null; }",
          "export function buildRogueFixture() { return null; }",
        ].join("\n"),
      ],
      [
        config.runtimeModeFilePath,
        [
          "export type DesktopRuntimeMode = \"mock\" | \"tauri\" | \"browser\";",
          "export function normalizeDesktopRuntimeMode() { return null; }",
          "export function resolveDesktopRuntimeMode() { return \"tauri\"; }",
        ].join("\n"),
      ],
      [
        config.runtimeRegistryFilePath,
        [
          "window.__TAURI_INTERNALS__;",
          "export function getDesktopRuntime() { return null; }",
          "export function resetDesktopRuntimeForTest() {}",
          "export function setDesktopRuntime() {}",
        ].join("\n"),
      ],
      [
        config.tauriBridgeFilePath,
        [
          "import { invoke } from \"@tauri-apps/api/core\";",
          "export async function waitForTauriInvokeBridge() {}",
          "export async function loadTauriInvoke() { return invoke; }",
          "export async function probeTauriBridge() {}",
        ].join("\n"),
      ],
      [
        config.tauriCommandRuntimeFilePath,
        [
          "import { invoke } from \"@tauri-apps/api/core\";",
          "export class TauriCommandRuntime {",
          "  private invokePromise = null;",
          "  private loadInvoke = async () => invoke;",
          "  getBackendLiveness() { return Promise.resolve(null); }",
          "  getBackendReadiness() { return Promise.resolve(null); }",
          "  getDiagnosticsSnapshot() { return Promise.resolve(null); }",
          "  getThemePreference() { return Promise.resolve(null); }",
          "  reportRendererBoot() { return Promise.resolve(); }",
          "  setThemePreference() { return Promise.resolve(null); }",
          "  reset() { return Promise.resolve(); }",
          "  private getInvoke() { return this.loadInvoke(); }",
          "  private invokeCommand() { return Promise.resolve(null); }",
          "}",
        ].join("\n"),
      ],
      [
        config.tauriInvokeFilePath,
        "export type TauriInvoke = <TResult>(command: string, payload?: unknown) => Promise<TResult>;",
      ],
      [rogueRuntimeFile, "export const rogue = 1;"],
      [
        path.join(config.rootDir, "apps", "desktop-v3", "src", "app", "bootstrap", "renderer-ready.ts"),
        "import { getDesktopRuntime } from \"@/lib/runtime/runtime-registry\";\nimport { resolveDesktopRuntimeMode } from \"@/lib/runtime/runtime-mode\";\n",
      ],
      [
        path.join(config.rootDir, "apps", "desktop-v3", "src", "features", "diagnostics", "diagnostics-api.ts"),
        "import { getDesktopRuntime } from \"@/lib/runtime/runtime-registry\";\n",
      ],
      [
        path.join(config.rootDir, "apps", "desktop-v3", "src", "features", "preferences", "preferences-api.ts"),
        "import { getDesktopRuntime } from \"@/lib/runtime/runtime-registry\";\n",
      ],
      [
        rogueAppFile,
        [
          "import { getDesktopRuntime } from \"@/lib/runtime/runtime-registry\";",
          "import { resolveDesktopRuntimeMode } from \"@/lib/runtime/runtime-mode\";",
          "import { loadTauriInvoke } from \"@/lib/runtime/tauri-bridge\";",
          "import { TauriCommandRuntime } from \"@/lib/runtime/tauri-command-runtime\";",
          "import { MockCommandRuntime } from \"@/lib/runtime/mock-command-runtime\";",
          "import { buildMockThemePreference } from \"@/lib/runtime/mock-fixtures\";",
          "import type { TauriInvoke } from \"@/lib/runtime/tauri-invoke\";",
          "void getDesktopRuntime;",
          "void resolveDesktopRuntimeMode;",
          "void loadTauriInvoke;",
          "void TauriCommandRuntime;",
          "void MockCommandRuntime;",
          "void buildMockThemePreference;",
          "let invokeType: TauriInvoke | null = null;",
          "void invokeType;",
        ].join("\n"),
      ],
    ]);

    const result = await collectDesktopV3RuntimeAdapterGovernanceViolations(config, {
      readFileImpl: async (filePath) => files.get(filePath) ?? "",
      runtimeFilePaths: [...runtimeFiles, rogueRuntimeFile],
      sourceFilePaths: [...runtimeFiles, rogueRuntimeFile, rogueAppFile,
        path.join(config.rootDir, "apps", "desktop-v3", "src", "app", "bootstrap", "renderer-ready.ts"),
        path.join(config.rootDir, "apps", "desktop-v3", "src", "features", "diagnostics", "diagnostics-api.ts"),
        path.join(config.rootDir, "apps", "desktop-v3", "src", "features", "preferences", "preferences-api.ts")],
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "runtime-adapter-file-set-drift",
        "runtime-adapter-mock-runtime-public-method-drift",
        "runtime-adapter-mock-fixture-export-drift",
        "runtime-adapter-runtime-mode-value-drift",
        "runtime-adapter-runtime-registry-export-drift",
        "runtime-adapter-tauri-bridge-export-drift",
        "runtime-adapter-tauri-command-runtime-public-method-drift",
        "runtime-adapter-tauri-invoke-type-drift",
        "runtime-adapter-tauri-touch-drift",
        "runtime-adapter-bridge-global-drift",
        "runtime-adapter-runtime-registry-reference-drift",
        "runtime-adapter-runtime-mode-reference-drift",
        "runtime-adapter-tauri-bridge-reference-drift",
        "runtime-adapter-tauri-command-runtime-reference-drift",
        "runtime-adapter-mock-command-runtime-reference-drift",
        "runtime-adapter-mock-fixture-reference-drift",
        "runtime-adapter-tauri-invoke-reference-drift",
      ]),
    );
    expect(result.runtimeFiles).toContain("apps/desktop-v3/src/lib/runtime/rogue.ts");
  });

  it("keeps the current desktop-v3 runtime adapter layer frozen", async () => {
    const config = resolveDesktopV3RuntimeAdapterGovernanceConfig();
    const result = await collectDesktopV3RuntimeAdapterGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.runtimeFiles).toEqual(desktopV3RuntimeAdapterFileSet);
    expect(result.mockRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`)).toEqual(
      desktopV3AllowedMockRuntimeExports,
    );
    expect(toSurface(result.mockRuntimeFields)).toEqual(desktopV3AllowedMockRuntimeFieldSurface);
    expect(result.mockRuntimeMethods.map((entry) => entry.name).sort()).toEqual(
      [...desktopV3AllowedMockRuntimePublicMethods].sort(),
    );
    expect(result.mockFixtureExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedMockFixtureExports].sort(),
    );
    expect(result.runtimeModeExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedRuntimeModeExports].sort(),
    );
    expect(result.runtimeModeValues).toEqual(desktopV3AllowedRuntimeModeValues);
    expect(result.runtimeRegistryExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedRuntimeRegistryExports].sort(),
    );
    expect(result.tauriBridgeExports.map((entry) => `${entry.kind}:${entry.name}`).sort()).toEqual(
      [...desktopV3AllowedTauriBridgeExports].sort(),
    );
    expect(result.tauriCommandRuntimeExports.map((entry) => `${entry.kind}:${entry.name}`)).toEqual(
      desktopV3AllowedTauriCommandRuntimeExports,
    );
    expect(toSurface(result.tauriCommandRuntimeFields)).toEqual(
      desktopV3AllowedTauriCommandRuntimeFieldSurface,
    );
    expect(result.tauriCommandRuntimeMethods.filter((entry) => entry.visibility === "public").map((entry) => entry.name).sort()).toEqual(
      [...desktopV3AllowedTauriCommandRuntimePublicMethods].sort(),
    );
    expect(result.tauriCommandRuntimeMethods.filter((entry) => entry.visibility === "private").map((entry) => entry.name).sort()).toEqual(
      [...desktopV3AllowedTauriCommandRuntimePrivateMethods].sort(),
    );
    expect(result.tauriInvokeExports.map((entry) => `${entry.kind}:${entry.name}`)).toEqual(
      desktopV3AllowedTauriInvokeExports,
    );
    expect(result.tauriInvokeType?.typeText).toBe(desktopV3AllowedTauriInvokeTypeText);
    expect(result.tauriTouchFiles).toEqual(desktopV3AllowedTauriTouchFiles);
    expect(result.bridgeGlobalTouchFiles).toEqual(desktopV3AllowedBridgeGlobalTouchFiles);
    expect(result.runtimeRegistryReferenceFiles).toEqual(
      desktopV3AllowedRuntimeRegistryExternalReferenceFiles,
    );
    expect(result.runtimeModeReferenceFiles).toEqual(
      desktopV3AllowedRuntimeModeExternalReferenceFiles,
    );
    expect(result.tauriBridgeReferenceFiles).toEqual(
      desktopV3AllowedTauriBridgeExternalReferenceFiles,
    );
    expect(result.tauriCommandRuntimeReferenceFiles).toEqual(
      desktopV3AllowedTauriCommandRuntimeExternalReferenceFiles,
    );
    expect(result.mockCommandRuntimeReferenceFiles).toEqual(
      desktopV3AllowedMockCommandRuntimeExternalReferenceFiles,
    );
    expect(result.mockFixtureReferenceFiles).toEqual(
      desktopV3AllowedMockFixtureExternalReferenceFiles,
    );
    expect(result.tauriInvokeReferenceFiles).toEqual(
      desktopV3AllowedTauriInvokeExternalReferenceFiles,
    );
  });
});

describe("desktop-v3 runtime adapter governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3RuntimeAdapterGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_ADAPTER_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3RuntimeAdapterGovernanceSummary(config);

    summary.summaryPath = "/tmp/runtime-adapter-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 1,
        detail: "runtime-registry escaped the frozen Wave 1 adapter ownership boundary.",
        filePath: "apps/desktop-v3/src/app/rogue-runtime.ts",
        kind: "runtime-adapter-runtime-registry-reference-drift",
        line: 2,
      },
    ];

    expect(buildDesktopV3RuntimeAdapterGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src/app/rogue-runtime.ts:2:1 [runtime-adapter-runtime-registry-reference-drift]",
    );
    expect(buildDesktopV3RuntimeAdapterGovernanceFailureMessage(summary)).toContain(
      "/tmp/runtime-adapter-governance/summary.json",
    );
  });
});
