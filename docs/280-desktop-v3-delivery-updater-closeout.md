# AigcFox desktop-v3 Delivery / Updater Baseline Closeout

## 结论

`desktop-v3 Delivery / Updater Baseline` 已完成当前文档线的本地与远端 proof 收口。

## 固定入口

- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`
- `output/verification/latest/desktop-v3-delivery-updater-docs-summary.json`
- `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`
- `.github/workflows/desktop-v3-delivery-updater-docs.yml`

## 固定说明

- `274 -> 280`
- clean branch：`feature/desktop-v3-github-actions-baseline`
- latest remote head、run id 与 GitHub Actions URL 不在本文档内硬编码
- `origin/<branch>`
- 优先重新执行远端 proof 脚本并读取 latest summary
- `latestSuccessfulHeadSha`
- `latestSuccessfulRunIds`
