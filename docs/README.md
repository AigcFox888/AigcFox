# AigcFox 当前文档入口

## 文档定位

本文档只负责给出当前仓库 `desktop-v3 Wave 1 Skeleton` 的顶层入口、默认进入方式和保留文档范围。

## 当前状态

- 当前项目只承认 `desktop-v3` 新架构骨架主线
- 当前 `desktop-v3 Wave 1 Skeleton` 已完成并冻结
- 当前正式发布链只保留 `Windows + macOS`；`ubuntu-24.04` 只保留 CI 验证宿主
- 当前默认宿主固定为 `Windows + WSL2`
- 当前默认执行面固定为 `WSL`
- 当前只开发骨架，不进入业务层实现，不开发历史业务，也不保留新功能实现文档

## 执行前附加基线

每次开始新任务或从中断恢复任务前，先重读：

1. [248-autonomous-execution-baseline.md](./248-autonomous-execution-baseline.md)
2. 再进入当前任务所属的 source-of-truth 文档链

## 最短阅读路径

### Desktop V3 Skeleton

1. [257-desktop-v3-replatform-proposal.md](./257-desktop-v3-replatform-proposal.md)
2. [258-desktop-v3-technical-baseline.md](./258-desktop-v3-technical-baseline.md)
3. [259-desktop-v3-detailed-design.md](./259-desktop-v3-detailed-design.md)
4. [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)
5. [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
6. [263-desktop-v3-wave1-acceptance-matrix.md](./263-desktop-v3-wave1-acceptance-matrix.md)
7. [264-desktop-v3-wave1-execution-runbook.md](./264-desktop-v3-wave1-execution-runbook.md)
8. [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
9. [268-desktop-v3-clean-pr-closeout.md](./268-desktop-v3-clean-pr-closeout.md)
10. [../apps/desktop-v3/README.md](../apps/desktop-v3/README.md)

### Desktop V3 UI / UX

1. [ui-client/system.md](./ui-client/system.md)
2. [ui-client/layout.md](./ui-client/layout.md)
3. [ui-client/components.md](./ui-client/components.md)
4. [ui-client/interaction.md](./ui-client/interaction.md)
5. [ui-client/charts.md](./ui-client/charts.md)

## 默认进入规则

- 默认不要回看历史文档链
- 默认不要继续扩写任何历史方案
- 默认采用多线程 / 多任务推进；只要任务边界、写入范围和验证链路彼此独立，就不要无意义地长期串行
- 如果用户只说“继续开发”或“开始下一步”而未指定范围，客户端 / local runtime / Tauri / renderer 默认进入 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)

## 使用出口

- 如果要继续 `desktop-v3` 骨架，转到 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- 如果要先做 Rust 宿主预检，执行 `pnpm qa:rust-host-readiness`
- 如果要先做 `desktop-v3` 的快速契约测试，执行 `pnpm test:desktop-v3-wave1-readiness`
- 如果要一键复验 `desktop-v3` 骨架，执行 `pnpm qa:desktop-v3-wave1-readiness`，稳定摘要入口是 `output/verification/latest/desktop-v3-wave1-readiness-summary.json`
- 如果要校验 workflow 语法与路径面，执行 `pnpm qa:github-actions-lint`
- 如果要校验命令文档真相层，执行 `pnpm qa:governance-command-docs`
- 如果要看 `desktop-v3` 客户端本地入口，转到 [../apps/desktop-v3/README.md](../apps/desktop-v3/README.md)
