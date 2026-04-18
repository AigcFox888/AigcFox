import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3PlatformConfigDir = "apps/desktop-v3/src-tauri";
export const desktopV3SharedTauriConfigFile = `${desktopV3PlatformConfigDir}/tauri.conf.json`;
export const desktopV3AllowedTauriConfigFiles = Object.freeze([
  desktopV3SharedTauriConfigFile,
]);
export const desktopV3PlannedPlatformConfigFiles = Object.freeze([
  `${desktopV3PlatformConfigDir}/tauri.linux.conf.json`,
  `${desktopV3PlatformConfigDir}/tauri.windows.conf.json`,
  `${desktopV3PlatformConfigDir}/tauri.macos.conf.json`,
]);
export const desktopV3AllowedTauriTopLevelKeys = Object.freeze([
  "$schema",
  "app",
  "build",
  "bundle",
  "identifier",
  "productName",
  "version",
]);
export const desktopV3AllowedTauriBuildConfig = Object.freeze({
  beforeBuildCommand: "pnpm build",
  beforeDevCommand: "pnpm dev",
  devUrl: "http://127.0.0.1:31420/",
  frontendDist: "../dist",
});
export const desktopV3AllowedTauriAppConfigKeys = Object.freeze([
  "security",
  "windows",
]);
export const desktopV3AllowedTauriSecurityConfig = Object.freeze({
  csp: null,
});
export const desktopV3AllowedTauriWindowConfig = Object.freeze([
  {
    create: false,
    label: "main",
  },
]);
export const desktopV3AllowedTauriBundleConfig = Object.freeze({
  active: true,
  icon: [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico",
    "icons/icon.png",
  ],
});

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_RUN_ID?.trim();

  if (explicitRunId) {
    return explicitRunId;
  }

  return now.toISOString().replace(/[:.]/g, "-");
}

function normalizeWorkspaceRelativePath(workspaceRoot, absolutePath) {
  return path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, "/");
}

function sortStrings(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sortViolations(violations) {
  return [...violations].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    if (left.column !== right.column) {
      return left.column - right.column;
    }

    return left.kind.localeCompare(right.kind);
  });
}

function addViolation(violations, seen, violation) {
  const key = [
    violation.filePath,
    violation.line,
    violation.column,
    violation.kind,
    violation.detail,
  ].join(":");

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  violations.push(violation);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeRecord(record, keys) {
  return Object.fromEntries(keys.map((key) => [key, record[key]]));
}

function listSortedKeys(record) {
  if (!isRecord(record)) {
    return [];
  }

  return sortStrings(Object.keys(record));
}

function findJsonLineColumn(sourceText, pattern) {
  const lines = sourceText.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const column = lines[index].indexOf(pattern);

    if (column !== -1) {
      return {
        column: column + 1,
        line: index + 1,
      };
    }
  }

  return {
    column: 1,
    line: 1,
  };
}

function addJsonViolation(violations, seen, sourceText, filePath, pattern, kind, detail) {
  const location = findJsonLineColumn(sourceText, pattern);

  addViolation(violations, seen, {
    column: location.column,
    detail,
    filePath,
    kind,
    line: location.line,
  });
}

function normalizeTauriWindows(windows) {
  if (!Array.isArray(windows)) {
    return [];
  }

  return windows.map((windowConfig) => {
    if (!isRecord(windowConfig)) {
      return {
        create: undefined,
        label: undefined,
      };
    }

    return normalizeRecord(windowConfig, ["create", "label"]);
  });
}

