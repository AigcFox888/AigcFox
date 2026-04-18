import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import {
  expectDocumentContainsEntries,
  expectWorkflowArtifactPaths,
  expectWorkflowCommandOrder,
  expectWorkflowContainsEntries,
  expectWorkflowPathSurface,
  expectWorkflowTriggersDocumentFiles,
  readWorkspaceFile,
} from "./github-actions-baseline-test-helpers.mjs";

describe("desktop-v3 GitHub Actions baseline", () => {
  it("keeps desktop-v3-ci trigger paths aligned with the current source-of-truth documents", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowTriggersDocumentFiles(workflowText, workflowPath, config.documentFiles, [
      "apps/desktop-v3/**",
      "scripts/**",
    ]);
  });

  it("keeps push and pull_request path surfaces exactly aligned with the frozen desktop-v3 Wave 1 boundary", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowPathSurface(
      workflowText,
      workflowPath,
      [
        ".nvmrc",
        "apps/desktop-v3/**",
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "rust-toolchain.toml",
        "scripts/**",
      ],
      config.documentFiles,
    );
  });

  it("keeps desktop-v3-ci execution steps aligned with the baseline document", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const baselineDocPath = "docs/267-desktop-v3-github-actions-baseline.md";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);
    const baselineDocText = await readWorkspaceFile(config.rootDir, baselineDocPath);

    expectWorkflowContainsEntries(workflowText, workflowPath, [
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true",
      "AIGCFOX_DESKTOP_V3_WAVE1_PROFILE: ci",
      "runs-on: ubuntu-24.04",
      "actions/setup-node@v6",
      "dtolnay/rust-toolchain@stable",
      "pnpm install --frozen-lockfile",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:desktop-v3-wave1-readiness",
      "pnpm qa:desktop-v3-wave1-readiness",
      "actions/upload-artifact@v6",
    ]);

    expectDocumentContainsEntries(baselineDocText, baselineDocPath, [
      "向默认分支 `main` 发起 promotion PR",
      "`main` head 再次真实通过",
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true",
      "AIGCFOX_DESKTOP_V3_WAVE1_PROFILE=ci",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:desktop-v3-wave1-readiness",
      "pnpm qa:desktop-v3-wave1-readiness",
      "docs/268-desktop-v3-clean-pr-closeout.md",
      "docs/ui-client/system.md",
      "docs/ui-client/charts.md",
      "pnpm qa:github-actions-lint",
      "pnpm qa:governance-command-docs",
      "README docs",
      "active-doc explicit coverage",
      "page governance",
      "support governance",
      "feature boundary governance",
      "fast-test entrypoint wiring",
      "runtime boundary governance",
    ]);
  });

  it("uploads desktop-v3 verification archive and latest summary artifacts", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowArtifactPaths(workflowText, workflowPath, [
      "output/verification/desktop-v3-wave1-readiness-*/**",
      "output/verification/latest/desktop-v3-wave1-readiness-summary.json",
    ]);
    expect(workflowText).not.toContain("desktop-v3-linux-deb");
    expect(workflowText).not.toContain("bundle/deb");
  });

  it("runs desktop fast tests before desktop readiness verification", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowCommandOrder(
      workflowText,
      workflowPath,
      "pnpm test:desktop-v3-wave1-readiness",
      "pnpm qa:desktop-v3-wave1-readiness",
    );
  });

  it("keeps desktop-v3-package workflow aligned with the packaging baseline", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-package.yml";
    const baselineDocPath = "docs/267-desktop-v3-github-actions-baseline.md";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);
    const baselineDocText = await readWorkspaceFile(config.rootDir, baselineDocPath);

    expectWorkflowContainsEntries(workflowText, workflowPath, [
      'name: desktop-v3-package',
      'workflow_dispatch:',
      '- "feature/**"',
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true",
      "- os: windows-latest",
      "- os: macos-latest",
      "Install WiX Toolset (windows)",
      "choco upgrade wixtoolset --version=3.14.1 -y --no-progress",
      "\"WIX=$wixRoot\"",
      "pnpm --filter @aigcfox/desktop-v3 tauri build --ci --no-sign --bundles msi",
      "actions/upload-artifact@v6",
      "first-install package outputs for maintainer retrieval only",
      "Maintainers must download them from GitHub Actions",
      "Qiniu Kodo",
      "Later in-app updates must not point users back to GitHub artifacts or Releases.",
    ]);
    expect(workflowText).not.toContain("- os: ubuntu-24.04");
    expect(workflowText).not.toContain("deb,appimage,rpm");

    expectWorkflowPathSurface(
      workflowText,
      workflowPath,
      [
        ".nvmrc",
        "rust-toolchain.toml",
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "apps/desktop-v3/**",
        "scripts/**",
        "docs/258-desktop-v3-technical-baseline.md",
        "docs/267-desktop-v3-github-actions-baseline.md",
        "docs/269-desktop-v3-tauri-2-governance-baseline.md",
      ],
      [],
      { pullRequestPaths: [] },
    );

    expectDocumentContainsEntries(baselineDocText, baselineDocPath, [
      "desktop-v3-package.yml",
      "feature/**",
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true",
      "默认发布线收口",
      "当前 `push` 触发面固定覆盖",
      "docs/258-desktop-v3-technical-baseline.md",
      "docs/267-desktop-v3-github-actions-baseline.md",
      "docs/269-desktop-v3-tauri-2-governance-baseline.md",
      "workflow_dispatch",
      "WiX Toolset 3.14.1",
      "Chocolatey",
      "msi",
      "NSIS",
      "维护者必须从 GitHub Actions 下载 `Windows + macOS` 首次安装 bundle",
      "七牛对象存储（Kodo）",
      "后续在线更新固定走七牛对象存储（Kodo）或自有 HTTPS 下载源",
      "不自动发布到 GitHub Releases",
      "不自动作为客户端更新源",
    ]);
  });
});
