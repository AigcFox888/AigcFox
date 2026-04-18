import {
  buildGithubApiAuthorizationHeader,
  requestGithubApiJson,
  resolveGithubCredentialFromGit,
} from "./github-repo-api.mjs";
import {
  fetchGithubLatestRunJobsByDefinition,
  fetchGithubWorkflowRunsByDefinition,
} from "./github-actions-remote-proof.mjs";
import { persistVerificationSummary } from "./verification-summary-output.mjs";

export async function runGithubWorkflowRemoteProof(options) {
  const config = options.config;
  const definitions = Array.isArray(options.definitions) ? options.definitions : [];
  const resolveGithubCredentialFromGitImpl =
    options.resolveGithubCredentialFromGitImpl ?? resolveGithubCredentialFromGit;
  const buildGithubApiAuthorizationHeaderImpl =
    options.buildGithubApiAuthorizationHeaderImpl ?? buildGithubApiAuthorizationHeader;
  const requestGithubApiJsonImpl = options.requestGithubApiJsonImpl ?? requestGithubApiJson;
  const fetchGithubWorkflowRunsByDefinitionImpl =
    options.fetchGithubWorkflowRunsByDefinitionImpl ?? fetchGithubWorkflowRunsByDefinition;
  const fetchGithubLatestRunJobsByDefinitionImpl =
    options.fetchGithubLatestRunJobsByDefinitionImpl ?? fetchGithubLatestRunJobsByDefinition;
  const persistVerificationSummaryImpl = options.persistVerificationSummaryImpl ?? persistVerificationSummary;
  const credentials =
    options.authorizationHeader || options.credentials
      ? options.credentials
      : resolveGithubCredentialFromGitImpl({
          cwd: config.rootDir,
          rawCredentialOutput: options.rawCredentialOutput,
        });
  const authorizationHeader =
    options.authorizationHeader ?? buildGithubApiAuthorizationHeaderImpl(credentials);
  const baseUrl = options.baseUrl ?? `https://api.github.com/repos/${config.owner}/${config.repo}`;
  const workflowsPayload = await requestGithubApiJsonImpl(`${baseUrl}/actions/workflows`, {
    authorizationHeader,
    fetchImpl: options.fetchImpl,
  });
  const workflows = Array.isArray(workflowsPayload?.workflows) ? workflowsPayload.workflows : [];
  const workflowsByName = new Map(workflows.map((workflow) => [workflow.name, workflow]));
  const workflowRunsByName = await fetchGithubWorkflowRunsByDefinitionImpl({
    authorizationHeader,
    baseUrl,
    definitions,
    fetchImpl: options.fetchImpl,
    maxPages: options.maxPages,
    perPage: options.perPage,
    requestGithubApiJsonImpl,
    workflowsByName,
  });
  const workflowJobsByRunId = await fetchGithubLatestRunJobsByDefinitionImpl({
    authorizationHeader,
    baseUrl,
    definitions,
    fetchImpl: options.fetchImpl,
    maxPages: options.maxPages,
    perPage: options.perPage,
    requestGithubApiJsonImpl,
    workflowRunsByName,
  });
  const summary = await options.buildSummary(config, workflowsPayload, workflowRunsByName, {
    workflowJobsByRunId,
  });

  await persistVerificationSummaryImpl(summary, {
    archiveSummaryPath: config.summaryPath,
    latestSummaryPath: config.latestSummaryPath,
  });

  return summary;
}
