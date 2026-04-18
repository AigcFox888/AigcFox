# AigcFox desktop-v3 Clean PR Closeout

## 结论

当前 `desktop-v3 Wave 1 Skeleton` 的 clean PR 收口记录固定保留如下关键信息：

- clean branch：`feature/docs-wsl-default-host`
- base branch：`dev`
- PR：`#1`
- workflow：`desktop-v3-ci`
- workflow：`desktop-v3-package`
- verified package hardening：`WiX Toolset 3.14.1` preinstall on Windows package job

## 目的

本文档用于记录当出现 PR 污染时，如何从 `dev` 重新建立 clean branch，并把 `AGENTS.md`、[docs/README.md](./README.md) 与 [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md) 的治理要求落实到实际 PR 收口。

## 关键信号

- 发现 PR 污染
- 从 `dev` 重建 clean branch
- 旧 PR 标记 superseded 并关闭
- 当前 PR head 已拿到 `desktop-v3-ci` 与 `desktop-v3-package` 的真实通过证明
