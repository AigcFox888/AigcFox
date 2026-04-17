import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..", "..");
export const desktopV3UpdaterGovernanceSourceRoots = Object.freeze([
  "apps/desktop-v3/src",
  "apps/desktop-v3/src-tauri/src",
  "apps/desktop-v3/src-tauri/capabilities",
  "apps/desktop-v3/src-tauri/permissions",
]);
export const desktopV3UpdaterGovernanceRequiredFiles = Object.freeze([
  "apps/desktop-v3/src-tauri/Cargo.toml",
  "apps/desktop-v3/src-tauri/tauri.conf.json",
]);
export const desktopV3UpdaterGovernanceForbiddenFileNameRuleIds = Object.freeze([
  "updater-file-name-drift",
  "update-guard-file-name-drift",
]);
export const desktopV3UpdaterGovernanceForbiddenContentRuleIds = Object.freeze([
  "updater-plugin-cargo-dependency",
  "updater-plugin-js-import",
  "updater-plugin-rust-import",
  "updater-plugin-config",
  "updater-artifact-config",
  "update-manifest-endpoint",
  "update-policy-endpoint",
  "update-policy-min-supported-version",
  "update-policy-required-on-startup",
  "update-policy-next-launch-flag",
  "github-releases-update-source",
]);

const desktopV3UpdaterGovernanceForbiddenFileNameRules = Object.freeze([
  {
    detail:
      "desktop-v3 当前仍冻结在 updater 未实现边界。不要提前创建 updater 命名文件；先完成 updater runtime / capability / config 的结构化重写，再放开治理门禁。",
    kind: "updater-file-name-drift",
    pattern: /updater/iu,
  },
  {
    detail:
      "desktop-v3 当前不允许提前落地 Update Guard shell 文件。先按交付文档重写 updater 进入边界，再引入更新守卫壳层。",
    kind: "update-guard-file-name-drift",
    pattern: /update-guard/iu,
  },
]);

