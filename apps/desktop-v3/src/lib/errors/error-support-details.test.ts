import { describe, expect, it } from "vitest";

import { buildErrorSupportDetails } from "@/lib/errors/error-support-details";

describe("buildErrorSupportDetails", () => {
  it("preserves code, request id, and runtime message from structured errors", () => {
    const supportDetails = buildErrorSupportDetails({
      code: "not_ready",
      message: "backend warming up",
      requestId: "req_diag_1",
    });

    expect(supportDetails).toEqual([
      { label: "Error Code", monospace: true, value: "not_ready" },
      { label: "Request ID", monospace: true, value: "req_diag_1" },
      { label: "Runtime Message", value: "backend warming up" },
    ]);
  });

  it("omits generic runtime message noise", () => {
    const supportDetails = buildErrorSupportDetails(new Error("未知运行时错误。"));

    expect(supportDetails).toEqual([{ label: "Error Code", monospace: true, value: "internal_error" }]);
  });
});
