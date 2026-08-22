# E-Commerce Microservices — Architecture (as built)

Stack per service: Node.js + Express, own MongoDB DB, own repo folder, own `package.json`.
Gateway: Express + `http-proxy-middleware`, JWT verify happens per-service (not at gateway - see Auth section).
Async: custom `event-bus` service (HTTP pub/sub + webhook fan-out). Swap for SQS/SNS at AWS deploy stage.

Local dev: no Docker. Each service runs as a plain `npm start` process against a shared local
MongoDB instance, one database per service. `cp .env.example .env` in each folder before first run.

**`manage-services.ps1`** (repo root) starts/stops/restarts/monitors all 9 backend services without
hand-running `npm start` in 9 terminals: `.\manage-services.ps1 start|stop|restart|status|logs
[service-name]`, `status -Watch` for a self-refreshing live view, `logs <name> -Follow` to tail one
service. Process identity is never tracked by a PID file — every operation looks up whatever's actually
listening on the service's port (`Get-NetTCPConnection`), so it's robust to however the process tree
was actually spawned and self-heals if a service was started outside the script entirely. Logs go to
`logs/<service>.log` at the repo root.

## Services

| Service | Port | Pattern | DB |
|---|---|---|---|
| `gateway` | 3000 | proxies public routes | none |
| `ecom-auth-service` | 3001 | REST | `ecom_auth` |
| `ecom-catalog-service` | 3002 | REST | `ecom_catalog` |
| `ecom-cart-service` | 3003 | REST (sync calls catalog) | `ecom_cart` |
| `ecom-order-service` | 3004 | REST + orchestrator | `ecom_order` |
| `event-bus` | 3005 | HTTP pub/sub, webhook fan-out | none (in-memory) |
| `ecom-payment-service` | 3006 | **REST, synchronous** | `ecom_payment` |
| `ecom-inventory-service` | 3007 | **event-driven** (webhook subscriber) | `ecom_inventory` |
| `ecom-notification-service` | 3008 | **event-driven** (webhook subscriber) | `ecom_notification` |

### gateway
- Routes `/api/v1/auth/*`, `/api/v1/products/*`, `/api/v1/categories/*`, `/api/v1/cart/*`, `/api/v1/orders/*` to their service
- `pathRewrite: (path, req) => req.originalUrl` on every proxy - `app.use(prefix, ...)` strips the prefix from `req.url` before `http-proxy-middleware` v3 ever sees it, so this restores the full path. (Real bug hit and fixed during build.)
- No JWT verification here - each downstream service verifies independently (see Auth below). Gateway only does routing, CORS, helmet, rate limiting.
- `payment-service`, `event-bus`, `inventory-service`, `notification-service` are **not** routed through the gateway - they're internal-only, called service-to-service.

