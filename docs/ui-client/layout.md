# AigcFox Desktop V3 客户端布局与导航规范

## 文档定位

本文档冻结 `apps/desktop-v3` renderer 的页面骨架、导航结构与内容布局模式。

它必须服从 [../258-desktop-v3-technical-baseline.md](../258-desktop-v3-technical-baseline.md) 与 [../260-desktop-v3-wave1-execution-baseline.md](../260-desktop-v3-wave1-execution-baseline.md) 的骨架约束口径。

## 1. 窗口约束

`desktop-v3` 的 Tauri 窗口宽度基线固定为：

```json
{
  "app": {
    "windows": [
      {
        "minWidth": 1000,
        "minHeight": 720,
        "width": 1440,
        "height": 900,
        "resizable": true
      }
    ]
  }
}
```

宽度规则：

- 设计基准宽度：`1440px`
- 最低支持宽度：`1280px`
- 推荐最小宽度：`1366px`
- 保护性最小宽度：`1000px`
- `1920px+` 时主内容区 `max-width = 1400px` 并居中

布局规则：

- 页面骨架必须采用流式 `flex` 或 `grid`，不能按整页固定宽度切图
- 主内容区必须支持窗口可调整大小
- 不允许通过横向滚动补偿窄窗口
- `1000px` 到 `1279px` 允许 compact fallback，但必须保持不破版

## 1.1 响应式分段

- `<1366px`：compact layout
- `1366px - 1919px`：standard layout
- `1920px+`：centered layout

不同分段的目标：

- compact：保留主导航、关键筛选和主操作，收紧间距与侧栏宽度
- standard：按默认工作台密度展示完整壳层
- centered：内容不继续无限拉伸，而是保持 `1400px` 上限居中

## 2. 整体页面骨架

客户端只允许一套壳层模板：

```text
┌────────────────────────────────────────────────────────────┐
│ TitleBar（Tauri 自定义标题栏）                              │
├──────────────┬─────────────────────────────────────────────┤
│ Sidebar      │ PageHeader                                  │
│ 240 / 200 px ├─────────────────────────────────────────────┤
│ shrinkable   │ Workspace Content                           │
│              │ flex: 1 + centered inner container          │
└──────────────┴─────────────────────────────────────────────┘
```

参考结构：

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div data-tauri-drag-region className="h-9 shrink-0 border-b bg-background" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader />
          <main className="flex-1 overflow-hidden px-4 py-4 min-[1366px]:px-6 min-[1366px]:py-6 min-[1920px]:px-8">
            <div className="mx-auto flex h-full w-full min-w-0 max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
```

硬规则：

- `AppShell` 是唯一壳层模板
- 不允许局部页面自建第二种主框架
- 主内容区不允许把滚动当作默认退路
- 不允许写死整页 `width: 1280px`、`width: 1440px` 这类固定布局
- 内容内层容器必须是 `w-full + max-w-[1400px] + mx-auto`

## 3. 侧边栏导航规范

推荐宽度：

- 展开态：`240px`
- compact 展开态：`200px`
- 折叠态：`72px`

导航结构固定三段式：

- 顶部：Logo 与应用名
- 中部：主导航与二级导航
- 底部：设置、账户、版本等固定项

硬规则：

- 最多两层导航
- 只允许 inline 展开，不使用浮动三级菜单
- 导航项过多时，必须通过分组、能力治理、折叠或重构 IA 处理，不允许给侧边栏加滚动条
- `<1366px` 时默认切 compact 宽度和更紧凑的条目间距
- 侧边栏宽度切换不能把主内容区挤出横向滚动

激活态示例：

```tsx
<NavItem
  className={cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-accent text-accent-foreground font-medium"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  )}
/>
```

## 4. PageHeader 规范

每个页面必须有固定 PageHeader：

```tsx
<div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
  <div>
    <Breadcrumb />
    <h1 className="page-title">{title}</h1>
    {subtitle && <p className="caption mt-0.5">{subtitle}</p>}
  </div>

  <div className="flex items-center gap-2">
    {actions}
  </div>
</div>
```

规则：

- 页面标题每页唯一
- 右侧主操作最多 3 个，超出用下拉收纳
- 超过 3 层的页面必须有面包屑

## 5. 内容区布局模式

客户端页面只能选以下 4 种模式之一。

### 列表页

```tsx
<div className="flex h-full min-w-0 flex-col gap-4">
  <Toolbar />
  <DataTable columns={columns} data={data} />
</div>
```

### 详情页

```tsx
<div className="grid h-full min-w-0 gap-6 min-[1366px]:grid-cols-[minmax(0,1fr)_320px]">
  <div className="min-w-0 flex-1 space-y-4">{/* 主内容 */}</div>
  <aside className="min-w-0 space-y-4">{/* 信息面板 */}</aside>
</div>
```

### 表单页

```tsx
<div className="h-full w-full max-w-[880px] space-y-6">{/* 表单内容 */}</div>
```

### 仪表盘页

```tsx
<div className="grid h-full grid-cols-1 gap-4 min-[1366px]:grid-cols-2 min-[1600px]:grid-cols-3 min-[1920px]:grid-cols-4">
  {cards}
</div>
```

补充规则：

- 列表、详情、表单、仪表盘都必须以 `min-w-0` 处理内部收缩
- 所有页面容器默认 `w-full`，只通过 `max-width` 控制上限
- 页面内边距必须响应式变化，不能全程固定一个 `p-6`

## 6. 滚动与溢出处理规则

`desktop-v3` 当前布局基线只明确禁止横向滚动，不再把“完全无滚动”当成硬约束。

因此：

- 不允许出现横向滚动条
- 不允许靠写死宽度制造溢出
- 不鼓励无节制地制造多层嵌套滚动容器

推荐顺序：

1. 先通过响应式布局、分页和拆分信息密度解决溢出
2. 需要长内容时，优先允许主内容区单层纵向滚动
3. 只有在确有必要时，才为局部区域增加受控纵向滚动

默认仍应避免：

- 用长表格、长表单、长日志区堆出多层滚动体验
- 让侧边栏和主内容区同时出现彼此独立的长滚动链

## 7. 响应与稳定性

必须覆盖的宿主变化：

- 普通拖拽缩放
- 最大化 / 还原
- Windows `125%` / `150%` DPI
- `1280px` 最低支持宽度
- `1366px` 推荐最小宽度
- `1440px` 设计基准宽度
- `1920px+` 宽屏居中模式

稳定性规则：

- 页面骨架不跳层
- 不出现横向溢出
- 文字、按钮、输入框不被遮挡
- 侧边栏在 `240px -> 200px` 切换时不导致主内容区破版
- 宽屏下内容不无限拉长，必须保持 `1400px` 上限居中

## 8. 关联文档

- [system.md](./system.md)
- [components.md](./components.md)
- [interaction.md](./interaction.md)
- [../258-desktop-v3-technical-baseline.md](../258-desktop-v3-technical-baseline.md)
- [../260-desktop-v3-wave1-execution-baseline.md](../260-desktop-v3-wave1-execution-baseline.md)
