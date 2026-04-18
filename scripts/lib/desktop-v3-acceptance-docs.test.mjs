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
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-page-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-support-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-error-contract-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-feature-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-host-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-platform-config-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-runtime-adapter-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-runtime-contract-governance");
    expect(acceptanceDocText).toContain("pnpm qa:desktop-v3-runtime-skeleton-governance");
    expect(acceptanceDocText).toContain("desktop-v3-runtime-adapter-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-feature-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-page-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-support-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-error-contract-governance-summary.json");
    expect(acceptanceDocText).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(acceptanceDocText).toContain("desktop-v3-runtime-contract-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-localdb-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-platform-config-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-host-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3-runtime-skeleton-governance-summary.json");
    expect(acceptanceDocText).toContain("desktop-v3.main-window.*");
    expect(acceptanceDocText).toContain("只上传 CI artifacts");
    expect(acceptanceDocText).toContain("不作为客户端更新源");
    expect(acceptanceDocText).toContain("Windows + macOS");
    expect(acceptanceDocText).toContain("windows-latest + macos-latest");
    expect(acceptanceDocText).toContain("中国区用户首次安装不直接从 GitHub 获取安装包");
    expect(acceptanceDocText).toContain("七牛对象存储（Kodo）");
    expect(acceptanceDocText).toContain("后续版本不重复下载安装包");
    expect(acceptanceDocText).toContain("下一次启动生效");
    expect(acceptanceDocText).toContain("GitHub Releases URL");
    expect(acceptanceDocText).toContain("默认发布线收口");
    expect(acceptanceDocText).toContain("默认分支 `main`");
    expect(acceptanceDocText).toContain("promotion PR");

    expect(baselineDocText).toContain("desktop-v3-ci.yml");
    expect(baselineDocText).toContain("desktop-v3-package.yml");
    expect(baselineDocText).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(baselineDocText).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(baselineDocText).toContain("support governance");
    expect(baselineDocText).toContain("不自动作为客户端更新源");
    expect(baselineDocText).toContain("Windows + macOS");
    expect(baselineDocText).toContain("首次安装 bundle");
    expect(baselineDocText).toContain("后续在线更新");
    expect(baselineDocText).toContain("默认分支 `main`");
    expect(baselineDocText).toContain("中国区用户");
  });
});
