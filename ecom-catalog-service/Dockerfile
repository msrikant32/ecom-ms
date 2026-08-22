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
# uploadService writes here (multer diskStorage) - created ahead of time so
# it exists even before the uploads volume is first mounted, and owned by
# the non-root user so it can write into the mounted volume too.
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3002/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
