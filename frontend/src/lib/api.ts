import type {
  AuthMode,
  AuthResponse,
  DashboardResponse,
  Problem,
  ProgressResponse,
  ProgressStatus,
  RecommendationRequest,
  RecommendationResponse,
} from "./types";

type ApiError = {
  error?: string;
};

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    return `${window.location.protocol}//${host}:5000`;
  }

  return "http://127.0.0.1:5000";
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBase()}${path}`, init);
  } catch {
    throw new Error("Cannot connect to the backend. Start it with `cd backend && .venv/bin/python app.py`.");
  }

  const data = await readJson<T & ApiError>(response);

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data as T;
}

export async function authenticate(
  mode: AuthMode,
  username: string,
  password: string,
): Promise<AuthResponse> {
  return requestJson<AuthResponse>(`/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchDashboard(token: string): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/problems", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchRecommendations(
  token: string,
  payload: RecommendationRequest,
): Promise<RecommendationResponse> {
  return requestJson<RecommendationResponse>("/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateProblemStatus(
  token: string,
  problem: Problem,
  status: ProgressStatus,
): Promise<ProgressResponse> {
  return requestJson<ProgressResponse>("/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...problem, status }),
  });
}
