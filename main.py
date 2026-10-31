import logging
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("openquest")


def _load_backend_env():
    env_file = Path(__file__).resolve().parent / ".env"
    if not env_file.is_file():
        return
    try:
        for line in env_file.read_text(encoding="utf-8").splitlines():
            value = line.strip()
            if not value or value.startswith("#") or "=" not in value:
                continue
            key, raw_value = value.split("=", 1)
            os.environ.setdefault(key.strip(), raw_value.strip().strip("\"'"))
    except OSError as error:
        logger.warning("Could not read backend .env file: %s", error)


_load_backend_env()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:e2b")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "240"))
GITHUB_API_URL = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
ISSUES_FILE = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "issues.json"
ISSUE_CACHE = {}
REPOSITORY_CACHE = {}

app = FastAPI(title="OpenQuest API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_origin_regex=os.getenv(
        "CORS_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExplanationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=50000)
    repository: str = Field(default="Unknown", max_length=300)
    labels: list[str] = Field(default_factory=list, max_length=50)
    language: str = Field(default="Unknown", max_length=100)


class RecommendationRequest(BaseModel):
    languages: list[str] = Field(default_factory=list, max_length=30)
    topics: list[str] = Field(default_factory=list, max_length=30)
    experience: str = Field(default="beginner", max_length=30)
    preferred_difficulty: str = Field(default="All", max_length=30)


def _local_issues():
    try:
        import json

        with ISSUES_FILE.open(encoding="utf-8") as file:
            data = json.load(file)
    except (OSError, ValueError) as error:
        logger.exception("Could not load the local issue dataset")
        raise HTTPException(status_code=500, detail="The local issue dataset could not be loaded.") from error

    return [
        {
            "id": str(issue["id"]),
            "title": issue["title"],
            "repository": issue["repository"],
            "owner": issue.get("owner", issue["repository"].split("/")[0]),
            "description": issue.get("description", ""),
            "language": issue.get("language") or "Unknown",
            "difficulty": issue.get("difficulty", "Intermediate"),
            "type": issue.get("type", "Issue"),
            "labels": issue.get("labels", []),
            "topics": issue.get("skills", []),
            "skills": issue.get("skills", []),
            "stars": issue.get("stars"),
            "url": issue.get("url") or "",
            "repo_url": issue.get("repo_url") or "",
            "created_at": issue.get("created_at"),
            "good_first_issue": any(
                "good first issue" in label.lower() for label in issue.get("labels", [])
            ),
            "help_wanted": any(
                "help wanted" in label.lower() for label in issue.get("labels", [])
            ),
            "source": "sample",
        }
        for issue in data
    ]


def _github_headers():
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def _repository_metadata(full_name):
    if full_name in REPOSITORY_CACHE:
        return REPOSITORY_CACHE[full_name]
    try:
        response = requests.get(
            f"{GITHUB_API_URL}/repos/{full_name}",
            headers=_github_headers(),
            timeout=6,
        )
        if response.ok:
            data = response.json()
            metadata = {
                "language": data.get("language"),
                "stars": data.get("stargazers_count"),
                "url": data.get("html_url"),
            }
        else:
            metadata = {}
            logger.info("Repository metadata unavailable for %s: HTTP %s", full_name, response.status_code)
    except (requests.RequestException, ValueError) as error:
        metadata = {}
        logger.info("Repository metadata unavailable for %s: %s", full_name, error)
    REPOSITORY_CACHE[full_name] = metadata
    return metadata


def _issue_repository_name(item):
    repository = item.get("repository") or {}
    if repository.get("full_name"):
        return repository["full_name"]
    repository_path = urlparse(item.get("repository_url", "")).path.strip("/").split("/")
    if len(repository_path) >= 3 and repository_path[0] == "repos":
        return "/".join(repository_path[1:3])
    return "unknown/unknown"


def _github_issue(item, requested_language="", repository_meta=None):
    repository = item.get("repository") or {}
    full_name = _issue_repository_name(item)
    repository_meta = repository_meta or {}
    labels = [label.get("name", "") for label in item.get("labels", [])]
    normalized_labels = [label.lower() for label in labels]
    good_first = any("good first issue" in label for label in normalized_labels)
    help_wanted = any("help wanted" in label for label in normalized_labels)
    issue_type = next(
        (
            label
            for label in labels
            if label.lower() in {"bug", "documentation", "enhancement", "feature"}
        ),
        "Issue",
    )
    issue = {
        "id": str(item["id"]),
        "title": item.get("title", "Untitled issue"),
        "repository": full_name,
        "owner": (repository.get("owner") or {}).get("login", full_name.split("/")[0]),
        "description": item.get("body") or "No issue description was provided.",
        "language": repository_meta.get("language") or requested_language or "Unknown",
        "difficulty": "Beginner" if good_first else "Intermediate",
        "type": issue_type,
        "labels": labels,
        "topics": labels,
        "skills": [],
        "stars": repository_meta.get("stars"),
        "url": item.get("html_url", ""),
        "repo_url": repository_meta.get("url") or f"https://github.com/{full_name}",
        "created_at": item.get("created_at"),
        "good_first_issue": good_first,
        "help_wanted": help_wanted,
        "source": "github",
    }
    ISSUE_CACHE[issue["id"]] = issue
    return issue


def _search_github(q, language, labels, page, per_page, repository="", topic=""):
    max_search_results = 1000
    max_page = (max_search_results + per_page - 1) // per_page
    if page > max_page:
        raise HTTPException(
            status_code=422,
            detail=f"GitHub Search API pagination is limited to the first {max_search_results} results.",
        )
    query_parts = ["is:issue", "is:open"]
    if q.strip():
        query_parts.append(q.strip())
    if language.strip():
        query_parts.append(f"language:{language.strip()}")
    if repository.strip():
        query_parts.append(f"repo:{repository.strip()}")
    if topic.strip():
        query_parts.append(f'label:"{topic.strip()}"')
    if labels.strip():
        query_parts.extend(
            f'label:"{label.strip()}"'
            for label in labels.split(",")
            if label.strip()
        )

    try:
        response = requests.get(
            f"{GITHUB_API_URL}/search/issues",
            params={
                "q": " ".join(query_parts),
                "page": page,
                "per_page": per_page,
                "sort": "created",
                "order": "desc",
            },
            headers=_github_headers(),
            timeout=15,
        )
    except requests.RequestException as error:
        logger.warning("GitHub issue search failed: %s", error)
        raise HTTPException(status_code=503, detail="GitHub could not be reached. Try again shortly.") from error

    if response.status_code in (403, 429):
        raise HTTPException(
            status_code=429,
            detail="GitHub's API rate limit was reached. Add a GITHUB_TOKEN or try again later.",
        )
    if response.status_code != 200:
        logger.warning("GitHub issue search returned %s: %s", response.status_code, response.text[:300])
        raise HTTPException(status_code=502, detail="GitHub could not complete the issue search.")

    try:
        result = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="GitHub returned an unreadable response.") from error

    github_items = result.get("items", [])
    repositories = list(dict.fromkeys(_issue_repository_name(item) for item in github_items))
    missing_metadata = [name for name in repositories[:4] if name not in REPOSITORY_CACHE]
    if missing_metadata:
        with ThreadPoolExecutor(max_workers=4) as executor:
            list(executor.map(_repository_metadata, missing_metadata))
    items = [
        _github_issue(item, language.strip(), REPOSITORY_CACHE.get(_issue_repository_name(item)))
        for item in github_items
    ]
    total_count = result.get("total_count", len(items))
    truncated = total_count > max_search_results
    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "has_more": page * per_page < min(total_count, max_search_results),
        "source": "github",
        "notice": (
            f"GitHub Search API exposes the first {max_search_results} matches for a query."
            if truncated
            else ""
        ),
    }


