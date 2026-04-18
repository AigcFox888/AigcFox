# AigcFox Agent Protocol

## 当前状态

- 当前项目只以保留中的 `desktop-v3 Wave 1 Skeleton` 文档链作为执行依据。
- 当前仓库只保留 `desktop-v3` 客户端主线，代码目录是 `apps/desktop-v3/`。
- 当前 `desktop-v3 Wave 1 Skeleton` 已完成并冻结；后续只允许做骨架治理、文档维护与 proof 回归。
- 当前默认宿主固定为 `Windows + WSL2`，仓库路径按 `D:\xiangmu\AigcFox` 与 `/mnt/d/xiangmu/aigcfox` 记录。
- 如果当前机器采用 `Windows + WSL2` 混合宿主，单轮开发与验证默认固定在 `WSL` 执行面；不要在同一仓库、同一依赖目录、同一 dev server / watcher / build / test 链路上同时混跑 `PowerShell` 与 `WSL`。
- 当前只开发骨架，不开发历史业务，不开发新功能实现，也不把任何历史方案融入 `desktop-v3`。
- 仓库内 `docs/` 只保留 `desktop-v3` 骨架文档、UI 规范与直接相关的工程治理文档。

## 开发前必读顺序

1. `docs/README.md`
2. `docs/248-autonomous-execution-baseline.md`
3. 如果任务属于 `desktop-v3` 骨架，再读：
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
4. `apps/desktop-v3/README.md`

## 执行规则

- 每次开始新任务或从中断恢复任务前，默认先重读 `docs/248-autonomous-execution-baseline.md`，再进入当前任务所需的 source-of-truth 文档。
- 默认采用多线程 / 多任务推进；只要任务边界、写入范围和验证链路彼此独立，就优先并行拆分，不要无意义地长期串行。
- 默认自动连续推进当前任务；只要仍在当前 source-of-truth 边界内，且没有出现必须由用户拍板的范围变化、阶段切换、高风险不可逆操作、关键外部输入缺失或多方案后果明显不同的分叉，就不要停下来等待用户再次发送“继续”或“下一步”。
- 如果当前开发机实际运行在 `Windows + WSL2` 混合环境，开始本轮任务前必须先固定当前唯一执行面，并在整个任务内保持一致；默认执行面是 `WSL`，除非本轮任务明确要求只在 Windows 宿主完成单次桥接操作；禁止一边在 `PowerShell` 跑依赖、watcher、构建或测试，另一边又在 `WSL` 跑同一套链路。
- 当前 active scope 只包括 `apps/desktop-v3`、`docs`、`scripts`、`.github/workflows`。
- `desktop-v3` 骨架当前允许做的范围只包括：
  - Tauri 窗口壳层、路由壳层、布局壳层
  - `React -> Tauri commands -> Rust -> Go API` 的命令边界
  - 本地 runtime 适配器骨架、诊断骨架、状态存储骨架
  - 设计系统、响应式布局和基础 UI 壳层
  - `Tauri 2` capability / permission / config / updater 的治理基线
- 当前明确不做：
  - 历史文档中的任何业务方案
  - 会员、套餐、积分、支付、订单中心
  - 登录注册
  - 爬虫业务实现、AI 业务实现、自动化业务实现
  - 任何历史方案的文档续写或实现续写
  - 任何未进入当前骨架文档链的新功能实现
- 涉及范围、架构、安全、IPC、本地敏感存储、自动更新、浏览器运行时的变更，必须先更新当前主线文档或与代码同时更新。
- 开发实现默认优先选择结构化重写，不鼓励在核心页面、核心流程、核心配置和核心文档上长期叠加碎片补丁。
- 核心模块默认禁止补丁式堆叠修补；若问题已反复出现、边界已漂移或补丁开始互相耦合，宁愿直接重写相关模块，也不要继续在原结构上缝补。
- 必须做真实验证。不要把宿主 shell 输出当最终真相；优先做真实开发环境、真实命令、真实构建、真实测试验证。
- 文档清理必须保证入口可发现、链接可追踪、引用可验证；删除旧文档后不能留下断链。

## 当前默认技术边界

- Desktop：`Tauri 2`、`React + TypeScript`、`Rust local runtime`、`shadcn/ui`
- Local DB：`rusqlite (bundled)` + `rusqlite_migration`
- 通信主链：`React -> Tauri commands -> Rust thin proxy -> Go API`
- 发布链：`GitHub Actions 出包 -> Windows + macOS bundle`

## 当前默认边界

- 当前默认目标主线是 `Tauri 2 Desktop UI + Rust Local Runtime + Remote Go API Boundary`。
- 历史桌面方案、历史云端实现、历史业务路线都不再作为默认新开发主线，也不再作为新文档的约束来源。
- 任何新能力如果还没有升级为当前骨架文档的一部分，就不要擅自进入代码实现。

## 交付标准

- 当前不再要求固定的任务回报模板。
- 但仍然禁止把未验证内容写成已验证结论。
- 若存在关键未验证项、真实阻断或高风险残留，必须明确写出。
