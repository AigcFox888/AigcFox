import type { BackendProbe, DiagnosticsSnapshot } from "@/lib/runtime/contracts";

export interface DiagnosticsOverview {
  liveness: BackendProbe;
  local: DiagnosticsSnapshot;
  readiness: BackendProbe;
}
