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

function extractCheckRunId(checkRunUrl) {
  const normalized = typeof checkRunUrl === "string" ? checkRunUrl.trim() : "";
  const match = normalized.match(/\/check-runs\/(\d+)$/u);
  return match ? Number(match[1]) : null;
}

function normalizeJobAnnotation(annotation) {
  if (!annotation) {
    return null;
  }

  return {
    annotationLevel: annotation.annotation_level ?? "",
    endLine: annotation.end_line ?? null,
    message: annotation.message ?? "",
    path: annotation.path ?? "",
    rawDetails: annotation.raw_details ?? "",
    startLine: annotation.start_line ?? null,
    title: annotation.title ?? "",
  };
}

function normalizeWorkflowJob(job, annotations = []) {
  if (!job) {
    return null;
  }

  return {
    annotations: annotations.map(normalizeJobAnnotation).filter(Boolean),
    checkRunId: extractCheckRunId(job.check_run_url),
    conclusion: job.conclusion ?? null,
    databaseId: job.id ?? null,
    htmlUrl: job.html_url ?? null,
    labels: Array.isArray(job.labels) ? job.labels : [],
    name: job.name ?? "",
    startedAt: job.started_at ?? null,
    status: job.status ?? null,
    steps: Array.isArray(job.steps)
      ? job.steps.map((step) => ({
          conclusion: step.conclusion ?? null,
          name: step.name ?? "",
          number: step.number ?? null,
          status: step.status ?? null,
        }))
      : [],
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

export function buildGithubRunJobsUrl(baseUrl, runId, options = {}) {
  const params = new URLSearchParams();
  params.set("per_page", String(options.perPage ?? DEFAULT_RUNS_PER_PAGE));
  params.set("page", String(options.page ?? 1));
  return `${baseUrl}/actions/runs/${runId}/jobs?${params.toString()}`;
}

export async function fetchGithubCheckRunAnnotationsForRemoteProof(options) {
  const requestGithubApiJsonImpl = options.requestGithubApiJsonImpl;
  const maxPages = options.maxPages ?? DEFAULT_MAX_RUN_PAGES;
  const perPage = options.perPage ?? DEFAULT_RUNS_PER_PAGE;
  const checkRunId = options.checkRunId;
  const annotations = [];

  if (!checkRunId) {
    return annotations;
  }

  for (let page = 1; page <= maxPages; page += 1) {
    const url = `${options.baseUrl}/check-runs/${checkRunId}/annotations?per_page=${perPage}&page=${page}`;
    const pageAnnotations = await requestGithubApiJsonImpl(url, {
      authorizationHeader: options.authorizationHeader,
      fetchImpl: options.fetchImpl,
    });
    const normalizedPage = Array.isArray(pageAnnotations) ? pageAnnotations : [];

    annotations.push(...normalizedPage);

    if (normalizedPage.length < perPage) {
      break;
    }
  }

  return annotations;
}

export async function fetchGithubJobsForRunForRemoteProof(options) {
  const requestGithubApiJsonImpl = options.requestGithubApiJsonImpl;
  const payload = await requestGithubApiJsonImpl(
    buildGithubRunJobsUrl(options.baseUrl, options.runId, {
      perPage: options.perPage,
    }),
    {
      authorizationHeader: options.authorizationHeader,
      fetchImpl: options.fetchImpl,
    },
  );
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
  const fetchGithubCheckRunAnnotationsForRemoteProofImpl =
    options.fetchGithubCheckRunAnnotationsForRemoteProofImpl ?? fetchGithubCheckRunAnnotationsForRemoteProof;

  return Promise.all(
    jobs.map(async (job) => {
      const annotations =
        job.conclusion === "failure" && job.check_run_url
          ? await fetchGithubCheckRunAnnotationsForRemoteProofImpl({
              authorizationHeader: options.authorizationHeader,
              baseUrl: options.baseUrl,
              checkRunId: extractCheckRunId(job.check_run_url),
              fetchImpl: options.fetchImpl,
              maxPages: options.maxPages,
              perPage: options.perPage,
              requestGithubApiJsonImpl,
            })
          : [];

      return normalizeWorkflowJob(job, annotations);
    }),
  );
}

export async function fetchGithubLatestRunJobsByDefinition(options) {
  const cache = new Map();
  const definitions = Array.isArray(options.definitions) ? options.definitions : [];
  const fetchGithubJobsForRunForRemoteProofImpl =
    options.fetchGithubJobsForRunForRemoteProofImpl ?? fetchGithubJobsForRunForRemoteProof;

  async function resolveJobsForRun(runId) {
    if (!runId) {
      return [];
    }

    if (cache.has(runId)) {
      return cache.get(runId);
    }

    const promise = fetchGithubJobsForRunForRemoteProofImpl({
      authorizationHeader: options.authorizationHeader,
      baseUrl: options.baseUrl,
      fetchGithubCheckRunAnnotationsForRemoteProofImpl:
        options.fetchGithubCheckRunAnnotationsForRemoteProofImpl,
      fetchImpl: options.fetchImpl,
      maxPages: options.maxPages,
      perPage: options.perPage,
      requestGithubApiJsonImpl: options.requestGithubApiJsonImpl,
      runId,
    });

    cache.set(runId, promise);
    return promise;
  }

  const runEntries = await Promise.all(
    definitions.map(async (definition) => {
      const runs = resolveWorkflowRuns(options.workflowRunsByName, definition.workflowName).filter((run) => {
        if (definition.expectedBranch && run.head_branch !== definition.expectedBranch) {
          return false;
        }

        return true;
      });
      const latestRun = runs[0] ?? null;
      return [latestRun?.id ?? null, await resolveJobsForRun(latestRun?.id ?? null)];
    }),
  );

  return new Map(runEntries.filter(([runId]) => Boolean(runId)));
}

export function buildGithubWorkflowRemoteProofCheck(workflowsByName, workflowRunsByName, definition) {
  const workflow = workflowsByName.get(definition.workflowName) ?? null;
  const workflowPathMatches = !definition.expectedWorkflowPath || workflow?.path === definition.expectedWorkflowPath;
  const workflowStateMatches = !definition.expectedWorkflowState || workflow?.state === definition.expectedWorkflowState;
  const requireLatestRunSuccess = definition.requireLatestRunSuccess === true;
  const candidateRuns = resolveWorkflowRuns(workflowRunsByName, definition.workflowName).filter((run) => {
    if (definition.expectedBranch && run.head_branch !== definition.expectedBranch) {
      return false;
    }

    return true;
  });
  const latestRun = candidateRuns[0] ?? null;
  const latestSuccessfulRun = candidateRuns.find(isSuccessfulCompletedRun) ?? null;
  const latestRunSuccessful = isSuccessfulCompletedRun(latestRun);
  const latestRunMatchesExpectedHead =
    !definition.expectedHeadSha || latestRun?.head_sha === definition.expectedHeadSha;
  const passed =
    Boolean(workflow) &&
    workflowPathMatches &&
    workflowStateMatches &&
    Boolean(latestSuccessfulRun) &&
    (!requireLatestRunSuccess || latestRunSuccessful) &&
    latestRunMatchesExpectedHead;

  let failureReason = null;
  if (!workflow) {
    failureReason = "workflow_missing";
  } else if (!workflowPathMatches) {
    failureReason = "workflow_path_mismatch";
  } else if (!workflowStateMatches) {
    failureReason = "workflow_state_mismatch";
  } else if (requireLatestRunSuccess && !latestRun) {
    failureReason = "latest_run_missing";
  } else if (requireLatestRunSuccess && !latestRunSuccessful) {
    failureReason = "latest_run_not_successful";
  } else if (!latestRunMatchesExpectedHead) {
    failureReason = "latest_run_head_mismatch";
  } else if (!latestSuccessfulRun) {
    failureReason = "successful_run_missing";
  }

  return {
    expectedBranch: definition.expectedBranch ?? null,
    expectedHeadSha: definition.expectedHeadSha ?? null,
    expectedRef: definition.expectedRef ?? null,
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
