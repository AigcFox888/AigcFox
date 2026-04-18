import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater closeout docs", () => {
  it("records the local and remote proof evidence with stable summary entrypoints", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const closeoutPath = "docs/280-desktop-v3-delivery-updater-closeout.md";
    const text = await readWorkspaceFile(config.rootDir, closeoutPath);

    expect(text).toContain("desktop-v3 Delivery / Updater Baseline");
    expect(text).toContain("pnpm test:desktop-v3-delivery-updater-docs");
    expect(text).toContain("pnpm qa:desktop-v3-delivery-updater-docs");
    expect(text).toContain("pnpm qa:desktop-v3-delivery-updater-github-remote-proof");
    expect(text).toContain("pnpm qa:github-actions-lint");
    expect(text).toContain("pnpm qa:governance-command-docs");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-docs-summary.json");
    expect(text).toContain("output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json");
    expect(text).toContain("output/verification/latest/governance-command-docs-summary.json");
    expect(text).toContain(".github/workflows/desktop-v3-ci.yml");
    expect(text).toContain(".github/workflows/desktop-v3-package.yml");
    expect(text).toContain(".github/workflows/desktop-v3-delivery-updater-docs.yml");
    expect(text).toContain("`274 -> 280`");
    expect(text).toContain("feature/desktop-v3-github-actions-baseline");
    expect(text).toContain("latest remote head、run id 与 GitHub Actions URL 不在本文档内硬编码");
    expect(text).toContain("`origin/<branch>`");
    expect(text).toContain("优先重新执行远端 proof 脚本并读取 latest summary");
    expect(text).toContain("`remoteTrackingRef`");
    expect(text).toContain("`remoteTrackingHeadSha`");
    expect(text).toContain("`latestSuccessfulHeadSha`");
    expect(text).toContain("`latestSuccessfulRunId`");
    expect(text).toContain("`checks[].id = desktop-v3-delivery-updater-docs-remote-proof / desktop-v3-ci-remote-proof / desktop-v3-package-remote-proof`");
  });
});
