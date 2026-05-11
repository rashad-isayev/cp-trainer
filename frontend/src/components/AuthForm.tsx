import type { FormEvent } from "react";

import type { AuthMode } from "../lib/types";

type AuthFormProps = {
  mode: AuthMode;
  username: string;
  password: string;
  submitting: boolean;
  onModeChange: (mode: AuthMode) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthForm({
  mode,
  username,
  password,
  submitting,
  onModeChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  const isLogin = mode === "login";

  return (
    <div className="notion-card overflow-hidden">
      <div className="border-b border-[var(--border)] px-6 py-5">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {isLogin ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {isLogin
            ? "Log in to see your saved competitive programming problems."
            : "Register once and start tracking your practice."}
        </p>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-[var(--surface-tint)] p-1">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`px-3 py-1.5 text-sm ${
              isLogin
                ? "notion-button-active bg-white shadow-sm"
                : "notion-button"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onModeChange("register")}
            className={`px-3 py-1.5 text-sm ${
              !isLogin
                ? "notion-button-active bg-white shadow-sm"
                : "notion-button"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter your username"
              className="w-full text-sm placeholder:text-[var(--text-quaternary)]"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              className="w-full text-sm placeholder:text-[var(--text-quaternary)]"
              disabled={submitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="notion-button-primary mt-4 w-full px-3 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
