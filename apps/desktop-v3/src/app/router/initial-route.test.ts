import { describe, expect, it } from "vitest";

import { resolveDesktopV3InitialRoute } from "@/app/router/initial-route";

describe("resolveDesktopV3InitialRoute", () => {
  it("falls back to the dashboard route when the env override is empty", () => {
    expect(resolveDesktopV3InitialRoute("")).toBe("/");
    expect(resolveDesktopV3InitialRoute(undefined)).toBe("/");
  });

  it("normalizes route values without a leading slash", () => {
    expect(resolveDesktopV3InitialRoute("diagnostics")).toBe("/diagnostics");
    expect(resolveDesktopV3InitialRoute("preferences")).toBe("/preferences");
  });

  it("fails closed for unsupported routes", () => {
    expect(resolveDesktopV3InitialRoute("/operator")).toBe("/");
    expect(resolveDesktopV3InitialRoute("/diagnostics/extra")).toBe("/");
  });
});