### ecom-auth-service
- DB: `auth_db` — users, passwords (bcrypt), refresh token version
- Endpoints: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /logout-all`, `GET /me`
- Issues JWT access token (15m) + refresh token (7d, httpOnly cookie)

### ecom-catalog-service
- DB: `catalog_db` — products, categories, reviews
- Endpoints: `GET/POST /products`, `PATCH/DELETE /products/:id` (admin), `GET/POST /categories` (admin)
- Text search via Mongo text index (`q` param), offset pagination, price/category/rating filters
- Verifies JWT locally (shared `JWT_ACCESS_SECRET`, no network call to auth-service)
- **Reviews & ratings** (`GET/POST /products/:id/reviews`, `DELETE /products/:id/reviews/:reviewId`): any authenticated user may post one review per product — a repeat `POST` upserts their existing review rather than creating a duplicate (unique `(productId, userId)` index). No purchase verification — that would need a sync call out to order-service, which catalog-service doesn't otherwise depend on, so it was left out deliberately rather than added as unscoped coupling. `Product.avgRating`/`reviewCount` are denormalized and re-aggregated from the `Review` collection on every write/delete, powering the `minRating` product-list filter without per-request aggregation.

### ecom-cart-service
- DB: `cart_db` — one cart doc per user
- Endpoints: `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId`, `DELETE /cart`
- Sync REST call to catalog-service on add-to-cart: validates product is active/in-stock, snapshots current name+price into the cart item (checkout later uses this snapshot, not a live re-fetch)

### ecom-order-service
- DB: `order_db` — orders, line items, shipping address, status. Order stores `userEmail` (denormalized at checkout time) so any later async or admin-triggered action — cancellation, in particular — can always email the actual customer, not whoever happens to be the acting user.
- Endpoints: `POST /orders` (checkout), `GET /orders`, `GET /orders/:id` (owner-or-admin), `PATCH /orders/:id/status` (admin), `POST /orders/:id/cancel` (owner-or-admin)
- **Checkout orchestration** (`orderService.checkout`):
  1. Sync call → cart-service: fetch cart (forwards caller's own bearer token - no shared session between services)
  2. Create order, `status: pending`
  3. **Sync call → payment-service**: charge, wait for accept/decline
  4. Update order status to `paid` or `failed`
  5. If paid: sync call → cart-service to clear cart, then **fire-and-forget publish** `order.paid` to event-bus
  6. If failed: cart is left alone (so the user can retry checkout), **fire-and-forget publish** `order.failed`
- **Cancellation** (`orderService.cancelOrder`): only orders in `paid` status are cancellable — `pending`/`failed` never reserved stock or held a charge, and `shipped`/`delivered` would need a returns/RMA flow instead. Owner or admin only (same ownership check as `getById`).
  1. **Sync call → payment-service**: refund, wait for confirmation (idempotent - a retried cancel reuses the first refund instead of refunding twice)
  2. Update order status to `cancelled`
  3. **Fire-and-forget publish** `order.cancelled` to event-bus (using `order.userEmail`, not the caller's email, so an admin cancelling on a customer's behalf still notifies the customer)

### event-bus — durable SQLite-backed message queue (SQS-style, not push webhooks)
Rebuilt from a push/webhook fan-out into a real pull-based queue engine, because push delivery has no durability — if event-bus or a subscriber was down, the message was just gone. This is closer to how SQS actually behaves.

- **Storage**: `better-sqlite3`, one `messages` table (`data/queue.db`), survives process restarts
- **Producer**: `POST /api/v1/events/:eventName` — same call order-service always made, but now writes durable rows instead of firing HTTP webhooks. Fans out to every queue configured for that event (`EVENT_QUEUES` env var), mirroring an SNS topic with multiple SQS subscriptions — one event, several independent queues, each consumed at its own pace
- **Consumer** (pull-based): `POST /api/v1/queues/:queueName/receive` — a message becomes `in_flight` and invisible to other receivers for a visibility timeout (default 30s); `DELETE /api/v1/queues/:queueName/messages/:receiptHandle` acks it (removes the row). Not acking within the timeout makes it visible again — automatic redelivery, no code needed for that path
- **Dead-letter**: after `max_attempts` (default 5) redeliveries without an ack, the next receive dead-letters it instead of handing it out again (`GET /api/v1/queues/:queueName/dlq` to inspect)
- **Ops visibility**: `GET /api/v1/stats` — message counts per queue/status
- All routes gated by `X-Internal-Secret` (`INTERNAL_SECRET`, shared with every publisher/consumer) — internal-only, never routed through the gateway

Queues in use: `order-paid-inventory`, `order-paid-notification`, `order-failed-notification`, `order-cancelled-inventory`, `order-cancelled-notification`.

### ecom-payment-service — REST, synchronous
- DB: `payment_db` — payment records (audit trail), keyed by `orderId` (idempotent: repeat charge call for the same order reuses the first result)
- `POST /payments/charge` — order-service calls this directly and blocks on the response, because checkout needs an immediate accept/decline to show the user
- `POST /payments/order/:orderId/refund` — order-service calls this from cancellation, also synchronous and idempotent (a payment already refunded just returns the existing record). Only a `succeeded` payment can be refunded. Refunding does **not** flip `status` away from `succeeded` — that field records the original charge outcome; `refundRef`/`refundedAt` (both null until refunded) record the refund separately, keeping the audit trail intact.
- `mockGateway.js`: deterministic stand-in for Stripe/Razorpay. **Any amount ending in exactly `.13` (cents === 13) is declined**; everything else succeeds. `refund()` always succeeds — the mock has no decline path for it. Swap this module for a real SDK later — nothing else in the service changes.
- No card data ever touches this DB — mock gateway returns a `gatewayRef` only (keeps PCI scope low, same principle a real integration would follow)

### ecom-inventory-service — event-driven (queue consumer)
- DB: `inventory_db` — one stock record per product, seeded on first sighting by a live lookup to catalog-service
- `src/worker.js` polls two queues in parallel every 3s (`WORKER_POLL_INTERVAL_MS`): `order-paid-inventory` decrements stock (`reserveForOrder`), `order-cancelled-inventory` restores it (`restoreForOrder`) — both ack on success. Starts alongside the HTTP server in `server.js`, stops cleanly on `SIGINT`/`SIGTERM`.
- `GET /api/v1/inventory/:productId` (admin, JWT) — read current stock for debugging/audit
- Never polls `order-failed-*` — a declined payment never reserves/decrements stock

### ecom-notification-service — event-driven (queue consumer)
- DB: `notification_db` — `NotificationLog` audit trail (no real email sending — `mailer.js` logs instead of calling SES/SMTP)
- `src/worker.js` polls **three** queues in parallel each tick: `order-paid-notification` (confirmation email), `order-failed-notification` (failure email), `order-cancelled-notification` (cancellation email)
- `GET /api/v1/notifications`, `GET /api/v1/notifications/order/:orderId` (admin, JWT) — audit view

## Auth model across services
- `auth-service` is the only service that *issues* JWTs (access + refresh)
- Every other service (catalog, cart, order, payment, inventory, notification) *verifies* access tokens locally against the same `JWT_ACCESS_SECRET` — no network round-trip to auth-service per request
- Service-to-service calls that need to act "as the user" (cart→catalog is anonymous; order→cart, order→payment) forward the caller's own bearer token rather than using a shared service account or session
- Calls to event-bus (publish, receive, ack — from order-service, inventory-service, notification-service) use a separate shared secret (`INTERNAL_SECRET`), not JWT — internal service traffic, never an end user

## Observability — metrics
Every service (gateway included) exposes `GET /metrics` in Prometheus text format via `prom-client` —
not gateway-proxied, scraped directly per service, same access pattern as `/health`. Three custom
instruments per service, all labeled `{method, route, status_code}`: `http_requests_total` (count),
`http_request_duration_seconds` (latency histogram), `http_errors_total` (count where `status_code >=
400`) — directly satisfying NFR16. `collectDefaultMetrics` adds free process-level metrics (CPU, RSS,
event-loop lag, GC) on top. Route labels normalize id-shaped path segments (Mongo ObjectIds, UUIDs,
plain numbers) to `:id` so per-entity traffic doesn't explode into one Prometheus time series per id.

**Real bug found and fixed while building this**: the route label was originally read from `req.path`
*inside* the `res.on('finish')` callback. Express only restores a nested router's mount-prefix-stripped
`req.url` when a request propagates via `next()` — a route that terminates the response directly (a
plain `res.json(...)`, the normal success path) never triggers that restore. A successful `GET
/api/v1/products/:id` was therefore recording under route `/:id` (prefix silently dropped) while the
identical-shaped 404 case — which propagates via `next(err)` to the top-level error handler, triggering
the restore — correctly recorded `/api/v1/products/:id`. Same endpoint, two labels. Fixed by capturing
the normalized route into a local variable at middleware-entry time, before any nested router gets a
chance to mutate `req.url`, instead of re-reading `req.path` lazily at finish time. Confirmed fixed by
generating a success and a 404 against the same route and checking they now share one label, differing
only by `status_code`.

## Observability — correlation IDs
Every service (gateway included) mounts a `correlationId` middleware first, before helmet/cors/routes.
It reuses an inbound `X-Correlation-Id` header if present, otherwise mints a `crypto.randomUUID()`, and
echoes it back as a response header either way. The id is stashed in an `AsyncLocalStorage` inside
`config/logger.js` (not on `req` alone), so every `logger.info/warn/error` call for the life of that
request - or that queue message - includes `correlationId` automatically, with no need to thread an id
through every function signature by hand.

Propagation:
- **Gateway → service**: the gateway either passes through or mints the id before the proxy ever runs, so `http-proxy-middleware` forwards it as an ordinary header - no proxy config needed.
- **Service → service (sync)**: every outbound `fetch` (cartClient, paymentClient, catalogClient, eventBusClient, queueClient) adds the header via `logger.correlationHeaders()`, which spreads to `{}` outside of any request context instead of sending the literal string `"undefined"`.
- **Service → event-bus → worker (async)**: `eventBusClient.publish` embeds `correlationId` *inside the message payload itself*, not just the header - the header doesn't survive a message sitting in the queue, but the payload does. `inventory-service`/`notification-service` workers read `message.payload.correlationId` and re-enter that same trace via `logger.runWithCorrelationId(...)` before processing, so a worker log line minutes after checkout still carries the id that started at the gateway.

Verified: an unheadered request gets a fresh id back on `/health`; a client-supplied id round-trips through gateway → auth/cart/order (sync) and is echoed by every service's `/health`; the same id shows up in event-bus's `event.published` log and in both `order-paid-*` and `order-cancelled-*` worker logs (`worker.processing`, `mailer.send`, `worker.acked`) for a full checkout-then-cancel run.

## Event flow (checkout, as built)
```
client → gateway → order-service: POST /orders
order-service:
  1. cart-service: GET /cart (sync, forwarded bearer token)
  2. create Order (status=pending)
  3. payment-service: POST /payments/charge (sync, blocks) ──► mock gateway decides accept/decline
  4. update Order.status = paid | failed
  5a. if paid:  cart-service: DELETE /cart (sync)
               event-bus: publish "order.paid"   (fire-and-forget, durable once accepted)
  5b. if failed: event-bus: publish "order.failed" (fire-and-forget)   [cart left untouched]

