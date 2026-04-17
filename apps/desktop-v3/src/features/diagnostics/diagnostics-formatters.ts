import type { SecureStoreSnapshot } from "@/lib/runtime/contracts";

export function formatSecureStoreSummary(secureStore: SecureStoreSnapshot): string {
  const writeCapability = secureStore.writesEnabled ? "enabled" : "disabled";
  return `${secureStore.status} / ${secureStore.provider} / ${writeCapability}`;
}
