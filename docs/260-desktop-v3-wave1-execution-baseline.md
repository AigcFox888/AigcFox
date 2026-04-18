# AigcFox desktop-v3 Wave 1 Skeleton 执行基线

## 文档定位

本文档用于冻结当前 `desktop-v3` 执行边界。

## 当前目标

当前 `desktop-v3` 只承认：

- Tauri 窗口壳层
- React 路由与布局壳层
- Rust local runtime 骨架
- SQLite baseline
- 设计系统与响应式布局
- GitHub / Actions 骨架验证

## 当前执行入口

- 当前默认开发环境：`Windows + WSL2`
- 当前默认执行面：`WSL`
- 不要把同一条 `Wave 1` 验证链再并行切回 `PowerShell`

- `pnpm test:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-capability-governance`
- `pnpm qa:desktop-v3-backend-client-governance`
- `pnpm qa:desktop-v3-runtime-adapter-governance`
- `pnpm qa:desktop-v3-runtime-contract-governance`
- `pnpm qa:desktop-v3-feature-governance`
- `pnpm qa:desktop-v3-runtime-skeleton-governance`
- `pnpm qa:desktop-v3-command-governance`
- `pnpm qa:desktop-v3-localdb-governance`
- `pnpm qa:desktop-v3-platform-config-governance`
- `pnpm qa:desktop-v3-updater-governance`
- `pnpm qa:desktop-v3-runtime-boundary`

当前 `qa:desktop-v3-wave1-readiness` 的固定步骤：

- `desktop-v3-document-check`
- `desktop-v3-runtime-boundary`
- `desktop-v3-localdb-governance`
- `desktop-v3-backend-client-governance`
- `desktop-v3-runtime-skeleton-governance`
- `desktop-v3-runtime-contract-governance`
- `desktop-v3-runtime-adapter-governance`
- `desktop-v3-feature-governance`
- `desktop-v3-command-governance`
- `desktop-v3-capability-governance`
- `desktop-v3-platform-config-governance`
- `desktop-v3-updater-governance`
- `lint`
- `typecheck`
- `test`
- `cargo test`
- `build`
- `responsive smoke`
- `tauri dev smoke`
- `linux package`
- `packaged app smoke`

当前 `desktop-v3` 已补齐三段真实验证链：`responsive smoke`、`tauri dev smoke`、`packaged app smoke`。
当前 `desktop-v3-localdb-governance` 已不只冻结 `LocalDatabase` 公开方法，还会同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase -> DesktopRuntime` 的单一持有边界。
当前 `pnpm qa:desktop-v3-backend-client-governance` 会冻结 `runtime/client` 远端 skeleton 边界：文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面都不允许继续补丁式扩张。
当前 `pnpm qa:desktop-v3-runtime-skeleton-governance` 会冻结 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 三个 runtime skeleton 模块：`SecureStoreStatus / SecureStoreSnapshot / SecureStore`、`SessionSnapshot / SessionState`、`DiagnosticsService` 的文件集、公开面和模块外持有面都不允许继续补丁式扩张。
当前 `pnpm qa:desktop-v3-runtime-contract-governance` 会冻结 `runtime/models.rs` 与 `src/lib/runtime/contracts.ts / desktop-runtime.ts / tauri-command-types.ts` 的跨边界契约：Rust model、TypeScript union/interface、`DesktopRuntime` 方法签名以及 command payload/result map 不允许继续补丁式漂移。
当前 `pnpm qa:desktop-v3-runtime-adapter-governance` 会冻结 `src/lib/runtime` adapter skeleton：文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry` 实例化入口、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership 都不允许继续补丁式漂移。
当前 `pnpm qa:desktop-v3-feature-governance` 会冻结 `src/features/diagnostics + src/features/preferences`：文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的持有边界都不允许继续补丁式漂移。
当前 `desktop-v3-platform-config-governance` 会冻结 `src-tauri/tauri.conf.json` 共享字段集，并确保 `tauri.linux/windows/macos.conf.json` 仍停留在未来拆分方案，不被提前堆回当前骨架分支。
当前 `pnpm qa:desktop-v3-updater-governance` 会冻结 updater 的未实现边界：在结构化重写落地前，`Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source 都不允许提前引入 updater plugin、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源。

## 当前输出

- `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-wave1-readiness-summary.json`

## 当前不做

- 业务 API 扩展
- 登录注册
- 支付、会员、积分
- 爬虫、AI、自动化业务实现
- updater 代码实现

## 通过标准

- `pnpm qa:desktop-v3-wave1-readiness` 成功
- `desktop-v3-document-check` 成功
- `desktop-v3-runtime-boundary` 成功
- `desktop-v3-localdb-governance` 成功
- `desktop-v3-backend-client-governance` 成功
- `desktop-v3-runtime-skeleton-governance` 成功
- `desktop-v3-runtime-contract-governance` 成功
- `desktop-v3-runtime-adapter-governance` 成功
- `desktop-v3-feature-governance` 成功
- `desktop-v3-command-governance` 成功
- `desktop-v3-capability-governance` 成功
- `desktop-v3-platform-config-governance` 成功
- `desktop-v3-updater-governance` 成功
- `responsive smoke` 成功
- `tauri dev smoke` 成功
- `packaged app smoke` 成功
