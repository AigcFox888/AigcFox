import { describe, expect, it } from "vitest";

import { createVerificationArtifactRef, decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";

describe("createVerificationArtifactRef", () => {
  it("returns both absolute and workspace-relative paths for in-workspace artifacts", () => {
    expect(
      createVerificationArtifactRef("/workspace", "/workspace/output/verification/latest/summary.json"),
    ).toEqual({
      absolutePath: "/workspace/output/verification/latest/summary.json",
      workspaceRelativePath: "output/verification/latest/summary.json",
    });
  });

  it("returns a null workspace-relative path for artifacts outside the workspace root", () => {
    expect(
      createVerificationArtifactRef("/workspace", "/tmp/output/verification/latest/summary.json"),
    ).toEqual({
      absolutePath: "/tmp/output/verification/latest/summary.json",
      workspaceRelativePath: null,
    });
  });

  it("resolves workspace-relative inputs against the workspace root", () => {
    expect(
      createVerificationArtifactRef("/workspace", "output/verification/archive/summary.json"),
    ).toEqual({
      absolutePath: "/workspace/output/verification/archive/summary.json",
      workspaceRelativePath: "output/verification/archive/summary.json",
    });
  });

  it("decorates selected keys with sibling ref fields", () => {
    const target = decorateVerificationArtifactRefs(
      {
        latestSummaryPath: "/workspace/output/verification/latest/summary.json",
        summaryPath: null,
      },
      "/workspace",
      ["latestSummaryPath", "summaryPath"],
    );

    expect(target).toEqual({
      latestSummaryPath: "/workspace/output/verification/latest/summary.json",
      latestSummaryPathRef: {
        absolutePath: "/workspace/output/verification/latest/summary.json",
        workspaceRelativePath: "output/verification/latest/summary.json",
      },
      summaryPath: null,
      summaryPathRef: null,
    });
  });
});
