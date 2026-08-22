import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Databases — SQL & NoSQL",
};

export default function DatabasesPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Databases" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-lime-600 dark:text-lime-400">
          Practical Implementation
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          SQL & NoSQL — beginner to architecture level, with real query execution
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Both sides model the exact same small e-commerce domain — customers, products, orders —
          so the structural difference is the whole point: SQL normalizes it across four joined
          tables, MongoDB embeds it as self-contained documents. Concepts progress from beginner
          to lead/architect level, and each side ends in a real, live query playground — not a
          fabricated example.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/databases/sql"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-sky-400 dark:border-zinc-800 dark:hover:border-sky-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">SQL</span>
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-sky-600 dark:text-zinc-50 dark:group-hover:text-sky-400">
            Relational — normalized, joined, ACID
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tables, keys, JOINs, normalization, indexes, transactions, isolation levels — then a
            live SQLite playground running real SELECTs (including a 4-table JOIN) against seeded
            data.
          </p>
        </Link>
        <Link
          href="/databases/nosql"
          className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600"
        >
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">NoSQL</span>
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
            Document — embedded, flexible, horizontally scaled
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Documents vs rows, embedding vs referencing, indexing, aggregation pipelines,
            consistency models — then a live MongoDB playground running real find() queries
            against the same domain, embedded instead of joined.
          </p>
        </Link>
      </div>

      <Link
        href="/databases/scaling"
        className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-lime-400 dark:border-zinc-800 dark:hover:border-lime-600"
      >
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">Animated</span>
        <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-lime-600 dark:text-zinc-50 dark:group-hover:text-lime-400">
          Sharding, hotspots & rebalancing
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Watch a hot key overload one shard, watch salting spread it back out, and see a real,
          computed comparison of how much data moves — naive rehashing vs. consistent hashing —
          when a shard is added.
        </p>
      </Link>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Looking for the interview-question version of this content?{" "}
        <Link href="/interview/topics/database" className="text-lime-600 hover:underline dark:text-lime-400">
          Database interview questions →
        </Link>{" "}
        — basic through lead/architect level, including distributed databases, CAP theorem, and
        caching, already covered there.
      </p>
    </div>
  );
}
