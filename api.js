import sampleIssues from "../data/issues.json";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const LOCAL_API_BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  };
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, requestOptions);
  } catch (error) {
    const remoteApiConfigured = API_BASE && !/(localhost|127\.0\.0\.1)/i.test(API_BASE);
    if (error.name === "AbortError" || remoteApiConfigured || !import.meta.env.DEV) {
      throw error;
    }
    try {
      response = await fetch(`${LOCAL_API_BASE}${path}`, requestOptions);
    } catch (fallbackError) {
      if (fallbackError.name === "AbortError") throw fallbackError;
      throw new Error(
        `Could not connect to the OpenQuest backend at ${LOCAL_API_BASE}. Start FastAPI on port 8000, then restart the Vite dev server. Original error: ${fallbackError.message}`,
      );
    }
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status})`);
  }
  return data;
}

function normalizeSample(issue) {
  const labels = issue.labels || [];
  return {
    ...issue,
    id: String(issue.id),
    topics: issue.topics || issue.skills || [],
    skills: issue.skills || [],
    stars: issue.stars ?? null,
    url: issue.url === "https://github.com" ? "" : issue.url || "",
    repo_url: issue.repo_url || "",
    created_at: issue.created_at || null,
    good_first_issue: labels.some((label) =>
      label.toLowerCase().includes("good first issue"),
    ),
    help_wanted: labels.some((label) =>
      label.toLowerCase().includes("help wanted"),
    ),
    source: "sample",
  };
}

function findInSamples({
  q = "",
  language = "",
  difficulty = "",
  topic = "",
  repository = "",
  labels = "",
}) {
  const query = q.toLowerCase().trim();
  const requiredLabels = labels
    .split(",")
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean);
  return sampleIssues.map(normalizeSample).filter((issue) => {
    const text = [
      issue.title,
      issue.repository,
      issue.description,
      issue.language,
      ...issue.labels,
      ...issue.topics,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || text.includes(query)) &&
      (!language || issue.language.toLowerCase() === language.toLowerCase()) &&
      (!difficulty ||
        issue.difficulty.toLowerCase() === difficulty.toLowerCase()) &&
      (!repository || issue.repository.toLowerCase() === repository.toLowerCase()) &&
      requiredLabels.every((required) =>
        issue.labels.some((label) => label.toLowerCase() === required),
      ) &&
      (!topic ||
        [...issue.labels, ...issue.topics].some((value) =>
          value.toLowerCase().includes(topic.toLowerCase()),
        ))
    );
  });
}

export async function fetchIssues(params = {}, signal) {
  const query = new URLSearchParams({
    q: params.q || "",
    language: params.language || "",
    labels: params.labels || "",
    repository: params.repository || "",
    topic: params.topic || "",
    page: String(params.page || 1),
    per_page: String(params.per_page || 20),
  });
  try {
    const result = await request(`/api/github/issues?${query}`, { signal });
    return { ...result, notice: result.notice || "" };
  } catch (githubError) {
    if (signal?.aborted) throw githubError;
    try {
      const localQuery = new URLSearchParams({
        q: params.q || "",
        language: params.language || "",
        difficulty: params.difficulty || "",
        topic: params.topic || "",
        repository: params.repository || "",
        labels: params.labels || "",
        page: String(params.page || 1),
        per_page: String(params.per_page || 20),
      });
      const result = await request(`/api/issues?${localQuery}`, { signal });
      return {
        ...result,
        notice: `${githubError.message} Showing the included sample dataset.`,
      };
    } catch (backendError) {
      if (signal?.aborted) throw backendError;
      const matches = findInSamples(params);
      const page = params.page || 1;
      const perPage = params.per_page || 20;
      const start = (page - 1) * perPage;
      return {
        items: matches.slice(start, start + perPage),
        total_count: matches.length,
        page,
        per_page: perPage,
        has_more: start + perPage < matches.length,
        source: "sample",
        notice: `${githubError.message} The local API also failed: ${backendError.message}. Showing the included sample dataset.`,
      };
    }
  }
}

export async function fetchIssue(id) {
  return request(`/api/issues/${encodeURIComponent(id)}`);
}

export async function explainIssue(issue) {
  return request("/api/ai/explain", {
    method: "POST",
    body: JSON.stringify({
      title: issue.title,
      description: issue.description,
      repository: issue.repository,
      labels: issue.labels || [],
      language: issue.language || "Unknown",
    }),
  });
}

export async function fetchRecommendations(preferences) {
  return request("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
}
