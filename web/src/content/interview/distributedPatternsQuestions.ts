import type { InterviewQuestion } from "./types";

// Distributed-systems resilience/consistency patterns beyond what's already
// covered (replication, partitioning, CAP theorem in general.ts). These are
// the specific named patterns a lead-level system design interview
// frequently expects by name: circuit breaker, saga, event sourcing/CQRS,
// bulkhead — plus a scenario tying several together.
export const distributedPatternsQuestions: InterviewQuestion[] = [
  {
    slug: "circuit-breaker-pattern",
    question: "Explain the circuit breaker pattern — what problem does it solve, and what are its states?",
    category: "System Design",
    round: "general",
    summary:
      "A circuit breaker stops calling a failing downstream dependency after enough failures, failing fast instead of piling up slow, doomed requests — closed (normal), open (failing fast, not calling through), and half-open (cautiously testing recovery) are its three states.",
    intro: "Naming all three states, and specifically what triggers each transition, is what separates a real answer from 'it's like a fuse for API calls'.",
    sections: [
      {
        heading: "The problem it solves",
        points: [
          {
            title: "A struggling dependency shouldn't be allowed to take everything else down with it",
            detail:
              "Without a circuit breaker, every caller keeps sending requests to a failing/slow downstream dependency, each one waiting out a full timeout — under load, this can exhaust the caller's own thread pool/connection pool waiting on a dependency that was never going to respond in time, turning one struggling service's problem into a cascading outage across everything that calls it.",
          },
        ],
      },
      {
        heading: "The three states",
        points: [
          {
            title: "Closed → Open → Half-Open → (Closed or Open again)",
            detail:
              "Closed: normal operation, requests flow through, failures are counted. Open: after failures cross a threshold, the breaker 'trips' — requests fail immediately WITHOUT calling the downstream dependency at all, giving it room to recover and giving the caller a fast, predictable failure instead of a slow timeout. Half-Open: after a cooldown period, a small number of test requests are allowed through to check if the dependency has recovered — if they succeed, the breaker closes again; if they fail, it reopens and waits longer before trying again.",
            code: `// pseudocode — the state machine, not a specific library's API
if (breaker.state === 'OPEN') {
  if (Date.now() < breaker.openUntil) throw new Error('circuit open — failing fast');
  breaker.state = 'HALF_OPEN'; // cooldown elapsed, try a test request
}
try {
  const result = await callDownstream();
  breaker.recordSuccess(); // closes the circuit if it was half-open
  return result;
} catch (err) {
  breaker.recordFailure(); // trips to OPEN if failures cross the threshold
  throw err;
}`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip: "The one-sentence framing: 'a circuit breaker trades a slow, doomed request for a fast, predictable failure, and gives a struggling dependency room to recover instead of getting hammered by retries from every caller at once.'",
  },
  {
    slug: "saga-pattern-distributed-transactions",
    question: "How do you handle a transaction that spans multiple services, without a distributed ACID transaction?",
    category: "System Design",
    round: "general",
    summary:
      "The saga pattern breaks a multi-service transaction into a sequence of local transactions, each with a defined COMPENSATING action to undo it — if any step fails, previously completed steps are compensated in reverse, rather than relying on a distributed lock/2PC across services.",
    intro: "The compensating-action mechanism is the actual core of this answer — a saga isn't just 'call the services in order', it's specifically the undo mechanism when a later step fails.",
    sections: [
      {
        heading: "Why not just a distributed transaction",
        points: [
          {
            title: "Two-phase commit doesn't fit a microservices world well",
            detail:
              "Two-phase commit (2PC) requires all participants to hold locks until every participant confirms — this couples services tightly, doesn't scale well, and a single slow/unavailable participant blocks everyone. Real microservice architectures generally avoid distributed ACID transactions across service boundaries entirely, using sagas instead.",
          },
        ],
      },
      {
        heading: "The saga mechanism — local transactions plus compensating actions",
        points: [
          {
            title: "Each step is a local transaction with a defined 'undo'",
            detail:
              "A checkout saga might be: reserve inventory → charge payment → create shipment. Each step commits locally and independently. If the payment charge fails, a COMPENSATING action runs for the already-completed inventory reservation (release it) — the saga doesn't roll back atomically like a database transaction, it actively UNDOES each completed step in reverse via its own defined compensation.",
          },
          {
            title: "Choreography vs orchestration",
            detail:
              "Choreography: each service listens for events and reacts independently (inventory service hears 'payment failed' and releases stock itself) — no central coordinator, but the overall flow is harder to see in one place as the number of steps grows. Orchestration: a central saga orchestrator explicitly calls each step and triggers compensations on failure — easier to reason about and observe, at the cost of that orchestrator becoming a more central, more critical component.",
          },
        ],
      },
    ],
    closingTip: "Name the compensating action explicitly as the core mechanism: 'a saga doesn't get atomic rollback for free — you design and implement an explicit undo for every step, and that design work is the actual substance of building a saga.'",
  },
  {
    slug: "event-sourcing-and-cqrs",
    question: "What is event sourcing, and how does CQRS relate to it?",
    category: "System Design",
    round: "general",
    summary:
      "Event sourcing stores every state change as an immutable event, with current state derived by replaying them — rather than the usual 'store current state, overwrite on update' model. CQRS is a related but separate idea: splitting the read model from the write model, often paired with event sourcing but not requiring it.",
    intro: "These two concepts get blurred together often — the strongest answer treats them as related but genuinely separate ideas, since one can exist without the other.",
    sections: [
      {
        heading: "Event sourcing — the log of changes IS the source of truth",
        points: [
          {
            title: "Store what happened, not just the current state",
            detail:
              "Instead of an orders table where an UPDATE overwrites the previous status, event sourcing stores an append-only log: OrderCreated, PaymentReceived, OrderShipped — each an immutable fact. Current state is derived by replaying the events, not stored as the primary source of truth. This gives a complete audit trail for free (you can always answer 'what was the state at any point in time') and makes debugging a wrong current state possible by replaying exactly what happened, at the cost of real complexity: querying 'current state' directly requires either replaying events or maintaining a separate derived view.",
          },
        ],
      },
      {
        heading: "CQRS — splitting the read model from the write model",
        points: [
          {
            title: "A related, but independently adoptable, idea",
            detail:
              "CQRS (Command Query Responsibility Segregation) uses a different model for writes (commands) than for reads (queries) — writes go through the domain logic and validation; reads come from a separately optimized, often denormalized view built specifically for fast querying. This pairs naturally with event sourcing (the write side appends events, a separate process builds read-optimized views from them), but you can use CQRS with a normal database and no event sourcing at all, or use event sourcing with a single unified model and no CQRS — they're genuinely separable.",
          },
        ],
      },
      {
        heading: "When this complexity is actually worth it",
        points: [
          {
            title: "A real audit/compliance need, or genuinely different read/write scaling needs — not a default",
            detail:
              "This combination adds real complexity (eventual consistency between the write side and derived read views, more moving parts) — worth it when you have a genuine need for a full audit trail (financial systems, compliance-heavy domains) or read and write loads that need to scale completely differently. It is not a default architecture to reach for on a typical CRUD system.",
          },
        ],
      },
    ],
    closingTip: "Naming that they're separable — 'CQRS without event sourcing is common; event sourcing without CQRS is possible too; they're just frequently paired' — is the detail that shows you understand both concepts individually, not just as a package deal.",
  },
  {
    slug: "bulkhead-pattern-resource-isolation",
    question: "What is the bulkhead pattern, and how does it differ from a circuit breaker?",
    category: "System Design",
    round: "general",
    summary:
      "A bulkhead isolates resources (thread pools, connection pools) PER dependency so one slow dependency can't exhaust resources shared by everything else — a circuit breaker stops calling a failing dependency; a bulkhead limits the damage even while still calling it.",
    intro: "These two patterns are often mentioned together and get conflated — the strongest answer names the specific difference: a circuit breaker is about WHETHER to call, a bulkhead is about ISOLATING the resources used while calling.",
    sections: [
      {
        heading: "The problem — shared resource exhaustion",
        points: [
          {
            title: "One slow dependency can starve requests to every OTHER dependency too",
            detail:
              "If a service calls three downstream dependencies using one shared thread/connection pool, and one dependency becomes slow, requests to it pile up and consume the ENTIRE shared pool — starving requests to the other two, perfectly healthy dependencies. The failure isn't contained to the slow dependency at all; it takes down unrelated functionality that shares the same resource pool.",
          },
        ],
      },
      {
        heading: "The fix — separate resource pools per dependency",
        points: [
          {
            title: "Named after ship compartments — a hole in one doesn't sink the whole ship",
            detail:
              "Give each downstream dependency its OWN dedicated thread pool / connection pool / concurrency limit. If dependency A gets slow and exhausts ITS pool, dependency B's calls (using a completely separate pool) are unaffected. The blast radius of a resource-exhaustion failure is contained to just the one dependency's compartment, exactly like a ship's watertight compartments.",
          },
        ],
      },
      {
        heading: "Bulkhead vs circuit breaker — complementary, not the same thing",
        points: [
          {
            title: "Different questions: 'should I isolate this?' vs 'should I even call this?'",
            detail:
              "A bulkhead answers 'if this dependency is slow, can it still damage everything else?' (contained via resource isolation). A circuit breaker answers 'this dependency is clearly failing — should I stop calling it entirely for a while?' (fail fast, give it room to recover). Real resilient systems typically use both together: bulkheads to contain the blast radius, circuit breakers on top to stop hammering a dependency that's clearly down.",
          },
        ],
      },
    ],
    closingTip: "State the complementary relationship explicitly: 'bulkheads contain the blast radius of a slow dependency by isolating its resources; circuit breakers decide when to stop calling a failing one entirely — a resilient system typically uses both together, not one instead of the other.'",
  },
  {
    slug: "scenario-resilient-checkout-service-design",
    question: "Scenario: design a checkout service that stays resilient when its payment provider is having a bad day.",
    category: "System Design",
    round: "general",
    summary:
      "A concrete scenario tying circuit breaker, bulkhead, and saga together: isolate the payment call's resources (bulkhead), stop hammering a clearly-failing provider (circuit breaker), and handle a partially-completed checkout safely (saga with compensation) — rather than reaching for just one pattern in isolation.",
    intro: "This is where the individual patterns above actually combine — the strongest answer explains WHICH pattern addresses WHICH specific failure mode in this scenario, rather than name-dropping all of them generically.",
    sections: [
      {
        heading: "First, isolate the payment call's resources — bulkhead",
        points: [
          {
            title: "A slow payment provider shouldn't be able to starve inventory or shipping calls",
            detail:
              "Give the payment-provider call its own dedicated connection pool/concurrency limit, separate from calls to inventory or shipping services. If the payment provider gets slow, checkout requests pile up against the PAYMENT pool specifically — inventory checks and shipment creation for OTHER, unrelated requests keep working normally.",
          },
        ],
      },
      {
        heading: "Then, stop hammering a provider that's clearly down — circuit breaker",
        points: [
          {
            title: "Fail fast once failures cross a threshold, instead of every checkout waiting out a full timeout",
            detail:
              "Wrap the payment call in a circuit breaker. Once enough consecutive failures happen, trip to OPEN — new checkout attempts get a fast, clear 'payment temporarily unavailable, please retry shortly' instead of each one hanging for a full timeout and piling up. Half-open periodically tests whether the provider has recovered, without needing a human to flip anything back on manually.",
          },
        ],
      },
      {
        heading: "Handle a checkout that partially completed before the failure — saga",
        points: [
          {
            title: "Inventory may already be reserved when the payment step fails — compensate it",
            detail:
              "If inventory was reserved (step 1) and the payment charge (step 2) then fails or times out, a compensating action releases that reserved inventory rather than leaving it stuck reserved indefinitely against a checkout that never completed. This is exactly the saga pattern's compensation mechanism, applied to this specific failure point.",
            relatedLink: { href: "/interview/saga-pattern-distributed-transactions", label: "The general saga/compensation mechanism this scenario applies" },
          },
        ],
      },
    ],
    closingTip: "Structure the answer around the THREE distinct failure modes this scenario actually has — resource starvation (bulkhead), hammering a dead dependency (circuit breaker), and a partially-completed transaction (saga) — and name which pattern addresses which. That structure itself is the strongest signal in this answer.",
  },
];
