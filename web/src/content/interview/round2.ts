import type { InterviewQuestion } from "./types";

export const round2Questions: InterviewQuestion[] = [
  {
    slug: "express-mvc-rest-api",
    question: "Build scalable REST APIs using Express.js following MVC architecture.",
    category: "Node.js / Express",
    round: "round-2",
    summary:
      "The classic Model-View-Controller split, adapted for a JSON API (no server-rendered views) — and this repo's backend already IS this architecture, running.",
    intro:
      "For a JSON API there's no server-rendered 'View' in the traditional MVC sense, so the practical adaptation most production Node APIs converge on is Routes → Controllers → Services → Data layer. This repo's express-production-api is built exactly this way — the strongest possible answer to this question is to walk through that real, running structure rather than describe it in the abstract.",
    sections: [
      {
        heading: "The layers, and why each one exists",
        points: [
          {
            title: "Routes — define endpoints, wire up middleware",
            detail:
              "Maps an HTTP verb + path to a controller function, with request-level middleware (auth, validation, rate limiting) attached per-route. Routes contain no business logic at all.",
            sourceRef: "express-production-api/src/routes/v1/*.routes.js",
          },
          {
            title: "Controllers — thin HTTP adapters",
            detail:
              "Parse the request, call a service function, shape the HTTP response (status code, JSON body). A controller should be short enough to read in one glance — if it's doing real logic, that logic belongs one layer down.",
            sourceRef: "express-production-api/src/controllers/*Controller.js",
          },
          {
            title: "Services — business logic, framework-agnostic",
            detail:
              "The actual rules: validation beyond simple shape-checking, orchestrating multiple data operations, enforcing invariants. Services don't know about req/res at all — they're plain functions, which makes them trivially unit-testable without spinning up Express.",
            sourceRef: "express-production-api/src/services/*Service.js",
          },
          {
            title: "Data layer — the 'Model', isolated behind the service layer",
            detail:
              "Every access to storage goes through the service layer, so swapping the actual database technology later only touches this layer — routes and controllers are completely unaffected by that change.",
            sourceRef: "express-production-api/src/data/store.js (in-memory here, swappable for Postgres/Mongo)",
          },
        ],
      },
      {
        heading: "What makes it scalable, not just organized",
        points: [
          {
            title: "Statelessness",
            detail:
              "No per-request state lives in the Node process itself (session data, in-flight upload progress, etc. all live in Redis/DB) — that's what lets you run N identical instances behind a load balancer instead of one.",
          },
          {
            title: "Versioning from day one",
            detail:
              "Mounting routes under /api/v1 means a future /api/v2 can be added and evolved independently, without a breaking change forcing every existing client to migrate simultaneously.",
            sourceRef: "express-production-api/src/routes/v1/index.js",
          },
          {
            title: "Centralized cross-cutting concerns",
            detail:
              "Auth, validation, rate limiting, error handling, and logging are middleware — written once, applied per-route as needed, instead of copy-pasted into every controller.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to defend the extra 'service' layer versus classic 2-layer MVC (controller talks directly to the model): the service layer is what makes business logic unit-testable without an HTTP request/response round trip, and reusable if you ever add a second entry point (a CLI script, a queue consumer) that needs the same logic.",
  },
  {
    slug: "auth-rbac-validation",
    question:
      "Implement JWT Authentication, Role-Based Authorization, Password Hashing (bcrypt), Middleware, and Input Validation.",
    category: "Node.js / Express",
    round: "round-2",
    summary:
      "Five pieces of the standard Express auth stack — all implemented and working in this repo's backend.",
    intro:
      "This repo's own middleware is named exactly along the lines this question is asked in — authenticate() answers 'who are you', authorize() answers 'what can you do' — which makes for a clean, concrete way to structure the answer.",
    sections: [
      {
        heading: "JWT Authentication",
        points: [
          {
            title: "Stateless identity via a signed token",
            detail:
              "A JWT carries claims (user id, roles, expiry) and is verified with a secret/public key — no database lookup needed just to authenticate a request. Standard pattern: short-lived access token (sent in the Authorization header) plus a longer-lived refresh token (often an httpOnly cookie, so it can't be read by injected JS) used only to mint new access tokens.",
            sourceRef: "express-production-api/src/services/authService.js + utils/tokens.js",
          },
        ],
      },
      {
        heading: "Role-Based Authorization",
        points: [
          {
            title: "authorize(...roles) middleware, run after authentication",
            detail:
              "Checks req.user.roles (populated by the auth middleware) against a list of roles allowed for that route; 403s if there's no overlap. A resource-ownership variant handles 'the owner OR an admin' — e.g. a user editing their own order, or an admin editing any order.",
            sourceRef: "express-production-api/src/middleware/authorize.js — authorize() and authorizeOwnerOrRoles()",
          },
        ],
      },
      {
        heading: "Password Hashing (bcrypt)",
        points: [
          {
            title: "Never store plaintext — and never use a fast hash either",
            detail:
              "bcrypt is an adaptive hashing algorithm with a built-in per-password salt and a configurable, deliberately slow cost factor — the slowness is the point, it's what makes brute-forcing leaked hashes expensive. Fast general-purpose hashes (MD5, SHA-256 alone) are the wrong tool here precisely because they're fast.",
            sourceRef: "express-production-api/src/models/User.js",
          },
        ],
      },
      {
        heading: "Middleware",
        points: [
          {
            title: "(req, res, next) functions forming a pipeline",
            detail:
              "Each middleware runs in order, and either handles the request, or calls next() to pass control on (optionally with an error, which skips straight to the error-handling middleware). This is how auth, validation, and rate limiting get applied consistently across many routes without duplicating logic inside each route handler.",
          },
        ],
      },
      {
        heading: "Input Validation",
        points: [
          {
            title: "Validate at the boundary, before any business logic runs",
            detail:
              "express-validator chains declare the expected shape per-route; a shared validate middleware collects any errors and responds with a consistent 400 shape — so a service function can trust its inputs already conform to what it expects, rather than re-checking everywhere.",
            sourceRef: "express-production-api/src/middleware/validate.js",
          },
        ],
      },
    ],
    closingTip:
      "A strong detail to volunteer: explain WHY the refresh token lives in an httpOnly cookie while the access token doesn't (XSS can't read an httpOnly cookie, but that same property is exactly why the cookie needs separate CSRF protection — the two tradeoffs are linked).",
  },
  {
    slug: "mongodb-fundamentals",
    question:
      "Explain MongoDB CRUD Operations, Aggregation Pipeline, Indexing, References vs Embedded Documents, and Query Optimization.",
    category: "MongoDB",
    round: "round-2",
    summary: "Five MongoDB fundamentals — the schema-design tradeoff (references vs embedding) is usually the one interviewers dig into deepest.",
    intro:
      "MongoDB's flexibility means several of these are genuine design decisions with real tradeoffs, not just facts to recite — especially references vs embedding, which is the one worth having a clear opinion on with reasoning.",
    sections: [
      {
        heading: "CRUD Operations",
        points: [
          {
            title: "insert / find / update / delete, with the usual variants",
            detail:
              "insertOne/insertMany; find/findOne with a filter, projection (which fields), sort, limit, skip; updateOne/updateMany with operators like $set, $inc, $push rather than replacing the whole document; deleteOne/deleteMany.",
          },
        ],
      },
      {
        heading: "Aggregation Pipeline",
        points: [
          {
            title: "A sequence of stages transforming the document stream",
            detail:
              "$match filters (like WHERE), $group aggregates (like GROUP BY), $sort, $project reshapes output fields, $lookup joins another collection, $unwind flattens an array field into separate documents. Each stage's output feeds the next — it's a data pipeline, not a single query.",
            code: `db.orders.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$userId', totalSpent: { $sum: '$amount' } } },
  { $sort: { totalSpent: -1 } },
]);`,
          },
        ],
      },
      {
        heading: "Indexing",
        points: [
          {
            title: "Without one, MongoDB scans the whole collection",
            detail:
              "An index on a frequently-queried or frequently-sorted field turns a full collection scan into an index scan — verify with .explain('executionStats') that a query is actually using the index you think it is. For compound indexes (multiple fields), field order matters and generally follows the ESR rule: Equality fields first, then Sort fields, then Range fields.",
          },
        ],
      },
      {
        heading: "References vs Embedded Documents",
        points: [
          {
            title: "The core schema-design decision in MongoDB",
            detail:
              "Embed when the data is read together, belongs to a '1-to-few' relationship, and won't grow unboundedly — one query, no join needed (e.g. a blog post's comments, if a post won't have thousands). Reference (store an ObjectId, populate when needed) when the data is reused across many parents, grows large/unbounded, or changes independently of its parent (e.g. a product referenced by many orders) — avoids duplicating data and hitting the 16MB single-document size cap.",
          },
        ],
      },
      {
        heading: "Query Optimization",
        points: [
          {
            title: "Project only what you need, paginate, avoid patterns that can't use an index",
            detail:
              "Use a projection to fetch only needed fields instead of whole documents; always paginate instead of returning unbounded result sets; avoid unanchored regex or $where (can't use an index, force a full scan); in Mongoose specifically, .lean() on read-only queries skips hydrating full Mongoose documents and is meaningfully faster for large result sets.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to design a schema live: state the read/write pattern out loud first ('how often is this read together vs written independently') — that's the actual input to the embed-vs-reference decision, not a rule you can apply without knowing the access pattern.",
  },
  {
    slug: "crud-api-cross-cutting-concerns",
    question:
      "Build CRUD APIs with Pagination, Filtering, Sorting, File Upload (Multer), Validation, Logging, and Global Error Handling.",
    category: "Node.js / Express",
    round: "round-2",
    summary:
      "Six cross-cutting concerns that every production CRUD API needs — all implemented in this repo, including a file-upload approach that goes further than the typical Multer answer.",
    intro:
      "Each of these is a solved problem in this repo's backend — the answer below explains the approach for each and points to the real, working code rather than re-deriving it from scratch.",
    sections: [
      {
        heading: "Pagination",
        points: [
          {
            title: "Offset for simple/small datasets, cursor for scale/correctness under writes",
            detail:
              "This repo deliberately implements both, on two different resources, to demonstrate the tradeoff directly rather than picking one.",
            sourceRef: "express-production-api/src/utils/pagination.js",
          },
        ],
      },
      {
        heading: "Filtering & Sorting",
        points: [
          {
            title: "Validated query parameters applied server-side, before pagination",
            detail:
              "e.g. ?sort=-createdAt&category=electronics — validated the same way as any other input, so a malformed sort/filter value 400s cleanly instead of producing an undefined query result.",
          },
        ],
      },
      {
        heading: "File Upload",
        points: [
          {
            title: "Multer is the standard choice — but it isn't the only approach",
            detail:
              "Multer handles multipart/form-data uploads well for the common case (a form with a file field, moderate size). This repo went a step further and built a raw chunked/streamed upload endpoint instead — the file arrives as raw application/octet-stream, piped directly to disk with zero in-memory buffering, with resumability built on top. That's the right tool once you're past 'attach a file to a form' and into 'upload something large and unreliable-network-tolerant.'",
            relatedLink: {
              href: "/upload",
              label: "See the working chunked/resumable upload demo on this site",
            },
          },
        ],
      },
      {
        heading: "Validation",
        points: [
          {
            title: "express-validator chains + one shared validate middleware",
            detail: "Same pattern as the auth question — validate at the boundary, consistent error shape.",
            sourceRef: "express-production-api/src/middleware/validate.js",
          },
        ],
      },
      {
        heading: "Logging",
        points: [
          {
            title: "Structured logs, plus HTTP access logging",
            detail:
              "A structured (JSON) logger for application events, and morgan for HTTP request logging piped through that same logger — so both end up in one consistent, machine-parseable format instead of mixed plain-text output.",
            sourceRef: "express-production-api/src/config/logger.js + app.js's morgan setup",
          },
        ],
      },
      {
        heading: "Global Error Handling",
        points: [
          {
            title: "One centralized handler, an operational-vs-programmer-error distinction",
            detail:
              "Every route funnels errors to next(err) rather than handling them inline; a custom error class marks expected, 'safe to show the client' errors, and the centralized handler makes sure anything else returns a generic message instead of leaking internal details like a stack trace or a database error.",
            sourceRef: "express-production-api/src/utils/AppError.js + middleware/errorHandler.js",
          },
        ],
      },
    ],
    closingTip:
      "The file-upload answer is a good place to demonstrate you know Multer's limitation (it buffers into memory or a temp file per request) rather than just naming it as the default answer — mentioning the streaming alternative shows you understand WHY it exists.",
  },
  {
    slug: "redis-security-env",
    question:
      "Explain Redis Caching, Rate Limiting, Async Operations, Environment Variables, and API Security Best Practices.",
    category: "Node.js / Express",
    round: "round-2",
    summary:
      "Caching, throttling, non-blocking I/O, config management, and security hardening — the operational half of building an API, not just the CRUD half.",
    intro:
      "This set is about running an API safely and efficiently in production, as opposed to just making it functionally correct — a distinction worth naming explicitly in the answer.",
    sections: [
      {
        heading: "Redis Caching",
        points: [
          {
            title: "A backend-agnostic cache interface, Redis in production, in-memory for zero-infra local dev",
            detail:
              "Cache expensive GET responses keyed by the request, with pattern-based invalidation on writes that would make the cached data stale. Worth designing the cache access behind one small interface (get/set/del) so the actual backend (Redis vs in-memory) can be swapped without touching call sites.",
            sourceRef: "express-production-api/src/utils/cache.js + middleware/cacheMiddleware.js",
          },
        ],
      },
      {
        heading: "Rate Limiting",
        points: [
          {
            title: "Not one global number — different budgets for different route shapes",
            detail:
              "A single global rate limit sized for normal traffic will incorrectly throttle something like a chunked file upload (many small requests) or a polling endpoint. This repo layers a general limiter with tighter/looser dedicated limiters per route type — and hit a real bug worth knowing about: if the general limiter is mounted globally ahead of routing, it still applies FIRST and silently overrides a more generous route-specific limiter unless you explicitly skip() it for those routes.",
            sourceRef: "express-production-api/src/middleware/rateLimit.js",
          },
        ],
      },
      {
        heading: "Async Operations",
        points: [
          {
            title: "Never block the event loop in a request handler",
            detail:
              "Node.js runs your JavaScript on a single thread — a synchronous, blocking call (fs.writeFileSync, a heavy synchronous computation) stalls every other in-flight request on the whole process, not just the slow one.",
            relatedLink: {
              href: "/upload",
              label: "Watch this happen live, with measured numbers: the Sync vs Async upload demo",
            },
          },
        ],
      },
      {
        heading: "Environment Variables",
        points: [
          {
            title: "Centralized config, fail fast on missing secrets in production",
            detail:
              "All process.env reads live in one config module rather than scattered through the codebase; a small helper throws at boot if a required secret is missing while NODE_ENV=production, so misconfiguration is caught immediately instead of surfacing as a mysterious runtime failure later. .env files are never committed.",
            sourceRef: "express-production-api/src/config/index.js",
          },
        ],
      },
      {
        heading: "API Security Best Practices",
        points: [
          {
            title: "Defense in depth: several independent layers, not one silver bullet",
            detail:
              "helmet for sane security headers, a strict CORS allowlist (never a wildcard, especially once credentials/cookies are involved), rate limiting, input validation everywhere, generic error messages to clients (details only in server logs), HTTPS/TLS, secrets via env vars or a secrets manager (never hardcoded), and CSRF protection specifically on any cookie-authenticated, state-changing endpoint.",
            sourceRef: "express-production-api/src/app.js + middleware/csrf.js",
          },
        ],
      },
    ],
    closingTip:
      "The rate-limiter-shadowing bug above is a genuinely good story if asked for a real debugging example — it's subtle, easy to explain, and demonstrates you understand middleware ordering, not just what each middleware does in isolation.",
  },
  {
    slug: "detect-cycle-in-linked-list",
    question: "Solve: Detect Cycle in Linked List",
    category: "DSA",
    round: "round-2",
    summary: "Determine whether a linked list has a cycle. Floyd's tortoise-and-hare, O(1) space.",
    intro: "Given the head of a linked list, determine whether it contains a cycle.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "Two pointers, different speeds",
            detail:
              "A hash-set of visited nodes works (O(n) space) but there's a better trick: move one pointer one step at a time ('slow') and another two steps at a time ('fast'). If there's a cycle, fast is gaining exactly one node on slow per iteration relative to the cycle, so it must eventually lap and meet slow again. If there's no cycle, fast simply reaches the end.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Floyd's cycle detection (tortoise and hare)",
            detail: "",
            code: `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // they met — there's a cycle
  }
  return false; // fast hit the end — no cycle
}`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n) time, O(1) space",
            detail: "The O(1) space is the whole point of this approach over the hash-set alternative.",
          },
        ],
      },
    ],
    closingTip:
      "A common, reasonable follow-up: 'find where the cycle begins' — after slow and fast meet, resetting one pointer to head and advancing both one step at a time, they'll meet again exactly at the cycle's start. Worth knowing this exists even if not asked.",
  },
  {
    slug: "merge-two-sorted-linked-lists",
    question: "Solve: Merge Two Sorted Linked Lists",
    category: "DSA",
    round: "round-2",
    summary: "Merge two sorted linked lists into one sorted list. The merge step from merge sort, applied to linked nodes.",
    intro: "Given the heads of two sorted linked lists, merge them into one sorted list and return its head.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "The same merge step as merge sort — but relinking, not copying",
            detail:
              "Walk both lists simultaneously, always attaching the smaller current node to the result and advancing that list. A dummy head node avoids special-casing 'what's the very first node of the result'.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Iterative merge with a dummy head",
            detail: "",
            code: `function mergeTwoLists(l1, l2) {
  const dummy = { val: 0, next: null };
  let current = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }

  current.next = l1 || l2; // attach whichever list still has nodes left
  return dummy.next;
}`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n + m) time, O(1) extra space",
            detail:
              "n and m are the two list lengths. Existing nodes are relinked in place, not copied into new nodes, so no extra space beyond the dummy node and a couple of pointers.",
          },
        ],
      },
    ],
    closingTip:
      "This is also solvable recursively in a few lines — worth mentioning both, since interviewers sometimes specifically ask for the recursive version as a follow-up.",
  },
  {
    slug: "binary-tree-level-order-traversal",
    question: "Solve: Binary Tree Level Order Traversal",
    category: "DSA",
    round: "round-2",
    summary: "Return node values level by level, top to bottom. Classic BFS with a queue.",
    intro:
      "Given the root of a binary tree, return the values of its nodes level by level (breadth-first), as a list of lists — one inner list per level.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "BFS with a queue, one level processed per outer loop iteration",
            detail:
              "The trick to grouping output BY LEVEL (not just a flat BFS order) is capturing the queue's size at the start of each iteration — that's exactly how many nodes belong to the current level, before any of their children get enqueued.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Queue-based BFS",
            detail: "",
            code: `function levelOrder(root) {
  if (!root) return [];
  const result = [];
  let queue = [root];

  while (queue.length > 0) {
    const level = [];
    const nextQueue = [];
    for (const node of queue) {
      level.push(node.val);
      if (node.left) nextQueue.push(node.left);
      if (node.right) nextQueue.push(node.right);
    }
    result.push(level);
    queue = nextQueue;
  }
  return result;
}`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n) time, O(n) space",
            detail:
              "Every node is visited exactly once; the queue can hold up to one full level's worth of nodes at a time, and the output holds every node's value.",
          },
        ],
      },
    ],
    closingTip:
      "If asked why not DFS with a depth parameter instead: DFS can also produce level-grouped output (push into result[depth], recursing) and uses less peak memory for a very wide, shallow tree — worth knowing BOTH approaches exist rather than treating BFS as the only answer.",
  },
];
