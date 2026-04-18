# AigcFox desktop-v3 Tauri 2 治理基线

## 文档定位

本文档用于把 `desktop-v3` 在 `Tauri 2` 下的工程约束、权限边界和后续实现入口固定清楚。

它不定义业务功能。
它只定义：

- `Tauri 2` 在本项目里怎么用
- 哪些能力当前允许进入
- 哪些能力必须先做治理再进入实现
- 下一轮代码重写应优先收什么边界

## 当前冻结结论

`desktop-v3` 当前对 `Tauri 2` 的使用方式固定如下：

- renderer 只通过 `src/lib/runtime/*` 进入 Tauri 能力
- Rust `commands/*` 只做受控边界，不堆复杂编排
- `src-tauri/capabilities/*` 是宿主授权面真相，不把安全边界散落在页面代码里
- 窗口与 webview 的权限绑定以 `label` 为准，不以 `title`、路由或页面名为准
- `tauri.conf.json` 只放跨平台稳定项；一旦进入平台打包细化或更新实现，必须拆平台覆盖配置
- 自动更新后续必须走 `Tauri 2 updater plugin + 签名 + 自有 HTTPS 更新源`，不允许直接把 GitHub 当用户更新源

## Tauri 2 结构边界

当前固定的结构边界如下：

```text
React UI
-> src/lib/runtime/*
-> @tauri-apps/api/core invoke
-> Rust commands/*
-> Rust runtime/*
-> SQLite / secure store / Go API
```

规则：

- 页面、hooks、features 不直接 import 其他 Tauri JS API
- 当前用 `pnpm qa:desktop-v3-runtime-boundary` 对上述边界做静态门禁；`src/lib/runtime/*` 之外一旦出现 `@tauri-apps/*`、直接 `invoke()` 或全局 Tauri bridge 访问，就视为治理回退
- 当前用 `pnpm qa:desktop-v3-backend-client-governance` 对 `runtime/client/*` 做静态门禁；当前 Go API 边界只允许停留在 probe-only skeleton，文件集、`BackendClient` 公开面、probe-only endpoint、`reqwest` 触点和模块外持有面都被冻结在 Wave 1 范围
- 当前用 `pnpm qa:desktop-v3-runtime-skeleton-governance` 对 `runtime/security/*`、`runtime/state/*`、`runtime/diagnostics/*` 做静态门禁；当前 skeleton 只允许保留 `SecureStore` 保留态诊断快照、`SessionState` 最小 probe 时间戳和 `DiagnosticsService` 最小聚合面，不允许在现结构上继续补丁式扩 secure-store 写入、会话态或诊断编排
- 当前用 `pnpm qa:desktop-v3-runtime-contract-governance` 对 `runtime/models.rs` 与 `src/lib/runtime/contracts.ts / desktop-runtime.ts / tauri-command-types.ts` 做静态门禁；Rust model、TypeScript contract、`DesktopRuntime` 方法签名和 command payload/result map 必须保持一条冻结 truth chain，不允许 renderer 和 Rust 各自漂移
- 当前用 `pnpm qa:desktop-v3-error-contract-governance` 对 `src-tauri/src/error.rs`、`src/lib/errors/app-error.ts`、`src/lib/errors/normalize-command-error.ts`、`src/lib/runtime/tauri-command-runtime.ts` 做静态门禁；当前 command error truth chain 只允许承认 `code / message / requestId`，`details` 只保留兼容位，不允许 Rust / Tauri / renderer 各自补丁式长错误字段或消费者
- 当前用 `pnpm qa:desktop-v3-runtime-adapter-governance` 对 `src/lib/runtime` adapter skeleton 做静态门禁；文件集、`MockCommandRuntime / TauriCommandRuntime` 公开面、`runtime-registry`、`runtime-mode`、`tauri-bridge`、`tauri-invoke`、mock fixtures、`@tauri-apps/*` 触点和 source-level ownership 必须保持一条冻结 truth chain，不允许 renderer 侧继续散落实例化入口或 bridge helper
- 当前用 `pnpm qa:desktop-v3-app-shell-governance` 对 `src/app` renderer app shell 做静态门禁；`App / renderer-ready / app/layout / app/providers / app/router` 的文件集、顶层声明面、路由拓扑、导航 href 和 source-level ownership 必须保持一条冻结 truth chain，不允许 renderer 侧继续散落 bootstrap helper、provider 或 route shell
- 当前用 `pnpm qa:desktop-v3-page-governance` 对 `src/pages/*`、`src/components/navigation/nav-item.tsx`、`src/components/states/*`、`src/hooks/*` 做静态门禁；页面组合、shared state props、`useKeyboardShortcuts / useShellLayout` 的公开面、layout mode 与 route/sidebar/page-state/app-shell ownership 必须保持一条冻结 truth chain，不允许 renderer 侧继续散落 page helper、状态组件变体或 shell hook
- 当前用 `pnpm qa:desktop-v3-support-governance` 对 `src/lib/errors/*`、`src/lib/query/*`、`src/lib/notify.ts`、`src/lib/typography.ts`、`src/lib/utils.ts` 做静态门禁；错误归一、query singleton、toast 支撑、type token、`cn` helper 的公开面和 provider/page/runtime/ui primitive ownership 必须保持一条冻结 truth chain，不允许 renderer 侧继续散落 support helper、query 分支或 token/helper 变体
- 当前用 `pnpm qa:desktop-v3-feature-governance` 对 `src/features/diagnostics` 与 `src/features/preferences` 做静态门禁；文件集、顶层声明面、`DiagnosticsOverview / ThemePreferenceState` 形状，以及 `DiagnosticsPage / PreferencesPage / ThemeProvider` 的 source-level ownership 必须保持一条冻结 truth chain，不允许页面、provider 或新 feature 继续散落 runtime access 与主题状态持有
- 当前用 `pnpm qa:desktop-v3-command-governance` 对 `src-tauri/src/commands/*` 做静态门禁；commands 模块集、命令名、import 面和 helper 扩张都被冻结在当前 Wave 1 骨架范围
- 当前用 `pnpm qa:desktop-v3-capability-governance` 对 `main-window` capability、`permissions/main-window.toml`、`invoke_handler` 和 `tauri-command-types.ts` 做静态门禁；授权面与 IPC surface 必须保持同一条真相链
- 当前用 `pnpm qa:desktop-v3-host-governance` 对 `src-tauri/src/lib.rs`、`commands/mod.rs`、`runtime/mod.rs`、`window/initial_route.rs`、`window/main_window_target.rs`、`window/telemetry.rs`、`src/app/bootstrap/renderer-ready.ts`、`src/app/router/initial-route.ts`、`src/lib/runtime/runtime-mode.ts` 做静态门禁；宿主 env / log signal truth chain 必须保持同一条冻结真相，不允许 app/runtime/window 各自补丁式长新的 host switch 或日志标记
- 任何新的宿主能力先进入 `src/lib/runtime/*`，再决定是否暴露给页面
- Rust 侧能力先进入 `runtime/*`，`commands/*` 只保留薄层转发

