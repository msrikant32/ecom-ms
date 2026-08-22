import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { MongoPlayground } from "@/components/playground/MongoPlayground";

export const metadata: Metadata = {
  title: "NoSQL — Databases",
};

const CONCEPTS = [
  {
    level: "Beginner",
    color: "text-emerald-600 dark:text-emerald-400",
    points: [
      {
        title: "Documents, not rows — no fixed schema",
        detail:
          "MongoDB stores JSON-like documents in collections. Unlike a SQL table, documents in the same collection don't need identical fields — one product document can have a tags array another one doesn't. The tradeoff: the database enforces far less structure for you, so consistency across documents becomes an application responsibility, not a schema guarantee.",
      },
      {
        title: "The NoSQL family isn't one thing",
        detail:
          "Document stores (MongoDB) store JSON-like documents. Key-value stores (Redis) map a key straight to a value with no query language beyond the key. Column-family stores (Cassandra) optimize for very wide rows across huge clusters. Graph databases (Neo4j) model relationships as first-class edges. 'NoSQL' describes what they're not, not a shared design — the differences between these four matter more than the label.",
      },
      {
        title: "find() — the basic read",
        detail:
          "The core read operation: find a collection's documents matching a filter object, e.g. { price: { $lt: 100 } }. No JOIN keyword exists in the core query language — related data is either embedded directly in the document, or referenced by id and fetched with a second query (or an aggregation $lookup).",
      },
    ],
  },
  {
    level: "Intermediate",
    color: "text-amber-600 dark:text-amber-400",
    points: [
      {
        title: "Embedding vs referencing — the central modeling decision",
        detail:
          "Embed related data directly in the parent document when it's read together and doesn't grow unboundedly (this playground's orders embed their customer info and line items — reading an order needs zero joins). Reference by id, like a SQL foreign key, when the related data is large, shared across many parents, or updated independently — a product embedded into every order that ever included it would mean updating hundreds of copies every time its price changes.",
      },
      {
        title: "Indexing works similarly to SQL, but you opt in per-field",
        detail:
          "MongoDB uses B-tree indexes too, and the same fundamental tradeoff applies (faster reads, slower writes, more storage) — but nothing is indexed by default except _id. A query filtering on an unindexed field does a full collection scan, exactly like an unindexed SQL WHERE clause.",
      },
      {
        title: "The aggregation pipeline — SQL's GROUP BY, as composable stages",
        detail:
          "An aggregation pipeline is a sequence of stages ($match, $group, $sort, $project, $lookup) each transforming the document stream in turn — roughly MongoDB's equivalent of SQL's WHERE/GROUP BY/ORDER BY/JOIN, but expressed as an explicit, inspectable pipeline rather than a single declarative statement.",
      },
    ],
  },
  {
    level: "Advanced / lead & architecture",
    color: "text-rose-600 dark:text-rose-400",
    points: [
      {
        title: "Consistency models — what 'read your own write' actually guarantees",
        detail:
          "A single MongoDB replica set gives strong consistency on the primary by default; reads from a secondary can be stale (eventual consistency) unless you explicitly request a stronger read concern. Choosing where reads are allowed to come from is choosing a point on the consistency/availability/latency tradeoff, not a fixed property of 'using MongoDB'.",
        relatedLink: { href: "/interview/cap-theorem", label: "Full CAP theorem breakdown, already covered" },
      },
      {
        title: "Replication and sharding",
        detail:
          "A replica set handles availability and read scaling; sharding handles write throughput and storage beyond a single primary's capacity, splitting data across shards by a partition key. Already covered in depth as its own question — the short version: most systems need replicas long before they genuinely need sharding.",
        relatedLink: {
          href: "/interview/database-replication-and-partitioning",
          label: "Full replication & partitioning breakdown, already covered",
        },
      },
      {
        title: "Polyglot persistence — using both, deliberately",
        detail:
          "A mature architecture rarely picks SQL OR NoSQL system-wide — it picks per workload: relational for the order/payment core where ACID transactions and referential integrity genuinely matter, a document store for a catalog with irregular per-category attributes, Redis for session/cache state, maybe Elasticsearch for full-text search. The architecture-level skill isn't picking a winner, it's drawing the boundaries between where each one earns its place.",
      },
    ],
  },
];

export default function NosqlDatabasePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Databases", href: "/databases" }, { label: "NoSQL" }]}
      />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          NoSQL / Document
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Embedded documents, no join required
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          The playground below runs against real MongoDB collections modeling the same domain as
          the SQL side — but an order here embeds its customer info and line items directly.
          Compare the &quot;orders for a customer&quot; example query here against the equivalent
          JOIN on the SQL page.
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
                {"relatedLink" in p && p.relatedLink && (
                  <Link
                    href={p.relatedLink.href}
                    className="mt-2 inline-block text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {p.relatedLink.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Try it live
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">MongoDB playground</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Real MongoDB, a real find() — against isolated demo collections, never the app&apos;s
            actual user/order data.
          </p>
        </div>
        <MongoPlayground />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link href="/interview/topics/database" className="text-emerald-600 hover:underline dark:text-emerald-400">
          NoSQL interview questions →
        </Link>{" "}
        — basic through lead/architect level.
      </p>
    </div>
  );
}
