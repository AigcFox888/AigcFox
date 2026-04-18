import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readPackageJsonScripts, readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater runbook docs", () => {
  it("keeps runbook reading order aligned with the active delivery/updater document chain", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const runbookPath = "docs/279-desktop-v3-delivery-updater-execution-runbook.md";
    const text = await readWorkspaceFile(config.rootDir, runbookPath);

    expect(text).toContain("docs/248-autonomous-execution-baseline.md");
    expect(text).toContain("docs/267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("docs/269-desktop-v3-tauri-2-governance-baseline.md");
    expect(text).toContain("docs/274-desktop-v3-delivery-updater-proposal.md");
    expect(text).toContain("docs/275-desktop-v3-delivery-updater-technical-baseline.md");
    expect(text).toContain("docs/276-desktop-v3-delivery-updater-detailed-design.md");
    expect(text).toContain("docs/277-desktop-v3-delivery-updater-execution-baseline.md");
    expect(text).toContain("docs/278-desktop-v3-delivery-updater-acceptance-matrix.md");
    expect(text).toContain("docs/280-desktop-v3-delivery-updater-closeout.md");
  });

  it("keeps runbook commands aligned with package scripts and summary outputs", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const scripts = await readPackageJsonScripts(config.rootDir);
    const runbookPath = "docs/279-desktop-v3-delivery-updater-execution-runbook.md";
    const text = await readWorkspaceFile(config.rootDir, runbookPath);
    const requiredScriptNames = [
      "test:desktop-v3-delivery-updater-docs",
      "qa:desktop-v3-delivery-updater-docs",
      "qa:desktop-v3-delivery-updater-github-remote-proof",
      "qa:github-actions-lint",
      "qa:governance-command-docs",
    ];

    for (const scriptName of requiredScriptNames) {
      expect(scripts[scriptName], `package.json should define ${scriptName}`).toEqual(expect.any(String));
      expect(text, `${runbookPath} should mention pnpm ${scriptName}`).toContain(`pnpm ${scriptName}`);
    }

    expect(text).toContain("output/verification/desktop-v3-delivery-updater-docs-<run-id>/summary.json");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-docs-summary.json");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json");
    expect(text).toContain("`remoteTrackingRef`");
    expect(text).toContain("`remoteTrackingHeadSha`");
    expect(text).toContain("`latestSuccessfulHeadSha`");
    expect(text).toContain("`latestSuccessfulRunId`");
    expect(text).toContain("`brokenLinks=[]`");
    expect(text).toContain("`forbiddenTerms=[]`");
    expect(text).toContain(".github/workflows/desktop-v3-delivery-updater-docs.yml");
    expect(text).toContain("`274 -> 280`");
    expect(text).toContain("latest summary 为准");
    expect(text).toContain("`origin/<branch>`");
    expect(text).toContain("fast-test entrypoint wiring");
  });
});
