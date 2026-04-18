# AigcFox desktop-v3 Wave 1 Skeleton 执行 Runbook

## 当前 source-of-truth 文档清单

- `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
- `docs/README.md`
- `docs/248-autonomous-execution-baseline.md`
- `docs/257-desktop-v3-replatform-proposal.md`
- `docs/258-desktop-v3-technical-baseline.md`
- `docs/259-desktop-v3-detailed-design.md`
- `docs/260-desktop-v3-wave1-execution-baseline.md`
- `docs/263-desktop-v3-wave1-acceptance-matrix.md`
- `docs/264-desktop-v3-wave1-execution-runbook.md`
- `docs/267-desktop-v3-github-actions-baseline.md`
- `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `apps/desktop-v3/README.md`

## 文档 gate

`desktop-v3-document-check` 固定执行：

- `git diff --check`
- 未跟踪文档的等价格式检查
- Markdown 链接检查
- 旧术语残留扫描

## 快速验证

默认在 `WSL` 执行面运行；不要把同一条验证链切回 `PowerShell`。

```bash
pnpm test:desktop-v3-wave1-readiness
```

该入口当前固定覆盖：

- README docs
- active-doc explicit coverage
- acceptance docs
- runbook docs
- GitHub baseline docs
- backend-client governance
- runtime skeleton governance
- runtime adapter governance
- runtime contract governance
- feature governance
- capability governance
- Rust command governance
- LocalDatabase governance
- platform-config governance
- updater governance
- runtime boundary governance
- fast-test entrypoint wiring
- smoke contract

## 完整验证

默认在 `WSL` 执行面运行；不要在 `PowerShell` 与 `WSL` 上并行混跑同一条链路。

```bash
pnpm qa:desktop-v3-wave1-readiness
```

固定步骤：

1. `desktop-v3-document-check`
2. `pnpm qa:desktop-v3-runtime-boundary`
3. `pnpm qa:desktop-v3-localdb-governance`
4. `pnpm qa:desktop-v3-backend-client-governance`
5. `pnpm qa:desktop-v3-runtime-skeleton-governance`
6. `pnpm qa:desktop-v3-runtime-contract-governance`
7. `pnpm qa:desktop-v3-runtime-adapter-governance`
8. `pnpm qa:desktop-v3-feature-governance`
9. `pnpm qa:desktop-v3-command-governance`
10. `pnpm qa:desktop-v3-capability-governance`
11. `pnpm qa:desktop-v3-platform-config-governance`
12. `pnpm qa:desktop-v3-updater-governance`
13. `pnpm --filter @aigcfox/desktop-v3 lint`
14. `pnpm --filter @aigcfox/desktop-v3 typecheck`
15. `pnpm --filter @aigcfox/desktop-v3 test`
16. `cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml`
17. `pnpm --filter @aigcfox/desktop-v3 build`
18. `pnpm qa:desktop-v3-responsive-smoke`
19. `pnpm qa:desktop-v3-tauri-dev-smoke`
20. `pnpm qa:desktop-v3-linux-package`
21. `pnpm qa:desktop-v3-packaged-app-smoke`

## 输出

- `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-wave1-readiness-summary.json`

## 说明

- 当前 renderer / invoke 证明以 `packaged app smoke` 为主证据
- 当前 capability / permission / IPC 对齐回归由 `pnpm qa:desktop-v3-capability-governance` 先行拦截
- 当前 `runtime/client` 远端 skeleton 回归由 `pnpm qa:desktop-v3-backend-client-governance` 先行拦截；它会同时冻结 `runtime/client` 文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面，防止把真实业务 API 继续补丁式塞进当前远端客户端
- 当前 `runtime/security / state / diagnostics` skeleton 回归由 `pnpm qa:desktop-v3-runtime-skeleton-governance` 先行拦截；它会同时冻结 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 文件集，以及 `SecureStore`、`SessionState`、`DiagnosticsService` 的公开面和模块外持有面，防止把真实 secure-store 写入、会话态扩张或诊断编排继续补丁式塞进当前骨架
- 当前 Rust / TypeScript runtime contract truth chain 回归由 `pnpm qa:desktop-v3-runtime-contract-governance` 先行拦截；它会同时冻结 `runtime/models.rs`、`src/lib/runtime/contracts.ts`、`src/lib/runtime/desktop-runtime.ts`、`src/lib/runtime/tauri-command-types.ts`，防止 Rust model、TypeScript contract、`DesktopRuntime` 方法签名和 command payload/result map 继续补丁式漂移
- 当前 renderer runtime adapter skeleton 回归由 `pnpm qa:desktop-v3-runtime-adapter-governance` 先行拦截；它会同时冻结 `src/lib/runtime` adapter 文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership，防止继续补丁式加 helper、分叉实例化入口或 bridge 逻辑
- 当前 renderer feature boundary 回归由 `pnpm qa:desktop-v3-feature-governance` 先行拦截；它会同时冻结 `src/features/diagnostics + src/features/preferences` 文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的 source-level ownership，防止页面、provider 或新 feature 继续补丁式横向扩散 runtime 访问与主题状态持有
- 当前 Rust command 边界回归由 `pnpm qa:desktop-v3-command-governance` 先行拦截
- 当前 LocalDatabase 回归由 `pnpm qa:desktop-v3-localdb-governance` 先行拦截；它会同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase` 仅由 `runtime/mod.rs` 在模块外持有的边界
- 当前 shared `tauri.conf.json` 回归由 `pnpm qa:desktop-v3-platform-config-governance` 先行拦截；它会同时冻结当前唯一配置文件集和共享字段面，防止把平台打包细节或 updater 配置继续堆回 `tauri.conf.json`
- 当前 updater 未实现边界由 `pnpm qa:desktop-v3-updater-governance` 先行拦截；它会同时冻结 `Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source，防止把 updater plugin、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源提前补丁式塞进当前骨架
- 当前 renderer runtime 边界回归由 `pnpm qa:desktop-v3-runtime-boundary` 先行拦截
- 当前 README docs、fast-test entrypoint wiring 与 active-doc explicit coverage 都必须保持通过
