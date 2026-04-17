# AigcFox desktop-v3 Delivery / Updater Runbook

## 阅读顺序

- `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
- `docs/248-autonomous-execution-baseline.md`
- `docs/267-desktop-v3-github-actions-baseline.md`
- `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `docs/274-desktop-v3-delivery-updater-proposal.md`
- `docs/275-desktop-v3-delivery-updater-technical-baseline.md`
- `docs/276-desktop-v3-delivery-updater-detailed-design.md`
- `docs/277-desktop-v3-delivery-updater-execution-baseline.md`
- `docs/278-desktop-v3-delivery-updater-acceptance-matrix.md`
- `docs/280-desktop-v3-delivery-updater-closeout.md`

## 命令

```bash
pnpm test:desktop-v3-delivery-updater-docs
pnpm qa:desktop-v3-delivery-updater-docs
pnpm qa:desktop-v3-delivery-updater-github-remote-proof
pnpm qa:github-actions-lint
pnpm qa:governance-command-docs
```

## 输出

- `output/verification/desktop-v3-delivery-updater-docs-<run-id>/summary.json`
- `output/verification/latest/desktop-v3-delivery-updater-docs-summary.json`
- `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`

## 远端 proof 规则

- latest summary 为准
- `origin/<branch>`
- `latestSuccessfulHeadSha`
- `latestSuccessfulRunId`
- `brokenLinks=[]`
- `forbiddenTerms=[]`
- `.github/workflows/desktop-v3-delivery-updater-docs.yml`
- `274 -> 280`
- fast-test entrypoint wiring