## Capabilities 与 Permissions 规则

### 1. `capabilities/*` 是授权真相

当前项目固定把 `src-tauri/capabilities/*` 视为：

- 窗口授权清单
- webview 授权清单
- 插件与核心命令授权清单

不要把“代码里没调用”当成权限治理。
真正的授权面必须落到 capability 文件里。

### 2. 窗口绑定以 `label` 为准

当前所有 capability 绑定必须显式写窗口 `label`。

规则：

- 不用 `title` 代表安全边界
- 不用路由名代替窗口身份
- 新窗口、新 webview、新权限都必须先有 `label -> capability` 设计

### 3. 多 capability 命中时按合并思维设计

当前设计必须默认认为：

- 一个窗口可能匹配多个 capability
- capability 叠加后会扩大可用权限面

因此：

- 不要随手增加第二个通配 capability
- 不要把“临时调试授权”长期留在默认 capability
- 不要把未来窗口预留权限一次性塞给当前主窗口

### 4. 当前主窗口 capability 已改为显式最小集合

当前仓库已从 `default.json + core:default` 改为：

- `apps/desktop-v3/src-tauri/capabilities/main-window.json`
- 显式 `windows: ["main"]`
- 显式 `core:app:default / core:event:default / core:webview:default / core:window:default`
- 显式 app command permission：`desktop-preferences-read / desktop-preferences-write / desktop-diagnostics-read / desktop-backend-probe-read / desktop-renderer-boot-write`

这代表：

