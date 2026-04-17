export interface AppErrorShape {
  code: string;
  details?: Record<string, unknown>;
  message: string;
  requestId?: string;
}

export class AppError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor({ code, details, message, requestId }: AppErrorShape) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "AppError";
    this.requestId = requestId;
  }
}
