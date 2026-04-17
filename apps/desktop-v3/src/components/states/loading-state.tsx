import { LoaderCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingStateProps {
  description: string;
  title: string;
}

export function LoadingState({ description, title }: LoadingStateProps) {
  return (
    <Card className="mx-auto w-full max-w-[640px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <span>{description}</span>
      </CardContent>
    </Card>
  );
}
