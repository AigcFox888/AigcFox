import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater execution baseline docs", () => {
  it("keeps remote proof truth-source rules aligned with the execution baseline", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const docPath = "docs/277-desktop-v3-delivery-updater-execution-baseline.md";
    const text = await readWorkspaceFile(config.rootDir, docPath);

    expect(text).toContain("pnpm qa:desktop-v3-delivery-updater-github-remote-proof");
    expect(text).toContain("latest summary");
    expect(text).toContain("`origin/<branch>`");
    expect(text).toContain("remote-tracking ref");
    expect(text).toContain("`remoteTrackingRef`");
    expect(text).toContain("`remoteTrackingHeadSha`");
    expect(text).toContain("desktop-v3-ci");
    expect(text).toContain("desktop-v3-package");
    expect(text).toContain("当前远端 proof 判定以 latest summary 为准");
  });
});
