# AigcFox desktop-v3 Local Entry

`apps/desktop-v3` 是当前新客户端主线目录。

当前默认开发环境按 `Windows + WSL2` 记录，仓库路径按 `D:\xiangmu\AigcFox` 与 `/mnt/d/xiangmu/aigcfox` 记录。
单轮开发与验证默认固定在 `WSL` 执行面；如果必须经过 Windows 宿主，只允许做单次桥接型操作，不把同一条开发链切回 `PowerShell`。

## 阅读顺序

1. [281-desktop-v3-post-reinstall-recovery-entry.md](../../docs/281-desktop-v3-post-reinstall-recovery-entry.md)
2. [257-desktop-v3-replatform-proposal.md](../../docs/257-desktop-v3-replatform-proposal.md)
3. [258-desktop-v3-technical-baseline.md](../../docs/258-desktop-v3-technical-baseline.md)
4. [259-desktop-v3-detailed-design.md](../../docs/259-desktop-v3-detailed-design.md)
5. [269-desktop-v3-tauri-2-governance-baseline.md](../../docs/269-desktop-v3-tauri-2-governance-baseline.md)
6. [260-desktop-v3-wave1-execution-baseline.md](../../docs/260-desktop-v3-wave1-execution-baseline.md)
7. [263-desktop-v3-wave1-acceptance-matrix.md](../../docs/263-desktop-v3-wave1-acceptance-matrix.md)
8. [264-desktop-v3-wave1-execution-runbook.md](../../docs/264-desktop-v3-wave1-execution-runbook.md)
9. [267-desktop-v3-github-actions-baseline.md](../../docs/267-desktop-v3-github-actions-baseline.md)
10. [268-desktop-v3-clean-pr-closeout.md](../../docs/268-desktop-v3-clean-pr-closeout.md)
11. [ui-client/system.md](../../docs/ui-client/system.md)
12. [ui-client/layout.md](../../docs/ui-client/layout.md)

## 当前范围

`desktop-v3` 当前只做 `Wave 1 Skeleton`：

- Tauri 宿主骨架
- React 路由与布局壳层
- desktop runtime 边界
- Rust local runtime 骨架
- 本地 SQLite baseline
- 基础设计系统与响应式布局

当前不进入业务层实现。

## 当前代码结构

- `src/app/*`：App Shell、Route Shell、Layout Shell、providers
- `src/components/*`：导航、基础状态与 UI 组件
- `src/features/*`：局部功能壳层
- `src/lib/runtime/*`：desktop runtime 契约、Tauri command runtime、browser mock runtime
- `src-tauri/src/commands/*`：受控 command 入口
- `src-tauri/src/runtime/*`：`client / localdb / diagnostics / state / security`

## 当前命令入口

- `desktop_get_theme_preference`
- `desktop_set_theme_preference`
- `desktop_get_diagnostics_snapshot`
- `desktop_get_backend_liveness`
- `desktop_get_backend_readiness`

## 当前脚本

```bash
pnpm test:desktop-v3-wave1-readiness
pnpm qa:desktop-v3-wave1-readiness
pnpm qa:desktop-v3-backend-client-governance
pnpm qa:desktop-v3-app-shell-governance
pnpm qa:desktop-v3-capability-governance
pnpm qa:desktop-v3-command-governance
pnpm qa:desktop-v3-feature-governance
pnpm qa:desktop-v3-localdb-governance
pnpm qa:desktop-v3-platform-config-governance
pnpm qa:desktop-v3-runtime-adapter-governance
pnpm qa:desktop-v3-runtime-contract-governance
pnpm qa:desktop-v3-runtime-skeleton-governance
pnpm qa:desktop-v3-updater-governance
pnpm qa:desktop-v3-runtime-boundary
pnpm qa:desktop-v3-responsive-smoke
pnpm qa:desktop-v3-tauri-dev-smoke
pnpm qa:desktop-v3-linux-package
pnpm qa:desktop-v3-packaged-app-smoke
pnpm --filter @aigcfox/desktop-v3 lint
pnpm --filter @aigcfox/desktop-v3 typecheck
pnpm --filter @aigcfox/desktop-v3 test
pnpm --filter @aigcfox/desktop-v3 build
cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml
```

## 宿主执行口径

- 默认开发环境按 `Windows + WSL2` 记录，默认执行面固定为 `WSL`
- 当前不再把 `Windows + PowerShell` 作为默认开发主链
- 如果必须经过 Windows 宿主，只允许做单次桥接型操作，不在 Windows 侧重复启动同一仓库的依赖安装、dev server、watcher、构建或测试
- 三端正式构件仍由 `GitHub Actions` 统一产出
- 不要在 `PowerShell` 与 `WSL` 上同时对同一仓库混跑依赖安装、dev server、watcher、构建或测试，否则本地进程会互相争抢并让 Codex 明显变卡

## 当前布局基线

