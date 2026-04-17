import { normalizeCommandError } from "@/lib/errors/normalize-command-error";

export function shouldRetryDesktopQuery(failureCount: number, error: unknown) {
  const appError = normalizeCommandError(error);

  if (appError.code === "not_ready") {
    return false;
  }

  return failureCount < 1;
}
