# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
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
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3004

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3004/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