- 当前仓库不再把 `core:default` 当默认主窗口授权面
- 当前 capability 已经从“整包默认能力”收缩到“主窗口所需的 core IPC + app command 能力”
- 但这仍不是最终形态；等真实 `renderer -> invoke -> Rust` 放行证据补齐后，还要继续把 core default permission 缩成更细颗粒度

后续只要进入以下任一情况，必须先重写 capability：

- 新增第二个窗口或第二类 webview
- 新增 Tauri plugin
- 新增 renderer 侧 Tauri JS API 调用
- 新增窗口控制、文件系统、对话框、托盘、全局快捷键等宿主能力

下一轮优先重写目标：

1. 保持 `tauri dev` 只承担宿主窗口证明，不再把外部 dev URL 路径误当 renderer 放行证据
2. 以 packaged runtime smoke 作为 `renderer -> invoke -> Rust` 主证明，并据此继续收缩 permission 面
3. 为未来新窗口预留单独 capability 文件，而不是在当前文件里堆权限

## Commands 设计规则

### 1. command 是边界，不是业务层

`commands/*` 当前只负责：

- 参数接收
- 调 runtime
- 返回统一结果或统一错误
- 保持当前 proof 所需的 `trace_desktop_command` 标记

不负责：

- 复杂业务编排
- 跨多个本地子系统的流程堆叠
- 直接在 command 文件里拼接大量存储或 HTTP 细节

当前再冻结一条规则：

- 用 `pnpm qa:desktop-v3-command-governance` 把 `commands/*` 文件集固定在 `backend / diagnostics / preferences / renderer / mod.rs`
- 当前 Tauri command 公开面固定在 `desktop_get_backend_liveness / desktop_get_backend_readiness / desktop_get_diagnostics_snapshot / desktop_get_theme_preference / desktop_set_theme_preference / desktop_report_renderer_boot`
- `commands/*` 只允许停留在 `tauri::State`、`trace_desktop_command`、`CommandError`、`DesktopRuntime` 和 `runtime::models::*` 的 import 面
- 任何新的 command、helper、直接子运行时依赖或 I/O 细节进入 `commands/*`，都视为治理回退；先重写 runtime / command 边界，再谈扩展

## Runtime Contract Truth Chain

当前 `desktop-v3` 额外冻结一条跨边界 contract 规则：

- `src-tauri/src/runtime/models.rs`
- `src/lib/runtime/contracts.ts`
- `src/lib/runtime/desktop-runtime.ts`
- `src/lib/runtime/tauri-command-types.ts`

以上四个文件当前由 `pnpm qa:desktop-v3-runtime-contract-governance` 一起守护。

它当前冻结的不是“有没有文件”，而是同一条数据与命令真相链：

- Rust `ThemeMode / ThemePreference / DiagnosticsSnapshot / BackendProbe`
- TypeScript `ThemeMode / SecureStoreStatus / ThemePreference / DiagnosticsSnapshot / BackendProbe`
- `DesktopRuntime` 方法签名
- `DesktopCommandPayloadMap / DesktopCommandResultMap / DesktopCommandName`

规则：

- 不允许只改 Rust model 不改 TypeScript contract
- 不允许只改 TypeScript union/interface 不改 Rust model
- 不允许先补 command payload/result map，再晚一点补 `DesktopRuntime`
- 不允许继续在当前 contract surface 上补丁式加字段、加命令、加 boot stage

只要要扩当前 contract surface，就先结构化重写 runtime contract boundary，再同步更新文档与门禁。

## Renderer Runtime Adapter Rules

当前 renderer 侧的 `src/lib/runtime` 不是“随便放 helper 的目录”，而是 Wave 1 受控 adapter skeleton。

当前 `pnpm qa:desktop-v3-runtime-adapter-governance` 一起冻结：

- `mock-command-runtime.ts`
- `mock-fixtures.ts`
- `runtime-mode.ts`
- `runtime-registry.ts`
- `tauri-bridge.ts`
- `tauri-command-runtime.ts`
- `tauri-invoke.ts`

以及它们在 `src/lib/runtime` 内的固定文件集、导出面、Tauri 触点和 source-level ownership。

规则：

