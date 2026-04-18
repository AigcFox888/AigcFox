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
    expect(text).toContain("pnpm qa:rust-host-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-capability-governance");
    expect(text).toContain("pnpm qa:desktop-v3-command-governance");
    expect(text).toContain("pnpm qa:desktop-v3-page-governance");
    expect(text).toContain("pnpm qa:desktop-v3-support-governance");
    expect(text).toContain("pnpm qa:desktop-v3-error-contract-governance");
    expect(text).toContain("pnpm qa:desktop-v3-feature-governance");
    expect(text).toContain("pnpm qa:desktop-v3-host-governance");
    expect(text).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(text).toContain("pnpm qa:desktop-v3-platform-config-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-adapter-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-contract-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-skeleton-governance");
    expect(text).toContain("pnpm qa:desktop-v3-runtime-boundary");
    expect(text).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(text).toContain("tauri-bridge");
    expect(text).toContain("runtime-registry");
    expect(text).toContain("ThemeProvider");
    expect(text).toContain("PreferencesPage");
    expect(text).toContain("DiagnosticsPage");
    expect(text).toContain("NavItem");
    expect(text).toContain("useShellLayout");
    expect(text).toContain("AppErrorShape");
    expect(text).toContain("src-tauri/src/error.rs");
    expect(text).toContain("code / message / requestId");
    expect(text).toContain("queryClient");
    expect(text).toContain("notify");
    expect(text).toContain("AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE");
    expect(text).toContain("desktop-v3.main-window.*");
    expect(text).toContain("runtime/models.rs");
    expect(text).toContain("src/lib/runtime/contracts.ts");
    expect(text).toContain("SecureStore");
    expect(text).toContain("SessionState");
    expect(text).toContain("DiagnosticsService");
    expect(text).toContain("tauri.conf.json");
    expect(text).toContain("runtime/mod.rs");
    expect(text).toContain("README docs");
    expect(text).toContain("output/verification/latest/rust-host-readiness-summary.json");
    expect(text).toContain("fast-test entrypoint wiring");
    expect(text).toContain("desktop-v3-package.yml");
    expect(text).toContain("Windows + macOS");
    expect(text).toContain("desktop-v3-windows-bundle-<sha>");
    expect(text).toContain("desktop-v3-macos-bundle-<sha>");
    expect(text).toContain("七牛对象存储或自有 HTTPS 下载源");
    expect(text).toContain("GitHub Releases URL");
    expect(text).toContain("默认分支 `main`");
    expect(text).toContain("promotion PR");
  });
});
