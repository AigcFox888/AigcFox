import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { writeFailureSummaryFallback } from "./lib/failure-summary.mjs";
import {
  collectDesktopV3CommandMentions,
  desktopV3AllowedSupportingCommands,
  getPnpmRootScriptName,
} from "./lib/desktop-v3-command-surface.mjs";
import { pathExists, readJsonFile, writeJsonFile } from "./lib/script-io.mjs";
import { persistVerificationSummary } from "./lib/verification-summary-output.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(currentDir, "..");
const verificationDir = path.join(rootDir, "output", "verification");
const readCliValue = (flagName) => {
  const prefix = `--${flagName}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  const rawValue = argument?.slice(prefix.length)?.trim();
  return rawValue && rawValue.length > 0 ? rawValue : null;
};
const readPathOverride = (flagName, envName, defaultPath) =>
  readCliValue(flagName) || process.env[envName]?.trim() || defaultPath;
const resolveRunId = (now = new Date()) =>
  readCliValue("run-id") ||
  process.env.AIGCFOX_GOVERNANCE_COMMAND_DOCS_RUN_ID?.trim() ||
  now.toISOString().replace(/[:.]/g, "-");

export const governanceCommandDocsCommand = "pnpm qa:governance-command-docs";
export const registryPath = path.join(rootDir, "config", "governance-command-docs-registry.json");
export const packageJsonPath = path.join(rootDir, "package.json");
export const runId = resolveRunId();
export const outputDir = readPathOverride(
  "output-dir",
  "AIGCFOX_GOVERNANCE_COMMAND_DOCS_OUTPUT_DIR",
  path.join(verificationDir, `governance-command-docs-${runId}`),
);
export const summaryPath = readPathOverride(
  "summary-path",
  "AIGCFOX_GOVERNANCE_COMMAND_DOCS_SUMMARY_PATH",
  path.join(outputDir, "summary.json")
);
export const latestSummaryPath = readPathOverride(
  "latest-summary-path",
  "AIGCFOX_GOVERNANCE_COMMAND_DOCS_LATEST_SUMMARY_PATH",
  path.join(verificationDir, "latest", "governance-command-docs-summary.json"),
);
export const reportPath = readPathOverride(
  "report-path",
  "AIGCFOX_GOVERNANCE_COMMAND_DOCS_REPORT_PATH",
  path.join(outputDir, "report.md")
);

function getNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function createRecommendation(issue, nextStepLabel, nextCommand) {
  return {
    issue: getNonEmptyString(issue),
    nextStepLabel: getNonEmptyString(nextStepLabel),
    nextCommand: getNonEmptyString(nextCommand)
  };
}

export function normalizeRegistryEntry(entry, index) {
  const script = getNonEmptyString(entry?.script);
  const command = getNonEmptyString(entry?.command) ?? (script ? `pnpm ${script}` : null);
  const purpose = getNonEmptyString(entry?.purpose);
  const requiredDocPaths = Array.isArray(entry?.requiredDocPaths)
    ? entry.requiredDocPaths
        .map((value) => getNonEmptyString(value))
        .filter((value) => value !== null)
    : [];

  if (!script) {
    throw new Error(`governance command registry entry #${index + 1} 缺少 script。`);
  }

  if (!command) {
    throw new Error(`governance command registry entry #${index + 1} 缺少 command。`);
  }

  if (requiredDocPaths.length === 0) {
    throw new Error(`governance command registry entry #${index + 1} 缺少 requiredDocPaths。`);
  }

  return {
    script,
    command,
    purpose,
    requiredDocPaths
  };
}