- 设计基准宽度：`1440px`
- 最低支持宽度：`1280px`
- 推荐最小宽度：`1366px`
- 保护性最低宽度：`1000px`
- 内容区 `max-width = 1400px`
- `1920px+` 居中布局
- 侧边栏：`240px`，compact 时 `200px`
- 主内容区：`flex: 1`
- 不允许横向滚动

当前如果要跑整条 `Wave 1` 自动化验收链，优先使用 `pnpm qa:desktop-v3-wave1-readiness`，它会先执行当前 source-of-truth 文档 gate，再把 `runtime boundary / LocalDatabase governance / backend-client governance / app shell governance / runtime contract governance / runtime adapter governance / feature governance / command governance / capability governance / platform-config governance / updater governance / lint / typecheck / test / cargo test / build / responsive smoke / tauri dev smoke / linux package / packaged app smoke` 串起来，并把统一结果同时写到 `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json` 与 `output/verification/latest/desktop-v3-wave1-readiness-summary.json`；
当前 `main-window` capability、`permissions/main-window.toml`、Rust `invoke_handler` 和 `tauri-command-types.ts` 由 `pnpm qa:desktop-v3-capability-governance` 单独冻结，授权面和 IPC surface 不允许各改各的；
当前 `commands/*` 边界由 `pnpm qa:desktop-v3-command-governance` 单独冻结，超出当前模块集、命令名、import 面或 helper 薄层边界一律先失败，要求先重写 runtime / command 边界；
当前 `LocalDatabase` 边界由 `pnpm qa:desktop-v3-localdb-governance` 单独冻结，除了 `new / initialize / get_preference / set_preference / probe / get_sync_cache_stats` 公开面外，还会同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase` 仅由 `runtime/mod.rs` 在模块外持有的单一边界；任何扩张一律先失败，要求先重写 adapter / blocking bridge；
当前 `pnpm qa:desktop-v3-backend-client-governance` 会冻结 `runtime/client` 远端 skeleton 边界：文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面都不允许继续补丁式扩张；任何真实业务 API 扩张都必须先重写 remote client 分层；
当前 `pnpm qa:desktop-v3-app-shell-governance` 会冻结 `src/app` 的 renderer app shell boundary：`App.tsx`、`renderer-ready.ts`、`app/layout/*`、`app/providers/*`、`app/router/*` 的文件集、顶层声明面、`"/" / "/diagnostics" / "/preferences"` 路由拓扑、导航 href 与 source-level ownership 都不允许继续补丁式漂移；
当前 `pnpm qa:desktop-v3-runtime-skeleton-governance` 会冻结 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 三个 runtime skeleton 模块：`SecureStoreStatus / SecureStoreSnapshot / SecureStore`、`SessionSnapshot / SessionState`、`DiagnosticsService` 的文件集、公开面和模块外持有面都不允许继续补丁式扩张；任何 secure-store 写入、会话态扩张或诊断编排扩张都必须先结构化重写；
当前 `pnpm qa:desktop-v3-runtime-adapter-governance` 会冻结 `src/lib/runtime` adapter skeleton：文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership 都不允许继续补丁式漂移；
当前 `pnpm qa:desktop-v3-runtime-contract-governance` 会冻结 `runtime/models.rs + src/lib/runtime/contracts.ts + src/lib/runtime/desktop-runtime.ts + src/lib/runtime/tauri-command-types.ts` 的跨边界契约真相链；Rust model、TypeScript union/interface、`DesktopRuntime` 方法签名和 command payload/result map 不允许继续补丁式漂移；
当前 `pnpm qa:desktop-v3-feature-governance` 会冻结 `src/features/diagnostics + src/features/preferences` 的 renderer feature boundary：文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的 source-level ownership 都不允许继续补丁式漂移；
当前 shared `tauri.conf.json` 边界由 `pnpm qa:desktop-v3-platform-config-governance` 单独冻结，除了当前共享字段集外，不允许把平台打包细节、updater 配置或平台特有开关继续堆回共享配置；未来平台拆分必须先重写配置分层方案；
当前 `pnpm qa:desktop-v3-updater-governance` 会冻结 updater 的未实现边界：在结构化重写落地前，`Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source 都不允许提前引入 updater plugin、manifest / policy endpoint、强更策略字段、GitHub Releases 客户端更新源或 `update-guard` 壳层文件；
当前顶层 `desktop-v3-wave1-readiness` summary 还会绑定 `responsive / tauri dev / packaged app` 三段 child smoke 的 archive/latest 摘要路径，并在 runner 内二次回读 child `summary.json` 校验一致性；
当前 `pnpm test:desktop-v3-wave1-readiness` 会固定覆盖 README docs、active-doc explicit coverage、acceptance docs、runbook docs、backend-client governance、runtime adapter governance、runtime contract governance、capability governance、Rust command governance、LocalDatabase governance、platform-config governance、updater governance、runtime boundary governance、fast-test entrypoint wiring 与 smoke contract 测试。
