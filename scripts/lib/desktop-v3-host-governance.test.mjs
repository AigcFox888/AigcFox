import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDesktopV3HostGovernanceFailureMessage,
  collectDesktopV3HostGovernanceEntriesFromSource,
  collectDesktopV3RustInitialRouteValuesFromSource,
  collectDesktopV3HostGovernanceViolations,
  createDesktopV3HostGovernanceSummary,
  desktopV3AllowedHostEnvBindings,
  desktopV3AllowedHostLogSignals,
  resolveDesktopV3HostGovernanceConfig,
  rootDir,
} from "./desktop-v3-host-governance.mjs";

function toBindingKeys(entries) {
  return entries.map((entry) => `${entry.filePath}:${entry.name}`).sort();
}

describe("desktop-v3 host governance config", () => {
  it("resolves verification output paths under output/verification", () => {
    const config = resolveDesktopV3HostGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_RUN_ID: "host-check",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(config.runId).toBe("host-check");
    expect(config.outputDir).toContain(
      path.join("output", "verification", "desktop-v3-host-governance-host-check"),
    );
    expect(config.latestSummaryPath).toContain(
      path.join("output", "verification", "latest", "desktop-v3-host-governance-summary.json"),
    );
    expect(toBindingKeys(config.allowedEnvBindings)).toEqual(
      toBindingKeys(desktopV3AllowedHostEnvBindings),
    );
    expect(config.allowedInitialRouteValues).toEqual(["/", "/diagnostics", "/preferences"]);
    expect(toBindingKeys(config.allowedLogSignals)).toEqual(
      toBindingKeys(desktopV3AllowedHostLogSignals),
    );
  });
});