export function buildGovernanceCommandDocsSummary({
  registryEntries,
  packageScripts,
  docContentsByPath,
  activeSurfaceFiles = [],
  activeSurfaceCommands = [],
  checkedAt = new Date().toISOString()
}) {
  const entries = registryEntries.map((entry, index) => normalizeRegistryEntry(entry, index));
  const missingPackageScripts = [];
  const missingDocMentions = [];
  const approvedActiveSurfaceCommands = [];
  const unapprovedActiveSurfaceCommands = [];
  const unregisteredActiveRootCommands = [];
  const staleRegistryScripts = [];
  const registryScriptSet = new Set(entries.map((entry) => entry.script));
  const activeRootScriptSet = new Set();
  const approvedCommandSet = new Set([
    ...entries.map((entry) => entry.command),
    ...desktopV3AllowedSupportingCommands
  ]);

  const evaluatedEntries = entries.map((entry) => {
    const packageScriptPresent = getNonEmptyString(packageScripts?.[entry.script]) !== null;
    const missingRequiredDocPaths = entry.requiredDocPaths.filter((docPath) => {
      const content = docContentsByPath?.[docPath];
      return typeof content !== "string" || content.includes(entry.command) !== true;
    });

    if (!packageScriptPresent) {
      missingPackageScripts.push({
        command: entry.command,
        script: entry.script
      });
    }

    for (const docPath of missingRequiredDocPaths) {
      missingDocMentions.push({
        command: entry.command,
        docPath
      });
    }

    return {
      command: entry.command,
      script: entry.script,
      purpose: entry.purpose,
      requiredDocPaths: entry.requiredDocPaths,
      packageScriptPresent,
      missingRequiredDocPaths,
      documentedInAllRequiredDocs: missingRequiredDocPaths.length === 0
    };
  });

  for (const item of activeSurfaceCommands) {
    const script = getPnpmRootScriptName(item.command);

    if (approvedCommandSet.has(item.command)) {
      approvedActiveSurfaceCommands.push(item);
    } else if (script !== null) {
      unregisteredActiveRootCommands.push({
        command: item.command,
        script,
        filePaths: Array.isArray(item.filePaths) ? item.filePaths : []
      });
    } else {
      unapprovedActiveSurfaceCommands.push(item);
    }

    if (script !== null) {
      activeRootScriptSet.add(script);
    }
  }

  for (const entry of entries) {
    if (!activeRootScriptSet.has(entry.script)) {
      staleRegistryScripts.push({
        command: entry.command,
        script: entry.script
      });
    }
  }

  const failedReasons = [];

  if (evaluatedEntries.length === 0) {
    failedReasons.push("治理命令文档 registry 为空，无法校验文档入口。");
  }

  for (const item of missingPackageScripts) {
    failedReasons.push(`${item.command} 未在 package.json scripts 中定义。`);
  }

  for (const item of missingDocMentions) {
    failedReasons.push(`${item.command} 未在 ${item.docPath} 中登记。`);
  }

  for (const item of unregisteredActiveRootCommands) {
    failedReasons.push(`${item.command} 未在 governance command registry 中登记。`);
  }

  for (const item of unapprovedActiveSurfaceCommands) {
    failedReasons.push(`${item.command} 未在 active command surface allowlist 中批准。`);
  }

  for (const item of staleRegistryScripts) {
    failedReasons.push(`${item.command} 已不在当前 active command surface 中引用。`);
  }

  const totalCommandCount = evaluatedEntries.length;
  const packageScriptPresentCount = evaluatedEntries.filter((entry) => entry.packageScriptPresent).length;
  const documentedCommandCount = evaluatedEntries.filter(
    (entry) => entry.documentedInAllRequiredDocs
  ).length;
  const missingPackageScriptCount = missingPackageScripts.length;
  const missingDocMentionCount = missingDocMentions.length;
  const activeSurfaceFileCount = activeSurfaceFiles.length;
  const activeSurfaceCommandCount = activeSurfaceCommands.length;
  const approvedActiveSurfaceCommandCount = approvedActiveSurfaceCommands.length;
  const unapprovedActiveSurfaceCommandCount =
    unapprovedActiveSurfaceCommands.length + unregisteredActiveRootCommands.length;
  const activeRootScriptCount = activeRootScriptSet.size;
  const staleRegistryScriptCount = staleRegistryScripts.length;
  const passed = failedReasons.length === 0;

  return {
    checkedAt,
    latestSummaryPath,
    outputDir,
    summaryPath,
    reportPath,
    registryPath,
    packageJsonPath,
    runId,
    passed,
    totalCommandCount,
    packageScriptPresentCount,
    documentedCommandCount,
    missingPackageScriptCount,
    missingDocMentionCount,
    activeSurfaceFileCount,
    activeSurfaceCommandCount,
    approvedActiveSurfaceCommandCount,
    unapprovedActiveSurfaceCommandCount,
    activeRootScriptCount,
    staleRegistryScriptCount,
    checks: {
      registryEntriesPresent: totalCommandCount > 0,
      packageScriptsPresent: missingPackageScriptCount === 0,
      requiredDocMentionsPresent: missingDocMentionCount === 0,
      activeSurfaceCommandsApproved: unapprovedActiveSurfaceCommandCount === 0,
      registryMatchesActiveRootSurface: staleRegistryScriptCount === 0
    },
    entries: evaluatedEntries,
    activeSurfaceFiles,
    activeSurfaceCommands,
    unapprovedActiveSurfaceCommands,
    unregisteredActiveRootCommands,
    staleRegistryScripts,
    failedReasons,
    recommendation: passed
      ? createRecommendation(null, null, null)
      : createRecommendation(
          failedReasons[0] ?? "治理命令文档校验失败。",
          "同步 registry、package.json scripts 与治理文档入口",
          governanceCommandDocsCommand
        ),
    error: passed
      ? null
      : `${failedReasons.join(" ")} 详情见 ${summaryPath}`
  };
}

