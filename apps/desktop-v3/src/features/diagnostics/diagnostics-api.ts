import type { DiagnosticsOverview } from "@/features/diagnostics/diagnostics-types";
import { getDesktopRuntime } from "@/lib/runtime/runtime-registry";

export function getBackendLiveness() {
  return getDesktopRuntime().getBackendLiveness();
}

export function getBackendReadiness() {
  return getDesktopRuntime().getBackendReadiness();
}

export function getDiagnosticsSnapshot() {
  return getDesktopRuntime().getDiagnosticsSnapshot();
}

export async function getDiagnosticsOverview(): Promise<DiagnosticsOverview> {
  const [liveness, readiness] = await Promise.all([
    getBackendLiveness(),
    getBackendReadiness(),
  ]);
  const local = await getDiagnosticsSnapshot();

  return {
    liveness,
    local,
    readiness,
  };
}