- `MockCommandRuntime` 与 `TauriCommandRuntime` 不允许继续补丁式长新公开方法
- `runtime-registry` 继续是 renderer 侧唯一 runtime 实例化入口
- `runtime-mode` 不允许扩成多种 preview / browser / hybrid 模式开关
- `@tauri-apps/*` import 与 `__TAURI_INTERNALS__` bridge probing 继续只允许留在 `tauri-bridge.ts`
- feature/page/bootstrap 不允许绕过 `runtime-registry` 直接 new runtime adapter
- mock fixtures 不允许在更多页面或 feature 里横向扩散

只要要扩当前 adapter boundary，就先结构化重写 renderer runtime adapter layer，再同步更新门禁与文档。

## Renderer App Shell Boundary Rules

当前 renderer 侧的 `src/app` 也不是一个可以随手堆 provider、layout helper 或 bootstrap 逻辑的目录，而是 Wave 1 受控 app shell boundary。

当前 `pnpm qa:desktop-v3-app-shell-governance` 一起冻结：

- `src/app/App.tsx`
- `src/app/bootstrap/renderer-ready.ts`
- `src/app/layout/app-shell.tsx`
- `src/app/layout/navigation-items.ts`
- `src/app/layout/page-header.tsx`
- `src/app/layout/shell-scaffold.tsx`
- `src/app/layout/sidebar.tsx`
- `src/app/providers/app-providers.tsx`
- `src/app/providers/theme-provider.tsx`
- `src/app/router/index.tsx`
- `src/app/router/initial-route.ts`
- `src/app/router/route-handle.ts`
- `src/app/router/routes.tsx`

以及它们在 `src/app` 内的固定文件集、顶层声明面、`"/" / "/diagnostics" / "/preferences"` 路由拓扑、导航 href、layout mode 与 source-level ownership。

规则：

- `main.tsx` 只允许直接持有 `App` 与 `renderer-ready`
- `App` 只允许直接持有 `AppProviders` 与 `appRouter`
- `routes.tsx` 只允许直接持有 `AppShell` 与初始路由装配
- `app-shell.tsx` 只允许直接持有 `PageHeader / ShellScaffold / Sidebar`
- `navigation-items.ts` 只允许由 `sidebar.tsx` 直接持有
- provider、bootstrap、layout、router 之间不允许继续补丁式横向扩 source-level ownership

只要要扩当前 app shell boundary，就先结构化重写 `src/app` 分层，再同步更新门禁与文档。

## Renderer Presentation Boundary Rules

当前 renderer 侧的 `src/pages`、shared state components、nav item 与 shell hooks 也不是可以随手堆 page helper 或补丁式状态分支的层，而是 Wave 1 受控 presentation boundary。

当前 `pnpm qa:desktop-v3-page-governance` 一起冻结：

- `src/pages/dashboard-page.tsx`
- `src/pages/diagnostics-page.tsx`
- `src/pages/preferences-page.tsx`
- `src/components/navigation/nav-item.tsx`
- `src/components/states/empty-state.tsx`
- `src/components/states/error-state.tsx`
- `src/components/states/loading-state.tsx`
- `src/hooks/use-keyboard-shortcuts.ts`
- `src/hooks/use-shell-layout.ts`

以及它们在当前 renderer presentation boundary 内的固定文件集、顶层声明面、quick link / query key / theme option 常量、shared state props、`LayoutMode / ShellLayoutState` 与 source-level ownership。

规则：

- `DashboardPage` 只允许保留 `highlights / quickLinks / DashboardPage`，并把 quick link href 固定在 `"/diagnostics"` 与 `"/preferences"`
- `DiagnosticsPage` 只允许保留 `diagnosticsOverviewQueryKey / DiagnosticsCard / DiagnosticsPage`；`PreferencesPage` 只允许保留 `themeOptions / PreferencesPage`
- `NavItem` props 固定为 `href / label / description / icon / compact`，不允许继续补丁式长成通用菜单项容器
- `EmptyState / ErrorState / LoadingState` 的 props contract 当前固定为页面共用展示边界，不允许各页面各自再长一套漂移版本
- `useKeyboardShortcuts` 与 `useShellLayout` 只允许由 `app-shell.tsx` 持有；`NavItem` 只允许由 `sidebar.tsx` 持有；shared state component 只允许由当前页面组合边界直接持有

只要要扩当前 presentation boundary，就先结构化重写 renderer page / state / hook 分层，再同步更新门禁与文档。

## Renderer Support Boundary Rules