function formatValue(value, fallback = "无") {
  const stringValue = getNonEmptyString(value);

  if (stringValue !== null) {
    return stringValue;
  }

  const numberValue = getFiniteNumber(value);
  if (numberValue !== null) {
    return `${numberValue}`;
  }

  return fallback;
}

function buildMarkdown(summary) {
  const lines = [
    "# AigcFox 治理命令文档一致性报告",
    "",
    `- 检查时间：${formatValue(summary.checkedAt)}`,
    `- 总体状态：${summary.passed === true ? "已通过" : "未通过"}`,
    `- Registry：${registryPath}`,
    `- package.json：${packageJsonPath}`,
    `- Output：${outputDir}`,
    `- Summary：${summaryPath}`,
    `- Latest Summary：${latestSummaryPath}`,
    `- Report：${reportPath}`,
    `- 命令总数：${formatValue(summary.totalCommandCount)}`,
    `- scripts 已定义：${formatValue(summary.packageScriptPresentCount)}/${formatValue(summary.totalCommandCount)}`,
    `- 文档已登记：${formatValue(summary.documentedCommandCount)}/${formatValue(summary.totalCommandCount)}`,
    `- 缺失 script 数：${formatValue(summary.missingPackageScriptCount)}`,
    `- 缺失文档登记数：${formatValue(summary.missingDocMentionCount)}`,
    `- active surface 文件数：${formatValue(summary.activeSurfaceFileCount)}`,
    `- active surface 命令数：${formatValue(summary.activeSurfaceCommandCount)}`,
    `- active surface 已批准：${formatValue(summary.approvedActiveSurfaceCommandCount)}/${formatValue(summary.activeSurfaceCommandCount)}`,
    `- active surface 未批准：${formatValue(summary.unapprovedActiveSurfaceCommandCount)}`,
    `- active root script 数：${formatValue(summary.activeRootScriptCount)}`,
    `- 过期 registry script 数：${formatValue(summary.staleRegistryScriptCount)}`
  ];

  lines.push("", "## 当前建议", "");
  if (summary.recommendation?.issue) {
    lines.push(`- 当前首要问题：${summary.recommendation.issue}`);
    lines.push(`- 推荐下一步：${formatValue(summary.recommendation.nextStepLabel)}`);
    lines.push(`- 推荐命令：\`${formatValue(summary.recommendation.nextCommand)}\``);
  } else {
    lines.push("- 当前治理命令 registry、package.json scripts 与文档入口保持一致。");
  }

  lines.push("", "## 检查项", "");
  lines.push(`- registryEntriesPresent：${summary.checks?.registryEntriesPresent === true ? "通过" : "未通过"}`);
  lines.push(`- packageScriptsPresent：${summary.checks?.packageScriptsPresent === true ? "通过" : "未通过"}`);
  lines.push(`- requiredDocMentionsPresent：${summary.checks?.requiredDocMentionsPresent === true ? "通过" : "未通过"}`);
  lines.push(`- activeSurfaceCommandsApproved：${summary.checks?.activeSurfaceCommandsApproved === true ? "通过" : "未通过"}`);
  lines.push(`- registryMatchesActiveRootSurface：${summary.checks?.registryMatchesActiveRootSurface === true ? "通过" : "未通过"}`);

  lines.push("", "## 命令明细", "");
  for (const entry of summary.entries ?? []) {
    lines.push(`- 命令：${entry.command}`);
    lines.push(`  script：${entry.script}`);
    lines.push(`  用途：${formatValue(entry.purpose)}`);
    lines.push(`  scripts：${entry.packageScriptPresent === true ? "已定义" : "缺失"}`);
    lines.push(
      `  文档登记：${entry.documentedInAllRequiredDocs === true ? "完整" : "缺失"}`
    );
    lines.push(`  要求文档：${entry.requiredDocPaths.join("、")}`);
    if (Array.isArray(entry.missingRequiredDocPaths) && entry.missingRequiredDocPaths.length > 0) {
      lines.push(`  缺失位置：${entry.missingRequiredDocPaths.join("、")}`);
    }
  }

  if (
    Array.isArray(summary.unregisteredActiveRootCommands) &&
    summary.unregisteredActiveRootCommands.length > 0
  ) {
    lines.push("", "## 未登记 Root Commands", "");
    for (const item of summary.unregisteredActiveRootCommands) {
      lines.push(`- ${item.command} -> ${item.filePaths.join("、")}`);
    }
  }

  if (
    Array.isArray(summary.unapprovedActiveSurfaceCommands) &&
    summary.unapprovedActiveSurfaceCommands.length > 0
  ) {
    lines.push("", "## 未批准 Supporting Commands", "");
    for (const item of summary.unapprovedActiveSurfaceCommands) {
      lines.push(`- ${item.command} -> ${item.filePaths.join("、")}`);
    }
  }

  if (Array.isArray(summary.staleRegistryScripts) && summary.staleRegistryScripts.length > 0) {
    lines.push("", "## 过期 Registry Commands", "");
    for (const item of summary.staleRegistryScripts) {
      lines.push(`- ${item.command}`);
    }
  }

  if (Array.isArray(summary.failedReasons) && summary.failedReasons.length > 0) {
    lines.push("", "## 失败原因", "");
    for (const reason of summary.failedReasons) {
      lines.push(`- ${reason}`);
    }
  }

  if (summary.error) {
    lines.push("", "## 错误", "");
    lines.push(`- ${summary.error}`);
  }

  lines.push("");
  return lines.join("\n");
}