export async function listDesktopV3TauriConfigFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const entries = await readdirImpl(config.platformConfigDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^tauri.*\.conf\.json$/u.test(entry.name))
    .map((entry) => path.join(config.platformConfigDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function collectDesktopV3PlatformConfigGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteConfigFilePaths = Array.isArray(options.configFilePaths)
    ? [...options.configFilePaths].sort((left, right) => left.localeCompare(right))
    : await listDesktopV3TauriConfigFiles(config, options);
  const seenViolations = new Set();
  const violations = [];
  const configFiles = absoluteConfigFilePaths.map((filePath) =>
    normalizeWorkspaceRelativePath(config.rootDir, filePath),
  );
  const allowedConfigFileSet = new Set(config.allowedConfigFiles);

  for (const filePath of configFiles) {
    if (allowedConfigFileSet.has(filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Tauri config file ${filePath} is outside the frozen Wave 1 shared config set (${config.allowedConfigFiles.join(", ")}). Rewrite the platform split plan before adding platform override files to the current branch.`,
      filePath,
      kind: "tauri-config-file-expansion",
      line: 1,
    });
  }

  for (const expectedFilePath of config.allowedConfigFiles) {
    if (configFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen Wave 1 shared Tauri config file ${expectedFilePath} is missing.`,
      filePath: expectedFilePath,
      kind: "tauri-config-file-missing",
      line: 1,
    });
  }

  const sharedConfigPath =
    absoluteConfigFilePaths.find(
      (filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath) === desktopV3SharedTauriConfigFile,
    ) ?? path.join(config.platformConfigDir, "tauri.conf.json");
  const sharedConfigSource = await readFileImpl(sharedConfigPath, "utf8");
  const sharedConfigFilePath = normalizeWorkspaceRelativePath(config.rootDir, sharedConfigPath);
  const tauriConfig = JSON.parse(sharedConfigSource);
  const topLevelKeys = listSortedKeys(tauriConfig);
  const buildConfig = isRecord(tauriConfig.build) ? tauriConfig.build : null;
  const appConfig = isRecord(tauriConfig.app) ? tauriConfig.app : null;
  const bundleConfig = isRecord(tauriConfig.bundle) ? tauriConfig.bundle : null;
  const buildKeys = listSortedKeys(buildConfig);
  const appKeys = listSortedKeys(appConfig);
  const bundleKeys = listSortedKeys(bundleConfig);
  const securityConfig = isRecord(appConfig?.security) ? appConfig.security : null;
  const securityKeys = listSortedKeys(securityConfig);
  const windows = Array.isArray(appConfig?.windows) ? appConfig.windows : [];
  const windowKeySets = windows.map((windowConfig) => listSortedKeys(windowConfig));
  const normalizedBuildConfig = buildConfig
    ? normalizeRecord(buildConfig, Object.keys(desktopV3AllowedTauriBuildConfig))
    : null;
  const normalizedSecurityConfig = securityConfig
    ? normalizeRecord(securityConfig, Object.keys(desktopV3AllowedTauriSecurityConfig))
    : null;
  const normalizedWindows = normalizeTauriWindows(windows);
  const normalizedBundleConfig = bundleConfig
    ? normalizeRecord(bundleConfig, Object.keys(desktopV3AllowedTauriBundleConfig))
    : null;
  const stringFields = {
    $schema: tauriConfig.$schema,
    identifier: tauriConfig.identifier,
    productName: tauriConfig.productName,
    version: tauriConfig.version,
  };

  if (JSON.stringify(topLevelKeys) !== JSON.stringify(desktopV3AllowedTauriTopLevelKeys)) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"build"',
      "tauri-config-top-level-key-drift",
      `Shared tauri.conf.json top-level keys drifted from the frozen Wave 1 set (${desktopV3AllowedTauriTopLevelKeys.join(", ")}).`,
    );
  }

  if (JSON.stringify(buildKeys) !== JSON.stringify(sortStrings(Object.keys(desktopV3AllowedTauriBuildConfig)))) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"build"',
      "tauri-config-build-key-drift",
      `Shared tauri.conf.json build keys drifted from the frozen Wave 1 set (${Object.keys(desktopV3AllowedTauriBuildConfig).join(", ")}).`,
    );
  }

  if (
    JSON.stringify(normalizedBuildConfig) !== JSON.stringify(desktopV3AllowedTauriBuildConfig)
  ) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"build"',
      "tauri-config-build-value-drift",
      "Shared tauri.conf.json build config drifted from the frozen Wave 1 shared dev/build boundary.",
    );
  }

  if (JSON.stringify(appKeys) !== JSON.stringify(desktopV3AllowedTauriAppConfigKeys)) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"app"',
      "tauri-config-app-key-drift",
      `Shared tauri.conf.json app keys drifted from the frozen Wave 1 set (${desktopV3AllowedTauriAppConfigKeys.join(", ")}).`,
    );
  }

  if (JSON.stringify(securityKeys) !== JSON.stringify(sortStrings(Object.keys(desktopV3AllowedTauriSecurityConfig)))) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"security"',
      "tauri-config-security-key-drift",
      `Shared tauri.conf.json security keys drifted from the frozen Wave 1 set (${Object.keys(desktopV3AllowedTauriSecurityConfig).join(", ")}).`,
    );
  }

  if (
    JSON.stringify(normalizedSecurityConfig) !== JSON.stringify(desktopV3AllowedTauriSecurityConfig)
  ) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"security"',
      "tauri-config-security-value-drift",
      "Shared tauri.conf.json security config drifted from the frozen Wave 1 shared boundary.",
    );
  }

  if (windows.length !== desktopV3AllowedTauriWindowConfig.length) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"windows"',
      "tauri-config-window-count-drift",
      `Shared tauri.conf.json windows set drifted from the frozen Wave 1 count (${desktopV3AllowedTauriWindowConfig.length}).`,
    );
  }

  for (const keySet of windowKeySets) {
    if (JSON.stringify(keySet) === JSON.stringify(["create", "label"])) {
      continue;
    }

    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"windows"',
      "tauri-config-window-key-drift",
      'Shared tauri.conf.json window entries drifted from the frozen Wave 1 key set ("create", "label").',
    );
    break;
  }

  if (
    JSON.stringify(normalizedWindows) !== JSON.stringify(desktopV3AllowedTauriWindowConfig)
  ) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"windows"',
      "tauri-config-window-value-drift",
      'Shared tauri.conf.json windows drifted from the frozen Wave 1 boundary (single "main" window with create=false).',
    );
  }

  if (JSON.stringify(bundleKeys) !== JSON.stringify(sortStrings(Object.keys(desktopV3AllowedTauriBundleConfig)))) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"bundle"',
      "tauri-config-bundle-key-drift",
      `Shared tauri.conf.json bundle keys drifted from the frozen Wave 1 set (${Object.keys(desktopV3AllowedTauriBundleConfig).join(", ")}).`,
    );
  }

  if (
    JSON.stringify(normalizedBundleConfig) !== JSON.stringify(desktopV3AllowedTauriBundleConfig)
  ) {
    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      '"bundle"',
      "tauri-config-bundle-value-drift",
      "Shared tauri.conf.json bundle config drifted from the frozen Wave 1 shared packaging boundary.",
    );
  }

  for (const [fieldName, fieldValue] of Object.entries(stringFields)) {
    if (typeof fieldValue === "string" && fieldValue.trim().length > 0) {
      continue;
    }

    addJsonViolation(
      violations,
      seenViolations,
      sharedConfigSource,
      sharedConfigFilePath,
      `"${fieldName}"`,
      "tauri-config-required-field-invalid",
      `Shared tauri.conf.json field ${fieldName} must stay a non-empty string.`,
    );
  }

  return {
    appKeys,
    buildConfig: normalizedBuildConfig,
    buildKeys,
    bundleConfig: normalizedBundleConfig,
    bundleKeys,
    configFiles,
    scannedFileCount: configFiles.length,
    scannedFiles: configFiles,
    securityConfig: normalizedSecurityConfig,
    securityKeys,
    stringFields,
    topLevelKeys,
    violations: sortViolations(violations),
    windowKeySets,
    windows: normalizedWindows,
  };
}

