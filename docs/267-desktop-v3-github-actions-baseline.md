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
- runtime boundary governance
- fast-test entrypoint wiring

## desktop-v3-package.yml

- `feature/**`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`
- 当前 `push` 触发面固定覆盖：
  - `docs/258-desktop-v3-technical-baseline.md`
  - `docs/267-desktop-v3-github-actions-baseline.md`
- 三端 bundle 由 GitHub Actions 产出
- 不自动发布到 GitHub Releases
- 不自动作为客户端更新源

## desktop-v3-delivery-updater-docs.yml

- 覆盖 `274 -> 280`
- `pnpm test:desktop-v3-delivery-updater-docs`
- `pnpm qa:desktop-v3-delivery-updater-docs`
- `pnpm qa:github-actions-lint`
- `pnpm qa:governance-command-docs`
- `output/verification/latest/desktop-v3-delivery-updater-github-remote-proof-summary.json`
- GitHub workflow proof 的真值来自名称、冻结路径、`active` 状态与目标分支成功 run
- 远端 proof 统一以 `origin/<branch>` 的 remote-tracking ref 和 latest summary 为准
- 当前 delivery/updater 文档链也必须覆盖 fast-test entrypoint wiring
