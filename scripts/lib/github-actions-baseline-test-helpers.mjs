import fs from "node:fs/promises";
import path from "node:path";

import { expect } from "vitest";

import {
  buildSortedWorkflowPathSurface,
  extractQuotedWorkflowPathEntries,
} from "./github-actions-workflow-path-surface.mjs";

export async function readWorkspaceFile(rootDir, relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), "utf8");
}

export function expectWorkflowTriggersDocumentFiles(workflowText, workflowPath, documentFiles, extraTriggerEntries = []) {
  for (const file of documentFiles) {
    expect(workflowText, `${workflowPath} should trigger on ${file}`).toContain(`"${file}"`);
  }

  for (const entry of extraTriggerEntries) {
    expect(workflowText, `${workflowPath} should trigger on ${entry}`).toContain(`"${entry}"`);
  }
}

export function expectWorkflowPathSurface(
  workflowText,
  workflowPath,
  extraPaths,
  documentFiles,
  options = {},
) {
  const expectedPaths = buildSortedWorkflowPathSurface(workflowPath, extraPaths, documentFiles);
  const expectedPullRequestPaths = options.pullRequestPaths ?? expectedPaths;

  expect(extractQuotedWorkflowPathEntries(workflowText, "push")).toEqual(expectedPaths);
  expect(extractQuotedWorkflowPathEntries(workflowText, "pull_request")).toEqual(expectedPullRequestPaths);
}

export function expectWorkflowContainsEntries(workflowText, workflowPath, requiredEntries) {
  for (const entry of requiredEntries) {
    expect(workflowText, `${workflowPath} should contain ${entry}`).toContain(entry);
  }
}

export function expectDocumentContainsEntries(documentText, documentPath, requiredEntries) {
  for (const entry of requiredEntries) {
    expect(documentText, `${documentPath} should contain ${entry}`).toContain(entry);
  }
}

export function expectWorkflowCommandOrder(workflowText, workflowPath, beforeEntry, afterEntry) {
  const beforeIndex = workflowText.indexOf(beforeEntry);
  const afterIndex = workflowText.indexOf(afterEntry);

  expect(beforeIndex, `${workflowPath} should contain ${beforeEntry}`).toBeGreaterThanOrEqual(0);
  expect(afterIndex, `${workflowPath} should contain ${afterEntry}`).toBeGreaterThanOrEqual(0);
  expect(beforeIndex, `${workflowPath} should run ${beforeEntry} before ${afterEntry}`).toBeLessThan(afterIndex);
}

export function expectWorkflowArtifactPaths(workflowText, workflowPath, artifactPaths) {
  for (const entry of artifactPaths) {
    expect(workflowText, `${workflowPath} should upload ${entry}`).toContain(entry);
  }
}