def _filter_local_issues(
    issues, q="", language="", difficulty="", topic="", repository="", labels=""
):
    search_term = q.casefold().strip()
    topic_term = topic.casefold().strip()
    required_labels = [
        label.strip().casefold() for label in labels.split(",") if label.strip()
    ]
    return [
        issue
        for issue in issues
        if (
            not search_term
            or search_term
            in " ".join(
                [
                    issue["title"],
                    issue["repository"],
                    issue["description"],
                    issue["language"],
                    *issue["labels"],
                    *issue["topics"],
                ]
            ).casefold()
        )
        and (not language or issue["language"].casefold() == language.casefold())
        and (not difficulty or issue["difficulty"].casefold() == difficulty.casefold())
        and (
            not repository
            or issue["repository"].casefold() == repository.casefold()
        )
        and all(
            any(label.casefold() == required for label in issue["labels"])
            for required in required_labels
        )
        and (
            not topic_term
            or any(topic_term in value.casefold() for value in issue["topics"] + issue["labels"])
        )
    ]


@app.get("/")
def home():
    return {"message": "OpenQuest API is running."}


@app.get("/api/health")
def health():
    ai_available = False
    model_available = False
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        if response.ok:
            ai_available = True
            models = response.json().get("models", [])
            model_available = any(
                model.get("name") == OLLAMA_MODEL
                or model.get("name", "").startswith(f"{OLLAMA_MODEL}:")
                for model in models
            )
    except (requests.RequestException, ValueError) as error:
        logger.info("Ollama health check unavailable: %s", error)

    return {
        "backend": "ok",
        "ai": {
            "available": ai_available,
            "model": OLLAMA_MODEL,
            "model_available": model_available,
        },
    }


