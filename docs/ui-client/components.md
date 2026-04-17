# AigcFox Desktop V3 客户端组件使用规范

## 文档定位

本文档冻结 `desktop-v3` renderer 常用组件的选型、变体和交互使用方式。

## 1. 按钮规范

变体规则：

| 变体 | 使用场景 |
| --- | --- |
| `default` | 页面主操作，每页最多 1 个 |
| `secondary` | 次操作 |
| `outline` | 中性工具操作 |
| `ghost` | 行内或图标工具操作 |
| `destructive` | 删除、清空等不可逆操作 |
| `link` | 纯文字跳转 |

示例：

```tsx
<Button variant="destructive" onClick={handleDelete}>
  删除记录
</Button>

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
  保存
</Button>
```

禁止：

```tsx
<Button className="bg-red-500">删除</Button>
<Button variant="ghost" size="icon">
  <Trash2 />
</Button>
```

纯图标按钮必须带 Tooltip。

## 2. 表单规范

表单固定采用：

- `react-hook-form`
- `zod`
- shadcn `Form` 组件封装

推荐结构：

```tsx
<Form {...form}>
  <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>邮箱</FormLabel>
          <FormControl>
            <Input placeholder="请输入邮箱" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        取消
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        保存
      </Button>
    </div>
  </form>
</Form>
```

规则：

- 标签在上，字段在下
- 单字段优先 `onBlur` 校验，提交时全量校验
- 错误信息必须具体，不写“格式错误”

## 3. 表格与列表规范

客户端表格统一通过 `DataTable` 封装，不直接散落裸 `@tanstack/react-table` 配置。

状态处理必须完整：

```tsx
if (isLoading) return <TableSkeleton rows={10} />
if (error) return <ErrorState onRetry={refetch} />
if (!data?.length) return <EmptyState message="暂无数据" />
return <DataTable columns={columns} data={data} />
```

硬规则：

- 默认分页，不做无限滚动
- 列过多时优先收敛字段、拆详情，不加横向滚动条
- 行级高危操作必须二次确认

## 4. Dialog / Sheet 使用规则

| 场景 | 组件 | 说明 |
| --- | --- | --- |
| 删除、重置等确认 | `AlertDialog` / `Dialog` | 小型确认框 |
| 5 个字段以内的简单表单 | `Dialog` | 中等宽度 |
| 复杂表单、详情预览、过滤面板 | `Sheet` | 右侧展开 |
| 页面级工作流 | 新页面或分步壳层 | 不用全屏 Dialog |

禁止：

- Dialog 套 Dialog
- 用全屏 Dialog 替代页面

## 5. Toast 规范

客户端全局提示固定使用 `sonner`。

建议封装：

```tsx
import { toast } from "sonner"

export const notify = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (message: string) => toast.error(message, { duration: 5000 }),
  warning: (message: string) => toast.warning(message, { duration: 4000 }),
  info: (message: string) => toast.info(message, { duration: 3000 }),
}
```

规则：

- 位置默认右下角
- 瞬时操作结果用 Toast
- 不使用 `window.alert()`

## 6. 空状态规范

空状态必须可复用，不在每页手写零散占位。

```tsx
interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  description?: string
  action?: { label: string; onClick: () => void }
}
```

规则：

- 默认使用统一图标、统一间距
- 主文案简短明确
- 如有下一步动作，给出单一推荐动作

## 7. 加载与错误状态

| 场景 | 方案 |
| --- | --- |
| 列表加载 | `TableSkeleton` |
| 卡片内容加载 | `Skeleton` |
| 按钮提交中 | 按钮内 `Loader2` |
| 页面首次加载 | 居中 Spinner + 文字 |
| 页面级错误 | `ErrorState` + 重试 |

禁止：

- 整页长时间白屏
- 无反馈的禁用按钮
- 全屏遮罩冒充所有加载场景

## 8. 图标规范

图标库固定为 `lucide-react`。

尺寸规则：

| 场景 | 尺寸 |
| --- | --- |
| 导航图标 | `size-5` |
| 按钮内图标 | `size-4` |
| 空状态图标 | `size-12` |
| 行内图标 | `size-4` |

禁止：

- 混入第二套图标库
- 用 emoji 替代功能图标

## 9. 关联文档

- [system.md](./system.md)
- [layout.md](./layout.md)
- [interaction.md](./interaction.md)
- [charts.md](./charts.md)
