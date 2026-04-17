# AigcFox desktop-v3 详细设计

## 文档定位

本文档用于把 `desktop-v3 Wave 1 Skeleton` 的模块拆分和数据边界设计清楚。

当前只讨论骨架：

- React 壳层怎么分
- Tauri commands 怎么分
- Rust local runtime 怎么分
- 本地 SQLite 和远端 Go API 的边界怎么分
- 响应式布局怎么落

## 总体架构

```mermaid
graph TD
    UI["React UI Shell"] --> CMD["Tauri Commands / Events"]
    CMD --> RUNTIME["Rust Local Runtime"]
    RUNTIME --> LOCAL["Local SQLite / Keyring / Logs"]
    RUNTIME --> API["Go HTTP API"]
    API --> PG["PostgreSQL"]
```

## 当前范围

当前只保留：

- App Shell
- Layout Shell
- Route Shell
- Command Boundary
- Rust Runtime Boundary
- Local Storage Boundary
- Diagnostics Boundary

当前不进入业务域实现。

## React 侧模块设计

建议目录按职责拆开：

```text
apps/desktop-v3/
  src/
    app/
      router/
      layout/
      providers/
    pages/
    features/
    components/
    lib/
      runtime/
      errors/
      query/
    styles/
```

### `app/router`

职责：

- 路由声明
- 路由守卫占位
- 页面级懒加载边界

### `app/layout`

职责：

- 侧边栏
- 顶部区
- 主内容容器
- 响应式布局切换

### `app/providers`

职责：

- React Query provider
- 主题 provider
- Toast provider
- 路由壳层所需全局 provider
- 查询重试策略统一集中在 provider 侧配置，不让页面各自定义重试规则

### `lib/runtime`

职责：

- 统一封装 desktop runtime
- 屏蔽 Tauri command 与 browser mock runtime 的差异
- 不让组件层散落原始 command 调用
- 做 TypeScript 侧错误归一和契约对齐
- Tauri command adapter 需要可独立验证 command 名、payload 透传和 invoke 错误归一
- Windows 宿主验证拆成两段：`tauri dev` 只证明宿主窗口真实启动；packaged runtime smoke 才作为 renderer / invoke / backend 主证据
- 当前默认开发环境固定为 `Windows + WSL2`，真实窗口 proof 默认在固定 `WSL` 单执行面下通过 `WSLg` 完成；不要把 `WSLg` 特定图形兼容处理当作唯一主链前提，也不要把同一条验证链切回 `PowerShell`

默认原则仍然是：优先走 command，而不是让页面直接发 HTTP。

补充约束：

- 页面、hooks、features 不直接 import 其他 Tauri JS API
- renderer 进入宿主能力的唯一入口保持在 `src/lib/runtime/*`
- 新增宿主能力时，先改 runtime adapter，再改页面

### `lib/errors`

职责：

- 统一 `ApiError / CommandError`
- 统一页面反馈需要的错误结构
- 把统一错误对象格式化为错误态可见的 support details，例如 `code / requestId / runtime message`

### `lib/query`

职责：

- 集中管理 `QueryClient`
- 集中管理 query retry 策略
- 当前骨架固定：`not_ready` 不重试，其他错误最多重试一次

## Rust 侧模块设计

建议按职责拆开：

```text
src-tauri/
  src/
    commands/
    runtime/
      client/
      localdb/
      diagnostics/
      state/
      security/
```

### `commands`

职责：

- 暴露受控 command
- 做参数接收
- 把请求转给 runtime

规则：

- command 文件保持小而薄
- 默认不在 command 里拼复杂本地 I/O 和远端编排
- 含 I/O 的 command 优先走 `async`

### `runtime/client`

职责：

- 调用 Go HTTP API
- 统一远端响应解析
- 统一把远端错误转换为本地错误
- 保留 request id 等远端 envelope 元数据，继续向上游 UI 透传

### `runtime/localdb`

职责：

- 打开 SQLite
- 管理 `rusqlite_migration`
- 提供本地偏好和缓存读写

