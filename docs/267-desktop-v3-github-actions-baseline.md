# AigcFox desktop-v3 GitHub Actions 基线

## 当前 workflow

- `desktop-v3-ci.yml`
- `desktop-v3-package.yml`
- `desktop-v3-delivery-updater-docs.yml`

## Clean PR 规则

- 出现 PR 污染时，必须从 `dev` 重建 clean branch
- 旧 PR 必须明确标记为 superseded 并关闭

## desktop-v3-ci.yml

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- `AIGCFOX_DESKTOP_V3_WAVE1_PROFILE=ci`
- `runs-on: ubuntu-24.04`
- `pnpm install --frozen-lockfile`
- `pnpm exec playwright install --with-deps chromium`
- `pnpm test:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-wave1-readiness`

当前文档与测试口径固定覆盖：

- README docs
- active-doc explicit coverage
- app shell governance
- page governance
- support governance
- feature boundary governance
- runtime boundary governance
- fast-test entrypoint wiring

当前 `pnpm qa:desktop-v3-app-shell-governance` 也属于 CI 固定覆盖面；`src/app` 的 renderer app shell、provider、router、bootstrap 与导航拓扑一旦漂移，就必须在进入 GitHub Actions 前先失败。
当前 `pnpm qa:desktop-v3-page-governance` 也属于 CI 固定覆盖面；`src/pages` 的 renderer page composition、shared state components、sidebar nav item 与 shell hooks 一旦漂移，就必须在进入 GitHub Actions 前先失败。
当前 `pnpm qa:desktop-v3-support-governance` 也属于 CI 固定覆盖面；`src/lib/errors`、`src/lib/query`、`notify.ts`、`typography.ts`、`utils.ts` 的 renderer shared support 一旦漂移，就必须在进入 GitHub Actions 前先失败。

## desktop-v3-package.yml

- `feature/**`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- 当前 `push` 触发面固定覆盖：
  - `docs/258-desktop-v3-technical-baseline.md`
  - `docs/267-desktop-v3-github-actions-baseline.md`
- `desktop-v3-ci.yml` 固定在 `ubuntu-24.04` 做治理、测试与 smoke proof
- `desktop-v3-package.yml` 只产出 `Windows + macOS` bundle
- `qa:desktop-v3-linux-package` 已退出当前 CI / QA 主链；不要把 Linux bundle matrix、artifact 上传或本地 Linux 包收口重新塞回 active scope
- 不自动发布到 GitHub Releases
- 不自动作为客户端更新源

## desktop-v3-delivery-updater-docs.yml

- 覆盖 `274 -> 280`
- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`
- `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`
- latest summary 至少必须记录 `remoteTrackingRef`、`remoteTrackingHeadSha`、`latestSuccessfulHeadSha` 与 `latestSuccessfulRunId`
- GitHub workflow proof 的真值来自名称、冻结路径、`active` 状态，以及 latest run 必须成功覆盖当前 `origin/<branch>` remote-tracking ref
- 远端 proof 统一以 `origin/<branch>` 的 remote-tracking ref 和 latest summary 为准
- 当前 delivery/updater 文档链也必须覆盖 fast-test entrypoint wiring
