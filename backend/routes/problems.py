import json
import re
import ssl
from time import time
from urllib.request import Request, urlopen

from flask import Blueprint, jsonify, request

from routes.auth import get_current_user
from utils.db import get_db

problems_bp = Blueprint("problems", __name__)

ALL_PLATFORMS = ["codeforces", "cses.fi"]
ALL_TOPICS = ["dp", "graphs", "math", "greedy", "sorting", "strings", "implementation"]
CACHE_TTL_SECONDS = 600
_provider_cache = {}


def get_saved_problems(user_id: int, status: str):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT platform, external_id, name, topic, difficulty, link, status
        FROM progress
        WHERE user_id = ? AND status = ?
        ORDER BY updated_at DESC, name ASC
        """,
        (user_id, status),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def problem_key(problem):
    return f"{problem['platform']}::{problem['external_id']}"


def open_url(url: str):
    request = Request(url, headers={"User-Agent": "cp-trainer/1.0"})
    context = ssl._create_unverified_context()
    return urlopen(request, timeout=15, context=context)


def get_json(url: str):
    with open_url(url) as response:
        return json.loads(response.read().decode("utf-8"))


def get_text(url: str):
    with open_url(url) as response:
        return response.read().decode("utf-8")


def cached_problems(platform: str, loader):
    # Citation: In-memory provider cache pattern refined with assistance from OpenAI ChatGPT/Codex
    # to avoid repeatedly fetching external problem sources during one backend process.
    cached = _provider_cache.get(platform)
    now = time()
    if cached and now - cached["timestamp"] < CACHE_TTL_SECONDS:
        return cached["data"]

    try:
        data = loader()
    except Exception:
        data = []

    _provider_cache[platform] = {"timestamp": now, "data": data}
    return data


def map_topic(value: str):
    # Citation: Keyword matching logic for topic categorization refined with assistance from GitHub Copilot
    topic = (value or "").lower()

    if "dp" in topic or "dynamic programming" in topic:
        return "dp"
    if any(keyword in topic for keyword in ["graph", "tree", "bfs", "dfs", "shortest"]):
        return "graphs"
    if any(keyword in topic for keyword in ["math", "number", "combinatorics", "probability"]):
        return "math"
    if "greedy" in topic:
        return "greedy"
    if any(keyword in topic for keyword in ["sort", "search", "two pointers", "binary search", "range", "sliding"]):
        return "sorting"
    if "string" in topic:
        return "strings"
    return "implementation"


def difficulty_from_rating(rating):
    if rating <= 1200:
        return "easy"
    if rating <= 1800:
        return "medium"
    return "hard"


def difficulty_from_section(section: str):
    # Citation: Keyword-based difficulty mapping for CSES sections developed with assistance from GitHub Copilot
    name = section.lower()
    if "introductory" in name:
        return "easy"
    if any(keyword in name for keyword in ["advanced", "geometry", "additional problems ii"]):
        return "hard"
    if any(keyword in name for keyword in ["graph", "tree", "dynamic programming"]):
        return "medium"
    return "easy"


def fetch_codeforces_problems():
    data = get_json("https://codeforces.com/api/problemset.problems")
    problems = data.get("result", {}).get("problems", [])
    items = []

    for problem in problems:
        contest_id = problem.get("contestId")
        index = problem.get("index")
        name = problem.get("name")
        if not contest_id or not index or not name:
            continue

        tags = problem.get("tags") or []
        rating = problem.get("rating", 1400)
        topic = next((map_topic(tag) for tag in tags if map_topic(tag)), "implementation")
        items.append(
            {
                "platform": "codeforces",
                "external_id": f"{contest_id}-{index}",
                "name": name,
                "topic": topic,
                "difficulty": difficulty_from_rating(rating),
                "link": f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
            }
        )

    return items


def fetch_cses_problems():
    # Citation: Regex patterns for HTML parsing developed with assistance from GitHub Copilot to accurately extract problem data from CSES.fi
    html = get_text("https://cses.fi/problemset/list/")
    sections = re.findall(r'<h2>(.*?)</h2><ul class="task-list">(.*?)</ul>', html, re.S)
    items = []

    for section, block in sections:
        if section == "General":
            continue

        for path, name in re.findall(r'<li class="task"><a href="([^"]+)">([^<]+)</a>', block):
            items.append(
                {
                    "platform": "cses.fi",
                    "external_id": path.rstrip("/").split("/")[-1],
                    "name": name,
                    "topic": map_topic(section),
                    "difficulty": difficulty_from_section(section),
                    "link": f"https://cses.fi{path}",
                }
            )

    return items


def load_platform_problems(platform: str):
    if platform == "codeforces":
        return cached_problems(platform, fetch_codeforces_problems)
    if platform == "cses.fi":
        return cached_problems(platform, fetch_cses_problems)
    return []


def normalize_platforms(platforms):
    # Citation: Platform normalization and strict selected-platform filtering logic refined with assistance
    # from OpenAI ChatGPT/Codex to ensure empty selection means all platforms, not invalid platforms.
    if not platforms:
        return ALL_PLATFORMS

    cleaned = []
    for platform in platforms:
        if platform in ALL_PLATFORMS and platform not in cleaned:
            cleaned.append(platform)

    return cleaned


def normalize_topics(topics):
    # Citation: Topic normalization fallback logic refined with assistance from OpenAI ChatGPT/Codex.
    cleaned = []
    for topic in topics or []:
        mapped = map_topic(topic)
        if mapped in ALL_TOPICS and mapped not in cleaned:
            cleaned.append(mapped)
    return cleaned or ALL_TOPICS


def difficulty_rank(value: str):
    return {"easy": 1, "medium": 2, "hard": 3}.get(value, 2)


def recommend_problems(topics, confidence, platforms, excluded_keys, limit=12):
    # Citation: Recommendation algorithm logic, including difficulty ranking and platform balancing, developed with assistance from GitHub Copilot
    target_rank = {"low": 1, "medium": 2, "high": 3}.get(confidence, 2)
    by_platform = {}

    for platform in platforms:
        candidates = [
            problem
            for problem in load_platform_problems(platform)
            if problem["topic"] in topics and problem_key(problem) not in excluded_keys
        ]

        if not candidates:
            candidates = [
                problem
                for problem in load_platform_problems(platform)
                if problem_key(problem) not in excluded_keys
            ]

        candidates.sort(
            key=lambda problem: (
                abs(difficulty_rank(problem["difficulty"]) - target_rank),
                problem["name"],
            )
        )
        by_platform[platform] = candidates[:limit]

    recommendations = []
    seen = set()
    while len(recommendations) < limit and any(by_platform.values()):
        for platform in platforms:
            if not by_platform[platform]:
                continue

            problem = by_platform[platform].pop(0)
            key = problem_key(problem)
            if key in seen:
                continue

            recommendations.append(problem)
            seen.add(key)

            if len(recommendations) >= limit:
                break

    return recommendations


@problems_bp.get("/problems")
def get_dashboard():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    return jsonify(
        {
            "user": user,
            "waitlisted": get_saved_problems(user["id"], "waitlisted"),
            "completed": get_saved_problems(user["id"], "completed"),
        }
    )


@problems_bp.post("/recommendations")
def get_recommendations():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    data = request.get_json(silent=True) or {}
    topics = normalize_topics(data.get("topics"))
    platforms = normalize_platforms(data.get("platforms"))
    confidence = data.get("confidence", "medium")

    waitlisted = get_saved_problems(user["id"], "waitlisted")
    completed = get_saved_problems(user["id"], "completed")
    excluded_keys = {problem_key(problem) for problem in waitlisted + completed}

    recommendations = recommend_problems(topics, confidence, platforms, excluded_keys)

    return jsonify(
        {
            "user": user,
            "recommendations": recommendations,
            "waitlisted": waitlisted,
            "completed": completed,
        }
    )


@problems_bp.post("/progress")
def save_progress():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    platform = data.get("platform")
    external_id = str(data.get("external_id") or "").strip()
    name = str(data.get("name") or "").strip()
    topic = map_topic(str(data.get("topic") or "implementation"))
    difficulty = str(data.get("difficulty") or "medium").strip().lower()
    link = str(data.get("link") or "").strip()

    if status not in {"waitlisted", "completed"}:
        return jsonify({"error": "Invalid progress status."}), 400

    if platform not in ALL_PLATFORMS or not external_id or not name or not link:
        return jsonify({"error": "Missing problem details."}), 400

    conn = get_db()
    conn.execute(
        """
        INSERT INTO progress (
            user_id, platform, external_id, name, topic, difficulty, link, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, platform, external_id) DO UPDATE SET
            name = excluded.name,
            topic = excluded.topic,
            difficulty = excluded.difficulty,
            link = excluded.link,
            status = excluded.status,
            updated_at = CURRENT_TIMESTAMP
        """,
        (user["id"], platform, external_id, name, topic, difficulty, link, status),
    )
    conn.commit()
    conn.close()

    return jsonify(
        {
            "message": "Progress updated.",
            "waitlisted": get_saved_problems(user["id"], "waitlisted"),
            "completed": get_saved_problems(user["id"], "completed"),
        }
    )
