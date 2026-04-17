import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 README docs", () => {
  it("keeps desktop-v3 README aligned with fast-test and readiness entrypoints", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const readmePath = "apps/desktop-v3/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(text).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-boundary");
    expect(text).toContain("output/verification/latest/desktop-v3-wave1-readiness-summary.json");
  });

  it("keeps root README aligned with the post-reinstall recovery entry", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const text = await readWorkspaceFile(config.rootDir, "README.md");

    expect(text).toContain("docs/281-desktop-v3-post-reinstall-recovery-entry.md");
    expect(text).toContain("仓库目录矩阵");
    expect(text).toContain("重装后快速恢复入口");
  });
});
