import { isDeepStrictEqual } from "node:util";

import { createVerificationArtifactRef } from "./verification-artifact-ref.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertObject(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
}

function assertArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`);
}

function assertNonEmptyString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty string.`);
}

function assertNullableString(value, label) {
  assert(value === null || typeof value === "string", `${label} must be a string or null.`);
}

function assertNullableNonEmptyString(value, label) {
  if (value === null) {
    return;
  }

  assertNonEmptyString(value, label);
}

function assertBoolean(value, label) {
  assert(typeof value === "boolean", `${label} must be a boolean.`);
}

function assertArtifactRefPair(rootDir, container, key, label, options = {}) {
  const refKey = options.refKey ?? `${key}Ref`;
  const requireWorkspaceRelative = options.requireWorkspaceRelative ?? false;

  assertObject(container, label);
  assert(refKey in container, `${label}.${refKey} is missing.`);

  const actualRef = container[refKey];
  const expectedRef = createVerificationArtifactRef(rootDir, container[key]);

  assert(
    isDeepStrictEqual(actualRef, expectedRef),
    `${label}.${refKey} did not match ${label}.${key}.`,
  );

  if (requireWorkspaceRelative && expectedRef !== null) {
    assert(
      typeof expectedRef.workspaceRelativePath === "string" && expectedRef.workspaceRelativePath.length > 0,
      `${label}.${refKey} must stay inside the workspace root.`,
    );
  }
}

function assertExpectedString(actualValue, expectedValue, label) {
  if (expectedValue !== undefined) {
    assert(actualValue === expectedValue, `${label} did not match the expected value.`);
  }
}

function assertSummaryStepBase(step, label) {
  assertObject(step, label);
  assertObject(step.artifacts, `${label}.artifacts`);
  assertNonEmptyString(step.command, `${label}.command`);
  assertNonEmptyString(step.key, `${label}.key`);
  assertNonEmptyString(step.label, `${label}.label`);
  assertNonEmptyString(step.status, `${label}.status`);
}

function assertDocumentGateArtifacts(step, stepLabel, expectedDocumentFiles) {
  assertArray(step.artifacts.brokenLinks, `${stepLabel}.artifacts.brokenLinks`);
  assertArray(step.artifacts.documentFiles, `${stepLabel}.artifacts.documentFiles`);
  assertArray(step.artifacts.forbiddenTerms, `${stepLabel}.artifacts.forbiddenTerms`);
  assertArray(step.artifacts.trackedFiles, `${stepLabel}.artifacts.trackedFiles`);
  assertArray(step.artifacts.untrackedFiles, `${stepLabel}.artifacts.untrackedFiles`);

  if (expectedDocumentFiles === undefined) {
    return;
  }

  assert(
    isDeepStrictEqual(step.artifacts.documentFiles, expectedDocumentFiles),
    `${stepLabel}.artifacts.documentFiles did not match the expected value.`,
  );

  const trackedFiles = step.artifacts.trackedFiles;
  const untrackedFiles = step.artifacts.untrackedFiles;
  const combinedFiles = [...trackedFiles, ...untrackedFiles];
  const trackedSet = new Set(trackedFiles);
  const untrackedSet = new Set(untrackedFiles);

  assert(trackedSet.size === trackedFiles.length, `${stepLabel}.artifacts.trackedFiles must not contain duplicates.`);
  assert(
    untrackedSet.size === untrackedFiles.length,
    `${stepLabel}.artifacts.untrackedFiles must not contain duplicates.`,
  );

  for (const file of trackedFiles) {
    assert(
      !untrackedSet.has(file),
      `${stepLabel}.artifacts.trackedFiles and untrackedFiles must not overlap.`,
    );
  }

  const expectedFileSet = new Set(expectedDocumentFiles);
  for (const file of combinedFiles) {
    assert(
      expectedFileSet.has(file),
      `${stepLabel}.artifacts tracked/untracked files must stay inside the expected document files.`,
    );
  }

  if (step.status !== "passed") {
    return;
  }

  assert(
    isDeepStrictEqual(
      [...combinedFiles].sort(),
      [...expectedDocumentFiles].sort(),
    ),
    `${stepLabel}.artifacts tracked/untracked files did not partition the expected document files.`,
  );
}

