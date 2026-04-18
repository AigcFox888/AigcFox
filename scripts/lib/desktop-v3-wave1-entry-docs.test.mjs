import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 Wave 1 entry docs", () => {
  it("keeps docs README aligned with the desktop Wave 1 source-of-truth reading path", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const readmePath = "docs/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("248-autonomous-execution-baseline.md");
    expect(text).toContain("257-desktop-v3-replatform-proposal.md");
    expect(text).toContain("258-desktop-v3-technical-baseline.md");
    expect(text).toContain("259-desktop-v3-detailed-design.md");
    expect(text).toContain("269-desktop-v3-tauri-2-governance-baseline.md");
    expect(text).toContain("260-desktop-v3-wave1-execution-baseline.md");
    expect(text).toContain("263-desktop-v3-wave1-acceptance-matrix.md");
    expect(text).toContain("264-desktop-v3-wave1-execution-runbook.md");
    expect(text).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("268-desktop-v3-clean-pr-closeout.md");
    expect(text).toContain("ui-client/system.md");
    expect(text).toContain("ui-client/layout.md");
    expect(text).toContain("ui-client/components.md");
    expect(text).toContain("ui-client/interaction.md");
    expect(text).toContain("ui-client/charts.md");
    expect(text).toContain("../apps/desktop-v3/README.md");
  });

  it("keeps AGENTS aligned with the desktop Wave 1 skeleton reading path and allowed scope", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const agentsPath = "AGENTS.md";
    const text = await readWorkspaceFile(config.rootDir, agentsPath);

    expect(text).toContain("docs/README.md");
    expect(text).toContain("docs/248-autonomous-execution-baseline.md");
    expect(text).toContain("docs/257-desktop-v3-replatform-proposal.md");
    expect(text).toContain("docs/258-desktop-v3-technical-baseline.md");
    expect(text).toContain("docs/259-desktop-v3-detailed-design.md");
    expect(text).toContain("docs/269-desktop-v3-tauri-2-governance-baseline.md");
    expect(text).toContain("docs/260-desktop-v3-wave1-execution-baseline.md");
    expect(text).toContain("docs/263-desktop-v3-wave1-acceptance-matrix.md");
    expect(text).toContain("docs/264-desktop-v3-wave1-execution-runbook.md");
    expect(text).toContain("docs/267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("docs/268-desktop-v3-clean-pr-closeout.md");
    expect(text).toContain("docs/ui-client/system.md");
    expect(text).toContain("docs/ui-client/layout.md");
    expect(text).toContain("docs/ui-client/components.md");
    expect(text).toContain("docs/ui-client/interaction.md");
    expect(text).toContain("docs/ui-client/charts.md");
    expect(text).toContain("Tauri 窗口壳层、路由壳层、布局壳层");
    expect(text).toContain("React -> Tauri commands -> Rust -> Go API");
    expect(text).toContain("`Tauri 2` capability / permission / config / updater 的治理基线");
  });
});