当前 renderer 侧的 `src/lib/errors`、`src/lib/query`、`notify.ts`、`typography.ts`、`utils.ts` 也不是可以随手堆 helper 的缓冲区，而是 Wave 1 受控 shared support boundary。

当前 `pnpm qa:desktop-v3-support-governance` 一起冻结：

- `src/lib/errors/app-error.ts`
- `src/lib/errors/error-support-details.ts`
- `src/lib/errors/normalize-command-error.ts`
- `src/lib/query/query-client.ts`
- `src/lib/query/query-retry-policy.ts`
- `src/lib/notify.ts`
- `src/lib/typography.ts`
- `src/lib/utils.ts`

以及它们在当前 renderer support boundary 内的固定文件集、顶层声明面、`AppErrorShape / ErrorSupportDetail / CommandErrorPayload`、`notify` key 集、`typography` token 集与 source-level ownership。

规则：

- `AppError` 只允许由 `normalize-command-error.ts` 与 `mock-command-runtime.ts` 直接持有；`buildErrorSupportDetails` 只允许由 `ErrorState`、`DiagnosticsPage`、`PreferencesPage` 直接持有
- `queryClient` 只允许由 `app-providers.tsx` 直接持有；`shouldRetryDesktopQuery` 只允许由 `query-client.ts` 直接持有
- `notify` 只允许由 `PreferencesPage` 与 `useKeyboardShortcuts` 直接持有；`typography` 只允许由 `PageHeader` 与当前三张骨架页面直接持有
- `cn` 只允许留在当前 `ShellScaffold`、`Sidebar`、`NavItem` 与 `components/ui/*` primitive 内，不允许页面、feature 或更多 helper 再横向扩第二套 class merge 入口

只要要扩当前 support boundary，就先结构化重写 renderer shared support layer，再同步更新门禁与文档。

## Command Error Truth Chain

当前 Rust `src-tauri/src/error.rs` 到 renderer `app-error.ts / normalize-command-error.ts / tauri-command-runtime.ts` 也不是可以随手补字段的缓冲区，而是 Wave 1 受控 command error boundary。

当前 `pnpm qa:desktop-v3-error-contract-governance` 一起冻结：

- `src-tauri/src/error.rs`
- `src/lib/errors/app-error.ts`
- `src/lib/errors/normalize-command-error.ts`
- `src/lib/runtime/tauri-command-runtime.ts`

规则：

- Wave 1 的 Rust `CommandError` 只允许公开 `code / message / request_id`
- `RuntimeError` 只允许保留当前 variant 集；本地归一只允许收敛到 `invalid_request / not_ready / internal_error`，backend error 只透传 `code / message / request_id`
- TypeScript 只允许把 command error 统一成 `code / message / requestId`；`details` 只保留兼容位，不代表当前 Rust command 已承诺该字段
- `TauriCommandRuntime` 必须继续 `throw normalizeCommandError(error)`，不允许页面、feature 或更多 runtime helper 各自散落第二套 command error 归一链

只要要扩当前 error boundary，就先结构化重写 Rust / Tauri / TypeScript 错误契约，再同步更新门禁与文档。

## Renderer Feature Boundary Rules

当前 renderer 侧的 `src/features` 也不是随便堆 page helper 的目录，而是 Wave 1 受控 feature boundary。

当前 `pnpm qa:desktop-v3-feature-governance` 一起冻结：

- `features/diagnostics/diagnostics-api.ts`
- `features/diagnostics/diagnostics-formatters.ts`
- `features/diagnostics/diagnostics-types.ts`
- `features/preferences/preferences-api.ts`
- `features/preferences/preferences-store.ts`
- `features/preferences/preferences-types.ts`

以及它们在 `src/features` 内的固定文件集、顶层声明面、view-model / store 形状和 source-level ownership。

规则：

- `DiagnosticsPage` 只允许通过 `diagnostics-api` 与 `diagnostics-formatters` 进入诊断 feature，不允许直接持有 runtime adapter
- `PreferencesPage` 与 `ThemeProvider` 只允许通过 `preferences-api / preferences-store / preferences-types` 持有主题偏好和 renderer 主题状态
- `DiagnosticsOverview` 不允许继续补丁式扩成通用运行态容器；一旦要并入更多 probe 或编排态，就先重写 diagnostics feature 分层
- `ThemePreferenceState` 不允许继续补丁式长成通用全局 store；一旦要并入更多本地设置或跨页面同步逻辑，就先重写 preferences feature state boundary
- 页面、provider 或新 feature 不允许绕过当前 feature boundary 横向扩散 runtime access、formatter helper 或主题状态持有

