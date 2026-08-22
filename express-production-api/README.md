# Express Production API — Reference Implementation

A complete, runnable Node.js/Express API demonstrating production API-design
and security patterns:

- **Data**: MongoDB via Mongoose — users, products, and orders are real persisted documents, not an in-memory stand-in
- **Authentication**: JWT access + refresh tokens, bcrypt password hashing, httpOnly refresh cookie
- **Authorization**: role-based (`authorize('admin')`) and resource-ownership (`authorizeOwnerOrRoles`) middleware
- **Pagination**: both offset-based (`/products?page=&limit=`) and cursor-based (`/orders?cursor=&limit=`)
- **Caching**: pluggable Redis-or-in-memory cache service; GET response caching with pattern-based invalidation on writes
- **Idempotency**: `Idempotency-Key` header support on `POST /orders`, safe for client retries
- **Versioning**: URL-path versioning (`/api/v1`), structured so `/api/v2` can be added independently
- **Real-time**: secure WebSocket endpoint (`/ws`) — origin-validated (CSWSH protection), authenticated via short-lived one-time tickets, heartbeat-monitored, per-connection rate limited, and wired into the same event bus that drives async order processing, so clients get live push notifications
- **Security (OWASP-aligned)**: helmet, strict CORS allowlist (multi-origin, credentialed), CSRF protection on cookie-authenticated routes (double-submit cookie pattern), rate limiting (global + stricter on auth), input validation, generic error responses, request size limits, secrets via env vars
- **Event-driven async processing**: an in-process event bus (`order.created`, `user.registered`) with decoupled listeners simulating downstream services (notifications, inventory) — the pattern that maps directly onto a real message broker (SQS/RabbitMQ/Kafka) in a microservices deployment

## Project layout

```
src/
  config/         env config, logger
  utils/          cache, JWT, pagination, AppError
  events/         event bus + async listeners (decoupled "microservice" consumers)
  middleware/     auth, authorize, rate limiting, idempotency, response cache, validation, error handler, CSRF
  websocket/      secure WS server (ticket auth, origin check, heartbeat, rooms) + ticket issuance service
  models/         Mongoose schemas: User (password hashing), Product, Order
  data/           dev-only seed scripts (admin user, sample product catalog)
  services/       business logic (auth, product, order) — the only layer that talks to Mongoose models
  controllers/    thin HTTP layer, calls services
  routes/v1/      versioned route definitions
  app.js          Express app assembly
  server.js       HTTP(S) server + WebSocket attachment + graceful shutdown
```

Every data access goes through the `services/` layer — controllers and
routes never import a Mongoose model directly — so swapping the database
technology later, or splitting a service out into its own microservice,
only touches that layer. Caching similarly targets Redis when `REDIS_URL`
is set and transparently falls back to an in-memory cache otherwise.

## Running it

**Option A — everything containerized (app + MongoDB + Redis):**

```bash
docker compose up --build
```

The `app` service builds from the repo's own multi-stage `Dockerfile` (a real,
non-toy example of the layer-caching/native-module concerns covered in this
app's own Docker learning content) and waits for Mongo/Redis to report
healthy before starting. `NODE_ENV` is overridden to `development` in
`docker-compose.yml` specifically so the demo admin account and sample
products get seeded on first boot — the image itself defaults to
`NODE_ENV=production` (no seeding) if run standalone outside this compose
file. JWT/CSRF secrets fall back to clearly-labeled dev-only values; override
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `CSRF_SECRET` in your shell
env before running this anywhere but a local machine.

**Option B — app on the host, only the datastores containerized:**

```bash
npm install
cp .env.example .env

# MongoDB is the primary data store. Spin one up with Docker:
docker compose up -d mongo
# ...or point MONGODB_URI in .env at any MongoDB instance you already have
# (a local install, or MongoDB Atlas). Unlike the cache layer, there's no
# in-memory fallback here — the server won't start without a reachable DB.

# Redis is the intended cache/idempotency backend. Spin one up with Docker:
docker compose up -d redis
# ...or point REDIS_URL in .env at any Redis instance you already have.
# If Redis is unset/unreachable, the app still runs on an in-memory fallback
# (see the Caching section below for why that's dev-only, not production-safe).

npm run dev     # nodemon, or `npm start` for a plain run
```

On boot in non-production, a dev admin account is seeded:
`admin@example.com` / `AdminPass123!`.

## Caching

`src/utils/cache.js` exposes a small backend-agnostic interface
(`get`/`set`/`setNX`/`del`/`delPattern`) used for three things: GET response
caching (`cacheMiddleware.js`), idempotency locks/replays
(`idempotency.js`), and it's the natural place to plug in shared rate-limit
counters too. Redis is the default and intended backend — connect via
`REDIS_URL` — because those three all need state that's consistent *across
processes/instances*, not just within one:

- Two API instances behind a load balancer must see the same cached response, or clients get inconsistent data depending which instance they land on.
- Idempotency locks must be visible to every instance, or a retried request that lands on a different instance than the original can double-process.

The in-memory fallback exists purely so the project runs with zero infra for
local development — it activates automatically if `REDIS_URL` is unset or
the connection fails, and the app logs a warning if it detects this
happening in production, since per-process caching there would silently
reintroduce the exact bugs (double-charged retries, stale cross-instance
reads) this layer exists to prevent.

Verify it's actually talking to Redis:
```bash
redis-cli monitor    # watch commands flow in as you hit the API
redis-cli keys "*"   # http-cache:*, idempotency:*
```

## Try it out

