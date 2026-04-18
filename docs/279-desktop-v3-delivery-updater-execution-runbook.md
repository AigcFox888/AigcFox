# AigcFox desktop-v3 Delivery / Updater Runbook

## 阅读顺序

- `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
- `docs/README.md`
- `docs/248-autonomous-execution-baseline.md`
- `AGENTS.md`
- `docs/267-desktop-v3-github-actions-baseline.md`
- `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `docs/274-desktop-v3-delivery-updater-proposal.md`
- `docs/275-desktop-v3-delivery-updater-technical-baseline.md`
- `docs/276-desktop-v3-delivery-updater-detailed-design.md`
- `docs/277-desktop-v3-delivery-updater-execution-baseline.md`
- `docs/278-desktop-v3-delivery-updater-acceptance-matrix.md`
- `docs/280-desktop-v3-delivery-updater-closeout.md`

## 当前执行前提

默认在 `WSL` 执行面运行；不要在 `PowerShell` 与 `WSL` 上并行混跑同一条 delivery/updater 文档验证链。

- 正式发布链只保留 `Windows + macOS`；`ubuntu-24.04` 只保留 CI 验证宿主。
- 本地 `WSL` 链只做文档 / QA / proof 验证，不承担 Linux 终端用户安装包收口。
- 脚本 `qa:desktop-v3-linux-package` 已退出当前 runbook scope。

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
- `output/verification/latest/governance-command-docs-summary.json`

## 远端 proof 判定规则

- latest summary 为准
- `origin/<branch>`
- `remoteTrackingRef`
- `remoteTrackingHeadSha`
- `latestSuccessfulHeadSha`
- `latestSuccessfulRunId`
- latest run 必须成功覆盖当前 `origin/<branch>` remote-tracking ref
- `brokenLinks=[]`
- `forbiddenTerms=[]`
- `checks[].id = desktop-v3-delivery-updater-docs-remote-proof / desktop-v3-ci-remote-proof / desktop-v3-package-remote-proof`
- `.github/workflows/desktop-v3-ci.yml`
- `.github/workflows/desktop-v3-package.yml`
- `.github/workflows/desktop-v3-delivery-updater-docs.yml`
- `274 -> 280`
- fast-test entrypoint wiring

## Closeout 读取规则

- `docs/280-desktop-v3-delivery-updater-closeout.md` 只记录该基线 closeout 时冻结下来的入口与读取口径。
- 当前 head 是否仍完成远端 proof，不以 closeout 文案硬编码为准，必须重新执行脚本并读取 latest summary。