补充规则：

- 当前同步 `rusqlite` 只承接 Wave 1 的小数据骨架
- 一旦进入列表、批量写入、复杂查询或同步编排，必须先重写为独立 blocking adapter，再继续扩功能

### `runtime/diagnostics`

职责：

- 记录本地诊断信息
- 为 UI 提供最小健康快照

### `runtime/state`

职责：

- 承接本地会话态、缓存索引和轻量运行态
- 为 diagnostics 提供最小运行态快照，例如最近一次 backend probe 时间

### `runtime/security`

职责：

- secure store / keyring
- 敏感数据裁剪
- 输出结构化 secure store skeleton 快照：`provider / status / writes_enabled`
- Wave 1 只保留边界与诊断合同，不落真实密钥写入实现

## 布局系统设计

当前布局必须按以下规则落地：

- 外层使用 `flex` 或 `grid`
- 侧边栏标准宽度 `240px`
- compact 模式侧边栏宽度 `200px`
- 主内容区 `flex: 1`
- `1920px+` 时内容区内层容器 `max-width = 1400px` 且居中
- `1000px` 到 `1279px` 只允许保护性降级，不允许横向滚动

布局分段：

- `<1366px`：compact
- `1366px - 1919px`：standard
- `1920px+`：centered

## 启动链路

当前骨架启动链建议如下：

1. React 初始化 providers
2. 创建路由壳层
3. 初始化 command client
4. Rust 侧初始化本地数据库与运行时状态
5. UI 请求本地诊断快照
6. 需要远端数据时，通过 command 转发到 Go API

## Tauri 2 专项约束

当前 `desktop-v3` 对 `Tauri 2` 额外固定以下规则：

- capability 文件是安全边界真相，不把权限治理留给“代码约定”
- 新窗口权限绑定依赖 `label`
- 不把 smoke 环境变量演变成业务开关
- `tauri.conf.json` 只放共享配置；平台差异未来进入 `tauri.<platform>.conf.json`
- updater 进入实现前，先补签名、公钥、HTTPS 发布源与产物流向设计

详细规则见 [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)。

## 命令链路

当前主链固定如下：

1. 页面调用 `lib/runtime/*`
2. TypeScript 封装调用 Tauri command
3. Rust `commands/*` 接收请求
4. Rust runtime 决定：
   - 只读本地数据
   - 或转发到 Go API
   - 或两者组合
5. Rust 统一返回结构化结果或结构化错误
6. React 页面更新状态

## 本地与远端数据边界

### 只存本地

- 用户偏好
- 布局密度
- 本地缓存
- 本地诊断快照
- 同步辅助标记

### 只存远端

- 权威业务数据
- 云端配置
- 审计真相
- 多端共享状态

### 双边存在，但远端为准

- 只读缓存快照
- 需要离线展示的摘要对象

具体 schema 以 [local-schema.md](./local-schema.md) 为准。

## 错误传递设计

错误链固定如下：

```text
Go error response -> Rust runtime error -> Tauri command error -> TypeScript error object
```

规则：

- Go 负责权威错误码
- Rust 负责本地归一和安全裁剪
- TypeScript 只处理统一错误对象
- 页面错误态默认展示结构化 support details，不在页面里散落手写错误码拼接逻辑

## 预留边界

Wave 1 可以预留目录或接口边界，但不能把它们包装成当前已实现能力。

允许预留的边界类型：

- 云端适配器
- 本地执行适配器
- 更新适配器
- 诊断适配器

## 当前不做的事

- 业务页面实现
- 复杂流程编排
- 自动更新实现
- 本地执行引擎实现
- 将所有逻辑塞进单个 `App.tsx` 或单个 `lib.rs`

## 关联文档

- [257-desktop-v3-replatform-proposal.md](./257-desktop-v3-replatform-proposal.md)
- [258-desktop-v3-technical-baseline.md](./258-desktop-v3-technical-baseline.md)
- [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- [architecture.md](./architecture.md)
- [local-schema.md](./local-schema.md)
