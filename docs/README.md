# AigcFox 当前文档入口

## 文档定位

本文档只负责给出当前仓库 `desktop-v3` 主线的顶层入口、默认进入方式和保留文档范围。

## 当前状态

- 当前项目只承认 `desktop-v3` 新架构主线
- 当前 `desktop-v3 Wave 1 Skeleton` 已完成并冻结
- 当前 desktop active documentation line：`desktop-v3 Delivery / Updater Baseline`
- 当前 `desktop-v3 Wave 1` 已完成本地与远端 clean closeout 证据
- 当前 `desktop-v3 Delivery / Updater Baseline` 已完成本地与远端 proof 收口，收口记录见 [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)；当前 head 的远端 proof 结论仍以 latest summary 为准
- 当前正式发布链只保留 `Windows + macOS`；`ubuntu-24.04` 只保留 CI 验证宿主
- 当前默认宿主恢复主链：`Windows + WSL2`
- 当前默认执行面固定为 `WSL`；本地链只做 proof 验证，不做 Linux 终端用户安装包收口
- 当前明确排除 `qa:desktop-v3-linux-package`
- 当前只开发骨架，不进入业务层实现，不开发历史业务，也不把历史方案融到新主线

## 重装 / 系统恢复优先入口

如果当前属于系统重装、跨环境恢复或长时间中断恢复，先读：

1. [281-desktop-v3-post-reinstall-recovery-entry.md](./281-desktop-v3-post-reinstall-recovery-entry.md)
2. 再回到当前文档索引与 active source-of-truth

## 执行前附加基线

每次开始新任务或从中断恢复任务前，先重读：

1. 如果属于系统重装或长时间中断恢复，先读 [281-desktop-v3-post-reinstall-recovery-entry.md](./281-desktop-v3-post-reinstall-recovery-entry.md)
2. [248-autonomous-execution-baseline.md](./248-autonomous-execution-baseline.md)
3. 再进入当前任务所属的 source-of-truth 文档链

## 最短阅读路径

### Desktop V3 Skeleton

1. [281-desktop-v3-post-reinstall-recovery-entry.md](./281-desktop-v3-post-reinstall-recovery-entry.md)
2. [257-desktop-v3-replatform-proposal.md](./257-desktop-v3-replatform-proposal.md)
3. [258-desktop-v3-technical-baseline.md](./258-desktop-v3-technical-baseline.md)
4. [259-desktop-v3-detailed-design.md](./259-desktop-v3-detailed-design.md)
5. [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)
6. [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
7. [263-desktop-v3-wave1-acceptance-matrix.md](./263-desktop-v3-wave1-acceptance-matrix.md)
8. [264-desktop-v3-wave1-execution-runbook.md](./264-desktop-v3-wave1-execution-runbook.md)
9. [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
10. [268-desktop-v3-clean-pr-closeout.md](./268-desktop-v3-clean-pr-closeout.md)
11. [../apps/desktop-v3/README.md](../apps/desktop-v3/README.md)

### Desktop Delivery / Updater

1. [281-desktop-v3-post-reinstall-recovery-entry.md](./281-desktop-v3-post-reinstall-recovery-entry.md)
2. [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
3. [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)
4. [274-desktop-v3-delivery-updater-proposal.md](./274-desktop-v3-delivery-updater-proposal.md)
5. [275-desktop-v3-delivery-updater-technical-baseline.md](./275-desktop-v3-delivery-updater-technical-baseline.md)
6. [276-desktop-v3-delivery-updater-detailed-design.md](./276-desktop-v3-delivery-updater-detailed-design.md)
7. [277-desktop-v3-delivery-updater-execution-baseline.md](./277-desktop-v3-delivery-updater-execution-baseline.md)
8. [278-desktop-v3-delivery-updater-acceptance-matrix.md](./278-desktop-v3-delivery-updater-acceptance-matrix.md)
9. [279-desktop-v3-delivery-updater-execution-runbook.md](./279-desktop-v3-delivery-updater-execution-runbook.md)
10. [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)

### Desktop V3 UI / UX

1. [ui-client/system.md](./ui-client/system.md)
2. [ui-client/layout.md](./ui-client/layout.md)
3. [ui-client/components.md](./ui-client/components.md)
4. [ui-client/interaction.md](./ui-client/interaction.md)
5. [ui-client/charts.md](./ui-client/charts.md)

### 通用工程契约

1. [architecture.md](./architecture.md)
2. [api.md](./api.md)
3. [local-schema.md](./local-schema.md)
4. [workflow.md](./workflow.md)
5. [adr/README.md](./adr/README.md)

## 默认进入规则

- 默认不要回看历史文档链
- 默认不要继续扩写任何历史方案
- 默认采用多线程 / 多任务推进；只要任务边界、写入范围和验证链路彼此独立，就不要无意义地长期串行
- 如果用户只说“继续开发”或“开始下一步”而未指定范围：
  - 客户端 / local runtime / Tauri / renderer 进入 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
  - 交付 / updater / 更新源 / 出包 / 发布链进入 [277-desktop-v3-delivery-updater-execution-baseline.md](./277-desktop-v3-delivery-updater-execution-baseline.md)

## 使用出口

- 如果要继续 `desktop-v3` 骨架，转到 [260-desktop-v3-wave1-execution-baseline.md](./260-desktop-v3-wave1-execution-baseline.md)
- 如果要继续 `desktop-v3` 交付 / 更新基线，转到 [277-desktop-v3-delivery-updater-execution-baseline.md](./277-desktop-v3-delivery-updater-execution-baseline.md)
- 如果要先做 `desktop-v3` 的快速契约测试，执行 `pnpm test:desktop-v3-wave1-readiness`
- 如果要一键复验 `desktop-v3` 骨架，执行 `pnpm qa:desktop-v3-wave1-readiness`，稳定摘要入口是 `output/verification/latest/desktop-v3-wave1-readiness-summary.json`
- 如果要先做交付 / 更新文档线的快速契约测试，执行 `pnpm test:desktop-v3-delivery-updater-docs`
- 如果要验证交付 / 更新文档线，执行 `pnpm qa:desktop-v3-delivery-updater-docs`，摘要入口是 `output/verification/latest/desktop-v3-delivery-updater-docs-summary.json`
- 如果要核对交付 / 更新文档线的远端 GitHub proof，执行 `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`，摘要入口是 `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`
- 如果要看当前交付 / 更新文档线的收口记录与固定读取口径，转到 [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)；当前 head 的远端 proof 结论仍以 latest summary 为准
- 如果要看 `desktop-v3` 客户端本地入口，转到 [../apps/desktop-v3/README.md](../apps/desktop-v3/README.md)
