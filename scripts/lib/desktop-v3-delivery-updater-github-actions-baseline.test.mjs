import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import {
  expectDocumentContainsEntries,
  expectWorkflowArtifactPaths,
  expectWorkflowCommandOrder,
  expectWorkflowContainsEntries,
  expectWorkflowPathSurface,
  expectWorkflowTriggersDocumentFiles,
  readWorkspaceFile,
} from "./github-actions-baseline-test-helpers.mjs";

describe("desktop-v3 delivery/updater GitHub Actions baseline", () => {
  it("keeps the delivery/updater docs workflow trigger paths aligned with the current source-of-truth documents", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const workflowPath = ".github/workflows/desktop-v3-delivery-updater-docs.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowTriggersDocumentFiles(workflowText, workflowPath, config.documentFiles, [
      "apps/desktop-v3/**",
      "scripts/**",
      "package.json",
      "pnpm-lock.yaml",
    ]);
  });

  it("keeps push and pull_request path surfaces exactly aligned with the frozen document chain", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const workflowPath = ".github/workflows/desktop-v3-delivery-updater-docs.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowPathSurface(
      workflowText,
      workflowPath,
      [".nvmrc", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "apps/desktop-v3/**", "scripts/**"],
      config.documentFiles,
    );
  });

  it("keeps the delivery/updater docs workflow steps aligned with the GitHub baseline document", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const workflowPath = ".github/workflows/desktop-v3-delivery-updater-docs.yml";
    const baselineDocPath = "docs/267-desktop-v3-github-actions-baseline.md";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);
    const baselineDocText = await readWorkspaceFile(config.rootDir, baselineDocPath);

    expectWorkflowContainsEntries(workflowText, workflowPath, [
      "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true",
      "runs-on: ubuntu-24.04",
      "actions/setup-node@v6",
      "apps/desktop-v3/**",
      "pnpm install --frozen-lockfile",
      "pnpm test:desktop-v3-delivery-updater-docs",
      "pnpm qa:desktop-v3-delivery-updater-docs",
      "pnpm qa:github-actions-lint",
      "pnpm qa:governance-command-docs",
      "actions/upload-artifact@v6",
      "if-no-files-found: error",
    ]);

    expectDocumentContainsEntries(baselineDocText, baselineDocPath, [
      "desktop-v3-delivery-updater-docs.yml",
      "274 -> 280",
      "apps/desktop-v3/**",
      "pnpm test:desktop-v3-delivery-updater-docs",
      "pnpm qa:desktop-v3-delivery-updater-docs",
      "pnpm qa:github-actions-lint",
      "pnpm qa:governance-command-docs",
      "output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json",
      "latest summary 的 `checks[]` 必须同时覆盖 `desktop-v3-delivery-updater-docs`、`desktop-v3-ci` 与 `desktop-v3-package`",
      "`remoteTrackingRef`",
      "`remoteTrackingHeadSha`",
      "latest run 必须成功覆盖当前 `origin/<branch>` remote-tracking ref",
      "`origin/<branch>`",
      "fast-test entrypoint wiring",
    ]);
  });

  it("uploads delivery/updater docs archive and latest summary artifacts", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const workflowPath = ".github/workflows/desktop-v3-delivery-updater-docs.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowArtifactPaths(workflowText, workflowPath, [
      "output/verification/desktop-v3-delivery-updater-docs-*/**",
      "output/verification/latest/desktop-v3-delivery-updater-docs-summary.json",
    ]);
    expect(workflowText).toContain('if-no-files-found: error');
  });

  it("runs fast tests before the delivery/updater docs gate", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const workflowPath = ".github/workflows/desktop-v3-delivery-updater-docs.yml";
    const workflowText = await readWorkspaceFile(config.rootDir, workflowPath);

    expectWorkflowCommandOrder(
      workflowText,
      workflowPath,
      "pnpm test:desktop-v3-delivery-updater-docs",
      "pnpm qa:desktop-v3-delivery-updater-docs",
    );
    expectWorkflowCommandOrder(
      workflowText,
      workflowPath,
      "pnpm qa:desktop-v3-delivery-updater-docs",
      "pnpm qa:github-actions-lint",
    );
    expectWorkflowCommandOrder(
      workflowText,
      workflowPath,
      "pnpm qa:github-actions-lint",
      "pnpm qa:governance-command-docs",
    );
  });
});
