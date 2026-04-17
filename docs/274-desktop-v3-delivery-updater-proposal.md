# AigcFox desktop-v3 交付与更新提案

## 文档定位

本文档用于把 `desktop-v3` 在 `Wave 1 Skeleton` 完成后的下一条主线固定为正式提案。

它只回答：

- 为什么下一步不是业务层，而是交付与更新基础设施
- 为什么必须先补完整文档链，再进入实现
- 这条主线当前负责什么
- 这条主线当前明确不负责什么

## 提案结论

`desktop-v3` 下一条执行线固定为：

```text
desktop-v3 Delivery / Updater Baseline
```

当前阶段是：

- 先冻结文档与治理边界
- 先冻结交付链、更新源、签名、渠道、强更规则
- 暂不进入业务层
- 暂不进入会员、登录注册、支付、积分、套餐、订单等业务实现

## 为什么下一步不能直接做业务层

### 1. 骨架已经完成，当前瓶颈不在页面数量

`Wave 1 Skeleton` 已经证明：

- `apps/desktop-v3/` 工作区成立
- `Tauri 2 + React + Rust` 主链成立
- 本地命令边界成立
- 本地与远端诊断链成立
- GitHub Actions 与三端出包基线成立

当前继续堆业务页，不会提升基础稳定性。

### 2. 中国用户交付链比业务页更早成为真实风险

当前用户已经明确：

- 用户主要在中国
- GitHub 不能作为正式更新源
- 更新必须走七牛对象存储或自有 HTTPS 服务器
- 打开客户端时允许执行强更新，但正在使用时不能被中途强退

这些都属于基础交付与更新架构，不属于业务层。

### 3. 如果不先冻结交付与更新边界，后续返工成本最高

交付链一旦晚定，会反复牵动：

- `Tauri 2 updater`
- 签名与密钥管理
- GitHub Actions secrets
- 发布源目录结构
- 版本渠道
- 回滚策略
- 启动期升级 UX

这些边界越晚定，返工成本越高。

## 当前主线要解决什么问题

这条提案线当前只负责解决以下问题：

1. `Windows + WSL2（默认固定 WSL 单执行面） -> GitHub -> GitHub Actions -> 三端包 -> 七牛 / 自有 HTTPS` 的正式交付链怎么定。
2. `desktop-v3` 后续自动更新必须依赖什么官方能力、什么签名与发布格式。
3. 面向中国用户的正式更新源、CDN 和 HTTPS 边界怎么定。
4. 强更新、可延期更新、会话内禁止强退这三类更新策略怎么定。
5. 渠道、版本提升、回滚和发布审计怎么定。

## 当前范围

当前提案线只允许讨论：

- GitHub Actions 出包与发布中转链
- Tauri updater 技术边界
- 签名、密钥、清单、渠道
- 七牛对象存储 / 自有 HTTPS 更新源
- 版本策略、强更策略、回滚策略
- 与 `desktop-v3` 现有窗口壳层对接的最小更新 UX 壳层

## 当前明确不做

当前提案线明确不做：

- 登录注册
- 会员中心
- 套餐、支付、积分、订单
- 全局业务 UI 改版
- 业务功能页面
- 云端业务 API 扩展
- 任何以“顺手”为名进入的商业化实现

## 当前与现有骨架的关系

这条主线不是推翻 `Wave 1 Skeleton`。

它建立在以下已完成事实之上：

- `desktop-v3 Wave 1 Skeleton` 已完成并冻结
- `desktop-v3` GitHub Actions 出包基线已成立
- `Tauri 2` capability / permission / updater 治理边界已建立初稿

因此当前正确顺序是：

1. 先把交付与更新设计讲清楚
2. 再决定哪些代码需要进入 `apps/desktop-v3`
3. 最后才进入真正实现

## 当前文档链

当前提案线固定沿以下文档推进：

1. [274-desktop-v3-delivery-updater-proposal.md](./274-desktop-v3-delivery-updater-proposal.md)
2. [275-desktop-v3-delivery-updater-technical-baseline.md](./275-desktop-v3-delivery-updater-technical-baseline.md)
3. [276-desktop-v3-delivery-updater-detailed-design.md](./276-desktop-v3-delivery-updater-detailed-design.md)
4. [277-desktop-v3-delivery-updater-execution-baseline.md](./277-desktop-v3-delivery-updater-execution-baseline.md)
5. [278-desktop-v3-delivery-updater-acceptance-matrix.md](./278-desktop-v3-delivery-updater-acceptance-matrix.md)
6. [279-desktop-v3-delivery-updater-execution-runbook.md](./279-desktop-v3-delivery-updater-execution-runbook.md)
7. [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)

## 当前结论

- `Wave 1 Skeleton` 已完成，不再作为继续扩写业务层的理由
- `desktop-v3` 下一条主线先做 `Delivery / Updater Baseline`
- 当前先冻结交付与更新架构，不进入业务层
- `280` 用于记录当前文档线的本地与远端 proof closeout
- 只有当 `274 -> 280` 文档链完成并通过文档 gate 后，才允许进入后续实现