function assertGithubActionsLintArtifacts(step, stepLabel, expectedWorkflowFiles) {
  assertArray(step.artifacts.workflowFiles, `${stepLabel}.artifacts.workflowFiles`);

  if (expectedWorkflowFiles === undefined) {
    return;
  }

  assert(
    isDeepStrictEqual(step.artifacts.workflowFiles, expectedWorkflowFiles),
    `${stepLabel}.artifacts.workflowFiles did not match the expected value.`,
  );
}

function isDesktopV3Wave1ChildSmokeStep(stepKey) {
  return [
    "desktop-v3-responsive-smoke",
    "desktop-v3-tauri-dev-smoke",
    "desktop-v3-packaged-app-smoke",
  ].includes(stepKey);
}

function isDesktopV3Wave1DocumentStep(stepKey) {
  return stepKey === "desktop-v3-document-check";
}

function isBackendWave1DocumentStep(stepKey) {
  return stepKey === "document-check";
}

function assertSummaryCore(summary, options = {}) {
  const {
    expectedLatestSummaryPath,
    expectedOutputDir,
    expectedRunId,
    expectedStatus,
    expectedSummaryPath,
    label = "wave1 readiness summary",
    requireCheckedAt = false,
    requireFinishedAt = true,
    requireStartedAt = false,
    requireSteps = true,
    rootDir,
    workspaceRelativeTopLevelKeys = [],
  } = options;

  assertObject(summary, label);
  if (requireSteps) {
    assertArray(summary.steps, `${label}.steps`);
    assert(summary.steps.length > 0, `${label}.steps must not be empty.`);
  }
  assertNonEmptyString(summary.latestSummaryPath, `${label}.latestSummaryPath`);
  assertNonEmptyString(summary.outputDir, `${label}.outputDir`);
  assertNonEmptyString(summary.runId, `${label}.runId`);
  assertNonEmptyString(summary.summaryPath, `${label}.summaryPath`);
  assertNonEmptyString(summary.status, `${label}.status`);

  if (requireCheckedAt) {
    assertNonEmptyString(summary.checkedAt, `${label}.checkedAt`);
  }

  if (requireStartedAt) {
    assertNonEmptyString(summary.startedAt, `${label}.startedAt`);
  }

  if (requireFinishedAt) {
    assertNonEmptyString(summary.finishedAt, `${label}.finishedAt`);
  }

  assertArtifactRefPair(rootDir, summary, "latestSummaryPath", label, {
    requireWorkspaceRelative: workspaceRelativeTopLevelKeys.includes("latestSummaryPath"),
  });
  assertArtifactRefPair(rootDir, summary, "outputDir", label, {
    requireWorkspaceRelative: workspaceRelativeTopLevelKeys.includes("outputDir"),
  });
  assertArtifactRefPair(rootDir, summary, "summaryPath", label, {
    requireWorkspaceRelative: workspaceRelativeTopLevelKeys.includes("summaryPath"),
  });

  assertExpectedString(summary.latestSummaryPath, expectedLatestSummaryPath, `${label}.latestSummaryPath`);
  assertExpectedString(summary.outputDir, expectedOutputDir, `${label}.outputDir`);
  assertExpectedString(summary.runId, expectedRunId, `${label}.runId`);
  assertExpectedString(summary.summaryPath, expectedSummaryPath, `${label}.summaryPath`);
  assertExpectedString(summary.status, expectedStatus, `${label}.status`);
}

