export function createGithubRemoteProofTestConfigBuilder(defaults) {
  return function buildConfig(overrides = {}) {
    return {
      owner: "AigcFox888",
      repo: "AigcFox",
      rootDir: "/workspace",
      ...defaults,
      ...overrides,
    };
  };
}

export function buildWorkflowRunsByName(entries = []) {
  return new Map(entries);
}
