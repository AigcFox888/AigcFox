# AigcFox 研发流程基线

## 文档定位

本文档冻结当前 `desktop-v3` 骨架阶段的研发流程。

## 分支策略

- `main`
- `dev`
- `feature/*`

命名规范：

```text
feature/<area>-<topic>
```

示例：

- `feature/desktop-v3-layout-shell`
- `feature/desktop-v3-updater-docs`
- `feature/docs-desktop-v3-cleanup`

合并流程：

```text
feature/* -> dev -> main
```

规则：

- 不直接把 `feature/*` 合并到 `main`
- 合并前必须通过对应验证
- 如果当前 `feature/*` 的 diff 已经明显混入无关路径或旧方案残留，不继续在原 PR 上缝补，必须从 `dev` 重建 clean branch
- 旧 PR 必须明确标记为 superseded 并关闭

## Git Commit 格式

当前统一采用 `Conventional Commits`：

```text
<type>(<scope>): <summary>
```

示例：

- `refactor(desktop-v3): split runtime diagnostics shell`
- `docs(delivery): rewrite updater governance baseline`
- `test(desktop-v3): tighten readiness doc coverage`

## 新功能开发完整流程

1. 先阅读 `AGENTS.md`、`docs/README.md`、`docs/248-autonomous-execution-baseline.md` 和本任务文档链。
2. 明确当前任务是否仍在 active `desktop-v3` 范围内。
3. 做最小设计：模块、边界、数据流、验证计划。
4. 从 `dev` 切出 `feature/*` 分支。
5. 先更新文档，再改核心代码；或文档与代码同步更新。
6. 运行真实验证。
7. 按 self-check 清单逐项检查。
8. 按规范 commit。
9. 推送到 GitHub 后，等待对应 GitHub Actions 通过。

## GitHub / Actions 基线

当前 active GitHub 流程拆成三条：

```text
desktop-v3:
本地 Windows + PowerShell 开发与真实宿主验证
-> push 到 GitHub
-> desktop-v3-ci 复跑 desktop-v3 Wave 1 fast tests + readiness
-> verification artifacts

desktop-v3 package:
push 到 GitHub
-> desktop-v3-package 做三端出包
-> 产物转存到七牛或自有 HTTPS

desktop-v3 delivery/updater docs:
push 到 GitHub
-> desktop-v3-delivery-updater-docs 复跑文档链 gate
-> docs artifacts
```

规则：

- GitHub 不作为中国用户的生产更新源
- Actions artifacts 只作为内部交付中间产物
- 只要本轮改动涉及 `.github/workflows/*`，本地必须先执行一次 `pnpm qa:github-actions-lint`
- 只要本轮改动涉及 active docs、README 或 `.github/workflows/*` 中出现的 `pnpm` 命令面，必须同时执行 `pnpm qa:governance-command-docs`

## SQLite 迁移流程（desktop-v3）

本地迁移主目录固定放在：

```text
apps/desktop-v3/src-tauri/src/runtime/localdb/
```

完整步骤：

1. 在 local runtime 中追加新的 `rusqlite_migration` 条目。
2. 禁止修改历史迁移条目，只允许追加。
3. 同步更新 [local-schema.md](./local-schema.md)。
4. 运行 Rust 测试或实际启动验证迁移升级路径。
5. 确认敏感数据未落入 SQLite。

## 依赖变更流程

新增任何依赖前必须完成：

1. 先看当前技术基线是否已经锁定该领域技术。
2. 说明为什么现有依赖不够用。
3. 说明新增依赖解决什么问题、影响哪些层。
4. 说明维护成本与替代方案。
5. 获得确认后再改依赖清单与锁文件。
6. 同步更新技术基线或 ADR。
7. 跑真实验证。

## 提交前 self-check

1. 是否仍在当前 active 文档边界内。
2. 是否没有顺手把未来业务带进当前 skeleton。
3. 是否保持了正确分层。
4. 是否没有把本地高权限逻辑写回前端壳层。
5. 是否迁移、契约、实现和文档同步。
6. 是否没有引入未批准依赖。
7. 是否做了真实验证。
8. 是否把未验证项明确写出来。
9. 是否使用了清晰的 commit 信息。
10. 如果原 PR 已污染，是否已经改用 clean branch / clean PR。