@app.get("/api/issues")
def get_issues(
    q: str = "",
    language: str = "",
    difficulty: str = "",
    topic: str = "",
    repository: str = "",
    labels: str = "",
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    matching = _filter_local_issues(
        _local_issues(),
        q=q,
        language=language,
        difficulty=difficulty,
        topic=topic,
        repository=repository,
        labels=labels,
    )
    start = (page - 1) * per_page
    return {
        "items": matching[start : start + per_page],
        "total_count": len(matching),
        "page": page,
        "per_page": per_page,
        "has_more": start + per_page < len(matching),
        "source": "sample",
    }


@app.get("/api/issues/{issue_id}")
def get_issue(issue_id: str):
    if issue_id in ISSUE_CACHE:
        return ISSUE_CACHE[issue_id]
    for issue in _local_issues():
        if issue["id"] == issue_id:
            return issue
    raise HTTPException(status_code=404, detail="Issue not found.")


@app.get("/api/github/issues")
def get_github_issues(
    q: str = "",
    language: str = "",
    labels: str = "",
    repository: str = "",
    topic: str = "",
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    return _search_github(q, language, labels, page, per_page, repository, topic)


@app.post("/api/recommendations")
def recommendations(preferences: RecommendationRequest):
    languages = {value.casefold() for value in preferences.languages}
    topics = {value.casefold() for value in preferences.topics}
    preferred_difficulty = preferences.preferred_difficulty.casefold()
    experience = preferences.experience.casefold()
    experience_difficulty = {
        "beginner": "beginner",
        "new": "beginner",
        "student": "beginner",
        "intermediate": "intermediate",
        "experienced": "advanced",
    }.get(experience)

    scored = []
    for issue in _local_issues():
        score = 0
        if issue["language"].casefold() in languages:
            score += 3
        issue_topics = {
            value.casefold() for value in issue["topics"] + issue["labels"]
        }
        score += sum(2 for topic in topics if any(topic in value for value in issue_topics))
        if preferred_difficulty != "all" and issue["difficulty"].casefold() == preferred_difficulty:
            score += 3
        elif (
            preferred_difficulty == "all"
            and experience_difficulty == issue["difficulty"].casefold()
        ):
            score += 1
        if experience in {"beginner", "new", "student"} and issue["good_first_issue"]:
            score += 1
        scored.append((score, issue))

    scored.sort(key=lambda result: (-result[0], result[1]["title"].casefold()))
    return {
        "items": [issue for score, issue in scored if score > 0][:10],
        "source": "sample",
    }


@app.post("/api/ai/explain")
@app.post("/api/explain", include_in_schema=False)
def explain_issue(issue: ExplanationRequest):
    prompt = f"""You are OpenQuest, a patient open-source mentor for beginners.
Explain only what can reasonably be inferred from the issue details below. Do not claim to know repository files, contribution rules, or implementation details that were not provided. Clearly mark any suggestions as hypotheses to verify.

Issue title: {issue.title}
Repository: {issue.repository}
Language: {issue.language}
Labels: {", ".join(issue.labels) if issue.labels else "None provided"}
Description:
{issue.description or "No description provided."}

Keep the complete answer concise (roughly 500-700 words). Use these headings and give practical guidance under each:
## Simple explanation
## Problem to solve
## Why it matters
## Skills that may help
## Files or code areas to investigate
## Step-by-step approach
## Possible challenges
## How to test
## First steps for a beginner
Remind the reader to confirm file locations and project-specific guidance in the repository."""

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "think": False,
                "options": {
                    "num_ctx": 8192,
                    "num_predict": 800,
                    "temperature": 0.2,
                },
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.Timeout as error:
        raise HTTPException(status_code=504, detail="Gemma took too long to respond. Retry the explanation.") from error
    except requests.ConnectionError as error:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama is unavailable at {OLLAMA_BASE_URL}. Start Ollama and make sure {OLLAMA_MODEL} is installed.",
        ) from error
    except requests.HTTPError as error:
        if error.response is not None and error.response.status_code == 404:
            raise HTTPException(
                status_code=503,
                detail=f"The Ollama model {OLLAMA_MODEL} is not available. Run `ollama pull {OLLAMA_MODEL}` and retry.",
            ) from error
        logger.warning("Ollama returned an HTTP error: %s", error)
        raise HTTPException(status_code=502, detail="Ollama could not generate an explanation.") from error
    except requests.RequestException as error:
        logger.warning("Ollama explanation request failed: %s", error)
        raise HTTPException(status_code=502, detail="Ollama could not generate an explanation.") from error

    try:
        explanation = response.json().get("message", {}).get("content", "").strip()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="Ollama returned an unreadable response.") from error
    if not explanation:
        raise HTTPException(status_code=502, detail="Gemma returned an empty explanation. Retry the request.")
    return {"explanation": explanation, "model": OLLAMA_MODEL}
