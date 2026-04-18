# AigcFox desktop-v3 技术基线

## 文档定位

本文档用于冻结 `desktop-v3 Wave 1 Skeleton` 的技术选型。

它只定义当前客户端骨架用什么技术、为什么这样选，以及哪些方案当前不进入。

## 选型冻结结论

| 领域 | 冻结选型 | 当前不选 | 说明 |
| --- | --- | --- | --- |
| 宿主 | `Tauri 2` | 继续沿用旧宿主方案 | 当前主线需要更清晰的 Rust 边界与更轻的桌面宿主。 |
| 本地运行时 | `Rust stable + Tokio` | 将高权限逻辑留在前端层 | 本地存储、系统能力和受控命令必须进入 Rust 层。 |
| 前端框架 | `React 18 + TypeScript strict + Vite` | 更换为小众前端栈 | 生态稳定、协作成本低。 |
| 路由 | `react-router-dom` | 自研路由 | 承接桌面壳层已足够。 |
| 远端状态 | `@tanstack/react-query` | 自写请求缓存层 | 远端快照、诊断和失效模型更统一。 |
| 本地 UI 状态 | `Zustand` | 过重全局状态框架 | 更适合壳层态和会话态。 |
| 表单 | `react-hook-form + zod` | 手写大表单状态机 | 减少重复校验代码。 |
| 桌面 UI | `shadcn/ui + Radix UI + Tailwind CSS 4` | 将后台组件体系直接搬成桌面主 UI | 当前客户端目标是桌面工作台，不是后台表单页。 |
| 图标 | `lucide-react` | 多图标体系混用 | 保持体积和风格一致。 |
| 反馈组件 | `sonner` | 散落多套提醒组件 | 统一消息反馈位置和风格。 |
| 图表 | `Recharts`（按需） | 提前引入更重图表体系 | Skeleton 阶段只保留轻量图表能力。 |
| 本地数据库 | `rusqlite (bundled) + rusqlite_migration` | 在 renderer 直接持久化 | 本地真相必须留在 Rust 受控层。 |
| 敏感存储 | OS keyring / secure store | `localStorage` / 明文文件 | 密钥与令牌不能暴露给 renderer。 |
| 通信主链 | `Tauri commands` | renderer 默认直连所有本地能力 | Rust 必须是本地高权限边界。 |
| 远端接口 | `Go HTTP API` | renderer 绕过 Rust 直接控制本地能力 | 远端真相统一走 Go backend。 |
| 测试 | `Vitest + Testing Library + Playwright + cargo test` | 只靠手点验证 | 框架层必须保留真实测试链。 |

## Tauri 2 工程冻结约束

当前 `desktop-v3` 对 `Tauri 2` 的工程使用方式额外冻结为：

