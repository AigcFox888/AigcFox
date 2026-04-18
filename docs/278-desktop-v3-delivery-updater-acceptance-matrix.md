# AigcFox desktop-v3 Delivery / Updater 验收矩阵

| 维度 | 标准 | 说明 | 证据 |
| --- | --- | --- | --- |
| 远端真值来源 | latest summary 真值成立 | 远端 proof 的稳定真值来自 latest summary，而不是口头记录 | summary / closeout |
| 远端字段 | `remoteTrackingRef` / `remoteTrackingHeadSha` / `latestSuccessfulHeadSha` / `latestSuccessfulRunId` | latest summary 必须包含 remote-tracking ref、当前 ref head 与远端成功 head / run id | latest summary |
| 分支基线 | `origin/<branch>` | 统一读取 `origin/<branch>` 的 remote-tracking ref | remote-tracking ref |
| 本地宿主边界 | `Windows + WSL2` / `WSL` 单执行面成立 | delivery/updater 文档验证默认固定在 `WSL` 单执行面；本地只做 proof 验证，不回切 `PowerShell` 复跑同一条链路 | runbook / baseline |
| 发布平台边界 | `Windows + macOS` 是当前唯一正式发布目标 | 终端用户构件只允许由 GitHub Actions 产出 `windows-latest + macos-latest`；`ubuntu-24.04` 只保留 CI 验证宿主，脚本 `qa:desktop-v3-linux-package` 已明确排除在当前 acceptance scope 外 | workflow / baseline |
| 更新源边界 | GitHub 不是中国用户正式更新源 | 正式更新走七牛或自有 HTTPS | 文档 |
| 技术边界 | `Tauri 2 updater plugin` | 渠道固定为 `dev / staging / stable` | 文档 |
| 文档 gate | `pnpm test:desktop-v3-delivery-updater-docs` / `pnpm qa:desktop-v3-delivery-updater-docs` | `README.md`、`apps/desktop-v3/README.md`、`docs/281`、`docs/README.md`、`248`、`267/269/274/275/276/277/278/279/280` 与 `AGENTS.md` 需要真实验证 | 脚本 |
| 远端 workflow proof | `desktop-v3-ci` / `desktop-v3-package` / `desktop-v3-delivery-updater-docs` | latest summary 的 `checks[]` 必须同时覆盖三条 active workflow，并且最新成功 run 必须命中当前 `origin/<branch>` head | summary / workflow |
| Workflow 边界 | `.github/workflows/desktop-v3-delivery-updater-docs.yml` | 当前 delivery/updater 文档链只依赖专用 workflow 与 [docs/280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md) | workflow / closeout |
| Closeout 解释边界 | `docs/280` 只记录基线 closeout 入口与读取口径 | `docs/280` 不替代当前 head 的远端 proof 结果；当前分支是否通过仍要重新执行脚本并回读 latest summary | summary / closeout |

补充口径：

- 当前 acceptance 只验证文档、workflow 与 proof 读取口径，不在本地 `WSL` 链做 Linux 终端用户安装包收口。
- 脚本 `qa:desktop-v3-linux-package` 已退出当前 acceptance scope；如需恢复平台范围，必须先改 active docs 与 workflow 真相链。
