import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

import {
  collectTypeScriptInterfaceProperties,
  collectTypeScriptModuleReferenceEntries,
  collectTypeScriptTopLevelDeclarations,
  desktopV3SourceDir,
  listDesktopV3SourceFiles,
  rootDir,
} from "./desktop-v3-app-shell-governance.mjs";
import { decorateVerificationArtifactRefs } from "./verification-artifact-ref.mjs";
import { resolveLatestVerificationSummaryPath } from "./verification-summary-output.mjs";

export { rootDir };

export const desktopV3SupportScopePrefixes = Object.freeze([
  "apps/desktop-v3/src/lib/errors/",
  "apps/desktop-v3/src/lib/query/",
]);
export const desktopV3SupportStandaloneFiles = Object.freeze([
  "apps/desktop-v3/src/lib/notify.ts",
  "apps/desktop-v3/src/lib/typography.ts",
  "apps/desktop-v3/src/lib/utils.ts",
]);
export const desktopV3SupportFileSet = Object.freeze([
  "apps/desktop-v3/src/lib/errors/app-error.ts",
  "apps/desktop-v3/src/lib/errors/error-support-details.ts",
  "apps/desktop-v3/src/lib/errors/normalize-command-error.ts",
  "apps/desktop-v3/src/lib/notify.ts",
  "apps/desktop-v3/src/lib/query/query-client.ts",
  "apps/desktop-v3/src/lib/query/query-retry-policy.ts",
  "apps/desktop-v3/src/lib/typography.ts",
  "apps/desktop-v3/src/lib/utils.ts",
]);

export const desktopV3AllowedAppErrorSurface = Object.freeze([
  "class:AppError",
  "interface:AppErrorShape",
]);
export const desktopV3AllowedAppErrorShapeProperties = Object.freeze([
  "code: string",
  "details?: Record<string, unknown>",
  "message: string",
  "requestId?: string",
]);
export const desktopV3AllowedErrorSupportDetailsSurface = Object.freeze([
  "const:GENERIC_ERROR_MESSAGE",
  "fn:buildErrorSupportDetails",
  "interface:ErrorSupportDetail",
]);
export const desktopV3AllowedErrorSupportDetailProperties = Object.freeze([
  "label: string",
  "monospace?: boolean",
  "value: string",
]);
export const desktopV3AllowedNormalizeCommandErrorSurface = Object.freeze([
  "fn:fromPayload",
  "fn:normalizeCommandError",
  "interface:CommandErrorPayload",
]);
export const desktopV3AllowedCommandErrorPayloadProperties = Object.freeze([
  "code?: string",
  "details?: Record<string, unknown>",
  "message?: string",
  "requestId?: string",
]);
export const desktopV3AllowedQueryClientSurface = Object.freeze([
  "const:queryClient",
]);
export const desktopV3AllowedQueryRetryPolicySurface = Object.freeze([
  "fn:shouldRetryDesktopQuery",
]);
export const desktopV3AllowedNotifySurface = Object.freeze([
  "const:notify",
]);
export const desktopV3AllowedNotifyKeys = Object.freeze([
  "error",
  "info",
  "success",
  "warning",
]);
export const desktopV3AllowedTypographySurface = Object.freeze([
  "const:typography",
]);
export const desktopV3AllowedTypographyKeys = Object.freeze([
  "body",
  "bodySm",
  "caption",
  "cardTitle",
  "code",
  "label",
  "pageTitle",
  "sectionTitle",
]);
export const desktopV3AllowedUtilsSurface = Object.freeze([
  "fn:cn",
]);

export const desktopV3AllowedAppErrorExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/errors/normalize-command-error.ts",
  "apps/desktop-v3/src/lib/runtime/mock-command-runtime.ts",
]);
export const desktopV3AllowedErrorSupportDetailsExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/components/states/error-state.tsx",
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedNormalizeCommandErrorExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/errors/error-support-details.ts",
  "apps/desktop-v3/src/lib/query/query-retry-policy.ts",
  "apps/desktop-v3/src/lib/runtime/tauri-command-runtime.ts",
]);
export const desktopV3AllowedQueryClientExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/providers/app-providers.tsx",
]);
export const desktopV3AllowedQueryRetryPolicyExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/lib/query/query-client.ts",
]);
export const desktopV3AllowedNotifyExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/hooks/use-keyboard-shortcuts.ts",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedTypographyExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/page-header.tsx",
  "apps/desktop-v3/src/pages/dashboard-page.tsx",
  "apps/desktop-v3/src/pages/diagnostics-page.tsx",
  "apps/desktop-v3/src/pages/preferences-page.tsx",
]);
export const desktopV3AllowedUtilsExternalReferenceFiles = Object.freeze([
  "apps/desktop-v3/src/app/layout/shell-scaffold.tsx",
  "apps/desktop-v3/src/app/layout/sidebar.tsx",
  "apps/desktop-v3/src/components/navigation/nav-item.tsx",
  "apps/desktop-v3/src/components/ui/badge.tsx",
  "apps/desktop-v3/src/components/ui/button.tsx",
  "apps/desktop-v3/src/components/ui/card.tsx",
  "apps/desktop-v3/src/components/ui/separator.tsx",
  "apps/desktop-v3/src/components/ui/skeleton.tsx",
  "apps/desktop-v3/src/components/ui/tooltip.tsx",
]);

