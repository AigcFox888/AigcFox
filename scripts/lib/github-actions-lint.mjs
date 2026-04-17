import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");

export const ACTIONLINT_MODULE = "github.com/rhysd/actionlint/cmd/actionlint@v1.7.12";

export function resolveGithubActionsLintConfig(options = {}) {
  const env = options.env ?? process.env;

  return {
    args: ["run", ACTIONLINT_MODULE],
    command: "go",
    cwd: options.cwd ?? rootDir,
    env: {
      ...env,
      GOCACHE: env.GOCACHE?.trim() || "/tmp/aigcfox-actionlint-gocache",
      GOPATH: env.GOPATH?.trim() || "/tmp/aigcfox-actionlint-gopath",
    },
  };
}
