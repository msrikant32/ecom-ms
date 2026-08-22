# ecom-ms — E-Commerce Microservices Platform

A small-scale e-commerce marketplace built as 9 independent Node.js/Express
microservices (each with its own MongoDB database), an API gateway, a
durable event-bus (SQS-style pull queues), and a Next.js storefront.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the as-built system design,
[`REQUIREMENTS.md`](REQUIREMENTS.md) for functional/non-functional scope,
and [`HLD.md`](HLD.md) / [`LLD.md`](LLD.md) for the high/low-level design.

> **Note:** this folder also contains `web/` and `express-production-api/` —
> unrelated standalone learning projects, not part of the ecom-ms system.

## Services

| Service | Port | Pattern | DB |
|---|---|---|---|
| `gateway` | 3000 | proxies public routes | none |
| `ecom-auth-service` | 3001 | REST | `ecom_auth` |
| `ecom-catalog-service` | 3002 | REST | `ecom_catalog` |
| `ecom-cart-service` | 3003 | REST (sync calls catalog) | `ecom_cart` |
| `ecom-order-service` | 3004 | REST + orchestrator | `ecom_order` |
| `event-bus` | 3005 | durable pull queue (SQS-style) | none (SQLite) |
| `ecom-payment-service` | 3006 | REST, synchronous | `ecom_payment` |
| `ecom-inventory-service` | 3007 | event-driven (queue consumer) | `ecom_inventory` |
| `ecom-notification-service` | 3008 | event-driven (queue consumer) | `ecom_notification` |
| `ecom-web` | 3100 | Next.js storefront | — |

Only `auth`, `catalog`, `cart`, and `order` are routed through the gateway.
`payment`, `event-bus`, `inventory`, and `notification` are internal-only,
called service-to-service.

## Getting started

Each service needs its own `.env` (never committed — see `.gitignore`):

```bash
# in every service folder (ecom-*-service, event-bus, gateway, ecom-web)
cp .env.example .env        # ecom-web uses .env.local.example → .env.local
npm install
```

You'll also need a local MongoDB instance running on `mongodb://127.0.0.1:27017`
(one database per service, created automatically on first write).

### Option A — run everything with the helper scripts (no Docker)

```powershell
.\manage-services.ps1 start           # starts all 9 backend services
.\manage-services.ps1 status -Watch   # live status view
.\manage-services.ps1 logs gateway -Follow
.\manage-services.ps1 stop            # stop everything

.\manage-web.ps1 start                # starts ecom-web on :3100
```

Logs land in `logs/<service>.log` at the repo root.

### Option B — Docker Compose

```bash
cp .env.docker.example .env   # shared JWT/internal secrets, root of repo
docker compose up --build
```

Brings up all 9 backend services + `ecom-web` + a shared `mongo:7` container
on the same ports as above.

Then visit the storefront at **http://localhost:3100** (or hit the API
directly through the gateway at **http://localhost:3000**).

## Key flows

- **Checkout**: gateway → order-service orchestrates cart-service (fetch)
  → payment-service (sync charge) → cart-service (clear) → event-bus
  (`order.paid`/`order.failed`, fire-and-forget) → inventory-service and
  notification-service consume asynchronously via polling queues.
- **Cancellation**: order-service → payment-service (refund) → event-bus
  (`order.cancelled`) → inventory restored, cancellation email logged.

Full detail, including auth model, observability (Prometheus `/metrics`,
correlation IDs), and what's verified vs. not built yet, is in
[`ARCHITECTURE.md`](ARCHITECTURE.md).
