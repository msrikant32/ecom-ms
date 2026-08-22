"use client";

import { useState, type FormEvent } from "react";
import { login, type AuthUser } from "@/lib/upload/api";

export function LoginPanel({
  onLoggedIn,
}: {
  onLoggedIn: (accessToken: string, user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("AdminPass123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      onLoggedIn(result.accessToken, result.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed — is express-production-api running on :3000?"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The upload API is a real Bearer-token-authenticated endpoint on
        express-production-api, not a mock — sign in with the dev admin
        account it seeds automatically outside production. Start that server
        (<code className="font-mono">npm run dev</code> in{" "}
        <code className="font-mono">express-production-api/</code>) before
        using this page.
      </p>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
          required
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
