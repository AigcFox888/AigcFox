# Autonomous Execution Baseline

## 文档定位

本文档是当前仓库的执行纪律叠加层。

它不定义业务范围，只定义做事方式，用来保证每次恢复任务时都按同一套规则执行：

- 如果是重装或跨环境恢复，先读快速恢复主入口
- 先读当前入口文档
- 先做设计，再进入重写或实现
- 核心模块优先结构化重写，不做补丁堆叠
- 必须做真实验证，不口头算完成

## 当前适用范围

本基线当前只服务于两条 active 执行线：

- `desktop-v3 Wave 1 Skeleton`
- `desktop-v3 Delivery / Updater Baseline`

任何不在当前文档链内的业务域、未来波次或历史方案，都不因为“顺手”而自动进入实现。

## 优先级

优先级固定如下：

1. `AGENTS.md`
2. `docs/README.md`
3. 当前任务所属的 active source-of-truth 文档
4. 本文档

## 每次开始前必做

每次开始新任务或从中断恢复时，必须先完成：

1. 如果属于系统重装、跨环境恢复或长时间中断恢复，先重读 `docs/281-desktop-v3-post-reinstall-recovery-entry.md`
2. 重读 `docs/README.md`
3. 重读 `docs/248-autonomous-execution-baseline.md`
4. 重读当前任务所属的 source-of-truth 文档链
5. 明确本轮范围、写入边界和验证计划
6. 如果当前机器是 `Windows + WSL2` 混合宿主，先固定本轮唯一执行面；不要在同一仓库、同一依赖目录、同一 dev server / watcher / build / test 链路上同时混跑 `PowerShell` 与 `WSL`

## 当前边界映射

当前默认边界如下：

- `desktop-v3`：
  - `React shell`
  - `Tauri commands / events`
  - `Rust local runtime`
  - `SQLite / secure store`
  - `Remote Go API boundary`
- 文档链：
  - `README`
  - `proposal`
  - `technical baseline`
  - `detailed design`
  - `execution baseline`
  - `acceptance / runbook / closeout`

## 设计优先规则

进入核心文档或核心代码前，必须先完成一个最小设计稿，至少说清：

- 本轮改什么
- 不改什么
- 影响哪些模块
- 数据流或控制流怎么走
- 用什么命令验证

## 结构化重写规则

当前仓库默认优先结构化重写，不鼓励在核心模块上连续堆补丁。

出现以下任一情况，应停止缝补并切换为重写：

- 同一模块连续两轮以上增量修补
- 新需求继续往同一核心文件堆逻辑
- 边界开始变糊
- 条件分支不断增长
- 同类逻辑开始复制
- 验证失败后还在重复补丁式试错

## 文件拆分规则

任何核心能力都不应继续塞进单个超大文件。

如果当前改动会导致一个文件同时承担多种职责，必须先拆分，再继续实现。拆分方向优先按职责切开：

- 入口与业务
- 读路径与写路径
- 编排与校验
- 存储访问与领域逻辑
- UI 壳层与能力适配层

## 并行执行规则

默认采用多线程 / 多任务推进，但并行必须受控。

只有同时满足以下条件，才允许并行：

- 写入范围互不冲突
- 责任边界清楚
- 各自都能真实验证
- 汇总后仍能追踪来源

补充宿主规则：

- `Windows + WSL2` 混合宿主不等于允许双宿主混跑同一条开发链
- 单轮任务只能选一个主执行面；如果已在 `WSL` 运行依赖、watcher、构建或测试，就不要再在 `PowerShell` 上重复启动同一套链路，反之亦然
- 只有桥接型只读探测或明确必须经过 Windows 宿主的单次操作，才允许临时跨到另一侧执行

## 真实验证规则

禁止伪验证。

当前默认验证口径：

- 文档任务：
  - Markdown 链接完整性检查
  - 旧术语残留扫描
  - `git diff --check` 或等价格式检查
- `desktop-v3`：
  - `pnpm test:desktop-v3-wave1-readiness`
  - `pnpm qa:desktop-v3-wave1-readiness`
  - `pnpm test:desktop-v3-delivery-updater-docs`
  - `pnpm qa:desktop-v3-delivery-updater-docs`
  - `pnpm qa:desktop-v3-delivery-updater-github-remote-proof`

## 范围约束规则

当前 active 文档链只允许继续 `desktop-v3` 骨架与交付治理工作。

因此默认不做：

- 业务域实现
- 商业化实现
- 后台运营功能实现
- 本地自动化业务实现
- 未进入 active 文档链的未来能力

## 完成判定

任务不能因为“文件改完了”就结束。

只有同时满足以下条件，才算完成：

- 已按当前 active 文档边界收口
- 已做真实验证
- 未验证项如果存在，不能伪装成已完成
