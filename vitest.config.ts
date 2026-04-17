import { defineConfig } from "vitest/config";

import { normalizeVitestTempEnv } from "./scripts/lib/vitest-temp-env";

normalizeVitestTempEnv();

export default defineConfig({
  test: {
    environment: "node",
  },
});
