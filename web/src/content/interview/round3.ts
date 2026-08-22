import type { InterviewQuestion } from "./types";

export const round3Questions: InterviewQuestion[] = [
  {
    slug: "design-ecommerce-system",
    question: "Design a MERN-based E-Commerce System.",
    category: "System Design",
    round: "round-3",
    summary:
      "Structure the answer: requirements → high-level architecture → data model → key flows → scaling. This repo's backend is a small, real slice of exactly this system.",
    intro:
      "System design questions reward STRUCTURE more than raw knowledge — walk through requirements, architecture, data model, key flows, and scaling considerations in that order rather than free-associating features. express-production-api in this repo is a genuine (if intentionally small) slice of this exact system: products, orders, auth, caching, idempotent writes.",
    sections: [
      {
        heading: "1. Clarify requirements first",
        points: [
          {
            title: "Scope questions worth asking out loud",
            detail:
              "Scale (thousands vs millions of products/users)? Read-heavy (browsing) vs write-heavy (flash sales)? Payment handled by us or a processor like Stripe? Real-time inventory needed, or eventual consistency acceptable? Answering these first shows you design for the actual problem, not a generic template.",
          },
        ],
      },
      {
        heading: "2. High-level architecture",
        points: [
          {
            title: "Client → API layer → data/cache/queue, behind a load balancer",
            detail:
              "React frontend (SSR/SSG for product pages — they're read-heavy and highly cacheable; CSR for the cart/checkout, which is inherently personalized/dynamic). Express/Node API, stateless, horizontally scaled behind a load balancer. MongoDB for the primary store. Redis for caching and session/rate-limit state. A CDN in front of static assets and cacheable product images/pages. A queue/event bus for anything that shouldn't block the checkout response (order confirmation emails, inventory sync, analytics).",
            relatedLink: {
              href: "/rendering",
              label: "See the CSR vs SSR vs SSG tradeoff demonstrated live on this site",
            },
          },
        ],
      },
      {
        heading: "3. Data model sketch",
        points: [
          {
            title: "Users, Products, Orders, Cart — with the snapshot rule",
            detail:
              "Users: auth fields, hashed password, role, embedded addresses. Products: name, slug, price, category (indexed), variants (SKU/attributes/price/stock), a denormalized totalStock and ratingAvg for fast reads without on-read aggregation. Orders: reference to user, line items that SNAPSHOT product name/price at purchase time — an order must never re-derive its total from the current, possibly-changed product record, since it's an immutable record of what was actually paid. Cart: session/Redis-backed for guests, persisted per-user once authenticated, with a TTL index so abandoned carts expire automatically instead of accumulating forever.",
            code: `// Product — denormalized fields avoid expensive on-read aggregation\n{\n  name: String,\n  slug: { type: String, unique: true, index: true },\n  price: Number,\n  category: { type: ObjectId, ref: 'Category', index: true },\n  variants: [{ sku: String, attributes: { color: String, size: String }, price: Number, stock: Number }],\n  totalStock: Number,      // denormalized\n  ratingAvg: { type: Number, default: 0 },\n  ratingCount: { type: Number, default: 0 },\n}\ndb.products.createIndex({ name: 'text', description: 'text' }); // search\ndb.products.createIndex({ category: 1, status: 1, price: 1 });   // filter/sort\n\n// Order — line items are a SNAPSHOT, never a live reference\n{\n  items: [{ productId: ObjectId, variantSku: String, name: String, price: Number, quantity: Number }],\n  status: { type: String, enum: ['pending','paid','processing','shipped','delivered','cancelled','refunded'], index: true },\n  paymentIntentId: String,\n  statusHistory: [{ status: String, timestamp: Date, note: String }],\n}\n\n// Cart — TTL index expires abandoned carts automatically\ndb.carts.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "4. Key flows",
        points: [
          {
            title: "Browse & search",
            detail:
              "Paginated, filterable, cached product listings — this repo demonstrates the cursor-pagination half directly.",
            sourceRef: "express-production-api/src/routes/v1/product.routes.js",
            relatedLink: { href: "/interview/offset-vs-cursor-pagination", label: "Why cursor pagination specifically, for a growing catalog" },
          },
          {
            title: "Inventory consistency — atomic stock decrement",
            detail:
              "Decrementing stock and creating the order must happen atomically to avoid overselling the last unit under concurrent checkouts. A findOne then separate save() creates exactly this race: two concurrent checkouts can both read 'stock available' before either writes, and both succeed. A single atomic update with a condition closes the window entirely.",
            code: `async function decrementStock(sku, quantity) {\n  const result = await Product.updateOne(\n    { 'variants.sku': sku, 'variants.$.stock': { $gte: quantity } },\n    { $inc: { 'variants.$.stock': -quantity, totalStock: -quantity } }\n  );\n  if (result.modifiedCount === 0) throw new Error('Insufficient stock');\n}`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/services/orderService.js — the same atomic findOneAndUpdate pattern, running",
          },
          {
            title: "Checkout — transaction + idempotency key together",
            detail:
              "Checkout must be idempotent (a double-click or a client retry after a dropped connection must never create two orders or double-charge a card) AND the stock decrement + order creation must be atomic together. A MongoDB session transaction covers the second; an idempotency key checked before the transaction even starts covers the first. Note MongoDB transactions require a replica set — even a single-node one in dev — which is standard for Atlas and most production deployments.",
            code: `router.post('/checkout', authenticate, async (req, res) => {\n  const idempotencyKey = req.headers['idempotency-key'];\n  const existing = await Order.findOne({ idempotencyKey });\n  if (existing) return res.json(existing); // replay — return the original result, don't redo the work\n\n  const session = await mongoose.startSession();\n  try {\n    session.startTransaction();\n    const cart = await Cart.findOne({ userId: req.user.id }).session(session);\n    for (const item of cart.items) await decrementStock(item.variantSku, item.quantity);\n\n    const order = await Order.create([{ userId: req.user.id, items: cart.items, idempotencyKey, status: 'pending' }], { session });\n    const paymentIntent = await stripe.paymentIntents.create({\n      amount: order[0].total * 100, currency: 'usd', metadata: { orderId: order[0]._id.toString() },\n    });\n    await Order.updateOne({ _id: order[0]._id }, { paymentIntentId: paymentIntent.id }).session(session);\n    await Cart.deleteOne({ userId: req.user.id }).session(session);\n    await session.commitTransaction();\n    res.status(201).json({ order: order[0], clientSecret: paymentIntent.client_secret });\n  } catch (err) {\n    await session.abortTransaction();\n    res.status(400).json({ error: err.message });\n  } finally {\n    session.endSession();\n  }\n});`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/middleware/idempotency.js — used on POST /orders",
          },
          {
            title: "Payment — delegate to a processor, confirm via signed webhook",
            detail:
              "Delegate to a processor (Stripe/etc.) rather than handling card data directly — this offloads almost all PCI compliance scope. The order flow waits for the processor's signature-verified webhook before marking an order 'paid', not just the initial charge request succeeding client-side, since the client-side call only confirms the charge was initiated, not that it settled.",
            code: `router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {\n  const sig = req.headers['stripe-signature'];\n  let event;\n  try {\n    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);\n  } catch (err) {\n    return res.status(400).send('Webhook signature verification failed'); // never trust an unsigned payload\n  }\n  if (event.type === 'payment_intent.succeeded') {\n    const paymentIntent = event.data.object;\n    await Order.updateOne(\n      { paymentIntentId: paymentIntent.id },\n      { status: 'paid', $push: { statusHistory: { status: 'paid', timestamp: new Date() } } }\n    );\n    await orderQueue.add('process-paid-order', { orderId: paymentIntent.metadata.orderId }); // email/warehouse — off the request path\n  }\n  res.json({ received: true });\n});`,
            codeLanguage: "javascript",
          },
          {
            title: "Never trust a client-sent price",
            detail:
              "Recalculate the order total server-side from the database at checkout time, always — a client-supplied price/total is a price-manipulation vector, not just an integrity nicety.",
            code: `router.post('/checkout', async (req, res) => {\n  const cart = await Cart.findOne({ userId: req.user.id });\n  const total = await calculateTotalFromDB(cart.items); // recomputed server-side, never trust req.body.total\n});`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "5. Security checklist",
        points: [
          {
            title: "Layered, one control per concern",
            detail:
              "NoSQL injection: Mongoose schema validation + express-mongo-sanitize. XSS: sanitize user-generated content (reviews), httpOnly cookies for refresh tokens. CSRF: SameSite cookies, CSRF tokens on state-changing requests. Rate limiting: express-rate-limit specifically on auth and checkout endpoints. Payment data: never store card data at all — Stripe Elements/PaymentIntents keeps it out of your system entirely. Stock overselling: the atomic $inc with condition shown above. Webhook spoofing: verify the Stripe signature on every single webhook, no exceptions.",
          },
        ],
      },
      {
        heading: "6. Scaling considerations",
        points: [
          {
            title: "Cache hot, read-heavy data",
            detail: "Popular product pages, category listings — exactly the response-caching pattern in this repo, applied at e-commerce scale.",
            sourceRef: "express-production-api/src/middleware/cacheMiddleware.js",
            relatedLink: { href: "/interview/caching-strategies-system-design", label: "Cache invalidation and stampede protection in depth" },
          },
          {
            title: "Search deserves its own index, not regex queries on MongoDB",
            detail:
              "At real scale, full-text/faceted search moves to a dedicated engine (Elasticsearch, Atlas Search, Algolia) rather than MongoDB regex queries, which can't use standard indexes efficiently.",
          },
          {
            title: "Protect checkout specifically",
            detail:
              "Rate limit and monitor the checkout/payment path distinctly from general browsing traffic — it's the highest-value target for abuse (card testing, inventory-hoarding bots) and the most expensive path to get wrong.",
          },
          {
            title: "The realistic staged path",
            detail:
              "1) Single Node instance + MongoDB Atlas + Redis. 2) Redis caching for product listings, horizontal Node scaling (cluster/PM2). 3) MongoDB read replicas for reporting/analytics so those queries don't compete with checkout traffic. 4) CDN for product images and static assets. 5) Background job queue (BullMQ) for everything non-critical to the response — confirmation emails, warehouse notification, abandoned-cart reminders. 6) Sharding MongoDB by category/region — rare, only at very large scale, after every earlier stage is genuinely exhausted.",
            relatedLink: { href: "/interview/read-replicas-vertical-scaling-sharding", label: "The general escalation path this follows" },
          },
        ],
      },
    ],
    closingTip:
      "Naming the overselling race condition and the idempotent-checkout requirement unprompted are the two strongest signals in this question — they're the details that separate 'knows MERN' from 'has actually shipped a checkout flow.' If pushed for more depth, the transaction-plus-idempotency-key checkout code above is the single most concrete artifact you can produce on a whiteboard.",
  },
  {
    slug: "design-file-upload-service",
    question: "Design a File Upload Service using Cloud Storage.",
    category: "System Design",
    round: "round-3",
    summary:
      "Proxy-through-API vs direct-to-storage (presigned URLs) is the central tradeoff. This repo implements the proxy approach, working, with chunking and resumability.",
    intro:
      "The central design decision is whether uploaded bytes flow through your API server at all. This repo's /upload demo implements the proxy-through-API approach for real (chunked, streamed, resumable) — a great concrete reference point for explaining how it would evolve toward a cloud-storage-backed version.",
    sections: [
      {
        heading: "The central tradeoff: proxy vs direct-to-storage",
        points: [
          {
            title: "Proxy through your API server",
            detail:
              "The client sends bytes to your server, your server writes to storage (local disk, or an S3 SDK call). Gives you a hook to validate/scan/transform before the file is 'live', but every byte transits your API's bandwidth and compute — doesn't scale to many large concurrent uploads.",
            relatedLink: {
              href: "/upload",
              label: "This repo's working implementation of exactly this approach",
            },
          },
          {
            title: "Direct-to-storage via presigned URLs",
            detail:
              "The API only issues a short-lived, scoped presigned URL; the client uploads directly to S3/GCS, bypassing your server's bandwidth entirely. Standard approach at real scale — your server does no work for the transfer itself, only for authorizing it and recording the resulting metadata afterward.",
          },
        ],
      },
      {
        heading: "Handling large files",
        points: [
          {
            title: "Chunking maps directly onto S3's own Multipart Upload API",
            detail:
              "Split the file client-side, upload parts independently (in parallel, even), and finalize with a complete-multipart-upload call — conceptually identical to this repo's own init → chunk PUTs → complete flow, just with S3 as the chunk destination instead of local disk.",
            sourceRef:
              "express-production-api/src/services/uploadService.js — same init/chunk/complete/resumability shape you'd map onto S3 multipart",
          },
          {
            title: "Resumability",
            detail:
              "Track which parts/chunks have already landed (this repo does it via a small session record in the cache layer) so a dropped connection resumes instead of restarting a multi-gigabyte transfer from zero.",
          },
        ],
      },
      {
        heading: "Beyond the transfer itself",
        points: [
          {
            title: "Validate and scan before the file is 'live'",
            detail:
              "Check file type/size server-side (never trust a client-reported MIME type alone), run virus/malware scanning for user-uploaded content, and don't expose a public URL to the object until these checks pass.",
          },
          {
            title: "Metadata lives in your database, not in the storage bucket",
            detail:
              "Store owner, filename, size, upload timestamp, and processing status as a normal DB record referencing the storage key — search/list/permission-check against your database, not by listing bucket contents.",
          },
          {
            title: "Serve downloads through a CDN",
            detail: "Cloud storage in front of a CDN for actual file delivery — don't serve high-traffic downloads directly from origin storage.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to justify NOT using presigned URLs for a given scenario: the proxy approach is the right call when you must inspect/transform/reject content before it's stored (e.g. antivirus scanning, image re-encoding) — presigned URLs skip your server entirely, so that inspection has to happen as an async step after the fact instead.",
  },
  {
    slug: "behavioral-debugging-story",
    question: "Explain a challenging bug you fixed and your debugging approach.",
    category: "Behavioral",
    round: "round-3",
    summary:
      "A framework for structuring this answer (STAR), plus a genuinely real, specific example from building this very site that you can speak to firsthand.",
    intro:
      "This is a behavioral question — the answer has to be something you actually experienced, not a memorized script, or it falls apart under a natural follow-up question. Below is a structure for organizing whatever real bug you pick, plus a concrete, real example from building this project that you were genuinely present for and can speak to honestly if you want a ready example.",
    sections: [
      {
        heading: "A structure for any debugging story: STAR",
        points: [
          {
            title: "Situation",
            detail: "What was the symptom, and what was the impact? (e.g. 'a specific API call hung indefinitely with no error').",
          },
          {
            title: "Task",
            detail: "What were you responsible for figuring out or fixing, and under what constraint (time, not knowing the codebase yet, etc.)?",
          },
          {
            title: "Action",
            detail:
              "The actual investigation steps, in order — what you checked first and why, what ruled things out, what the key observation was that pointed at the real cause. This is the part interviewers care about most: your PROCESS, not just the punchline.",
          },
          {
            title: "Result",
            detail: "The fix, how you verified it actually worked (not just that it compiled), and anything you changed going forward to prevent the same class of bug.",
          },
        ],
      },
      {
        heading: "A real example from this project, if you want a concrete one",
        points: [
          {
            title: "Situation",
            detail:
              "While building the large-file-upload feature in this repo, the login request worked fine, but the very next API call (starting an upload session) hung indefinitely — no error, no timeout, just pending forever in the browser.",
          },
          {
            title: "Action",
            detail:
              "The key observation: login succeeded but the next call hung — so the difference between those two code paths was the real clue, not a random guess. Login didn't touch the cache layer; the upload-init call did (it's the first thing that calls getCache()). That narrowed it to something in the cache layer. Checking the .env file showed REDIS_URL was set, but no Redis server was actually running locally — so the Redis client was retrying its connection with backoff, and nothing was falling through to the in-memory fallback fast enough to notice.",
          },
          {
            title: "Result",
            detail:
              "Clearing REDIS_URL let the app fall back to its in-memory cache immediately, exactly as it's designed to do for local dev. Verified the fix wasn't just theoretical by timing the exact request that had hung before and after the change — it went from hanging indefinitely to responding in 0.16 seconds.",
          },
        ],
      },
    ],
    closingTip:
      "The strongest debugging stories all share one structural feature: a comparison between something that worked and something that didn't, and the insight came from asking 'what's actually different between these two' rather than guessing at the failing part in isolation. Pick a real story of yours that has that shape.",
  },
  {
    slug: "authn-authz-security-fundamentals",
    question: "Explain Authentication vs Authorization, Caching, Logging, API Security, and Exception Handling.",
    category: "Backend Fundamentals",
    round: "round-3",
    summary:
      "AuthN vs AuthZ is the one interviewers most often catch candidates conflating — this repo's own middleware is literally named after the distinction.",
    intro:
      "Five backend fundamentals, most of which have come up already in this list from different angles — this question is really asking you to define them precisely and distinguish the two that get confused most often: authentication and authorization.",
    sections: [
      {
        heading: "Authentication vs Authorization",
        points: [
          {
            title: "WHO you are, vs WHAT you're allowed to do",
            detail:
              "Authentication (AuthN) verifies identity — logging in, validating a token or session. Authorization (AuthZ) happens AFTER identity is established, and decides whether that identified user can perform the specific action they're attempting. A request can be authenticated (we know who you are) and still be unauthorized (you're not allowed to do this).",
            sourceRef:
              "express-production-api/src/middleware/auth.js (authenticate — WHO) vs authorize.js (authorize — WHAT)",
          },
        ],
      },
      {
        heading: "Caching",
        points: [
          {
            title: "Recap",
            detail:
              "Server-side (Redis/in-memory, invalidated on writes) and client-side (stale-while-revalidate libraries) — see the full breakdown in the API optimization and Redis/security questions in this list.",
            relatedLink: { href: "/interview/api-optimization", label: "Full breakdown: How can you optimize an API?" },
          },
        ],
      },
      {
        heading: "Logging",
        points: [
          {
            title: "Structured, leveled, and never containing secrets",
            detail:
              "Structured (JSON) logs are machine-parseable — filterable/queryable in a log aggregator, unlike free-text. Use levels (info/warn/error) so noise can be filtered without losing detail. Never log passwords, tokens, or full card numbers, even at debug level — a leaked log file shouldn't be a security incident.",
          },
        ],
      },
      {
        heading: "API Security",
        points: [
          {
            title: "Layered, not a single control",
            detail:
              "Security headers (helmet), a strict CORS allowlist, rate limiting, input validation, generic client-facing error messages, HTTPS, secrets out of source control, and CSRF protection on cookie-authenticated state-changing routes — each layer catches a different class of attack, none of them alone is sufficient.",
          },
        ],
      },
      {
        heading: "Exception Handling",
        points: [
          {
            title: "Distinguish expected (operational) errors from bugs",
            detail:
              "An 'operational' error (bad input, resource not found, unauthorized) is expected and safe to describe to the client. An unexpected error (a bug, a downstream crash) should log full details server-side but tell the client only a generic message — leaking a stack trace or raw database error to a client is an information-disclosure risk, not just an ugly response.",
            sourceRef: "express-production-api/src/utils/AppError.js + middleware/errorHandler.js",
          },
        ],
      },
    ],
    closingTip:
      "A quick way to demonstrate the AuthN/AuthZ distinction concretely: 'a valid JWT proves authentication; the role check on top of it is authorization — you need both, and they're separate middleware for a reason: reusability across routes with different role requirements.'",
  },
  {
    slug: "git-workflow-cicd",
    question: "Explain Git Workflow, Branching Strategy, Pull Requests, Code Reviews, and CI/CD basics.",
    category: "Process",
    round: "round-3",
    summary:
      "Process fundamentals — know the difference between trunk-based and GitFlow branching, and between continuous delivery and continuous deployment, since those are the two pairs interviewers most often probe.",
    intro:
      "These are process questions, but they still have real technical substance — particularly the branching-strategy tradeoff and the CI vs CD vs continuous-deployment distinction, both of which are easy to answer vaguely and worth being precise about.",
    sections: [
      {
        heading: "Git Workflow",
        points: [
          {
            title: "Small, focused commits with messages that explain why",
            detail:
              "A commit message should explain the reasoning/motivation, not just restate the diff (the diff already shows what changed). Work in feature branches off the main integration branch, rebase/merge frequently to avoid painful, large, stale-branch conflicts later.",
          },
        ],
      },
      {
        heading: "Branching Strategy",
        points: [
          {
            title: "Trunk-based vs GitFlow — a real tradeoff, not just two names",
            detail:
              "Trunk-based: short-lived feature branches, frequent merges straight to main, incomplete work hidden behind feature flags rather than a long-lived branch — favored by teams doing continuous deployment, since it keeps main always releasable. GitFlow: separate main/develop/feature/release/hotfix branches with more ceremony — fits a slower, scheduled release cadence better than a continuously-deployed product. Most modern, fast-shipping teams lean trunk-based.",
          },
        ],
      },
      {
        heading: "Pull Requests",
        points: [
          {
            title: "Small and focused, with the WHY in the description",
            detail:
              "Self-review the diff before requesting review (catches obvious mistakes before wasting a reviewer's time). A large, mixed-concern PR is harder to review carefully and more likely to hide a real bug in the noise — split unrelated changes into separate PRs.",
          },
        ],
      },
      {
        heading: "Code Reviews",
        points: [
          {
            title: "Correctness, security, and maintainability — not just style",
            detail:
              "A linter/formatter should already enforce style automatically, freeing human reviewers to focus on things a machine can't check: is this actually correct, are there missed edge cases, is there a security concern, will this be maintainable in six months. As a reviewer, explain WHY on a requested change, and distinguish a blocking 'must fix' from an optional 'nit'/suggestion so the author isn't left guessing what's actually required.",
          },
        ],
      },
      {
        heading: "CI/CD basics",
        points: [
          {
            title: "Three related but distinct things",
            detail:
              "Continuous Integration: automatically build/lint/test on every push or PR, catching problems before merge. Continuous Delivery: every change that passes CI is automatically packaged into a deploy-ready state, but a human still triggers the actual production deploy. Continuous Deployment: goes one step further — a change that passes CI deploys to production automatically, with no manual gate at all.",
          },
          {
            title: "Honest callout on this repo specifically",
            detail:
              "express-production-api doesn't have a CI pipeline configured yet — its own README explicitly lists 'add automated tests and a CI pipeline' as a next step toward production-readiness. Worth being able to say precisely what's present (a real, working app) vs what's still a gap (automated testing, CI/CD) rather than overclaiming.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to pick one branching strategy and defend it: tie the choice to release cadence, not personal preference — 'we deploy multiple times a day, so trunk-based with feature flags' is a much stronger answer than a strategy stated without the reasoning behind it.",
  },
];
