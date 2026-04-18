import { describe, expect, it } from "vitest";

import { resolveDesktopV3Wave1ReadinessConfig } from "./desktop-v3-wave1-readiness-config.mjs";
import { readWorkspaceFile } from "./workspace-doc-test-helpers.mjs";

describe("desktop-v3 README docs", () => {
  it("keeps desktop-v3 README aligned with fast-test and readiness entrypoints", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const readmePath = "apps/desktop-v3/README.md";
    const text = await readWorkspaceFile(config.rootDir, readmePath);

    expect(text).toContain("../../docs/README.md");
    expect(text).toContain("../../docs/248-autonomous-execution-baseline.md");
    expect(text).toContain("../../AGENTS.md");
    expect(text).toContain("../../docs/268-desktop-v3-clean-pr-closeout.md");
    expect(text).toContain("../../docs/ui-client/system.md");
    expect(text).toContain("../../docs/ui-client/layout.md");
    expect(text).toContain("../../docs/ui-client/components.md");
    expect(text).toContain("../../docs/ui-client/interaction.md");
    expect(text).toContain("../../docs/ui-client/charts.md");
    expect(text).toContain("pnpm test:desktop-v3-wave1-readiness");
    expect(text).toContain("pnpm qa:rust-host-readiness");
    expect(text).toContain("pnpm qa:desktop-v3-wave1-readiness");
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
    expect(text).toContain("src/lib/runtime");
    expect(text).toContain("src/pages");
    expect(text).toContain("src/lib/errors");
    expect(text).toContain("src-tauri/src/error.rs");
    expect(text).toContain("useShellLayout");
    expect(text).toContain("queryClient");
    expect(text).toContain("runtime/localdb/mod.rs + migrations.rs");
    expect(text).toContain("runtime/models.rs + src/lib/runtime/contracts.ts + src/lib/runtime/desktop-runtime.ts + src/lib/runtime/tauri-command-types.ts");
    expect(text).toContain("code / message / requestId");
    expect(text).toContain("src/features/diagnostics");
    expect(text).toContain("src/features/preferences");
    expect(text).toContain("src-tauri/src/env.rs");
    expect(text).toContain("window/main_window_target.rs");
    expect(text).toContain("desktop-v3.main-window.*");
    expect(text).toContain("AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE");
    expect(text).toContain("desktop_report_renderer_boot");
    expect(text).toContain("rust-host-readiness-summary.json");
    expect(text).toContain("runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs");
    expect(text).toContain("tauri.conf.json");
    expect(text).toContain("runtime/mod.rs");
    expect(text).toContain("desktop-v3-host-governance-summary.json");
    expect(text).toContain("desktop-v3-error-contract-governance-summary.json");
    expect(text).toContain("output/verification/latest/desktop-v3-wave1-readiness-summary.json");
    expect(text).toContain("Windows + macOS");
  });

  it("keeps root README aligned with the current skeleton entry surface", async () => {
    const config = resolveDesktopV3Wave1ReadinessConfig();
    const text = await readWorkspaceFile(config.rootDir, "README.md");

    expect(text).toContain("docs/README.md");
    expect(text).toContain("docs/248-autonomous-execution-baseline.md");
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("仓库目录矩阵");
    expect(text).toContain("pnpm qa:rust-host-readiness");
    expect(text).toContain("pnpm qa:governance-command-docs");
    expect(text).toContain("desktop-v3-ci");
    expect(text).toContain("desktop-v3-package");
    expect(text).toContain("Windows + WSL2");
  });
});
