# AigcFox Desktop V3 客户端数据可视化规范

## 文档定位

本文档冻结 `desktop-v3` renderer 中图表的库选型、组件封装和展示约束。

## 1. 图表库

客户端图表固定采用：

- `Recharts`
- shadcn `ChartContainer`

禁止：

- `ECharts`
- `Chart.js`
- `D3`
- 裸用 `Recharts` 而不经过统一容器

示例：

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

<ChartContainer config={chartConfig} className="h-64 w-full">
  <LineChart data={data}>
    <XAxis dataKey="date" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line dataKey="value" stroke="var(--color-value)" />
  </LineChart>
</ChartContainer>
```

## 2. 图表类型选择

| 场景 | 使用 | 禁止 |
| --- | --- | --- |
| 时间序列趋势 | `LineChart` | 用柱状图表达连续趋势 |
| 分类数量对比 | `BarChart` | 首期默认不做横向长条图主视图 |
| 占比构成（5 类以内） | `PieChart` / `RadialBarChart` | 多类别饼图 |
| 多指标对比 | 多系列 `LineChart` | 雷达图 |

## 3. 图表调色板

图表颜色是客户端唯一允许单独维护的颜色集合。

```css
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  --chart-1: 220 70% 65%;
  --chart-2: 160 60% 60%;
  --chart-3: 30 80% 65%;
  --chart-4: 280 65% 70%;
  --chart-5: 340 75% 65%;
}
```

规则：

- 多系列颜色按顺序取 `--chart-1` 到 `--chart-5`
- 不允许每个图表自己选色
- 不把 `bg-primary` 之类的界面色直接当图表数据色

## 4. Chart Config 规范

每个图表都必须定义 `chartConfig`：

```tsx
const chartConfig = {
  value: {
    label: "数值",
    color: "hsl(var(--chart-1))",
  },
  compare: {
    label: "对比",
    color: "hsl(var(--chart-2))",
  },
}
```

## 5. 图表状态处理

所有图表卡片都必须覆盖：

- 加载
- 空数据
- 正常态

参考结构：

```tsx
<Card>
  <CardHeader>
    <CardTitle>图表标题</CardTitle>
    <CardDescription>说明文字</CardDescription>
  </CardHeader>
  <CardContent>
    {isLoading ? (
      <Skeleton className="h-64 w-full" />
    ) : !data?.length ? (
      <EmptyState message="暂无数据" />
    ) : (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <ChartTooltip content={<ChartTooltipContent />} />
        {chart}
      </ChartContainer>
    )}
  </CardContent>
</Card>
```

## 6. 数字与时间格式化

图表中禁止直接显示原始数值。

建议格式化工具：

```ts
export const fmt = {
  number: (n: number) => new Intl.NumberFormat("zh-CN").format(n),
  percent: (n: number) => `${n.toFixed(1)}%`,
  currency: (n: number, symbol = "¥") =>
    `${symbol}${new Intl.NumberFormat("zh-CN").format(n)}`,
}
```

规则：

- Tooltip 必须格式化
- Y 轴和统计数字必须格式化
- 日期轴标签由共享格式化工具统一处理，不在图表组件里临时拼字符串

## 7. 关联文档

- [system.md](./system.md)
- [components.md](./components.md)
- [../258-desktop-v3-technical-baseline.md](../258-desktop-v3-technical-baseline.md)
