"use client";

import { useState, useTransition } from "react";
import posthog from "posthog-js";

import { startOAuthSignIn } from "@/actions/auth";

interface LoginFormProps {
  initialError?: string;
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [error, setError] = useState(initialError);
  const [isPending, startTransition] = useTransition();

  function handleOAuth(provider: "google" | "github"): void {
    setError(undefined);
    posthog.capture("oauth_sign_in_started", { provider });
    startTransition(async () => {
      const result = await startOAuthSignIn(provider);

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.assign(result.authorizationUrl);
    });
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm sm:p-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome to JobPilot
        </h1>
        <p className="mt-3 text-base leading-6 text-text-secondary">
          Find your next role with a clearer plan and better matches.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleOAuth("google")}
          className="flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Connecting..." : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleOAuth("github")}
          className="flex min-h-11 w-full items-center justify-center rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Connecting..." : "Continue with GitHub"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-text-muted">
        By continuing, you agree to use JobPilot for your own job search.
      </p>

      {error ? (
        <p role="alert" className="mt-5 text-center text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
