# AigcFox desktop-v3 GitHub Actions 基线

## 当前 workflow

- `desktop-v3-ci.yml`
- `desktop-v3-package.yml`

## Clean PR 规则

- 出现 PR 污染时，必须从 `dev` 重建 clean branch
- 旧 PR 必须明确标记为 superseded 并关闭
- clean branch 在 `dev` 拿到 `desktop-v3-ci` 与 `desktop-v3-package` 的真实通过后，必须再从 `dev` 向默认分支 `main` 发起 promotion PR
- promotion PR 合并到 `main` 后，`desktop-v3-ci` 与 `desktop-v3-package` 必须在 `main` head 再次真实通过，才算默认发布线收口

## desktop-v3-ci.yml

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- `AIGCFOX_DESKTOP_V3_WAVE1_PROFILE=ci`
- `runs-on: ubuntu-24.04`
- `pnpm install --frozen-lockfile`
- `pnpm exec playwright install --with-deps chromium`
- `pnpm test:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-wave1-readiness`
- 当前 `push / pull_request` 文档触发面固定覆盖：
  - `docs/README.md`
  - `docs/248-autonomous-execution-baseline.md`
  - `docs/257-desktop-v3-replatform-proposal.md`
  - `docs/258-desktop-v3-technical-baseline.md`
  - `docs/259-desktop-v3-detailed-design.md`
  - `docs/269-desktop-v3-tauri-2-governance-baseline.md`
  - `docs/260-desktop-v3-wave1-execution-baseline.md`
  - `docs/263-desktop-v3-wave1-acceptance-matrix.md`
  - `docs/264-desktop-v3-wave1-execution-runbook.md`
  - `docs/267-desktop-v3-github-actions-baseline.md`
  - `docs/268-desktop-v3-clean-pr-closeout.md`
  - `docs/ui-client/system.md`
  - `docs/ui-client/layout.md`
  - `docs/ui-client/components.md`
  - `docs/ui-client/interaction.md`
  - `docs/ui-client/charts.md`
  - `apps/desktop-v3/README.md`

当前文档与测试口径固定覆盖：

- README docs
- active-doc explicit coverage
- app shell governance
- page governance
- host governance
- support governance
- feature boundary governance
- runtime boundary governance
- fast-test entrypoint wiring

当前 `pnpm qa:desktop-v3-app-shell-governance` 也属于 CI 固定覆盖面；`src/app` 的 renderer app shell、provider、router、bootstrap，以及 `route-registry.ts` 内收拢的路径真相、handle、导航 href 绑定与初始路由集合一旦漂移，就必须在进入 GitHub Actions 前先失败。
当前 `pnpm qa:desktop-v3-page-governance` 也属于 CI 固定覆盖面；`src/pages` 的 renderer page composition、shared state components、sidebar nav item 与 shell hooks 一旦漂移，或者 dashboard quick link / keyboard shortcut 导航脱离 `route-registry.ts` 绑定，就必须在进入 GitHub Actions 前先失败。
当前 `pnpm qa:desktop-v3-host-governance` 也属于 CI 固定覆盖面；宿主 env / log surface 一旦漂移，或者 renderer `route-registry.ts` 与 Rust `window/initial_route.rs` 的允许初始路由集合不再一致，就必须在进入 GitHub Actions 前先失败。
当前 `pnpm qa:desktop-v3-support-governance` 也属于 CI 固定覆盖面；`src/lib/errors`、`src/lib/query`、`notify.ts`、`typography.ts`、`utils.ts` 的 renderer shared support 一旦漂移，就必须在进入 GitHub Actions 前先失败。

## desktop-v3-package.yml

- `feature/**`
- `workflow_dispatch`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- 当前 `push` 触发面固定覆盖：
  - `docs/258-desktop-v3-technical-baseline.md`
  - `docs/267-desktop-v3-github-actions-baseline.md`
  - `docs/269-desktop-v3-tauri-2-governance-baseline.md`
- `desktop-v3-ci.yml` 固定在 `ubuntu-24.04` 做治理、测试与 smoke proof
- `desktop-v3-package.yml` 只产出 `Windows + macOS` 首次安装 bundle
- `desktop-v3-package.yml` 的 Windows job 固定先通过 Chocolatey 预装并导出 `WiX Toolset 3.14.1`，并对安装步骤做重试；同时把 Windows bundle 目标固定收敛到 `msi`，不要再把 MSI 打包成功与否绑定到 `tauri build` 内部对 `wix314-binaries.zip` 或 NSIS 压缩包的单次在线下载
- `desktop-v3-package.yml` 只负责为维护者产出可下载 artifact；artifact 内只保留首次安装包与对应校验清单，不再把整份 bundle 目录原样兜底上传
- `desktop-v3-package.yml` 固定生成 `release-manifest.json` 与 `SHA256SUMS.txt`，作为 `Windows + macOS` 首次安装 bundle 的文件清单与 SHA256 真相
- `desktop-v3-package.yml` 只负责为维护者产出可下载 artifact；维护者必须从 GitHub Actions 下载 `Windows + macOS` 首次安装 bundle，并按 `release-manifest.json` 与 `SHA256SUMS.txt` 核对后，再上传到七牛对象存储（Kodo）或自有 HTTPS 下载源后分发给中国区用户
- 已安装用户后续版本不走 GitHub 重新下载安装包；后续在线更新固定走七牛对象存储（Kodo）或自有 HTTPS 下载源，并采用“当前会话不打断、下一次启动命中强更才执行”的策略
- 不直接把 GitHub Actions artifact URL 或 GitHub Releases URL 发给终端用户
- `qa:desktop-v3-linux-package` 已退出当前 CI / QA 主链；不要把 Linux bundle matrix、artifact 上传或本地 Linux 包收口重新塞回 active scope
- 不自动发布到 GitHub Releases
- 不自动作为客户端更新源

## 本地配套校验

- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`
- 两条命令都必须在推送前通过，保证 workflow 语法、路径面和命令文档真相层没有漂移
