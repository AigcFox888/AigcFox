import process from "node:process";
import { fileURLToPath } from "node:url";

export function buildGithubRemoteProofCliHelpText(options) {
  return [
    options.title,
    "",
    options.description,
    "",
    "Environment overrides:",
    ...options.environmentOverrides.map((entry) => `  ${entry}`),
    "",
    "The command resolves GitHub credentials through `git credential fill` and never prints credential values.",
  ].join("\n");
}

export async function runGithubRemoteProofCli(options, argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(buildGithubRemoteProofCliHelpText(options));
    return null;
  }

  const summary = await options.runProof();

  if (summary.status === "passed") {
    console.log(`${options.successLabel} passed. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`);
    return summary;
  }

  throw new Error(
    `${options.failureLabel} is incomplete. Failed checks: ${summary.failedChecks.join(", ")}. Summary: ${summary.summaryPath} | Latest: ${summary.latestSummaryPath}`,
  );
}

export function attachCliModuleMain(importMetaUrl, main) {
  if (process.argv[1] !== fileURLToPath(importMetaUrl)) {
    return;
  }

  main()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
