import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockCommandRuntime } from "@/lib/runtime/mock-command-runtime";
import {
  getDesktopRuntime,
  resetDesktopRuntimeForTest,
} from "@/lib/runtime/runtime-registry";
import { TauriCommandRuntime } from "@/lib/runtime/tauri-command-runtime";
import * as runtimeModeModule from "@/lib/runtime/runtime-mode";

describe("runtime-registry", () => {
  beforeEach(() => {
    resetDesktopRuntimeForTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDesktopRuntimeForTest();
  });

  it("returns the mock runtime when the resolved mode is mock", () => {
    vi.spyOn(runtimeModeModule, "resolveDesktopRuntimeMode").mockReturnValue("mock");

    expect(getDesktopRuntime()).toBeInstanceOf(MockCommandRuntime);
  });

  it("returns the tauri runtime when the resolved mode is tauri", () => {
    vi.spyOn(runtimeModeModule, "resolveDesktopRuntimeMode").mockReturnValue("tauri");

    expect(getDesktopRuntime()).toBeInstanceOf(TauriCommandRuntime);
  });
});
