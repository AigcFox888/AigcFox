import { Link } from "react-router-dom";
import { ArrowRight, LayoutGrid, ShieldCheck, Workflow } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { typography } from "@/lib/typography";

const highlights = [
  {
    icon: LayoutGrid,
    title: "布局骨架",
    description: "固定一套 App Shell / Route Shell / Layout Shell，不再把页面壳层重复堆叠。",
  },
  {
    icon: Workflow,
    title: "命令边界",
    description: "Renderer 只通过受控 command 进入 Rust，不把裸 invoke 散落到页面里。",
  },
  {
    icon: ShieldCheck,
    title: "安全边界",
    description: "SQLite、诊断与敏感能力全部留在 Rust runtime，React 只消费结果。",
  },
];

const quickLinks = [
  {
    href: "/diagnostics",
    label: "查看运行诊断",
    description: "验证本地 runtime、SQLite baseline 与远端健康探针。",
  },
  {
    href: "/preferences",
    label: "查看本地偏好",
    description: "验证 user_preferences 的最小本地链路与主题切换。",
  },
];

export function DashboardPage() {
  return (
    <div className="grid gap-6" data-testid="desktop-v3-dashboard-page">
      <Card>
        <CardHeader>
          <CardTitle className={typography.sectionTitle}>当前执行边界</CardTitle>
          <CardDescription>
            这轮只做 `desktop-v3 Wave 1 Skeleton`。业务页、商业化、自动更新和执行引擎都不在当前代码范围内。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 min-[1366px]:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-lg border bg-background px-4 py-4">
              <item.icon className="mb-3 size-5 text-primary" />
              <div className="mb-2 text-sm font-medium">{item.title}</div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 min-[1366px]:grid-cols-2">
        {quickLinks.map((item) => (
          <Card key={item.href} className="transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className={typography.cardTitle}>{item.label}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" to={item.href}>
                进入页面
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
