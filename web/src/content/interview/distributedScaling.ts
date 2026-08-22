import type { InterviewQuestion } from "./types";

// A scaling METHODOLOGY question (a repeatable decision framework, not a
// re-explanation of replication/partitioning mechanics — that's already
// covered in general.ts's database-replication-and-partitioning and
// cap-theorem) plus scenario/case-study questions that apply it to
// concrete, realistic situations. Category matches the existing
// "Distributed Systems / Databases" bucket so these join that content on
// the same interview topic page rather than fragmenting it further.
export const distributedScalingQuestions: InterviewQuestion[] = [
  {
    slug: "distributed-database-scaling-methodology",
    question:
      "Walk through your methodology for scaling a distributed database as load grows — from first bottleneck to a fully sharded, multi-region system.",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "Diagnose the bottleneck type before reaching for a fix — reads, writes, storage, and geography each have a different correct next step, and jumping straight to sharding is the single most common mistake in this answer.",
    intro:
      "This question rewards a repeatable DECISION PROCESS over a list of techniques you already know from the replication/partitioning and CAP theorem questions elsewhere in this app — the strongest answer is structured as 'first I'd check X, which tells me whether to do Y or Z', not a tour of distributed-systems vocabulary.",
    sections: [
      {
        heading: "Step 1 — diagnose the bottleneck type first",
        points: [
          {
            title: "Reads, writes, storage, and geography each need a different fix",
            detail:
              "Read-heavy and CPU/memory-bound on one instance → caching and read replicas, not sharding. Write throughput or total storage exceeding one primary's capacity → this is the one case that actually needs partitioning. Latency that's high specifically for users far from your database's region, with throughput otherwise fine → a geography problem, not a capacity problem — sharding by customer ID doesn't fix an APAC user talking to a US-only database. Skipping this diagnosis and reaching for sharding by reflex is the most common mistake in this answer — sharding is the most operationally expensive option on this list and should be the last one reached for, not the first.",
          },
        ],
      },
      {
        heading: "Step 2 — the escalation ladder, in order",
        points: [
          {
            title: "Vertical scale → caching → read replicas → query/index optimization → partition only if still needed",
            detail:
              "Vertical scaling and query/index optimization are the cheapest, lowest-risk moves and are frequently the ACTUAL fix — a missing index or an unindexed hot query masquerading as a 'need to shard' problem is extremely common. A caching layer in front of hot reads often removes most read pressure on its own. Read replicas scale read throughput horizontally with no application-level partitioning logic needed. Only once write throughput or storage genuinely exceeds a single primary's capacity — after the earlier steps are exhausted — does partitioning become the right next step.",
            relatedLink: { href: "/interview/read-replicas-vertical-scaling-sharding", label: "The general escalation path, in depth" },
          },
        ],
      },
      {
        heading: "Step 3 — choosing a partition key methodically, not reflexively",
        points: [
          {
            title: "Start from the dominant access pattern, not the most obvious column",
            detail:
              "Identify what's queried/written together most often BEFORE picking a key — a key that keeps commonly-accessed-together data co-located avoids cross-shard queries and (for SQL) cross-shard joins/transactions. Model expected skew explicitly: will one value of this key (one customer, one date, one region) receive dramatically more traffic than others? Decide range vs hash based on whether efficient range scans matter to your actual query patterns — range keys keep scans cheap but concentrate 'hot' traffic (e.g. today's date) on one shard; hash keys spread load evenly but make range scans expensive across the whole dataset.",
            relatedLink: { href: "/interview/database-replication-and-partitioning", label: "Range vs hash partitioning, in depth" },
          },
        ],
      },
      {
        heading: "Step 4 — anticipate hotspots before they're an incident",
        points: [
          {
            title: "Composite/salted keys for known-hot values, monitored proactively",
            detail:
              "When one key value is predictably going to be hot (a viral post, a major customer, a popular product on launch day), a raw hash or range key alone can still create a hotspot. A salted/composite key (appending a random or rotating suffix to spread one logical key's writes across several physical shards, then fanning the read back in) is the standard mitigation for a known hot key. Per-shard load (CPU, write latency, storage) should be monitored continuously, not discovered from a paged alert — a growing skew is visible well before it becomes an incident.",
            code: `// naive key concentrates all writes for one viral post on one shard
const key = \`post:\${postId}\`;

// salted key spreads the same logical post across N physical shards
const salt = Math.floor(Math.random() * 10);
const key = \`post:\${postId}:\${salt}\`;
// reads fan out across all 10 salts and merge results`,
            codeLanguage: "javascript",
            relatedLink: { href: "/databases/scaling", label: "Watch this exact hotspot form, and get salted away, animated" },
          },
        ],
      },
      {
        heading: "Step 5 — plan for rebalancing from day one",
        points: [
          {
            title: "Consistent hashing / virtual shards, not a naive re-hash",
            detail:
              "Shard count will need to grow. A naive hash-mod-N scheme means adding a shard reshuffles nearly the entire dataset. Consistent hashing (or virtual shards/vnodes, where each physical shard owns many small hash ranges) means adding capacity only moves a small, bounded fraction of the data — this decision has to be made when the system is FIRST sharded, since retrofitting it onto a naive scheme later is itself a full migration.",
            relatedLink: { href: "/databases/scaling", label: "See the real, computed naive-vs-consistent-hashing comparison" },
          },
        ],
      },
      {
        heading: "Step 6 — layer replication and geography on top",
        points: [
          {
            title: "Each shard is independently replicated; geography is a separate axis from sharding",
            detail:
              "Partitioning solves write/storage scale; it doesn't solve durability — each shard still needs its own replica set for that. If the actual bottleneck diagnosed in step 1 was geographic latency, the fix is regional read replicas or geo-partitioning (keeping a region's data physically close to that region's users) — layered on top of, not instead of, the sharding/replication decisions above.",
            relatedLink: { href: "/interview/cap-theorem", label: "The consistency tradeoff each of these steps is implicitly making" },
          },
        ],
      },
      {
        heading: "Step 7 — the signal that triggers each step, not a preemptive schedule",
        points: [
          {
            title: "Scale in response to a measured signal, not a calendar",
            detail:
              "p99 write latency creeping up on the primary → time to evaluate the next rung. Per-shard CPU/storage variance widening → a hotspot forming, act before it pages someone. Replication lag trending upward under normal load → the replica tier needs attention before it becomes a correctness bug, not just a performance one. Scaling preemptively without one of these signals usually means paying operational complexity for a problem that hasn't arrived yet — and might never arrive in that shape.",
          },
        ],
      },
    ],
    closingTip:
      "State the shape of the answer up front, in one sentence, before diving into any step: 'I'd diagnose which resource is actually constrained first, exhaust the cheap options in order, and only shard once writes or storage genuinely exceed one primary — with the partition key chosen from the access pattern, not the most convenient column.' That sentence alone signals a methodology, not a vocabulary list.",
  },

  {
    slug: "scenario-hot-shard-flash-sale",
    question:
      "Scenario: during a flash sale, your database's primary is maxed out — but only on WRITES to a single 'flash_sale_inventory' table, everything else is fine. Walk through your diagnosis and fix.",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "A single hot table during a time-boxed event is a hotspot problem, not a general scaling problem — the fix targets the one hot key, not the whole database.",
    intro:
      "The scenario is deliberately narrow (one table, writes only, everything else fine) — the strongest answer notices that narrowness immediately and resists the urge to propose a full sharding rollout for the whole database.",
    sections: [
      {
        heading: "Diagnosis",
        points: [
          {
            title: "This is contention on a small number of hot rows, not a capacity problem",
            detail:
              "Everything else being fine rules out the primary being generally overloaded — this is almost certainly row-level lock contention on a handful of popular product rows (every buyer of the same flash-sale item decrementing the same stock counter) rather than a throughput ceiling across the whole table. Confirm with the database's own lock/wait diagnostics (e.g. pg_locks in Postgres, or profiling which specific document/row updates are queuing) before proposing a fix.",
          },
        ],
      },
      {
        heading: "The fix — target the hot key specifically",
        points: [
          {
            title: "Move the hot counter off the contended row, reconcile after",
            detail:
              "A common, effective pattern: instead of every purchase directly decrementing one shared stock counter row (which serializes all buyers of that item), write each decrement as an independent event/row (an append-only 'reservation' log), and either reconcile the true remaining stock asynchronously or use an atomic increment against an in-memory counter (Redis INCR) with the database as the eventual source of truth. This turns N buyers contending for ONE row-lock into N independent, non-blocking writes.",
            relatedLink: { href: "/interview/duplicate-order-request-idempotency", label: "The idempotency-key pattern this same flow needs alongside it" },
          },
          {
            title: "If this becomes a recurring pattern, not a one-off event",
            detail:
              "A table that's predictably hot during scheduled events (flash sales, ticket drops) is a known-hot-key situation — the salted/composite-key mitigation from the general scaling methodology applies directly, or a dedicated, separately-scaled path (its own cache layer, its own queue) just for the sale-day write pattern, kept isolated from normal traffic.",
            relatedLink: { href: "/interview/distributed-database-scaling-methodology", label: "Step 4 — anticipating hotspots, in depth" },
          },
        ],
      },
    ],
    closingTip:
      "Naming that this is a hotspot on specific rows, not a general capacity problem, in the first sentence is what separates this answer from someone who reflexively proposes 'add more read replicas' — replicas don't help write contention on the same rows at all.",
  },

  {
    slug: "scenario-skewed-shard-key-whale-customers",
    question:
      "Scenario: you've sharded orders by customer_id, but three enterprise customers each generate 40% of total write volume — your shards are wildly uneven. What do you do?",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "The 'whale customer' problem — a shard key that's uniform across most of the dataset but has a few extreme outliers needs per-key mitigation, not a different overall key.",
    intro:
      "This is a shard-key-selection failure discovered after the fact — the strongest answer explains WHY customer_id looked reasonable at design time and specifically what broke that assumption.",
    sections: [
      {
        heading: "Why this happened",
        points: [
          {
            title: "customer_id looked uniform until three customers stopped being average",
            detail:
              "Sharding by customer_id is a completely reasonable default — it keeps one customer's data together, avoiding cross-shard queries for the common case. The assumption that breaks is that write volume is roughly uniform ACROSS customers. Three enterprise accounts each generating 40% of total volume means those three specific hash/range buckets are doing the overwhelming majority of the work while dozens of other shards sit mostly idle — a skewed distribution the average customer's behavior didn't predict.",
          },
        ],
      },
      {
        heading: "Fixing it without re-sharding the whole dataset",
        points: [
          {
            title: "Salt or explicitly split the three hot keys, leave everything else alone",
            detail:
              "Re-sharding the entire dataset by a different key is disruptive and likely just moves the same problem (any single-column key can have outliers). The targeted fix: give each whale customer their own dedicated shard (or a salted sub-key splitting THEIR writes across several shards), while every other customer stays on the normal hash-sharded scheme. This is explicitly an exception-based fix for a small number of known outliers, not a redesign of the general scheme.",
            code: `function resolveShard(customerId) {
  if (WHALE_CUSTOMER_SHARD_OVERRIDES[customerId]) {
    return WHALE_CUSTOMER_SHARD_OVERRIDES[customerId]; // dedicated shard(s)
  }
  return hashToShard(customerId); // normal path for everyone else
}`,
            codeLanguage: "javascript",
          },
          {
            title: "Detect the next whale before it becomes an incident",
            detail:
              "Add ongoing monitoring of write volume per shard-key value (not just per shard) so a growing customer approaching whale-level volume is visible and can be proactively moved to a dedicated shard before it causes imbalance, rather than discovered only after shards are already uneven.",
          },
        ],
      },
    ],
    closingTip:
      "The key insight to state explicitly: this isn't evidence that customer_id was the wrong key choice in general — it's evidence that ANY single-column key needs an explicit plan for outliers, because real-world data distributions are never perfectly uniform.",
  },

  {
    slug: "scenario-replication-lag-stale-read-bug",
    question:
      "Scenario: a read replica is 8 seconds behind the primary, and a support rep just told a customer 'your refund was processed' based on a replica read that hadn't caught up yet. How do you prevent this class of bug going forward?",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "A read-your-own-writes violation — the fix is routing the SPECIFIC reads that can't tolerate staleness back to the primary (or a bounded-freshness replica), not eliminating replicas or waiting for lag to somehow improve.",
    intro:
      "The instinct to blame replication lag itself is the trap here — some lag is normal and expected; the actual bug is that a stale-tolerant architecture was used for a read that couldn't tolerate staleness.",
    sections: [
      {
        heading: "What actually went wrong",
        points: [
          {
            title: "Not every read can tolerate replica lag — this one couldn't",
            detail:
              "Async replication lag is normal and expected; it's not itself the bug. The bug is architectural: a read that needed to reflect a very recent write (checking refund status right after processing it) was routed to a replica without any freshness guarantee, when it needed either a primary read or an explicit staleness bound.",
          },
        ],
      },
      {
        heading: "The fix — classify reads by freshness requirement",
        points: [
          {
            title: "Route writes-you-just-made back to the primary, for a defined window",
            detail:
              "The standard fix: after a write, route that user's related reads to the primary (or to a replica confirmed caught-up past that write's timestamp) for a short window — long enough to cover the realistic lag, then fall back to normal replica routing. Some databases (MongoDB with causal consistency sessions, Postgres logical replication slots with LSN tracking) support this natively; otherwise it's implemented at the application/caching layer by tagging a 'read your own write' window per user-action.",
            code: `// after a write, mark this user's session as needing primary reads
await session.set(\`recent_write:\${userId}\`, Date.now(), { ttl: 15 });

// on a subsequent read, check the flag
const forcePrimary = await session.get(\`recent_write:\${userId}\`);
const result = forcePrimary
  ? await primaryDb.query(...)
  : await replicaDb.query(...);`,
            codeLanguage: "javascript",
          },
          {
            title: "For customer-facing status specifically, prefer an explicit state machine over 'just read current state'",
            detail:
              "A refund/order status flow benefits from an explicit state transition (processing → processed) written and read from a single authoritative path, rather than any read of 'current state' being allowed to come from a lagging source at all for that specific field — narrowing which fields need this protection keeps the fix cheap instead of routing all reads to the primary.",
          },
        ],
      },
    ],
    closingTip:
      "Close by distinguishing the general case from this one: 'most reads in the app can and should tolerate a few seconds of replica lag — the fix here is identifying the specific reads that can't, not eliminating replica reads system-wide, which would throw away the whole reason replicas exist.'",
  },

  {
    slug: "scenario-multiregion-latency",
    question:
      "Scenario: your single-region database serves users globally — APAC users see 400ms+ query latency while US users (near the database) see 20ms. Walk through your options.",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "This is a geography problem, not a capacity problem — sharding or scaling the existing single-region instance does nothing for users on the other side of the planet from it.",
    intro:
      "The scenario is designed to test whether the earlier bottleneck-diagnosis step actually gets applied — sharding by customer or adding read replicas IN THE SAME REGION would not move this number at all.",
    sections: [
      {
        heading: "Confirm the diagnosis before proposing anything",
        points: [
          {
            title: "The gap tracks physical distance, not load",
            detail:
              "20ms vs 400ms tracking almost exactly with physical distance from the database's region is the signature of a network round-trip-time problem (speed-of-light-bound, unavoidable at that distance), not a database load problem — confirm by checking whether APAC query EXECUTION time (server-side) is actually similar to US, with the difference being almost entirely network transit.",
          },
        ],
      },
      {
        heading: "Options, roughly by increasing complexity",
        points: [
          {
            title: "Regional read replica, first — if reads dominate APAC traffic",
            detail:
              "Deploy a read replica physically in (or near) the APAC region, and route APAC reads to it. This alone fixes read latency without touching the write path or data model at all — often sufficient if APAC traffic is read-heavy (browsing) rather than write-heavy.",
          },
          {
            title: "Regional caching layer, if the read pattern is cacheable",
            detail:
              "A CDN or regional cache (Redis deployed in-region) in front of frequently-read, slow-changing data can eliminate most of the round trips entirely for cacheable reads, without needing a full replica.",
          },
          {
            title: "Geo-partitioning, if APAC writes ALSO need to be fast",
            detail:
              "If APAC users also write frequently and need low write latency too, a read replica doesn't help — this needs actual geo-partitioning (APAC users' data lives on an APAC-local primary) or a multi-leader/active-active setup accepting writes in multiple regions, which reintroduces the conflict-resolution complexity that comes with multi-leader replication. This is a materially bigger project than a read replica and should only be justified if write latency, not just read latency, is the confirmed problem.",
            relatedLink: { href: "/interview/database-replication-and-partitioning", label: "Multi-leader replication and conflict resolution, in depth" },
          },
        ],
      },
    ],
    closingTip:
      "Order the options explicitly by cost/complexity and justify escalating past the first one only with a specific, confirmed reason (e.g. 'APAC write volume is also significant') — proposing the most complex option (active-active multi-region) first, without first checking whether a much cheaper regional read replica would solve it, is the wrong instinct to signal here.",
  },

  {
    slug: "scenario-live-resharding-zero-downtime",
    question:
      "Scenario: you need to migrate a live, single-primary collection with 200M documents to a sharded cluster, with zero downtime. Walk through your plan.",
    category: "Distributed Systems / Databases",
    round: "general",
    summary:
      "A live resharding migration is fundamentally the same expand-migrate-contract discipline used for any zero-downtime data migration, applied to physically moving data across shard boundaries instead of changing a schema.",
    intro:
      "Lead/architect level — the strongest answer explicitly maps this onto the same phased migration discipline used elsewhere (schema changes, API versioning) rather than treating live resharding as a fundamentally different, unrelated problem.",
    sections: [
      {
        heading: "Phase 1 — dual-write, old system stays authoritative",
        points: [
          {
            title: "Stand up the sharded cluster; every new write goes to both",
            detail:
              "Provision the target sharded cluster with the chosen partition key already decided (this decision should already have gone through the same methodical process — dominant access pattern, expected skew — as any other shard key choice). Application writes go to BOTH the existing single-primary system and the new sharded cluster; the old system remains the source of truth for reads during this phase. This catches write-path bugs against the new cluster with zero read-side risk, since nothing reads from it yet.",
            relatedLink: { href: "/interview/distributed-database-scaling-methodology", label: "How the partition key itself should be chosen" },
          },
        ],
      },
      {
        heading: "Phase 2 — backfill historical data, in bounded, resumable batches",
        points: [
          {
            title: "Idempotent, checkpointed batches — not one giant migration job",
            detail:
              "Backfill the 200M pre-existing documents in bounded batches (by id range or another stable ordering), tracking a checkpoint so the job can resume from where it stopped if interrupted rather than restarting from zero. Each batch write should be idempotent (upsert, not insert) so a batch re-run after a partial failure doesn't create duplicates.",
            code: `let checkpoint = await getCheckpoint(); // resumable — survives a restart
while (true) {
  const batch = await oldDb.find({ _id: { $gt: checkpoint } })
    .sort({ _id: 1 }).limit(1000).toArray();
  if (batch.length === 0) break;
  await Promise.all(batch.map((doc) => shardedDb.upsert(doc))); // idempotent
  checkpoint = batch[batch.length - 1]._id;
  await saveCheckpoint(checkpoint);
}`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Phase 3 — verify, then cut reads over gradually",
        points: [
          {
            title: "Reconcile before trusting the new system with real traffic",
            detail:
              "Run a reconciliation pass comparing document counts and a sample of content between old and new systems before routing any real reads to the sharded cluster. Cut reads over gradually (a percentage of traffic, or specific low-risk endpoints first) rather than all at once, watching error rates and latency at each step — with an easy rollback (read traffic back to the old system) at any point during this phase, since dual-writes are still keeping both systems current.",
          },
        ],
      },
      {
        heading: "Phase 4 — contract: retire the old system, only after confirmation",
        points: [
          {
            title: "Stop dual-writing only after reads have been fully on the new system, stable, for a real observation window",
            detail:
              "Only once 100% of reads are served from the sharded cluster and have been stable for a deliberate observation period does the old single-primary system get decommissioned — this is the 'contract' phase, and rushing it is how a team ends up needing the old system back after already deleting it.",
            relatedLink: { href: "/interview/backward-compatibility-immediate-migration", label: "The same expand-migrate-contract pattern, applied to API/schema changes" },
          },
        ],
      },
    ],
    closingTip:
      "Naming this as the exact same expand → migrate → contract shape used for any zero-downtime migration — just applied to physical data placement instead of a schema field — is the detail that shows this is a pattern you actually understand, not a resharding-specific trick memorized in isolation.",
  },
];
