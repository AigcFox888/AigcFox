import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

import { normalizeVitestTempEnv } from "../../scripts/lib/vitest-temp-env";

normalizeVitestTempEnv();

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"]
  }
});
