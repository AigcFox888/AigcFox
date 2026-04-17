# AigcFox desktop-v3 重构提案

## 文档定位

本文档用于把新客户端重构方向固定为正式提案。

它只回答：

- 为什么客户端要单独在 `apps/desktop-v3` 建新主线
- 为什么当前先做 skeleton，不做业务层
- 新客户端与 Go backend、operator 的关系是什么
- 后续应沿哪条文档链推进

## 提案结论

新客户端主线固定为：

- 目录：`apps/desktop-v3`
- 宿主：`Tauri 2`
- 前端：`React + TypeScript`
- 本地运行时：`Rust`
- 当前范围：`Wave 1 Skeleton`

当前不进入业务层实现。

## 为什么必须单独开 `apps/desktop-v3`

### 1. 先把新架构边界立住

当前用户已明确要求只认新架构骨架，不再把旧方案继续混进新主线。

因此新客户端必须从目录层面就独立：

- 客户端壳层单独治理
- 本地运行时单独治理
- 新 UI 系统单独治理
- 新文档链单独治理

### 2. skeleton-first 才能避免第二次返工

如果在宿主、命令边界、本地存储和布局体系都没收敛前就直接写业务页，后续会反复推倒。

所以当前更合理的顺序是：

1. 先冻结技术基线
2. 先建立 Tauri + React + Rust 壳层
3. 先建立响应式布局和设计系统
4. 先建立本地数据库与命令边界
5. 再讨论业务域如何进入

### 3. 新客户端是执行型桌面工作台，不是简单页面壳

当前产品方向要求客户端具备长期可扩展的本地执行能力，因此需要从第一天就把以下边界立清楚：

- React UI 壳层
- Tauri command 边界
- Rust local runtime
- 本地 SQLite
- Go backend HTTP API

## 当前文档边界

当前 `desktop-v3` 文档链只承认：

- 框架骨架
- 布局系统
- 设计系统
- 命令边界
- 本地存储边界
- 诊断与基础状态边界

当前不承认：

- 业务流实现
- 商业化实现
- 自动化业务实现
- 完整更新实现

## 与其他系统的关系

### 与 Go backend 的关系

`desktop-v3` 的远端真相层固定是 Go control plane。

默认通信主链：

```text
React -> Tauri commands -> Rust local runtime -> Go API
```

### 与 operator 的关系

operator 继续作为唯一运营后台。

`desktop-v3` 不复制 operator 端的运营能力，只消费受控配置和受控 API。

## 当前只做 `Wave 1 Skeleton`

Wave 1 只做：

- `apps/desktop-v3` 工程骨架
- Tauri 宿主骨架
- React 路由与布局壳层
- 基础 UI 系统
- 本地命令边界
- 本地数据与诊断骨架

Wave 1 不做：

- 业务页面堆叠
- 复杂流程编排
- 商业化相关实现
- 更新策略实现

## 当前结论

- `apps/desktop-v3` 是唯一的新客户端目录
- 当前范围固定为 `Wave 1 Skeleton`
- 后续必须沿 `257 -> 258 -> 259 -> 260` 文档链推进
