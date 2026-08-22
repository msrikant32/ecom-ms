import Link from "next/link";
import { topics } from "@/content/topics";
import { renderingModes } from "@/content/renderingModes";
import { topics as interviewTopics, getQuestionsForTopic } from "@/content/interview";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
          Node.js Core Concepts
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Watch the event loop actually run.
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Eight interactive, step-through visualizations of the call stack,
          callbacks, the event loop, libuv, promises, async/await, cluster,
          and worker threads — see exactly what moves where, and when,
          instead of just reading about it.
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
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {topic.blurb}
            </p>
          </Link>
        ))}
      </div>

      <header className="flex flex-col gap-3 pt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Practical Implementations
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Real, working code — not simulations.
        </h2>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Full implementations of production patterns, wired to the actual
          express-production-api backend in this repo.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">01</span>
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            Large File Upload
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chunked, resumable upload streamed straight to disk — never
            buffered whole in memory, however large the file.
          </p>
        </Link>

        <Link
          href="/rate-limiting"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">02</span>
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            Rate Limiting
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hit a real, tightly-tuned limiter until it actually returns 429 —
            watch the live quota gauge and response headers, not a countdown animation.
          </p>
        </Link>

        <Link
          href="/databases"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">03</span>
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            SQL & NoSQL Playground
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The same data, normalized and joined in real SQLite vs. embedded
            in real MongoDB — run live queries against both, side by side.
          </p>
        </Link>

        <Link
          href="/docker"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">04</span>
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            Docker, Simulated
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Container vs VM startup time, and an interactive Dockerfile
            layer-cache simulator — real cache math, computed live.
          </p>
        </Link>

        <Link
          href="/algorithms"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">05</span>
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            Big O Playground
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Six real code patterns, real operation counts, one slider —
            watch O(n) and O(n²) diverge as n grows, live.
          </p>
        </Link>
      </div>

      <header className="flex flex-col gap-3 pt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Rendering Strategies
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          CSR, SSR, SSG, and ISR — four real pages, four real behaviors.
        </h2>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Each page renders a timestamp using a different Next.js rendering
          mode. Reload each one (in a production build) to see exactly when
          and where that timestamp actually gets computed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {renderingModes.map((mode, index) => (
          <Link
            key={mode.id}
            href={`/rendering/${mode.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-violet-400 dark:border-zinc-800 dark:hover:border-violet-600"
          >
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
              {mode.title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{mode.blurb}</p>
          </Link>
        ))}
      </div>

      <header className="flex flex-col gap-3 pt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Interview Prep
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Real questions, thorough answers.
        </h2>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Questions collected from actual interviews, answered comprehensively and linked back
          to working examples elsewhere on this site.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {interviewTopics
          .filter((topic) => getQuestionsForTopic(topic.id).length > 0)
          .map((topic) => {
            const count = getQuestionsForTopic(topic.id).length;
            return (
              <Link
                key={topic.id}
                href={`/interview/topics/${topic.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-amber-400 dark:border-zinc-800 dark:hover:border-amber-600"
              >
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
                  {count} question{count === 1 ? "" : "s"}
                </span>
                <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-amber-600 dark:text-zinc-50 dark:group-hover:text-amber-400">
                  {topic.label}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{topic.blurb}</p>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
