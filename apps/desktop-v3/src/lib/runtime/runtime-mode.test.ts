import { describe, expect, it } from "vitest";

import {
  normalizeDesktopRuntimeMode,
  resolveDesktopRuntimeMode,
} from "@/lib/runtime/runtime-mode";

describe("normalizeDesktopRuntimeMode", () => {
  it("accepts explicit mock and tauri modes", () => {
    expect(normalizeDesktopRuntimeMode("mock")).toBe("mock");
    expect(normalizeDesktopRuntimeMode("tauri")).toBe("tauri");
  });

  it("treats auto, blank, and unsupported values as unresolved", () => {
    expect(normalizeDesktopRuntimeMode("auto")).toBeNull();
    expect(normalizeDesktopRuntimeMode("")).toBeNull();
    expect(normalizeDesktopRuntimeMode("browser")).toBeNull();
  });
});

describe("resolveDesktopRuntimeMode", () => {
  it("fails closed to tauri outside tests when no explicit mode is provided", () => {
    expect(
      resolveDesktopRuntimeMode({
        rawMode: "browser",
        isTestEnvironment: false,
      }),
    ).toBe("tauri");
    expect(
      resolveDesktopRuntimeMode({
        rawMode: "",
        isTestEnvironment: false,
      }),
    ).toBe("tauri");
  });

  it("falls back to mock in test mode when no explicit mode is provided", () => {
    expect(
      resolveDesktopRuntimeMode({
        rawMode: undefined,
        isTestEnvironment: true,
      }),
    ).toBe("mock");
  });
});
