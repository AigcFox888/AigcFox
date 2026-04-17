# AigcFox API 契约基线

## 文档定位

本文档冻结当前 Go backend 的远端 API 契约。

当前只写 skeleton 期已经激活的通用约定，不把未来业务域接口提前写成既成事实。

## API 基础约定

### Base URL

- 生产环境：`https://{backend-host}/api/v1`
- 本地开发：`http://127.0.0.1:3211/api/v1`
- 版本前缀：`/api/v1`

### Content-Type

- 请求：`application/json`
- 响应：`application/json; charset=utf-8`

### 认证方式

- 当前 skeleton 只保留占位：`Authorization: Bearer <token>`
- 完整认证契约在鉴权边界真正激活后补充

## 统一请求/响应格式

### 单对象成功响应

```json
{
  "ok": true,
  "data": {
    "status": "pass",
    "service": "control-plane-api"
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

### 列表成功响应

```json
{
  "ok": true,
  "data": [
    {
      "id": "9d9d3bd7-8e55-4c9a-b9d5-2c6e1f2c3b18",
      "name": "example"
    }
  ],
  "meta": {
    "requestId": "req_123",
    "pagination": {
      "total": 100,
      "page": 1,
      "perPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 错误响应

```json
{
  "ok": false,
  "error": {
    "code": "invalid_request",
    "message": "请求参数不合法",
    "requestId": "req_123",
    "issues": []
  }
}
```

## 错误码表

| 错误码 | HTTP 状态 | 含义 | 触发场景 |
| --- | --- | --- | --- |
| `invalid_request` | `400` | 请求参数或 JSON 结构非法 | 字段缺失、类型错误、路径参数格式错误 |
| `unauthorized` | `401` | 未认证或认证失效 | token 缺失、token 过期 |
| `forbidden` | `403` | 已认证但无权限 | 权限不足 |
| `not_found` | `404` | 资源不存在 | 请求目标不存在 |
| `conflict` | `409` | 资源状态冲突 | 唯一键冲突、重复提交 |
| `not_ready` | `503` | 服务当前未就绪 | readiness 检查失败 |
| `internal_error` | `500` | 服务内部错误 | 未预期异常、底层依赖失败 |
| `[auth_*]` | `[TBD]` | 鉴权领域错误码占位 | 对应领域激活后补充 |
| `[operator_*]` | `[TBD]` | operator 领域错误码占位 | 对应领域激活后补充 |
| `[desktop_*]` | `[TBD]` | desktop 领域错误码占位 | 对应领域激活后补充 |

## 分页约定

### 请求参数

- `page`：页码，从 `1` 开始
- `per_page`：每页数量

### 响应结构

分页信息位于：

```json
{
  "meta": {
    "requestId": "req_123",
    "pagination": {
      "total": 100,
      "page": 1,
      "perPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 当前已激活端点

| Method | Path | 描述 | 请求体 | 响应体 |
| --- | --- | --- | --- | --- |
| `GET` | `/healthz` | liveness 探针 | 无 | `ok + data + meta` |
| `GET` | `/api/v1/healthz` | v1 liveness 探针 | 无 | `ok + data + meta` |
| `GET` | `/v1/healthz` | 兼容型 liveness 探针 | 无 | `ok + data + meta` |
| `GET` | `/readyz` | readiness 探针 | 无 | `ok + data + meta` 或 `ok=false + error` |

说明：

- 当前 skeleton 只激活健康与就绪接口
- 其他业务域接口尚未进入当前执行线，不应写成已定义

## Tauri command 与 API 端点映射

当前 `desktop-v3 Wave 1 Skeleton` 代码已落地，以下映射固定用于当前诊断骨架：

| Tauri command | HTTP 方法 + 路径 | 说明 |
| --- | --- | --- |
| `desktop_get_backend_liveness` | `GET /api/v1/healthz` | 客户端获取后端 liveness 快照 |
| `desktop_get_backend_readiness` | `GET /readyz` | 客户端获取后端 readiness 快照 |

如果某个 command 只涉及本地 SQLite 或本地诊断，则不映射远端 API。

## 实现规则

- Go handler 必须返回统一 envelope
- 错误必须带 `code`、`message`、`requestId`
- Rust 必须按统一错误结构解析远端失败
- 不允许同一模块另发明一套响应格式

## 使用出口

- 系统架构见 [architecture.md](./architecture.md)
- 本地 SQLite 契约见 [local-schema.md](./local-schema.md)
- 研发流程见 [workflow.md](./workflow.md)
