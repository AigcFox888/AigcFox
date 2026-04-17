import path from "node:path";

function normalizePathSeparators(value) {
  return value.split(path.sep).join("/");
}

function resolveArtifactPath(rootDir, targetPath) {
  if (typeof targetPath !== "string" || targetPath.trim().length === 0) {
    return null;
  }

  const trimmedPath = targetPath.trim();
  return path.isAbsolute(trimmedPath) ? trimmedPath : path.resolve(rootDir, trimmedPath);
}

export function createVerificationArtifactRef(rootDir, targetPath) {
  const absolutePath = resolveArtifactPath(rootDir, targetPath);

  if (absolutePath === null) {
    return null;
  }

  const workspaceRelativePath = normalizePathSeparators(path.relative(rootDir, absolutePath));
  const isInsideWorkspace =
    workspaceRelativePath.length > 0 &&
    workspaceRelativePath !== ".." &&
    !workspaceRelativePath.startsWith("../");

  return {
    absolutePath,
    workspaceRelativePath: isInsideWorkspace ? workspaceRelativePath : null,
  };
}

export function decorateVerificationArtifactRefs(target, rootDir, keys) {
  for (const key of keys) {
    target[`${key}Ref`] = createVerificationArtifactRef(rootDir, target[key]);
  }

  return target;
}
