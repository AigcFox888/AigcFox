# ADR-0005-local-database

## 状态

Accepted

## 背景

客户端需要一个本地数据库，用于离线缓存、用户偏好和同步状态。

选型需要满足：

- 本地数据逻辑留在 Rust 层
- 与 `Tauri 2` 架构一致
- 跨平台可用且不依赖用户机器系统 SQLite
- 首期实现尽量同步、简单、可控

## 考虑过的选项

- `rusqlite(bundled) + rusqlite_migration`
- `tauri-plugin-sql`
- `sqlx`
- `redb`

## 决定

本地数据库统一采用 `rusqlite(bundled) + rusqlite_migration`。

## 原因

- `rusqlite` 让本地数据库访问明确落在 Rust 层，保持“本地逻辑留 Rust 层”的架构一致性。
- 首期客户端本地数据规模和并发要求有限，同步式 `rusqlite` 足以支撑，不必提前引入异步数据库抽象。
- `bundled` 模式保证跨平台一致性，不依赖用户机器预装 SQLite。
- `rusqlite_migration` 能直接配合当前本地 schema 追加迁移，足够轻量。
- 相比 `tauri-plugin-sql`，当前方案避免把数据库能力直接暴露到前端桥接层。
- 相比 `sqlx`，`rusqlite` 更贴近 SQLite 场景，首期复杂度更低。
- 相比 `redb`，SQLite 的生态、可读性和调试体验更成熟。

## 后果

- React 前端不能直接访问本地数据库，必须通过 Tauri command 走 Rust。
- 本地数据库操作默认是同步式的，需要通过边界控制避免滥用长耗时查询。
- 所有本地 schema 变更都必须同步更新迁移定义和本地 schema 文档。
- 如果未来本地数据规模、并发或复杂查询需求明显上升，再评估是否需要调整。
