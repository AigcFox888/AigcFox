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

```bash
pnpm test:desktop-v3-wave1-readiness
```

该入口当前固定覆盖：

- README docs
- active-doc explicit coverage
- acceptance docs
- runbook docs
- GitHub baseline docs
- fast-test entrypoint wiring
- smoke contract

## 完整验证

```bash
pnpm qa:desktop-v3-wave1-readiness
```

固定步骤：

1. `desktop-v3-document-check`
2. `pnpm --filter @aigcfox/desktop-v3 lint`
3. `pnpm --filter @aigcfox/desktop-v3 typecheck`
4. `pnpm --filter @aigcfox/desktop-v3 test`
5. `cargo test --manifest-path apps/desktop-v3/src-tauri/Cargo.toml`
6. `pnpm --filter @aigcfox/desktop-v3 build`
7. `pnpm qa:desktop-v3-responsive-smoke`
8. `pnpm qa:desktop-v3-tauri-dev-smoke`
9. `pnpm qa:desktop-v3-linux-package`
10. `pnpm qa:desktop-v3-packaged-app-smoke`

## 输出

- `output/verification/desktop-v3-wave1-readiness-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-wave1-readiness-summary.json`

## 说明

- 当前 renderer / invoke 证明以 `packaged app smoke` 为主证据
- 当前 README docs、fast-test entrypoint wiring 与 active-doc explicit coverage 都必须保持通过
