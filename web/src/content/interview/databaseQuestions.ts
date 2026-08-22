import type { InterviewQuestion } from "./types";

// SQL and NoSQL, basic through lead/architect level. Both categories map to
// the existing "database" topic (see CATEGORY_TO_TOPIC in index.ts), joining
// the CAP theorem / replication / caching questions already there. Paired
// with a real, live playground for each at /databases/sql and /databases/nosql.
export const databaseQuestions: InterviewQuestion[] = [
  // ---------- SQL ----------
  {
    slug: "sql-relational-basics",
    question: "What is a relational database, and what do primary/foreign keys actually do?",
    category: "SQL",
    round: "general",
    summary:
      "Tables with a fixed schema, related to each other by key rather than by nesting — a primary key identifies a row, a foreign key points at one in another table.",
    intro: "The foundational question — the strongest answers connect the key mechanism directly to WHY relational databases avoid duplicating data, not just define the terms.",
    sections: [
      {
        heading: "The model",
        points: [
          {
            title: "Fixed-schema tables, related by reference",
            detail:
              "Every row in a table has the same columns. Relationships between entities (a customer has many orders) are represented by a foreign key column pointing at another table's primary key, not by nesting one inside the other.",
            relatedLink: { href: "/databases/sql", label: "Live schema + playground: customers/products/orders/order_items" },
          },
          {
            title: "Primary key vs foreign key",
            detail:
              "A primary key uniquely identifies a row within its own table (usually an auto-incrementing id) and is enforced unique by the database. A foreign key is a column whose value must match an existing primary key in another table — the database can enforce this (referential integrity), rejecting an order_items row that points at a product id that doesn't exist.",
          },
        ],
      },
    ],
    closingTip: "State the mechanism, then the consequence: keys are what let the same customer/product be referenced from many rows without ever duplicating that data — which is exactly what normalization is built on.",
  },
  {
    slug: "sql-join-types",
    question: "Explain the different SQL JOIN types — INNER, LEFT, RIGHT, FULL.",
    category: "SQL",
    round: "general",
    summary:
      "INNER keeps only matched rows; LEFT/RIGHT keep every row from one side regardless of a match, filling the other side with NULLs; FULL keeps every row from both.",
    intro: "A predict-the-output-shaped question — the strongest answer states what happens to UNMATCHED rows on each side, since that's what actually distinguishes the four.",
    sections: [
      {
        heading: "The four types",
        points: [
          {
            title: "INNER JOIN — only rows with a match on both sides",
            detail: "A customer with zero orders disappears entirely from an INNER JOIN between customers and orders.",
            code: `SELECT c.name, o.status\nFROM customers c\nINNER JOIN orders o ON o.customer_id = c.id;\n-- customers with no orders are excluded entirely`,
            codeLanguage: "sql",
          },
          {
            title: "LEFT JOIN — every row from the left table, matched or not",
            detail: "A customer with zero orders still appears once, with every orders.* column NULL. This is the most commonly needed join in practice — 'show me all X, with Y if it exists'.",
            code: `SELECT c.name, o.status\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id;\n-- customers with no orders still appear, o.status is NULL`,
            codeLanguage: "sql",
          },
          {
            title: "RIGHT JOIN and FULL JOIN",
            detail: "RIGHT JOIN is LEFT JOIN with the tables' roles reversed — rarely used since you can just swap the FROM/JOIN order and use LEFT instead. FULL JOIN keeps unmatched rows from BOTH sides simultaneously — less common, mostly useful for finding mismatches between two tables that should mostly line up.",
          },
        ],
      },
    ],
    closingTip: "The playground's example query joins four tables (customers → orders → order_items → products) to answer 'what did this customer order, with product names' — walking through that live is a stronger demonstration than reciting the definitions.",
  },
  {
    slug: "sql-normalization",
    question: "What is normalization, and when would you deliberately denormalize?",
    category: "SQL",
    round: "general",
    summary:
      "Normalization stores each fact exactly once, referenced by key everywhere else — denormalization is the deliberate, narrow exception made for a specific hot read path, not a default.",
    intro: "Strong answers frame denormalization as an explicit tradeoff made under measured pressure, not a shortcut — interviewers are checking you won't reach for it prematurely.",
    sections: [
      {
        heading: "Normalization",
        points: [
          {
            title: "One fact, one place",
            detail:
              "A customer's email lives in exactly one row of the customers table. Every order references that customer by id rather than copying the email into every order row. This prevents update anomalies — changing the email once, correctly, versus needing to find and update every duplicated copy.",
          },
        ],
      },
      {
        heading: "Denormalization",
        points: [
          {
            title: "A narrow, deliberate, measured exception",
            detail:
              "At read-heavy scale, the JOIN cost to reassemble normalized data can become the actual bottleneck on one specific hot path. Denormalizing there (duplicating some data to skip a JOIN) trades write complexity and a consistency risk (the duplicate can drift out of sync) for read speed — worth doing on a measured hot path, not as a general schema philosophy.",
          },
        ],
      },
    ],
    closingTip: "Naming the specific risk denormalization introduces — data drifting out of sync between the original and the duplicate — is what separates 'knows the tradeoff' from 'knows the word'.",
  },
  {
    slug: "sql-indexes-how-they-work",
    question: "How do SQL indexes actually work, and why aren't all columns indexed?",
    category: "SQL",
    round: "general",
    summary:
      "A B-tree structure lets the database jump to matching rows instead of scanning every row — but every index also has to be maintained on every write, and takes storage, so indexing everything isn't free.",
    intro: "The 'why not index everything' half is what separates a real answer from a definition.",
    sections: [
      {
        heading: "The mechanism",
        points: [
          {
            title: "B-tree: a sorted structure for fast lookup",
            detail:
              "Without an index, WHERE email = 'x' means scanning every row (a full table scan) to find matches. An index on email keeps a separate, sorted B-tree structure mapping values to row locations, so the database can jump almost directly to matches instead of scanning linearly.",
            code: `CREATE INDEX idx_customers_email ON customers(email);\n-- EXPLAIN afterward should show an index lookup instead of a full scan`,
            codeLanguage: "sql",
          },
        ],
      },
      {
        heading: "The cost",
        points: [
          {
            title: "Every index is maintained on every write",
            detail:
              "An INSERT or UPDATE that touches an indexed column has to update the index too, not just the row — more indexes means slower writes, plus real storage overhead per index. Index the columns actually filtered/joined/sorted on frequently, not every column defensively.",
          },
        ],
      },
    ],
    closingTip: "If asked how you'd verify an index is actually being used: EXPLAIN (or EXPLAIN ANALYZE) the query and look for an index scan/seek in the plan instead of a sequential/full scan — never assume, check.",
  },
  {
    slug: "sql-acid-transactions",
    question: "Explain ACID and walk through what a transaction actually guarantees.",
    category: "SQL",
    round: "general",
    summary:
      "Atomicity, Consistency, Isolation, Durability — a transaction groups statements so they succeed or fail together, never partially commit, even across a crash.",
    intro: "State all four letters with a concrete example for each — a definitions list without examples is the weak version of this answer.",
    sections: [
      {
        heading: "The four guarantees",
        points: [
          {
            title: "Atomicity, Consistency, Isolation, Durability",
            detail:
              "Atomicity: all statements in the transaction succeed, or none do — a crash mid-transaction leaves nothing partially applied. Consistency: the database never ends a transaction in a state that violates its own constraints (a foreign key pointing nowhere, a NOT NULL column left null). Isolation: concurrent transactions don't observe each other's uncommitted changes. Durability: once committed, the change survives a crash immediately after — it's on disk, not just in memory.",
            code: `BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT; -- both updates land together, or neither does`,
            codeLanguage: "sql",
          },
        ],
      },
    ],
    closingTip: "The money-transfer example above is the canonical concrete case: without atomicity, a crash between the two UPDATEs would delete money from the system entirely — state that failure mode explicitly, it's more convincing than the letter definitions alone.",
  },
  {
    slug: "sql-isolation-levels",
    question: "What are SQL isolation levels, and what anomalies do they trade off?",
    category: "SQL",
    round: "general",
    summary:
      "Stricter isolation prevents more anomalies (dirty reads, non-repeatable reads, phantom reads) but reduces concurrency — there's no universally correct level, only a tradeoff point chosen per workload.",
    intro: "An advanced-tier question — naming the three specific anomalies by name, and which level prevents which, is what distinguishes a strong answer here.",
    sections: [
      {
        heading: "The anomalies",
        points: [
          {
            title: "Dirty read, non-repeatable read, phantom read",
            detail:
              "A dirty read sees another transaction's UNCOMMITTED change. A non-repeatable read re-reads the same row twice in one transaction and gets a different value because another transaction committed a change in between. A phantom read re-runs the same WHERE query twice and gets a different SET of rows because another transaction inserted/deleted a matching row in between.",
          },
          {
            title: "The common levels",
            detail:
              "READ UNCOMMITTED allows all three (rarely used). READ COMMITTED (a common default) prevents dirty reads but allows the other two. REPEATABLE READ prevents dirty and non-repeatable reads but can still allow phantoms depending on the engine. SERIALIZABLE prevents all three, behaving as if transactions ran one at a time — at the highest contention/lock cost.",
          },
        ],
      },
    ],
    closingTip: "Frame the closing line as a tradeoff, not a ranking: 'stricter isolation is correctness at the cost of concurrency — pick the loosest level that still prevents the specific anomaly your workload can't tolerate, not automatically the strictest one available.'",
  },
  {
    slug: "sql-query-optimization-explain",
    question: "How do you actually optimize a slow SQL query?",
    category: "SQL",
    round: "general",
    summary:
      "Look at the query plan first — EXPLAIN reveals whether it's using an index or silently doing a full table scan — then fix the specific thing the plan actually shows, not the thing you'd guess.",
    intro: "The single biggest signal in this question: do you start with EXPLAIN, or do you start guessing? Interviewers are checking for the former.",
    sections: [
      {
        heading: "Start with the plan, not a guess",
        points: [
          {
            title: "EXPLAIN / EXPLAIN ANALYZE first, always",
            detail:
              "The plan shows the actual execution strategy: which indexes (if any) are used, the join order, and — with ANALYZE — actual row counts and timing per step, not just the estimate. A sequential/full scan on a large table where you expected an index scan is usually the single biggest finding.",
            code: `EXPLAIN ANALYZE\nSELECT * FROM orders WHERE customer_id = 42;\n-- look for "Seq Scan" (bad, on a large table) vs "Index Scan" (expected)`,
            codeLanguage: "sql",
          },
        ],
      },
      {
        heading: "Common fixes, once the plan tells you what's actually wrong",
        points: [
          {
            title: "Missing index, SELECT *, N+1, and function-wrapped WHERE columns",
            detail:
              "Add an index on the filtered/joined column if the plan shows a scan where it shouldn't. Select only needed columns instead of SELECT * (less data to move, and can enable an index-only scan). Watch for N+1 — one query per row in application code instead of a single JOIN or a WHERE IN (...) batch. And check whether a WHERE clause wraps the column in a function (WHERE LOWER(email) = ...) — that alone can silently disable an otherwise-present index unless it's a matching functional index.",
          },
        ],
      },
    ],
    closingTip: "Close with the discipline, not just the fix list: 'I'd run EXPLAIN before AND after the change, since a fix that looks obviously correct can still not move the actual plan.'",
  },
  {
    slug: "sql-sharding-relational-database",
    question: "How would you shard a relational database, and why is it hard?",
    category: "SQL",
    round: "general",
    summary:
      "Sharding splits rows across independent instances by a partition key — the hard part is that JOINs and transactions that were trivial within one instance become cross-shard problems the moment related rows can land on different shards.",
    intro: "Lead/architect level — the strongest answers name the SPECIFIC thing that breaks (cross-shard JOINs and transactions), not just that sharding is 'complex'.",
    sections: [
      {
        heading: "Why it's specifically hard for a relational database",
        points: [
          {
            title: "JOINs and transactions assumed everything was in one place",
            detail:
              "A JOIN between orders and order_items works trivially when both live in the same instance. Once orders are sharded by customer_id, a query joining across customers on different shards either needs the application to fan out and merge itself, or gives up genuine relational JOINs across the shard boundary entirely. The same problem hits multi-row ACID transactions — a transaction spanning two shards needs distributed transaction coordination (two-phase commit or similar), which is exactly the complexity a single-instance transaction never had to think about.",
          },
          {
            title: "Choosing a shard key well matters more than the sharding mechanism itself",
            detail:
              "A shard key that keeps commonly-joined/transacted-together data on the same shard (e.g. sharding orders by customer_id, and keeping that customer's order_items co-located) avoids most cross-shard JOINs. A poorly chosen key (sharding independently by order id) maximizes exactly the cross-shard problem above.",
          },
        ],
      },
    ],
    closingTip: "This is the natural bridge to the SQL-vs-NoSQL decision question — a system that needs to shard heavily and doesn't actually need cross-entity relational integrity is a strong candidate to reconsider the data model itself, not just the sharding strategy.",
  },
  {
    slug: "sql-schema-design-exercise",
    question: "Design a normalized schema for a multi-tenant SaaS billing system.",
    category: "SQL",
    round: "general",
    summary:
      "A structured design exercise — the strongest answers state the tenant-isolation strategy explicitly before drawing a single table, since that decision shapes every table that follows.",
    intro: "This is an open-ended design question — walk through the tenancy decision, the core entities, and the one correctness-critical detail (immutable historical amounts) in that order.",
    sections: [
      {
        heading: "Tenancy strategy — decide this first",
        points: [
          {
            title: "Shared schema with a tenant_id column, vs. schema-per-tenant, vs. database-per-tenant",
            detail:
              "A shared schema with a tenant_id column on every table (and a composite index/foreign key including it) is the common default — cheapest to operate, requires discipline (every single query must filter by tenant_id, ideally enforced by an application-layer guard, not just convention). Schema-per-tenant or database-per-tenant gives stronger isolation at real operational cost (migrations run N times) — reserved for compliance-driven isolation requirements, not the default.",
          },
        ],
      },
      {
        heading: "Core entities",
        points: [
          {
            title: "tenants, plans, subscriptions, invoices, invoice_line_items, payments",
            detail:
              "tenants (the customer account). plans (pricing tiers, versioned — see below). subscriptions (which tenant is on which plan, with a start date and optional end date). invoices (one per billing period per tenant) with invoice_line_items (each charge). payments (attempts against an invoice, with a status).",
          },
          {
            title: "Invoice line items snapshot the price — never reference the live plan",
            detail:
              "Exactly the same principle as an e-commerce order snapshotting product price at purchase time: an invoice_line_items row stores the amount actually charged, not a reference to the current plans.price. A plan's price changing next month must never retroactively change a January invoice's total.",
            relatedLink: { href: "/interview/design-ecommerce-system", label: "The same snapshot principle, in the e-commerce order schema" },
          },
        ],
      },
    ],
    closingTip: "Naming the tenant_id-on-every-query discipline (and how you'd enforce it beyond convention — a query builder wrapper, a middleware, row-level security) unprompted is the detail that shows real multi-tenant experience, not just schema design in the abstract.",
  },

  // ---------- NoSQL ----------
  {
    slug: "nosql-document-model-basics",
    question: "What is a document database, and how is querying it different from SQL?",
    category: "NoSQL",
    round: "general",
    summary:
      "Documents are JSON-like, don't require a fixed schema, and the core query is find() with a filter object — no JOIN keyword, related data is embedded or referenced by id instead.",
    intro: "The foundational NoSQL question — the strongest answer immediately contrasts against the SQL equivalent rather than defining documents in isolation.",
    sections: [
      {
        heading: "The model",
        points: [
          {
            title: "JSON-like documents, no fixed schema",
            detail:
              "A MongoDB collection holds documents that don't need identical fields — one product document can have a tags array another one lacks entirely. The database won't reject a document for having 'extra' or 'missing' fields the way a SQL table with a fixed column set would.",
            relatedLink: { href: "/databases/nosql", label: "Live schema + playground: products and orders collections" },
          },
          {
            title: "find(), not SELECT/JOIN",
            detail:
              "The base read is find(filter) — a JSON object describing which documents match. There's no JOIN keyword in the core query language; related data either lives embedded in the document already (no extra query needed) or is referenced by id and fetched separately (or joined via an aggregation $lookup stage).",
            code: `db.products.find({ price: { $lt: 100 } })`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip: "State plainly that schema flexibility is a tradeoff, not a pure win: less structure enforced by the database means more consistency responsibility shifts to the application.",
  },
  {
    slug: "nosql-family-overview",
    question: "Document, key-value, column-family, graph — what are the actual differences?",
    category: "NoSQL",
    round: "general",
    summary:
      "'NoSQL' describes what these four AREN'T (not relational) far more than a shared design — the differences between them matter more than the umbrella label.",
    intro: "A common trap in this question is treating 'NoSQL' as one thing with one set of tradeoffs — naming that it isn't is itself a strong opening line.",
    sections: [
      {
        heading: "The four common families",
        points: [
          {
            title: "Document, key-value, column-family, graph",
            detail:
              "Document stores (MongoDB) hold JSON-like documents, queryable by field. Key-value stores (Redis, DynamoDB in its simplest mode) map a key straight to an opaque value with no query language beyond the key itself — extremely fast, extremely limited querying. Column-family stores (Cassandra, HBase) optimize for very wide rows spread across huge clusters, built for massive write throughput. Graph databases (Neo4j) model relationships as first-class edges, built for queries that traverse relationships many hops deep — something a JOIN-heavy relational query handles increasingly poorly as the hop count grows.",
          },
        ],
      },
    ],
    closingTip: "If asked to pick one for a specific workload, answer from the QUERY PATTERN, not the label: 'friends of friends of friends' → graph; 'session lookup by token' → key-value; 'flexible product catalog' → document; 'write-heavy time-series at huge scale' → column-family.",
  },
  {
    slug: "nosql-embedding-vs-referencing",
    question: "Embedding vs referencing in MongoDB — how do you decide?",
    category: "NoSQL",
    round: "general",
    summary:
      "Embed when data is read together and doesn't grow unboundedly; reference — like a SQL foreign key — when it's large, shared across many parents, or updated independently of them.",
    intro: "This is the single most important MongoDB schema-design decision, and this app's own playground demonstrates both sides of it directly.",
    sections: [
      {
        heading: "When to embed",
        points: [
          {
            title: "Read together, bounded growth, owned by one parent",
            detail:
              "This app's playground order documents embed their customer info and line items directly — reading an order needs zero additional queries, exactly the point of embedding. Good candidates: data that's always read alongside its parent, and that doesn't grow without bound (a handful of order line items, not an unbounded activity log).",
            code: `// embedded — one document, one query, no join
{
  customer: { name: "Ava Chen", email: "ava@example.com" },
  items: [{ productName: "Mechanical Keyboard", quantity: 1, unitPrice: 89.99 }],
  status: "delivered"
}`,
            codeLanguage: "javascript",
            relatedLink: { href: "/databases/nosql", label: "Run this exact query live in the playground" },
          },
        ],
      },
      {
        heading: "When to reference",
        points: [
          {
            title: "Large, shared, or independently updated",
            detail:
              "A product embedded into every order that ever included it would mean updating potentially hundreds of embedded copies every time its price or description changes — reference it by id instead, the way a SQL foreign key would, and fetch it separately (or via $lookup) when needed. Also reference when the related collection can grow unboundedly per parent (an unlimited comment thread shouldn't be embedded inside its parent post document, which has a practical size ceiling).",
          },
        ],
      },
    ],
    closingTip: "Tie it back to the concrete contrast available in this app: the same order/customer/product relationship is embedded in the Mongo playground and normalized/joined in the SQL playground — that's not two arbitrary choices, it's the exact tradeoff this question is asking about, runnable side by side.",
  },
  {
    slug: "nosql-indexing-mongodb",
    question: "How does indexing work in MongoDB, and what happens without one?",
    category: "NoSQL",
    round: "general",
    summary:
      "Same B-tree fundamentals as SQL, same read/write tradeoff — but nothing is indexed by default except _id, so an unindexed filter means a full collection scan, exactly like an unindexed SQL WHERE clause.",
    intro: "A direct parallel to the SQL indexing question — the strongest answer states the parallel explicitly rather than re-deriving it from scratch.",
    sections: [
      {
        heading: "The mechanism, and the one MongoDB-specific gotcha",
        points: [
          {
            title: "B-tree indexes, opt-in per field",
            detail:
              "createIndex({ field: 1 }) builds the same kind of sorted structure a SQL index does, with the same tradeoff: faster reads on that field, slower writes (every insert/update maintains the index too), extra storage. Only _id is indexed automatically — everything else is a deliberate choice.",
            code: `db.products.createIndex({ category: 1, price: -1 }); // compound index — order matters
db.products.find({ category: "Electronics" }).sort({ price: -1 }).explain("executionStats");`,
            codeLanguage: "javascript",
          },
          {
            title: "Compound index field order matters",
            detail:
              "A compound index on { category: 1, price: -1 } efficiently serves queries filtering on category alone, or category AND price, but NOT a query filtering on price alone — the index is only usable as a left-to-right prefix of its fields, the same rule as a SQL composite index.",
          },
        ],
      },
    ],
    closingTip: "Same closing move as the SQL version: verify with explain(\"executionStats\") that a query is actually using COLLSCAN vs IXSCAN — don't assume an index is helping just because it exists.",
  },
  {
    slug: "nosql-aggregation-pipeline",
    question: "Explain the MongoDB aggregation pipeline with a real example.",
    category: "NoSQL",
    round: "general",
    summary:
      "A sequence of stages ($match, $group, $sort, $lookup...) each transforming the document stream in turn — roughly MongoDB's WHERE/GROUP BY/ORDER BY/JOIN, expressed as an explicit pipeline instead of one declarative statement.",
    intro: "Walking through a concrete pipeline stage-by-stage is a much stronger answer than listing stage names abstractly.",
    sections: [
      {
        heading: "A concrete pipeline",
        points: [
          {
            title: "Revenue per customer — the aggregation equivalent of the SQL GROUP BY example",
            detail:
              "$unwind flattens the embedded items array into one document per line item. $group then sums quantity*unitPrice per customer, exactly mirroring the SQL playground's 'revenue per customer' example query — same question, answered against the embedded shape instead of the joined one.",
            code: `db.orders.aggregate([
  { $unwind: "$items" },
  { $group: {
      _id: "$customer.name",
      totalSpent: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } }
  }},
  { $sort: { totalSpent: -1 } }
]);`,
            codeLanguage: "javascript",
          },
          {
            title: "$lookup — the closest thing to a JOIN",
            detail:
              "When data IS referenced rather than embedded, $lookup performs a left-outer-join-like operation against another collection by matching fields — the escape hatch for when you need to reassemble referenced data without a second round-trip from the application.",
          },
        ],
      },
    ],
    closingTip: "Naming that this exact query has a SQL twin (GROUP BY + SUM, in the SQL playground) — and that the pipeline needs an explicit $unwind specifically because the data is embedded — is the detail that shows real comparative understanding.",
  },
  {
    slug: "nosql-consistency-models",
    question: "What consistency guarantees does MongoDB actually give you, by default and beyond?",
    category: "NoSQL",
    round: "general",
    summary:
      "Strong consistency on reads from the primary by default; reads from a secondary can be stale unless you explicitly request a stronger read concern — consistency here is a per-query choice, not a fixed property of 'using MongoDB'.",
    intro: "Advanced/architect-level — ties directly into CAP theorem, already covered in depth elsewhere in this app.",
    sections: [
      {
        heading: "The default, and what changes it",
        points: [
          {
            title: "Primary reads are strongly consistent; secondary reads can be stale",
            detail:
              "A replica set's primary always has the latest write. A secondary applies writes asynchronously, so a read routed there (read preference secondary or secondaryPreferred) can return a slightly stale value — replication lag, not corruption. Read/write concerns let you dial this per-operation: a majority write concern waits for the write to reach a majority of replica set members before acknowledging, trading latency for durability.",
            relatedLink: { href: "/interview/cap-theorem", label: "Full CAP theorem breakdown" },
          },
        ],
      },
    ],
    closingTip: "Frame it exactly as a per-query dial, not a database-wide setting: 'the same replica set can serve a strongly-consistent read for a checkout and an eventually-consistent one for an analytics dashboard, in the same request cycle, on purpose.'",
  },
  {
    slug: "nosql-schema-migrations",
    question: "How do you evolve a schema in a schemaless database safely?",
    category: "NoSQL",
    round: "general",
    summary:
      "Schemaless means the database won't stop you from having two shapes of document at once — which makes the application code, not a migration tool, responsible for handling both during the transition.",
    intro: "This is really the same backward-compatibility discipline covered elsewhere in this app, applied to the specific case where there's no schema enforcement to lean on at all.",
    sections: [
      {
        heading: "Why this is harder than it sounds",
        points: [
          {
            title: "Old and new document shapes coexist, silently, for as long as the migration takes",
            detail:
              "Renaming a field in application code doesn't retroactively rename it in every existing document — old documents still have the old field name until a backfill runs, which for a large collection can take real time. Application code has to tolerate BOTH shapes simultaneously during that window, or every read of an un-migrated document breaks.",
            code: `// tolerate both the old and new field name during migration
const city = doc.customer?.city ?? doc.customerCity ?? null;`,
            codeLanguage: "javascript",
            relatedLink: {
              href: "/interview/backward-compatibility-immediate-migration",
              label: "The same expand-migrate-contract discipline, applied to APIs",
            },
          },
          {
            title: "A versioned backfill script, run idempotently",
            detail:
              "Add the new field/shape everywhere new writes happen first. Backfill existing documents in batches (idempotent — safe to re-run if interrupted). Only once the backfill is confirmed complete does application code stop tolerating the old shape — and only after that does anything remove the old field.",
          },
        ],
      },
    ],
    closingTip: "Naming that a schemaless database makes this the APPLICATION's problem instead of the database's is the key insight — a SQL ALTER TABLE at least fails loudly if you forget a step; a missed field in a Mongo migration just silently returns undefined.",
  },
  {
    slug: "nosql-when-to-choose-over-sql",
    question: "When would you actually choose NoSQL over SQL, architecturally?",
    category: "NoSQL",
    round: "general",
    summary:
      "Not 'NoSQL is faster' — choose it when the data is naturally document-shaped and irregular, when horizontal write scaling matters more than cross-entity transactional integrity, or when the query pattern is fundamentally key-based rather than relational.",
    intro: "The capstone comparison question — the strongest answers actively avoid a blanket 'NoSQL for scale, SQL for structure' answer and instead name specific, concrete deciding factors.",
    sections: [
      {
        heading: "Real deciding factors, not a scale myth",
        points: [
          {
            title: "'NoSQL scales better' is not, by itself, a real reason",
            detail:
              "A well-indexed, well-sharded relational database handles enormous scale in practice — most systems hit query/schema design problems long before they hit a wall SQL genuinely can't cross. The real deciding factors are structural, not raw throughput.",
          },
          {
            title: "Choose document/NoSQL when...",
            detail:
              "The data is naturally irregular/self-contained per entity (a product catalog where different categories have wildly different attributes), the access pattern is dominated by reading one aggregate whole rather than joining many entities together, or you need horizontal write scaling across many independent partitions more than you need strict cross-entity transactional consistency.",
          },
          {
            title: "Choose relational/SQL when...",
            detail:
              "Multiple entities need to stay transactionally consistent together (the classic case: money moving between two accounts, or an order's total staying consistent with its line items), the data is naturally tabular and relationships are the interesting part of the model, or you need ad-hoc, unpredictable-in-advance querying across many dimensions — SQL's declarative query language handles queries nobody anticipated at schema-design time far better than a document store's per-access-pattern indexing does.",
            sourceRef: "express-production-api uses MongoDB for the app's own products/orders — a real, deliberate choice for that domain's shape, not a default",
          },
        ],
      },
    ],
    closingTip: "The strongest possible closing line names that this is rarely all-or-nothing: 'in practice I'd expect to justify this per-workload within one system, not pick one engine for the whole architecture' — which leads directly into polyglot persistence.",
  },
  {
    slug: "nosql-polyglot-persistence-architecture",
    question: "How would you design the data layer for a large system using both SQL and NoSQL?",
    category: "NoSQL",
    round: "general",
    summary:
      "Pick per workload, not system-wide: relational for the transactional core where consistency matters, document stores for irregular catalogs, key-value for sessions/cache, search engines for full-text — the architecture skill is drawing the boundaries, not picking one winner.",
    intro: "Lead/architect capstone — walk through a concrete system and assign each piece to the engine whose strengths actually match that piece's access pattern.",
    sections: [
      {
        heading: "A concrete polyglot split, for an e-commerce-shaped system",
        points: [
          {
            title: "Relational core, document catalog, key-value cache/session, search index",
            detail:
              "Orders and payments: relational (Postgres/MySQL) — multi-row ACID transactions matter here (an order's total must stay consistent with its line items and its payment status). Product catalog: document store (MongoDB) — categories have wildly different attribute sets, and catalog browsing rarely needs cross-entity transactions. Sessions and hot caches: key-value (Redis) — pure key lookup, sub-millisecond latency, no relational structure needed at all. Full-text/faceted product search: a dedicated search engine (Elasticsearch/Atlas Search) — neither a relational LIKE query nor a Mongo regex scales or ranks results well.",
          },
          {
            title: "The real cost: keeping them in sync",
            detail:
              "Polyglot persistence isn't free — the same product now potentially exists in the relational order line-item snapshot, the Mongo catalog document, and the search index, and something has to keep them consistent (event-driven sync via a message queue on write, or acceptable eventual consistency with a defined lag). Naming this cost explicitly, and how you'd propagate a change, is what separates an architect-level answer from a shopping list of databases.",
          },
        ],
      },
    ],
    closingTip: "Close by naming the actual failure mode of getting this wrong: adopting a second database engine for a narrow win without a real plan for keeping it in sync is how systems end up with silently stale search results or catalog data that doesn't match what actually shipped — the sync strategy is the load-bearing part of this answer, not the choice of engines.",
  },
];
