import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater entry docs", () => {
  it("keeps docs README aligned with the delivery/updater verification entrypoints", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const readmePath = "docs/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("desktop-v3 Delivery / Updater Baseline");
    expect(text).toContain("281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(text).toContain("248-autonomous-execution-baseline.md");
    expect(text).toContain("274-desktop-v3-delivery-updater-proposal.md");
    expect(text).toContain("279-desktop-v3-delivery-updater-execution-runbook.md");
    expect(text).toContain("280-desktop-v3-delivery-updater-closeout.md");
    expect(text).toContain("当前 `desktop-v3 Delivery / Updater Baseline` 已完成本地与远端 proof 收口");
    expect(text).toContain("pnpm test:desktop-v3-delivery-updater-docs");
    expect(text).toContain("pnpm qa:desktop-v3-delivery-updater-docs");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-docs-summary.json");
    expect(text).toContain("pnpm qa:desktop-v3-delivery-updater-github-remote-proof");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json");
  });

  it("keeps AGENTS aligned with the current delivery/updater source-of-truth boundary", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const agentsPath = "AGENTS.md";
    const text = await readWorkspaceFile(config.rootDir, agentsPath);

    expect(text).toContain("desktop active documentation line 是 `desktop-v3 Delivery / Updater Baseline`");
    expect(text).toContain("当前 `desktop-v3 Delivery / Updater Baseline` 已完成本地与远端 proof 收口");
    expect(text).toContain("docs/281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(text).toContain("docs/248-autonomous-execution-baseline.md");
    expect(text).toContain("docs/267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("docs/269-desktop-v3-tauri-2-governance-baseline.md");
    expect(text).toContain("docs/274-desktop-v3-delivery-updater-proposal.md");
    expect(text).toContain("docs/279-desktop-v3-delivery-updater-execution-runbook.md");
    expect(text).toContain("docs/280-desktop-v3-delivery-updater-closeout.md");
    expect(text).toContain("后续仍只允许做文档维护、治理修订和 proof 回归，不允许直接跳进实现");
  });
});
