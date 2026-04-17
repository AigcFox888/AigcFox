import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater proposal docs", () => {
  it("keeps the proposal aligned with the current non-business delivery priority", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const text = await readWorkspaceFile(config.rootDir, "docs/274-desktop-v3-delivery-updater-proposal.md");

    expect(text).toContain("desktop-v3 Delivery / Updater Baseline");
    expect(text).toContain("为什么下一步不能直接做业务层");
    expect(text).toContain("GitHub 不能作为正式更新源");
    expect(text).toContain("七牛对象存储或自有 HTTPS 服务器");
    expect(text).toContain("打开客户端时允许执行强更新，但正在使用时不能被中途强退");
    expect(text).toContain("会员、登录注册、支付、积分、套餐、订单");
    expect(text).toContain("274 -> 280");
  });
});