event-bus enqueues into every queue subscribed to that event - independent of the
order-service response already sent to the client. Consumers pull on their own schedule:
  order-paid-inventory     ← inventory-service polls every 3s   (decrement stock)
  order-paid-notification  ← notification-service polls every 3s (confirmation email)
  order-failed-notification ← notification-service polls every 3s (failure email)

A message that fails processing is simply not acked - it reappears after the visibility
timeout and gets redelivered, up to max_attempts, then lands in that queue's DLQ.
```

## Cancellation flow (as built)
```
client → gateway → order-service: POST /orders/:id/cancel   (owner or admin only)
order-service (only if order.status === "paid"):
  1. payment-service: POST /payments/order/:orderId/refund (sync, blocks, idempotent)
  2. update Order.status = cancelled
  3. event-bus: publish "order.cancelled" (fire-and-forget, durable once accepted)
     - payload uses Order.userEmail, not the caller's email, so an admin
       cancelling on a customer's behalf still notifies the right person

order-cancelled-inventory     ← inventory-service polls every 3s (restore stock)
order-cancelled-notification  ← notification-service polls every 3s (cancellation email)

pending/failed orders can't be cancelled (nothing was ever reserved/charged to
undo); shipped/delivered orders can't either (that needs a returns/RMA flow,
not built).
```

## Verified end-to-end (local, no Docker)
- Full checkout success path: register → browse → cart → checkout → payment succeeds → order `paid` → cart cleared → inventory auto-decremented → confirmation email logged — all through the gateway
- Decline path: price ending in `.13` → order `failed` → cart preserved for retry → inventory untouched → failure email logged
- Cross-service JWT verification (shared secret, no auth-service round-trip)
- Gateway path-forwarding bug (http-proxy-middleware v3 stripping mount prefix) found and fixed
- Queue mechanics tested directly: publish fans out to independent queues; a received message is invisible to a concurrent receive; ack removes it; an unacked message redelivers with a fresh receipt handle on every attempt; after 5 redeliveries it's dead-lettered — all confirmed via curl before wiring any consumer to it
- Full checkout re-verified against the new queue system (both success and decline paths) with fresh `.env` files loaded, not just fallback defaults
- Cancellation flow verified end-to-end through the gateway: paid order → cancel → payment refunded (`refundedAt`/`refundRef` set, `status` stays `succeeded`) → stock restored to its pre-order level → cancellation email logged to the order's actual owner. Also verified: re-cancelling an already-cancelled order is rejected (400), cancelling a `failed` order is rejected (400), a non-owner/non-admin cancel attempt is rejected (404), and an admin cancelling another user's order still emails that user (not the admin) — confirmed by checking `NotificationLog.recipient` directly. No dead-lettered messages on either new queue after the run.
- Correlation-ID tracing verified: an unheadered request gets a fresh id minted at the gateway; a client-supplied id round-trips through all 9 services' `/health`; the same id was traced through a full checkout-then-cancel run across event-bus's publish log and both inventory/notification workers' `worker.processing`/`mailer.send`/`worker.acked` lines.
- Reviews & ratings verified: posting a review updates `Product.avgRating`/`reviewCount`; a repeat post from the same user upserts in place (same review id, no duplicate) and the aggregate recalculates correctly (5★+3★→avg 4, then one changed to 2★→avg 2.5); `minRating` product-list filter correctly includes/excludes based on the recalculated average; deleting a review re-aggregates down to the remaining reviews; unauthenticated review attempts rejected (401); deleting someone else's review rejected (404).
- Metrics verified: `/metrics` returns Prometheus text format with default process metrics plus the three custom instruments; real traffic through the gateway populates `http_requests_total`/`http_request_duration_seconds`/`http_errors_total` with correctly normalized route labels (24-hex ids collapsed to `:id`); the route-label bug (success vs. error responses to the same endpoint recording under different labels) was caught and fixed by direct before/after comparison, then re-verified with a fresh success+404 pair sharing one label.

## ecom-web (frontend) — port 3100
Next.js 16, App Router, TypeScript, Tailwind. Talks only to the gateway (`NEXT_PUBLIC_API_BASE_URL`).

- `/` — Server Component, SSR product grid (`GET /products`, no-store)
- `/products/[slug]` — Server Component, catalog now resolves either a slug or a Mongo id at the same endpoint (`getByIdOrSlug`, added during frontend build — the original `getById` only took a Mongo id, which doesn't make an SEO-friendly product URL); `notFound()` on miss
- `/login`, `/signup` — Client Components, call auth-service directly via the gateway
- `/cart`, `/checkout`, `/orders`, `/orders/[id]` — Client Components, authenticated via `authFetch`

**Auth model in the frontend**: session (`user` + access token) lives in `localStorage`, read through `useSyncExternalStore` (not `useState`+`useEffect`) so the server-rendered HTML and the first client render agree — reading `localStorage` directly in an effect would setState after hydration and either flash content or, worse, get flagged/racy under React's stricter `no-set-state-in-effect` rules. `authFetch()` centralizes the pattern every protected page uses: attach the bearer token, and on a `401` transparently call `POST /auth/refresh` (httpOnly cookie, verified working *through* the gateway proxy specifically before this was built) and retry once before giving up.

Checkout UX: since `POST /orders` always returns `201` regardless of payment outcome (the order record itself is always created), the frontend branches on `order.status`, not HTTP status — `paid` redirects to the order page, `failed` shows an inline decline message and leaves the cart intact (matching order-service's actual behavior).

Verified: `tsc --noEmit` clean, `eslint` clean, `next build` succeeds (all 9 routes compile/prerender), SSR output checked via curl (home page renders real product data, detail page resolves by slug, 404s correctly on an unknown slug), and the full signup → add-to-cart → update-quantity → checkout → order-detail → order-list request sequence replayed through the gateway with the frontend's exact header/body shapes — every response matched the TypeScript types exactly.

**Not verified**: actual in-browser interaction (clicking, form submission, hydration behavior, visual layout) — no browser automation tool is available in this environment. Manual click-through in a real browser is still recommended before considering the frontend done. This applies in particular to guest cart persistence below, which is entirely localStorage-driven and so can't be exercised via curl.

## Guest cart persistence (FR9)
Entirely client-side — no cart-service changes, no guest id issued or stored anywhere server-side. Keeps NFR13 (stateless services) intact and avoids opening any unauthenticated write path on cart-service.

- `lib/guest-cart.ts`: a second `localStorage`-backed store (key `ecom_guest_cart`), same `subscribe/getSnapshot/getServerSnapshot` shape as `auth-context.tsx`'s session store, read via `useSyncExternalStore` from `CartProvider`. Holds plain `CartItem[]` (productId/name/priceCents/quantity, same shape the server cart returns) and mirrors cart-service's own add-item semantics: re-adding an existing product increments quantity and refreshes the price/name snapshot rather than duplicating the line.
- `cart-context.tsx`: `cart` is now derived from the server cart when `user` is present, or from the guest store when not — same `Cart` shape either way (`_id: "guest"` for the guest case), so every consumer (`Header`, `/cart`, `AddToCartButton`) reads one `cart`/`itemCount` regardless of auth state. `addItem`/`updateItemQuantity`/`removeItem` branch internally instead of callers checking `user` themselves.
- **Merge on login**: a `useRef`-tracked login-transition effect POSTs each guest item to `/api/v1/cart/items` (reusing cart-service's existing merge/stock-validation logic, nothing new added there) then clears the guest store. The guest store is cleared *before* the async POST loop, not after — React StrictMode double-invokes effects in dev with no `await` between the two invocations, so clearing late would let both invocations read the same still-present items and double-post every quantity.
- `AddToCartButton` no longer redirects unauthenticated users to `/login` — it calls `addItem` for both guest and authed users, now takes `name`/`priceCents` props (needed to write a full snapshot into the guest store) instead of just `productId`/`stock`.
- `/cart` no longer redirects a logged-out visitor away; it shows their guest cart with a "Log in to check out" prompt instead. `/login` and `/signup` accept a `?next=` param (round-tripped between the two, and set by `/cart` and `/checkout`'s own auth-required redirect) so completing auth returns the visitor to checkout instead of dropping them on `/`.

## Admin UI — `/admin/*` in ecom-web
Client-rendered, gated by `AdminLayout` (redirects non-admins/unauthenticated to `/` or `/login`).

- `/admin/products` — list including inactive (see catalog fix below), create/edit/deactivate
- `/admin/products/new`, `/admin/products/[id]/edit` — shared `ProductForm` component
- `/admin/categories` — list + create
- `/admin/orders` — list **all** orders (not scoped to caller), filter by status
- `/admin/orders/[id]` — detail + status dropdown (`PATCH /orders/:id/status`)

**Two backend gaps found and fixed while building this:**
1. `order-service`'s `GET /orders` was always scoped to the caller's own orders — no way for an admin to see everyone's orders. Added `GET /orders/admin` (admin-only, optional `?status=` filter), registered *before* `/:id` in the router (Express route order matters — otherwise `"admin"` would've matched as an order id).
2. `catalog-service`'s product list always filtered `isActive: true`, hiding deactivated products even from admins managing the catalog. Added `optionalAuthenticate` middleware (attaches `req.user` if a valid token is present, never fails the request) on the product list route, plus an `includeInactive=true` query param that only takes effect for an authenticated admin. Also tightened `PATCH /products/:id` to validate its body (previously accepted anything unvalidated).

Verified: both fixes tested directly (admin sees cross-user orders, non-admin gets 403 on `/orders/admin` and is silently ignored on `includeInactive`, deactivated products disappear from the public list but stay visible to admins), then the full admin browser flow replayed end-to-end through the gateway — category create → product create → product edit → customer checkout → admin order list filtered by status → status update to `shipped` — matching the frontend's exact request/response shapes.

## Deployment — local containers
Dockerfiles + `docker-compose.yml` only, scoped deliberately: no ECR/ECS/Fargate IaC (no AWS
credentials available to apply or verify it against) and no GitHub Actions CI (none of these
folders are a git repo yet, let alone one with a GitHub remote — a prerequisite, not something
to bolt on unasked). `docker compose up --build` reproduces the exact stack
`manage-services.ps1`/`manage-web.ps1` run locally, same 9 backend services + `ecom-web` on the
same ports (3000-3008, 3100) — **not** the unrelated `web` app, which isn't part of this system.

- Each service gets its own multi-stage `Dockerfile` (`node:22-slim`, non-root user, `HEALTHCHECK`
  via Node's own `http` module — no curl/wget in a slim image). `ecom-auth-service` (bcrypt) and
  `event-bus` (better-sqlite3) get a build-tools stage (python3/make/g++) for their native modules,
  discarded before the final image; every other backend service skips it. None of these folders
  have a committed `package-lock.json`, so every Dockerfile uses `npm install --omit=dev` rather
  than `npm ci` (which requires one) — worth generating a lockfile before this goes further.
- `ecom-web` gets a three-stage build (`deps` → `builder` → `runner`) using Next's `output:
  "standalone"` (added to `next.config.ts` for this). `NEXT_PUBLIC_API_BASE_URL` is a build ARG
  (inlined into the client bundle, so it must be known at image-build time) while a new
  server-only `API_INTERNAL_URL` (`lib/config.ts`) is a runtime env var read fresh per-request —
  needed because the browser reaches the gateway via its published `localhost:3000`, but SSR
  fetches running *inside* the `ecom-web` container need the gateway's Docker network hostname
  (`http://gateway:3000`) instead. `api.ts`'s server-only fetches (`getProducts`/`getProduct`/
  `getCategories`) use `API_INTERNAL_URL`; anything rendered into HTML for the browser to fetch
  itself (product images) still uses the public `API_BASE_URL`.
- `docker-compose.yml`: one `mongo:7` container (single instance, multiple DB names, matching the
  current local-dev Mongo setup) plus named volumes for `mongo-data`, `catalog-uploads` (multer's
  disk storage — would otherwise vanish on every image rebuild), and `event-bus-data` (the SQLite
  queue file). Shared secrets (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`INTERNAL_SECRET`) come
  from a root `.env` (`cp .env.docker.example .env` first — compose auto-loads a file literally
  named `.env`), interpolated once instead of repeated per service.
- **Not verified**: Docker isn't installed in this environment, so `docker compose up --build`
  itself hasn't been run. What *was* checked: the compose YAML parses correctly and matches the
  intended shape (11 services, 3 volumes, 1 network, `EVENT_QUEUES`' embedded JSON parses), and
  every Dockerfile's `CMD`/entrypoint path exists on disk. An actual `docker compose up --build`
  end-to-end run is still needed before trusting this beyond "should work."

## Not built yet
- Multi-vendor layer (seller onboarding, order splitting, commission) — deferred per REQUIREMENTS.md scope note
- Log aggregation — logs are structured JSON with correlation ids and metrics are scraped-ready (see Observability above), but nothing ships logs anywhere (no ELK/Loki/CloudWatch); deliberately not faked locally, since picking a backend is a deployment-time decision
- Redis caching for hot catalog reads (NFR9)
- Secrets Manager (NFR6) — still plain `.env` files, reasonable until actual AWS deployment
- ECR/ECS/Fargate IaC and GitHub Actions CI — see "Deployment — local containers" above for why these specifically are still out
