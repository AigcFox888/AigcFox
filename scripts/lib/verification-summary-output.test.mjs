import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  persistVerificationSummary,
  resolveLatestVerificationSummaryPath,
} from "./verification-summary-output.mjs";

describe("verification summary output", () => {
  it("resolves latest verification summaries under output/verification/latest", () => {
    expect(resolveLatestVerificationSummaryPath("/repo", "desktop-v3-wave1-readiness-summary.json")).toBe(
      path.join("/repo", "output", "verification", "latest", "desktop-v3-wave1-readiness-summary.json"),
    );
  });

  it("writes archive and latest summaries once each", async () => {
    const writeJsonFileImpl = vi.fn(async () => {});
    const summary = { status: "passed" };

    await persistVerificationSummary(
      summary,
      {
        archiveSummaryPath: "/tmp/archive/summary.json",
        latestSummaryPath: "/tmp/latest/summary.json",
      },
      {
        writeJsonFileImpl,
      },
    );

    expect(writeJsonFileImpl).toHaveBeenCalledTimes(2);
    expect(writeJsonFileImpl).toHaveBeenNthCalledWith(1, "/tmp/archive/summary.json", summary);
    expect(writeJsonFileImpl).toHaveBeenNthCalledWith(2, "/tmp/latest/summary.json", summary);
  });

  it("deduplicates identical archive and latest targets", async () => {
    const writeJsonFileImpl = vi.fn(async () => {});
    const summary = { status: "passed" };

    await persistVerificationSummary(
      summary,
      {
        archiveSummaryPath: "/tmp/shared/summary.json",
        latestSummaryPath: "/tmp/shared/summary.json",
      },
      {
        writeJsonFileImpl,
      },
    );

    expect(writeJsonFileImpl).toHaveBeenCalledTimes(1);
    expect(writeJsonFileImpl).toHaveBeenCalledWith("/tmp/shared/summary.json", summary);
  });
});
