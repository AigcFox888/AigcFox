# AigcFox desktop-v3 Delivery / Updater 执行基线

## 当前目标

- 冻结 `desktop-v3` 的交付 / updater 文档边界
- 固定 GitHub workflow proof 的判定方式
- 固定七牛或自有 HTTPS 更新源边界
- 固定 GitHub workflow proof 的真值读取方式

## 当前执行入口

- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`
- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`

## 远端 proof 真值

- 当前远端 proof 判定以 latest summary 为准
- 读取 `origin/<branch>` 的 remote-tracking ref
- latest summary 必须记录 `remote-tracking ref`
- latest summary 必须记录 `latestSuccessfulHeadSha`
- latest summary 必须记录 `latestSuccessfulRunId`
- GitHub workflow proof 以 latest summary 回读结果为最终结论

## 当前不做

- updater 代码实现
- 业务 API 扩展
- 自动发布到 GitHub Releases
- 把 GitHub 当成中国用户正式更新源

## 关联收口

- [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)