describe("desktop-v3 host governance scan", () => {
  it("extracts host env bindings and log signals from source text", () => {
    const filePath = path.join(rootDir, "apps", "desktop-v3", "src-tauri", "src", "window", "telemetry.rs");
    const result = collectDesktopV3HostGovernanceEntriesFromSource(
      [
        'eprintln!("desktop-v3.main-window.navigation allowed={allowed} url={url}");',
        'let _ = "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE";',
      ].join("\n"),
      filePath,
      { rootDir },
    );

    expect(result.envBindings).toEqual([
      expect.objectContaining({
        filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs",
        name: "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE",
      }),
    ]);
    expect(result.logSignals).toEqual([
      expect.objectContaining({
        filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs",
        name: "desktop-v3.main-window.navigation",
      }),
    ]);
  });

  it("collects Rust host initial route values without reading test fixtures", () => {
    const sourceText = [
      'match normalized_route.as_deref() {',
      '  Some("/") | Some("/diagnostics") | Some("/preferences") => Ok(normalized_route),',
      '  Some(other) => Err(format!("broken {other}").into()),',
      '}',
      '',
      '#[cfg(test)]',
      'fn rejects_unknown_routes() {',
      '  assert_eq!(Some("/broken"), Some("/broken"));',
      '}',
    ].join("\n");

    expect(collectDesktopV3RustInitialRouteValuesFromSource(sourceText)).toEqual([
      "/",
      "/diagnostics",
      "/preferences",
    ]);
  });

  it("flags missing and unexpected env bindings and log signals", async () => {
    const config = resolveDesktopV3HostGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_RUN_ID: "unit",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const envFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "env.rs");
    const telemetryFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "window", "telemetry.rs");
    const routeRegistryFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "app", "router", "route-registry.ts");
    const windowInitialRouteFile = path.join(config.rootDir, "apps", "desktop-v3", "src-tauri", "src", "window", "initial_route.rs");
    const pageFile = path.join(config.rootDir, "apps", "desktop-v3", "src", "pages", "dashboard-page.tsx");
    const fileContents = new Map([
      [
        envFile,
        [
          'pub const BACKEND_BASE_URL_ENV: &str = "AIGCFOX_BACKEND_BASE_URL";',
          'pub const MAIN_WINDOW_TARGET_MODE_ENV: &str = "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE";',
        ].join("\n"),
      ],
      [
        telemetryFile,
        [
          'eprintln!("desktop-v3.main-window.navigation allowed={allowed} url={url}");',
          'eprintln!("desktop-v3.main-window.page-load event={event_name} url={url}");',
          'eprintln!("desktop-v3.main-window.trace url={url}");',
        ].join("\n"),
      ],
      [
        routeRegistryFile,
        'export type DesktopV3InitialRoute = "/" | "/diagnostics";\n',
      ],
      [
        windowInitialRouteFile,
        'match normalized_route.as_deref() { Some("/") | Some("/preferences") => Ok(normalized_route), Some(other) => Err(format!("{other}").into()), }\n',
      ],
      [
        pageFile,
        'const rogue = import.meta.env.VITE_DESKTOP_V3_EXPERIMENT;\n',
      ],
    ]);

    const result = await collectDesktopV3HostGovernanceViolations(config, {
      filePaths: [envFile, telemetryFile, pageFile],
      readFileImpl: async (filePath) => fileContents.get(filePath) ?? "",
    });

    expect(result.violations.map((violation) => violation.kind)).toEqual(
      expect.arrayContaining([
        "host-initial-route-truth-chain-drift",
        "host-window-initial-route-value-drift",
        "host-env-binding-missing",
        "host-env-binding-unexpected",
        "host-log-signal-missing",
        "renderer-initial-route-value-drift",
        "host-log-signal-unexpected",
      ]),
    );
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "apps/desktop-v3/src/app/router/route-registry.ts",
          kind: "renderer-initial-route-value-drift",
        }),
        expect.objectContaining({
          detail: expect.stringContaining("VITE_DESKTOP_V3_EXPERIMENT"),
          filePath: "apps/desktop-v3/src/pages/dashboard-page.tsx",
          kind: "host-env-binding-unexpected",
        }),
        expect.objectContaining({
          filePath: "apps/desktop-v3/src-tauri/src/window/initial_route.rs",
          kind: "host-initial-route-truth-chain-drift",
        }),
        expect.objectContaining({
          detail: expect.stringContaining("desktop-v3.main-window.trace"),
          filePath: "apps/desktop-v3/src-tauri/src/window/telemetry.rs",
          kind: "host-log-signal-unexpected",
        }),
      ]),
    );
  });

  it("keeps the current desktop-v3 host surface inside the frozen boundary", async () => {
    const config = resolveDesktopV3HostGovernanceConfig();
    const result = await collectDesktopV3HostGovernanceViolations(config);

    expect(result.violations).toEqual([]);
    expect(result.scannedFileCount).toBeGreaterThan(0);
    expect(result.allowedInitialRouteValues).toEqual(config.allowedInitialRouteValues);
    expect(toBindingKeys(result.envBindings)).toEqual(toBindingKeys(config.allowedEnvBindings));
    expect(toBindingKeys(result.logSignals)).toEqual(toBindingKeys(config.allowedLogSignals));
    expect(result.rendererInitialRouteValues).toEqual(config.allowedInitialRouteValues);
    expect(result.windowInitialRouteValues).toEqual(config.allowedInitialRouteValues);
  });
});

describe("desktop-v3 host governance summary", () => {
  it("formats failure output with a short violation preview", () => {
    const config = resolveDesktopV3HostGovernanceConfig({
      env: {
        AIGCFOX_DESKTOP_V3_HOST_GOVERNANCE_RUN_ID: "summary-test",
      },
      now: new Date("2026-04-18T00:00:00.000Z"),
    });
    const summary = createDesktopV3HostGovernanceSummary(config);

    summary.summaryPath = "/tmp/host-governance/summary.json";
    summary.violationCount = 1;
    summary.violations = [
      {
        column: 5,
        detail: "Unexpected desktop-v3 host env binding VITE_DESKTOP_V3_EXPERIMENT drifted into apps/desktop-v3/src/pages/dashboard-page.tsx. Rewrite the host boundary before adding new host surface.",
        filePath: "apps/desktop-v3/src/pages/dashboard-page.tsx",
        kind: "host-env-binding-unexpected",
        line: 12,
      },
    ];

    expect(buildDesktopV3HostGovernanceFailureMessage(summary)).toContain(
      "apps/desktop-v3/src/pages/dashboard-page.tsx:12:5 [host-env-binding-unexpected]",
    );
    expect(buildDesktopV3HostGovernanceFailureMessage(summary)).toContain(
      "/tmp/host-governance/summary.json",
    );
  });
});
