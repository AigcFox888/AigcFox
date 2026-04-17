import { AppError } from "@/lib/errors/app-error";

interface CommandErrorPayload {
  code?: string;
  details?: Record<string, unknown>;
  message?: string;
  requestId?: string;
}

function fromPayload(payload: CommandErrorPayload) {
  return new AppError({
    code: payload.code ?? "internal_error",
    details: payload.details,
    message: payload.message ?? "未知运行时错误。",
    requestId: payload.requestId,
  });
}

export function normalizeCommandError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    try {
      return fromPayload(JSON.parse(error.message) as CommandErrorPayload);
    } catch {
      return fromPayload({ code: "internal_error", message: error.message });
    }
  }

  if (typeof error === "string") {
    try {
      return fromPayload(JSON.parse(error) as CommandErrorPayload);
    } catch {
      return fromPayload({ code: "internal_error", message: error });
    }
  }

  if (typeof error === "object" && error !== null) {
    return fromPayload(error as CommandErrorPayload);
  }

  return fromPayload({ code: "internal_error", message: "未知运行时错误。" });
}