export function assertBoundWave1ChildSummaryContract(summary, options = {}) {
  const {
    expectedLatestSummaryPath,
    expectedOutputDir,
    expectedRunId,
    expectedStatus = "passed",
    expectedSummaryPath,
    label = "wave1 child summary",
    rootDir,
  } = options;

  assertSummaryCore(summary, {
    expectedLatestSummaryPath,
    expectedOutputDir,
    expectedRunId,
    expectedStatus,
    expectedSummaryPath,
    label,
    requireFinishedAt: false,
    requireStartedAt: false,
    requireSteps: false,
    rootDir,
    workspaceRelativeTopLevelKeys: ["latestSummaryPath", "outputDir", "summaryPath"],
  });
}

export function assertBackendWave1ReadinessSummaryContract(summary, options = {}) {
  const { expectedDocumentFiles, label = "backend wave1 readiness summary", rootDir } = options;

  assertSummaryCore(summary, {
    ...options,
    label,
    requireCheckedAt: true,
    requireStartedAt: false,
    rootDir,
  });

  assertObject(summary.host, `${label}.host`);
  assertNonEmptyString(summary.host.platform, `${label}.host.platform`);
  assertNullableString(summary.host.wslDistro, `${label}.host.wslDistro`);

  summary.steps.forEach((step, index) => {
    const stepLabel = `${label}.steps[${index}]`;
    assertSummaryStepBase(step, stepLabel);
    assertNonEmptyString(step.kind, `${stepLabel}.kind`);

    if (isBackendWave1DocumentStep(step.key)) {
      assertDocumentGateArtifacts(step, stepLabel, expectedDocumentFiles);
    }

    assertArtifactRefPair(rootDir, step.artifacts, "fullBuildLogPath", `${stepLabel}.artifacts`);
    assertArtifactRefPair(rootDir, step.artifacts, "logPath", `${stepLabel}.artifacts`);
    assertArtifactRefPair(rootDir, step.artifacts, "offlineBuildLogPath", `${stepLabel}.artifacts`);
  });
}

export function assertDesktopV3Wave1ReadinessSummaryContract(summary, options = {}) {
  const { expectedDocumentFiles, label = "desktop-v3 wave1 readiness summary", rootDir } = options;

  assertSummaryCore(summary, {
    ...options,
    label,
    requireStartedAt: true,
    rootDir,
  });

  assertObject(summary.artifacts, `${label}.artifacts`);
  assertObject(summary.host, `${label}.host`);
  assertBoolean(summary.host.isWsl, `${label}.host.isWsl`);
  assertNonEmptyString(summary.host.platform, `${label}.host.platform`);
  assertNonEmptyString(summary.profile, `${label}.profile`);

  for (const key of [
    "latestPackagedAppSmokeSummary",
    "latestReadinessSummary",
    "latestResponsiveSmokeSummary",
    "latestTauriDevSmokeSummary",
    "packagedAppSmokeSummary",
    "readinessSummary",
    "responsiveSmokeSummary",
    "tauriDevSmokeSummary",
  ]) {
    assertArtifactRefPair(rootDir, summary.artifacts, key, `${label}.artifacts`);
  }

  summary.steps.forEach((step, index) => {
    const stepLabel = `${label}.steps[${index}]`;
    assertSummaryStepBase(step, stepLabel);
    assertNonEmptyString(step.kind, `${stepLabel}.kind`);
    assertBoolean(step.passed, `${stepLabel}.passed`);

    if (isDesktopV3Wave1DocumentStep(step.key)) {
      assertDocumentGateArtifacts(step, stepLabel, expectedDocumentFiles);
      return;
    }

    if (!isDesktopV3Wave1ChildSmokeStep(step.key)) {
      return;
    }

    assertNonEmptyString(step.artifacts.latestSummaryPath, `${stepLabel}.artifacts.latestSummaryPath`);
    assertNonEmptyString(step.artifacts.outputDir, `${stepLabel}.artifacts.outputDir`);
    assertNonEmptyString(step.artifacts.summaryPath, `${stepLabel}.artifacts.summaryPath`);
    assertArtifactRefPair(rootDir, step.artifacts, "latestSummaryPath", `${stepLabel}.artifacts`, {
      requireWorkspaceRelative: true,
    });
    assertArtifactRefPair(rootDir, step.artifacts, "outputDir", `${stepLabel}.artifacts`, {
      requireWorkspaceRelative: true,
    });
    assertArtifactRefPair(rootDir, step.artifacts, "summaryPath", `${stepLabel}.artifacts`, {
      requireWorkspaceRelative: true,
    });
  });
}

