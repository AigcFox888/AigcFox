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
- 当前用 `pnpm qa:desktop-v3-command-governance` 对 `src-tauri/src/commands/*` 做静态门禁；commands 模块集、命令名、import 面和 helper 扩张都被冻结在当前 Wave 1 骨架范围
- 当前用 `pnpm qa:desktop-v3-capability-governance` 对 `main-window` capability、`permissions/main-window.toml`、`invoke_handler` 和 `tauri-command-types.ts` 做静态门禁；授权面与 IPC surface 必须保持同一条真相链
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

## 配置分层规则

当前 `tauri.conf.json` 只允许承载：

- 应用标识
- 共享窗口基础配置
- 共享 build 入口
- 共享 icon 基线

当前再冻结一条规则：

- 当前用 `pnpm qa:desktop-v3-platform-config-governance` 把 `src-tauri/tauri.conf.json` 文件集固定死在共享单文件，并把 top-level / build / app / bundle 字段面冻结在当前 Wave 1 骨架所需集合
- 当前 `tauri.linux.conf.json / tauri.windows.conf.json / tauri.macos.conf.json` 只保留为未来拆分方案中的目标文件名，不允许提前落文件、提前接 workflow，也不允许把对应平台细项先塞回共享配置凑合过
- 当前主窗口的 URL、尺寸和导航边界继续由 Rust `window.rs` 创建，不把窗口细节重新塞回 `tauri.conf.json`

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
- `apps/desktop-v3/src-tauri/src/window.rs`
- `apps/desktop-v3/src-tauri/src/lib.rs`
- `apps/desktop-v3/src-tauri/src/commands/*`
- `apps/desktop-v3/src-tauri/src/runtime/*`
- `apps/desktop-v3/src/lib/runtime/*`

这些文件后续只要继续扩展 `Tauri 2` 能力，就必须先回看本文档。

## 下一轮优先级

当前下一轮最值得优先收口的顺序固定如下：

1. capability / permission 最小授权面设计
2. localdb 阻塞边界重写方案
3. 平台配置拆分方案
4. updater plugin 接入前置设计

在这四项未讲清前，不继续扩大 `desktop-v3` 的宿主能力面。

## 使用出口

- 技术基线见 [258-desktop-v3-technical-baseline.md](./258-desktop-v3-technical-baseline.md)
- 详细设计见 [259-desktop-v3-detailed-design.md](./259-desktop-v3-detailed-design.md)
- 执行基线见 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- GitHub / 更新边界见 [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
