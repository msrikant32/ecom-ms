# E-Commerce Marketplace — Requirements

## Scope note
Multi-vendor picked + "small scale" picked together. Multi-vendor add real complexity
(seller onboarding, per-seller catalog/order split, commission calc, payout).
Recommend: build core single-store flow first, add multi-vendor layer second phase.
Flag below where multi-vendor touch a service.

## Functional Requirements

### Buyer
- FR1: Browse products by category
- FR2: Search products (text search, filter by price/category/rating)
- FR3: View product detail page (images, price, stock, seller)
- FR4: Add/remove/update items in cart
- FR5: Checkout — address entry, order summary, place order
- FR6: Payment — pay via gateway (Stripe/Razorpay), handle success/failure/webhook
- FR7: Signup/login (email+password, JWT session)
- FR8: View order history, order status per order
- FR9: Guest cart persist across session (optional, phase 2)

### Seller/Admin
- FR10: Admin — CRUD product (create/edit/delete/list), manage stock count
- FR11: Admin — view all orders, update order status (placed → shipped → delivered), issue refund
- FR12: Multi-vendor — seller signup/onboarding, seller-scoped product management
- FR13: Multi-vendor — order auto-split by seller when cart has mixed sellers
- FR14: Multi-vendor — commission/payout tracking per seller (phase 2, defer)

### System
- FR15: Inventory decrement on order placed, restore on cancel
- FR16: Notification on order events (email — placed, shipped, payment failed)
- FR17: Event flow: order.placed → payment.charge → inventory.reserve → notification.send

## Non-Functional Requirements

### Security
- NFR1: JWT auth, short-lived access token + refresh token
- NFR2: Password hash via bcrypt, never log/store plaintext
- NFR3: HTTPS only (ALB terminate TLS)
- NFR4: Input validation every service boundary (reject at gateway + service level)
- NFR5: Payment data never touch our DB — gateway tokenized checkout only (PCI scope stay low)
- NFR6: Secrets (DB URI, JWT key, gateway key) in AWS Secrets Manager, not `.env` committed
- NFR7: Rate limit auth endpoints (brute-force guard)

### Performance
- NFR8: Product listing/search response under ~300ms p95
- NFR9: Cache hot catalog reads (Redis) to cut DB load
- NFR10: Static assets/images via CDN (CloudFront)

### Scalability
- NFR11: Each service independently scalable (ECS Fargate auto-scale by CPU/queue depth)
- NFR12: Async event flow (SQS/SNS) decouple order/payment/inventory/notification — no direct blocking calls chain
- NFR13: Stateless services (session in JWT, not server memory) — any instance handle any request

### Observability
- NFR14: Centralized logs (CloudWatch), structured JSON log per service
- NFR15: Health check endpoint per service (`/health`) for ECS + ALB
- NFR16: Basic metrics — request count/latency/error rate per service
- NFR17: Correlation ID passed through request chain (trace one order across services)

### Cost/Ops (given "small scale" pick)
- NFR18: Fargate min task count 1 per service, no idle EC2
- NFR19: MongoDB Atlas free/shared tier acceptable start
- NFR20: Design must not block later scale-up — no hardcoded assumption of single instance
