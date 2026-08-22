import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SqlPlayground } from "@/components/playground/SqlPlayground";

export const metadata: Metadata = {
  title: "SQL — Databases",
};

const CONCEPTS = [
  {
    level: "Beginner",
    color: "text-emerald-600 dark:text-emerald-400",
    points: [
      {
        title: "Tables, rows, columns — a fixed schema",
        detail:
          "A relational database stores data in tables, each with a predefined set of typed columns. Every row in a table has the same shape — you can't add an ad-hoc field to one row without altering the table for all of them.",
      },
      {
        title: "Primary keys and foreign keys",
        detail:
          "A primary key uniquely identifies a row within its table. A foreign key in one table references a primary key in another, which is how relational databases represent relationships — a product doesn't contain its orders; an order_items row points at both an order and a product by id.",
      },
      {
        title: "SELECT, WHERE, ORDER BY — reading data",
        detail:
          "The basic shape of reading data: SELECT which columns, FROM which table, WHERE which rows qualify, ORDER BY what sequence. Everything else in SQL builds on this.",
      },
    ],
  },
  {
    level: "Intermediate",
    color: "text-amber-600 dark:text-amber-400",
    points: [
      {
        title: "JOINs — reassembling related rows at query time",
        detail:
          "Because related data lives in separate tables, reading it back together requires a JOIN. INNER JOIN returns rows with a match in both tables; LEFT JOIN keeps every row from the left table even without a match (filling the right side with NULLs). This is the direct cost of normalization: the database does the assembly work per-query instead of once at write time.",
      },
      {
        title: "Normalization — one fact, one place",
        detail:
          "Normalization (1NF, 2NF, 3NF, informally) means each piece of data is stored exactly once, referenced by key everywhere else it's needed — a customer's email lives in the customers table, never copied into every order row. This prevents update anomalies (changing an email in one place but not another) at the cost of needing JOINs to reassemble a full picture.",
      },
      {
        title: "Indexes — the difference between a scan and a lookup",
        detail:
          "Without an index, finding rows matching a WHERE clause means scanning every row in the table. An index (typically a B-tree) on the filtered column lets the database jump directly to matching rows. Indexes speed up reads but slow down writes (every INSERT/UPDATE has to maintain the index too) and cost storage — they're a deliberate tradeoff, not a free win.",
      },
      {
        title: "Transactions and ACID",
        detail:
          "A transaction groups multiple statements so they either all succeed or all fail together. ACID: Atomicity (all-or-nothing), Consistency (never leaves data in a state that violates constraints), Isolation (concurrent transactions don't see each other's uncommitted changes), Durability (once committed, survives a crash).",
      },
    ],
  },
  {
    level: "Advanced / lead & architecture",
    color: "text-rose-600 dark:text-rose-400",
    points: [
      {
        title: "Isolation levels and the anomalies they trade off",
        detail:
          "Stricter isolation prevents more anomalies (dirty reads, non-repeatable reads, phantom reads) but reduces concurrency. READ COMMITTED is a common default; SERIALIZABLE is the strictest (fully prevents all three, at the highest contention cost). Choosing an isolation level is choosing a specific point on that tradeoff, not a fixed correct answer.",
      },
      {
        title: "Query planning — EXPLAIN before you guess",
        detail:
          "A query planner decides HOW to execute a query (which index to use, in what join order) — EXPLAIN (or EXPLAIN ANALYZE) shows that plan, revealing whether a query is actually using an index or silently falling back to a full table scan. Guessing at performance without looking at the plan is the most common real-world SQL mistake at any experience level.",
      },
      {
        title: "Denormalization — a deliberate architecture decision",
        detail:
          "At read-heavy scale, the JOIN cost of full normalization can become the bottleneck — denormalizing (duplicating some data to avoid a JOIN) trades write complexity and consistency risk for read speed. This is an architecture-level call, made deliberately and narrowly (one hot read path), not a default.",
      },
      {
        title: "Scaling a relational database — and when to stop trying",
        detail:
          "Vertical scaling, then read replicas, then very carefully considered sharding by a partition key — sharding a relational database is genuinely hard specifically because JOINs and transactions that used to be trivial within one instance become cross-shard problems. This is frequently the actual point where a team seriously evaluates NoSQL for a specific workload, not because SQL is 'slow', but because the workload no longer fits comfortably in one normalized, joinable schema.",
      },
    ],
  },
];

export default function SqlDatabasePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Databases", href: "/databases" }, { label: "SQL" }]}
      />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
          SQL / Relational
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Normalized tables, joined at read time
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          The playground below runs against a real, seeded SQLite database with four normalized
          tables — customers, products, orders, order_items — the exact shape the JOINs below are
          reassembling.
        </p>
      </header>

      {CONCEPTS.map((section) => (
        <section key={section.level} className="flex flex-col gap-3">
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${section.color}`}>{section.level}</h2>
          <div className="flex flex-col gap-3">
            {section.points.map((p) => (
              <div key={p.title} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Try it live
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">SQL playground</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Real SQLite, a real read-only connection — only SELECT runs, everything else is
            rejected before it ever reaches the database.
          </p>
        </div>
        <SqlPlayground />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link href="/interview/topics/database" className="text-sky-600 hover:underline dark:text-sky-400">
          SQL interview questions →
        </Link>{" "}
        — basic through lead/architect level.
      </p>
    </div>
  );
}