async function loadInputs() {
  const registryJson = await readJsonFile(registryPath);
  const registryEntries = Array.isArray(registryJson?.entries) ? registryJson.entries : [];
  const packageJson = await readJsonFile(packageJsonPath);
  const packageScripts =
    packageJson?.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts : {};
  const docPathSet = new Set();

  for (const [index, entry] of registryEntries.entries()) {
    const normalizedEntry = normalizeRegistryEntry(entry, index);
    for (const docPath of normalizedEntry.requiredDocPaths) {
      docPathSet.add(docPath);
    }
  }

  const docContentsByPath = {};
  for (const relativeDocPath of docPathSet) {
    const absoluteDocPath = path.join(rootDir, relativeDocPath);
    docContentsByPath[relativeDocPath] = (await pathExists(absoluteDocPath))
      ? await fs.readFile(absoluteDocPath, "utf8")
      : null;
  }
  const activeSurface = await collectDesktopV3CommandMentions(rootDir);

  return {
    registryEntries,
    packageScripts,
    docContentsByPath,
    activeSurfaceFiles: activeSurface.files,
    activeSurfaceCommands: activeSurface.commands
  };
}

export async function persistGovernanceCommandDocsSummary(summary, options = {}) {
  const persistVerificationSummaryImpl =
    typeof options.persistVerificationSummaryImpl === "function"
      ? options.persistVerificationSummaryImpl
      : persistVerificationSummary;
  const writeJsonFileImpl =
    typeof options.writeJsonFileImpl === "function" ? options.writeJsonFileImpl : writeJsonFile;
  const writeFileImpl = typeof options.writeFileImpl === "function" ? options.writeFileImpl : fs.writeFile;
  const mkdirImpl = typeof options.mkdirImpl === "function" ? options.mkdirImpl : fs.mkdir;
  const nextSummary = {
    ...summary,
    latestSummaryPath,
    outputDir,
    runId,
    summaryPath,
    reportPath,
    registryPath,
    packageJsonPath
  };

  await mkdirImpl(outputDir, { recursive: true });
  await persistVerificationSummaryImpl(
    nextSummary,
    {
      archiveSummaryPath: summaryPath,
      latestSummaryPath,
    },
    {
      writeJsonFileImpl,
    },
  );
  await mkdirImpl(path.dirname(reportPath), { recursive: true });
  await writeFileImpl(reportPath, `${buildMarkdown(nextSummary)}\n`, "utf8");

  return nextSummary;
}

