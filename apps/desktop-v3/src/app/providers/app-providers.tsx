import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { queryClient } from "@/lib/query/query-client";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={120}>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster closeButton richColors position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
