import process from "node:process";
import { attachCliModuleMain, runGithubRemoteProofCli } from "./lib/github-actions-remote-proof-cli.mjs";
import { runDesktopV3DeliveryUpdaterGithubRemoteProof } from "./lib/desktop-v3-delivery-updater-github-remote-proof.mjs";

export async function main(argv = process.argv.slice(2)) {
  return runGithubRemoteProofCli(
    {
      description:
        "Checks the repository's remote delivery/updater workflow evidence and writes a summary to output/verification.",
      environmentOverrides: [
        "AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_GITHUB_REMOTE_PROOF_RUN_ID=<run-id>",
        "AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_GITHUB_REMOTE_PROOF_OUTPUT_DIR=<absolute-output-dir>",
        "AIGCFOX_DESKTOP_V3_DELIVERY_UPDATER_REMOTE_PROOF_BRANCH=<target-branch>",
      ],
      failureLabel: "desktop-v3 delivery/updater GitHub remote proof",
      runProof: runDesktopV3DeliveryUpdaterGithubRemoteProof,
      successLabel: "desktop-v3 delivery/updater GitHub remote proof",
      title: "desktop-v3 delivery/updater GitHub remote proof checker",
    },
    argv,
  );
}

attachCliModuleMain(import.meta.url, main);
