import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ErrorSupportDetail } from "@/lib/errors/error-support-details";

interface ErrorStateProps {
  description: string;
  onRetry?: () => void;
  supportDetails?: ErrorSupportDetail[];
  title: string;
}

export function ErrorState({ description, onRetry, supportDetails, title }: ErrorStateProps) {
  return (
    <Card className="mx-auto w-full max-w-[640px] border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        {supportDetails && supportDetails.length > 0 ? (
          <div
            className="grid gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-3"
            data-testid="error-state-support"
          >
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              排障信息
            </div>
            {supportDetails.map((detail) => (
              <div
                key={detail.label}
                className="flex items-start justify-between gap-4 text-sm"
                data-support-label={detail.label}
              >
                <span className="text-muted-foreground">{detail.label}</span>
                <span className={detail.monospace ? "font-mono text-foreground" : "text-foreground"}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {onRetry ? (
          <Button onClick={onRetry} variant="outline">
            重试
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
