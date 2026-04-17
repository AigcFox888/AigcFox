const DEFAULT_RUNS_PER_PAGE = 100;
const DEFAULT_MAX_RUN_PAGES = 10;

function normalizeWorkflow(workflow) {
  if (!workflow) {
    return null;
  }

  return {
    id: workflow.id ?? null,
    name: workflow.name ?? "",
    path: workflow.path ?? "",
    state: workflow.state ?? "",
  };
}

function normalizeRun(run) {
  if (!run) {
    return null;
  }

  return {
    databaseId: run.id ?? null,
    conclusion: run.conclusion ?? null,
    createdAt: run.created_at ?? null,
    event: run.event ?? null,
    headBranch: run.head_branch ?? null,
    headSha: run.head_sha ?? null,
    htmlUrl: run.html_url ?? null,
    runNumber: run.run_number ?? null,
    status: run.status ?? null,
  };
}

function isSuccessfulCompletedRun(run) {
  return run?.status === "completed" && run?.conclusion === "success";
}

function resolveWorkflowRuns(workflowRunsByName, workflowName) {
  if (workflowRunsByName instanceof Map) {
    return workflowRunsByName.get(workflowName) ?? [];
  }

  if (workflowRunsByName && typeof workflowRunsByName === "object") {
    return workflowRunsByName[workflowName] ?? [];
  }

  return [];
}

export function buildGithubWorkflowRunsUrl(baseUrl, workflowId, options = {}) {
  const params = new URLSearchParams();
  params.set("per_page", String(options.perPage ?? DEFAULT_RUNS_PER_PAGE));
  params.set("page", String(options.page ?? 1));

  if (options.expectedBranch) {
    params.set("branch", options.expectedBranch);
  }

  return `${baseUrl}/actions/workflows/${workflowId}/runs?${params.toString()}`;
}

export async function fetchGithubWorkflowRunsForRemoteProof(options) {
  const requestGithubApiJsonImpl = options.requestGithubApiJsonImpl;
  const maxPages = options.maxPages ?? DEFAULT_MAX_RUN_PAGES;
  const perPage = options.perPage ?? DEFAULT_RUNS_PER_PAGE;
  const runs = [];

  if (!options.workflowId) {
    return runs;
  }

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await requestGithubApiJsonImpl(
      buildGithubWorkflowRunsUrl(options.baseUrl, options.workflowId, {
        expectedBranch: options.expectedBranch,
        page,
        perPage,
      }),
      {
        authorizationHeader: options.authorizationHeader,
        fetchImpl: options.fetchImpl,
      },
    );
    const pageRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];

    runs.push(...pageRuns);

    if (pageRuns.length === 0) {
      break;
    }

    if (pageRuns.some(isSuccessfulCompletedRun)) {
      break;
    }

    if (pageRuns.length < perPage) {
      break;
    }
  }

  return runs;
}

export async function fetchGithubWorkflowRunsByDefinition(options) {
  const cache = new Map();
  const definitions = Array.isArray(options.definitions) ? options.definitions : [];

  async function resolveRuns(definition) {
    const cacheKey = `${definition.workflowName}::${definition.expectedBranch ?? "*"}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const workflow = options.workflowsByName.get(definition.workflowName);
    const promise = fetchGithubWorkflowRunsForRemoteProof({
      authorizationHeader: options.authorizationHeader,
      baseUrl: options.baseUrl,
      expectedBranch: definition.expectedBranch,
      fetchImpl: options.fetchImpl,
      maxPages: options.maxPages,
      perPage: options.perPage,
      requestGithubApiJsonImpl: options.requestGithubApiJsonImpl,
      workflowId: workflow?.id ?? null,
    });

    cache.set(cacheKey, promise);

    return promise;
  }

  const entries = await Promise.all(
    definitions.map(async (definition) => [definition.workflowName, await resolveRuns(definition)]),
  );

  return new Map(entries);
}

export function buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, definition) {
  const workflow = workflowsByName.get(definition.workflowName) ?? null;
  const workflowPathMatches = !definition.expectedWorkflowPath || workflow?.path === definition.expectedWorkflowPath;
  const workflowStateMatches = !definition.expectedWorkflowState || workflow?.state === definition.expectedWorkflowState;
  const candidateRuns = resolveWorkflowRuns(workflowRunsByName, definition.workflowName).filter((run) => {
    if (definition.expectedBranch && run.head_branch !== definition.expectedBranch) {
      return false;
    }

    return true;
  });
  const latestRun = candidateRuns[0] ?? null;
  const latestSuccessfulRun = candidateRuns.find(isSuccessfulCompletedRun) ?? null;
  const passed = Boolean(workflow) && workflowPathMatches && workflowStateMatches && Boolean(latestSuccessfulRun);

  let failureReason = null;
  if (!workflow) {
    failureReason = "workflow_missing";
  } else if (!workflowPathMatches) {
    failureReason = "workflow_path_mismatch";
  } else if (!workflowStateMatches) {
    failureReason = "workflow_state_mismatch";
  } else if (!latestSuccessfulRun) {
    failureReason = "successful_run_missing";
  }

  return {
    expectedBranch: definition.expectedBranch ?? null,
    expectedWorkflowPath: definition.expectedWorkflowPath ?? null,
    expectedWorkflowState: definition.expectedWorkflowState ?? null,
    failureReason,
    id: definition.id,
    latestRun: normalizeRun(latestRun),
    latestSuccessfulRun: normalizeRun(latestSuccessfulRun),
    name: definition.name,
    status: passed ? "passed" : "failed",
    workflow: normalizeWorkflow(workflow),
  };
}