只要要扩当前 feature boundary，就先结构化重写 renderer feature layer，再同步更新门禁与文档。

### 2. 有 I/O 的 command 默认走 `async`

当前项目固定规则：

- 网络请求：`async`
- SQLite 读写：优先按“可能阻塞”思维设计
- 诊断聚合：如果内部含本地 I/O 或远端 I/O，统一按 `async` 暴露

允许保持同步的场景只限：

- 纯内存计算
- 极小、确定不会继续扩张的本地同步值

### 3. SQLite 扩张前先重写阻塞边界

当前 `LocalDatabase` 仍采用同步 `rusqlite` 连接与查询，作为 Wave 1 骨架是可接受的。

但从现在起冻结一条规则：

- 当前用 `pnpm qa:desktop-v3-localdb-governance` 把 `LocalDatabase` 公开面固定死在 `new / initialize / get_preference / set_preference / probe / get_sync_cache_stats`
- 当前同一条 gate 还把 localdb 文件集固定在 `runtime/localdb/mod.rs + migrations.rs`，把 `rusqlite` / `rusqlite_migration` 触点固定在 `runtime/localdb/* + error.rs`，并把 `LocalDatabase` 在模块外的直接引用固定在 `runtime/mod.rs`
- 只要本地数据库操作从“单值偏好 / 简单统计”扩到列表、批量写入、复杂查询或同步编排，就不能继续直接在当前路径上叠逻辑
- 必须先重写为独立的 localdb adapter / blocking bridge，再继续扩功能

换句话说：

- 当前不是立即重构
- 但后续扩展时禁止在现结构上继续补丁堆叠

## Runtime Skeleton 规则

当前 `runtime/security`、`runtime/state`、`runtime/diagnostics` 虽然还是骨架，但也不再允许自由扩张。

从现在起固定规则：

- 当前用 `pnpm qa:desktop-v3-runtime-skeleton-governance` 把 `runtime/security/mod.rs + runtime/state/mod.rs + runtime/diagnostics/mod.rs` 文件集固定死在当前 Wave 1 骨架
- `SecureStoreStatus / SecureStoreSnapshot / SecureStore` 只允许保留当前 diagnostics-only surface；`provider / status / writes_enabled` 之外不再继续扩字段，`snapshot()` 之外不再继续加真实 secure-store helper
- `SessionSnapshot / SessionState` 只允许保留最近一次 backend probe 时间戳与 `record_backend_probe / snapshot`；如果要扩缓存索引、会话上下文或派生态，就先重写 runtime state 模块
- `DiagnosticsService` 只允许保留 `new / snapshot` 与当前最小字段面；如果要继续堆 service、缓存或复杂聚合编排，就先重写 diagnostics 分层
- 模块外持有面固定收敛：`SecureStore` 相关类型只允许停留在 `runtime/mod.rs + runtime/models.rs + runtime/diagnostics/mod.rs`，`SessionState` 与 `DiagnosticsService` 在模块外只允许由 `runtime/mod.rs` 直接持有

换句话说：

- Wave 1 的 secure store skeleton 不等于已经开放真实 keyring 写入
- Wave 1 的 session state 不等于可以继续当通用运行态容器
- Wave 1 的 diagnostics service 不等于可以继续在原结构上补编排

后续只要任一能力要跨出当前最小边界，就必须先结构化重写，不允许继续碎片补丁。

## 配置分层规则

当前 `tauri.conf.json` 只允许承载：

- 应用标识
- 共享窗口基础配置
- 共享 build 入口
- 共享 icon 基线

当前再冻结一条规则：

- 当前用 `pnpm qa:desktop-v3-platform-config-governance` 把 `src-tauri/tauri.conf.json` 文件集固定死在共享单文件，并把 top-level / build / app / bundle 字段面冻结在当前 Wave 1 骨架所需集合
- 当前 `tauri.linux.conf.json / tauri.windows.conf.json / tauri.macos.conf.json` 只保留为未来拆分方案中的目标文件名，不允许提前落文件、提前接 workflow，也不允许把对应平台细项先塞回共享配置凑合过
- 当前主窗口的 URL、尺寸和导航边界继续由 Rust `window/main_window.rs + window/main_window_target.rs + window/initial_route.rs + window/telemetry.rs` 创建，不把窗口细节重新塞回 `tauri.conf.json`