export function assertWave1SkeletonReadinessSummaryContract(summary, options = {}) {
  const { expectedDocumentFiles, expectedWorkflowFiles, label = "wave1 skeleton readiness summary", rootDir } = options;

  assertSummaryCore(summary, {
    ...options,
    label,
    requireCheckedAt: true,
    rootDir,
  });

  assertObject(summary.artifacts, `${label}.artifacts`);

  for (const key of [
    ["aggregateLatestSummaryPath", "aggregateLatestSummaryRef"],
    ["aggregateSummaryPath", "aggregateSummaryRef"],
    ["backendLatestSummaryPath", "backendLatestSummaryRef"],
    ["backendOutputDir", "backendOutputDirRef"],
    ["backendSummaryPath", "backendSummaryRef"],
    ["desktopLatestSummaryPath", "desktopLatestSummaryRef"],
    ["desktopOutputDir", "desktopOutputDirRef"],
    ["desktopSummaryPath", "desktopSummaryRef"],
  ]) {
    assertArtifactRefPair(rootDir, summary.artifacts, key[0], `${label}.artifacts`, {
      refKey: key[1],
    });
  }

  assertNullableString(summary.artifacts.backendRunId, `${label}.artifacts.backendRunId`);
  assertNullableString(summary.artifacts.backendSummaryStatus, `${label}.artifacts.backendSummaryStatus`);
  assertNullableString(summary.artifacts.desktopRunId, `${label}.artifacts.desktopRunId`);
  assertNullableString(summary.artifacts.desktopSummaryStatus, `${label}.artifacts.desktopSummaryStatus`);

  summary.steps.forEach((step, index) => {
    const stepLabel = `${label}.steps[${index}]`;
    assertSummaryStepBase(step, stepLabel);

    if (step.key === "aggregate-document-check") {
      assertDocumentGateArtifacts(step, stepLabel, expectedDocumentFiles);
      return;
    }

    if (step.key === "github-actions-lint") {
      assertGithubActionsLintArtifacts(step, stepLabel, expectedWorkflowFiles);
      return;
    }

    assertNonEmptyString(step.artifacts.latestSummaryPath, `${stepLabel}.artifacts.latestSummaryPath`);
    assertNonEmptyString(step.artifacts.outputDir, `${stepLabel}.artifacts.outputDir`);
    assertNonEmptyString(step.artifacts.runId, `${stepLabel}.artifacts.runId`);
    assertNonEmptyString(step.artifacts.summaryPath, `${stepLabel}.artifacts.summaryPath`);
    if (step.status === "passed") {
      assertNonEmptyString(step.artifacts.summaryStatus, `${stepLabel}.artifacts.summaryStatus`);
    } else {
      assertNullableNonEmptyString(step.artifacts.summaryStatus, `${stepLabel}.artifacts.summaryStatus`);
    }
    assertArtifactRefPair(rootDir, step.artifacts, "latestSummaryPath", `${stepLabel}.artifacts`, {
      refKey: "latestSummaryRef",
      requireWorkspaceRelative: true,
    });
    assertArtifactRefPair(rootDir, step.artifacts, "outputDir", `${stepLabel}.artifacts`, {
      requireWorkspaceRelative: true,
    });
    assertArtifactRefPair(rootDir, step.artifacts, "summaryPath", `${stepLabel}.artifacts`, {
      refKey: "summaryRef",
      requireWorkspaceRelative: true,
    });
  });
}
