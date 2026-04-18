import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";

import { getDiagnosticsOverview } from "@/features/diagnostics/diagnostics-api";
import { formatSecureStoreSummary } from "@/features/diagnostics/diagnostics-formatters";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildErrorSupportDetails } from "@/lib/errors/error-support-details";
import { typography } from "@/lib/typography";

const diagnosticsOverviewQueryKey = ["diagnostics", "overview"] as const;

function DiagnosticsCard({
  "data-testid": dataTestId,
  description,
  rows,
  title,
}: {
  "data-testid"?: string;
  description: string;
  rows: Array<{ label: string; value: string }>;
  title: string;
}) {
  return (
    <Card data-testid={dataTestId}>
      <CardHeader>
        <CardTitle className={typography.cardTitle}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
            data-row-label={row.label}
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="font-mono text-sm text-foreground">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const diagnosticsOverviewQuery = useQuery({
    queryKey: diagnosticsOverviewQueryKey,
    queryFn: getDiagnosticsOverview,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const refetchAll = async () => {
    await queryClient.invalidateQueries({ queryKey: diagnosticsOverviewQueryKey });
  };

  useEffect(() => {
    const handleRefresh = () => {
      void refetchAll();
    };

    window.addEventListener("desktop-v3:refresh-requested", handleRefresh);
    return () => {
      window.removeEventListener("desktop-v3:refresh-requested", handleRefresh);
    };
  }, [queryClient]);

  if (diagnosticsOverviewQuery.isLoading) {
    return <LoadingState description="正在读取本地 runtime 与远端健康快照。" title="加载诊断信息" />;
  }

  if (diagnosticsOverviewQuery.error) {
    return (
      <ErrorState
        description="诊断链路未完全打通。你可以先检查本地 Tauri runtime 与 backend health 接口是否已启动。"
        onRetry={() => {
          void refetchAll();
        }}
        supportDetails={buildErrorSupportDetails(diagnosticsOverviewQuery.error)}
        title="诊断读取失败"
      />
    );
  }

  if (!diagnosticsOverviewQuery.data) {
    return (
      <ErrorState
        description="诊断命令返回了空结果。请重新触发一次刷新；如果仍为空，说明 runtime 契约已经漂移。"
        onRetry={() => {
          void refetchAll();
        }}
        title="诊断结果异常"
      />
    );
  }

  const diagnosticsOverview = diagnosticsOverviewQuery.data;
  const diagnostics = diagnosticsOverview.local;
  const liveness = diagnosticsOverview.liveness;
  const readiness = diagnosticsOverview.readiness;

  return (
    <div className="grid gap-6" data-testid="desktop-v3-diagnostics-page">
      <div className="flex items-center justify-end">
        <Button
          className="gap-2"
          onClick={() => {
            void refetchAll();
          }}
          variant="outline"
        >
          <RefreshCcw className="size-4" />
          刷新诊断
        </Button>
      </div>

      <div className="grid gap-4 min-[1366px]:grid-cols-2 min-[1920px]:grid-cols-3">
        <DiagnosticsCard
          description="本地 runtime 的基线信息与 SQLite 状态。"
          rows={[
            { label: "App Version", value: diagnostics.appVersion },
            { label: "Platform", value: diagnostics.platform },
            { label: "Database", value: diagnostics.databaseStatus },
            { label: "Theme Mode", value: diagnostics.themeMode },
            { label: "Secure Store", value: formatSecureStoreSummary(diagnostics.secureStore) },
            { label: "Sync Cache", value: String(diagnostics.syncCacheEntryCount) },
            { label: "Dirty Cache", value: String(diagnostics.dirtySyncCacheEntryCount) },
            { label: "Last Probe", value: diagnostics.lastBackendProbeAt ?? "-" },
          ]}
          title="本地 Runtime"
          data-testid="desktop-v3-diagnostics-local"
        />
        <DiagnosticsCard
          description="React → Tauri command → Rust → Go `/api/v1/healthz`。"
          rows={[
            { label: "Service", value: liveness.service },
            { label: "Status", value: liveness.status },
            { label: "Checked At", value: liveness.checkedAt },
            { label: "Request ID", value: liveness.requestId ?? "-" },
          ]}
          title="Backend Liveness"
          data-testid="desktop-v3-diagnostics-liveness"
        />
        <DiagnosticsCard
          description="React → Tauri command → Rust → Go `/readyz`。"
          rows={[
            { label: "Service", value: readiness.service },
            { label: "Status", value: readiness.status },
            { label: "Checked At", value: readiness.checkedAt },
            { label: "Request ID", value: readiness.requestId ?? "-" },
          ]}
          title="Backend Readiness"
          data-testid="desktop-v3-diagnostics-readiness"
        />
      </div>
    </div>
  );
}
