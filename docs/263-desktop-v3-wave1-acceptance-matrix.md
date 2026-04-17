# AigcFox desktop-v3 Wave 1 Skeleton 验收矩阵

| 维度 | 标准 | 说明 | 证据 |
| --- | --- | --- | --- |
| 目录边界 | `apps/desktop-v3/` 独立存在 | 当前仓库只保留 `desktop-v3` 客户端主线 | 文件树 |
| 文档 gate | `desktop-v3-document-check` 成立 | `docs/281`、`docs/README.md`、`248`、`257/258/259/260/263/264/267/269` 与 `apps/desktop-v3/README.md` 无断链、无旧链残留 | `pnpm qa:desktop-v3-wave1-readiness` |
| 聚合验收入口 | Wave 1 聚合验证入口成立 | 在当前固定的 `WSL` 单执行面宿主链上，`pnpm qa:desktop-v3-wave1-readiness` 作为聚合入口成立，并负责串行收口 `source-of-truth document gate / runtime boundary governance / LocalDatabase governance / lint / typecheck / test / cargo test / build / responsive smoke / tauri dev smoke / tauri build / packaged app smoke` 的摘要与归档路径；当前默认开发环境是 `Windows + WSL2`，禁止把同一条验证链再并行切回 `PowerShell` | `output/verification` summary |
| GitHub / Actions | GitHub 骨架复验成立 | `.github/workflows/desktop-v3-ci.yml` 与 `.github/workflows/desktop-v3-package.yml` 存在，并执行 `pnpm test:desktop-v3-wave1-readiness` 与 `pnpm qa:desktop-v3-wave1-readiness` | workflow 文件 |
| 交付边界 | 只上传 CI artifacts | GitHub Actions 只负责上传 CI artifacts，不自动发布到 GitHub Releases | baseline / workflow |
| 更新边界 | 不作为客户端更新源 | GitHub 产物不作为客户端更新源，正式更新只走七牛或自有 HTTPS | baseline / delivery docs |

补充要求：

- `pnpm test:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-wave1-readiness`
- `pnpm qa:desktop-v3-localdb-governance`
- `pnpm qa:desktop-v3-runtime-boundary`
- `pnpm qa:desktop-v3-responsive-smoke`
- `pnpm qa:desktop-v3-packaged-app-smoke`
- `.github/workflows/desktop-v3-ci.yml`
- `.github/workflows/desktop-v3-package.yml`
- 只上传 CI artifacts
- 不作为客户端更新源
