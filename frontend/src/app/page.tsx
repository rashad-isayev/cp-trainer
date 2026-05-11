"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Sidebar } from "../components/Sidebar";
import { ProblemsList } from "../components/ProblemsList";
import { fetchDashboard, fetchRecommendations, updateProblemStatus } from "../lib/api";
import type { ConfidenceLevel, Problem, User } from "../lib/types";

const TOKEN_KEY = "cp-trainer-token";
const TOPICS = ["dp", "graphs", "math", "greedy", "sorting", "strings", "implementation"];
const PLATFORMS = ["codeforces", "cses.fi"];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<Problem[]>([]);
  const [waitlisted, setWaitlisted] = useState<Problem[]>([]);
  const [completed, setCompleted] = useState<Problem[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel>("medium");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (!savedToken) {
      router.push("/login");
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchDashboard(savedToken);
        setUser(data.user);
        setWaitlisted(Array.isArray(data.waitlisted) ? data.waitlisted : []);
        setCompleted(Array.isArray(data.completed) ? data.completed : []);
        setRecommendations([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setUser(null);
        setRecommendations([]);
        setWaitlisted([]);
        setCompleted([]);
        localStorage.removeItem(TOKEN_KEY);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [router]);

  const completedKeys = useMemo(
    // Citation: Memoized completed-problem lookup pattern refined with assistance from OpenAI ChatGPT/Codex
    // to prevent solved problems from reappearing in recommendations.
    () => new Set(completed.map((problem) => `${problem.platform}-${problem.external_id}`)),
    [completed],
  );

  const handleToggle = (
    value: string,
    selected: string[],
    setSelected: (items: string[]) => void,
  ) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const handleRecommend = async () => {
    if (!token) {
      setError("Please log in first.");
      return;
    }

    setFetching(true);
    setError("");

    try {
      const data = await fetchRecommendations(token, {
        topics: selectedTopics,
        platforms: selectedPlatforms,
        confidence,
      });

      setUser(data.user);
      const nextRecommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
      // Citation: Defensive client-side platform filtering refined with assistance from OpenAI ChatGPT/Codex
      // so selected platform filters remain strict even if the backend response changes.
      setRecommendations(
        selectedPlatforms.length === 0
          ? nextRecommendations
          : nextRecommendations.filter((problem) => selectedPlatforms.includes(problem.platform)),
      );
      setWaitlisted(Array.isArray(data.waitlisted) ? data.waitlisted : []);
      setCompleted(Array.isArray(data.completed) ? data.completed : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFetching(false);
    }
  };

  const handleProgressUpdate = async (problem: Problem, status: "waitlisted" | "completed") => {
    if (!token) {
      setError("Please log in first.");
      return;
    }

    try {
      const data = await updateProblemStatus(token, problem, status);
      setWaitlisted(Array.isArray(data.waitlisted) ? data.waitlisted : []);
      setCompleted(Array.isArray(data.completed) ? data.completed : []);
      setRecommendations((current) =>
        current.filter(
          (item) => `${item.platform}-${item.external_id}` !== `${problem.platform}-${problem.external_id}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="app-shell">
      {user && <Sidebar user={user} completedProblems={completed} />}

      <div className="app-main">
        {loading ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--text-primary)]"></div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading page...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--text-secondary)]">Please log in to continue.</p>
            </div>
          </div>
        ) : (
          <div className="notion-page">
            <header className="mb-8">
              <div className="mb-4 text-5xl leading-none">🧩</div>
              <p className="mb-2 text-sm text-[var(--text-tertiary)]">
                Competitive Programming Trainer
              </p>
              <h1 className="text-[var(--text-primary)]">Problem Recommender</h1>
              <p className="mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
                Pick topics, confidence, and platforms to get focused competitive programming recommendations.
              </p>
            </header>

            {error && (
              <div className="mb-6 rounded-md border border-[#f2c6c3] bg-[#fdebec] px-3 py-2 text-sm text-[#d44c47]">
                {error}
              </div>
            )}

            <div className="recommendation-workspace">
              <aside className="space-y-3">
                <div className="notion-card p-3">
                  <h3 className="border-b border-[var(--border)] px-1 pb-1.5 text-xs font-medium uppercase text-[var(--text-tertiary)]">
                    Confidence
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {(["low", "medium", "high"] as ConfidenceLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfidence(level)}
                        className={`px-2 py-1.5 text-xs capitalize ${
                          confidence === level
                            ? "notion-button-active"
                            : "notion-button"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="notion-card p-3">
                  <h3 className="border-b border-[var(--border)] px-1 pb-1.5 text-xs font-medium uppercase text-[var(--text-tertiary)]">Topics</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => handleToggle(topic, selectedTopics, setSelectedTopics)}
                        className={`px-2.5 py-1 text-xs ${
                          selectedTopics.includes(topic)
                            ? "notion-button-active"
                            : "notion-button"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 px-1 text-xs text-[var(--text-tertiary)]">
                    Select none to use all topics.
                  </p>
                </div>

                <div className="notion-card p-3">
                  <h3 className="border-b border-[var(--border)] px-1 pb-1.5 text-xs font-medium uppercase text-[var(--text-tertiary)]">Platforms</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => handleToggle(platform, selectedPlatforms, setSelectedPlatforms)}
                        className={`px-2.5 py-1 text-xs ${
                          selectedPlatforms.includes(platform)
                            ? "notion-button-active"
                            : "notion-button"
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 px-1 text-xs text-[var(--text-tertiary)]">
                    Select none to use all platforms.
                  </p>
                </div>

                <button
                  onClick={handleRecommend}
                  disabled={fetching}
                  className="notion-button-primary w-full px-3 py-2 text-sm disabled:opacity-50"
                >
                  {fetching ? "Finding problems..." : "Recommend"}
                </button>
              </aside>

              <section className="recommendation-results space-y-5">
                <ProblemsList
                  title="Recommended for you"
                  subtitle="Fresh picks based on your selected topics, platforms, and confidence"
                  problems={recommendations.filter(
                    (problem) => !completedKeys.has(`${problem.platform}-${problem.external_id}`),
                  )}
                  emptyMessage="No recommendations yet. Click 'Recommend' to fetch a list."
                  primaryActionLabel="Waitlist"
                  onPrimaryAction={(problem) => handleProgressUpdate(problem, "waitlisted")}
                  secondaryActionLabel="Mark complete"
                  onSecondaryAction={(problem) => handleProgressUpdate(problem, "completed")}
                />

                <ProblemsList
                  title="Waitlist"
                  subtitle="Problems saved for later practice"
                  problems={waitlisted}
                  emptyMessage="No waitlisted problems yet."
                  secondaryActionLabel="Mark complete"
                  onSecondaryAction={(problem) => handleProgressUpdate(problem, "completed")}
                />

                <ProblemsList
                  title="Completed"
                  subtitle="Solved problems will not be recommended again"
                  problems={completed}
                  emptyMessage="No completed problems yet."
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
