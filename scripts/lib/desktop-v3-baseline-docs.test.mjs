import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 baseline docs", () => {
  it("keeps the desktop proposal and technical baseline aligned with the frozen stack and delivery boundary", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const proposalText = await readWorkspaceFile(config.rootDir, "docs/257-desktop-v3-replatform-proposal.md");
    const baselineText = await readWorkspaceFile(config.rootDir, "docs/258-desktop-v3-technical-baseline.md");

    expect(proposalText).toContain("apps/desktop-v3");
    expect(proposalText).toContain("Tauri 2");
    expect(proposalText).toContain("React + TypeScript");
    expect(proposalText).toContain("Rust");
    expect(proposalText).toContain("Wave 1 Skeleton");
    expect(proposalText).toContain("React -> Tauri commands -> Rust local runtime -> Go API");

    expect(baselineText).toContain("Tauri 2");
    expect(baselineText).toContain("React 18 + TypeScript strict + Vite");
    expect(baselineText).toContain("Zustand");
    expect(baselineText).toContain("shadcn/ui + Radix UI + Tailwind CSS 4");
    expect(baselineText).toContain("rusqlite (bundled) + rusqlite_migration");
    expect(baselineText).toContain("自有 HTTPS 下载源");
    expect(baselineText).toContain("GitHub Actions 只负责产出构件");
    expect(baselineText).toContain("pnpm qa:desktop-v3-runtime-adapter-governance");
    expect(baselineText).toContain("pnpm qa:desktop-v3-runtime-contract-governance");
    expect(baselineText).toContain("MockCommandRuntime");
    expect(baselineText).toContain("TauriCommandRuntime");
    expect(baselineText).toContain("runtime/models.rs");
    expect(baselineText).toContain("src/lib/runtime/contracts.ts / desktop-runtime.ts / tauri-command-types.ts");
  });

  it("keeps the desktop detailed design governance and execution baseline aligned with the frozen skeleton boundary", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const designText = await readWorkspaceFile(config.rootDir, "docs/259-desktop-v3-detailed-design.md");
    const governanceText = await readWorkspaceFile(config.rootDir, "docs/269-desktop-v3-tauri-2-governance-baseline.md");
    const executionText = await readWorkspaceFile(config.rootDir, "docs/260-desktop-v3-wave1-execution-baseline.md");

    expect(designText).toContain("React UI Shell");
    expect(designText).toContain("Tauri Commands / Events");
    expect(designText).toContain("Rust Local Runtime");
    expect(designText).toContain("Go HTTP API");
    expect(designText).toContain("src/lib/runtime/*");
    expect(designText).toContain("localdb/");
    expect(designText).toContain("not_ready");
    expect(designText).toContain("其他错误最多重试一次");
    expect(designText).toContain("pnpm qa:desktop-v3-runtime-adapter-governance");
    expect(designText).toContain("runtime-registry");
    expect(designText).toContain("tauri-bridge.ts");
    expect(designText).toContain("pnpm qa:desktop-v3-runtime-contract-governance");
    expect(designText).toContain("runtime/models");
    expect(designText).toContain("DesktopCommandPayloadMap / DesktopCommandResultMap");

    expect(governanceText).toContain("src-tauri/capabilities/*");
    expect(governanceText).toContain("label");
    expect(governanceText).toContain("main-window.json");
    expect(governanceText).toContain("core:default");
    expect(governanceText).toContain("desktop-renderer-boot-write");
    expect(governanceText).toContain("pnpm qa:desktop-v3-capability-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-command-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-localdb-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-platform-config-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-runtime-adapter-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-runtime-contract-governance");
    expect(governanceText).toContain("pnpm qa:desktop-v3-runtime-skeleton-governance");
    expect(governanceText).toContain("LocalDatabase");
    expect(governanceText).toContain("SecureStore");
    expect(governanceText).toContain("SessionState");
    expect(governanceText).toContain("DiagnosticsService");
    expect(governanceText).toContain("Runtime Contract Truth Chain");
    expect(governanceText).toContain("Renderer Runtime Adapter Rules");
    expect(governanceText).toContain("runtime-registry");
    expect(governanceText).toContain("tauri-bridge.ts");
    expect(governanceText).toContain("DesktopCommandPayloadMap / DesktopCommandResultMap / DesktopCommandName");
    expect(governanceText).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(governanceText).toContain("tauri.linux.conf.json / tauri.windows.conf.json / tauri.macos.conf.json");
    expect(governanceText).toContain("runtime/mod.rs");
    expect(governanceText).toContain("pnpm qa:desktop-v3-runtime-boundary");
    expect(governanceText).toContain("Tauri 2 updater plugin + 签名 + 自有 HTTPS 更新源");

    expect(executionText).toContain("pnpm qa:desktop-v3-wave1-readiness");
    expect(executionText).toContain("desktop-v3-document-check");
    expect(executionText).toContain("desktop-v3-capability-governance");
    expect(executionText).toContain("desktop-v3-command-governance");
    expect(executionText).toContain("desktop-v3-localdb-governance");
    expect(executionText).toContain("desktop-v3-platform-config-governance");
    expect(executionText).toContain("desktop-v3-runtime-adapter-governance");
    expect(executionText).toContain("desktop-v3-runtime-contract-governance");
    expect(executionText).toContain("desktop-v3-runtime-skeleton-governance");
    expect(executionText).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(executionText).toContain("runtime/models.rs");
    expect(executionText).toContain("desktop-v3-runtime-boundary");
    expect(executionText).toContain("responsive smoke");
    expect(executionText).toContain("tauri dev smoke");
    expect(executionText).toContain("packaged app smoke");
  });
});
