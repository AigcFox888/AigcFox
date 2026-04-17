# AigcFox Desktop V3 客户端交互规范

## 文档定位

本文档冻结 `desktop-v3` 的键盘操作、确认交互、焦点、动效与宿主交互边界。

## 1. 全局快捷键

客户端必须支持的全局快捷键：

| 快捷键 | 功能 |
| --- | --- |
| `Cmd/Ctrl + ,` | 打开设置 |
| `Cmd/Ctrl + R` | 刷新当前页数据 |
| `Esc` | 关闭当前 `Dialog` / `Sheet` |
| `Cmd/Ctrl + N` | 当前页的新建动作 |

统一注册位置：

- `src/hooks/useKeyboardShortcuts.ts`
- 只在壳层注册一次

优先级规则：

```text
Dialog / Sheet 内快捷键 > 页面级快捷键 > 全局快捷键
```

## 2. 确认对话框

必须弹确认的场景：

- 删除
- 清空本地数据
- 重置为默认值
- 不可逆批量操作

通常不需要确认的场景：

- 普通新建
- 普通保存
- 页面切换
- 排序、筛选切换

高危操作规则：

- 必须明确说明后果
- 必须用危险色表达
- 必要时要求用户输入指定确认词

## 3. 动画与过渡

允许：

- shadcn / Radix 默认的轻量出入场动画

禁止：

- 复杂页面切换动效
- 引入 `Framer Motion` 作为首期基础依赖
- 用动画掩盖慢加载

兼容规则：

- 必须遵守 `prefers-reduced-motion`
- 数据加载完成直接进入真实内容，骨架屏已经承担过渡职责

## 4. 焦点管理

焦点规则：

- `Dialog` / `Sheet` 打开时焦点自动进入弹层
- 关闭后焦点返回触发元素
- Toast 出现不抢焦点
- 不能在操作后把焦点丢回 `document.body`

## 5. 拖拽与多窗口

首期冻结结论：

- 不引入拖拽排序
- 不引入多窗口

如后续必须支持拖拽，优先评估 `@dnd-kit/core`，但不在当前执行基线内。

## 6. 宿主交互边界

交互层硬规则：

- 渲染层不直接拿系统级权限
- 涉及文件、进程、网络等高权限行为，必须通过 Tauri command 进入 Rust 层
- 渲染层不能假定宿主能力永远可用，必须处理 fail-closed 和错误提示

## 7. 关联文档

- [system.md](./system.md)
- [layout.md](./layout.md)
- [components.md](./components.md)
- [../259-desktop-v3-detailed-design.md](../259-desktop-v3-detailed-design.md)