const desktopV3UpdaterGovernanceForbiddenContentRules = Object.freeze([
  {
    appliesTo: (filePath) => filePath.endsWith("Cargo.toml"),
    detail:
      "Cargo.toml 还不允许引入 tauri updater plugin。当前分支只能保持 updater 未实现边界；真正接入前必须先完成 updater runtime / capability / config 的结构化重写。",
    kind: "updater-plugin-cargo-dependency",
    pattern: /\btauri-plugin-updater\b/u,
  },
  {
    detail:
      "renderer / runtime 当前还不允许 import @tauri-apps/plugin-updater。先重写 updater 边界，再统一接入官方插件。",
    kind: "updater-plugin-js-import",
    pattern: /@tauri-apps\/plugin-updater/u,
  },
  {
    detail:
      "Rust 侧当前还不允许接入 tauri_plugin_updater。先完成 updater 边界设计与治理重写，再统一落实现。",
    kind: "updater-plugin-rust-import",
    pattern: /\btauri_plugin_updater\b/u,
  },
  {
    appliesTo: (filePath) => filePath.endsWith("tauri.conf.json"),
    detail:
      "共享 tauri.conf.json 当前不允许提前落 updater plugin 配置。updater 进入实现前，必须先重写配置分层与 capability 边界。",
    kind: "updater-plugin-config",
    pattern: /\bplugins\s*\.\s*updater\b|"updater"\s*:/u,
  },
  {
    appliesTo: (filePath) => filePath.endsWith("tauri.conf.json"),
    detail:
      "共享 tauri.conf.json 当前不允许提前打开 updater artifact 配置。先完成交付链与 updater 结构化重写，再引入更新产物配置。",
    kind: "updater-artifact-config",
    pattern: /\bcreateUpdaterArtifacts\b/u,
  },
  {
    detail:
      "desktop-v3 当前还不允许在代码里硬接 updater manifest 端点。真正接入时必须通过受控 updater runtime 重写，而不是零散补丁。",
    kind: "update-manifest-endpoint",
    pattern: /\blatest\.json\b/u,
  },
  {
    detail:
      "desktop-v3 当前还不允许在代码里硬接 update policy 端点。先完成 Rust update runtime 结构化重写，再引入 policy 拉取。",
    kind: "update-policy-endpoint",
    pattern: /\bpolicy\.json\b/u,
  },
  {
    detail:
      "desktop-v3 当前还不允许在代码里提前实现 minSupportedVersion 策略字段。先完成 updater runtime / guard 的结构化重写。",
    kind: "update-policy-min-supported-version",
    pattern: /\bminSupportedVersion\b/u,
  },
  {
    detail:
      "desktop-v3 当前还不允许在代码里提前实现 required_on_startup 强更策略。先完成 updater 进入边界重写，再落策略判断。",
    kind: "update-policy-required-on-startup",
    pattern: /\brequired_on_startup\b/u,
  },
  {
    detail:
      "desktop-v3 当前还不允许在代码里提前实现 must_update_on_next_launch 状态。先完成 updater runtime / guard 重写，再落会话内规则。",
    kind: "update-policy-next-launch-flag",
    pattern: /\bmust_update_on_next_launch\b/u,
  },
  {
    detail:
      "desktop-v3 当前不允许把 GitHub Releases URL 硬编码成客户端更新源。正式更新入口只能在结构化重写后落到自有 HTTPS 源。",
    kind: "github-releases-update-source",
    pattern: /https:\/\/github\.com\/[^\s"'`]+\/[^\s"'`]+\/releases(?:\/download)?/u,
  },
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_RUN_ID?.trim();

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

function findPatternLocation(sourceText, pattern) {
  const lines = sourceText.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(pattern);

    if (match?.index !== undefined) {
      return {
        column: match.index + 1,
        line: index + 1,
      };
    }
  }

  return {
    column: 1,
    line: 1,
  };
}

async function statIfExists(targetPath, statImpl) {
  try {
    return await statImpl(targetPath);
  } catch {
    return null;
  }
}

async function collectFilesRecursively(directoryPath, readdirImpl, statImpl) {
  const collected = [];
  const directoryStats = await statIfExists(directoryPath, statImpl);

  if (!directoryStats?.isDirectory()) {
    return collected;
  }

  async function walk(currentPath) {
    const entries = await readdirImpl(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        collected.push(absolutePath);
      }
    }
  }

  await walk(directoryPath);

  return collected.sort((left, right) => left.localeCompare(right));
}

export async function listDesktopV3UpdaterGovernanceFiles(config, options = {}) {
  const readdirImpl = options.readdirImpl ?? fs.readdir;
  const statImpl = options.statImpl ?? fs.stat;
  const absoluteFiles = [];

  for (const filePath of config.requiredFilePaths) {
    const stats = await statIfExists(filePath, statImpl);

    if (stats?.isFile()) {
      absoluteFiles.push(filePath);
    }
  }

  for (const directoryPath of config.sourceRootPaths) {
    absoluteFiles.push(...(await collectFilesRecursively(directoryPath, readdirImpl, statImpl)));
  }

  return sortStrings(new Set(absoluteFiles));
}

export async function collectDesktopV3UpdaterGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const absoluteFilePaths = Array.isArray(options.scanFilePaths)
    ? [...options.scanFilePaths].sort((left, right) => left.localeCompare(right))
    : await listDesktopV3UpdaterGovernanceFiles(config, options);
  const seenViolations = new Set();
  const violations = [];
  const scannedFiles = sortStrings(
    absoluteFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath)),
  );
  const scannedFileSet = new Set(scannedFiles);
  const triggeredContentRuleKinds = new Set();
  const triggeredFileNameRuleKinds = new Set();

  for (const requiredFile of config.requiredFiles) {
    if (scannedFileSet.has(requiredFile)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `Frozen updater governance file ${requiredFile} is missing.`,
      filePath: requiredFile,
      kind: "updater-governance-required-file-missing",
      line: 1,
    });
  }

  for (const absoluteFilePath of absoluteFilePaths) {
    const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);
    const baseName = path.basename(absoluteFilePath);
    const sourceText = await readFileImpl(absoluteFilePath, "utf8");

    for (const rule of desktopV3UpdaterGovernanceForbiddenFileNameRules) {
      if (!rule.pattern.test(baseName)) {
        continue;
      }

      triggeredFileNameRuleKinds.add(rule.kind);
      addViolation(violations, seenViolations, {
        column: 1,
        detail: rule.detail,
        filePath,
        kind: rule.kind,
        line: 1,
      });
    }

    for (const rule of desktopV3UpdaterGovernanceForbiddenContentRules) {
      if (typeof rule.appliesTo === "function" && !rule.appliesTo(filePath)) {
        continue;
      }

      if (!rule.pattern.test(sourceText)) {
        continue;
      }

      triggeredContentRuleKinds.add(rule.kind);
      const location = findPatternLocation(sourceText, rule.pattern);

      addViolation(violations, seenViolations, {
        column: location.column,
        detail: rule.detail,
        filePath,
        kind: rule.kind,
        line: location.line,
      });
    }
  }

  return {
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    triggeredContentRuleKinds: sortStrings(triggeredContentRuleKinds),
    triggeredFileNameRuleKinds: sortStrings(triggeredFileNameRuleKinds),
    violationCount: violations.length,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3UpdaterGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      checkedAt: null,
      error: null,
      forbiddenContentRuleIds: [...desktopV3UpdaterGovernanceForbiddenContentRuleIds],
      forbiddenFileNameRuleIds: [...desktopV3UpdaterGovernanceForbiddenFileNameRuleIds],
      latestSummaryPath: config.latestSummaryPath,
      outputDir: config.outputDir,
      requiredFiles: [...config.requiredFiles],
      rootDir: config.rootDir,
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      sourceRoots: [...config.sourceRoots],
      status: "running",
      summaryPath: config.summaryPath,
      triggeredContentRuleKinds: [],
      triggeredFileNameRuleKinds: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3UpdaterGovernanceFailureMessage(summary) {
  if (summary.violationCount === 0) {
    return `desktop-v3 updater governance check failed. Summary: ${summary.summaryPath}`;
  }

  const preview = summary.violations.slice(0, 10).map((violation) => {
    return `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`;
  });
  const hiddenCount = summary.violationCount - preview.length;
  const extraLine = hiddenCount > 0 ? [`- ... ${hiddenCount} more violation(s)`] : [];

  return [
    `desktop-v3 updater governance check failed with ${summary.violationCount} violation(s).`,
    ...preview,
    ...extraLine,
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3UpdaterGovernanceConfig(options = {}) {
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const workspaceRoot = options.rootDir ?? rootDir;
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_UPDATER_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-updater-governance-${runId}`);
  const requiredFiles = [...desktopV3UpdaterGovernanceRequiredFiles];
  const sourceRoots = [...desktopV3UpdaterGovernanceSourceRoots];

  return {
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-updater-governance-summary.json",
    ),
    outputDir,
    requiredFilePaths: requiredFiles.map((filePath) => path.join(workspaceRoot, filePath)),
    requiredFiles,
    rootDir: workspaceRoot,
    runId,
    sourceRootPaths: sourceRoots.map((directoryPath) => path.join(workspaceRoot, directoryPath)),
    sourceRoots,
    summaryPath: path.join(outputDir, "summary.json"),
  };
}
