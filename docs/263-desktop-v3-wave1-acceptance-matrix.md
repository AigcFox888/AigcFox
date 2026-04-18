# AigcFox desktop-v3 Wave 1 Skeleton 验收矩阵

| 维度 | 标准 | 说明 | 证据 |
| --- | --- | --- | --- |
| 目录边界 | `apps/desktop-v3/` 独立存在 | 当前仓库只保留 `desktop-v3` 客户端主线 | 文件树 |
| 文档 gate | `desktop-v3-document-check` 成立 | `docs/281`、`docs/README.md`、`248`、`257/258/259/260/263/264/267/269` 与 `apps/desktop-v3/README.md` 无断链、无旧链残留 | `pnpm qa:desktop-v3-wave1-readiness` |
| 聚合验收入口 | Wave 1 聚合验证入口成立 | 在当前固定的 `WSL` 单执行面宿主链上，`pnpm qa:desktop-v3-wave1-readiness` 作为聚合入口成立，并负责串行收口 `source-of-truth document gate / runtime boundary governance / LocalDatabase governance / backend-client governance / app shell governance / page governance / support governance / runtime skeleton governance / runtime contract governance / runtime adapter governance / feature governance / Rust command governance / capability governance / platform-config governance / updater governance / lint / typecheck / test / cargo test / build / responsive smoke / tauri dev smoke / linux package / packaged app smoke` 的摘要与归档路径；当前默认开发环境是 `Windows + WSL2`，禁止把同一条验证链再并行切回 `PowerShell` | `output/verification` summary |
| SQLite 边界 | `LocalDatabase` 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-localdb-governance` 同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase` 仅由 `runtime/mod.rs` 在模块外持有；任何 adapter / blocking bridge 扩张都必须先重写再改门禁 | `output/verification/latest/desktop-v3-localdb-governance-summary.json` |
| Go API skeleton 边界 | `runtime/client` 仍保持 probe-only 单边界 | `pnpm qa:desktop-v3-backend-client-governance` 冻结 `runtime/client` 文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面；任何真实业务 API 扩张都必须先重写 remote client 分层 | `output/verification/latest/desktop-v3-backend-client-governance-summary.json` |
| App shell 边界 | renderer app shell / router / provider ownership 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-app-shell-governance` 冻结 `src/app/App.tsx`、`bootstrap/renderer-ready.ts`、`app/layout/*`、`app/providers/*`、`app/router/*` 的文件集、顶层声明面、`"/" / "/diagnostics" / "/preferences"` 路由拓扑、导航 href 与 source-level ownership；任何新的 provider、layout helper、route shell 或 bootstrap 漂移都必须先重写 `src/app` boundary | `output/verification/latest/desktop-v3-app-shell-governance-summary.json` |
| 页面展示边界 | renderer page composition / shared state / shell hook ownership 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-page-governance` 冻结 `src/pages/*`、`components/navigation/nav-item.tsx`、`components/states/*`、`hooks/*` 的文件集、顶层声明面、quick link / query key / theme option 常量、`NavItem` 与 shared state props、`LayoutMode / ShellLayoutState` 以及 route/sidebar/page-state/app-shell ownership；任何新的 page helper、状态组件扩张或 shell hook 漂移都必须先重写 renderer presentation boundary | `output/verification/latest/desktop-v3-page-governance-summary.json` |
| 公共支撑边界 | renderer error/query/support ownership 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-support-governance` 冻结 `src/lib/errors/*`、`src/lib/query/*`、`notify.ts`、`typography.ts`、`utils.ts` 的文件集、顶层声明面、`AppErrorShape / ErrorSupportDetail / CommandErrorPayload`、`notify` key 集、`typography` token 集、`queryClient / shouldRetryDesktopQuery / cn` 与 provider/page/runtime/ui primitive ownership；任何新的 support helper、query singleton 漂移或 token/helper 扩张都必须先重写 renderer support boundary | `output/verification/latest/desktop-v3-support-governance-summary.json` |
| Runtime skeleton 边界 | `runtime/security / state / diagnostics` 仍保持 Wave 1 骨架边界 | `pnpm qa:desktop-v3-runtime-skeleton-governance` 冻结 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 文件集，以及 `SecureStoreStatus / SecureStoreSnapshot / SecureStore`、`SessionSnapshot / SessionState`、`DiagnosticsService` 的公开面和模块外持有面；任何 secure-store 写入、会话态扩张或诊断编排扩张都必须先结构化重写 | `output/verification/latest/desktop-v3-runtime-skeleton-governance-summary.json` |
| Runtime contract 边界 | Rust 与 TypeScript runtime contract truth chain 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-runtime-contract-governance` 冻结 `runtime/models.rs`、`src/lib/runtime/contracts.ts`、`src/lib/runtime/desktop-runtime.ts`、`src/lib/runtime/tauri-command-types.ts`；任何 Rust model 字段、TypeScript union/interface、`DesktopRuntime` 方法签名或 command payload/result map 扩张都必须先重写 contract boundary | `output/verification/latest/desktop-v3-runtime-contract-governance-summary.json` |
| Runtime adapter 边界 | renderer runtime adapter skeleton 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-runtime-adapter-governance` 冻结 `src/lib/runtime` adapter 文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership；任何新的 adapter helper、分叉实例化入口或 bridge 逻辑扩张都必须先重写 adapter boundary | `output/verification/latest/desktop-v3-runtime-adapter-governance-summary.json` |
| Feature boundary 边界 | renderer feature ownership 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-feature-governance` 冻结 `src/features/diagnostics + src/features/preferences` 文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的 source-level ownership；任何新的 feature helper、页面直连 runtime 或主题状态扩散都必须先重写 feature boundary | `output/verification/latest/desktop-v3-feature-governance-summary.json` |
| 平台配置边界 | 共享 `tauri.conf.json` 仍保持 Wave 1 单边界 | `pnpm qa:desktop-v3-platform-config-governance` 冻结 `src-tauri/tauri.conf.json` 共享字段集，并确保 `tauri.linux/windows/macos.conf.json` 仍只停留在未来拆分方案；任何平台打包细节或 updater 配置扩张都必须先重写配置分层方案 | `output/verification/latest/desktop-v3-platform-config-governance-summary.json` |
| Updater 前置边界 | desktop-v3 仍保持 updater 未实现边界 | `pnpm qa:desktop-v3-updater-governance` 冻结 `Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source；任何 updater plugin、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源进入当前骨架前，都必须先做 updater 边界结构化重写 | `output/verification/latest/desktop-v3-updater-governance-summary.json` |
| GitHub / Actions | GitHub 骨架复验成立 | `.github/workflows/desktop-v3-ci.yml` 与 `.github/workflows/desktop-v3-package.yml` 存在，并执行 `pnpm test:desktop-v3-wave1-readiness` 与 `pnpm qa:desktop-v3-wave1-readiness` | workflow 文件 |
| 交付边界 | 只上传 CI artifacts | GitHub Actions 只负责上传 CI artifacts，不自动发布到 GitHub Releases | baseline / workflow |
| 更新边界 | 不作为客户端更新源 | GitHub 产物不作为客户端更新源，正式更新只走七牛或自有 HTTPS | baseline / delivery docs |

补充要求：

- `pnpm test:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-capability-governance`
- `pnpm qa:desktop-v3-backend-client-governance`
- `pnpm qa:desktop-v3-app-shell-governance`
- `pnpm qa:desktop-v3-page-governance`
- `pnpm qa:desktop-v3-support-governance`
- `pnpm qa:desktop-v3-command-governance`
- `pnpm qa:desktop-v3-feature-governance`
- `pnpm qa:desktop-v3-localdb-governance`
- `pnpm qa:desktop-v3-platform-config-governance`
- `pnpm qa:desktop-v3-runtime-adapter-governance`
- `pnpm qa:desktop-v3-runtime-contract-governance`
- `pnpm qa:desktop-v3-runtime-skeleton-governance`
- `pnpm qa:desktop-v3-updater-governance`
- `pnpm qa:desktop-v3-runtime-boundary`
- `pnpm qa:desktop-v3-responsive-smoke`
- `pnpm qa:desktop-v3-packaged-app-smoke`
- `.github/workflows/desktop-v3-ci.yml`
- `.github/workflows/desktop-v3-package.yml`
- 只上传 CI artifacts
- 不作为客户端更新源
