import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 entry docs", () => {
  it("keeps the root README aligned with the current host preflight and workflow surface", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const text = await readWorkspaceFile(config.rootDir, "README.md");

    expect(text).toContain("Windows + WSL2");
    expect(text).toContain("当前根命令");
    expect(text).toContain("pnpm qa:rust-host-readiness");
    expect(text).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:github-actions-lint");
    expect(text).toContain("pnpm qa:governance-command-docs");
    expect(text).toContain("desktop-v3-ci");
    expect(text).toContain("desktop-v3-package");
  });

  it("keeps docs README aligned with the desktop clean closeout entry", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const readmePath = "docs/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("desktop-v3 Wave 1 Skeleton");
    expect(text).toContain("248-autonomous-execution-baseline.md");
    expect(text).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("268-desktop-v3-clean-pr-closeout.md");
    expect(text).toContain("ui-client/system.md");
    expect(text).toContain("ui-client/layout.md");
    expect(text).toContain("ui-client/components.md");
    expect(text).toContain("ui-client/interaction.md");
    expect(text).toContain("ui-client/charts.md");
    expect(text).toContain("../apps/desktop-v3/README.md");
  });

  it("keeps the desktop GitHub baseline and clean PR closeout aligned", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const githubBaselinePath = "docs/267-desktop-v3-github-actions-baseline.md";
    const closeoutPath = "docs/268-desktop-v3-clean-pr-closeout.md";
    const [githubBaselineText, closeoutText] = await Promise.all([
      readWorkspaceFile(config.rootDir, githubBaselinePath),
      readWorkspaceFile(config.rootDir, closeoutPath),
    ]);

    expect(githubBaselineText).toContain("必须从 `dev` 重建 clean branch");
    expect(githubBaselineText).toContain("旧 PR 必须明确标记为 superseded 并关闭");
    expect(closeoutText).toContain("feature/desktop-v3-wave1-clean");
    expect(closeoutText).toContain("PR：`#2`");
    expect(closeoutText).toContain("AGENTS.md");
    expect(closeoutText).toContain("docs/README.md");
    expect(closeoutText).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(closeoutText).toContain("desktop-v3 Wave 1 Skeleton");
  });
});
