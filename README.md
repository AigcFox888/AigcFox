# AigcFox

当前仓库只保留 `desktop-v3 Wave 1 Skeleton` 骨架、对应代码和直接相关的验证链路。

当前默认开发环境按 `Windows + WSL2` 记录，仓库路径按 `D:\xiangmu\AigcFox` 与 `/mnt/d/xiangmu/aigcfox` 记录。
单轮开发与验证默认固定在 `WSL` 执行面，禁止在 `PowerShell` 与 `WSL` 之间双宿主混跑同一条依赖、构建、测试与 dev server 链路。

## 仓库目录矩阵

| 路径 | 作用 | 当前怎么用 |
| --- | --- | --- |
| `docs/` | 当前 `desktop-v3 Wave 1 Skeleton` 文档真相层与 UI 规范 | 先读骨架文档链 |
| `apps/desktop-v3/` | 当前唯一客户端代码目录 | 进入本地代码与命令入口 |
| `scripts/` | 当前 `desktop-v3` 验证与治理脚本 | 跑文档 gate、治理 gate 与真实验证 |
| `.github/workflows/` | 当前 CI 与出包 workflow | 查看 `desktop-v3-ci` 与 `desktop-v3-package` |

## 阅读入口

1. `docs/README.md`
2. `docs/248-autonomous-execution-baseline.md`
3. `AGENTS.md`
4. `apps/desktop-v3/README.md`

## 当前根命令

```bash
pnpm dev:desktop-v3
pnpm qa:rust-host-readiness
pnpm test:desktop-v3-wave1-readiness
pnpm qa:desktop-v3-wave1-readiness
pnpm qa:github-actions-lint
pnpm qa:governance-command-docs
```

`pnpm dev:desktop-v3` 在当前 `WSL` 默认口径下固定以 `mock runtime` 启动浏览器壳层；需要真实宿主链路时，走 `pnpm --filter @aigcfox/desktop-v3 tauri dev`。

## 说明

- 当前默认不进入业务层实现，也不保留历史业务或新功能实现文档。
- 当前文档真相层以 `docs/`、`apps/desktop-v3/README.md` 与 `AGENTS.md` 为准。
- GitHub Actions 只负责 CI 与 `Windows + macOS` bundle 产出，不作为客户端更新源。
- 当前正式分发路径固定为：`GitHub Actions 出包 -> 维护者下载 Actions artifact -> 上传到七牛或自有 HTTPS 下载源 -> 中国区用户下载`。
