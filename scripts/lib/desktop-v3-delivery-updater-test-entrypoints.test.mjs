import { describe, expect, it } from "vitest";
import { listPrefixedTestFiles, readPackageJsonScripts } from "./test-entrypoint-helpers.mjs";

describe("desktop-v3 delivery/updater fast-test entrypoint", () => {
  it("keeps the delivery/updater fast-test script wired to the current document-chain contracts", async () => {
    const scripts = await readPackageJsonScripts();
    const script = scripts["test:desktop-v3-delivery-updater-docs"];

    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-docs-config.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-github-remote-proof-config.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-entry-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-proposal-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-active-docs-coverage.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-closeout-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-governance-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-github-actions-baseline.test.mjs");
    expect(script).toContain("scripts/lib/github-actions-remote-proof-cli.test.mjs");
    expect(script).toContain("scripts/lib/github-actions-remote-proof-runner.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-github-remote-proof.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-runbook-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-execution-baseline-docs.test.mjs");
    expect(script).toContain("scripts/lib/desktop-v3-delivery-updater-acceptance-docs.test.mjs");
  });

  it("keeps every delivery/updater-prefixed test file wired to the dedicated top-level entrypoint", async () => {
    const scripts = await readPackageJsonScripts();
    const script = scripts["test:desktop-v3-delivery-updater-docs"];
    const missing = listPrefixedTestFiles({
      prefixes: ["desktop-v3-delivery-updater"],
    }).filter((file) => !script.includes(file));

    expect(missing).toEqual([]);
  });
});