```bash
# Register
curl -X POST localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"Password123"}'

# List products (paginated, cached — check the X-Cache response header)
# Grab a real productId from this response for the order below — a fresh
# install seeds 5 sample products, each with a real MongoDB ObjectId.
curl "localhost:3000/api/v1/products?page=1&limit=2"

# Create an order idempotently — retrying with the same key never double-creates
curl -X POST localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <accessToken>" \
  -H "Idempotency-Key: order-123" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<a real product id from above>","quantity":2}]}'

# Admin-only mutation (RBAC) — will 403 with a non-admin token
curl -X POST localhost:3000/api/v1/products \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Gadget","priceCents":1999,"stock":10}'
```

## CORS

Allowed origins are an explicit allowlist read from `CORS_ORIGIN` (comma-separated).
There's no wildcard fallback — combined with `credentials: true` (required so the
httpOnly refresh cookie can be sent), a wildcard origin isn't permitted by the CORS
spec anyway, and an allowlist is what stops an arbitrary site from making
authenticated cross-origin requests. Non-browser callers (curl, server-to-server)
have no `Origin` header and are unaffected.

## CSRF

Most of this API is Bearer-token authenticated, which is inherently safe from CSRF —
a cross-site page can't attach a custom `Authorization` header to a forged request.
The one exception is the refresh token, which lives in an httpOnly cookie so it can't
be read by injected JS (XSS) — but that also means the browser attaches it
automatically on *any* request to this origin, including ones triggered by another
site. That's exactly what CSRF exploits, so `POST /auth/refresh` and `POST /auth/logout`
are protected with the double-submit cookie pattern (`csrf-csrf`):

```bash
# 1. Fetch a token — this also sets a readable (non-httpOnly) csrf-token cookie
curl -c cookies.txt -b cookies.txt localhost:3000/api/v1/csrf-token

# 2. Echo it back in a header on the protected request
curl -b cookies.txt -X POST localhost:3000/api/v1/auth/refresh \
  -H "X-CSRF-Token: <csrfToken from step 1>"
```

A cross-site attacker can make the browser send the refresh cookie automatically,
but same-origin policy stops them from *reading* it to also set the matching header —
so a forged request is rejected with `403 EBADCSRFTOKEN`.

## WebSocket

`/ws` is a real-time channel secured with several independent layers — worth
understanding individually since WebSocket connections don't inherit the
browser protections HTTP requests get for free:

1. **Origin allowlisting on the handshake.** Unlike `fetch`/XHR, a WebSocket
   handshake is *not* subject to CORS or the same-origin policy — any page
   can open one to this server with the victim's cookies attached
   ("Cross-Site WebSocket Hijacking"). The `Origin` header is checked
   against the same allowlist as CORS *before* the handshake completes.
2. **Short-lived, single-use connection tickets** instead of a raw JWT in
   the query string (URLs leak into browser history, proxy logs, and
   Referer headers). Flow:
   ```bash
   # 1. Authenticated REST call — the JWT never touches a URL
   curl -X POST localhost:3000/api/v1/ws/ticket -H "Authorization: Bearer <accessToken>"
   # -> { "ticket": "...", "expiresIn": 15 }

   # 2. Connect immediately with the ticket
   wscat -c "ws://localhost:3000/ws?ticket=<ticket>" -H "Origin: http://localhost:5173"
   ```
   The ticket is deleted from Redis on first read — reused, expired, or
   forged tickets are all rejected with `401` before the handshake completes.
3. **Auth happens before the handshake, not after.** Invalid origin or
   ticket gets a plain HTTP `403`/`401` and the raw socket is destroyed —
   the client never gets a WebSocket connection to begin with.
4. **Per-connection message rate limiting**, independent of the HTTP rate
   limiter — a single long-lived connection can otherwise send unlimited
   messages.
5. **Bounded frame size** (`maxPayload`) enforced by the `ws` library itself.
6. **Heartbeat (ping/pong)** every 30s detects and terminates half-open
   connections that disappeared without a clean close.
7. **Server-side room authorization.** A connection auto-joins its own
   `user:<id>` room; subscribing to any other room (e.g. another user's, or
   an `admin:*` room without the admin role) is rejected — the client's
   requested room is never trusted blindly.

It's also wired into the same event bus that powers async order
processing (`src/events/listeners.js`) — `order.created` pushes a live
notification to the owning user's room, demonstrating the WS layer as just
another decoupled subscriber alongside the existing notification/inventory
listeners.

**TLS**: set `TLS_KEY_PATH`/`TLS_CERT_PATH` to serve `https://`/`wss://`
directly from this process. Left unset, the app assumes TLS is terminated
upstream (load balancer/ingress) — the more common production setup — and
speaks plain `http://`/`ws://` behind it.

A runnable end-to-end demo covering every check above (valid connect, ticket
reuse rejection, bad-origin rejection, room authorization, live push,
message-flood rate limiting) lives in `scripts/ws-test-client.js`:
```bash
node scripts/ws-test-client.js
```

## Notes on production-readiness

This is a teaching/reference implementation, not a deployable service as-is.
To take it further:

- Run MongoDB as a replica set and wrap multi-step writes (e.g. order creation's per-item stock decrement) in a real multi-document transaction — a standalone instance, used here for simplicity, can't do this
- Add a request-tracing/correlation-id middleware and ship logs to a real sink
- Swap the in-process `EventEmitter` for a real broker (SQS/RabbitMQ/Kafka) once listeners live in separate services
- Add automated tests (unit for services, integration for routes) and a CI pipeline
- Put JWT secrets and other config in a secrets manager (AWS Secrets Manager/Vault), not `.env`, in production
- Add refresh-token rotation/reuse detection for stronger session security
