import type { Metadata } from "next";
import Link from "next/link";
import { topics } from "@/content/topics";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Node.js Core Concepts",
};

export default function TopicsIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Node.js Concepts" }]} />

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Watch the event loop actually run.
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Eight interactive, step-through visualizations of the call stack, callbacks, the event
          loop, libuv, promises, async/await, cluster, and worker threads — see exactly what
          moves where, and when, instead of just reading about it.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic, index) => (
          <Link
            key={topic.id}
            href={`/topics/${topic.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-sky-400 dark:border-zinc-800 dark:hover:border-sky-600"
          >
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-sky-600 dark:text-zinc-50 dark:group-hover:text-sky-400">
              {topic.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{topic.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
