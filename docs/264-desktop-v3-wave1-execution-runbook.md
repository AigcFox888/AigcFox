# AigcFox desktop-v3 Wave 1 Skeleton 执行 Runbook

## 当前 source-of-truth 文档清单

- `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
- `docs/README.md`
- `docs/248-autonomous-execution-baseline.md`
- `docs/257-desktop-v3-replatform-proposal.md`
- `docs/258-desktop-v3-technical-baseline.md`
- `docs/259-desktop-v3-detailed-design.md`
- `docs/260-desktop-v3-wave1-execution-baseline.md`
- `docs/263-desktop-v3-wave1-acceptance-matrix.md`
- `docs/264-desktop-v3-wave1-execution-runbook.md`
- `docs/267-desktop-v3-github-actions-baseline.md`
- `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `apps/desktop-v3/README.md`

## 文档 gate

`desktop-v3-document-check` 固定执行：

- `git diff --check`
- 未跟踪文档的等价格式检查
- Markdown 链接检查
- 旧术语残留扫描

## 快速验证

默认在 `WSL` 执行面运行；不要把同一条验证链切回 `PowerShell`。

```bash
pnpm test:desktop-v3-wave1-readiness
```

该入口当前固定覆盖：

- README docs
- active-doc explicit coverage
- acceptance docs
- runbook docs
- GitHub baseline docs
- capability governance
- Rust command governance
- LocalDatabase governance
- platform-config governance
- updater governance
- runtime boundary governance
- fast-test entrypoint wiring
- smoke contract

## 完整验证

默认在 `WSL` 执行面运行；不要在 `PowerShell` 与 `WSL` 上并行混跑同一条链路。

```bash
pnpm qa:desktop-v3-wave1-readiness
```

固定步骤：

1. `desktop-v3-document-check`
2. `pnpm qa:desktop-v3-runtime-boundary`
3. `pnpm qa:desktop-v3-localdb-governance`
4. `pnpm qa:desktop-v3-command-governance`
5. `pnpm qa:desktop-v3-capability-governance`
6. `pnpm qa:desktop-v3-platform-config-governance`
7. `pnpm qa:desktop-v3-updater-governance`
8. `pnpm --filter @aigcfox/desktop-v3 lint`
9. `pnpm --filter @aigcfox/desktop-v3 typecheck`
10. `pnpm --filter @aigcfox/desktop-v3 test`
11. `cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml`
12. `pnpm --filter @aigcfox/desktop-v3 build`
13. `pnpm qa:desktop-v3-responsive-smoke`
14. `pnpm qa:desktop-v3-tauri-dev-smoke`
15. `pnpm qa:desktop-v3-linux-package`
16. `pnpm qa:desktop-v3-packaged-app-smoke`

## 输出

- `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-wave1-readiness-summary.json`

## 说明

- 当前 renderer / invoke 证明以 `packaged app smoke` 为主证据
- 当前 capability / permission / IPC 对齐回归由 `pnpm qa:desktop-v3-capability-governance` 先行拦截
- 当前 Rust command 边界回归由 `pnpm qa:desktop-v3-command-governance` 先行拦截
- 当前 LocalDatabase 回归由 `pnpm qa:desktop-v3-localdb-governance` 先行拦截；它会同时冻结 `runtime/localdb/mod.rs + migrations.rs` 文件集、`rusqlite` 触点和 `LocalDatabase` 仅由 `runtime/mod.rs` 在模块外持有的边界
- 当前 shared `tauri.conf.json` 回归由 `pnpm qa:desktop-v3-platform-config-governance` 先行拦截；它会同时冻结当前唯一配置文件集和共享字段面，防止把平台打包细节或 updater 配置继续堆回 `tauri.conf.json`
- 当前 updater 未实现边界由 `pnpm qa:desktop-v3-updater-governance` 先行拦截；它会同时冻结 `Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source，防止把 updater plugin、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源提前补丁式塞进当前骨架
- 当前 renderer runtime 边界回归由 `pnpm qa:desktop-v3-runtime-boundary` 先行拦截
- 当前 README docs、fast-test entrypoint wiring 与 active-doc explicit coverage 都必须保持通过
