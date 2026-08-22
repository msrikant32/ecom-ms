# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json ./
# No package-lock.json is committed yet, so `npm ci` (which requires one)
# isn't available - plain install until a lockfile exists.
RUN npm install

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time (see
# lib/config.ts) - must be supplied as a build ARG, not a runtime env var.
# Defaults to the host-published gateway port, matching local (non-Docker)
# dev exactly; override via docker-compose build.args for anything else.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
# next.config.ts sets output: "standalone" - .next/standalone is a pruned
# server bundle with its own minimal node_modules, so nothing from the
# `deps`/`builder` node_modules needs to be copied separately.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app

ENV PORT=3100
# standalone's server.js binds to this host - must be 0.0.0.0 to accept
# connections from outside the container (default is localhost-only).
ENV HOSTNAME=0.0.0.0
EXPOSE 3100

# API_INTERNAL_URL is read live from process.env at request time (it's not
# NEXT_PUBLIC_-prefixed, so Next never inlines it) - set at runtime by
# docker-compose, not baked in as a build ARG like NEXT_PUBLIC_API_BASE_URL.
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3100/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
