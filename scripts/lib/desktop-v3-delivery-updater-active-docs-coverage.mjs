import { desktopV3DeliveryUpdaterDocumentFiles } from "./desktop-v3-delivery-updater-docs-config.mjs";
import { collectExplicitDocCoverage } from "./explicit-doc-coverage.mjs";

export const desktopV3DeliveryUpdaterActiveDocCoverageTargets = desktopV3DeliveryUpdaterDocumentFiles;

export function collectDesktopV3DeliveryUpdaterActiveDocCoverage(rootDir, options = {}) {
  return collectExplicitDocCoverage(rootDir, desktopV3DeliveryUpdaterActiveDocCoverageTargets, options);
}