export function createDesktopV3PlatformConfigGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedBuildConfig: { ...desktopV3AllowedTauriBuildConfig },
      allowedConfigFiles: [...config.allowedConfigFiles],
      allowedTopLevelKeys: [...desktopV3AllowedTauriTopLevelKeys],
      allowedPlannedPlatformConfigFiles: [...desktopV3PlannedPlatformConfigFiles],
      checkedAt: null,
      error: null,
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      summaryPath: config.summaryPath,
      status: "running",
      appKeys: [],
      buildConfig: null,
      buildKeys: [],
      bundleConfig: null,
      bundleKeys: [],
      configFiles: [],
      securityConfig: null,
      securityKeys: [],
      stringFields: {},
      topLevelKeys: [],
      violationCount: 0,
      violations: [],
      windowKeySets: [],
      windows: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3PlatformConfigGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 platform config governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 platform config governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3PlatformConfigGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_PLATFORM_CONFIG_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-platform-config-governance-${runId}`);

  return {
    allowedConfigFiles: [...desktopV3AllowedTauriConfigFiles],
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-platform-config-governance-summary.json",
    ),
    outputDir,
    platformConfigDir: path.join(workspaceRoot, desktopV3PlatformConfigDir),
    rootDir: workspaceRoot,
    runId,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
