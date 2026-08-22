"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCategories } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/v1/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to create category");
      }
      const body = await res.json();
      setCategories((prev) => (prev ? [...prev, body.category].sort((a, b) => a.name.localeCompare(b.name)) : [body.category]));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>

      {!categories ? (
        <p className="mt-6 text-foreground/60">Loading...</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2 text-sm">
          {categories.map((cat) => (
            <li key={cat._id} className="rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145]">
              {cat.name}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-sm items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          New category name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
