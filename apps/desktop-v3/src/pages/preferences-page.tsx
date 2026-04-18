import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Palette, ShieldCheck, Workflow } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemePreference, setThemePreference } from "@/features/preferences/preferences-api";
import { useThemePreferenceStore } from "@/features/preferences/preferences-store";
import type { ThemeMode } from "@/features/preferences/preferences-types";
import { buildErrorSupportDetails } from "@/lib/errors/error-support-details";
import { notify } from "@/lib/notify";
import { typography } from "@/lib/typography";

const themeOptions: Array<{ description: string; label: string; value: ThemeMode }> = [
  {
    value: "system",
    label: "跟随系统",
    description: "默认模式，优先根据宿主主题切换。",
  },
  {
    value: "light",
    label: "浅色模式",
    description: "适合明亮环境和表格密集阅读。",
  },
  {
    value: "dark",
    label: "深色模式",
    description: "适合低光环境和长时间观察仪表盘。",
  },
];

export function PreferencesPage() {
  const queryClient = useQueryClient();
  const appliedThemeMode = useThemePreferenceStore((state) => state.themeMode);

  const preferenceQuery = useQuery({
    queryKey: ["preferences", "theme-mode"],
    queryFn: getThemePreference,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const updateThemeMutation = useMutation({
    mutationFn: setThemePreference,
    onSuccess: (preference) => {
      queryClient.setQueryData(["preferences", "theme-mode"], preference);
      notify.success("主题偏好已写入本地 SQLite。");
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "写入主题偏好失败。");
    },
  });
  const selectedThemeMode = preferenceQuery.data?.mode ?? null;

  if (preferenceQuery.isLoading) {
    return <LoadingState description="正在读取本地主题偏好。" title="加载本地偏好" />;
  }

  if (preferenceQuery.error) {
    return (
      <ErrorState
        description="本地偏好链路未就绪。请先启动 Tauri runtime，确认 SQLite baseline 已完成初始化。"
        onRetry={() => {
          void preferenceQuery.refetch();
        }}
        supportDetails={buildErrorSupportDetails(preferenceQuery.error)}
        title="读取偏好失败"
      />
    );
  }

  if (!preferenceQuery.data) {
    return (
      <EmptyState
        description="本地偏好尚未初始化。启动 Tauri runtime 后会自动建立 `user_preferences` baseline。"
        message="偏好尚未就绪"
      />
    );
  }

  return (
    <div className="grid gap-6" data-testid="desktop-v3-preferences-page">
      <Card>
        <CardHeader>
          <CardTitle className={typography.sectionTitle}>主题偏好</CardTitle>
          <CardDescription>
            当前偏好通过 `desktop_set_theme_preference` 写入本地 SQLite，renderer 不直接接触数据库。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {themeOptions.map((option) => (
            <div
              key={option.value}
              className="rounded-lg border bg-background px-4 py-4 text-left transition-colors hover:border-primary/40"
              data-testid={`desktop-v3-theme-option-${option.value}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1 text-sm font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                <Button
                  data-theme-applied={appliedThemeMode === option.value ? "true" : "false"}
                  data-testid={`desktop-v3-theme-apply-${option.value}`}
                  disabled={updateThemeMutation.isPending}
                  onClick={() => {
                    updateThemeMutation.mutate(option.value);
                  }}
                  variant={selectedThemeMode === option.value ? "default" : "outline"}
                >
                  {selectedThemeMode === option.value ? "当前模式" : "应用"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 min-[1366px]:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className={typography.cardTitle}>
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                设计系统
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            renderer 统一使用 `shadcn/ui + Radix + Tailwind CSS 4`，不混入第二套主组件体系。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className={typography.cardTitle}>
              <div className="flex items-center gap-2">
                <Workflow className="size-4 text-primary" />
                命令链
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Theme 读写走 `React → Tauri command → Rust localdb → SQLite`，不绕过 runtime。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className={typography.cardTitle}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                安全边界
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Token、密钥和敏感凭据不进入本地 SQLite，这类值后续只允许进入 secure store。
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
