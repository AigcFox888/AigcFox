import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { shouldRetryDesktopQuery } from "@/lib/query/query-retry-policy";

describe("shouldRetryDesktopQuery", () => {
  it("does not retry not_ready app errors", () => {
    const shouldRetry = shouldRetryDesktopQuery(
      0,
      new AppError({
        code: "not_ready",
        message: "backend warming up",
        requestId: "req_not_ready",
      }),
    );

    expect(shouldRetry).toBe(false);
  });

  it("does not retry stringified not_ready command payloads", () => {
    const shouldRetry = shouldRetryDesktopQuery(
      0,
      "{\"code\":\"not_ready\",\"message\":\"backend warming up\",\"requestId\":\"req_not_ready_json\"}",
    );

    expect(shouldRetry).toBe(false);
  });

  it("retries one time for non-not-ready failures", () => {
    expect(
      shouldRetryDesktopQuery(
        0,
        new Error("{\"code\":\"internal_error\",\"message\":\"probe failed\",\"requestId\":\"req_retry_1\"}"),
      ),
    ).toBe(true);

    expect(
      shouldRetryDesktopQuery(
        1,
        new Error("{\"code\":\"internal_error\",\"message\":\"probe failed\",\"requestId\":\"req_retry_1\"}"),
      ),
    ).toBe(false);
  });
});
