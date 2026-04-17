import { describe, expect, it } from "vitest";
import { listPrefixedTestFiles, readPackageJsonScripts } from "./test-entrypoint-helpers.mjs";

describe("desktop-v3 Wave 1 fast-test entrypoint", () => {
  it("keeps the desktop fast-test script wired to the current readiness contracts", async () => {
    const scripts = await readPackageJsonScripts();
    const script = scripts["test:desktop-v3-wave1-readiness"];

    expect(script).toContain("scripts/lib/desktop-v3-github-actions-baseline.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-active-docs-coverage.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-acceptance-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-wave1-entry-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-entry-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-runbook-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-readme-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-smoke-diagnostics.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-smoke-summary-contract.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-smoke-summary-persistence.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-tauri-dev-smoke.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-tauri-dev-smoke-runner.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-wave1-readiness.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-packaged-app-smoke.test.mjs");
    expect(script).toContain("scripts/desktop-v3-responsive-smoke.test.mjs");
    expect(script).toContain("scripts/verify-desktop-v3-tauri-dev-smoke.test.mjs");
    expect(script).toContain("scripts/verify-desktop-v3-packaged-app-smoke.test.mjs");
    expect(script).toContain("scripts/verify-desktop-v3-wave1-readiness.test.mjs");
  });

  it("keeps every desktop-v3 Wave 1-prefixed test file wired to the dedicated top-level entrypoint", async () => {
    const scripts = await readPackageJsonScripts();
    const script = scripts["test:desktop-v3-wave1-readiness"];
    const missing = listPrefixedTestFiles({
      excludePrefixes: ["desktop-v3-delivery-updater"],
      prefixes: ["desktop-v3-"],
      topLevelNames: [
        "desktop-v3-responsive-smoke.test.mjs",
        "verify-desktop-v3-tauri-dev-smoke.test.mjs",
        "verify-desktop-v3-packaged-app-smoke.test.mjs",
        "verify-desktop-v3-wave1-readiness.test.mjs",
      ],
    }).filter((file) => !script.includes(file));

    expect(missing).toEqual([]);
  });
});
