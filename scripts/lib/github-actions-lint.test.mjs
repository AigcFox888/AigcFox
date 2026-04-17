import { describe, expect, it } from "vitest";

import { ACTIONLINT_MODULE, resolveGithubActionsLintConfig } from "./github-actions-lint.mjs";

describe("github actions lint config", () => {
  it("uses the pinned actionlint module and writable temporary Go caches by default", () => {
    const config = resolveGithubActionsLintConfig({ env: {} });

    expect(config.command).toBe("go");
    expect(config.args).toEqual(["run", ACTIONLINT_MODULE]);
    expect(config.env.GOCACHE).toBe("/tmp/aigcfox-actionlint-gocache");
    expect(config.env.GOPATH).toBe("/tmp/aigcfox-actionlint-gopath");
  });

  it("preserves explicit Go cache overrides", () => {
    const config = resolveGithubActionsLintConfig({
      env: {
        GOCACHE: "/custom/gocache",
        GOPATH: "/custom/gopath",
      },
    });

    expect(config.env.GOCACHE).toBe("/custom/gocache");
    expect(config.env.GOPATH).toBe("/custom/gopath");
  });
});
