export function extractQuotedWorkflowPathEntries(workflowText, eventName) {
  const pattern = new RegExp(`${eventName}:\\n[\\s\\S]*?paths:\\n((?:\\s+- .+\\n)+)`);
  const match = workflowText.match(pattern);

  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]).sort();
}

export function buildSortedWorkflowPathSurface(workflowPath, extraPaths, documentFiles) {
  return Array.from(new Set([workflowPath, ...extraPaths, ...documentFiles])).sort();
}
