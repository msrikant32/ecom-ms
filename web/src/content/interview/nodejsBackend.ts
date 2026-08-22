import type { InterviewQuestion } from "./types";

// Node.js/backend engineering deep-dives, sourced from a consolidated reference doc
// the user compiled (fundamentals, architecture, performance, scaling). Kept in its
// own file since it's a distinct source from the 3-round transcript and the other
// general-questions additions.
export const nodejsBackendQuestions: InterviewQuestion[] = [
  {
    slug: "nodejs-advantages",
    question: "What are the advantages of Node.js, and where is it actually the wrong tool?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Non-blocking I/O and one language across the stack are the headline answers, but naming Node's actual weak spot — CPU-bound work on a single JS thread — is what separates a real answer from a marketing pitch.",
    intro:
      "This reads like a softball, but the strongest answers spend at least a third of the time on the honest limitation, not just the strengths.",
    sections: [
      {
        heading: "Where it wins",
        points: [
          {
            title: "Non-blocking, event-driven I/O",
            detail:
              "Handles many concurrent connections on a single thread without paying the memory/context-switch cost of a thread-per-request model — V8 compiles JS to fast machine code underneath, and the runtime is built specifically for I/O-heavy workloads: APIs, streaming, chat, anything spending most of its time waiting on the network or disk rather than computing.",
          },
          {
            title: "One language, one team",
            detail:
              "JavaScript/TypeScript across frontend and backend means shared validation logic, shared types, and engineers who can move between layers without a context switch — plus npm, the largest package registry, covering nearly any integration need.",
          },
          {
            title: "Fast to prototype, good fit for microservices",
            detail:
              "Lightweight frameworks (Express, Fastify, NestJS), fast process startup, and native JSON handling make Node a common default for small, focused services as well as real-time features (WebSockets, live dashboards, collaborative tools).",
          },
        ],
      },
      {
        heading: "Where it's genuinely weaker",
        points: [
          {
            title: "CPU-bound work bottlenecks the single JS thread",
            detail:
              "Heavy computation, image/video processing, or large synchronous parsing blocks the event loop for every concurrent request, not just the one doing the work — Node isn't naturally parallel for CPU work the way a multi-threaded runtime is. Mitigated with worker threads or clustering, but it's a real architectural constraint, not a footnote.",
            relatedLink: { href: "/topics/worker-threads", label: "Visualize exactly this: CPU work moved off the main thread" },
          },
        ],
      },
    ],
    closingTip:
      "Naming the CPU-bound weakness unprompted, with the worker-threads mitigation attached, is a stronger signal than a longer list of strengths.",
  },
  {
    slug: "nodejs-event-loop-phases",
    question: "Walk through the Node.js event loop's phases, in order.",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Node's libuv event loop runs through named phases each cycle — timers, pending callbacks, poll, check, close callbacks — with microtasks draining between every one of them, not just between cycles.",
    intro:
      "This is the Node-specific, libuv-phase version of the event loop question — distinct from (and a level deeper than) the general 'what is the event loop' framing, since it names the actual phase ordering Node implements.",
    sections: [
      {
        heading: "The five phases, per cycle",
        points: [
          {
            title: "Timers → Pending callbacks → Poll → Check → Close callbacks",
            detail:
              "Timers runs due setTimeout/setInterval callbacks. Pending callbacks runs certain deferred I/O callbacks. Poll retrieves new I/O events and runs their callbacks — most application work happens here. Check runs setImmediate() callbacks. Close callbacks runs things like socket.on('close'). The loop repeats these phases for as long as there's work to do.",
            code: `console.log('1: Start');\nsetTimeout(() => console.log('2: Timeout callback'), 0);\nPromise.resolve().then(() => console.log('3: Promise callback'));\nconsole.log('4: End');\n\n// Output: 1, 4, 3, 2`,
            codeLanguage: "javascript",
            relatedLink: { href: "/topics/event-loop", label: "Step through this exact ordering visually" },
          },
          {
            title: "Microtasks drain between every phase, not just between cycles",
            detail:
              "Promise callbacks and process.nextTick() aren't a phase of the loop at all — they run in a queue that's fully drained after the current operation finishes and before the loop moves to the next phase, which is why a Promise resolves before a setTimeout(fn, 0) even though both were scheduled 'immediately'.",
            relatedLink: { href: "/topics/promises", label: "See the microtask queue draining, step by step" },
          },
        ],
      },
    ],
    closingTip:
      "Naming that microtasks drain between phases (not just once per full cycle) is the detail that shows you know libuv specifically, not just 'the event loop' as a generic concept.",
  },
  {
    slug: "microtasks-vs-macrotasks",
    question: "Microtasks vs macrotasks — what's the actual priority order in Node?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "process.nextTick() beats the Promise microtask queue, which beats the next event loop phase (timers, I/O, etc.) — and a recursive microtask can starve the loop entirely, which a macrotask never can.",
    intro:
      "A quick comparison question — the strongest answer states the priority order first, then explains why the starvation risk is asymmetric between the two queues.",
    sections: [
      {
        heading: "The comparison",
        points: [
          {
            title: "Macrotasks vs microtasks",
            detail:
              "Macrotasks (setTimeout, I/O callbacks, setImmediate) run one per event loop cycle. Microtasks (Promise callbacks, queueMicrotask, async/await continuations) are ALL drained before the loop proceeds to the next phase — every microtask queued while draining the queue also runs before the loop moves on.",
          },
          {
            title: "Node's specific priority order",
            detail: "process.nextTick() queue → Promise microtask queue → next event loop phase (timers, I/O, etc.)",
            code: `setTimeout(() => console.log('timeout'), 0);\nPromise.resolve().then(() => console.log('promise'));\nprocess.nextTick(() => console.log('nextTick'));\n\n// Output: nextTick -> promise -> timeout`,
            codeLanguage: "javascript",
          },
          {
            title: "The starvation risk is one-directional",
            detail:
              "A microtask that recursively schedules another microtask can starve the event loop forever — timers and I/O never get a turn, since the loop won't advance to the next phase until the microtask queue is fully empty. A macrotask can't do this to the microtask queue; it just runs once per cycle like everything else at its level.",
          },
        ],
      },
    ],
    closingTip:
      "The starvation asymmetry is the detail worth leading with if pressed further — it's the practical reason to be careful with recursive Promise chains in hot paths.",
  },
  {
    slug: "monolith-vs-microservices",
    question: "Monolithic vs microservice architecture — how do you actually decide?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Start monolithic, split when you actually feel the pain — and a modular monolith (one deployable, clean internal module boundaries) is usually the practical middle ground, which is exactly how this repo's own backend is organized.",
    intro:
      "The decision framework matters more than the pros/cons list here — interviewers are checking whether you'd default to microservices for a new project regardless of team size, which is a common junior mistake.",
    sections: [
      {
        heading: "Monolith",
        points: [
          {
            title: "Benefits",
            detail:
              "Simplicity, one deployment, one stack trace to debug, in-process function calls instead of network hops, lower operational overhead — cost-effective at small-to-medium scale.",
          },
          {
            title: "Drawbacks",
            detail:
              "Hard to scale one part independently of the rest, harder to maintain as it grows, a bug in one module can take down the whole app, and deploys slow down as the codebase grows.",
          },
        ],
      },
      {
        heading: "Microservices",
        points: [
          {
            title: "Benefits",
            detail:
              "Independent scaling and deployment per service, technology flexibility per service, fault isolation, and team autonomy — different squads can own and release different services without coordinating a shared deploy.",
          },
          {
            title: "Drawbacks",
            detail:
              "Real operational complexity — service discovery, orchestration, API gateways — plus network latency/reliability between services, eventual-consistency data challenges with no single DB, and debugging that now needs distributed tracing instead of one stack trace.",
          },
        ],
      },
      {
        heading: "Decision framework",
        points: [
          {
            title: "Team size, project stage, scaling needs, DevOps maturity",
            detail:
              "Small teams (1-10) and early-stage/MVP projects lean monolith. Large, multi-squad teams with proven, uneven scaling needs and mature CI/CD/orchestration already in place can justify microservices. The rule of thumb: start monolithic, split into microservices only when you actually feel the pain — not preemptively.",
            sourceRef: "express-production-api/src (one deployable, modules organized by domain — a modular monolith)",
          },
        ],
      },
    ],
    closingTip:
      "'Start monolithic, split when you feel the pain, and a modular monolith is usually the real answer for a mid-size team' reads as pragmatic experience, not textbook recitation.",
  },
  {
    slug: "preventing-event-loop-blocking",
    question: "What blocks the event loop in production, and how do you prevent it?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Sync/CPU-heavy calls (fs.readFileSync, huge loops, sync crypto, catastrophic regex backtracking) block every concurrent request, not just the one that triggered them — this app's sync upload demo makes that visible with a live ping strip.",
    intro:
      "This app has a working demonstration of exactly this problem — the sync upload panel blocks the server with fs.writeFileSync() while a ping strip shows every other request stalling at the same moment.",
    sections: [
      {
        heading: "What actually blocks it",
        points: [
          {
            title: "Sync I/O and CPU-heavy synchronous work",
            detail:
              "fs.readFileSync/writeFileSync, large synchronous loops, JSON.parse on huge payloads, catastrophic regex backtracking, and sync crypto (bcrypt's sync variants) or sync compression all hold the single JS thread hostage — no other request, timer, or I/O callback runs until the call returns.",
            relatedLink: { href: "/upload", label: "See it live: the sync upload panel blocks the server, visible on the ping strip" },
          },
        ],
      },
      {
        heading: "Prevention strategies",
        points: [
          {
            title: "Async APIs, worker threads, chunking, streams, horizontal scaling",
            detail:
              "Use async APIs (fs.promises, async crypto) instead of sync versions; move genuinely CPU-bound work to worker threads; chunk large loops and yield with setImmediate(); use streams instead of buffering large data in memory; and run multiple processes (cluster module / horizontal scaling) so one blocked process can't take the whole app down.",
            code: `function processLargeArray(arr, callback) {\n  let i = 0;\n  function chunk() {\n    const end = Math.min(i + 1000, arr.length);\n    for (; i < end; i++) { /* process arr[i] */ }\n    if (i < arr.length) setImmediate(chunk);\n    else callback();\n  }\n  chunk();\n}`,
            codeLanguage: "javascript",
            relatedLink: { href: "/topics/cluster", label: "See multi-process isolation visualized" },
          },
        ],
      },
      {
        heading: "Monitoring",
        points: [
          {
            title: "monitorEventLoopDelay + APM",
            detail:
              "Node's built-in perf_hooks.monitorEventLoopDelay() tracks actual loop lag in production; toobusy-js, Clinic.js, PM2 monitoring, or an APM (Datadog/New Relic) round out the picture for alerting before users notice.",
            code: `const { monitorEventLoopDelay } = require('perf_hooks');\nconst histogram = monitorEventLoopDelay({ resolution: 20 });\nhistogram.enable();\nsetInterval(() => {\n  console.log('Event loop delay (mean):', histogram.mean / 1e6, 'ms');\n  histogram.reset();\n}, 5000);`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip:
      "If you've run this repo's upload demo, say so — 'I can point to a blockedForMs number and a visibly stalled ping strip' beats reciting the same list of causes everyone gives.",
  },
  {
    slug: "express-middleware-auth-validation-authorization",
    question: "Explain Express middleware for authentication, validation, and authorization, and the order they run in.",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Three distinct concerns, three distinct middleware — and the order (authenticate → validate → authorize → business logic) is load-bearing, not stylistic.",
    intro:
      "Middleware has access to req, res, and next, and can modify the request, end the cycle early, or pass control forward — the three middleware here each answer a different question about the same request.",
    sections: [
      {
        heading: "Authentication — who are you?",
        points: [
          {
            title: "Verify the token, attach the user",
            detail: "Reads the bearer token, verifies it, and attaches the decoded identity to req.user for everything downstream.",
            code: `function authenticate(req, res, next) {\n  const token = req.headers['authorization']?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'No token provided' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    return res.status(401).json({ error: 'Invalid or expired token' });\n  }\n}`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/middleware/auth.js",
          },
        ],
      },
      {
        heading: "Validation — is the input well-formed?",
        points: [
          {
            title: "Schema-check the request shape before touching business logic",
            detail: "Rejects malformed input early with a 400, so downstream code can assume the shape is already correct.",
            code: `const validateSignup = [\n  body('email').isEmail(),\n  body('password').isLength({ min: 8 }),\n  (req, res, next) => {\n    const errors = validationResult(req);\n    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });\n    next();\n  }\n];`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Authorization — are you allowed to do THIS?",
        points: [
          {
            title: "A role/ownership check, separate from identity",
            detail:
              "Authorization always runs after authentication, since it needs req.user to already exist — a request can be authenticated and still be unauthorized for a specific action.",
            code: `function authorize(...allowedRoles) {\n  return (req, res, next) => {\n    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });\n    if (!allowedRoles.includes(req.user.role)) {\n      return res.status(403).json({ error: 'Forbidden' });\n    }\n    next();\n  };\n}`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/middleware/authorize.js",
            relatedLink: {
              href: "/interview/authn-authz-security-fundamentals",
              label: "Full AuthN vs AuthZ breakdown",
            },
          },
        ],
      },
    ],
    closingTip:
      "State the order as a chain — authenticate → validate → authorize → business logic — and explain why each step depends on the previous one having already run; that's the part that shows real understanding, not just knowing the three names.",
  },
  {
    slug: "nodejs-logging",
    question: "How do you approach logging in a production Node.js service?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Structured JSON logs, leveled, with a correlation ID per request, shipped to a centralized aggregator — and a hard rule about what never gets logged at all.",
    intro:
      "Logging questions are really asking whether you've operated a service in production, not whether you know console.log exists.",
    sections: [
      {
        heading: "Levels and libraries",
        points: [
          {
            title: "error > warn > info > http > debug > trace",
            detail:
              "Winston is flexible with multiple transports (console, file, cloud); Pino is the fastest, lowest-overhead choice for high-throughput services; Morgan handles HTTP request logging middleware specifically.",
            code: `const logger = winston.createLogger({\n  level: 'info',\n  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),\n  transports: [\n    new winston.transports.Console(),\n    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })\n  ]\n});`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Structured logging and correlation IDs",
        points: [
          {
            title: "JSON, not free-text — and one ID per request, threaded through every log line",
            detail:
              "Structured (JSON) logs are machine-parseable and filterable/queryable in a log aggregator, unlike free-text. A correlation/request ID attached at the edge and threaded through every downstream log line is what lets you reconstruct one request's full path across services later.",
            code: `app.use((req, res, next) => {\n  req.requestId = req.headers['x-request-id'] || uuidv4();\n  next();\n});`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "What never gets logged",
        points: [
          {
            title: "Passwords, tokens, API keys, card numbers, SSNs, raw request bodies",
            detail:
              "Never log these — even at debug level — since a leaked log file shouldn't turn into a security incident. Sanitize request bodies before logging them if you log them at all.",
          },
        ],
      },
    ],
    closingTip:
      "The production pipeline in one line: Morgan (HTTP logging) → Winston/Pino (structured JSON) → correlation IDs → centralized aggregator (ELK/Datadog/CloudWatch) → alerting on error logs.",
  },
  {
    slug: "root-causing-api-spike",
    question: "How would you root-cause a sudden API spike — traffic, latency, or errors?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Narrow from 'what changed' (time correlation) to 'where is time spent' (tracing) to 'why' (resource/query/dependency investigation) — a recent deploy is the single most common real cause.",
    intro:
      "This is an investigation-methodology question — the ranked list of causes matters less than demonstrating you'd narrow down systematically instead of guessing.",
    sections: [
      {
        heading: "Investigation steps, in order",
        points: [
          {
            title: "Correlate timing, then trace, then drill into resources",
            detail:
              "Pin down exactly when it started and cross-reference deploy history. Check recent changes (deploys, config/feature flags, DB migrations, third-party changes). Look at the traffic pattern (one IP/user vs distributed, bot vs organic). Drill into APM distributed traces to see where time is actually spent in the request waterfall. Then check the database (slow queries, connection pool exhaustion, locks, missing indexes), downstream dependencies (third-party APIs, internal services, queues), resource exhaustion (CPU, memory, event loop lag, connection pools), and cache health (stampede, dropped hit rate after an invalidation).",
          },
        ],
      },
      {
        heading: "Common root causes, ranked by frequency",
        points: [
          {
            title: "Deploys and database issues dominate",
            detail:
              "Roughly in order: recent deployment, database issues (index/pool/locks), downstream/third-party slowness, cache stampede, legitimate traffic spike, bot/DDoS traffic, memory leak or GC pauses, cron job overlapping peak traffic, and infra failure.",
            relatedLink: {
              href: "/interview/caching-strategies-system-design",
              label: "Cache stampede specifically, covered in depth",
            },
          },
        ],
      },
    ],
    closingTip:
      "The mental model to state explicitly: narrow from 'what changed' (time correlation) to 'where is time spent' (tracing) to 'why' (resource/query/dependency level) — that structure is the actual answer, the ranked cause list is supporting detail.",
  },
  {
    slug: "sync-vs-async-io",
    question: "How do you manage sync vs async I/O, and coordinate multiple async operations correctly?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Always async I/O in the request path; sequential await only when operations truly depend on each other, Promise.all when they don't — and async/await never makes CPU-bound work non-blocking, only I/O waiting.",
    intro:
      "The gotcha at the end — that async/await doesn't help CPU-bound code — is the part worth leading with if the interviewer pushes further.",
    sections: [
      {
        heading: "Sync I/O has almost no place in a request path",
        points: [
          {
            title: "Sync I/O blocks ALL concurrent requests, not just the current one",
            detail:
              "Reserve sync calls for startup-time config loading or one-off CLI scripts — never inside a route handler, since it blocks the single JS thread for every connected client, not just the one that triggered it.",
          },
        ],
      },
      {
        heading: "Coordinating multiple async operations",
        points: [
          {
            title: "Sequential vs parallel vs partial-failure-tolerant vs timeout vs concurrency-limited",
            detail:
              "Sequential await is correct only when one call genuinely depends on the previous result. Promise.all runs independent calls in parallel and is faster whenever there's no dependency. Promise.allSettled tolerates individual failures instead of the whole batch rejecting on the first error. A Promise.race against a timer implements a timeout. A concurrency limiter (p-limit) caps how many run at once, respecting downstream capacity like a connection pool.",
            code: `// parallel — independent operations\nconst [user, orders, notifications] = await Promise.all([\n  getUser(id), getOrders(id), getNotifications(id)\n]);\n\n// timeout pattern\nconst withTimeout = (p, ms) => Promise.race([\n  p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))\n]);\n\n// concurrency limiting\nconst limit = require('p-limit')(5);\nawait Promise.all(items.map(i => limit(() => process(i))));`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "The gotcha",
        points: [
          {
            title: "async/await only helps I/O waiting, never CPU-bound work",
            detail:
              "Awaiting a Promise frees the event loop while genuinely waiting on I/O — but a CPU-bound synchronous computation inside an async function still blocks the thread for its entire duration; async/await doesn't parallelize it or move it off-thread. Only a worker thread does that.",
            relatedLink: { href: "/topics/worker-threads", label: "The actual fix for CPU-bound work" },
          },
        ],
      },
    ],
    closingTip:
      "Stating the async/await-doesn't-help-CPU-work gotcha unprompted is the single strongest signal in this question — it's the mistake that trips up people who've only ever memorized the syntax.",
  },
  {
    slug: "worker-threads-production-patterns",
    question: "When do you reach for worker threads, and how do you use them in production (not just a toy example)?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Worker threads exist for CPU-bound work only — I/O-bound tasks are already handled efficiently by the event loop without them — and production code uses a pool (Piscina), never a worker spawned per request.",
    intro:
      "The comparison against child processes and cluster is worth stating explicitly, since all three sound like 'more parallelism' but solve different problems.",
    sections: [
      {
        heading: "What they're for — and not for",
        points: [
          {
            title: "Genuinely CPU-bound JS execution",
            detail:
              "Image/video processing, large JSON parsing, crypto/hashing, compression, complex calculations — anything that would otherwise hold the main thread hostage. NOT for I/O-bound tasks, which the event loop already handles efficiently without dedicating a whole thread to waiting.",
            code: `// main.js\nconst { Worker } = require('worker_threads');\nfunction runWorker(data) {\n  return new Promise((resolve, reject) => {\n    const worker = new Worker('./worker.js', { workerData: data });\n    worker.on('message', resolve);\n    worker.on('error', reject);\n  });\n}\n\n// worker.js\nconst { workerData, parentPort } = require('worker_threads');\nconst result = heavyComputation(workerData);\nparentPort.postMessage(result);`,
            codeLanguage: "javascript",
            relatedLink: { href: "/topics/worker-threads", label: "Interactive worker-thread visualization" },
          },
        ],
      },
      {
        heading: "The production pattern: a worker pool, not one-off spawns",
        points: [
          {
            title: "Piscina or similar — reuse workers instead of paying thread-creation cost per request",
            detail:
              "Spawning a new worker thread per request pays real thread-creation overhead on every single request; a pool of pre-created workers amortizes that cost across many jobs, the same idea as a DB connection pool.",
          },
        ],
      },
      {
        heading: "Worker threads vs child processes vs cluster",
        points: [
          {
            title: "Different purposes, different memory models",
            detail:
              "Worker threads: CPU-bound tasks, share process memory space (optionally via SharedArrayBuffer), lower overhead. Child processes: isolate or run a separate program entirely, fully separate memory, higher overhead. Cluster: scale one Node app across multiple CPU cores by forking full processes, fully separate memory.",
            relatedLink: { href: "/topics/cluster", label: "Cluster's process-per-core model, visualized" },
          },
        ],
      },
    ],
    closingTip:
      "Naming Piscina (or 'a worker pool, not a worker per request') is the detail that shows you've actually run this in production, not just read the worker_threads docs page once.",
  },
  {
    slug: "large-file-upload-strategy",
    question: "How do you handle large file uploads — what changes as file size grows?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Stream everything, never buffer a whole file in memory — the specific technique escalates with size: Multer to disk, then streaming multipart to S3, then client-side chunking with a resumable protocol.",
    intro:
      "This app has a real, working implementation of exactly this escalation — both the streamed/chunked version and, deliberately, a blocking whole-file version to show what NOT doing this costs.",
    sections: [
      {
        heading: "The core principle",
        points: [
          {
            title: "Stream everything — never hold the whole file in process memory",
            detail:
              "Buffering an entire upload before writing it (or before forwarding it to storage) means memory usage scales with concurrent upload size, and — if done synchronously — blocks the event loop for the whole write.",
            relatedLink: { href: "/upload", label: "See both approaches side by side, with blockedForMs measured live" },
          },
        ],
      },
      {
        heading: "The escalation by size",
        points: [
          {
            title: "< 10MB: Multer to disk",
            detail: "Straightforward multipart form handling, streamed to a local disk destination.",
            code: `const storage = multer.diskStorage({\n  destination: (req, file, cb) => cb(null, 'uploads/'),\n  filename: (req, file, cb) => cb(null, \`\${Date.now()}-\${file.originalname}\`)\n});\nconst upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });`,
            codeLanguage: "javascript",
          },
          {
            title: "10-100MB: stream directly to cloud storage (S3 multipart)",
            detail: "Skip local disk entirely — stream the incoming request body straight into an S3 multipart upload.",
            code: `const upload = new Upload({\n  client: s3Client,\n  params: { Bucket: 'my-bucket', Key: key, Body: fileStream, ContentType: mimeType },\n  partSize: 5 * 1024 * 1024,\n  queueSize: 4\n});`,
            codeLanguage: "javascript",
          },
          {
            title: "100MB+ or unreliable networks: client-side chunking, resumable",
            detail:
              "Break the file into chunks client-side, upload each independently, reassemble server-side — exactly this repo's async upload implementation. For production, prefer an established protocol (the tus protocol, or S3's natively resumable multipart upload API) over a bespoke one.",
            sourceRef: "express-production-api/src/services/uploadService.js",
          },
        ],
      },
      {
        heading: "Validation, security, and the reverse proxy",
        points: [
          {
            title: "Don't trust the client's declared mimetype, and configure the proxy layer too",
            detail:
              "Verify actual file content via magic bytes (the file-type package), not the client-supplied mimetype; sanitize filenames to prevent path traversal; set size limits at every layer — reverse proxy, app, storage — not just one. A misconfigured reverse proxy (client_max_body_size, proxy_request_buffering off, a generous proxy_read_timeout) silently defeats an otherwise-correct streaming implementation.",
          },
        ],
      },
    ],
    closingTip:
      "The decision table version: <10MB → Multer disk, 10-100MB → stream to S3 multipart, 100MB+ or flaky networks → client chunking + a resumable protocol. Naming that you've actually measured the blocking cost of NOT doing this (this repo's sync upload panel) is a strong concrete example to cite.",
  },
  {
    slug: "callback-hell-promises-async-await",
    question: "Walk through the evolution from callback hell to Promises to async/await.",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Each step fixed a specific structural problem with the previous one — nesting depth, then scattered error handling, then still-awkward control flow — and async/await is just Promises with different syntax, not a different mechanism.",
    intro:
      "The mechanism point at the end — async/await is built directly on Promises — is worth stating explicitly, since it's a common point of confusion.",
    sections: [
      {
        heading: "Callback hell",
        points: [
          {
            title: "The pyramid of doom",
            detail:
              "Nested callbacks are hard to read, repeat error handling at every level, are hard to compose, and invert control (you're handing your continuation to someone else's function).",
            code: `getUser(id, (err, user) => {\n  getOrders(user.id, (err, orders) => {\n    getOrderDetails(orders[0].id, (err, details) => { /* ...nested further... */ });\n  });\n});`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Promises",
        points: [
          {
            title: "Flat chains, one error handler, real composability",
            detail:
              "A flat .then() chain, a single .catch() instead of error handling at every level, and composability primitives (Promise.all, allSettled, race) that callbacks never had. A Promise also guarantees a single resolve/reject, unlike a callback that could technically be called twice or never.",
            code: `getUser(id)\n  .then(user => getOrders(user.id))\n  .then(orders => getOrderDetails(orders[0].id))\n  .catch(err => handleError(err)); // single error handler`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Async/await",
        points: [
          {
            title: "Syntax on top of Promises, not a new mechanism",
            detail:
              "Reads top-to-bottom like synchronous code, uses standard try/catch, and makes conditional logic natural — but an async function always returns a Promise, and await is just syntax for consuming one; nothing underneath actually changed.",
            code: `async function processOrder(userId) {\n  try {\n    const user = await getUser(userId);\n    const orders = await getOrders(user.id);\n    console.log(orders);\n  } catch (err) {\n    handleError(err);\n  }\n}`,
            codeLanguage: "javascript",
          },
          {
            title: "The recurring gotcha",
            detail:
              "Sequential await calls that don't actually depend on each other waste real wall-clock time — reach for Promise.all whenever the operations are independent.",
          },
        ],
      },
    ],
    closingTip:
      "Say explicitly that async/await is built on Promises, not a replacement mechanism — an async function always returns a Promise whether or not you ever use 'await' inside it.",
  },
  {
    slug: "when-to-still-use-callbacks",
    question: "When would you still use a plain callback instead of async/await, in modern Node?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Callbacks remain correct wherever the semantics are zero/one/many occurrences over time (events, streams) rather than a single future value — a Promise only ever resolves once.",
    intro:
      "This question checks whether you understand WHY async/await won, not just that it did — a Promise models exactly one eventual value, which is the wrong shape for a recurring event.",
    sections: [
      {
        heading: "Where callbacks are still correct, not legacy",
        points: [
          {
            title: "Events, streams, framework control flow, legacy APIs",
            detail:
              "An event that can fire 0, 1, or many times (EventEmitter) needs a callback/event-based model — a Promise resolves exactly once, which is the wrong shape. Streaming data over time is the same shape problem. Simple sync-like utilities (setTimeout, Array.forEach) just use a plain callback by convention. A legacy callback-only library gets wrapped with util.promisify() and then used with async/await from there on. Framework-required control flow (Express's own next()) uses a callback because that's the contract the framework defines.",
          },
        ],
      },
      {
        heading: "The default for everything else",
        points: [
          {
            title: "Application code defaults to async/await",
            detail:
              "Routes, services, and business logic — anything modeling a single eventual value — should default to async/await. Callbacks are the right tool specifically for event-driven and streaming APIs, not a pattern you're migrating away from entirely.",
          },
        ],
      },
    ],
    closingTip:
      "Framing it as 'Promises model one value, callbacks model zero-to-many events' is a cleaner answer than a memorized list of exceptions — the list falls out of that one distinction naturally.",
  },
  {
    slug: "api-versioning-migration",
    question: "How do you version an API, and run a full migration from v1 to v2?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "URI-path versioning is the common default; the harder part is the migration process itself — deprecation headers, per-client usage monitoring, and 410 Gone (not 404) once a version is actually sunset.",
    intro:
      "Naming the versioning scheme is the easy half of this question; describing the actual sunset process end-to-end is what separates real operational experience from a definitions list.",
    sections: [
      {
        heading: "Why version at all, and the three common schemes",
        points: [
          {
            title: "URI path, header-based, or query param",
            detail:
              "Versioning exists for backward compatibility with existing clients, to enable breaking changes safely, to support gradual migration, and to give a clear contract when multiple client types are in flight simultaneously. URI path (/v1/users) is most common for public APIs (Stripe, GitHub); header-based (API-Version: 2) suits internal/strict-REST APIs; query param (?version=1) is fine for quick internal tools.",
            sourceRef: "express-production-api/src/routes/v1/index.js",
          },
          {
            title: "Breaking vs non-breaking, concretely",
            detail:
              "Breaking: removing/renaming fields, changing types, changing required params, changing auth, changing the error format, removing endpoints. Non-breaking: adding optional fields, adding endpoints/params, and bug fixes that just correct behavior back to the documented spec.",
          },
        ],
      },
      {
        heading: "The full migration process",
        points: [
          {
            title: "Plan → build v2 alongside v1 → deprecate → monitor → sunset",
            detail:
              "Identify breaking changes and document the new contract with a timeline. Build v2 alongside an untouched v1, sharing business logic through format transformers rather than duplicating it. Publish version discovery and docs. Add deprecation headers to v1. Monitor v1 usage per client/API key so you know who's actually still on it. Proactively contact known consumers still on v1. Sunset gradually — warnings, then a brownout test, then a hard cutover — and only remove v1 code once usage is confirmed at zero.",
            code: `app.use('/api/v1', (req, res, next) => {\n  res.set('Deprecation', 'true');\n  res.set('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');\n  next();\n});\n\nfunction toV1Format(user) { return { id: user.id, name: \`\${user.firstName} \${user.lastName}\` }; }\nfunction toV2Format(user) { return { id: user.id, firstName: user.firstName, lastName: user.lastName }; }`,
            codeLanguage: "javascript",
          },
          {
            title: "410 Gone, not 404, once fully sunset",
            detail:
              "410 signals an intentional, permanent removal — a 404 leaves the caller wondering if they mistyped the path. That distinction alone is worth stating unprompted.",
          },
        ],
      },
    ],
    closingTip:
      "The 410-vs-404 distinction and 'monitor usage per API key before removing anything' are the two details that show you've actually run a deprecation, not just picked a versioning scheme once at project start.",
  },
  {
    slug: "backward-compatibility-immediate-migration",
    question: "How do you maintain backward compatibility when a migration has to ship in a single deploy?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Expand-contract: add the new shape alongside the old one, dual-write and backfill, and only remove the old shape once monitoring confirms nothing still depends on it — never a single destructive step.",
    intro:
      "This is the compressed-timeline version of migration — no months-long deprecation window, but the same underlying discipline: never break old clients in the same deploy that introduces the new shape.",
    sections: [
      {
        heading: "Expand-contract pattern",
        points: [
          {
            title: "Expand → migrate → contract",
            detail:
              "Expand: add new fields/columns while keeping the old ones, and have the API return both. Migrate: backfill existing data, dual-write to keep old and new in sync going forward. Contract: remove the old fields — only after usage monitoring actually confirms it's safe, which may be a separate, later deploy even in an 'immediate' migration.",
            code: `function serializeUser(user) {\n  return { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName };\n}`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Handling specific change shapes",
        points: [
          {
            title: "Rename, type change, structure change, newly-required field",
            detail:
              "A renamed field: alias both names in the response, accept both on input. A changed type: emit both representations (a numeric status plus a status_label string). A changed structure: emit both the flat and nested versions simultaneously. A field that's newly required: default it server-side instead of rejecting requests from clients that don't send it yet.",
          },
          {
            title: "Version detection without full versioning, and feature flags",
            detail:
              "A lightweight client-version header can select response shape without standing up a whole versioning scheme. Feature flags on top of that allow an instant rollback without a redeploy, and a gradual percentage-based rollout instead of an all-at-once cutover.",
            code: `const clientVersion = req.headers['x-app-version'];\nif (clientVersion && parseInt(clientVersion) < 3) return res.json(toLegacyFormat(user));\nreturn res.json(toNewFormat(user));`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "Zero-downtime DB migration",
        points: [
          {
            title: "Never rename or drop a column in one step",
            detail:
              "Always additive first: add the new column, dual-write to both, backfill historical rows, and only drop the old column in a later, separate deploy once nothing reads it anymore.",
          },
        ],
      },
    ],
    closingTip:
      "The one-sentence version: 'add before you remove, dual-write before you cut over, and never do a destructive schema change in the same step that introduces the new shape' — that covers nearly every specific case that gets asked as a follow-up.",
  },
  {
    slug: "backward-compatibility-zero-client-effort",
    question: "How do you design an API so existing clients never need to change their code at all?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Postel's Law — be conservative in what you send, liberal in what you accept — operationalized as: only ever add fields, never remove or rename, and default missing values instead of requiring them.",
    intro:
      "This is the strictest form of backward compatibility, appropriate specifically for clients you can't reach or coordinate with — mobile apps already installed in the wild, or third-party integrations you don't control.",
    sections: [
      {
        heading: "Core rules",
        points: [
          {
            title: "Only add, never remove or rename; never make optional fields required",
            detail:
              "Old clients naturally ignore fields they don't recognize, so purely additive changes are always safe. If a rename is genuinely needed, keep the old field alive indefinitely, derived from the new data, rather than ever removing it. Never promote an optional field to required — default missing values server-side instead. Normalize multiple input shapes transparently at the edge, accepting both old and new request formats rather than rejecting the old one. Never change the meaning of an existing status code or error format — add richer formats alongside the original, don't repurpose the old one.",
          },
          {
            title: "Design for unknown enum values, and expand-only schema changes",
            detail:
              "Advise (or require) that clients have a fallback branch for enum values they don't recognize yet, so adding a new enum value later doesn't silently break every existing client. On the database side, this rule extends to expand-only schema changes — never a single destructive migration step.",
          },
        ],
      },
      {
        heading: "The tradeoff",
        points: [
          {
            title: "Permanent legacy surface area, in exchange for zero client-side effort",
            detail:
              "This approach means carrying larger payloads and dual-write code indefinitely. A practical compromise: apply it strictly only for hard-to-reach clients (mobile apps already in the wild, third-party integrations), while allowing a normal deprecation cycle for clients you actually control.",
          },
        ],
      },
    ],
    closingTip:
      "Naming Postel's Law by name, and immediately following it with the tradeoff (permanent legacy surface area) rather than presenting this as a free lunch, is what makes the answer feel like real experience rather than a rule memorized from a blog post.",
  },
  {
    slug: "read-replicas-vertical-scaling-sharding",
    question: "Read replicas vs vertical scaling vs sharding — what's the actual escalation path?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Vertical scale first, then read replicas, then caching and query optimization — and sharding is the last resort most companies never actually need, since it's the one option that doesn't fix writes for free and adds real cross-shard complexity.",
    intro:
      "The realistic escalation order matters more than defining each term in isolation — a common mistake is jumping straight to 'we'd shard it' as if that's the default answer to any scaling question.",
    sections: [
      {
        heading: "Vertical scaling (scale up)",
        points: [
          {
            title: "More CPU/RAM/disk on one instance",
            detail:
              "Use when early-stage, CPU/memory-bound, and you want zero code changes. Limits: a hard ceiling on instance size, downtime during resize, and it does nothing for a write-throughput ceiling once you hit one.",
          },
        ],
      },
      {
        heading: "Read replicas (horizontal read scaling)",
        points: [
          {
            title: "Copies of the primary that serve reads only; writes still go to the primary",
            detail:
              "Use for read-heavy workloads, offloading reporting/analytics queries, or geographic read distribution. Limits: doesn't help write throughput at all, introduces replication lag (eventual consistency on reads from a replica), and doesn't solve a storage ceiling.",
            code: `const writePool = new Pool({ host: 'primary-db' });\nconst readPool = new Pool({ host: 'replica-db' });`,
            codeLanguage: "javascript",
            relatedLink: {
              href: "/interview/database-replication-and-partitioning",
              label: "Full breakdown of replication topologies and lag",
            },
          },
        ],
      },
      {
        heading: "Sharding (horizontal write + storage scaling)",
        points: [
          {
            title: "Splitting data across independent instances by a partition key",
            detail:
              "Use only once write throughput or data volume genuinely exceeds what a single machine can handle, and vertical scaling, replicas, caching, and query optimization are already exhausted. Limits: major operational complexity, hard cross-shard queries/joins, difficult rebalancing, and hard cross-shard transactions.",
          },
        ],
      },
      {
        heading: "The realistic escalation order",
        points: [
          {
            title: "Single instance → vertical scale → replicas → caching → query optimization → shard only if still needed",
            detail:
              "Most companies never actually need to shard — a well-tuned primary, read replicas, a caching layer, and correct indexing handle the overwhelming majority of real-world scale. Caching and query/index optimization in particular are frequently the actual fix, ahead of any infrastructure change.",
          },
        ],
      },
    ],
    closingTip:
      "Ending with 'most companies never actually need to shard' — and naming caching/indexing as the more common real fix — reads as earned scar tissue, not a textbook answer.",
  },
  {
    slug: "manual-vs-automatic-failover",
    question: "Manual vs automatic failover — how do you choose, and how do you prevent split-brain?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Automatic failover needs quorum/consensus to be safe at all — without it, split-brain (two nodes both believing they're primary) is the real risk, not just slower recovery.",
    intro:
      "The split-brain prevention mechanisms are the part of this answer that separates real distributed-systems understanding from a simple pros/cons list.",
    sections: [
      {
        heading: "Manual failover",
        points: [
          {
            title: "A human detects failure and triggers the switch",
            detail:
              "Appropriate for ambiguous failure scenarios, high-stakes systems where a wrong automatic decision is expensive, low failure frequency, or when you lack mature consensus tooling. Drawback: slow, error-prone under pressure, doesn't scale, and depends on on-call availability at the exact moment of failure.",
          },
        ],
      },
      {
        heading: "Automatic failover",
        points: [
          {
            title: "The system detects and promotes a standby without a human in the loop",
            detail:
              "Appropriate for a high-availability SLA (99.9%+), high failure frequency at scale, well-understood failure modes, and proper quorum/consensus infrastructure already in place. Drawbacks: false positives (flapping between primary and standby), split-brain risk, and real implementation complexity.",
          },
        ],
      },
      {
        heading: "Preventing split-brain",
        points: [
          {
            title: "Quorum, fencing, and leases",
            detail:
              "Quorum/consensus (Raft, Paxos, etcd, ZooKeeper) requires a majority vote before promoting a new primary. Fencing (STONITH — 'shoot the other node in the head') actively cuts off the old primary before a new one is promoted, so it can't keep accepting writes. Leases use a centralized coordination service that grants a renewable 'I am primary' lease, so a network-partitioned old primary's lease simply expires instead of it continuing to believe it's still in charge.",
          },
        ],
      },
      {
        heading: "A practical, hybrid default",
        points: [
          {
            title: "Automatic for well-understood failures with proper quorum, manual for ambiguous ones",
            detail:
              "Most production systems combine both: automatic failover for well-understood failure modes (with real quorum behind it), manual escalation for ambiguous situations — and a human gets alerted regardless of which path fired.",
          },
        ],
      },
    ],
    closingTip:
      "Naming split-brain and at least one concrete prevention mechanism (quorum, fencing, or leases) by name is the single strongest signal in this question.",
  },
  {
    slug: "offset-vs-cursor-pagination",
    question: "Offset vs cursor pagination — what actually breaks with offset at scale?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Offset pagination scans and discards every skipped row, getting slower as the offset grows, and can skip or duplicate items under concurrent writes — cursor pagination avoids both, at the cost of losing the ability to jump to an arbitrary page.",
    intro:
      "This repo's own product listing endpoint is cursor-paginated for exactly this reason — a live, running example beats reciting the tradeoff from memory.",
    sections: [
      {
        heading: "Offset pagination",
        points: [
          {
            title: "Simple, but degrades with depth and drifts under writes",
            detail:
              "OFFSET/LIMIT is simple and supports jumping directly to any page number, but gets slower as the offset grows since the DB still has to scan and discard every skipped row — and under concurrent writes, items can be skipped or duplicated across pages as rows shift position mid-pagination. Good for admin panels, small/static datasets, and page-number UIs.",
            code: `GET /orders?page=3&limit=20\nSELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 40;`,
            codeLanguage: "sql",
          },
        ],
      },
      {
        heading: "Cursor pagination",
        points: [
          {
            title: "Stays fast at any depth, stable under concurrent writes",
            detail:
              "An indexed WHERE comparison instead of a scan-and-discard OFFSET keeps performance flat regardless of how deep you page. It's also stable under concurrent writes, since each page is anchored to a real value rather than a shifting row count — at the cost of only supporting next/previous, not jumping to an arbitrary page number.",
            code: `GET /orders?cursor=eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTIwIn0\nSELECT * FROM orders WHERE created_at < '2026-07-20T10:00:00Z' ORDER BY created_at DESC LIMIT 20;`,
            codeLanguage: "sql",
            sourceRef: "express-production-api/src/utils/pagination.js (paginateCursor)",
          },
        ],
      },
    ],
    closingTip:
      "Default recommendation: cursor-based for anything user-facing at scale (infinite scroll, feeds, large or high-write-volume datasets), offset only for admin/page-number UIs over small or rarely-changing data.",
  },
  {
    slug: "batch-multi-insert-without-timeout",
    question: "How do you insert a large batch of records without hitting a request timeout?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "True bulk-insert syntax, chunked into reasonably sized batches with short transactions per chunk, moved to a background job once the dataset is large enough — not a loop of single inserts inside one HTTP request.",
    intro:
      "The single most common mistake this question is fishing for is a for-loop of individual INSERT statements inside one request — naming why that's wrong (round trips, one giant transaction, no timeout headroom) is most of the answer.",
    sections: [
      {
        heading: "Core techniques",
        points: [
          {
            title: "Real bulk insert syntax, chunked, with short transactions",
            detail:
              "Use true bulk-insert methods (bulkCreate, a multi-row INSERT via a query builder) instead of looping single inserts — one round trip instead of N. Chunk large batches (roughly 500-2000 rows per chunk is a reasonable default, tuned for column count vs parameter limits). Keep one transaction per chunk, not one giant transaction spanning the whole batch, so a failure partway through doesn't roll back everything already committed and doesn't hold locks for the full duration.",
            code: `await Order.bulkCreate(records); // Sequelize\n\nfor (let i = 0; i < records.length; i += chunkSize) {\n  await db('orders').insert(records.slice(i, i + chunkSize));\n}`,
            codeLanguage: "javascript",
          },
          {
            title: "Explicit timeouts, native bulk loaders, idempotent upserts",
            detail:
              "Set explicit timeouts at the DB (statement_timeout), query, and application level so a stuck batch fails fast instead of hanging the request. For very large datasets, use native bulk loaders (PostgreSQL COPY, MySQL LOAD DATA INFILE, MongoDB insertMany({ ordered: false })) instead of any application-level loop at all. Make inserts idempotent with an upsert (ON CONFLICT ... DO UPDATE) so a retry after a partial failure is safe rather than creating duplicates.",
          },
          {
            title: "Move large batches out of the request path entirely",
            detail:
              "Past a certain size, don't do the insert synchronously inside the HTTP handler at all — enqueue a background job and return 202 Accepted immediately, streaming large input files (CSV/JSON) and inserting in chunks as they're parsed rather than buffering the whole file in memory first.",
            code: `app.post('/bulk-import', async (req, res) => {\n  const jobId = await queue.add('bulk-insert', { records: req.body.records });\n  res.status(202).json({ jobId }); // 202 Accepted\n});`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip:
      "The decision table version: under 1,000 rows → a single bulk insert in-request is fine. 1,000-50,000 → chunked bulk insert with controlled concurrency. 50,000-1M+ or file-based imports → a background job plus a native bulk loader, streaming the input rather than buffering it.",
  },
  {
    slug: "api-optimization-sub-500ms",
    question: "You need an API endpoint to respond in under 500ms — walk through the levers, layer by layer.",
    category: "Node.js / Express",
    round: "general",
    summary:
      "The two highest-leverage fixes are almost always a missing index and no caching layer — stating a rough latency budget across the request path is what turns this into a target-driven answer instead of a generic checklist.",
    intro:
      "This is a more target-driven version of the general API optimization question — the strongest answer here explicitly reasons in a latency budget rather than just naming levers, since '<500ms' is a number, not a vibe.",
    sections: [
      {
        heading: "Database layer",
        points: [
          {
            title: "Indexes, N+1 avoidance, field selection, pooling, replicas",
            detail:
              "Add proper indexes and confirm them with EXPLAIN ANALYZE (a sequential scan on a hot path is usually the single biggest win available). Avoid N+1 queries with joins or eager loading. Select only the fields actually needed, not full documents. Use connection pooling, and read replicas for read-heavy endpoints specifically.",
            relatedLink: { href: "/interview/api-optimization", label: "Full layer-by-layer API optimization breakdown" },
          },
        ],
      },
      {
        heading: "Caching — the biggest lever",
        points: [
          {
            title: "Application cache, HTTP cache headers, and a CDN in front of cacheable GETs",
            detail:
              "A Redis (or in-memory) read-through cache in front of the DB call; Cache-Control/ETag headers so clients and intermediate caches can skip the round trip entirely; a CDN for anything cacheable at the edge. This is usually the single highest-leverage change available on a slow endpoint.",
            code: `async function getUser(id) {\n  const cached = await redis.get(\`user:\${id}\`);\n  if (cached) return JSON.parse(cached);\n  const user = await db.users.findById(id);\n  await redis.set(\`user:\${id}\`, JSON.stringify(user), 'EX', 300);\n  return user;\n}`,
            codeLanguage: "javascript",
            relatedLink: { href: "/interview/caching-strategies-system-design", label: "Caching layers, invalidation, and stampede protection in depth" },
          },
        ],
      },
      {
        heading: "Application code, network, and external dependencies",
        points: [
          {
            title: "Parallelize, never block, and put a leash on anything you don't control",
            detail:
              "Parallelize independent async calls with Promise.all; never block the event loop, offloading CPU work to a worker thread instead; reduce payload size with compression. On the network side: keep-alive connections, HTTP/2, geographic proximity of servers/DB/users, load balancing. For external dependencies: aggressive timeouts, circuit breakers, caching their responses, and fire-and-forget for anything non-critical to the response.",
          },
        ],
      },
      {
        heading: "Response shape and monitoring",
        points: [
          {
            title: "Bound the response, and track p95/p99 — not the average",
            detail:
              "Always paginate (never return unbounded data) and support sparse fieldsets (?fields=id,name). Track p95/p99 latency, not just the mean — tail latencies are what users actually feel, and an average can look fine while a meaningful fraction of real requests blow well past 500ms.",
          },
        ],
      },
      {
        heading: "A realistic latency budget",
        points: [
          {
            title: "The numbers roughly add up to well under 500ms when nothing is broken",
            detail:
              "Network in ~20-50ms, auth/middleware ~5-10ms, an indexed DB query ~10-50ms, a cache hit ~1-5ms, business logic ~5-20ms, network out ~20-50ms — roughly 60-185ms total. Stating a budget like this, then pointing at which line item is blown, is a much stronger diagnostic frame than a flat list of possible fixes.",
          },
        ],
      },
    ],
    closingTip:
      "Close with the budget, not the checklist: 'a healthy request comes in around 60-185ms — if we're over 500ms, the two most likely culprits are a missing index or no caching layer, and I'd check those before anything else.'",
  },
  {
    slug: "duplicate-order-request-idempotency",
    question:
      "A user double-clicks 'Place Order' (or their client retries after a dropped connection) — how do you detect and prevent the duplicate order?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "Disabling the submit button helps the honest case but isn't the answer — the real fix is a client-generated Idempotency-Key the server can recognize on replay, backed by a short-lived lock so two near-simultaneous copies of the same request can't both slip through before either has finished writing.",
    intro:
      "This is really three questions stacked on top of each other: how do you recognize two requests as 'the same attempt', how do you handle two of them arriving genuinely concurrently, and what do you return on the second one. This repo has a real, running implementation of all three.",
    sections: [
      {
        heading: "Why disabling the button isn't the answer",
        points: [
          {
            title: "It helps, but it's a client-side mitigation for a server-side correctness problem",
            detail:
              "Disabling the submit button on click, debouncing, or showing a loading state all reduce accidental double-clicks — worth doing for UX — but none of them stop a duplicate order from a client-side retry after a timeout, a flaky network causing the client to resend, a user with two tabs open, or a replayed request from a proxy. If the server can create two orders from two requests carrying the same logical intent, a sufficiently determined (or unlucky) client will eventually do it. The fix has to live on the server.",
          },
        ],
      },
      {
        heading: "The standard pattern: a client-generated Idempotency-Key",
        points: [
          {
            title: "One key per checkout attempt, sent as a header, checked before any work happens",
            detail:
              "The client generates a unique key (a UUID) once when the checkout attempt begins — not once per HTTP request, since a retry of the SAME attempt must reuse the SAME key — and sends it as an Idempotency-Key header. The server checks that key against previously-seen keys before doing any work: if it's new, process normally and remember the response against that key; if it's already been seen, don't redo the operation — replay the stored response instead. This is the exact pattern Stripe's API uses for payment requests.",
            code: `// client — generate the key ONCE per checkout attempt, not per request\nconst idempotencyKey = crypto.randomUUID(); // stored in component state, survives retries\n\nasync function placeOrder(cart) {\n  return fetch('/api/v1/orders', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },\n    body: JSON.stringify(cart),\n  });\n}\n// a retry after a dropped connection calls placeOrder() again with the SAME key`,
            codeLanguage: "javascript",
          },
          {
            title: "This repo's actual implementation",
            detail:
              "The middleware caches the response body + status against the key (with a 24h TTL) the first time it's seen, so a replay of the same key returns the exact original response — same order, same status code — with an Idempotent-Replay: true header, rather than erroring or silently doing nothing. If the same key shows up with a DIFFERENT request body, that's treated as a client bug (key reuse across two different logical operations) and rejected with a 409, not silently accepted.",
            code: `const existing = await cache.get(cacheKey);\nif (existing) {\n  if (existing.requestHash !== requestHash) {\n    return next(AppError.conflict('Idempotency-Key already used with a different request body'));\n  }\n  res.setHeader('Idempotent-Replay', 'true');\n  return res.status(existing.status).json(existing.body); // replay, don't redo\n}`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/middleware/idempotency.js — mounted on POST /orders",
          },
        ],
      },
      {
        heading: "The race condition a cache check alone doesn't close",
        points: [
          {
            title: "Two copies of the same key arriving genuinely concurrently",
            detail:
              "A simple 'check cache, if empty do the work, then write to cache' has a window: two requests with the same key can both check the cache, both find it empty (neither has written yet), and both proceed to create an order. The fix is a short-lived processing lock acquired atomically (Redis SETNX or Mongo's own atomic findOneAndUpdate) before any work starts — whichever request gets the lock proceeds; the other is rejected outright with a 409 rather than being allowed to race.",
            code: `const acquiredLock = await cache.setNX(lockKey, true, 30); // atomic — only one caller can win this\nif (!acquiredLock) {\n  return next(new AppError('A request with this Idempotency-Key is already being processed', 409, 'IDEMPOTENCY_IN_PROGRESS'));\n}\n// ...process the order...\n// on completion: cache the response against the key, THEN release the lock`,
            codeLanguage: "javascript",
            relatedLink: {
              href: "/interview/design-ecommerce-system",
              label: "This lock sits alongside the atomic stock-decrement and checkout transaction in the full e-commerce design",
            },
          },
        ],
      },
      {
        heading: "A database-level safety net, in addition — not instead",
        points: [
          {
            title: "A unique index on the idempotency key is the last line of defense",
            detail:
              "Even with a cache-based lock, a cache is not infinitely durable (a Redis failover, an eviction under memory pressure). A unique index on the stored idempotencyKey field on the Order collection means that even if two requests somehow both got past the lock, the second INSERT fails at the database with a duplicate-key error instead of silently creating a second order — catch that specific error and treat it the same as a cache hit: fetch and return the existing order instead of surfacing a 500.",
            code: `orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });\n\ntry {\n  const order = await Order.create({ ...orderData, idempotencyKey });\n} catch (err) {\n  if (err.code === 11000) { // Mongo duplicate key error\n    return await Order.findOne({ idempotencyKey }); // someone else's write won the race — return theirs\n  }\n  throw err;\n}`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip:
      "Structure the answer in that order — client-side UX mitigation (weak, first line only) → Idempotency-Key with response replay (the real fix) → the concurrent-request race and how a lock closes it → a DB unique constraint as the last-resort safety net. Naming that the lock and the unique index solve two DIFFERENT failure windows (in-flight concurrency vs cache durability) is the detail that shows you've actually reasoned about where this can still break, not just memorized 'use an idempotency key.'",
  },
  {
    slug: "url-slug-generation-and-dynamic-routing",
    question: "What is a URL slug, how do you generate one dynamically, and how does it become a working route?",
    category: "Node.js / Express",
    round: "general",
    summary:
      "A slug is a human-readable, URL-safe identifier derived from something like a title — generated by lowercasing, stripping unsafe characters, and hyphenating, with a real collision-handling strategy since two products can easily share a name. That's only half the story: something on the frontend then has to turn a URL segment back into the page that matches it, which is what a dynamic route actually does.",
    intro:
      "This question has two genuinely separate halves that are easy to blur together: generating a unique slug (a backend/data-modeling problem) and matching a URL to a page using that slug (a routing problem, usually frontend-framework-specific). This app has real, verified code for both.",
    sections: [
      {
        heading: "What a slug is, and why not just use the database ID",
        points: [
          {
            title: "Human-readable, SEO-relevant, and stable-ish — none of which a raw ObjectId gives you",
            detail:
              "/products/mechanical-keyboard is readable, hints at page content to both users and search engines, and is what you'd want to see in a shared link — /products/6a64e9087542e425d63e7e8c gives none of that. IDs remain the actual database key underneath; the slug is a second, human-facing identifier layered on top, not a replacement for it.",
          },
        ],
      },
      {
        heading: "Generating one — the algorithm",
        points: [
          {
            title: "Lowercase, strip unsafe characters, hyphenate, collapse and trim",
            detail:
              "Lowercase the source text (a title/name), remove anything that isn't alphanumeric/space/hyphen, replace runs of whitespace with single hyphens, and trim leading/trailing hyphens. A real i18n-aware version would also transliterate accented characters instead of dropping them — this app's version deliberately doesn't, to keep it simple.",
            code: `function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/[\\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
// "Mechanical Keyboard" -> "mechanical-keyboard"`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/utils/slugify.js",
          },
        ],
      },
      {
        heading: "The part people forget — collisions",
        points: [
          {
            title: "Two products can easily share a name; slugs still have to be unique",
            detail:
              "\"Standing Desk\" and a second, unrelated \"Standing Desk\" both slugify to the same base string — the generator has to check for an existing match and append something to disambiguate. An incrementing numeric suffix (standing-desk, standing-desk-2, standing-desk-3) keeps URLs predictable and readable, unlike a random suffix.",
            code: `async function generateUniqueSlug(name) {
  const base = slugify(name) || 'product';
  let candidate = base;
  let suffix = 1;
  while (await Product.exists({ slug: candidate })) {
    suffix += 1;
    candidate = \`\${base}-\${suffix}\`;
  }
  return candidate;
}
// verified live: 4 products named "Standing Desk" created back to back
// produced standing-desk, standing-desk-2, standing-desk-3, standing-desk-4`,
            codeLanguage: "javascript",
            sourceRef: "express-production-api/src/services/productService.js",
          },
          {
            title: "The check-then-insert race, and the same fix as everywhere else in this app",
            detail:
              "A check-then-insert has the same race window as any other 'check, then act' sequence: two concurrent creates could both check, both see no existing match, and both try to insert the same candidate slug. The real guarantee is a unique index on slug at the database level — the existence check is just an optimization to avoid hitting that error in the common case, and the create path catches the duplicate-key error (Mongo error code 11000) and retries with a fresh candidate rather than surfacing a raw 500 to the client.",
            relatedLink: {
              href: "/interview/duplicate-order-request-idempotency",
              label: "The identical check-then-act race pattern, in the order/checkout flow",
            },
          },
        ],
      },
      {
        heading: "Turning a slug back into a page — dynamic routing",
        points: [
          {
            title: "A URL segment matched to a route pattern, not a lookup table of fixed pages",
            detail:
              "A dynamic route defines a URL PATTERN with a placeholder segment (Express: /products/:slug; Next.js App Router: app/products/[slug]/page.tsx) — the framework matches an incoming URL against that pattern and hands the captured segment to your code as a parameter, rather than needing one hand-written route per possible product.",
            code: `// Express — the classic runtime version
router.get('/products/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});`,
            codeLanguage: "javascript",
          },
          {
            title: "This exact site's own [slug] routes — running, not hypothetical",
            detail:
              "Every interview question page on this site (/interview/js-fundamentals, /interview/aws-kms-encryption, this very page) is served by ONE file — app/interview/[slug]/page.tsx — using Next.js's file-system-based dynamic routing. generateStaticParams() enumerates every known slug at BUILD time so each one gets pre-rendered as real static HTML, rather than resolving the slug-to-content lookup on every request.",
            code: `// app/interview/[slug]/page.tsx — actually powering the page you're reading right now
export function generateStaticParams() {
  return interviewQuestions.map((q) => ({ slug: q.slug }));
}

export default async function InterviewQuestionPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const question = getInterviewQuestion(slug); // slug -> content lookup
  if (!question) notFound();
  // ...
}`,
            codeLanguage: "tsx",
            sourceRef: "web/src/app/interview/[slug]/page.tsx",
            relatedLink: {
              href: "/interview/topics/react",
              label: "File-system routing vs a runtime router like react-router, covered in the React Quick Reference deck",
            },
          },
        ],
      },
    ],
    closingTip:
      "Answer the two halves explicitly, in order: 'generating a unique slug is a backend data-modeling problem — slugify, then handle collisions with a real uniqueness guarantee, not just a naive check. Matching a URL to a page is a separate routing problem — a dynamic route captures the slug segment and looks up the matching content, either per-request (Express) or pre-rendered at build time from a known slug list (Next.js generateStaticParams).' Naming that this exact site's interview pages are a live, working example of the second half is a strong, concrete close.",
  },
];
