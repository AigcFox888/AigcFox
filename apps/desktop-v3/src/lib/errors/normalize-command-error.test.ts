import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { normalizeCommandError } from "@/lib/errors/normalize-command-error";

describe("normalizeCommandError", () => {
  it("returns app errors unchanged", () => {
    const originalError = new AppError({
      code: "not_ready",
      message: "backend warming up",
      requestId: "req_passthrough",
    });

    const error = normalizeCommandError(originalError);

    expect(error).toBe(originalError);
  });

  it("normalizes object payloads", () => {
    const error = normalizeCommandError({
      code: "invalid_request",
      message: "参数错误",
      requestId: "req_1",
    });

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("invalid_request");
    expect(error.requestId).toBe("req_1");
  });

  it("parses json strings from command errors", () => {
    const error = normalizeCommandError(
      "{\"code\":\"not_ready\",\"message\":\"backend not ready\",\"requestId\":\"req_2\"}",
    );

    expect(error.code).toBe("not_ready");
    expect(error.message).toBe("backend not ready");
  });

  it("parses json payloads wrapped in Error.message", () => {
    const error = normalizeCommandError(
      new Error("{\"code\":\"internal_error\",\"message\":\"probe failed\",\"requestId\":\"req_3\"}"),
    );

    expect(error.code).toBe("internal_error");
    expect(error.requestId).toBe("req_3");
    expect(error.message).toBe("probe failed");
  });
});
