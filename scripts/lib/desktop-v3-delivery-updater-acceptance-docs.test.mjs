import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater acceptance docs", () => {
  it("keeps the acceptance matrix aligned with latest-summary remote-proof truth", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const docPath = "docs/278-desktop-v3-delivery-updater-acceptance-matrix.md";
    const text = await readWorkspaceFile(config.rootDir, docPath);

    expect(text).toContain("远端真值来源");
    expect(text).toContain("latest summary 真值成立");
    expect(text).toContain("`remoteTrackingRef`");
    expect(text).toContain("`remoteTrackingHeadSha`");
    expect(text).toContain("`latestSuccessfulHeadSha`");
    expect(text).toContain("`latestSuccessfulRunId`");
    expect(text).toContain("`origin/<branch>`");
    expect(text).toContain("remote-tracking ref");
    expect(text).toContain("summary / closeout");
  });
});