function resolveRunId(env, now) {
  const explicitRunId = env.AIGCFOX_DESKTOP_V3_SUPPORT_GOVERNANCE_RUN_ID?.trim();

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

function sortNamedEntries(entries) {
  return [...entries].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);

    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    return left.name.localeCompare(right.name);
  });
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

function addViolation(violations, seenViolations, violation) {
  const key = [
    violation.filePath,
    violation.line,
    violation.column,
    violation.kind,
    violation.detail,
  ].join(":");

  if (seenViolations.has(key)) {
    return;
  }

  seenViolations.add(key);
  violations.push(violation);
}

function compareStringSets(actualValues, expectedValues) {
  return JSON.stringify(sortStrings(actualValues)) === JSON.stringify(sortStrings(expectedValues));
}

function addSurfaceDriftViolation({
  actualSurface,
  detail,
  entries,
  expectedSurface,
  filePath,
  kind,
  violations,
  seenViolations,
}) {
  if (compareStringSets(actualSurface, expectedSurface)) {
    return;
  }

  addViolation(violations, seenViolations, {
    column: 1,
    detail,
    filePath,
    kind,
    line: entries[0]?.line ?? 1,
  });
}

function formatDeclarationSurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.kind}:${entry.name}`));
}

function formatPropertySurface(entries) {
  return sortStrings(entries.map((entry) => `${entry.name}: ${entry.typeText}`));
}

function formatNamedSurface(entries) {
  return sortStrings(entries.map((entry) => entry.name));
}

function createTypeScriptSourceFile(sourceText, absoluteFilePath) {
  return ts.createSourceFile(
    absoluteFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    absoluteFilePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function lineOfNode(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function normalizeTypeScriptPropertyName(nameNode, sourceFile) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteralLike(nameNode)) {
    return nameNode.text;
  }

  return nameNode.getText(sourceFile);
}

function unwrapObjectLiteralExpression(expression) {
  let currentExpression = expression;

  while (
    ts.isAsExpression(currentExpression)
    || ts.isParenthesizedExpression(currentExpression)
    || ts.isSatisfiesExpression(currentExpression)
    || ts.isTypeAssertionExpression(currentExpression)
  ) {
    currentExpression = currentExpression.expression;
  }

  return ts.isObjectLiteralExpression(currentExpression) ? currentExpression : null;
}

function collectTypeScriptObjectLiteralKeyEntries(
  sourceText,
  absoluteFilePath,
  constName,
  options = {},
) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const filePath = normalizeWorkspaceRelativePath(workspaceRoot, absoluteFilePath);
  const sourceFile = createTypeScriptSourceFile(sourceText, absoluteFilePath);
  const entries = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name)
        || declaration.name.text !== constName
        || declaration.initializer === undefined
      ) {
        continue;
      }

      const objectLiteral = unwrapObjectLiteralExpression(declaration.initializer);

      if (!objectLiteral) {
        continue;
      }

      for (const property of objectLiteral.properties) {
        if (
          !ts.isPropertyAssignment(property)
          && !ts.isShorthandPropertyAssignment(property)
          && !ts.isMethodDeclaration(property)
        ) {
          continue;
        }

        if (property.name === undefined) {
          continue;
        }

        entries.push({
          filePath,
          line: lineOfNode(sourceFile, property),
          name: normalizeTypeScriptPropertyName(property.name, sourceFile),
        });
      }
    }
  }

  return sortNamedEntries(entries);
}

function collectReferenceEntries({
  config,
  filePaths,
  readSourceText,
  selfFilePath,
}) {
  const references = [];

  return Promise.all(
    filePaths.map(async (absoluteFilePath) => {
      const filePath = normalizeWorkspaceRelativePath(config.rootDir, absoluteFilePath);

      if (filePath === selfFilePath) {
        return;
      }

      const sourceText = await readSourceText(absoluteFilePath);
      const moduleReferences = collectTypeScriptModuleReferenceEntries(
        sourceText,
        absoluteFilePath,
        { rootDir: config.rootDir },
      );

      for (const reference of moduleReferences) {
        if (reference.resolvedFilePath === selfFilePath) {
          references.push(reference);
        }
      }
    }),
  ).then(() =>
    references.sort((left, right) => {
      const fileCompare = left.filePath.localeCompare(right.filePath);

      if (fileCompare !== 0) {
        return fileCompare;
      }

      if (left.line !== right.line) {
        return left.line - right.line;
      }

      return left.column - right.column;
    }));
}

function addExternalReferenceViolations({
  actualReferenceEntries,
  allowedExternalReferenceFiles,
  detail,
  kind,
  seenViolations,
  violations,
}) {
  const actualReferenceFiles = sortStrings(new Set(actualReferenceEntries.map((entry) => entry.filePath)));

  for (const reference of actualReferenceEntries) {
    if (allowedExternalReferenceFiles.includes(reference.filePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: reference.column,
      detail,
      filePath: reference.filePath,
      kind,
      line: reference.line,
    });
  }

  for (const expectedFilePath of allowedExternalReferenceFiles) {
    if (actualReferenceFiles.includes(expectedFilePath)) {
      continue;
    }

    addViolation(violations, seenViolations, {
      column: 1,
      detail: `${detail} Frozen Wave 1 external reference ${expectedFilePath} is missing; rewrite the support boundary before changing this ownership edge.`,
      filePath: expectedFilePath,
      kind: `${kind}-missing`,
      line: 1,
    });
  }
}

export async function collectDesktopV3SupportGovernanceViolations(config, options = {}) {
  const readFileImpl = options.readFileImpl ?? fs.readFile;
  const sourceFilePaths = Array.isArray(options.sourceFilePaths)
    ? options.sourceFilePaths
    : await listDesktopV3SourceFiles(config, options);
  const violations = [];
  const seenViolations = new Set();
  const sourceTextByAbsolutePath = new Map();

  async function readSourceText(filePath) {
    if (!sourceTextByAbsolutePath.has(filePath)) {
      const sourceText = await readFileImpl(filePath, "utf8");
      sourceTextByAbsolutePath.set(filePath, sourceText);
    }

    return sourceTextByAbsolutePath.get(filePath);
  }

  const scannedFiles = sortStrings(
    new Set(sourceFilePaths.map((filePath) => normalizeWorkspaceRelativePath(config.rootDir, filePath))),
  );
  const supportFiles = scannedFiles.filter((filePath) =>
    config.supportScopePrefixes.some((prefix) => filePath.startsWith(prefix))
    || config.supportStandaloneFiles.includes(filePath));

  addSurfaceDriftViolation({
    actualSurface: supportFiles,
    detail: `renderer support file set drifted from the frozen Wave 1 boundary (${config.allowedSupportFiles.join(", ")}). Rewrite the shared support layer before splitting or adding files here.`,
    entries: supportFiles.map((filePath) => ({ filePath, line: 1 })),
    expectedSurface: config.allowedSupportFiles,
    filePath: "apps/desktop-v3/src/lib",
    kind: "support-file-set-drift",
    violations,
    seenViolations,
  });

  const appErrorSource = await readSourceText(config.appErrorFilePath);
  const errorSupportDetailsSource = await readSourceText(config.errorSupportDetailsFilePath);
  const normalizeCommandErrorSource = await readSourceText(config.normalizeCommandErrorFilePath);
  const queryClientSource = await readSourceText(config.queryClientFilePath);
  const queryRetryPolicySource = await readSourceText(config.queryRetryPolicyFilePath);
  const notifySource = await readSourceText(config.notifyFilePath);
  const typographySource = await readSourceText(config.typographyFilePath);
  const utilsSource = await readSourceText(config.utilsFilePath);

  const appErrorFile = normalizeWorkspaceRelativePath(config.rootDir, config.appErrorFilePath);
  const errorSupportDetailsFile = normalizeWorkspaceRelativePath(
    config.rootDir,
    config.errorSupportDetailsFilePath,
  );
  const normalizeCommandErrorFile = normalizeWorkspaceRelativePath(
    config.rootDir,
    config.normalizeCommandErrorFilePath,
  );
  const queryClientFile = normalizeWorkspaceRelativePath(config.rootDir, config.queryClientFilePath);
  const queryRetryPolicyFile = normalizeWorkspaceRelativePath(
    config.rootDir,
    config.queryRetryPolicyFilePath,
  );
  const notifyFile = normalizeWorkspaceRelativePath(config.rootDir, config.notifyFilePath);
  const typographyFile = normalizeWorkspaceRelativePath(config.rootDir, config.typographyFilePath);
  const utilsFile = normalizeWorkspaceRelativePath(config.rootDir, config.utilsFilePath);

  const appErrorDeclarations = collectTypeScriptTopLevelDeclarations(
    appErrorSource,
    config.appErrorFilePath,
    { rootDir: config.rootDir },
  );
  const appErrorSurface = formatDeclarationSurface(appErrorDeclarations);
  const appErrorShapeProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      appErrorSource,
      config.appErrorFilePath,
      "AppErrorShape",
      { rootDir: config.rootDir },
    ),
  );

  const errorSupportDetailsDeclarations = collectTypeScriptTopLevelDeclarations(
    errorSupportDetailsSource,
    config.errorSupportDetailsFilePath,
    { rootDir: config.rootDir },
  );
  const errorSupportDetailsSurface = formatDeclarationSurface(errorSupportDetailsDeclarations);
  const errorSupportDetailProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      errorSupportDetailsSource,
      config.errorSupportDetailsFilePath,
      "ErrorSupportDetail",
      { rootDir: config.rootDir },
    ),
  );

  const normalizeCommandErrorDeclarations = collectTypeScriptTopLevelDeclarations(
    normalizeCommandErrorSource,
    config.normalizeCommandErrorFilePath,
    { rootDir: config.rootDir },
  );
  const normalizeCommandErrorSurface = formatDeclarationSurface(normalizeCommandErrorDeclarations);
  const commandErrorPayloadProperties = formatPropertySurface(
    collectTypeScriptInterfaceProperties(
      normalizeCommandErrorSource,
      config.normalizeCommandErrorFilePath,
      "CommandErrorPayload",
      { rootDir: config.rootDir },
    ),
  );

  const queryClientDeclarations = collectTypeScriptTopLevelDeclarations(
    queryClientSource,
    config.queryClientFilePath,
    { rootDir: config.rootDir },
  );
  const queryClientSurface = formatDeclarationSurface(queryClientDeclarations);

  const queryRetryPolicyDeclarations = collectTypeScriptTopLevelDeclarations(
    queryRetryPolicySource,
    config.queryRetryPolicyFilePath,
    { rootDir: config.rootDir },
  );
  const queryRetryPolicySurface = formatDeclarationSurface(queryRetryPolicyDeclarations);

  const notifyDeclarations = collectTypeScriptTopLevelDeclarations(
    notifySource,
    config.notifyFilePath,
    { rootDir: config.rootDir },
  );
  const notifySurface = formatDeclarationSurface(notifyDeclarations);
  const notifyKeyEntries = collectTypeScriptObjectLiteralKeyEntries(
    notifySource,
    config.notifyFilePath,
    "notify",
    { rootDir: config.rootDir },
  );
  const notifyKeys = formatNamedSurface(notifyKeyEntries);

  const typographyDeclarations = collectTypeScriptTopLevelDeclarations(
    typographySource,
    config.typographyFilePath,
    { rootDir: config.rootDir },
  );
  const typographySurface = formatDeclarationSurface(typographyDeclarations);
  const typographyKeyEntries = collectTypeScriptObjectLiteralKeyEntries(
    typographySource,
    config.typographyFilePath,
    "typography",
    { rootDir: config.rootDir },
  );
  const typographyKeys = formatNamedSurface(typographyKeyEntries);

  const utilsDeclarations = collectTypeScriptTopLevelDeclarations(
    utilsSource,
    config.utilsFilePath,
    { rootDir: config.rootDir },
  );
  const utilsSurface = formatDeclarationSurface(utilsDeclarations);

  addSurfaceDriftViolation({
    actualSurface: appErrorSurface,
    detail: `app-error drifted from the frozen Wave 1 support surface (${config.allowedAppErrorSurface.join(", ")}). Rewrite command-error normalization before widening it.`,
    entries: appErrorDeclarations,
    expectedSurface: config.allowedAppErrorSurface,
    filePath: appErrorFile,
    kind: "app-error-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: appErrorShapeProperties,
    detail: `AppErrorShape drifted from the frozen Wave 1 support contract (${config.allowedAppErrorShapeProperties.join(", ")}). Rewrite command-error normalization before changing this payload shape.`,
    entries: collectTypeScriptInterfaceProperties(
      appErrorSource,
      config.appErrorFilePath,
      "AppErrorShape",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedAppErrorShapeProperties,
    filePath: appErrorFile,
    kind: "app-error-shape-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: errorSupportDetailsSurface,
    detail: `error-support-details drifted from the frozen Wave 1 support surface (${config.allowedErrorSupportDetailsSurface.join(", ")}). Rewrite renderer error presentation support before widening it.`,
    entries: errorSupportDetailsDeclarations,
    expectedSurface: config.allowedErrorSupportDetailsSurface,
    filePath: errorSupportDetailsFile,
    kind: "error-support-details-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: errorSupportDetailProperties,
    detail: `ErrorSupportDetail drifted from the frozen Wave 1 error presentation contract (${config.allowedErrorSupportDetailProperties.join(", ")}). Rewrite renderer error support details before changing this shape.`,
    entries: collectTypeScriptInterfaceProperties(
      errorSupportDetailsSource,
      config.errorSupportDetailsFilePath,
      "ErrorSupportDetail",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedErrorSupportDetailProperties,
    filePath: errorSupportDetailsFile,
    kind: "error-support-detail-prop-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: normalizeCommandErrorSurface,
    detail: `normalize-command-error drifted from the frozen Wave 1 support surface (${config.allowedNormalizeCommandErrorSurface.join(", ")}). Rewrite renderer error normalization before widening it.`,
    entries: normalizeCommandErrorDeclarations,
    expectedSurface: config.allowedNormalizeCommandErrorSurface,
    filePath: normalizeCommandErrorFile,
    kind: "normalize-command-error-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: commandErrorPayloadProperties,
    detail: `CommandErrorPayload drifted from the frozen Wave 1 command-error contract (${config.allowedCommandErrorPayloadProperties.join(", ")}). Rewrite renderer error normalization before changing this payload shape.`,
    entries: collectTypeScriptInterfaceProperties(
      normalizeCommandErrorSource,
      config.normalizeCommandErrorFilePath,
      "CommandErrorPayload",
      { rootDir: config.rootDir },
    ),
    expectedSurface: config.allowedCommandErrorPayloadProperties,
    filePath: normalizeCommandErrorFile,
    kind: "command-error-payload-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: queryClientSurface,
    detail: `query-client drifted from the frozen Wave 1 support surface (${config.allowedQueryClientSurface.join(", ")}). Rewrite shared QueryClient ownership before widening it.`,
    entries: queryClientDeclarations,
    expectedSurface: config.allowedQueryClientSurface,
    filePath: queryClientFile,
    kind: "query-client-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: queryRetryPolicySurface,
    detail: `query-retry-policy drifted from the frozen Wave 1 support surface (${config.allowedQueryRetryPolicySurface.join(", ")}). Rewrite shared retry policy before widening it.`,
    entries: queryRetryPolicyDeclarations,
    expectedSurface: config.allowedQueryRetryPolicySurface,
    filePath: queryRetryPolicyFile,
    kind: "query-retry-policy-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: notifySurface,
    detail: `notify drifted from the frozen Wave 1 support surface (${config.allowedNotifySurface.join(", ")}). Rewrite toast support ownership before widening it.`,
    entries: notifyDeclarations,
    expectedSurface: config.allowedNotifySurface,
    filePath: notifyFile,
    kind: "notify-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: notifyKeys,
    detail: `notify key set drifted from the frozen Wave 1 toast support contract (${config.allowedNotifyKeys.join(", ")}). Rewrite shared toast support before changing available notification channels.`,
    entries: notifyKeyEntries,
    expectedSurface: config.allowedNotifyKeys,
    filePath: notifyFile,
    kind: "notify-key-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: typographySurface,
    detail: `typography drifted from the frozen Wave 1 support surface (${config.allowedTypographySurface.join(", ")}). Rewrite renderer typography support before widening it.`,
    entries: typographyDeclarations,
    expectedSurface: config.allowedTypographySurface,
    filePath: typographyFile,
    kind: "typography-surface-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: typographyKeys,
    detail: `typography key set drifted from the frozen Wave 1 typography contract (${config.allowedTypographyKeys.join(", ")}). Rewrite renderer typography support before changing available type tokens.`,
    entries: typographyKeyEntries,
    expectedSurface: config.allowedTypographyKeys,
    filePath: typographyFile,
    kind: "typography-key-drift",
    violations,
    seenViolations,
  });
  addSurfaceDriftViolation({
    actualSurface: utilsSurface,
    detail: `utils drifted from the frozen Wave 1 support surface (${config.allowedUtilsSurface.join(", ")}). Rewrite shared class merge support before widening it.`,
    entries: utilsDeclarations,
    expectedSurface: config.allowedUtilsSurface,
    filePath: utilsFile,
    kind: "utils-surface-drift",
    violations,
    seenViolations,
  });

  const appErrorReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: appErrorFile,
  });
  const errorSupportDetailsReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: errorSupportDetailsFile,
  });
  const normalizeCommandErrorReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: normalizeCommandErrorFile,
  });
  const queryClientReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: queryClientFile,
  });
  const queryRetryPolicyReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: queryRetryPolicyFile,
  });
  const notifyReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: notifyFile,
  });
  const typographyReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: typographyFile,
  });
  const utilsReferenceEntries = await collectReferenceEntries({
    config,
    filePaths: sourceFilePaths,
    readSourceText,
    selfFilePath: utilsFile,
  });

  const appErrorReferenceFiles = sortStrings(new Set(appErrorReferenceEntries.map((entry) => entry.filePath)));
  const errorSupportDetailsReferenceFiles = sortStrings(
    new Set(errorSupportDetailsReferenceEntries.map((entry) => entry.filePath)),
  );
  const normalizeCommandErrorReferenceFiles = sortStrings(
    new Set(normalizeCommandErrorReferenceEntries.map((entry) => entry.filePath)),
  );
  const queryClientReferenceFiles = sortStrings(new Set(queryClientReferenceEntries.map((entry) => entry.filePath)));
  const queryRetryPolicyReferenceFiles = sortStrings(
    new Set(queryRetryPolicyReferenceEntries.map((entry) => entry.filePath)),
  );
  const notifyReferenceFiles = sortStrings(new Set(notifyReferenceEntries.map((entry) => entry.filePath)));
  const typographyReferenceFiles = sortStrings(new Set(typographyReferenceEntries.map((entry) => entry.filePath)));
  const utilsReferenceFiles = sortStrings(new Set(utilsReferenceEntries.map((entry) => entry.filePath)));

  addExternalReferenceViolations({
    actualReferenceEntries: appErrorReferenceEntries,
    allowedExternalReferenceFiles: config.allowedAppErrorExternalReferenceFiles,
    detail: `app-error escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedAppErrorExternalReferenceFiles.join(", ")} may hold AppError directly.`,
    kind: "app-error-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: errorSupportDetailsReferenceEntries,
    allowedExternalReferenceFiles: config.allowedErrorSupportDetailsExternalReferenceFiles,
    detail: `error-support-details escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedErrorSupportDetailsExternalReferenceFiles.join(", ")} may hold renderer error support details directly.`,
    kind: "error-support-details-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: normalizeCommandErrorReferenceEntries,
    allowedExternalReferenceFiles: config.allowedNormalizeCommandErrorExternalReferenceFiles,
    detail: `normalize-command-error escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedNormalizeCommandErrorExternalReferenceFiles.join(", ")} may hold renderer command-error normalization directly.`,
    kind: "normalize-command-error-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: queryClientReferenceEntries,
    allowedExternalReferenceFiles: config.allowedQueryClientExternalReferenceFiles,
    detail: `query-client escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedQueryClientExternalReferenceFiles.join(", ")} may hold the shared QueryClient singleton directly.`,
    kind: "query-client-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: queryRetryPolicyReferenceEntries,
    allowedExternalReferenceFiles: config.allowedQueryRetryPolicyExternalReferenceFiles,
    detail: `query-retry-policy escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedQueryRetryPolicyExternalReferenceFiles.join(", ")} may hold shouldRetryDesktopQuery directly.`,
    kind: "query-retry-policy-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: notifyReferenceEntries,
    allowedExternalReferenceFiles: config.allowedNotifyExternalReferenceFiles,
    detail: `notify escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedNotifyExternalReferenceFiles.join(", ")} may hold toast support directly.`,
    kind: "notify-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: typographyReferenceEntries,
    allowedExternalReferenceFiles: config.allowedTypographyExternalReferenceFiles,
    detail: `typography escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedTypographyExternalReferenceFiles.join(", ")} may hold shared typography tokens directly.`,
    kind: "typography-external-reference",
    seenViolations,
    violations,
  });
  addExternalReferenceViolations({
    actualReferenceEntries: utilsReferenceEntries,
    allowedExternalReferenceFiles: config.allowedUtilsExternalReferenceFiles,
    detail: `utils escaped the frozen Wave 1 support ownership boundary. Only ${config.allowedUtilsExternalReferenceFiles.join(", ")} may hold cn directly.`,
    kind: "utils-external-reference",
    seenViolations,
    violations,
  });

  return {
    appErrorReferenceFiles,
    appErrorShapeProperties,
    appErrorSurface,
    commandErrorPayloadProperties,
    errorSupportDetailProperties,
    errorSupportDetailsReferenceFiles,
    errorSupportDetailsSurface,
    normalizeCommandErrorReferenceFiles,
    normalizeCommandErrorSurface,
    notifyKeys,
    notifyReferenceFiles,
    notifySurface,
    queryClientReferenceFiles,
    queryClientSurface,
    queryRetryPolicyReferenceFiles,
    queryRetryPolicySurface,
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    supportFiles,
    typographyKeys,
    typographyReferenceFiles,
    typographySurface,
    utilsReferenceFiles,
    utilsSurface,
    violations: sortViolations(violations),
  };
}

export function createDesktopV3SupportGovernanceSummary(config) {
  return decorateVerificationArtifactRefs(
    {
      allowedAppErrorExternalReferenceFiles: [...config.allowedAppErrorExternalReferenceFiles],
      allowedAppErrorShapeProperties: [...config.allowedAppErrorShapeProperties],
      allowedAppErrorSurface: [...config.allowedAppErrorSurface],
      allowedCommandErrorPayloadProperties: [...config.allowedCommandErrorPayloadProperties],
      allowedErrorSupportDetailProperties: [...config.allowedErrorSupportDetailProperties],
      allowedErrorSupportDetailsExternalReferenceFiles: [
        ...config.allowedErrorSupportDetailsExternalReferenceFiles,
      ],
      allowedErrorSupportDetailsSurface: [...config.allowedErrorSupportDetailsSurface],
      allowedNormalizeCommandErrorExternalReferenceFiles: [
        ...config.allowedNormalizeCommandErrorExternalReferenceFiles,
      ],
      allowedNormalizeCommandErrorSurface: [...config.allowedNormalizeCommandErrorSurface],
      allowedNotifyExternalReferenceFiles: [...config.allowedNotifyExternalReferenceFiles],
      allowedNotifyKeys: [...config.allowedNotifyKeys],
      allowedNotifySurface: [...config.allowedNotifySurface],
      allowedQueryClientExternalReferenceFiles: [...config.allowedQueryClientExternalReferenceFiles],
      allowedQueryClientSurface: [...config.allowedQueryClientSurface],
      allowedQueryRetryPolicyExternalReferenceFiles: [
        ...config.allowedQueryRetryPolicyExternalReferenceFiles,
      ],
      allowedQueryRetryPolicySurface: [...config.allowedQueryRetryPolicySurface],
      allowedSupportFiles: [...config.allowedSupportFiles],
      allowedTypographyExternalReferenceFiles: [...config.allowedTypographyExternalReferenceFiles],
      allowedTypographyKeys: [...config.allowedTypographyKeys],
      allowedTypographySurface: [...config.allowedTypographySurface],
      allowedUtilsExternalReferenceFiles: [...config.allowedUtilsExternalReferenceFiles],
      allowedUtilsSurface: [...config.allowedUtilsSurface],
      appErrorReferenceFiles: [],
      appErrorShapeProperties: [],
      appErrorSurface: [],
      commandErrorPayloadProperties: [],
      error: null,
      errorSupportDetailProperties: [],
      errorSupportDetailsReferenceFiles: [],
      errorSupportDetailsSurface: [],
      latestSummaryPath: config.latestSummaryPath,
      normalizeCommandErrorReferenceFiles: [],
      normalizeCommandErrorSurface: [],
      notifyKeys: [],
      notifyReferenceFiles: [],
      notifySurface: [],
      outputDir: config.outputDir,
      queryClientReferenceFiles: [],
      queryClientSurface: [],
      queryRetryPolicyReferenceFiles: [],
      queryRetryPolicySurface: [],
      runId: config.runId,
      scannedFileCount: 0,
      scannedFiles: [],
      status: "running",
      summaryPath: config.summaryPath,
      supportFiles: [],
      typographyKeys: [],
      typographyReferenceFiles: [],
      typographySurface: [],
      utilsReferenceFiles: [],
      utilsSurface: [],
      violationCount: 0,
      violations: [],
    },
    config.rootDir,
    ["latestSummaryPath", "outputDir", "summaryPath"],
  );
}

export function buildDesktopV3SupportGovernanceFailureMessage(summary) {
  return [
    `desktop-v3 support governance check failed with ${summary.violationCount} violation(s).`,
    ...summary.violations.map((violation) =>
      `- ${violation.filePath}:${violation.line}:${violation.column} [${violation.kind}] ${violation.detail}`),
    `Summary: ${summary.summaryPath}`,
  ].join("\n");
}

export function resolveDesktopV3SupportGovernanceConfig(options = {}) {
  const workspaceRoot = options.rootDir ?? rootDir;
  const env = options.env ?? process.env;
  const now = options.now instanceof Date ? options.now : new Date();
  const runId = resolveRunId(env, now);
  const outputDir =
    env.AIGCFOX_DESKTOP_V3_SUPPORT_GOVERNANCE_OUTPUT_DIR?.trim() ||
    path.join(workspaceRoot, "output", "verification", `desktop-v3-support-governance-${runId}`);

  return {
    allowedAppErrorExternalReferenceFiles: desktopV3AllowedAppErrorExternalReferenceFiles,
    allowedAppErrorShapeProperties: desktopV3AllowedAppErrorShapeProperties,
    allowedAppErrorSurface: desktopV3AllowedAppErrorSurface,
    allowedCommandErrorPayloadProperties: desktopV3AllowedCommandErrorPayloadProperties,
    allowedErrorSupportDetailProperties: desktopV3AllowedErrorSupportDetailProperties,
    allowedErrorSupportDetailsExternalReferenceFiles:
      desktopV3AllowedErrorSupportDetailsExternalReferenceFiles,
    allowedErrorSupportDetailsSurface: desktopV3AllowedErrorSupportDetailsSurface,
    allowedNormalizeCommandErrorExternalReferenceFiles:
      desktopV3AllowedNormalizeCommandErrorExternalReferenceFiles,
    allowedNormalizeCommandErrorSurface: desktopV3AllowedNormalizeCommandErrorSurface,
    allowedNotifyExternalReferenceFiles: desktopV3AllowedNotifyExternalReferenceFiles,
    allowedNotifyKeys: desktopV3AllowedNotifyKeys,
    allowedNotifySurface: desktopV3AllowedNotifySurface,
    allowedQueryClientExternalReferenceFiles: desktopV3AllowedQueryClientExternalReferenceFiles,
    allowedQueryClientSurface: desktopV3AllowedQueryClientSurface,
    allowedQueryRetryPolicyExternalReferenceFiles:
      desktopV3AllowedQueryRetryPolicyExternalReferenceFiles,
    allowedQueryRetryPolicySurface: desktopV3AllowedQueryRetryPolicySurface,
    allowedSupportFiles: desktopV3SupportFileSet,
    allowedTypographyExternalReferenceFiles: desktopV3AllowedTypographyExternalReferenceFiles,
    allowedTypographyKeys: desktopV3AllowedTypographyKeys,
    allowedTypographySurface: desktopV3AllowedTypographySurface,
    allowedUtilsExternalReferenceFiles: desktopV3AllowedUtilsExternalReferenceFiles,
    allowedUtilsSurface: desktopV3AllowedUtilsSurface,
    appErrorFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/errors/app-error.ts"),
    errorSupportDetailsFilePath: path.join(
      workspaceRoot,
      "apps/desktop-v3/src/lib/errors/error-support-details.ts",
    ),
    latestSummaryPath: resolveLatestVerificationSummaryPath(
      workspaceRoot,
      "desktop-v3-support-governance-summary.json",
    ),
    normalizeCommandErrorFilePath: path.join(
      workspaceRoot,
      "apps/desktop-v3/src/lib/errors/normalize-command-error.ts",
    ),
    notifyFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/notify.ts"),
    outputDir,
    queryClientFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/query/query-client.ts"),
    queryRetryPolicyFilePath: path.join(
      workspaceRoot,
      "apps/desktop-v3/src/lib/query/query-retry-policy.ts",
    ),
    rootDir: workspaceRoot,
    runId,
    sourceDir: path.join(workspaceRoot, desktopV3SourceDir),
    summaryPath: path.join(outputDir, "summary.json"),
    supportScopePrefixes: desktopV3SupportScopePrefixes,
    supportStandaloneFiles: desktopV3SupportStandaloneFiles,
    typographyFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/typography.ts"),
    utilsFilePath: path.join(workspaceRoot, "apps/desktop-v3/src/lib/utils.ts"),
  };
}
