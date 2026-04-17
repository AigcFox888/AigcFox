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
- `pnpm qa:desktop-v3-command-governance`
- `pnpm qa:desktop-v3-localdb-governance`
- `pnpm qa:desktop-v3-runtime-boundary`

当前 `qa:desktop-v3-wave1-readiness` 的固定步骤：

- `desktop-v3-document-check`
- `desktop-v3-runtime-boundary`
- `desktop-v3-localdb-governance`
- `desktop-v3-command-governance`
- `desktop-v3-capability-governance`
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
- `desktop-v3-command-governance` 成功
- `desktop-v3-capability-governance` 成功
- `responsive smoke` 成功
- `tauri dev smoke` 成功
- `packaged app smoke` 成功
