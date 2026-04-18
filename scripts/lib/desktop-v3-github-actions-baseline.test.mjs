import { describe, it } from "vitest";

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
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true",
      "AIGCFOX_DESKTOP_V3_WAVE1_PROFILE=ci",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:desktop-v3-wave1-readiness",
      "pnpm qa:desktop-v3-wave1-readiness",
      "README docs",
      "active-doc explicit coverage",
      "feature boundary governance",
      "fast-test entrypoint wiring",
      "runtime boundary governance",
    ]);
  });

  it("uploads desktop-v3 verification archive latest summary and linux deb artifacts", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const workflowPath = ".github/workflows/desktop-v3-ci.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowArtifactPaths(workflowText, workflowPath, [
      "output/verification/desktop-v3-wave1-readiness-*/**",
      "output/verification/latest/desktop-v3-wave1-readiness-summary.json",
      "apps/desktop-v3/src-tauri/target/release/bundle/deb/**/*.deb",
    ]);
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
      "- os: ubuntu-24.04",
      "- os: windows-latest",
      "- os: macos-latest",
      "pnpm --filter @aigcfox/desktop-v3 tauri build --ci --no-sign --bundles deb,appimage,rpm",
      "pnpm --filter @aigcfox/desktop-v3 tauri build --ci --no-sign",
      "actions/upload-artifact@v6",
    ]);

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
      ],
      [],
      { pullRequestPaths: [] },
    );

    expectDocumentContainsEntries(baselineDocText, baselineDocPath, [
      "desktop-v3-package.yml",
      "feature/**",
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true",
      "当前 `push` 触发面固定覆盖",
      "docs/258-desktop-v3-technical-baseline.md",
      "docs/267-desktop-v3-github-actions-baseline.md",
      "不自动发布到 GitHub Releases",
      "不自动作为客户端更新源",
    ]);
  });
});
