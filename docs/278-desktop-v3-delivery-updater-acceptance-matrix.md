# AigcFox desktop-v3 Delivery / Updater 验收矩阵

| 维度 | 标准 | 说明 | 证据 |
| --- | --- | --- | --- |
| 远端真值来源 | latest summary 真值成立 | 远端 proof 的稳定真值来自 latest summary，而不是口头记录 | summary / closeout |
| 远端字段 | `latestSuccessfulHeadSha` / `latestSuccessfulRunId` | latest summary 必须包含远端成功 head 与 run id | latest summary |
| 分支基线 | `origin/<branch>` | 统一读取 `origin/<branch>` 的 remote-tracking ref | remote-tracking ref |
| 更新源边界 | GitHub 不是中国用户正式更新源 | 正式更新走七牛或自有 HTTPS | 文档 |
| 技术边界 | `Tauri 2 updater plugin` | 渠道固定为 `dev / staging / stable` | 文档 |
| 文档 gate | `pnpm test:desktop-v3-delivery-updater-docs` / `pnpm qa:desktop-v3-delivery-updater-docs` | `docs/281`、`docs/README.md`、`248`、`267/269/274/275/276/277/278/279/280` 与 `AGENTS.md` 需要真实验证 | 脚本 |
| Workflow 边界 | `.github/workflows/desktop-v3-delivery-updater-docs.yml` | 当前 delivery/updater 文档链只依赖专用 workflow 与 [docs/280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md) | workflow / closeout |

补充口径：

- 远端真值来源
- latest summary 真值成立
- `latestSuccessfulHeadSha`
- `latestSuccessfulRunId`
- `origin/<branch>`
- remote-tracking ref
- summary / closeout