- `capabilities/*` 是窗口与 webview 授权真相
- capability 绑定以窗口 `label` 为准，不以 `title` 为准
- 当前主窗口 capability 固定为 `main-window.json`，并显式列出 `core:app:default / core:event:default / core:webview:default / core:window:default / desktop-preferences-read / desktop-preferences-write / desktop-diagnostics-read / desktop-backend-probe-read / desktop-renderer-boot-write`；当前仓库不再继续依赖 `core:default`
- 当前用 `pnpm qa:desktop-v3-capability-governance` 对 capability / permission / invoke_handler / tauri command type map 做静态门禁
- 任何新 plugin、新窗口、新宿主 JS API 在进入实现前，必须先补 capability / permission 设计
- 有 I/O 的 command 默认按 `async` 设计；SQLite 扩张前禁止继续在当前同步 localdb 路径上堆逻辑
- 当前用 `pnpm qa:desktop-v3-localdb-governance` 对 `runtime/localdb` 文件集、`rusqlite` 触点和 `LocalDatabase` 外部使用面做静态门禁；SQLite 依赖当前只允许停留在 `runtime/localdb/* + error.rs`，`LocalDatabase` 在模块外只允许由 `runtime/mod.rs` 持有
- 当前用 `pnpm qa:desktop-v3-backend-client-governance` 对 `runtime/client` 文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面做静态门禁；远端 Go API 边界当前只允许停留在 health/readiness skeleton，不允许继续在现结构上补丁式扩业务接口
- 当前用 `pnpm qa:desktop-v3-runtime-skeleton-governance` 对 `runtime/security`、`runtime/state`、`runtime/diagnostics` 做静态门禁；`SecureStoreStatus / SecureStoreSnapshot / SecureStore`、`SessionSnapshot / SessionState`、`DiagnosticsService` 的文件集、公开面和模块外持有面都冻结在当前 Wave 1 骨架，任何真实 secure-store 写入、会话态扩张或诊断编排扩张都必须先结构化重写
- 当前用 `pnpm qa:desktop-v3-runtime-contract-governance` 对 `runtime/models.rs` 与 `src/lib/runtime/contracts.ts / desktop-runtime.ts / tauri-command-types.ts` 做静态门禁；Rust `ThemeMode / ThemePreference / DiagnosticsSnapshot / BackendProbe` 与 TypeScript `DesktopRuntime / DesktopCommandPayloadMap / DesktopCommandResultMap` 的跨边界真相链必须保持同一组冻结契约，任何字段、命令或类型扩张都必须先重写 contract boundary
- 当前用 `pnpm qa:desktop-v3-error-contract-governance` 对 `src-tauri/src/error.rs` 与 `src/lib/errors/app-error.ts / normalize-command-error.ts / src/lib/runtime/tauri-command-runtime.ts` 做静态门禁；Wave 1 的 Rust `CommandError` 只允许保留 `code / message / request_id`，TypeScript 只允许归一成 `code / message / requestId`，`details` 只保留兼容位；`RuntimeError` variant 集、`RuntimeError -> CommandError` 映射和跨层持有边界都不允许继续补丁式漂移
- 当前用 `pnpm qa:desktop-v3-runtime-adapter-governance` 对 `src/lib/runtime` adapter 层做静态门禁；`MockCommandRuntime`、`TauriCommandRuntime`、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke` 和 mock fixtures 的文件集、导出面、Tauri bridge 触点与 source-level ownership 都冻结在当前 Wave 1 骨架，不允许继续在现结构上补丁式加 helper、分叉实例化入口或散落 bridge 逻辑
- 当前用 `pnpm qa:desktop-v3-app-shell-governance` 对 `src/app` 壳层做静态门禁；`App.tsx`、`bootstrap/renderer-ready.ts`、`app/layout/*`、`app/providers/*`、`app/router/*` 的文件集、顶层声明面、初始路由集、导航 href，以及 `main.tsx -> App -> AppProviders -> ThemeProvider -> router/layout` 的 source-level ownership 都冻结在当前 Wave 1 骨架，不允许继续补丁式扩散 app shell boundary
- 当前用 `pnpm qa:desktop-v3-page-governance` 对 `src/pages/*`、`src/components/navigation/nav-item.tsx`、`src/components/states/*`、`src/hooks/*` 做静态门禁；`DashboardPage / DiagnosticsPage / PreferencesPage` 的顶层声明面、quick link / query key / theme option 常量、`NavItem` 与 shared state props、`useKeyboardShortcuts / useShellLayout` 的公开面、layout mode 与 source-level ownership 都冻结在当前 Wave 1 骨架，不允许继续补丁式扩 page composition、shared state 或 shell hook boundary
- 当前用 `pnpm qa:desktop-v3-support-governance` 对 `src/lib/errors/*`、`src/lib/query/*`、`src/lib/notify.ts`、`src/lib/typography.ts`、`src/lib/utils.ts` 做静态门禁；`AppErrorShape / ErrorSupportDetail / CommandErrorPayload`、`queryClient / shouldRetryDesktopQuery`、`notify` key 集、`typography` token 集与 `cn` helper 的公开面和 source-level ownership 都冻结在当前 Wave 1 骨架，不允许继续补丁式扩 shared error/query/support boundary
- 当前用 `pnpm qa:desktop-v3-feature-governance` 对 `src/features/diagnostics` 与 `src/features/preferences` 做静态门禁；文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的持有边界都冻结在当前 Wave 1 骨架，不允许页面、provider 或新 feature 继续在现结构上补丁式扩散 runtime 访问
- 当前用 `pnpm qa:desktop-v3-platform-config-governance` 对 `tauri.conf.json` 共享字段集做静态门禁；平台覆盖配置仍只保留在未来拆分方案里，当前不允许把平台打包细节、updater 配置或平台特有开关继续塞回共享配置
- 当前用 `pnpm qa:desktop-v3-updater-governance` 对 `Cargo.toml`、`tauri.conf.json`、capability / permission、Rust / renderer source 的 updater 前置实现边界做静态门禁；在结构化重写落地前，不允许提前引入 updater plugin 依赖、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源
- `tauri.conf.json` 只放跨平台稳定项；当前主窗口 URL、尺寸、初始路由和导航 telemetry 由 Rust `window/main_window.rs + window/main_window_target.rs + window/initial_route.rs + window/telemetry.rs` 显式创建，平台打包和更新实现开始后，必须拆平台覆盖配置
- 自动更新后续只允许走 `Tauri 2 updater plugin + 签名 + 七牛或自有 HTTPS 更新源`

详细规则见 [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)。

## 布局与分辨率基线

当前桌面 UI 固定采用以下分辨率方案：

- 设计基准宽度：`1440px`
- 最低支持宽度：`1280px`
- 推荐最小宽度：`1366px`
- 保护性最低宽度：`1000px`
- 最大内容宽度：`1400px`
- `1920px+` 采用内容居中布局

布局硬规则：

- 只使用 `flex` 或 `grid`
- 不做整页固定宽度
- 侧边栏默认 `240px`
- `<1366px` 时侧边栏可收缩到 `200px`
- 主内容区必须保持 `flex: 1`
- 不允许横向滚动
- 窗口必须可调整大小

分段规则：

- `<1366px`：compact layout
- `1366px - 1919px`：standard layout
- `1920px+`：centered layout

## 当前架构基线

客户端主链固定如下：

```text
React UI -> Tauri commands -> Rust local runtime -> Go API / SQLite
```

原则：

- React 负责 UI 壳层和交互
- Rust 负责本地高权限能力、本地数据和命令转发
- Go backend 负责远端权威数据

## 本地数据与安全基线

- 本地数据库只允许由 Rust 访问
- renderer 不直接读写 SQLite
- 敏感凭据不进入本地 SQLite
- 本地命令必须显式暴露，不能任意透出系统能力
- `secure store` 当前只暴露结构化 skeleton 诊断快照：`provider / status / writesEnabled`
- 上述 `secure store` skeleton 当前由 `pnpm qa:desktop-v3-runtime-skeleton-governance` 与 Rust 单测共同冻结；`writesEnabled=false` 只表示当前骨架未开放写入，不允许被补丁式演变成真实密钥写入能力
- Rust `runtime/models.rs` 与 TypeScript `src/lib/runtime/contracts.ts / desktop-runtime.ts / tauri-command-types.ts` 当前由 `pnpm qa:desktop-v3-runtime-contract-governance` 共同冻结，renderer 与 Rust 之间不允许各自偷改字段、联合类型或 command payload/result map
- TypeScript `src/lib/runtime` adapter 层当前由 `pnpm qa:desktop-v3-runtime-adapter-governance` 共同冻结，renderer 侧不允许绕开 `runtime-registry` 私自实例化 runtime，不允许把 `@tauri-apps/*` 或 bridge globals 扩散到更多 adapter 文件
- TypeScript `src/app` 壳层当前由 `pnpm qa:desktop-v3-app-shell-governance` 共同冻结，`App / renderer-ready / app/layout / app/providers / app/router` 的文件集、顶层声明面、`"/" / "/diagnostics" / "/preferences"` 路由拓扑、导航 href 与 source-level ownership 不允许继续补丁式漂移
- TypeScript `src/pages / src/components/navigation/nav-item.tsx / src/components/states / src/hooks` presentation 层当前由 `pnpm qa:desktop-v3-page-governance` 共同冻结，页面组合、状态组件 props、`LayoutMode / ShellLayoutState` 与 shell hook ownership 不允许继续补丁式漂移
- TypeScript `src/lib/errors / src/lib/query / src/lib/notify.ts / src/lib/typography.ts / src/lib/utils.ts` shared support 层当前由 `pnpm qa:desktop-v3-support-governance` 共同冻结，错误归一、query 单例、toast 支撑、type token 与 `cn` helper 不允许继续补丁式漂移
- Rust `src-tauri/src/error.rs` 与 TypeScript `src/lib/errors/app-error.ts / normalize-command-error.ts / src/lib/runtime/tauri-command-runtime.ts` 当前由 `pnpm qa:desktop-v3-error-contract-governance` 共同冻结，当前 command error 真相链只承认 `code / message / requestId`，不允许补丁式横向扩更多错误字段或跨层消费者
- TypeScript `src/features/diagnostics` 与 `src/features/preferences` 当前由 `pnpm qa:desktop-v3-feature-governance` 共同冻结，页面与 provider 只允许通过 `diagnostics-api / diagnostics-formatters / preferences-api / preferences-store / preferences-types` 进入 renderer feature boundary，不允许再把 runtime access 或主题状态持有横向扩散到更多壳层文件
- Wave 1 不把上述诊断快照等同于真实密钥写入能力

## 交付与更新约束

虽然当前 Wave 1 不实现完整交付更新，但技术基线已经冻结：

- 开发主链：`Windows + WSL2（默认固定 WSL 单执行面） -> GitHub -> GitHub Actions`
- `Windows + macOS` 打包交给 CI
- 生产更新源必须使用自有 HTTPS 下载源
- 不以 GitHub 作为中国用户的生产更新源
- 当前更新源优先落到七牛对象存储或自有 HTTPS 服务器，GitHub Actions 只负责产出构件
- 更新能力后续进入实现时，必须采用受控、可审计、可签名的方式

这些是设计约束，不代表当前已进入实现。

## 当前明确不做的事

- 业务域页面
- 本地自动化业务实现
- 商业化功能
- 更新实现细节
- 将本地执行逻辑写回前端壳层

## 关联文档

- [257-desktop-v3-replatform-proposal.md](./257-desktop-v3-replatform-proposal.md)
- [259-desktop-v3-detailed-design.md](./259-desktop-v3-detailed-design.md)
- [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
- [architecture.md](./architecture.md)
- [local-schema.md](./local-schema.md)
