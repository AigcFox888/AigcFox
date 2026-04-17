import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 runbook docs", () => {
  it("keeps desktop runbook document-check command aligned with desktop documentFiles", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const runbookPath = "docs/264-desktop-v3-wave1-execution-runbook.md";
    const text = await readWorkspaceFile(config.rootDir, runbookPath);

    for (const file of config.documentFiles) {
      expect(text, `${runbookPath} should mention ${file}`).toContain(file);
    }

    expect(text).toContain("等价格式检查");
    expect(text).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-command-governance");
    expect(text).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-boundary");
    expect(text).toContain("README docs");
    expect(text).toContain("fast-test entrypoint wiring");
  });
});
