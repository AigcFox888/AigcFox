# AigcFox desktop-v3 Delivery / Updater 执行基线

## 当前目标

- 冻结 `desktop-v3` 的交付 / updater 文档边界
- 固定 GitHub workflow proof 的判定方式
- 固定 `Windows + macOS` 为当前正式发布目标
- 固定七牛或自有 HTTPS 更新源边界
- 固定 GitHub workflow proof 的真值读取方式

## 当前执行入口

- 当前默认开发环境：`Windows + WSL2`
- 当前默认执行面：`WSL`
- 不要把同一条 delivery/updater 文档验证链再并行切回 `PowerShell`
- 本地 `WSL` 链只做文档 / QA / proof 验证，不承担 Linux 终端用户安装包收口
- 当前明确排除 `qa:desktop-v3-linux-package`

- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`
- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`

## 远端 proof 真值

- 当前远端 proof 判定以 latest summary 为准
- 读取 `origin/<branch>` 的 remote-tracking ref
- latest summary 必须记录 `remoteTrackingRef`
- latest summary 必须记录 `remoteTrackingHeadSha`
- latest summary 必须记录 `latestSuccessfulHeadSha`
- latest summary 必须记录 `latestSuccessfulRunId`
- latest run 必须成功覆盖当前 `origin/<branch>` remote-tracking ref，不能只回读更早的成功 run
- GitHub workflow proof 以 latest summary 回读结果为最终结论

## 当前不做

- updater 代码实现
- 业务 API 扩展
- 自动发布到 GitHub Releases
- 把 GitHub 当成中国用户正式更新源
- Linux 终端用户安装包收口

## 关联收口

- [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)
