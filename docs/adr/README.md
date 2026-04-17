# AigcFox ADR 索引

ADR 用于记录当前 `desktop-v3` 主线的重要技术决策。

## 文件命名规范

```text
ADR-NNNN-title.md
```

## 当前 ADR 索引

| ADR | 标题 | 决策摘要 |
| --- | --- | --- |
| [ADR-0004-desktop-framework.md](./ADR-0004-desktop-framework.md) | 桌面框架选型 | 选用 `Tauri 2`，不采用 `Electron/Wails` |
| [ADR-0005-local-database.md](./ADR-0005-local-database.md) | 本地数据库选型 | 选用 `rusqlite(bundled) + rusqlite_migration` |
