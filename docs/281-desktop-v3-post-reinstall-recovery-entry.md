# AigcFox 重装后快速恢复主入口

## 项目定位

当前仓库只保留 `desktop-v3` 客户端骨架、交付 / updater 治理文档，以及与它们直接相关的脚本与工作流。

## 当前默认宿主

- 当前默认开发宿主：`Windows + WSL2`
- 当前默认仓库路径：`D:\xiangmu\AigcFox`（Windows） / `/mnt/d/xiangmu/aigcfox`（WSL）
- 当前默认执行面固定为 `WSL`
- 如果当前机器实际采用 `Windows + WSL2` 混合环境，不要在同一仓库、同一依赖目录、同一 dev server / watcher / build / test 链路上同时混跑 `PowerShell` 与 `WSL`

## 项目作用

当前仓库只负责：

- `Tauri 2 + React + Rust local runtime` 客户端骨架
- `desktop-v3` 文档真相层与验证链
- GitHub Actions 出包中转与自有更新源治理基线

当前仓库不负责：

- 历史客户端方案
- 历史 backend 实现
- 任何业务层实现

## 当前技术栈

- Desktop：`Tauri 2`、`React 18`、`TypeScript`、`Vite`
- UI：`shadcn/ui`、`Radix UI`、`Tailwind CSS 4`、`Zustand`
- Rust Local Runtime：`Tauri commands`、本地诊断、状态与能力薄层
- Local DB：`rusqlite (bundled)` + `rusqlite_migration`
- 通信边界：`React -> Tauri commands -> Rust thin proxy -> Go API`
- 交付 / 更新：`GitHub Actions` 出包中转，正式更新源走七牛或自有 `HTTPS`

## 当前保留目录

| 路径 | 作用 |
| --- | --- |
| `apps/desktop-v3/` | 当前客户端源码、Tauri 宿主、Rust local runtime 与前端壳层 |
| `docs/` | 当前唯一文档真相层，包括骨架、交付、UI 规范、工程契约与 ADR |
| `scripts/` | 当前 `desktop-v3` 文档 gate、验证链、打包与 proof 脚本 |
| `.github/workflows/desktop-v3-*.yml` | 当前 CI、出包与交付治理 workflow |
| `config/governance-command-docs-registry.json` | 当前命令文档治理注册表 |

## 当前验证链

- 宿主 / Rust 预检：`pnpm qa:rust-host-readiness`
- 骨架快速入口：`pnpm test:desktop-v3-wave1-readiness`
- 骨架完整入口：`pnpm qa:desktop-v3-wave1-readiness`
- 交付文档快速入口：`pnpm test:desktop-v3-delivery-updater-docs`
- 交付文档完整入口：`pnpm qa:desktop-v3-delivery-updater-docs`
- 远端 GitHub proof：`pnpm qa:desktop-v3-delivery-updater-github-remote-proof`
- 最新摘要固定入口：
  - `output/verification/rust-host-readiness-summary.json`
  - `output/verification/latest/desktop-v3-wave1-readiness-summary.json`
  - `output/verification/latest/desktop-v3-delivery-updater-docs-summary.json`
  - `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`

## 重装后重读顺序

1. `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
2. `docs/README.md`
3. `docs/248-autonomous-execution-baseline.md`
4. `AGENTS.md`
5. `apps/desktop-v3/README.md`
6. 按任务进入对应 source-of-truth：
   - 骨架：`257 -> 258 -> 259 -> 269 -> 260 -> 263 -> 264 -> 267 -> 268`
   - 交付 / updater：`267 -> 269 -> 274 -> 275 -> 276 -> 277 -> 278 -> 279 -> 280`
