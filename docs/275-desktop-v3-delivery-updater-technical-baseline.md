# AigcFox desktop-v3 交付与更新技术基线

## 文档定位

本文档用于冻结 `desktop-v3 Delivery / Updater Baseline` 的技术选型。

它只定义：

- 交付链和更新链用什么技术
- 为什么这样选
- 哪些方案当前不进入

## 选型冻结结论

| 领域 | 冻结选型 | 当前不选 | 说明 |
| --- | --- | --- | --- |
| 构建权威源 | `GitHub Actions matrix packaging` | 本地手工三端长期发包 | 三端包由 CI 统一产出，减少宿主差异。 |
| 生产更新客户端 | `Tauri 2 updater plugin` | 自写 updater | 跟随 `desktop-v3` 当前宿主主线，避免双轨更新实现。 |
| 正式更新源 | `七牛对象存储或自有 HTTPS 服务器` | `GitHub Releases` 面向用户直出 | 中国用户网络条件下，GitHub 不能作为正式分发源。 |
| 更新清单 | `Tauri updater manifest + 独立 update policy JSON` | 只靠单一自定义大 JSON | 把“客户端下载清单”和“强更策略”分层治理。 |
| 渠道模型 | `dev(local disabled/mock) / staging / stable` | 一开始就扩成多级复杂渠道 | 先冻结最小可控渠道集。 |
| 产物提升 | `GitHub Actions artifacts -> staging bucket -> promote to stable` | 直接把 feature 构件暴露给正式用户 | 先 staging，再 promote，保证可回滚。 |
| 版本比较 | `SemVer` | 自定义非标准版本串 | 保持升级、回滚与策略判断一致。 |
| 签名 | `Tauri updater signing key pair` | 未签名更新 | 更新签名是强制边界，不后补。 |
| 密钥管理 | `GitHub Actions Environments + Secrets` | 本地长期保管生产签名密钥 | 构建和发布密钥进入 CI 受控环境。 |
| 更新策略 | `启动前强更 / 会话内只提醒不强退` | 会话中途强制退出安装 | 与当前用户约束保持一致。 |
| 发布协议 | `HTTPS only` | 用户侧 HTTP 拉包 | 正式更新只允许 HTTPS。 |

## 官方约束冻结

当前 `desktop-v3` 的交付与更新设计必须满足以下 `Tauri 2` 官方约束：

- updater 通过官方 `plugin-updater` 进入，不自写第二套更新器
- updater 端点支持静态 JSON 服务器，也支持 URL 动态变量
- 当前允许依赖的动态变量只包括：
  - `{{current_version}}`
  - `{{target}}`
  - `{{arch}}`
- updater plugin 的命令权限必须通过 capability / permission 显式授予
- 打包时必须生成 updater 所需的更新产物，而不是只产出安装包

详细使用边界仍以官方 Tauri 文档为准：

- [Tauri v2 updater plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri v2 GitHub pipeline docs](https://v2.tauri.app/distribute/pipelines/github/)

当前仓库还额外冻结一条实现前置边界：

- 当前用 `pnpm qa:desktop-v3-updater-governance` 对 `desktop-v3` 客户端代码面做静态门禁；在 updater 结构化重写落地前，`Cargo.toml`、共享 `tauri.conf.json`、capability / permission、Rust / renderer source 都不允许提前引入 plugin 依赖、manifest / policy endpoint、强更策略字段或 GitHub Releases 客户端更新源

## 渠道基线

当前渠道固定为三类：

### 1. `dev`

定位：

- 本地开发
- 本地 smoke
- 默认不连正式更新源

规则：

- 默认关闭真实 updater 拉取
- 允许接本地 mock feed
- 不参与正式 promote

### 2. `staging`

定位：

- 内部验证
- 准生产候选构件验证

规则：

- 只接收从 GitHub Actions promote 过来的候选包
- 清单与包体都放在 staging bucket / staging prefix
- 可用于更新功能真实演练

### 3. `stable`

定位：

- 面向正式用户

规则：

- 只能接收从 staging promote 过来的构件
- 只能从七牛或自有 HTTPS 正式源拉取
- 不允许直接指向 GitHub

## 更新源基线

当前更新源边界冻结如下：

```text
GitHub Actions
-> 受控上传或 promote
-> 七牛对象存储 / 自有 HTTPS
-> 客户端 updater
```

硬规则：

- GitHub artifacts 是中间产物，不是正式用户入口
- GitHub Releases 可以保留给开发或审计，但不是中国用户正式更新源
- 正式客户端下载 URL 必须稳定、可审计、可回滚

## 清单分层基线

当前清单固定拆成两层：

### 1. updater manifest

职责：

- 告诉客户端是否有新版本
- 提供平台对应下载 URL、签名和版本信息

规则：

- 由 `Tauri updater plugin` 消费
- 一次只回答“当前渠道该升级到哪个版本”

### 2. update policy JSON

职责：

- 定义 `minSupportedVersion`
- 定义当前版本是否必须在启动前升级
- 定义提示文案、公告 URL、发布时间等非安装包元数据

规则：

- 由 Rust local runtime 读取并做策略裁决
- 不把策略判断直接塞回 renderer 页面代码

## 版本与回滚基线

### 版本规则

- 所有正式客户端版本使用 `SemVer`
- 构件路径按 `channel / target / arch / version` 固定落位
- 已发布版本目录不可复写，只允许追加或回滚指针变更

### 回滚规则

当前回滚不采用“覆盖旧文件”。

固定方式：

- 保留历史版本目录
- 通过 `manifest` 或 `policy` 指针回退到旧稳定版本
- 回滚动作必须能审计到是谁、何时、为何回滚

## 强更策略基线

当前强更策略固定为：

- 启动期允许阻断进入主界面并要求升级
- 正在使用中的会话不做中途强退安装
- 会话中如果发现强更条件变化，只允许提示“下次启动必须升级”

这意味着：

- 强更判断优先发生在应用启动流程
- 安装与重启动作必须显式由更新 guard 接管
- 不允许后台静默把正在运行的客户端强行替换

## 密钥与 Secrets 基线

当前生产级密钥边界冻结为：

- updater 签名私钥只允许进入 GitHub Actions 受控环境
- 公钥进入客户端构建配置
- 七牛 AccessKey / SecretKey 或对象存储等价凭据只允许进入发布环境 secrets
- 本地开发机不保存长期生产签名私钥

## 当前明确不做

- 发布控制台业务页面
- 云端版本中心业务 API
- 会员、登录注册、支付、积分、订单
- 复杂灰度平台
- 多区域多租户发布治理

## 关联文档

- [267-desktop-v3-github-actions-baseline.md](./267-desktop-v3-github-actions-baseline.md)
- [269-desktop-v3-tauri-2-governance-baseline.md](./269-desktop-v3-tauri-2-governance-baseline.md)
- [276-desktop-v3-delivery-updater-detailed-design.md](./276-desktop-v3-delivery-updater-detailed-design.md)
- [277-desktop-v3-delivery-updater-execution-baseline.md](./277-desktop-v3-delivery-updater-execution-baseline.md)
- [278-desktop-v3-delivery-updater-acceptance-matrix.md](./278-desktop-v3-delivery-updater-acceptance-matrix.md)
- [279-desktop-v3-delivery-updater-execution-runbook.md](./279-desktop-v3-delivery-updater-execution-runbook.md)
- [280-desktop-v3-delivery-updater-closeout.md](./280-desktop-v3-delivery-updater-closeout.md)
