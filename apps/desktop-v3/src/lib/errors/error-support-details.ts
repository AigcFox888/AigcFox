import { normalizeCommandError } from "@/lib/errors/normalize-command-error";

export interface ErrorSupportDetail {
  label: string;
  monospace?: boolean;
  value: string;
}

const GENERIC_ERROR_MESSAGE = "未知运行时错误。";

export function buildErrorSupportDetails(error: unknown): ErrorSupportDetail[] {
  const appError = normalizeCommandError(error);
  const supportDetails: ErrorSupportDetail[] = [
    {
      label: "Error Code",
      monospace: true,
      value: appError.code,
    },
  ];

  if (appError.requestId) {
    supportDetails.push({
      label: "Request ID",
      monospace: true,
      value: appError.requestId,
    });
  }

  if (appError.message && appError.message !== GENERIC_ERROR_MESSAGE) {
    supportDetails.push({
      label: "Runtime Message",
      value: appError.message,
    });
  }

  return supportDetails;
}
