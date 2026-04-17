import { spawnSync } from "node:child_process";

function runGitCommand(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
    input: options.input,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr ? `git ${args.join(" ")} failed: ${stderr}` : `git ${args.join(" ")} failed.`);
  }

  return result.stdout.trim();
}

export function parseGithubRepoFromOriginUrl(originUrl) {
  const normalized = typeof originUrl === "string" ? originUrl.trim() : "";

  if (!normalized) {
    throw new Error("Cannot resolve GitHub repo because remote.origin.url is empty.");
  }

  const httpsMatch = normalized.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    };
  }

  const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
    };
  }

  throw new Error(`Unsupported GitHub remote URL format: ${normalized}`);
}

export function resolveGithubRepoContext(options = {}) {
  const cwd = options.cwd;
  const originUrl = options.originUrl ?? runGitCommand(["config", "--get", "remote.origin.url"], { cwd });
  const currentBranch = options.currentBranch ?? runGitCommand(["branch", "--show-current"], { cwd });
  const repo = parseGithubRepoFromOriginUrl(originUrl);

  return {
    currentBranch,
    originUrl,
    owner: repo.owner,
    repo: repo.repo,
  };
}

export function resolveGithubCredentialFromGit(options = {}) {
  const cwd = options.cwd;
  const request = options.request ?? "protocol=https\nhost=github.com\n\n";
  const raw = options.rawCredentialOutput ?? runGitCommand(["credential", "fill"], { cwd, input: request });
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const entries = Object.fromEntries(lines.map((line) => line.split("=", 2)));
  const username = entries.username?.trim();
  const password = entries.password?.trim();

  if (!username || !password) {
    throw new Error("GitHub credential helper returned incomplete credentials for github.com.");
  }

  return {
    password,
    username,
  };
}

export function buildGithubApiAuthorizationHeader(credentials) {
  const token = Buffer.from(`${credentials.username}:${credentials.password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

export async function requestGithubApiJson(url, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: options.authorizationHeader,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status} ${response.statusText}) for ${url}.`);
  }

  return response.json();
}
