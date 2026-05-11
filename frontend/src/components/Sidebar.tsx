"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

import type { Problem } from "../lib/types";

const COMPLETED_PAGE_SIZE = 10;

type SidebarProps = {
  user: { username: string } | null;
  completedProblems: Problem[];
};

export function Sidebar({ user, completedProblems }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [visibleCompletedCount, setVisibleCompletedCount] = useState(COMPLETED_PAGE_SIZE);

  const handleLogout = () => {
    localStorage.removeItem("cp-trainer-token");
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;
  // Citation: Incremental sidebar pagination pattern refined with assistance from OpenAI ChatGPT/Codex
  // to keep long solved-problem lists usable without making the whole app scroll.
  const visibleCompletedProblems = completedProblems.slice(0, visibleCompletedCount);
  const hasMoreCompletedProblems = visibleCompletedCount < completedProblems.length;

  if (!user) return null;

  return (
    <aside className="app-sidebar">
      <div className="flex h-full min-h-0 flex-col">
        <div className="space-y-3">
          <nav className="space-y-0.5">
            <Link
              href="/"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-[var(--surface-active)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="w-5 text-center text-sm">🧩</span>
              <span>Problem Recommender</span>
            </Link>
          </nav>

          <div className="rounded-md border border-[var(--border)] bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span>✅</span>
                <span>Problems done</span>
              </span>
              <span className="font-medium text-[var(--text-primary)]">{completedProblems.length}</span>
            </div>

            {completedProblems.length > 0 ? (
              <div className="completed-problems-scroll mt-2 space-y-0.5 border-t border-[var(--border)] pt-2">
                {visibleCompletedProblems.map((problem) => (
                  <a
                    key={`${problem.platform}-${problem.external_id}`}
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate rounded px-1.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    title={problem.name}
                  >
                    {problem.name}
                  </a>
                ))}

                {hasMoreCompletedProblems && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCompletedCount((currentCount) => currentCount + COMPLETED_PAGE_SIZE)
                    }
                    className="mt-1 w-full rounded px-1.5 py-1 text-left text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    Load more
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-tertiary)]">
                No solved problems yet.
              </p>
            )}
          </div>
        </div>

        <p className="mt-auto truncate px-2 pb-2 text-xs text-[var(--text-tertiary)]">
          Signed in as {user.username}
        </p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <span className="w-5 text-center">↪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
