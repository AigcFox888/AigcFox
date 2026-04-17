import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 entry docs", () => {
  it("keeps docs README aligned with the desktop clean closeout entry", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const readmePath = "docs/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("当前 `desktop-v3 Wave 1` 已完成本地与远端 clean closeout 证据");
    expect(text).toContain("281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(text).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("268-desktop-v3-clean-pr-closeout.md");
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
    expect(closeoutText).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(closeoutText).toContain("workflow.md");
  });
});
