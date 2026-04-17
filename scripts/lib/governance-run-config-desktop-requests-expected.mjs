import { readCliValue } from "./path-overrides.mjs";
import {
  normalizeOptionalValue,
  normalizePhase,
  readEnvValue,
} from "./governance-run-config-shared.mjs";

export function readDesktopGovernanceExpectedState(options, settings) {
  const { argv, env } = settings;

  return {
    smokeExpectedPhase:
      normalizePhase(options.smokeExpectedPhase) ||
      normalizePhase(readCliValue("smoke-expected-phase", argv)) ||
      normalizePhase(readEnvValue(env, ["AIGCFOX_DESKTOP_SMOKE_EXPECTED_PHASE"])),
    smokeExpectedDpiScale:
      normalizeOptionalValue(options.smokeExpectedDpiScale) ||
      normalizeOptionalValue(options.expectedDpiScale) ||
      normalizeOptionalValue(readCliValue("smoke-expected-dpi-scale", argv)) ||
      normalizeOptionalValue(readCliValue("expected-dpi-scale", argv)) ||
      normalizeOptionalValue(readEnvValue(env, ["AIGCFOX_DESKTOP_SMOKE_EXPECTED_DPI_SCALE"])),
  };
}
