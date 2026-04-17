# AigcFox 本地 SQLite 数据契约

## 文档定位

本文档冻结 `desktop-v3 Wave 1 Skeleton` 的本地 SQLite 契约。

当前只覆盖 skeleton 阶段已经冻结的数据边界：

- 用户偏好
- 通用同步缓存
- 字段类型约定
- 敏感数据禁存规则

## 当前冻结结论

- 本地 SQLite 当前最小 schema 包含 `user_preferences` 与 `sync_cache`
- 本地库只服务客户端偏好、本地缓存和同步辅助
- 敏感凭据不得进入 SQLite

## 本地 SQLite Schema

### `user_preferences`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `key` | `TEXT` | `PRIMARY KEY` | 偏好项唯一键 |
| `value` | `TEXT` | `NOT NULL` | 偏好项值，可为普通字符串或 JSON 字符串 |

```sql
CREATE TABLE user_preferences (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### `sync_cache`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `TEXT` | `PRIMARY KEY` | 本地缓存记录 ID，按 UUID 字符串存储 |
| `remote_id` | `TEXT` | `NOT NULL` | 对应远端对象 ID |
| `data` | `TEXT` | `NOT NULL` | 远端对象或本地草稿的 JSON blob |
| `synced_at` | `TEXT` | 可空 | 最近一次成功同步时间，ISO 8601 |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` | 本地创建时间 |
| `is_dirty` | `INTEGER` | `NOT NULL DEFAULT 1` | 同步状态标记，`0=已同步`、`1=待同步` |

```sql
CREATE TABLE sync_cache (
    id          TEXT PRIMARY KEY,
    remote_id   TEXT NOT NULL,
    data        TEXT NOT NULL,
    synced_at   TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    is_dirty    INTEGER NOT NULL DEFAULT 1
);
```

## 字段类型约定

| 语义 | SQLite 类型 | 约定 |
| --- | --- | --- |
| UUID | `TEXT` | 统一存标准 UUID 字符串 |
| 时间 | `TEXT` | 统一存 ISO 8601 字符串 |
| 布尔值 | `INTEGER` | `0=false`，`1=true` |
| JSON | `TEXT` | 存 JSON 序列化字符串 |
| 普通字符串 | `TEXT` | 默认使用 `TEXT` |
| 计数或状态位 | `INTEGER` | 用于简单计数与标记 |

## 同步状态标记

### `is_dirty`

| 值 | 含义 | 场景 |
| --- | --- | --- |
| `0` | 已同步 | 本地与远端已对齐 |
| `1` | 待同步 | 本地新建、修改或冲突待处理 |

规则：

1. 本地修改后置为 `1`
2. 同步成功后更新 `synced_at` 并置为 `0`
3. 同步失败或冲突时保持 `1`

## 禁止存入本地 SQLite 的数据

- access token
- refresh token
- 第三方 API key
- 第三方签名材料或密钥材料
- 明文密码
- 任何必须进入 secure store / keyring 的敏感值
- 仅服务端可见的正式审计真相

## 当前实现规则

- SQLite 只能通过 Rust 层访问
- React 不允许直接读写 SQLite
- schema 变更必须通过 `rusqlite_migration` 追加迁移
- 新增表或字段时必须同步更新本文档

## 使用出口

- 系统架构见 [architecture.md](./architecture.md)
- API 契约见 [api.md](./api.md)
- 研发流程见 [workflow.md](./workflow.md)
