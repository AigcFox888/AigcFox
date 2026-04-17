# AigcFox

当前仓库只保留 `desktop-v3` 客户端骨架、交付治理文档和与之直接相关的工作流与脚本。

当前默认开发环境按 `Windows + WSL2` 记录，仓库路径按 `D:\xiangmu\AigcFox` 与 `/mnt/d/xiangmu/aigcfox` 记录。
单轮开发与验证默认固定在 `WSL` 执行面，禁止在 `PowerShell` 与 `WSL` 之间双宿主混跑同一条依赖、构建、测试与 dev server 链路。

## 重装后快速恢复入口

- [docs/281-desktop-v3-post-reinstall-recovery-entry.md](docs/281-desktop-v3-post-reinstall-recovery-entry.md)

## 仓库目录矩阵

| 路径 | 作用 | 恢复时怎么用 |
| --- | --- | --- |
| `docs/281-desktop-v3-post-reinstall-recovery-entry.md` | 重装后快速恢复项目上下文的简明主入口 | 重装或长时间中断后先读 |
| `docs/` | 当前 `desktop-v3` 骨架、交付 / updater、UI 规范与工程契约真相层 | 再进入任务文档链 |
| `apps/desktop-v3/` | 当前唯一客户端代码目录 | 进入本地代码与命令入口 |
| `scripts/` | 当前 `desktop-v3` 验证、打包与治理脚本 | 跑文档 gate 与真实验证 |
| `.github/workflows/desktop-v3-*.yml` | 当前 CI、出包与交付 workflow | 看 GitHub 出包与文档 proof |

## 阅读入口

1. `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
2. `docs/README.md`
3. `docs/248-autonomous-execution-baseline.md`
4. `AGENTS.md`
5. `apps/desktop-v3/README.md`

## 当前根命令

```bash
pnpm dev:desktop-v3
pnpm test:desktop-v3-wave1-readiness
pnpm qa:desktop-v3-wave1-readiness
pnpm qa:desktop-v3-linux-package
pnpm test:desktop-v3-delivery-updater-docs
pnpm qa:desktop-v3-delivery-updater-docs
pnpm qa:desktop-v3-delivery-updater-github-remote-proof
pnpm qa:github-actions-lint
pnpm qa:governance-command-docs
```

## 说明

- 当前默认不进入业务层实现。
- 当前文档真相层以 `docs/`、`apps/desktop-v3/README.md` 与 `AGENTS.md` 为准。
- GitHub Actions 只负责 CI 与出包中转；中国用户正式更新源必须走七牛对象存储或自有 HTTPS 服务器。
