import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 acceptance docs", () => {
  it("keeps the GitHub / Actions acceptance row aligned with the desktop workflows baseline", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const acceptanceDocPath = "docs/263-desktop-v3-wave1-acceptance-matrix.md";
    const baselineDocPath = "docs/267-desktop-v3-github-actions-baseline.md";
    const acceptanceDocText = await readWorkspaceFile(config.rootDir, acceptanceDocPath);
    const baselineDocText = await readWorkspaceFile(config.rootDir, baselineDocPath);

    expect(acceptanceDocText).toContain(".github/workflows/desktop-v3-ci.yml");
    expect(acceptanceDocText).toContain(".github/workflows/desktop-v3-package.yml");
    expect(acceptanceDocText).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-capability-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-command-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-platform-config-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-runtime-skeleton-governance");
    expect(acceptanceDocText).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(acceptanceDocText).toContain("desktop-v3-localdb-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-platform-config-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-runtime-skeleton-governance-summary.json");
    expect(acceptanceDocText).toContain("只上传 CI artifacts");
    expect(acceptanceDocText).toContain("不作为客户端更新源");

    expect(baselineDocText).toContain("desktop-v3-ci.yml");
    expect(baselineDocText).toContain("desktop-v3-package.yml");
    expect(baselineDocText).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(baselineDocText).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(baselineDocText).toContain("不自动作为客户端更新源");
  });
});
