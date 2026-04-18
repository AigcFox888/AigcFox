import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3RuntimeBoundaryFailureMessage,
  collectDesktopV3RuntimeBoundaryViolations,
  collectDesktopV3RuntimeBoundaryViolationsFromSource,
  createDesktopV3RuntimeBoundarySummary,
  desktopV3RuntimeBoundaryAllowedDir,
  resolveDesktopV3RuntimeBoundaryConfig,
  rootDir,
} from "./desktop-v3-runtime-boundary.mjs";

describe("desktop-v3 runtime boundary config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3RuntimeBoundaryConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_RUN_ID: "runtime-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("runtime-check");
    expect(config.sourceDir).toBe(path.join(rootDir, "apps", "desktop-v3", "src"));
    expect(config.allowedDir).toBe(path.join(rootDir, "apps", "desktop-v3", "src", "lib", "runtime"));
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-runtime-boundary-runtime-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-runtime-boundary-summary.json"),
    );
  });
});

describe("desktop-v3 runtime boundary scan", () => {
  it("flags direct Tauri imports, dynamic imports, invoke calls, and global bridges outside runtime", async () => {
    const config = resolveDesktopV3RuntimeBoundaryConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const runtimeFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "lib", "runtime", "safe.ts");
    const pageFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "pages", "bad.tsx");
    const fileContents = new Map([
      [
        runtimeFile,
        "import { invoke } from '@tauri-apps/api/core';\nexport async function safe(){ return invoke('ok'); }\n",
      ],
      [
        pageFile,
        [
          "import { invoke } from '@tauri-apps/api/core';",
          "export async function broken() {",
          "  await import('@tauri-apps/plugin-shell');",
          "  window['__TAURI_INTERNALS__'];",
          "  return invoke('desktop_get_backend_liveness');",
          "}",
        ].join("\n"),
      ],
    ]);

    const result = await collectDesktopV3RuntimeBoundaryViolations(config, {
      filePaths: [runtimeFile, pageFile],
      readFileImpl: async (filePath) => fileContents.get(filePath) ?? "",
    });

    expect(result.scannedFiles).toEqual(["apps/desktop-v3/src/pages/bad.tsx"]);
    expect(result.violations.map((violation) => violation.kind)).toEqual([
      "tauri-package-import",
      "tauri-dynamic-import",
      "tauri-global-bridge",
      "tauri-direct-invoke",
    ]);
  });

  it("reports import type usage and preserves workspace-relative file paths", () => {
    const filePath = path.join(rootDir, "apps", "desktop-v3", "src", "features", "typed.ts");
    const violations = collectDesktopV3RuntimeBoundaryViolationsFromSource(
      'type InvokeResult = import("@tauri-apps/api/core").InvokeArgs;\n',
      filePath,
      { rootDir },
    );

    expect(violations).toEqual([
      expect.objectContaining({
        detail: `Only ${desktopV3RuntimeBoundaryAllowedDir} may use import type @tauri-apps/api/core.`,
        filePath: "apps/desktop-v3/src/features/typed.ts",
        kind: "tauri-package-import-type",
      }),
    ]);
  });

  it("keeps the current desktop-v3 workspace free of runtime-boundary violations", async () => {
    const config = resolveDesktopV3RuntimeBoundaryConfig();
    const result = await collectDesktopV3RuntimeBoundaryViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFiles.length).toBeGreaterThan(0);
  });
});

describe("desktop-v3 runtime boundary summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3RuntimeBoundaryConfig({
      env: {
        AIGCFOX_DESKTOP_V3_RUNTIME_BOUNDARY_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3RuntimeBoundarySummary(config);

    summary.summaryPath = "/tmp/runtime-boundary/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 2,
        detail: "Only apps/desktop-v3/src/lib/runtime may call invoke() directly.",
        filePath: "apps/desktop-v3/src/pages/bad.tsx",
        kind: "tauri-direct-invoke",
        line: 8,
      },
    ];

    expect(buildDesktopV3RuntimeBoundaryFailureMessage(summary)).toContain(
      "apps/desktop-v3/src/pages/bad.tsx:8:2 [tauri-direct-invoke]",
    );
    expect(buildDesktopV3RuntimeBoundaryFailureMessage(summary)).toContain("/tmp/runtime-boundary/summary.json");
  });
});
