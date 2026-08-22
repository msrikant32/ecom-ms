# syntax=docker/dockerfile:1

# better-sqlite3 is a native module (node-gyp) - same reasoning as
# ecom-auth-service's bcrypt: build tools live only in this stage.
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
# No package-lock.json is committed yet, so `npm ci` (which requires one)
# isn't available - plain install until a lockfile exists.
RUN npm install --omit=dev

FROM node:22-slim
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# queue.js creates ./data/queue.db (better-sqlite3, WAL mode) on boot -
# pre-create it owned by the non-root user so it can also write into the
# data volume once one is mounted there (see docker-compose.yml).
RUN mkdir -p /app/data && chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3005

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3005/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
