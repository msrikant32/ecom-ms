import type { InterviewQuestion } from "./types";

// Questions from interviews other than the 3-round one this section was
// originally built around, plus supplementary topics added directly —
// kept separate so each round file accurately reflects only the
// questions actually asked in that specific interview.
export const generalQuestions: InterviewQuestion[] = [
  {
    slug: "api-optimization",
    question: "How can you optimize an API?",
    category: "Backend / System Design",
    round: "general",
    summary:
      "There's no single answer — a strong response covers payload size, round trips, caching, the data layer, the concurrency model, reliability, and how you'd actually measure any of it.",
    intro:
      "This is intentionally an open-ended question — interviewers are checking whether you reach for one favorite trick (\"add caching!\") or actually reason across the whole request path: client, network, server concurrency model, data layer, and how you'd know an optimization worked at all. Structuring your answer by layer, the way the sections below are organized, is itself part of a strong answer.",
    sections: [
      {
        heading: "1. Reduce what goes over the wire",
        points: [
          {
            title: "Compress responses",
            detail:
              "gzip/brotli on the way out. Usually a one-line middleware change (e.g. Express's compression()) for a large win on text-heavy JSON responses.",
          },
          {
            title: "Don't over-fetch or under-fetch",
            detail:
              "Let clients ask for only the fields/relations they need (sparse fieldsets, GraphQL) instead of always returning the full object graph — and conversely, avoid forcing clients into N follow-up requests just to assemble one screen.",
          },
          {
            title: "Paginate, don't dump",
            detail:
              "Never return an unbounded list. Offset pagination (?page=&limit=) is simple and fine for small, stable datasets; cursor-based pagination scales better and stays correct under concurrent writes, at the cost of losing 'jump to page N'.",
            sourceRef:
              "express-production-api/src/routes/v1/product.routes.js (offset) vs. order.routes.js (cursor)",
          },
          {
            title: "Use an efficient wire format for high-throughput internal APIs",
            detail:
              "JSON is fine for most public APIs, but protobuf/msgpack/Avro cut payload size and (de)serialization cost meaningfully for service-to-service calls at scale.",
          },
        ],
      },
      {
        heading: "2. Reduce the number of round trips",
        points: [
          {
            title: "Batch related operations",
            detail:
              "One request that does several things beats five requests with network latency between each of them — especially over high-latency mobile connections.",
          },
          {
            title: "Let the transport help you",
            detail:
              "HTTP/2 (or HTTP/3) multiplexes many requests over one connection instead of opening a new TCP+TLS handshake per request — often a bigger win than anything in your application code.",
          },
          {
            title: "Keep-alive / connection pooling",
            detail:
              "Reuse connections (both browser↔server and server↔database/downstream services) instead of paying handshake cost on every call.",
          },
          {
            title: "Push static/cacheable work to the edge",
            detail:
              "A CDN in front of your API for cacheable GETs answers requests from a point-of-presence near the user instead of a round trip to your origin region.",
          },
        ],
      },
      {
        heading: "3. Cache aggressively, but correctly",
        points: [
          {
            title: "HTTP caching semantics",
            detail:
              "Cache-Control, ETag, and conditional requests (If-None-Match → 304 Not Modified) let clients and intermediaries skip re-fetching unchanged data entirely.",
          },
          {
            title: "Server-side response caching",
            detail:
              "Cache expensive GET responses in Redis (or in-memory for a single instance), keyed by the request, invalidated by pattern on writes.",
            sourceRef: "express-production-api/src/middleware/cacheMiddleware.js + utils/cache.js",
          },
          {
            title: "Client-side caching",
            detail:
              "Libraries like React Query/SWR give you stale-while-revalidate for free: show cached data instantly, refetch in the background.",
          },
          {
            title: "Know what NOT to cache",
            detail:
              "Anything personalized, anything that must be strongly consistent (e.g. a bank balance right after a transfer) needs careful cache keys/short TTLs or no caching at all — the interviewer wants to hear you know the tradeoff, not just the trick.",
          },
        ],
      },
      {
        heading: "4. Fix the data layer — usually the real bottleneck",
        points: [
          {
            title: "Index what you query on",
            detail:
              "The single highest-leverage database change in most systems. Use EXPLAIN/EXPLAIN ANALYZE to confirm the index is actually being used, not just present.",
          },
          {
            title: "Eliminate N+1 queries",
            detail:
              "The classic ORM trap: fetching a list, then querying once per row for a related field. Fix with eager loading/joins, or a batching pattern like DataLoader.",
          },
          {
            title: "Connection pooling to the database",
            detail:
              "Opening a fresh DB connection per request is expensive; a pool amortizes that cost across requests.",
          },
          {
            title: "Read replicas / denormalization for read-heavy workloads",
            detail:
              "Route reads to replicas to take load off the primary; denormalize or maintain materialized views for expensive aggregate queries computed on every request.",
          },
        ],
      },
      {
        heading: "5. Don't block the server's ability to serve anyone else",
        points: [
          {
            title: "Never use blocking/synchronous I/O in a request handler",
            detail:
              "In a single-threaded runtime like Node.js, one synchronous fs.writeFileSync() or CPU-heavy loop stalls every other in-flight request — not just the slow one.",
            relatedLink: {
              href: "/upload",
              label: "See it happen live: the Sync vs Async large-file-upload demo on this site",
            },
          },
          {
            title: "Stream large payloads instead of buffering them",
            detail:
              "Pipe request/response bodies through instead of loading the whole thing into memory — bounds memory usage independent of payload size and lets processing start before the transfer finishes.",
            relatedLink: {
              href: "/upload",
              label: "See it implemented: chunked, streamed upload in this repo's express-production-api",
            },
          },
          {
            title: "Offload CPU-bound work off the main thread",
            detail:
              "Hashing, image/video processing, heavy computation — hand it to a worker thread (same process, own thread) so the event loop stays free to keep handling requests.",
            relatedLink: {
              href: "/topics/worker-threads",
              label: "Interactive visualization: Worker Threads on this site",
            },
          },
          {
            title: "Scale across CPU cores with cluster (or a process manager like PM2)",
            detail:
              "A single Node.js process only uses one core; cluster forks worker processes and round-robins connections across them to use the whole machine.",
            relatedLink: {
              href: "/topics/cluster",
              label: "Interactive visualization: Cluster on this site",
            },
          },
        ],
      },
      {
        heading: "6. Protect the system so it stays fast under load",
        points: [
          {
            title: "Rate limiting / throttling",
            detail:
              "Cap requests per client so a runaway script or abusive caller can't starve everyone else of the shared resource budget (CPU, DB connections, bandwidth).",
            sourceRef:
              "express-production-api/src/middleware/rateLimit.js — note it uses a different budget per route type",
          },
          {
            title: "Timeouts and retries with backoff on downstream calls",
            detail:
              "A slow downstream dependency shouldn't be allowed to hang your request indefinitely or hammer the dependency harder via naive immediate retries.",
          },
          {
            title: "Circuit breakers",
            detail:
              "Stop calling a downstream service that's already failing, fail fast instead, and periodically test if it's recovered — prevents one failing dependency from cascading into a full outage.",
          },
          {
            title: "Load shedding",
            detail:
              "Under extreme load, deliberately reject some requests (fast, cheap 503s) rather than degrading into slow responses for everyone.",
          },
        ],
      },
      {
        heading: "7. Make retries safe",
        points: [
          {
            title: "Idempotency keys on mutating endpoints",
            detail:
              "A client retry after a dropped connection (did it succeed? did it not?) must never double-charge or double-create a resource. An idempotency key lets the server recognize and safely replay the same logical request.",
            sourceRef: "express-production-api/src/middleware/idempotency.js — used on POST /orders",
          },
        ],
      },
      {
        heading: "8. Scale the architecture, not just the code",
        points: [
          {
            title: "Horizontal scaling behind a load balancer",
            detail:
              "More instances of a stateless API server, load-balanced — the standard first move once vertical scaling and code-level fixes run out of room.",
          },
          {
            title: "Move slow work off the request/response cycle",
            detail:
              "Anything that doesn't need to finish before you respond (sending an email, generating a report) should go through a queue/event bus to an async worker, not block the HTTP response.",
            sourceRef: "express-production-api/src/events/eventBus.js + listeners.js",
          },
          {
            title: "Serve initial data without a client round trip at all",
            detail:
              "SSR/SSG can render a page with data already baked in, versus CSR's client-side fetch-after-load waterfall — sometimes the fastest API call is the one you don't make.",
            relatedLink: {
              href: "/rendering",
              label: "See CSR vs SSR vs SSG vs ISR compared live on this site",
            },
          },
        ],
      },
      {
        heading: "9. Measure — don't optimize blind",
        points: [
          {
            title: "Profile before you optimize",
            detail:
              "Guessing the bottleneck and 'optimizing' the wrong layer is a classic interview red flag — say explicitly that you'd profile/APM-trace first.",
          },
          {
            title: "Track percentiles, not just averages",
            detail:
              "p50/p95/p99 latency tells a very different story than a mean — a fast average can hide a painful tail that's affecting real users.",
          },
          {
            title: "Load test before and after",
            detail:
              "Confirms the optimization actually moved the number, under realistic concurrent load, not just in a single manual request.",
          },
        ],
      },
    ],
    closingTip:
      "If you only have time to say one thing in an interview: pick ONE concrete optimization, explain the mechanism (not just the buzzword), and say how you'd measure that it worked. That demonstrates real understanding far better than reciting this whole list.",
  },
  {
    slug: "database-replication-and-partitioning",
    question: "How does database replication and partitioning work?",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "Two different, complementary techniques for scaling a database beyond one machine — replication copies the same data to multiple nodes for redundancy and read scale; partitioning splits different data across multiple nodes for write/storage scale. Real distributed databases use both together.",
    intro:
      "It's easy to blur these two together since both involve 'more than one database server', but they solve different problems and are usually used together, not as alternatives. Replication answers 'what if this node dies?'; partitioning answers 'what if the data is too big/too hot for one node?'.",
    sections: [
      {
        heading: "Replication: the same data, on multiple nodes",
        points: [
          {
            title: "Why replicate",
            detail:
              "Redundancy (survive a node failure without losing data or availability) and read scalability (spread read traffic across replicas instead of hammering one machine). Writes are trickier — they have to end up everywhere eventually, which is where the real complexity lives.",
          },
          {
            title: "Single-leader (primary-replica)",
            detail:
              "All writes go to one primary node; replicas apply the same writes in the same order and serve reads. Simple to reason about (one place writes can conflict), but the primary is a write bottleneck and a single point of failure until a replica is promoted.",
          },
          {
            title: "Multi-leader",
            detail:
              "More than one node accepts writes (e.g. one per datacenter), which then replicate to each other. Better write availability/latency across regions, but now concurrent writes to the same record on different leaders can conflict — the system needs an explicit conflict-resolution strategy (last-write-wins, application-level merge, CRDTs).",
          },
          {
            title: "Leaderless",
            detail:
              "Any replica can accept a write; the client (or a coordinator) writes to several replicas directly and reads from several, resolving conflicts via versioning (e.g. Dynamo-style quorum reads/writes: W + R > N replicas guarantees overlap). Used by Cassandra, DynamoDB.",
          },
          {
            title: "Synchronous vs asynchronous replication",
            detail:
              "Synchronous: the primary waits for a replica to confirm the write before acknowledging the client — zero data loss on failover, but write latency now includes the slowest required replica, and the primary can't accept writes if that replica is down. Asynchronous: the primary acknowledges immediately and replicates in the background — fast writes, but a primary crash can lose the last few unreplicated writes. Most real systems (including MongoDB by default) use async replication with a tunable 'write concern' to trade off between the two per-write.",
          },
          {
            title: "Replication lag",
            detail:
              "With async replication, a replica can be momentarily behind the primary. A client that writes then immediately reads from a replica can see stale data (read-your-own-writes violation) — a real, frequently-hit bug class, usually fixed by reading your own recent writes from the primary, or routing a user's reads to the same replica for a short window after they write.",
          },
        ],
      },
      {
        heading: "Partitioning (sharding): different data, on multiple nodes",
        points: [
          {
            title: "Why partition",
            detail:
              "A single node has finite storage, memory, and write throughput. Partitioning splits the dataset across many nodes so no single machine has to hold or serve all of it — this is what lets a database scale writes horizontally, which replication alone cannot do (every replica still has to store and apply every write).",
          },
          {
            title: "Horizontal vs vertical partitioning",
            detail:
              "Horizontal (sharding): split by ROW — e.g. users A-M on shard 1, N-Z on shard 2. Vertical: split by COLUMN/table — e.g. user profile data on one database, user activity logs on another. 'Sharding' in the distributed-databases sense almost always means horizontal.",
          },
          {
            title: "Choosing a shard/partition key",
            detail:
              "Range-based (e.g. by date or alphabetical range): easy range queries, but traffic skews toward whichever range is 'hot' right now (e.g. all of today's writes hit one shard). Hash-based (hash the key, mod by shard count): spreads load evenly, but kills the ability to do efficient range scans across the whole dataset. This choice is one of the highest-leverage decisions in a sharded system's design.",
          },
          {
            title: "Hotspots and rebalancing",
            detail:
              "A poorly chosen key (e.g. sharding a social app by signup date, or by a celebrity's user id getting disproportionate traffic) creates a hotspot — one shard doing far more work than the others, defeating the whole point. Adding/removing shards later means rebalancing data across them, which real systems handle via consistent hashing (minimizes how much data has to move) rather than a naive re-hash of everything.",
          },
        ],
      },
      {
        heading: "Putting them together",
        points: [
          {
            title: "Real distributed databases use both, layered",
            detail:
              "The dataset is partitioned into shards for scale, and each individual shard is then replicated for redundancy. E.g. MongoDB's sharded-cluster mode: each shard is itself a replica set. Losing one node loses zero data (replication covers it) and no single node has to hold the whole dataset (partitioning covers it).",
          },
          {
            title: "Where this repo currently stands",
            detail:
              "express-production-api connects to a single standalone MongoDB instance — no replication, no partitioning. That's a deliberate simplicity choice for a reference app, but it's also exactly why order creation can't use a real multi-document transaction here (transactions require a replica set) and why this instance is a single point of failure.",
            sourceRef: "express-production-api/src/services/orderService.js (see the comment on the atomic stock-decrement loop)",
          },
        ],
      },
    ],
    closingTip:
      "A strong way to close this answer: 'replication is about surviving failure and scaling reads; partitioning is about scaling writes and storage; production distributed databases combine both, with each partition itself replicated.' That one sentence demonstrates you know they're not substitutes for each other.",
  },
  {
    slug: "cap-theorem",
    question: "Explain the CAP theorem.",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "You can't have Consistency, Availability, and Partition tolerance all at once in a distributed system — but the common 'pick any 2 of 3' phrasing is a bit misleading, since partition tolerance isn't really optional.",
    intro:
      "CAP theorem questions are as much about catching the common misconception as they are about reciting the definition — a strong answer explicitly corrects the 'pick 2 of 3' framing rather than repeating it.",
    sections: [
      {
        heading: "What the three letters actually mean",
        points: [
          {
            title: "Consistency (C)",
            detail:
              "Every read receives the most recent write, or an error — this is linearizability, a strong guarantee. (Note: this is a completely different 'C' from ACID's consistency, which is about constraints/invariants, not read freshness — a frequent point of confusion worth naming explicitly.)",
          },
          {
            title: "Availability (A)",
            detail:
              "Every request to a non-failing node receives a (non-error) response — it doesn't have to be the most recent data, just some valid response, in bounded time.",
          },
          {
            title: "Partition tolerance (P)",
            detail:
              "The system continues to operate despite an arbitrary number of messages being dropped or delayed between nodes (a network partition). Networks fail — cables get cut, switches misbehave, cloud AZs lose connectivity to each other — this is a fact about physical reality, not a design choice.",
          },
        ],
      },
      {
        heading: "The common misconception — and the real tradeoff",
        points: [
          {
            title: "You don't actually get to 'choose 2 of 3'",
            detail:
              "Partition tolerance isn't optional for any system that runs on more than one node connected by a real network — partitions WILL happen eventually, whether or not you design for them. So the real, practical choice CAP theorem describes is: WHEN a partition occurs, does the system choose Consistency (refuse/block requests on the minority side until the partition heals, to avoid serving stale or conflicting data) or Availability (keep serving requests on both sides of the partition, accepting that they may now disagree)? Outside of an actual partition, a well-designed system can very much be both consistent and available — CAP only forces the tradeoff during the partition itself.",
          },
          {
            title: "CP systems (choose consistency during a partition)",
            detail:
              "MongoDB (in its default configuration, via replica set elections), HBase, and traditional single-primary relational setups. On a partition, the minority side stops accepting writes (or all writes) rather than risk inconsistency — you get correctness at the cost of availability for some clients.",
          },
          {
            title: "AP systems (choose availability during a partition)",
            detail:
              "Cassandra, DynamoDB, CouchDB. Every reachable node keeps accepting reads and writes during a partition, and the system reconciles diverging versions afterward (last-write-wins, vector clocks, application-level merge) — you get uptime everywhere at the cost of temporary inconsistency.",
          },
        ],
      },
      {
        heading: "The follow-up that impresses: PACELC",
        points: [
          {
            title: "CAP is silent about the normal, no-partition case — PACELC fills that gap",
            detail:
              "PACELC: if a Partition happens, choose Availability or Consistency (that's the CAP part) — Else (i.e. during normal operation, no partition at all), choose Latency or Consistency. Even with a perfectly healthy network, a system that wants strong consistency (waiting for a quorum of replicas to confirm) pays a latency cost versus one that returns from a single nearby replica immediately. This is why, for example, DynamoDB offers a choice between 'eventually consistent' and 'strongly consistent' reads even when nothing is partitioned — that's the EL part of PACELC, a real, everyday tradeoff CAP theorem alone doesn't capture.",
          },
        ],
      },
      {
        heading: "Tying it back to this repo",
        points: [
          {
            title: "A standalone MongoDB instance sidesteps CAP entirely — by having no distribution to trade off",
            detail:
              "There's only one node, so there's no possibility of a network partition BETWEEN nodes of this database to reason about — which also means no replication, so a single point of failure. The CAP tradeoff only becomes real once you deploy this as a replica set (or a sharded cluster of replica sets) across multiple nodes/regions — exactly the step this repo's own README lists as a next step toward production-readiness.",
            sourceRef: "express-production-api/README.md — 'Notes on production-readiness'",
          },
        ],
      },
    ],
    closingTip:
      "Say the misconception correction explicitly and you'll stand out: 'partition tolerance isn't really a choice — the real question CAP poses is what a system does DURING a partition, consistency or availability, and PACELC extends that to the latency/consistency tradeoff that exists even without one.'",
  },
  {
    slug: "caching-strategies-system-design",
    question: "What caching strategies are used in system design? (Frontend, Backend, Database)",
    category: "System Design",
    round: "general",
    summary:
      "Caching exists at every layer of a system, not just one — the interesting part of this question is usually the patterns (cache-aside, write-through, write-behind) and invalidation, not just naming Redis. This app already has working examples of two of the three layers.",
    intro:
      "The core idea behind every caching layer, at every level of a system, is the same trade: spend some storage to keep a copy of something expensive (a computation, a network round trip, a disk read) somewhere faster or closer to where it's needed. A strong answer walks through each layer, then covers the patterns and invalidation strategies that apply regardless of which layer you're caching at.",
    sections: [
      {
        heading: "Frontend caching",
        points: [
          {
            title: "Browser HTTP cache",
            detail:
              "Cache-Control headers tell the browser how long a response can be reused without asking the server again; ETag/Last-Modified enable a conditional request (If-None-Match) that gets a cheap 304 Not Modified instead of re-downloading unchanged content. This is the first and cheapest cache in the whole system — a request that never leaves the browser is faster than any server-side optimization.",
          },
          {
            title: "CDN edge caching",
            detail:
              "A CDN caches responses at points-of-presence geographically close to users, so a cache hit never has to reach your origin server at all — turns a cross-continent round trip into a local one. Works best for content that's the same for every user (static assets, public API responses, fully static pages).",
          },
          {
            title: "Static generation as a caching strategy",
            detail:
              "SSG and ISR are, at their core, a caching strategy for entire rendered pages: compute once, serve the same output to everyone afterward (ISR just adds a background-refresh timer on top of that). Worth naming explicitly as a caching technique, not just a 'rendering mode' — it's the same underlying idea as any other cache, applied to whole HTML pages.",
            relatedLink: {
              href: "/rendering",
              label: "See SSG vs ISR compared live on this site",
            },
          },
          {
            title: "Client-side application data cache",
            detail:
              "Libraries like React Query/SWR cache fetched data in memory on the client and serve it instantly on a re-render or re-visit, refetching in the background (stale-while-revalidate) — avoids a network round trip for data the app already has, even if it might be slightly stale.",
            relatedLink: {
              href: "/interview/react-app-optimization",
              label: "More on this: React app optimization — API Caching",
            },
          },
        ],
      },
      {
        heading: "Backend caching",
        points: [
          {
            title: "In-process memory cache",
            detail:
              "Fastest possible option — no network hop at all, just reading a variable in the same process. The catch: it's private to that one server instance. The moment you run more than one instance behind a load balancer, each has its own separate cache, so two users can get different (and differently stale) answers depending which instance they land on.",
          },
          {
            title: "Distributed cache (Redis/Memcached)",
            detail:
              "A shared cache every instance reads and writes, so all instances see the same cached state — solves exactly the multi-instance problem the in-process cache has. The standard choice once an API runs on more than one server, which in practice is almost immediately for anything meant to scale.",
            sourceRef: "express-production-api/src/utils/cache.js — backend-agnostic interface, Redis in production, in-memory fallback for zero-infra local dev",
          },
          {
            title: "What actually gets cached at this layer",
            detail:
              "Full HTTP response caching for expensive/frequent GETs (this repo's cacheMiddleware.js does exactly this), computed/aggregated values that are expensive to recompute per request, and session or rate-limit counters that need to be visible across instances — three different use cases sharing one underlying cache interface.",
            sourceRef: "express-production-api/src/middleware/cacheMiddleware.js + middleware/rateLimit.js",
          },
        ],
      },
      {
        heading: "Database caching",
        points: [
          {
            title: "The database's own internal cache (buffer pool / page cache)",
            detail:
              "Every real database engine already caches recently-accessed disk pages in memory automatically (e.g. MongoDB's WiredTiger cache, MySQL's InnoDB buffer pool) — this happens below the application entirely, but it's why a 'cold' query (data not yet in the buffer pool) is often visibly slower than the exact same query run again immediately after.",
          },
          {
            title: "Query result caching",
            detail:
              "Caching the RESULT of a specific, expensive query (not the raw rows) — either at the application layer (the same Redis-backed cache used for HTTP responses can hold query results too) or via a dedicated query cache. Needs the same invalidation discipline as any other cache: the cached result goes stale the moment underlying rows change.",
          },
          {
            title: "Materialized views",
            detail:
              "A precomputed, stored result of an expensive aggregate query (e.g. 'total sales per product per day') that's refreshed on a schedule or on demand, rather than recomputed from raw rows on every read — trades some staleness for avoiding a heavy aggregation on every request.",
          },
          {
            title: "Read replicas as a caching-adjacent technique",
            detail:
              "Not caching in the strict sense (it's a full copy of the data, not a subset kept for speed), but solves a related problem — spreading read load across multiple nodes instead of hammering the primary.",
            relatedLink: {
              href: "/interview/database-replication-and-partitioning",
              label: "Full breakdown: database replication and partitioning",
            },
          },
        ],
      },
      {
        heading: "Patterns that apply at any layer",
        points: [
          {
            title: "Cache-aside (lazy loading)",
            detail:
              "The application checks the cache first; on a miss, it reads from the real source, then populates the cache for next time. Simple and the most common pattern — but the cache can briefly be wrong or empty right after a write, since the write path and the cache-population path aren't the same code.",
          },
          {
            title: "Read-through",
            detail:
              "Like cache-aside, but the cache itself (not the application) is responsible for loading from the source on a miss — the application only ever talks to the cache. Keeps cache-population logic in one place instead of scattered through every caller.",
          },
          {
            title: "Write-through",
            detail:
              "Writes go to the cache and the underlying source together, synchronously, before the write is considered complete — the cache is never stale, at the cost of every write paying the latency of both.",
          },
          {
            title: "Write-behind (write-back)",
            detail:
              "Writes go to the cache immediately and are flushed to the real source asynchronously afterward — fast writes, but a crash before the flush completes can lose data. Higher risk, reserved for cases where write latency matters more than that risk.",
          },
        ],
      },
      {
        heading: "Cache invalidation — the actually hard part",
        points: [
          {
            title: "\"There are only two hard things in computer science: cache invalidation and naming things.\"",
            detail:
              "A cache that serves wrong data is worse than no cache at all, since it looks like it's working. Getting the caching mechanism right is usually the easy part; knowing exactly when and what to invalidate is where real bugs live.",
          },
          {
            title: "TTL-based expiry",
            detail:
              "Simplest approach: every cached entry just expires after N seconds, no matter what. Guarantees staleness is bounded, but a short TTL undermines the cache's whole benefit and a long TTL means a real window of serving wrong data after an underlying change.",
          },
          {
            title: "Explicit invalidation on write",
            detail:
              "The write path explicitly clears the specific cache entries a mutation affects. More precise than a TTL, but requires the write path to correctly know every cache key it needs to touch — miss one, and you have a real bug, not just a theoretical one.",
            sourceRef:
              "express-production-api/src/services/orderService.js — order creation invalidates the product cache because it changes stock; this exact gap was a real bug found and fixed while building this site",
          },
          {
            title: "Event-driven invalidation",
            detail:
              "Instead of every write path remembering to invalidate every affected cache key by hand, the write publishes a domain event and a dedicated listener (or the cache layer itself) reacts by invalidating what changed — decouples 'what changed' from 'what needs to be invalidated', which scales better as the number of cached things grows.",
            relatedLink: {
              href: "/interview/express-mvc-rest-api",
              label: "This repo's event bus, used for exactly this kind of decoupling",
            },
          },
        ],
      },
      {
        heading: "Cache stampede (thundering herd)",
        points: [
          {
            title: "The problem",
            detail:
              "A popular cache entry expires, and many concurrent requests all miss at once — all of them hit the real, expensive source simultaneously, which can be enough load to take that source down right when it's least able to handle it.",
          },
          {
            title: "Mitigations",
            detail:
              "Request coalescing/single-flight: only the first miss actually queries the source, everyone else waits on that same in-flight result instead of firing their own. Jittered TTLs: add a small random offset to each entry's expiry so many entries don't all expire in the same instant. Serve-stale-while-revalidate: keep serving the (slightly) stale cached value while one request refreshes it in the background, instead of every request blocking on a miss.",
          },
        ],
      },
    ],
    closingTip:
      "A strong closing line: 'the mechanism — where the cache lives — is the easy 20% of this problem; invalidation correctness and stampede protection are the 80% that actually breaks in production.' Naming a specific invalidation bug you've seen or fixed (even a small one) lands better than a complete list of cache backends.",
  },
  {
    slug: "var-vs-let-settimeout-loop",
    question: "What does this code print — var vs let in a loop with setTimeout?",
    category: "JavaScript",
    round: "general",
    summary:
      "The single most common 'predict the output' JavaScript interview question. The var version logs 5 five times; the let version logs 0 through 4. The reason is scoping, not timing — and understanding it means understanding exactly when these callbacks actually run.",
    intro:
      "This is a predict-the-output question, so the strongest way to answer it is to state the two outputs first, with confidence, then explain the mechanism — not the other way around.",
    sections: [
      {
        heading: "The code",
        points: [
          {
            title: "Version 1: var",
            detail: "Output: 5 5 5 5 5 — printed all at once, about 100ms after the loop starts.",
            code: `for (var i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}`,
          },
          {
            title: "Version 2: let",
            detail: "Output: 0 1 2 3 4 — also all printed about 100ms after the loop starts, but each with a different value.",
            code: `for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}`,
          },
        ],
      },
      {
        heading: "Why the var version logs 5 five times",
        points: [
          {
            title: "One binding, shared by every closure",
            detail:
              "var is function-scoped, not block-scoped — there is exactly ONE variable i for the entire loop, not one per iteration. All five arrow functions passed to setTimeout close over that same single variable. By the time any of them actually runs, the loop has already finished completely, and i's final value is 5 (the value that made i < 5 false and ended the loop). All five callbacks read that same, final i — hence 5 five times, not 0 1 2 3 4.",
          },
        ],
      },
      {
        heading: "Why the let version logs 0 through 4",
        points: [
          {
            title: "A fresh binding, per iteration",
            detail:
              "let is block-scoped, and the spec gives for-loops a special behavior on top of that: each iteration of a let-declared loop gets its own fresh copy of the loop variable, with that iteration's value carried into it. So the closure created in iteration 3 captures ITS OWN i (value 3), completely independent of the i captured in iteration 4. Five iterations, five independent bindings, five different remembered values.",
          },
        ],
      },
      {
        heading: "The event loop connection — why they don't just print immediately",
        points: [
          {
            title: "The loop finishes before any callback runs, in both versions",
            detail:
              "This is easy to get backwards: it's not that the var version 'waits' and the let version doesn't. In BOTH versions, the for-loop is synchronous and runs to completion (all 5 iterations, registering all 5 timers) in far less than 100ms, well before the event loop is even allowed to look at the timer queue — the call stack must be empty first. So all 5 setTimeout callbacks are already queued before any of them fires. The var/let difference isn't about timing at all — it's purely about what value each already-queued callback closed over.",
            relatedLink: {
              href: "/topics/event-loop",
              label: "Watch exactly this synchronous-code-first behavior: The Event Loop visualization",
            },
          },
        ],
      },
      {
        heading: "Before let existed",
        points: [
          {
            title: "The old workaround: an IIFE to force a new scope per iteration",
            detail:
              "Pre-ES6 code faked let's per-iteration binding by wrapping the loop body in an immediately-invoked function expression, passing i in as an argument — a new function call means a new local scope, which is exactly the trick let now gives you for free.",
            code: `for (var i = 0; i < 5; i++) {
  (function (i) {
    setTimeout(() => console.log(i), 100);
  })(i);
}
// logs 0 1 2 3 4 — same fix as switching to let, done manually`,
          },
        ],
      },
    ],
    closingTip:
      "State both outputs up front, then explain with one sentence: 'var has one binding for the whole loop, let creates a new binding per iteration — and both loops fully finish before any setTimeout callback runs at all, since JS won't touch the timer queue while the call stack is still busy.'",
  },
];
