# AigcFox Desktop V3 客户端设计系统规范

## 文档定位

本文档冻结 `apps/desktop-v3` renderer 层的设计系统与基础 UI 使用约束。

它只适用于：

- `desktop-v3` 的 `React + TypeScript + shadcn/ui` 前端壳层

它不适用于：

- operator 管理端规范链
- 远端 Go API 服务实现
- 任何历史客户端目录

若与更高层文档冲突，以 [../258-desktop-v3-technical-baseline.md](../258-desktop-v3-technical-baseline.md)、[../259-desktop-v3-detailed-design.md](../259-desktop-v3-detailed-design.md) 与 [../260-desktop-v3-wave1-execution-baseline.md](../260-desktop-v3-wave1-execution-baseline.md) 为准。

## 1. 组件基线

`desktop-v3` 设计系统固定为：

- `shadcn/ui`
- `Radix UI`
- `Tailwind CSS 4`
- `lucide-react`

配套实现固定为：

- 表单：`react-hook-form + zod`
- 提示反馈：`sonner`
- 图表：`Recharts + ChartContainer`

禁止：

- 再引入 `Ant Design` 作为客户端主组件体系
- 混用多套图标库
- 为了局部页面单独建立第二套视觉 token

## 2. 色彩系统

核心原则：

- 禁止在客户端组件中硬编码颜色值
- 所有常规颜色必须来自 shadcn 语义 token
- 图表色是唯一允许单独维护的例外，详见 [charts.md](./charts.md)

推荐语义色：

| 变量 | 用途 |
| --- | --- |
| `bg-background` | 页面底层背景 |
| `bg-card` | 卡片与面板背景 |
| `bg-popover` | 弹层背景 |
| `bg-primary` | 主操作背景 |
| `bg-secondary` | 次操作背景 |
| `bg-muted` | 次级区域、占位区域 |
| `bg-accent` | 激活态、hover 态 |
| `bg-destructive` | 危险操作背景 |
| `text-foreground` | 主要文字 |
| `text-muted-foreground` | 次要文字 |
| `text-primary-foreground` | 主按钮文字 |
| `text-destructive` | 错误文字 |
| `border` | 默认边框 |
| `ring` | 焦点环 |

正确示例：

```tsx
<div className="bg-card text-foreground" />
<Button className="bg-primary text-primary-foreground" />
```

禁止示例：

```tsx
<div style={{ color: "#333333" }} />
<div className="text-[#666]" />
<div className="bg-blue-500" />
```

## 3. Light / Dark 模式

切换规则：

- 在 `<html>` 根元素切换 `dark` class
- 用户偏好存入本地 SQLite 偏好表，不放入 `localStorage`
- `system` 模式跟随宿主系统主题

硬规则：

- 主题切换只改 token，不逐页覆写
- 深色模式仍必须保持对比度与可读性

## 4. 字体层级

组件中不要散落手写标题类名，统一采用固定层级：

| 层级名 | Tailwind 类 | 使用场景 |
| --- | --- | --- |
| `page-title` | `text-2xl font-semibold tracking-tight` | 页面唯一标题 |
| `section-title` | `text-lg font-semibold` | 区块标题 |
| `card-title` | `text-base font-medium` | 卡片标题 |
| `body` | `text-sm` | 正文 |
| `body-sm` | `text-xs` | 说明文字 |
| `label` | `text-sm font-medium` | 表单标签 |
| `caption` | `text-xs text-muted-foreground` | 时间戳、补充说明 |
| `code` | `font-mono text-sm` | ID、代码、短 token |

建议：

- 在 `src/lib/typography.ts` 统一导出这些类名
- 组件只消费语义别名，不重复拼接字符串

## 5. 间距系统

基准固定为 `4px`。

允许的主要间距：

| Token | px | 使用场景 |
| --- | --- | --- |
| `gap-1` / `p-1` | 4 | 图标与文字的极小间距 |
| `gap-2` / `p-2` | 8 | 控件内部紧凑间距 |
| `gap-3` / `p-3` | 12 | 小型表单组、局部说明区 |
| `gap-4` / `p-4` | 16 | 卡片内边距、常规字段间距 |
| `gap-6` / `p-6` | 24 | 卡片之间、区块内主要间距 |
| `gap-8` / `p-8` | 32 | 大区块之间 |
| `gap-12` / `p-12` | 48 | 页面级留白 |

禁止：

- `p-5`、`p-7`、`p-9` 这类不规则值
- 同一页面里同时出现多套不成体系的边距密度

## 6. 圆角与边框

| 组件层级 | 规则 |
| --- | --- |
| 页面级容器 | 不强调圆角 |
| 卡片、面板 | `rounded-lg` |
| 按钮、输入框、Badge | `rounded-md` |
| 头像 | `rounded-full` |
| Tooltip、Popover | `rounded-md` |

硬规则：

- 优先用 `border` 建层级，不用厚重阴影
- 禁止随意写 `rounded-[Npx]`
- 不默认使用 `rounded-xl` 及以上的夸张圆角

## 7. 阴影

阴影策略固定为：

- 默认不用阴影
- 轻量 hover 卡片可使用 `shadow-sm`
- 层次分隔优先使用边框和背景差异

禁止：

- `shadow-md`、`shadow-lg`、`shadow-xl`
- 依赖阴影制造主结构层级

## 8. 图标与反馈

图标规则：

- 仅使用 `lucide-react`
- 导航图标统一 `size-5`
- 按钮内图标统一 `size-4`

反馈规则：

- 全局 Toast 统一走 `sonner`
- 不使用 `window.alert()`
- 不在单个页面私自引入第二套提示组件

## 9. 关联文档

- [layout.md](./layout.md)
- [components.md](./components.md)
- [interaction.md](./interaction.md)
- [charts.md](./charts.md)
- [../260-desktop-v3-wave1-execution-baseline.md](../260-desktop-v3-wave1-execution-baseline.md)
- [../258-desktop-v3-technical-baseline.md](../258-desktop-v3-technical-baseline.md)
- [../259-desktop-v3-detailed-design.md](../259-desktop-v3-detailed-design.md)
