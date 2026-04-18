import { describe, expect, it } from "vitest";

import { resolveDesktopV3DeliveryUpdaterDocsConfig } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 delivery/updater governance docs", () => {
  it("keeps the technical baseline and detailed design aligned on frozen update boundaries", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const technicalBaseline = await readWorkspaceFile(
      config.rootDir,
      "docs/275-desktop-v3-delivery-updater-technical-baseline.md",
    );
    const detailedDesign = await readWorkspaceFile(
      config.rootDir,
      "docs/276-desktop-v3-delivery-updater-detailed-design.md",
    );

    expect(technicalBaseline).toContain("`Tauri 2 updater plugin`");
    expect(technicalBaseline).toContain("七牛对象存储或自有 HTTPS 服务器");
    expect(technicalBaseline).toContain("`dev(local disabled/mock) / staging / stable`");
    expect(technicalBaseline).toContain("`SemVer`");
    expect(technicalBaseline).toContain("启动前强更 / 会话内只提醒不强退");
    expect(technicalBaseline).toContain("Windows + macOS");

    expect(detailedDesign).toContain("latest.json");
    expect(detailedDesign).toContain("policy.json");
    expect(detailedDesign).toContain("required_update_before_entry");
    expect(detailedDesign).toContain("`must_update_on_next_launch`");
    expect(detailedDesign).toContain("Windows + macOS");
  });

  it("keeps execution and acceptance docs aligned on verification and non-scope boundaries", async () => {
    const config = resolveDesktopV3DeliveryUpdaterDocsConfig();
    const executionBaseline = await readWorkspaceFile(
      config.rootDir,
      "docs/277-desktop-v3-delivery-updater-execution-baseline.md",
    );
    const acceptanceMatrix = await readWorkspaceFile(
      config.rootDir,
      "docs/278-desktop-v3-delivery-updater-acceptance-matrix.md",
    );

    expect(executionBaseline).toContain("`pnpm test:desktop-v3-delivery-updater-docs`");
    expect(executionBaseline).toContain("`pnpm qa:desktop-v3-delivery-updater-docs`");
    expect(executionBaseline).toContain("GitHub workflow proof");
    expect(executionBaseline).toContain("updater 代码实现");
    expect(executionBaseline).toContain("业务 API 扩展");
    expect(executionBaseline).toContain("280-desktop-v3-delivery-updater-closeout.md");

    expect(acceptanceMatrix).toContain("GitHub 不是中国用户正式更新源");
    expect(acceptanceMatrix).toContain("`Tauri 2 updater plugin`");
    expect(acceptanceMatrix).toContain("`dev / staging / stable`");
    expect(acceptanceMatrix).toContain("`pnpm test:desktop-v3-delivery-updater-docs`");
    expect(acceptanceMatrix).toContain("`pnpm qa:desktop-v3-delivery-updater-docs`");
    expect(acceptanceMatrix).toContain(".github/workflows/desktop-v3-delivery-updater-docs.yml");
    expect(acceptanceMatrix).toContain("docs/280-desktop-v3-delivery-updater-closeout.md");
  });
});