以下内容一旦进入实现，必须拆分到平台覆盖配置：

- Windows 打包细节
- macOS 打包细节
- Linux bundle 细节
- 更新源差异
- 平台特有安全或运行时开关

当前固定拆分策略：

```text
tauri.conf.json
tauri.linux.conf.json
tauri.windows.conf.json
tauri.macos.conf.json
```

在尚未进入这些能力前，不预先堆平台细项。

## Dev / Smoke / Production 规则

当前必须清楚区分三类变量：

### 开发变量

- `devUrl`
- Vite host / port

### Smoke 变量

- `AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE`
- `AIGCFOX_DESKTOP_V3_TRACE_COMMANDS`
- `AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE`
- `AIGCFOX_DESKTOP_V3_TAURI_DEV_*`

### 生产变量

- 未来更新源
- 未来远端 API 正式地址
- 未来签名和发布相关配置

规则：

- smoke 变量只服务真实验证
- 不能把 smoke 变量演变成业务开关
- 不能把生产配置硬编码回 smoke 脚本
- 当前 app/runtime/window 侧允许读取的宿主变量只包括 `AIGCFOX_BACKEND_BASE_URL`、`AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE`、`AIGCFOX_DESKTOP_V3_DEV_WINDOW_URL`、`AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE`、`AIGCFOX_DESKTOP_V3_TRACE_COMMANDS`、`AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE`、`VITE_DESKTOP_V3_INITIAL_ROUTE`、`VITE_DESKTOP_V3_RUNTIME_MODE`、`VITE_DESKTOP_V3_RENDERER_BOOT_PROBE`；任何新增变量先通过 `pnpm qa:desktop-v3-host-governance` 失败闭口，再回到结构化重写
- 当前允许输出的宿主日志信号只包括 `desktop-v3.main-window.navigation`、`desktop-v3.main-window.page-load`、`desktop-v3.main-window.url`、`desktop-v3.command.invoke`、`desktop-v3.renderer.boot`、`desktop-v3.startup-backend-probe.scheduled / begin / end / liveness.ok / liveness.err / readiness.ok / readiness.err`；任何新增 host log signal 都视为治理回退

## Updater 进入条件

当前 Wave 1 明确不实现自动更新。

但从技术边界上现在就冻结：

- 后续必须使用 `Tauri 2 updater plugin`
- 必须要求签名校验
- 更新源必须是自有 HTTPS 源
- GitHub Actions 只负责产出构件，不直接作为中国用户更新入口
- 当前用 `pnpm qa:desktop-v3-updater-governance` 对 `Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source 做静态门禁；在 updater 结构化重写落地前，不允许提前引入 updater plugin、manifest / policy endpoint、强更策略字段、GitHub Releases 客户端更新源或 `update-guard` 壳层文件

当前不允许：

- 直接把 GitHub Releases 当默认更新源
- 未签名更新
- 先接客户端更新、后补签名与发布治理

## 当前仓库对应关系

当前仓库中与本基线直接相关的入口如下：

- `apps/desktop-v3/src-tauri/tauri.conf.json`
- `apps/desktop-v3/src-tauri/capabilities/main-window.json`
- `apps/desktop-v3/src-tauri/src/window/*`
- `apps/desktop-v3/src-tauri/src/lib.rs`
- `apps/desktop-v3/src-tauri/src/commands/*`
- `apps/desktop-v3/src-tauri/src/runtime/*`
- `apps/desktop-v3/src/lib/runtime/*`

这些文件后续只要继续扩展 `Tauri 2` 能力，就必须先回看本文档。

## 下一轮优先级

当前下一轮最值得优先收口的顺序固定如下：

1. capability / permission 最小授权面设计
2. remote client 分层重写方案
3. localdb 阻塞边界重写方案
4. 平台配置拆分方案

在这四项未讲清前，不继续扩大 `desktop-v3` 的宿主能力面。

## 使用出口

- 技术基线见 [258-desktop-v3-technical-baseline.md](./258-desktop-v3-technical-baseline.md)
- 详细设计见 [259-desktop-v3-detailed-design.md](./259-desktop-v3-detailed-design.md)
- 执行基线见 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- GitHub / 更新边界见 [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
