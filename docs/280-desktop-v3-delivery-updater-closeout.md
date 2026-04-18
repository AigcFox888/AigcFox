# AigcFox desktop-v3 Delivery / Updater Baseline Closeout

## 结论

`desktop-v3 Delivery / Updater Baseline` 已完成当前文档线的本地与远端 proof 收口。
本文档记录的是该基线 closeout 时冻结下来的入口与读取口径；当前 head 的远端 proof 结论不在本文内硬编码，必须重新执行脚本并读取 latest summary。

## 固定入口

- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`
- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`
- `output/verification/latest/desktop-v3-delivery-updater-docs-summary.json`
- `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`
- `output/verification/latest/governance-command-docs-summary.json`
- `.github/workflows/desktop-v3-ci.yml`
- `.github/workflows/desktop-v3-package.yml`
- `.github/workflows/desktop-v3-delivery-updater-docs.yml`

## 固定说明

- `274 -> 280`
- clean branch：`feature/desktop-v3-github-actions-baseline`
- latest remote head、run id 与 GitHub Actions URL 不在本文档内硬编码
- `origin/<branch>`
- 优先重新执行远端 proof 脚本并读取 latest summary
- `remoteTrackingRef`
- `remoteTrackingHeadSha`
- `latestSuccessfulHeadSha`
- `latestSuccessfulRunId`
- `checks[].id = desktop-v3-delivery-updater-docs-remote-proof / desktop-v3-ci-remote-proof / desktop-v3-package-remote-proof`

## 当前发布 / 宿主边界

- 正式发布链只保留 `Windows + macOS`；Linux 终端用户安装包不再属于当前 active scope。
- `ubuntu-24.04` 只保留 CI 验证宿主；本地默认执行面固定为 `WSL`，只做 proof 验证。
- 脚本 `qa:desktop-v3-linux-package` 已明确排除，不作为当前 closeout、runbook 或 acceptance 的一部分。