export function createBaseGovernanceCommandDocsSummary(overrides = {}) {
  return {
    checkedAt:
      typeof overrides.checkedAt === "string" && overrides.checkedAt.length > 0
        ? overrides.checkedAt
        : new Date().toISOString(),
    latestSummaryPath,
    outputDir,
    runId,
    summaryPath,
    reportPath,
    registryPath,
    packageJsonPath,
    passed: false,
    totalCommandCount: 0,
    packageScriptPresentCount: 0,
    documentedCommandCount: 0,
    missingPackageScriptCount: 0,
    missingDocMentionCount: 0,
    activeSurfaceFileCount: 0,
    activeSurfaceCommandCount: 0,
    approvedActiveSurfaceCommandCount: 0,
    unapprovedActiveSurfaceCommandCount: 0,
    activeRootScriptCount: 0,
    staleRegistryScriptCount: 0,
    checks: {
      registryEntriesPresent: false,
      packageScriptsPresent: false,
      requiredDocMentionsPresent: false,
      activeSurfaceCommandsApproved: false,
      registryMatchesActiveRootSurface: false
    },
    entries: [],
    activeSurfaceFiles: [],
    activeSurfaceCommands: [],
    unapprovedActiveSurfaceCommands: [],
    unregisteredActiveRootCommands: [],
    staleRegistryScripts: [],
    failedReasons: [],
    recommendation: createRecommendation(
      "治理命令文档校验失败。",
      "同步 registry、package.json scripts 与治理文档入口",
      governanceCommandDocsCommand
    ),
    error: null,
    ...overrides,
    latestSummaryPath,
    outputDir,
    runId,
    summaryPath,
    reportPath,
    registryPath,
    packageJsonPath
  };
}

let currentSummary = createBaseGovernanceCommandDocsSummary();

export async function runGovernanceCommandDocsVerify(options = {}) {
  const persistSummaryImpl =
    typeof options.persistSummaryImpl === "function"
      ? options.persistSummaryImpl
      : persistGovernanceCommandDocsSummary;
  const consoleLogImpl =
    typeof options.consoleLogImpl === "function" ? options.consoleLogImpl : console.log;
  const inputs = options.inputs ?? (await loadInputs());
  currentSummary = createBaseGovernanceCommandDocsSummary();
  currentSummary = buildGovernanceCommandDocsSummary({
    ...inputs,
    checkedAt:
      typeof options.checkedAt === "string" && options.checkedAt.length > 0
        ? options.checkedAt
        : new Date().toISOString()
  });

  currentSummary = (await persistSummaryImpl(currentSummary)) ?? currentSummary;

  if (!currentSummary.passed) {
    throw new Error(currentSummary.error);
  }

  if (options.silent !== true) {
    consoleLogImpl(
      [
        "Governance command docs check passed.",
        `Summary: ${summaryPath}.`,
        `Latest: ${latestSummaryPath}.`,
        `Report: ${reportPath}.`
      ].join(" ")
    );
  }

  return currentSummary;
}

export async function handleGovernanceCommandDocsFailure(error, options = {}) {
  const currentSummaryOverride =
    options.currentSummary && typeof options.currentSummary === "object"
      ? options.currentSummary
      : currentSummary;
  const persistSummaryImpl =
    typeof options.persistSummaryImpl === "function"
      ? options.persistSummaryImpl
      : persistGovernanceCommandDocsSummary;
  const writeFailureSummaryFallbackImpl =
    typeof options.writeFailureSummaryFallbackImpl === "function"
      ? options.writeFailureSummaryFallbackImpl
      : writeFailureSummaryFallback;
  const baseSummary = createBaseGovernanceCommandDocsSummary({
    error: error instanceof Error ? error.message : String(error)
  });

  return writeFailureSummaryFallbackImpl(
    summaryPath,
    async (summary, context) => {
      await persistSummaryImpl({
        ...baseSummary,
        ...currentSummaryOverride,
        ...summary,
        passed: false,
        error: context?.errorMessage ?? summary?.error ?? null
      });
    },
    error,
    {
      currentSummary: currentSummaryOverride,
      baseSummary
    }
  );
}

const isDirectExecution =
  typeof process.argv[1] === "string" && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runGovernanceCommandDocsVerify().catch(async (error) => {
    const { errorMessage } = await handleGovernanceCommandDocsFailure(error, {
      currentSummary
    });

    console.error(errorMessage);
    process.exitCode = 1;
  });
}
