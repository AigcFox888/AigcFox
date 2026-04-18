# AigcFox desktop-v3 Clean PR Closeout

## 结论

当前 `desktop-v3 Wave 1 Skeleton` 的 clean PR 收口记录固定保留如下关键信息：

- clean branch：`feature/docs-wsl-default-host`
- base branch：`dev`
- clean PR：`#1`
- promotion PR：`#2`
- promotion target branch：`main`
- workflow on `dev`：`desktop-v3-ci`
- workflow on `dev`：`desktop-v3-package`
- workflow on `main`：`desktop-v3-ci`
- workflow on `main`：`desktop-v3-package`
- verified package hardening：`WiX Toolset 3.14.1` preinstall on Windows package job

## 目的

本文档用于记录当出现 PR 污染时，如何从 `dev` 重新建立 clean branch，并把 `AGENTS.md`、[docs/README.md](./README.md) 与 [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md) 的治理要求落实到两阶段实际 PR 收口：先把 clean branch 收口到 `dev`，再把已验证的 `dev` 提升到默认分支 `main`。

## 收口顺序

1. 发现 PR 污染后，从 `dev` 重建 clean branch。
2. clean branch 向 `dev` 发起 clean PR，并拿到 `desktop-v3-ci` 与 `desktop-v3-package` 的真实通过证明。
3. clean PR 合并后，从 `dev` 向默认分支 `main` 发起 promotion PR。
4. promotion PR 合并到 `main` 后，要求 `desktop-v3-ci` 与 `desktop-v3-package` 在 `main` head 再次真实通过，才算默认发布线收口。

## 关键信号

- 发现 PR 污染
- 从 `dev` 重建 clean branch
- 旧 PR 标记 superseded 并关闭
- clean PR head 已拿到 `desktop-v3-ci` 与 `desktop-v3-package` 的真实通过证明
- promotion PR 已把已验证的 `dev` 提升到默认分支 `main`
- `main` head 已再次拿到 `desktop-v3-ci` 与 `desktop-v3-package` 的真实通过证明
