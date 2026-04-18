import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 closeout docs", () => {
  it("keeps the clean PR closeout aligned with the current desktop GitHub governance boundary", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const text = await readWorkspaceFile(config.rootDir, "docs/268-desktop-v3-clean-pr-closeout.md");

    expect(text).toContain("desktop-v3 Wave 1 Skeleton");
    expect(text).toMatch(/clean branch：`feature\/[^`]+`/);
    expect(text).toContain("base branch：`dev`");
    expect(text).toMatch(/clean PR：`#\d+`/);
    expect(text).toMatch(/promotion PR：`#\d+`/);
    expect(text).toContain("promotion target branch：`main`");
    expect(text).toContain("desktop-v3-ci");
    expect(text).toContain("desktop-v3-package");
    expect(text).toContain("WiX Toolset 3.14.1");
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("docs/README.md");
    expect(text).toContain("267-desktop-v3-github-actions-baseline.md");
    expect(text).toContain("PR 污染");
    expect(text).toContain("默认分支 `main`");
  });
});
