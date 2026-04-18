# AigcFox desktop-v3 Wave 1 Skeleton 执行 Runbook

## 当前 source-of-truth 文档清单

- `docs/README.md`
- `docs/248-autonomous-execution-baseline.md`
- `docs/257-desktop-v3-replatform-proposal.md`
- `docs/258-desktop-v3-technical-baseline.md`
- `docs/259-desktop-v3-detailed-design.md`
- `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `docs/260-desktop-v3-wave1-execution-baseline.md`
- `docs/263-desktop-v3-wave1-acceptance-matrix.md`
- `docs/264-desktop-v3-wave1-execution-runbook.md`
- `docs/267-desktop-v3-github-actions-baseline.md`
- `docs/268-desktop-v3-clean-pr-closeout.md`
- `docs/ui-client/system.md`
- `docs/ui-client/layout.md`
- `docs/ui-client/components.md`
- `docs/ui-client/interaction.md`
- `docs/ui-client/charts.md`
- `apps/desktop-v3/README.md`

## 文档 gate

`desktop-v3-document-check` 固定执行：

- `git diff --check`
- 未跟踪文档的等价格式检查
- Markdown 链接检查
- 旧术语残留扫描

## 快速验证

默认在 `WSL` 执行面运行；不要把同一条验证链切回 `PowerShell`。

如果当前是系统重装恢复、`WSL` 宿主刚切回、或者 Rust toolchain / linker 刚调整过，先做一次宿主预检：

```bash
pnpm qa:rust-host-readiness
```

该入口会直接对 `apps/desktop-v3/src-tauri/Cargo.toml` 执行 `cargo build --manifest-path ... --quiet` 探针，并把结果写到 `output/verification/rust-host-readiness-<run-id>/summary.json` 与 `output/verification/latest/rust-host-readiness-summary.json`。

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
- app shell governance
- page governance
- support governance
- runtime skeleton governance
- runtime adapter governance
- runtime contract governance
- feature governance
- capability governance
- Rust command governance
- LocalDatabase governance
- host governance
- platform-config governance
- updater governance
- runtime boundary governance
- fast-test entrypoint wiring
- smoke contract

如果要单独复验 workflow 语法与命令文档面，额外执行：

```bash
pnpm qa:github-actions-lint
pnpm qa:governance-command-docs
```

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
5. `pnpm qa:desktop-v3-app-shell-governance`
6. `pnpm qa:desktop-v3-page-governance`
7. `pnpm qa:desktop-v3-support-governance`
8. `pnpm qa:desktop-v3-runtime-skeleton-governance`
9. `pnpm qa:desktop-v3-runtime-contract-governance`
10. `pnpm qa:desktop-v3-error-contract-governance`
11. `pnpm qa:desktop-v3-runtime-adapter-governance`
12. `pnpm qa:desktop-v3-feature-governance`
13. `pnpm qa:desktop-v3-command-governance`
14. `pnpm qa:desktop-v3-capability-governance`
15. `pnpm qa:desktop-v3-platform-config-governance`
16. `pnpm qa:desktop-v3-host-governance`
17. `pnpm qa:desktop-v3-updater-governance`
18. `pnpm --filter @aigcfox/desktop-v3 lint`
19. `pnpm --filter @aigcfox/desktop-v3 typecheck`
20. `pnpm --filter @aigcfox/desktop-v3 test`
21. `cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml`
22. `pnpm --filter @aigcfox/desktop-v3 build`
23. `pnpm qa:desktop-v3-responsive-smoke`
24. `pnpm qa:desktop-v3-tauri-dev-smoke`

## 输出

- `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-wave1-readiness-summary.json`

## 说明

- 当前 renderer / invoke 证明以 `pnpm qa:desktop-v3-tauri-dev-smoke` 为主证据；该脚本只有在 `desktop-v3.main-window.page-load event=finished` 与 `desktop-v3.renderer.boot stage=app` 都落盘后才算通过
- 当前 `pnpm qa:desktop-v3-responsive-smoke` 的路由矩阵直接跟随 `src/app/router/route-registry.ts` 生成，不再在 smoke 脚本里重复维护 `/#/`、`/#/diagnostics`、`/#/preferences` 三套硬编码路径
- 当前 capability / permission / IPC 对齐回归由 `pnpm qa:desktop-v3-capability-governance` 先行拦截
- 当前 `runtime/client` 远端 skeleton 回归由 `pnpm qa:desktop-v3-backend-client-governance` 先行拦截；它会同时冻结 `runtime/client` 文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面，防止把真实业务 API 继续补丁式塞进当前远端客户端
- 当前 renderer app shell 回归由 `pnpm qa:desktop-v3-app-shell-governance` 先行拦截；它会同时冻结 `src/app/App.tsx`、`bootstrap/renderer-ready.ts`、`app/layout/*`、`app/providers/*`、`app/router/*` 的文件集、顶层声明面，以及 `route-registry.ts` 内收拢的 `"/" / "/diagnostics" / "/preferences"` 路径真相、handle、导航 href 绑定、初始路由集合与 source-level ownership，防止继续补丁式扩 provider、layout、router 或 bootstrap 壳层
- 当前 renderer presentation 回归由 `pnpm qa:desktop-v3-page-governance` 先行拦截；它会同时冻结 `src/pages/*`、`components/navigation/nav-item.tsx`、`components/states/*`、`hooks/*` 的文件集、顶层声明面、quick link / query key / theme option 常量、`NavItem` 与 shared state props、`LayoutMode / ShellLayoutState / useShellLayout`，并要求 dashboard quick link / keyboard shortcut 导航继续绑定 `route-registry.ts` 路径真相，防止继续补丁式扩 page composition、状态组件或 shell hook
- 当前 renderer support 回归由 `pnpm qa:desktop-v3-support-governance` 先行拦截；它会同时冻结 `src/lib/errors/*`、`src/lib/query/*`、`notify.ts`、`typography.ts`、`utils.ts` 的文件集、顶层声明面、`AppErrorShape / ErrorSupportDetail / CommandErrorPayload`、`queryClient / shouldRetryDesktopQuery`、`notify` key 集、`typography` token 集与 `cn` ownership，防止继续补丁式扩公共错误支撑、query singleton、toast 支撑或 renderer token/helper
- 当前 `runtime/security / state / diagnostics` skeleton 回归由 `pnpm qa:desktop-v3-runtime-skeleton-governance` 先行拦截；它会同时冻结 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 文件集，以及 `SecureStore`、`SessionState`、`DiagnosticsService` 的公开面和模块外持有面，防止把真实 secure-store 写入、会话态扩张或诊断编排继续补丁式塞进当前骨架
- 当前 Rust / TypeScript runtime contract truth chain 回归由 `pnpm qa:desktop-v3-runtime-contract-governance` 先行拦截；它会同时冻结 `runtime/models.rs`、`src/lib/runtime/contracts.ts`、`src/lib/runtime/desktop-runtime.ts`、`src/lib/runtime/tauri-command-types.ts`，防止 Rust model、TypeScript contract、`DesktopRuntime` 方法签名和 command payload/result map 继续补丁式漂移
- 当前 command error truth chain 回归由 `pnpm qa:desktop-v3-error-contract-governance` 先行拦截；它会同时冻结 `src-tauri/src/error.rs`、`src/lib/errors/app-error.ts`、`src/lib/errors/normalize-command-error.ts`、`src/lib/runtime/tauri-command-runtime.ts`，并把 Wave 1 command error 真相链固定在 `code / message / requestId`，防止新的错误字段、跨层消费者或本地错误码分支继续补丁式扩张
- 当前 renderer runtime adapter skeleton 回归由 `pnpm qa:desktop-v3-runtime-adapter-governance` 先行拦截；它会同时冻结 `src/lib/runtime` adapter 文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership，防止继续补丁式加 helper、分叉实例化入口或 bridge 逻辑
- 当前 renderer feature boundary 回归由 `pnpm qa:desktop-v3-feature-governance` 先行拦截；它会同时冻结 `src/features/diagnostics + src/features/preferences` 文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的 source-level ownership，防止页面、provider 或新 feature 继续补丁式横向扩散 runtime 访问与主题状态持有
- 当前 Rust command 边界回归由 `pnpm qa:desktop-v3-command-governance` 先行拦截
- 当前 LocalDatabase 回归由 `pnpm qa:desktop-v3-localdb-governance` 先行拦截；它会同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase` 仅由 `runtime/mod.rs` 在模块外持有的边界
- 当前 shared `tauri.conf.json` 回归由 `pnpm qa:desktop-v3-platform-config-governance` 先行拦截；它会同时冻结当前唯一配置文件集和共享字段面，防止把平台打包细节或 updater 配置继续堆回 `tauri.conf.json`
- 当前宿主 env / log surface 回归由 `pnpm qa:desktop-v3-host-governance` 先行拦截；它会同时冻结 `AIGCFOX_BACKEND_BASE_URL`、`AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE`、`AIGCFOX_DESKTOP_V3_DEV_WINDOW_URL`、`AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE`、`AIGCFOX_DESKTOP_V3_TRACE_COMMANDS`、`AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE`、`VITE_DESKTOP_V3_INITIAL_ROUTE`、`VITE_DESKTOP_V3_RUNTIME_MODE`、`VITE_DESKTOP_V3_RENDERER_BOOT_PROBE` 与 `desktop-v3.main-window.* / desktop-v3.command.invoke / desktop-v3.renderer.boot / desktop-v3.startup-backend-probe.*` 信号，并交叉校验 renderer `route-registry.ts` 与 Rust `window/initial_route.rs` 的允许初始路由集合完全一致，防止宿主配置、日志排障面或初始路由真相链继续补丁式漂移
- 当前 updater 未实现边界由 `pnpm qa:desktop-v3-updater-governance` 先行拦截；它会同时冻结 `Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source，防止把 updater plugin、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源提前补丁式塞进当前骨架
- 当前 renderer runtime 边界回归由 `pnpm qa:desktop-v3-runtime-boundary` 先行拦截
- 当前终端用户安装包改由 GitHub Actions `desktop-v3-package.yml` 统一产出 `Windows + macOS` 构件；`ubuntu-24.04` 只保留 CI 验证宿主，不再把 Linux 包体验证纳入本地 `Wave 1` runbook
- 当前完整验证明确不包含脚本 `qa:desktop-v3-linux-package`；本地 `WSL` 链只做 renderer / host / QA proof，不承担 Linux 终端用户安装包收口
- 当前 README docs、fast-test entrypoint wiring 与 active-doc explicit coverage 都必须保持通过
