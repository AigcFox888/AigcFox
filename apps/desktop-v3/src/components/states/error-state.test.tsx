import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorState } from "@/components/states/error-state";
import { renderWithQueryClient } from "@/test/render-with-query-client";

describe("ErrorState", () => {
  it("renders structured support details when provided", () => {
    renderWithQueryClient(
      <ErrorState
        description="诊断链路未完全打通。"
        supportDetails={[
          { label: "Error Code", monospace: true, value: "not_ready" },
          { label: "Request ID", monospace: true, value: "req_diag_1" },
          { label: "Runtime Message", value: "backend warming up" },
        ]}
        title="诊断读取失败"
      />,
    );

    const supportBlock = screen.getByTestId("error-state-support");
    expect(within(supportBlock).getByText("not_ready")).toBeTruthy();
    expect(within(supportBlock).getByText("req_diag_1")).toBeTruthy();
    expect(within(supportBlock).getByText("backend warming up")).toBeTruthy();
  });
});
