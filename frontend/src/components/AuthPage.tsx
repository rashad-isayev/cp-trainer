"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authenticate } from "../lib/api";
import type { AuthMode } from "../lib/types";
import { AuthForm } from "./AuthForm";

const TOKEN_KEY = "cp-trainer-token";

type AuthPageProps = {
  mode: AuthMode;
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await authenticate(mode, username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-xl px-6 py-20">
        <header className="mb-10">
          <div className="mb-6 text-5xl leading-none">🧩</div>
          <p className="mb-2 text-sm text-[var(--text-tertiary)]">
            Competitive Programming Trainer
          </p>
          <h1 className="text-[var(--text-primary)]">
            Practice smarter
          </h1>
          <p className="mt-4 text-base text-[var(--text-secondary)]">
            Keep your auth simple: register once, log in quickly, and see your coding
            problems on the home page.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-[#f2c6c3] bg-[#fdebec] px-3 py-2 text-sm text-[#d44c47]">
            {error}
          </div>
        )}

        <AuthForm
          mode={mode}
          username={username}
          password={password}
          submitting={submitting}
          onModeChange={() => {
            const newMode = mode === "login" ? "register" : "login";
            router.push(newMode === "login" ? "/login" : "/register");
          }}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
