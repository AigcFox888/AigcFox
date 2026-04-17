import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  message: string;
}

export function EmptyState({ action, description, message }: EmptyStateProps) {
  return (
    <Card className="mx-auto w-full max-w-[640px]">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="text-base font-medium">{message}</div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
